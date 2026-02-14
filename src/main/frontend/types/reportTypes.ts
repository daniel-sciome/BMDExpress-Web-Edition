// Report Builder TypeScript types — mirrors Java DTOs

export interface ReportDto {
  id: string;
  title: string;
  projectId: string;
  templateName: string;
  createdAt: string;
  updatedAt: string;
  sections: ReportSectionDto[];
  clinicalDatasets: ClinicalDatasetDto[];
  metadata: Record<string, string>;
}

export interface ReportSectionDto {
  id: string;
  parentId: string | null;
  title: string;
  order: number;
  sectionType: string;
  purpose: string;
  content: string; // HTML
  status: 'draft' | 'reviewed' | 'final';
  dataAttachments: DataAttachmentDto[];
  chartSnapshots: ChartSnapshotDto[];
  clinicalDatasetIds: string[];
}

export interface ReportMetadataDto {
  id: string;
  title: string;
  projectId: string;
  templateName: string;
  sectionCount: number;
  completionPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface DataAttachmentDto {
  projectId: string;
  categoryResultName: string;
  pathwayDescription: string;
  geneSymbols: string;
  label: string;
  summaryJson: string;
}

export interface ChartSnapshotDto {
  id: string;
  chartType: string;
  title: string;
  dataUrl: string; // base64 PNG
  width: number;
  height: number;
  capturedAt: string;
}

export interface ClinicalDatasetDto {
  id: string;
  name: string;
  source: 'upload' | 'manual' | 'narrative';
  endpoints: ClinicalEndpointDto[];
  narrativeSummary: string;
}

export interface ClinicalEndpointDto {
  id: string;
  category: 'hematology' | 'clin_chem' | 'organ_weights' | 'histopath' | string;
  endpoint: string;
  dose: string;
  sex: string;
  value: number | null;
  unit: string;
  controlValue: number | null;
  percentChange: number | null;
  significance: string;
  notes: string;
}

// Redux state
export interface ReportState {
  reports: ReportMetadataDto[];
  activeReport: ReportDto | null;
  activeSectionId: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  llmGenerating: boolean;
}
