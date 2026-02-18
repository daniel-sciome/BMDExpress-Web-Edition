import React, { useState, useCallback } from 'react';
import { Empty, Button, Space, Tooltip } from 'antd';
import { DatabaseOutlined, CameraOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectActiveSection,
  selectActiveReport,
  updateSectionContentLocally,
} from '../../store/slices/reportSlice';
import SectionToolbar from './SectionToolbar';
import PurposeEditor from './PurposeEditor';
import RichTextEditor from './RichTextEditor';
import DataAttachmentPanel from './DataAttachmentPanel';
import ChartSnapshotPanel from './ChartSnapshotPanel';
import ClinicalDataPanel from './ClinicalDataPanel';
import ExportModal from './ExportModal';
import ReportDocumentView from './ReportDocumentView';

export default function SectionEditor() {
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector(selectActiveSection);
  const activeReport = useAppSelector(selectActiveReport);

  const [showDataPanel, setShowDataPanel] = useState(false);
  const [showChartPanel, setShowChartPanel] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleContentChange = useCallback((html: string) => {
    if (activeSection) {
      dispatch(updateSectionContentLocally({ sectionId: activeSection.id, content: html }));
    }
  }, [dispatch, activeSection?.id]);

  if (!activeSection || !activeReport) {
    return (
      <Empty
        description="Select a section from the tree to begin editing"
        style={{ marginTop: 80 }}
      />
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <SectionToolbar />
      <PurposeEditor />

      {/* Action bar */}
      <div style={{ marginTop: 12, marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Tooltip title="Attach BMDExpress data">
            <Button
              size="small"
              icon={<DatabaseOutlined />}
              onClick={() => setShowDataPanel(true)}
            >
              Attach Data
            </Button>
          </Tooltip>
          <Tooltip title="Capture chart snapshot">
            <Button
              size="small"
              icon={<CameraOutlined />}
              onClick={() => setShowChartPanel(true)}
            >
              Capture Chart
            </Button>
          </Tooltip>
          <Tooltip title="Preview formatted document">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setShowPreview(true)}
            >
              Preview
            </Button>
          </Tooltip>
          <Tooltip title="Export report">
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={() => setShowExport(true)}
            >
              Export
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Rich text editor */}
      <RichTextEditor
        content={activeSection.content || ''}
        onChange={handleContentChange}
        placeholder={activeSection.purpose
          ? `Write about: ${activeSection.purpose}`
          : 'Start writing...'}
      />

      {/* Data attachments summary */}
      {activeSection.dataAttachments.length > 0 && (
        <div style={{ marginTop: 12, padding: 8, background: '#f6ffed', borderRadius: 4, fontSize: 12 }}>
          <strong>Attached Data:</strong> {activeSection.dataAttachments.length} item(s)
          {activeSection.dataAttachments.map((att, i) => (
            <div key={i} style={{ marginLeft: 8, color: '#666' }}>{att.label}</div>
          ))}
        </div>
      )}

      {/* Chart snapshots */}
      {activeSection.chartSnapshots.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeSection.chartSnapshots.map((snap) => (
            <div key={snap.id} style={{ textAlign: 'center' }}>
              <img
                src={snap.dataUrl}
                alt={snap.title}
                style={{ maxWidth: 200, maxHeight: 120, border: '1px solid #d9d9d9', borderRadius: 4 }}
              />
              <div style={{ fontSize: 10, color: '#999' }}>{snap.title}</div>
            </div>
          ))}
        </div>
      )}

      {/* Clinical data */}
      <ClinicalDataPanel />

      {/* Drawers */}
      <DataAttachmentPanel open={showDataPanel} onClose={() => setShowDataPanel(false)} />
      <ChartSnapshotPanel open={showChartPanel} onClose={() => setShowChartPanel(false)} />
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
      {activeReport && (
        <ReportDocumentView
          report={activeReport}
          open={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
