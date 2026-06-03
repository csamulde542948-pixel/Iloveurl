import { WorkflowBudget, WorkflowDefinition } from './types';

const brandStandardBudget: WorkflowBudget = {
  maxScrapes: 1,
  maxMaps: 0,
  maxCrawls: 0,
  maxExtracts: 0,
  maxScreenshots: 1,
  maxInputChars: 6000,
  maxOutputWords: 750,
  maxModelSteps: 2,
};

const brandDeepBudget: WorkflowBudget = {
  maxScrapes: 3,
  maxMaps: 1,
  maxCrawls: 0,
  maxExtracts: 1,
  maxScreenshots: 3,
  maxInputChars: 10000,
  maxOutputWords: 1100,
  maxModelSteps: 2,
};

const seoQuickBudget: WorkflowBudget = {
  maxScrapes: 1,
  maxMaps: 0,
  maxCrawls: 0,
  maxExtracts: 0,
  maxScreenshots: 0,
  maxInputChars: 6000,
  maxOutputWords: 700,
  maxModelSteps: 2,
};

const seoStandardBudget: WorkflowBudget = {
  maxScrapes: 3,
  maxMaps: 0,
  maxCrawls: 1,
  maxExtracts: 0,
  maxScreenshots: 0,
  maxInputChars: 12000,
  maxOutputWords: 1000,
  maxModelSteps: 2,
};

const seoDeepBudget: WorkflowBudget = {
  maxScrapes: 50,
  maxMaps: 1,
  maxCrawls: 1,
  maxExtracts: 1,
  maxScreenshots: 0,
  maxInputChars: 30000,
  maxOutputWords: 1600,
  maxModelSteps: 3,
};

const summaryQuickBudget: WorkflowBudget = {
  maxScrapes: 1,
  maxMaps: 0,
  maxCrawls: 0,
  maxExtracts: 0,
  maxScreenshots: 0,
  maxInputChars: 6000,
  maxOutputWords: 650,
  maxModelSteps: 2,
};

const summaryStandardBudget: WorkflowBudget = {
  maxScrapes: 1,
  maxMaps: 0,
  maxCrawls: 0,
  maxExtracts: 0,
  maxScreenshots: 0,
  maxInputChars: 16000,
  maxOutputWords: 1000,
  maxModelSteps: 2,
};

const summaryDeepBudget: WorkflowBudget = {
  maxScrapes: 3,
  maxMaps: 0,
  maxCrawls: 1,
  maxExtracts: 0,
  maxScreenshots: 0,
  maxInputChars: 26000,
  maxOutputWords: 1400,
  maxModelSteps: 2,
};

const presentationQuickBudget: WorkflowBudget = {
  maxScrapes: 1,
  maxMaps: 0,
  maxCrawls: 0,
  maxExtracts: 0,
  maxScreenshots: 1,
  maxInputChars: 9000,
  maxOutputWords: 950,
  maxModelSteps: 2,
};

const presentationStandardBudget: WorkflowBudget = {
  maxScrapes: 1,
  maxMaps: 0,
  maxCrawls: 0,
  maxExtracts: 0,
  maxScreenshots: 1,
  maxInputChars: 16000,
  maxOutputWords: 1300,
  maxModelSteps: 2,
};

const presentationDeepBudget: WorkflowBudget = {
  maxScrapes: 3,
  maxMaps: 0,
  maxCrawls: 1,
  maxExtracts: 0,
  maxScreenshots: 2,
  maxInputChars: 30000,
  maxOutputWords: 1800,
  maxModelSteps: 2,
};

export const brandAnalyzerWorkflow: WorkflowDefinition = {
  id: 'brand-analyzer',
  toolType: 'brand-analyzer',
  defaultMode: 'standard',
  allowedModes: ['quick', 'standard', 'deep'],
  modePolicies: {
    quick: {
      modelPolicy: 'quick',
      firecrawlAccess: 'disabled',
      budget: brandStandardBudget,
    },
    standard: {
      modelPolicy: 'standard',
      firecrawlAccess: 'disabled',
      budget: brandStandardBudget,
    },
    deep: {
      modelPolicy: 'premium',
      firecrawlAccess: 'limited',
      budget: brandDeepBudget,
    },
  },
};

export const seoAnalyzerWorkflow: WorkflowDefinition = {
  id: 'seo-analyzer',
  toolType: 'seo-analyzer',
  defaultMode: 'standard',
  allowedModes: ['quick', 'standard', 'deep'],
  modePolicies: {
    quick: {
      modelPolicy: 'quick',
      firecrawlAccess: 'disabled',
      budget: seoQuickBudget,
    },
    standard: {
      modelPolicy: 'standard',
      firecrawlAccess: 'disabled',
      budget: seoStandardBudget,
    },
    deep: {
      modelPolicy: 'premium',
      firecrawlAccess: 'limited',
      budget: seoDeepBudget,
    },
  },
};

export const articleSummaryWorkflow: WorkflowDefinition = {
  id: 'article-summary',
  toolType: 'article-summary',
  defaultMode: 'standard',
  allowedModes: ['quick', 'standard', 'deep'],
  modePolicies: {
    quick: {
      modelPolicy: 'quick',
      firecrawlAccess: 'disabled',
      budget: summaryQuickBudget,
    },
    standard: {
      modelPolicy: 'standard',
      firecrawlAccess: 'disabled',
      budget: summaryStandardBudget,
    },
    deep: {
      modelPolicy: 'premium',
      firecrawlAccess: 'disabled',
      budget: summaryDeepBudget,
    },
  },
};

export const studyNotesWorkflow: WorkflowDefinition = {
  id: 'study-notes',
  toolType: 'study-notes',
  defaultMode: 'standard',
  allowedModes: ['quick', 'standard', 'deep'],
  modePolicies: {
    quick: {
      modelPolicy: 'quick',
      firecrawlAccess: 'disabled',
      budget: summaryQuickBudget,
    },
    standard: {
      modelPolicy: 'standard',
      firecrawlAccess: 'disabled',
      budget: summaryStandardBudget,
    },
    deep: {
      modelPolicy: 'premium',
      firecrawlAccess: 'disabled',
      budget: summaryDeepBudget,
    },
  },
};

export const presentationWorkflow: WorkflowDefinition = {
  id: 'presentation',
  toolType: 'presentation',
  defaultMode: 'standard',
  allowedModes: ['quick', 'standard', 'deep'],
  modePolicies: {
    quick: {
      modelPolicy: 'quick',
      firecrawlAccess: 'disabled',
      budget: presentationQuickBudget,
    },
    standard: {
      modelPolicy: 'standard',
      firecrawlAccess: 'disabled',
      budget: presentationStandardBudget,
    },
    deep: {
      modelPolicy: 'premium',
      firecrawlAccess: 'disabled',
      budget: presentationDeepBudget,
    },
  },
};

export const workflowDefinitions: Record<string, WorkflowDefinition> = {
  [brandAnalyzerWorkflow.id]: brandAnalyzerWorkflow,
  [seoAnalyzerWorkflow.id]: seoAnalyzerWorkflow,
  [articleSummaryWorkflow.id]: articleSummaryWorkflow,
  [studyNotesWorkflow.id]: studyNotesWorkflow,
  [presentationWorkflow.id]: presentationWorkflow,
};
