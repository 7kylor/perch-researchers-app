import type { ExtractionTemplate } from '../../../shared/types.js';

export const BUILTIN_TEMPLATES: ReadonlyArray<ExtractionTemplate> = [
  {
    id: 'methodology-basic',
    name: 'Methodology (Basic)',
    createdAt: new Date().toISOString(),
    columns: [
      { id: 'design', name: 'Study Design', type: 'text', prompt: 'Identify the study design.' },
      { id: 'sample', name: 'Sample Size', type: 'number', prompt: 'Extract the sample size.' },
      { id: 'population', name: 'Population', type: 'text', prompt: 'Describe the population.' },
      { id: 'metrics', name: 'Key Metrics', type: 'text', prompt: 'List key outcome metrics.' },
    ],
  },
  {
    id: 'outcomes-basic',
    name: 'Outcomes (Basic)',
    createdAt: new Date().toISOString(),
    columns: [
      { id: 'primary', name: 'Primary Outcome', type: 'text', prompt: 'Primary outcome.' },
      { id: 'secondary', name: 'Secondary Outcomes', type: 'text', prompt: 'Secondary outcomes.' },
      { id: 'effect', name: 'Effect Size', type: 'text', prompt: 'Effect size with statistics.' },
    ],
  },
];
