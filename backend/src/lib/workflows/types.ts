export type WorkflowMode = 'quick' | 'standard' | 'deep';
export type FirecrawlAccess = 'disabled' | 'limited' | 'full_deep';
export type WorkflowModelPolicy = 'quick' | 'standard' | 'premium';

export type WorkflowBudget = {
  maxScrapes?: number;
  maxMaps?: number;
  maxCrawls?: number;
  maxExtracts?: number;
  maxScreenshots?: number;
  maxInputChars?: number;
  maxOutputWords?: number;
  maxModelSteps?: number;
};

export type WorkflowModePolicy = {
  modelPolicy: WorkflowModelPolicy;
  firecrawlAccess: FirecrawlAccess;
  budget: WorkflowBudget;
};

export type WorkflowDefinition = {
  id: string;
  toolType: string;
  defaultMode: WorkflowMode;
  allowedModes: WorkflowMode[];
  modePolicies: Record<WorkflowMode, WorkflowModePolicy>;
};

export type ResolvedWorkflow = {
  id: string;
  toolType: string;
  mode: WorkflowMode;
  modelPolicy: WorkflowModelPolicy;
  firecrawlAccess: FirecrawlAccess;
  budget: WorkflowBudget;
};
