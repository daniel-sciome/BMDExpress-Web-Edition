/**
 * FilterGroupEditor Component
 *
 * Modal for creating or editing a filter group
 * - Set group name and description
 * - Add/edit/delete filters
 * - Preview matching count
 */

import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, Typography, Divider, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addFilterGroup, updateFilterGroup, addFilter, updateFilter, deleteFilter } from '../../store/slices/filterSlice';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { applyFilterGroups } from '../../utils/filterEvaluation';
import type { FilterGroup, Filter, PartialFilter } from '../../types/filterTypes';
import FilterBuilder from './FilterBuilder';
import { nanoid } from '@reduxjs/toolkit';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface FilterGroupEditorProps {
  visible: boolean;
  onClose: () => void;
  editingGroup?: FilterGroup;
}

export default function FilterGroupEditor({ visible, onClose, editingGroup }: FilterGroupEditorProps) {
  const dispatch = useAppDispatch();
  const allData = useAppSelector(selectFilteredData);

  // Form state
  const [groupName, setGroupName] = useState<string>(editingGroup?.name || '');
  const [groupDescription, setGroupDescription] = useState<string>(editingGroup?.description || '');
  const [filters, setFilters] = useState<PartialFilter[]>(editingGroup?.filters || []);

  // Reset form when editing group changes
  useEffect(() => {
    if (editingGroup) {
      setGroupName(editingGroup.name);
      setGroupDescription(editingGroup.description || '');
      setFilters(editingGroup.filters);
    } else {
      setGroupName('');
      setGroupDescription('');
      setFilters([]);
    }
  }, [editingGroup, visible]);

  // Calculate how many categories match the current filters
  const matchingCount = React.useMemo(() => {
    if (filters.length === 0) return allData.length;

    // Create a temporary filter group for evaluation
    const tempGroup: FilterGroup = {
      id: 'temp',
      name: 'temp',
      filters: filters.filter(f => f.field && f.operator) as Filter[],
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const matched = applyFilterGroups(allData, [tempGroup]);
    return matched.length;
  }, [filters, allData]);

  const handleAddFilter = () => {
    setFilters([...filters, { enabled: true }]);
  };

  const handleUpdateFilter = (index: number, filterData: PartialFilter) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...filterData };
    setFilters(newFilters);
  };

  const handleDeleteFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      return;
    }

    // Filter out incomplete filters
    const completeFilters = filters.filter(f => f.field && f.operator) as Filter[];

    if (editingGroup) {
      // Update existing group
      dispatch(updateFilterGroup({
        id: editingGroup.id,
        changes: {
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          filters: completeFilters,
        },
      }));
    } else {
      // Create new group
      dispatch(addFilterGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        filters: completeFilters.map(f => ({ ...f, id: nanoid() })) as Filter[],
        enabled: true,
      }));
    }

    handleClose();
  };

  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setFilters([]);
    onClose();
  };

  const isValid = groupName.trim().length > 0 && filters.some(f => f.field && f.operator);

  return (
    <Modal
      title={editingGroup ? 'Edit Filter Group' : 'Create Filter Group'}
      open={visible}
      onCancel={handleClose}
      onOk={handleSave}
      okText="Save"
      okButtonProps={{ disabled: !isValid }}
      width={700}
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Group Name */}
        <div>
          <Text strong>Group Name *</Text>
          <Input
            placeholder="e.g., High Confidence"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Group Description */}
        <div>
          <Text strong>Description (optional)</Text>
          <TextArea
            placeholder="Describe what this filter group does..."
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            rows={2}
            style={{ marginTop: 4 }}
          />
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* Filters Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong>Filters (AND logic)</Text>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddFilter}
            >
              Add Filter
            </Button>
          </div>

          {filters.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: '#999', border: '1px dashed #d9d9d9', borderRadius: 4 }}>
              No filters added yet. Click "Add Filter" to get started.
            </div>
          )}

          {filters.map((filter, index) => (
            <FilterBuilder
              key={index}
              filter={filter}
              onChange={(filterData) => handleUpdateFilter(index, filterData)}
              onDelete={() => handleDeleteFilter(index)}
              showDelete={filters.length > 1}
            />
          ))}
        </div>

        {/* Matching Count Preview */}
        {filters.length > 0 && (
          <div style={{ padding: 12, background: '#f0f5ff', borderRadius: 4, border: '1px solid #adc6ff' }}>
            <Space>
              <Text strong>Matching Categories:</Text>
              <Tag color="blue">{matchingCount} / {allData.length}</Tag>
              <Text type="secondary">({((matchingCount / allData.length) * 100).toFixed(1)}%)</Text>
            </Space>
          </div>
        )}
      </Space>
    </Modal>
  );
}
