import { createSlice, createAsyncThunk, PayloadAction, Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  ReportState,
  ReportDto,
  ReportMetadataDto,
  ReportSectionDto,
} from '../../types/reportTypes';
import { ReportService } from 'Frontend/generated/endpoints';

const initialState: ReportState = {
  reports: [],
  activeReport: null,
  activeSectionId: null,
  loading: false,
  saving: false,
  error: null,
  llmGenerating: false,
};

// Async thunks

export const loadReportList = createAsyncThunk(
  'report/loadReportList',
  async () => {
    const reports = await ReportService.listReports();
    return (reports || []) as ReportMetadataDto[];
  }
);

export const loadReport = createAsyncThunk(
  'report/loadReport',
  async (reportId: string) => {
    const report = await ReportService.getReport(reportId);
    return report as ReportDto;
  }
);

export const createReport = createAsyncThunk(
  'report/createReport',
  async ({ projectId, templateName, title }: { projectId: string; templateName: string; title: string }) => {
    const report = await ReportService.createReport(projectId, templateName, title);
    return report as ReportDto;
  }
);

export const saveReport = createAsyncThunk(
  'report/saveReport',
  async (report: ReportDto) => {
    await ReportService.saveReport(report);
    return report;
  }
);

export const deleteReport = createAsyncThunk(
  'report/deleteReport',
  async (reportId: string) => {
    await ReportService.deleteReport(reportId);
    return reportId;
  }
);

export const updateSection = createAsyncThunk(
  'report/updateSection',
  async ({ reportId, section }: { reportId: string; section: ReportSectionDto }) => {
    const report = await ReportService.updateSection(reportId, section);
    return report as ReportDto;
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setActiveSectionId: (state, action: PayloadAction<string | null>) => {
      state.activeSectionId = action.payload;
    },
    updateSectionContentLocally: (state, action: PayloadAction<{ sectionId: string; content: string }>) => {
      if (state.activeReport) {
        const section = state.activeReport.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          section.content = action.payload.content;
        }
      }
    },
    updateSectionStatusLocally: (state, action: PayloadAction<{ sectionId: string; status: 'draft' | 'reviewed' | 'final' }>) => {
      if (state.activeReport) {
        const section = state.activeReport.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          section.status = action.payload.status;
        }
      }
    },
    clearActiveReport: (state) => {
      state.activeReport = null;
      state.activeSectionId = null;
    },
    setLlmGenerating: (state, action: PayloadAction<boolean>) => {
      state.llmGenerating = action.payload;
    },
    setActiveReport: (state, action: PayloadAction<ReportDto>) => {
      state.activeReport = action.payload;
    },
  },
  extraReducers: (builder) => {
    // loadReportList
    builder.addCase(loadReportList.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadReportList.fulfilled, (state, action) => {
      state.loading = false;
      state.reports = action.payload;
    });
    builder.addCase(loadReportList.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to load reports';
    });

    // loadReport
    builder.addCase(loadReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadReport.fulfilled, (state, action) => {
      state.loading = false;
      state.activeReport = action.payload;
      // Auto-select first section
      if (action.payload.sections.length > 0 && !state.activeSectionId) {
        const rootSections = action.payload.sections
          .filter(s => !s.parentId)
          .sort((a, b) => a.order - b.order);
        if (rootSections.length > 0) {
          state.activeSectionId = rootSections[0].id;
        }
      }
    });
    builder.addCase(loadReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to load report';
    });

    // createReport
    builder.addCase(createReport.fulfilled, (state, action) => {
      state.activeReport = action.payload;
      // Add to list
      state.reports.unshift({
        id: action.payload.id,
        title: action.payload.title,
        projectId: action.payload.projectId,
        templateName: action.payload.templateName,
        sectionCount: action.payload.sections.length,
        completionPercent: 0,
        createdAt: action.payload.createdAt,
        updatedAt: action.payload.updatedAt,
      });
    });

    // saveReport
    builder.addCase(saveReport.pending, (state) => {
      state.saving = true;
    });
    builder.addCase(saveReport.fulfilled, (state) => {
      state.saving = false;
    });
    builder.addCase(saveReport.rejected, (state, action) => {
      state.saving = false;
      state.error = action.error.message || 'Failed to save report';
    });

    // deleteReport
    builder.addCase(deleteReport.fulfilled, (state, action) => {
      state.reports = state.reports.filter(r => r.id !== action.payload);
      if (state.activeReport?.id === action.payload) {
        state.activeReport = null;
        state.activeSectionId = null;
      }
    });

    // updateSection
    builder.addCase(updateSection.fulfilled, (state, action) => {
      state.activeReport = action.payload;
    });
  },
});

export const {
  setActiveSectionId,
  updateSectionContentLocally,
  updateSectionStatusLocally,
  clearActiveReport,
  setLlmGenerating,
  setActiveReport,
} = reportSlice.actions;

// Selectors
export const selectActiveReport = (state: RootState) => state.report.activeReport;
export const selectActiveSectionId = (state: RootState) => state.report.activeSectionId;
export const selectActiveSection = (state: RootState) => {
  const report = state.report.activeReport;
  const sectionId = state.report.activeSectionId;
  if (!report || !sectionId) return null;
  return report.sections.find(s => s.id === sectionId) || null;
};
export const selectReportList = (state: RootState) => state.report.reports;
export const selectReportLoading = (state: RootState) => state.report.loading;
export const selectReportSaving = (state: RootState) => state.report.saving;
export const selectReportError = (state: RootState) => state.report.error;
export const selectLlmGenerating = (state: RootState) => state.report.llmGenerating;

// Auto-save middleware (debounced 1.5s after content changes)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const reportAutoSaveMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  if (typeof action === 'object' && action !== null && 'type' in action &&
      typeof action.type === 'string' &&
      (action.type === 'report/updateSectionContentLocally' ||
       action.type === 'report/updateSectionStatusLocally')) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const state = store.getState() as RootState;
      if (state.report.activeReport) {
        store.dispatch(saveReport(state.report.activeReport) as any);
      }
    }, 1500);
  }

  return result;
};

export default reportSlice.reducer;
