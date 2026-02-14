import React, { useState } from 'react';
import { Input, Tag, Select, Space, Typography } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectActiveSection,
  selectActiveReport,
  selectReportSaving,
  updateSectionStatusLocally,
  updateSection,
} from '../../store/slices/reportSlice';
import AssistButton from './AssistButton';

const { Text } = Typography;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'final', label: 'Final' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  reviewed: 'blue',
  final: 'green',
};

export default function SectionToolbar() {
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector(selectActiveSection);
  const activeReport = useAppSelector(selectActiveReport);
  const saving = useAppSelector(selectReportSaving);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  if (!activeSection || !activeReport) return null;

  const handleTitleDoubleClick = () => {
    setTitleValue(activeSection.title);
    setEditingTitle(true);
  };

  const handleTitleSave = () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== activeSection.title) {
      const updated = { ...activeSection, title: titleValue.trim() };
      dispatch(updateSection({ reportId: activeReport.id, section: updated }));
    }
  };

  const handleStatusChange = (status: 'draft' | 'reviewed' | 'final') => {
    dispatch(updateSectionStatusLocally({ sectionId: activeSection.id, status }));
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0',
      marginBottom: 12,
    }}>
      <Space align="center">
        {editingTitle ? (
          <Input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onPressEnter={handleTitleSave}
            autoFocus
            size="small"
            style={{ width: 300 }}
          />
        ) : (
          <Text
            strong
            style={{ fontSize: 18, cursor: 'pointer' }}
            onDoubleClick={handleTitleDoubleClick}
          >
            {activeSection.title}
          </Text>
        )}

        <Tag color="default" style={{ fontSize: 11 }}>
          {activeSection.sectionType}
        </Tag>
      </Space>

      <Space align="center">
        <AssistButton />
        {saving && <Text type="secondary" style={{ fontSize: 11 }}>Saving...</Text>}
        <Select
          value={activeSection.status}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS}
          size="small"
          style={{ width: 110 }}
          variant="borderless"
          suffixIcon={
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: STATUS_COLORS[activeSection.status] || '#d9d9d9',
              display: 'inline-block',
            }} />
          }
        />
      </Space>
    </div>
  );
}
