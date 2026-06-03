import { FirecrawlAccess, WorkflowBudget, WorkflowMode } from './workflows';

export type { FirecrawlAccess, WorkflowBudget, WorkflowMode };

export type AiWorkflowRequest = {
  url: string;
  tool_type: string;
  workflow_id: string;
  mode: WorkflowMode;
  firecrawl_access: FirecrawlAccess;
  budget: WorkflowBudget;
  payload: Record<string, unknown>;
  task_id?: string | null;
  user_id?: string | null;
  model?: string;
};

export type AiWorkflowResult = {
  summary: string;
  data: Record<string, unknown>;
  tokens: number;
  toolCalls: number;
};

const DEFAULT_AI_SERVICE_URL = 'http://localhost:8081';

export async function runAiWorkflow(
  request: AiWorkflowRequest,
  timeoutMs = 900000
): Promise<AiWorkflowResult> {
  const aiServiceUrl = (process.env.AI_SERVICE_URL || DEFAULT_AI_SERVICE_URL).replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let summary = '';
  let data: Record<string, unknown> = {};
  let tokens = 0;
  let toolCalls = 0;
  let receivedResult = false;
  const streamErrors: string[] = [];

  try {
    console.log(`\n--- [MAS WORKFLOW START: ${request.task_id || 'no-task'}] ---`);

    const masResponse = await fetch(`${aiServiceUrl}/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(request),
    });

    if (!masResponse.ok) {
      throw new Error(`MAS Service failed: ${masResponse.status} ${masResponse.statusText}`);
    }

    const reader = masResponse.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('MAS Service returned an empty response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event = JSON.parse(line);

          switch (event.type) {
            case 'log':
              console.log(` [XENIA:SYSTEM] ${event.content}`);
              break;
            case 'thought':
              process.stdout.write(` [XENIA:${event.agent}] Thought: ${event.content}`);
              break;
            case 'tool_call':
              toolCalls += 1;
              console.log(`\n [XENIA:${event.agent}] CALLING TOOL: ${event.tool}`);
              console.log(` [XENIA:ARGS] ${JSON.stringify(event.args, null, 2)}`);
              break;
            case 'step_complete':
              console.log(`\n [XENIA:${event.agent}] STEP COMPLETE`);
              console.log(` [XENIA:OUTPUT] ${JSON.stringify(event.output, null, 2).substring(0, 1000)}...`);
              break;
            case 'usage':
              tokens = Number(event.total || tokens);
              console.log(` [XENIA:USAGE] Turn: ${event.turn_tokens} | Total: ${event.total} (P: ${event.prompt}, C: ${event.completion})`);
              break;
            case 'result':
              receivedResult = true;
              summary = event.content?.summary || '';
              data = event.content?.data || {};
              tokens = Number(event.content?.tokens || tokens);
              console.log(`\n [XENIA:DELIVERABLE] Summary Length: ${summary.length} chars`);
              break;
            case 'error':
              streamErrors.push(String(event.content || 'Unknown AI service stream error'));
              console.error(`\n [XENIA:CRITICAL] ${event.content}`);
              break;
          }
        } catch {
          // Ignore parse errors from partial or malformed stream chunks.
        }
      }
    }

    console.log(`--- [MAS WORKFLOW COMPLETE: ${request.task_id || 'no-task'}] ---\n`);

    if (!receivedResult) {
      throw new Error(streamErrors[0] || 'MAS Service completed without a result event');
    }

    if (!summary.trim()) {
      throw new Error(streamErrors[0] || 'MAS Service returned an empty document summary');
    }

    return { summary, data, tokens, toolCalls };
  } finally {
    clearTimeout(timeoutId);
  }
}
