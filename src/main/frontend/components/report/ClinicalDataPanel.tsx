import React, { useState } from 'react';
import { Collapse, Button, Input, Table, Upload, Typography, Space, message, Select } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectActiveReport, setActiveReport } from '../../store/slices/reportSlice';
import { ClinicalDataService } from 'Frontend/generated/endpoints';
import type { ClinicalEndpointDto, ReportDto } from '../../types/reportTypes';

const { TextArea } = Input;
const { Text } = Typography;

const CATEGORIES = [
  { value: 'hematology', label: 'Hematology' },
  { value: 'clin_chem', label: 'Clinical Chemistry' },
  { value: 'organ_weights', label: 'Organ Weights' },
  { value: 'histopath', label: 'Histopathology' },
];

export default function ClinicalDataPanel() {
  const dispatch = useAppDispatch();
  const activeReport = useAppSelector(selectActiveReport);

  // Manual entry state
  const [manualName, setManualName] = useState('');
  const [manualEndpoints, setManualEndpoints] = useState<ClinicalEndpointDto[]>([]);

  // Narrative state
  const [narrativeName, setNarrativeName] = useState('');
  const [narrativeText, setNarrativeText] = useState('');

  if (!activeReport) return null;

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      const response = await fetch(`/api/reports/${activeReport.id}/clinical-data/upload`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const updatedReport = await response.json();
        dispatch(setActiveReport(updatedReport as ReportDto));
        message.success('Clinical data uploaded');
      } else {
        message.error('Failed to upload clinical data');
      }
    } catch (err) {
      message.error('Upload failed');
    }
    return false; // prevent default upload behavior
  };

  const handleAddManualData = async () => {
    if (!manualName.trim()) return;
    try {
      const updatedReport = await ClinicalDataService.addManualClinicalData(
        activeReport.id, manualName.trim(), manualEndpoints
      );
      if (updatedReport) {
        dispatch(setActiveReport(updatedReport as ReportDto));
        setManualName('');
        setManualEndpoints([]);
        message.success('Manual data added');
      }
    } catch (err) {
      message.error('Failed to add manual data');
    }
  };

  const handleAddNarrative = async () => {
    if (!narrativeName.trim() || !narrativeText.trim()) return;
    try {
      const updatedReport = await ClinicalDataService.addNarrativeClinicalData(
        activeReport.id, narrativeName.trim(), narrativeText.trim()
      );
      if (updatedReport) {
        dispatch(setActiveReport(updatedReport as ReportDto));
        setNarrativeName('');
        setNarrativeText('');
        message.success('Narrative data added');
      }
    } catch (err) {
      message.error('Failed to add narrative data');
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      const updatedReport = await ClinicalDataService.deleteClinicalDataset(activeReport.id, datasetId);
      if (updatedReport) {
        dispatch(setActiveReport(updatedReport as ReportDto));
        message.success('Dataset removed');
      }
    } catch (err) {
      message.error('Failed to delete dataset');
    }
  };

  const addManualRow = () => {
    setManualEndpoints([...manualEndpoints, {
      id: crypto.randomUUID(),
      category: 'hematology',
      endpoint: '',
      dose: '',
      sex: '',
      value: null,
      unit: '',
      controlValue: null,
      percentChange: null,
      significance: '',
      notes: '',
    }]);
  };

  const updateManualRow = (index: number, field: string, value: any) => {
    const updated = [...manualEndpoints];
    (updated[index] as any)[field] = value;
    setManualEndpoints(updated);
  };

  const removeManualRow = (index: number) => {
    setManualEndpoints(manualEndpoints.filter((_, i) => i !== index));
  };

  const manualColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      width: 120,
      render: (_: any, __: any, index: number) => (
        <Select
          size="small"
          value={manualEndpoints[index]?.category}
          onChange={(v) => updateManualRow(index, 'category', v)}
          options={CATEGORIES}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={manualEndpoints[index]?.endpoint}
          onChange={(e) => updateManualRow(index, 'endpoint', e.target.value)} />
      ),
    },
    {
      title: 'Dose',
      dataIndex: 'dose',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={manualEndpoints[index]?.dose}
          onChange={(e) => updateManualRow(index, 'dose', e.target.value)} />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Input size="small" type="number" value={manualEndpoints[index]?.value ?? ''}
          onChange={(e) => updateManualRow(index, 'value', e.target.value ? Number(e.target.value) : null)} />
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={manualEndpoints[index]?.unit}
          onChange={(e) => updateManualRow(index, 'unit', e.target.value)} />
      ),
    },
    {
      title: '',
      width: 40,
      render: (_: any, __: any, index: number) => (
        <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }}
          onClick={() => removeManualRow(index)} />
      ),
    },
  ];

  return (
    <Collapse
      size="small"
      items={[
        {
          key: 'clinical',
          label: <Text strong style={{ fontSize: 13 }}>Clinical Data ({activeReport.clinicalDatasets.length} datasets)</Text>,
          children: (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Existing datasets */}
              {activeReport.clinicalDatasets.map((ds) => (
                <div key={ds.id} style={{ padding: 8, background: '#f6ffed', borderRadius: 4, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{ds.name}</Text>
                    <DeleteOutlined
                      style={{ color: '#ff4d4f', cursor: 'pointer' }}
                      onClick={() => handleDeleteDataset(ds.id)}
                    />
                  </div>
                  <Text type="secondary">
                    Source: {ds.source} | {ds.endpoints?.length || 0} endpoints
                  </Text>
                  {ds.narrativeSummary && (
                    <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                      {ds.narrativeSummary.substring(0, 200)}
                      {ds.narrativeSummary.length > 200 ? '...' : ''}
                    </div>
                  )}
                </div>
              ))}

              {/* Upload */}
              <div>
                <Text strong style={{ fontSize: 12 }}>Upload CSV/Excel</Text>
                <Upload
                  accept=".csv,.xlsx,.xls"
                  beforeUpload={handleUpload}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} size="small" style={{ marginTop: 4 }}>
                    Choose File
                  </Button>
                </Upload>
              </div>

              {/* Manual Entry */}
              <div>
                <Text strong style={{ fontSize: 12 }}>Manual Entry</Text>
                <Input
                  size="small"
                  placeholder="Dataset name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  style={{ marginTop: 4, marginBottom: 4 }}
                />
                <Table
                  size="small"
                  columns={manualColumns}
                  dataSource={manualEndpoints}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 500 }}
                />
                <Space style={{ marginTop: 4 }}>
                  <Button size="small" icon={<PlusOutlined />} onClick={addManualRow}>Add Row</Button>
                  <Button size="small" type="primary" onClick={handleAddManualData}
                    disabled={!manualName.trim() || manualEndpoints.length === 0}>
                    Save Dataset
                  </Button>
                </Space>
              </div>

              {/* Narrative */}
              <div>
                <Text strong style={{ fontSize: 12 }}>Narrative Summary</Text>
                <Input
                  size="small"
                  placeholder="Dataset name"
                  value={narrativeName}
                  onChange={(e) => setNarrativeName(e.target.value)}
                  style={{ marginTop: 4, marginBottom: 4 }}
                />
                <TextArea
                  rows={3}
                  placeholder="Describe clinical findings in narrative form..."
                  value={narrativeText}
                  onChange={(e) => setNarrativeText(e.target.value)}
                />
                <Button
                  size="small"
                  type="primary"
                  onClick={handleAddNarrative}
                  disabled={!narrativeName.trim() || !narrativeText.trim()}
                  style={{ marginTop: 4 }}
                >
                  Save Narrative
                </Button>
              </div>
            </Space>
          ),
        },
      ]}
      style={{ marginTop: 12 }}
    />
  );
}
