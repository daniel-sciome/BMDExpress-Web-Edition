import React, { useState } from 'react';
import { Modal, Radio, Button, Typography, Space } from 'antd';
import { FilePdfOutlined, FileWordOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAppSelector } from '../../store/hooks';
import { selectActiveReport } from '../../store/slices/reportSlice';

const { Text } = Typography;

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const activeReport = useAppSelector(selectActiveReport);
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!activeReport) return;
    setExporting(true);

    // Trigger download via window.open
    window.open(`/api/reports/${activeReport.id}/export/${format}`, '_blank');

    setTimeout(() => {
      setExporting(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      title="Export Report"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exporting}
          disabled={!activeReport}
        >
          Export
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Text>Select the export format for your report:</Text>

        <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)}>
          <Space direction="vertical">
            <Radio value="pdf">
              <Space>
                <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                <div>
                  <Text strong>PDF</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Formatted PDF with embedded charts and tables
                  </Text>
                </div>
              </Space>
            </Radio>
            <Radio value="docx">
              <Space>
                <FileWordOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                <div>
                  <Text strong>Word (.docx)</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Editable Word document with heading structure
                  </Text>
                </div>
              </Space>
            </Radio>
          </Space>
        </Radio.Group>

        {activeReport && (
          <div style={{ padding: 8, background: '#f6ffed', borderRadius: 4, fontSize: 12 }}>
            <Text strong>{activeReport.title}</Text>
            <br />
            <Text type="secondary">
              {activeReport.sections.length} sections | {activeReport.clinicalDatasets.length} clinical datasets
            </Text>
          </div>
        )}
      </Space>
    </Modal>
  );
}
