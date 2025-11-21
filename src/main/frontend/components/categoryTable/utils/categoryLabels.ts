/**
 * Category Results Table - Dynamic Label Utilities
 *
 * This file contains utilities for determining appropriate column labels
 * based on the analysis type and parameters.
 */

/**
 * Analysis info used to determine column labels
 */
export interface AnalysisInfo {
  analysisType: string | null;
  analysisParameters: string[];
}

/**
 * Column labels for Category ID and Description columns
 */
export interface CategoryColumnLabels {
  categoryIdLabel: string;
  descriptionLabel: string;
}

/**
 * Parse a GO category from analysis parameters
 *
 * @param parameters - Array of analysis parameter strings
 * @returns GO category (e.g., 'BP', 'CC', 'MF') or null
 */
function parseGOCategory(parameters: string[]): string | null {
  for (const param of parameters) {
    // Look for patterns like "GO Category: BP" or "goCategory: BP"
    const match = param.match(/GO\s*Category\s*:\s*(\w+)/i);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

/**
 * Parse a pathway database from analysis parameters
 *
 * @param parameters - Array of analysis parameter strings
 * @returns Pathway database name (e.g., 'REACTOME', 'KEGG') or null
 */
function parsePathwayDB(parameters: string[]): string | null {
  for (const param of parameters) {
    // Look for patterns like "Pathway DB: REACTOME" or "pathwayDB: KEGG"
    const match = param.match(/Pathway\s*DB\s*:\s*(\w+)/i);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

/**
 * Get appropriate column labels based on analysis type and parameters
 *
 * This function determines the appropriate labels for the Category ID and Description
 * columns based on what kind of analysis was performed.
 *
 * Actual analysis type values from the backend:
 * - "GO_BP", "GO_CC", "GO_MF" - Gene Ontology categories
 * - "GENE" - Gene-level analysis
 * - "Reactome" - Reactome pathway database
 * - "KEGG" - KEGG pathway database
 * - "DEFINED" - User-defined gene sets
 *
 * @param analysisInfo - Analysis type and parameters
 * @returns Object with categoryIdLabel and descriptionLabel
 */
export function getCategoryColumnLabels(analysisInfo: AnalysisInfo): CategoryColumnLabels {
  const { analysisType } = analysisInfo;

  // Default labels
  const defaultLabels: CategoryColumnLabels = {
    categoryIdLabel: 'Category ID',
    descriptionLabel: 'Description',
  };

  if (!analysisType) {
    return defaultLabels;
  }

  const type = analysisType.toUpperCase();

  // Gene-level analysis
  if (type === 'GENE') {
    return {
      categoryIdLabel: 'Gene ID',
      descriptionLabel: 'Gene Name',
    };
  }

  // Gene Ontology - Biological Process
  if (type === 'GO_BP') {
    return {
      categoryIdLabel: 'GO Term ID',
      descriptionLabel: 'GO Term (Biological Process)',
    };
  }

  // Gene Ontology - Cellular Component
  if (type === 'GO_CC') {
    return {
      categoryIdLabel: 'GO Term ID',
      descriptionLabel: 'GO Term (Cellular Component)',
    };
  }

  // Gene Ontology - Molecular Function
  if (type === 'GO_MF') {
    return {
      categoryIdLabel: 'GO Term ID',
      descriptionLabel: 'GO Term (Molecular Function)',
    };
  }

  // Reactome pathway database
  if (type === 'REACTOME') {
    return {
      categoryIdLabel: 'Reactome ID',
      descriptionLabel: 'Reactome Pathway',
    };
  }

  // KEGG pathway database
  if (type === 'KEGG') {
    return {
      categoryIdLabel: 'KEGG ID',
      descriptionLabel: 'KEGG Pathway',
    };
  }

  // User-defined gene sets
  if (type === 'DEFINED') {
    return {
      categoryIdLabel: 'Gene Set ID',
      descriptionLabel: 'Gene Set Name',
    };
  }

  // Generic GO fallback (if we see other GO_ prefixes)
  if (type.startsWith('GO_')) {
    return {
      categoryIdLabel: 'GO Term ID',
      descriptionLabel: 'GO Term',
    };
  }

  // Default fallback
  return defaultLabels;
}
