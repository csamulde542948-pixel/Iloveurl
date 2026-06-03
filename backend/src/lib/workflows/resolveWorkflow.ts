import { workflowDefinitions } from './definitions';
import { ResolvedWorkflow } from './types';

type ResolveWorkflowOptions = {
  workflowId: string;
  requestedMode?: unknown;
};

export function resolveWorkflow(options: ResolveWorkflowOptions): ResolvedWorkflow {
  const definition = workflowDefinitions[options.workflowId];

  if (!definition) {
    throw new Error(`Unknown workflow: ${options.workflowId}`);
  }

  // Mode selection is paused for launch stability. Keep definitions ready, but always run the default mode.
  const mode = definition.defaultMode;
  const policy = definition.modePolicies[mode];

  return {
    id: definition.id,
    toolType: definition.toolType,
    mode,
    modelPolicy: policy.modelPolicy,
    firecrawlAccess: policy.firecrawlAccess,
    budget: policy.budget,
  };
}
