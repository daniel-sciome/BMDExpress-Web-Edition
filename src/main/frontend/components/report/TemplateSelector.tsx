import React, { useState, useEffect } from 'react';
import { Modal, Select, Input, Typography, Space, Alert } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createReport, selectReportLoading } from '../../store/slices/reportSlice';
import { ProjectService } from 'Frontend/generated/endpoints';

const { Text } = Typography;

interface TemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const TEMPLATES = [
  { value: 'EPA BMD Guidance', label: 'EPA BMD Guidance', description: 'EPA Benchmark Dose Technical Guidance' },
  { value: 'ICH General Tox', label: 'ICH General Tox', description: 'ICH S4/M3 General Toxicology' },
  { value: 'OECD TG', label: 'OECD TG', description: 'OECD Test Guidelines' },
  { value: 'Blank', label: 'Blank', description: 'Empty report' },
];

export default function TemplateSelector({ visible, onClose }: TemplateSelectorProps) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectReportLoading);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('EPA BMD Guidance');
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCreateError(null);
      ProjectService.getAllProjectIds().then((ids) => {
        const validIds = (ids || []).filter((p): p is string => p !== undefined);
        setProjects(validIds);
        if (validIds.length > 0 && !projectId) {
          setProjectId(validIds[0]);
        }
      });
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!title.trim() || !projectId) return;
    setCreateError(null);
    try {
      await dispatch(createReport({ projectId, templateName: template, title: title.trim() })).unwrap();
      setTitle('');
      onClose();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create report');
    }
  };

  return (
    <Modal
      title="Create New Report"
      open={visible}
      onOk={handleCreate}
      onCancel={onClose}
      okText="Create"
      okButtonProps={{ disabled: !title.trim() || !projectId, loading }}
      cancelButtonProps={{ disabled: loading }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {createError && (
          <Alert type="error" message={createError} closable onClose={() => setCreateError(null)} />
        )}
        <div>
          <Text strong>Report Title</Text>
          <Input
            placeholder="e.g., P3MP Kidney 28-Day Toxicology Report"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>

        <div>
          <Text strong>Project</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={projectId}
            onChange={setProjectId}
            options={projects.map(p => ({ value: p, label: p }))}
            placeholder="Select a project"
          />
        </div>

        <div>
          <Text strong>Template</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={template}
            onChange={setTemplate}
            options={TEMPLATES}
            optionRender={(option) => (
              <div>
                <div>{option.label}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {TEMPLATES.find(t => t.value === option.value)?.description}
                </Text>
              </div>
            )}
          />
        </div>
      </Space>
    </Modal>
  );
}
