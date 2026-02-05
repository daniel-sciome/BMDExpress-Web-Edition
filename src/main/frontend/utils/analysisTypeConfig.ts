/**
 * Analysis Type Configuration
 *
 * Single source of truth for analysis type definitions and display names.
 * Used throughout the app for consistent labeling.
 */

export interface AnalysisTypeConfig {
  id: string;
  displayName: string;
  shortName?: string;
  category: 'gene' | 'pathway' | 'ontology';
}

/**
 * Analysis type configurations
 */
export const ANALYSIS_TYPE_CONFIG: AnalysisTypeConfig[] = [
  { id: 'GENE', displayName: 'Genes', shortName: 'Gene', category: 'gene' },
  { id: 'GO_BP', displayName: 'GO Biological Process', shortName: 'GO BP', category: 'ontology' },
  { id: 'GO_MF', displayName: 'GO Molecular Function', shortName: 'GO MF', category: 'ontology' },
  { id: 'GO_CC', displayName: 'GO Cellular Component', shortName: 'GO CC', category: 'ontology' },
  { id: 'GO_ALL', displayName: 'GO All Terms', shortName: 'GO All', category: 'ontology' },
  { id: 'KEGG', displayName: 'KEGG Pathways', shortName: 'KEGG', category: 'pathway' },
  { id: 'Reactome', displayName: 'Reactome Pathways', shortName: 'Reactome', category: 'pathway' },
  { id: 'BioPlanet', displayName: 'BioPlanet Pathways', shortName: 'BioPlanet', category: 'pathway' },
  { id: 'Pathway', displayName: 'Pathways', shortName: 'Pathway', category: 'pathway' },
];

/**
 * Lookup map for quick access by ID
 */
const ANALYSIS_TYPE_MAP = new Map<string, AnalysisTypeConfig>(
  ANALYSIS_TYPE_CONFIG.map(config => [config.id, config])
);

/**
 * Get display name for an analysis type
 * Falls back to the original type if not found
 */
export function getAnalysisTypeDisplayName(analysisType: string | undefined | null): string {
  if (!analysisType) return 'Other';
  const config = ANALYSIS_TYPE_MAP.get(analysisType);
  return config?.displayName ?? analysisType;
}

/**
 * Get short name for an analysis type (for compact UI)
 */
export function getAnalysisTypeShortName(analysisType: string | undefined | null): string {
  if (!analysisType) return 'Other';
  const config = ANALYSIS_TYPE_MAP.get(analysisType);
  return config?.shortName ?? config?.displayName ?? analysisType;
}

/**
 * Get category for an analysis type
 */
export function getAnalysisTypeCategory(analysisType: string | undefined | null): 'gene' | 'pathway' | 'ontology' | 'other' {
  if (!analysisType) return 'other';
  const config = ANALYSIS_TYPE_MAP.get(analysisType);
  return config?.category ?? 'other';
}

/**
 * Check if an analysis type is a multi-gene analysis (pathway or ontology)
 */
export function isMultiGeneAnalysis(analysisType: string | undefined | null): boolean {
  const category = getAnalysisTypeCategory(analysisType);
  return category === 'pathway' || category === 'ontology';
}
