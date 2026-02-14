import React, { useState } from 'react';
import { Button, List, Typography, Popconfirm, Progress, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectReportList,
  selectActiveReport,
  loadReport,
  deleteReport,
} from '../../store/slices/reportSlice';
import TemplateSelector from './TemplateSelector';

const { Text } = Typography;

export default function ReportListPanel() {
  const dispatch = useAppDispatch();
  const reports = useAppSelector(selectReportList);
  const activeReport = useAppSelector(selectActiveReport);
  const [showCreate, setShowCreate] = useState(false);

  const handleSelectReport = (reportId: string) => {
    dispatch(loadReport(reportId));
  };

  const handleDelete = (reportId: string) => {
    dispatch(deleteReport(reportId));
  };

  return (
    <div style={{ padding: '12px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14 }}>Reports</Text>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setShowCreate(true)}
        >
          New
        </Button>
      </div>

      <List
        size="small"
        dataSource={reports}
        locale={{ emptyText: 'No reports yet' }}
        renderItem={(item) => (
          <List.Item
            style={{
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 4,
              background: activeReport?.id === item.id ? '#e6f7ff' : 'transparent',
            }}
            onClick={() => handleSelectReport(item.id)}
            actions={[
              <Popconfirm
                key="delete"
                title="Delete this report?"
                onConfirm={(e) => { e?.stopPropagation(); handleDelete(item.id); }}
                onCancel={(e) => e?.stopPropagation()}
              >
                <DeleteOutlined
                  style={{ color: '#ff4d4f', fontSize: 12 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ color: '#1890ff', marginTop: 4 }} />}
              title={<Text style={{ fontSize: 12 }}>{item.title}</Text>}
              description={
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>{item.templateName}</Text>
                  <Progress
                    percent={item.completionPercent}
                    size="small"
                    showInfo={false}
                    style={{ marginTop: 2 }}
                  />
                </div>
              }
            />
          </List.Item>
        )}
      />

      <TemplateSelector
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
