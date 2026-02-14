import React, { useState, useEffect } from 'react';
import { Drawer, Select, Button, List, Typography, Tag, Space, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectActiveSection, selectActiveReport, updateSection } from '../../store/slices/reportSlice';
import { ProjectService, CategoryResultsService } from 'Frontend/generated/endpoints';
import type { DataAttachmentDto } from '../../types/reportTypes';

const { Text } = Typography;

interface DataAttachmentPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function DataAttachmentPanel({ open, onClose }: DataAttachmentPanelProps) {
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector(selectActiveSection);
  const activeReport = useAppSelector(selectActiveReport);

  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [categoryResults, setCategoryResults] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<string>('');

  useEffect(() => {
    if (open) {
      ProjectService.getAllProjectIds().then((ids) => {
        const valid = (ids || []).filter((p): p is string => p !== undefined);
        setProjects(valid);
        if (activeReport?.projectId) {
          setSelectedProject(activeReport.projectId);
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (selectedProject) {
      CategoryResultsService.getCategoryResultNames(selectedProject).then((names) => {
        const valid = (names || []).filter((n): n is string => n !== undefined);
        setCategoryResults(valid);
      });
    }
  }, [selectedProject]);

  const handleAttach = () => {
    if (!activeSection || !activeReport || !selectedResult) return;

    const attachment: DataAttachmentDto = {
      projectId: selectedProject,
      categoryResultName: selectedResult,
      pathwayDescription: '',
      geneSymbols: '',
      label: `${selectedResult} (${selectedProject})`,
      summaryJson: '',
    };

    const updatedSection = {
      ...activeSection,
      dataAttachments: [...activeSection.dataAttachments, attachment],
    };

    dispatch(updateSection({ reportId: activeReport.id, section: updatedSection }));
    setSelectedResult('');
  };

  const handleRemove = (index: number) => {
    if (!activeSection || !activeReport) return;

    const updatedAttachments = activeSection.dataAttachments.filter((_, i) => i !== index);
    const updatedSection = { ...activeSection, dataAttachments: updatedAttachments };
    dispatch(updateSection({ reportId: activeReport.id, section: updatedSection }));
  };

  return (
    <Drawer
      title="Attach BMDExpress Data"
      open={open}
      onClose={onClose}
      width={400}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Project</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={selectedProject}
            onChange={setSelectedProject}
            options={projects.map(p => ({ value: p, label: p }))}
            placeholder="Select project"
          />
        </div>

        <div>
          <Text strong>Category Result</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={selectedResult}
            onChange={setSelectedResult}
            options={categoryResults.map(r => ({ value: r, label: r }))}
            placeholder="Select analysis result"
            disabled={!selectedProject}
          />
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAttach}
          disabled={!selectedResult}
          block
        >
          Attach to Section
        </Button>
      </Space>

      <div style={{ marginTop: 24 }}>
        <Text strong>Current Attachments</Text>
        {activeSection?.dataAttachments.length === 0 ? (
          <Empty description="No data attached" style={{ marginTop: 16 }} />
        ) : (
          <List
            size="small"
            style={{ marginTop: 8 }}
            dataSource={activeSection?.dataAttachments || []}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <DeleteOutlined
                    key="delete"
                    style={{ color: '#ff4d4f' }}
                    onClick={() => handleRemove(index)}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={<DatabaseOutlined style={{ color: '#1890ff' }} />}
                  title={<Text style={{ fontSize: 12 }}>{item.label}</Text>}
                  description={
                    <Tag color="blue" style={{ fontSize: 10 }}>
                      {item.categoryResultName}
                    </Tag>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Drawer>
  );
}
