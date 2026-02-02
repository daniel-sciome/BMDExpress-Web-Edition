/**
 * FilterGroupList Component
 *
 * Displays filter groups in collapsible panels
 * - Show/hide filter groups
 * - Toggle enabled/disabled
 * - Edit/delete groups
 * - View filters within each group
 */

import React, { useState } from 'react';
import { Button, Space, Tooltip, Typography, Tag, Popconfirm, Collapse, Checkbox } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllFilterGroups, toggleFilterGroup, deleteFilterGroup } from '../../store/slices/filterSlice';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { getCategoryIdsForFilterGroup } from '../../utils/filterEvaluation';
import { FIELD_METADATA } from '../../utils/filterMetadata';
import FilterGroupEditor from './FilterGroupEditor';
import PrimaryFilter from '../PrimaryFilter';
import type { FilterGroup, Filter } from '../../types/filterTypes';
import { getRememberFiltersPreference, setRememberFiltersPreference } from '../../utils/filterGroupPersistence';

const { Text } = Typography;

export default function FilterGroupList() {
  const dispatch = useAppDispatch();
  const filterGroups = useAppSelector(selectAllFilterGroups);
  const allData = useAppSelector(selectFilteredData);
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const filters = useAppSelector((state) => state.categoryResults.filters);

  // Calculate active filter count for Primary Filter title
  const activeFilterCount = Object.entries(filters).filter(
    ([_, value]) => value !== undefined && value !== null
  ).length;

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FilterGroup | undefined>(undefined);
  const [rememberFilters, setRememberFilters] = useState<boolean>(() => getRememberFiltersPreference());

  // Update localStorage when remember filters preference changes
  const handleRememberFiltersChange = (checked: boolean) => {
    const wasEnabled = rememberFilters;
    setRememberFilters(checked);
    setRememberFiltersPreference(checked);

    // Only reload if user just disabled it (going from true to false)
    if (wasEnabled && !checked) {
      window.location.reload();
    }
  };

  // Only show filters when a project is selected
  if (!selectedProject) {
    return null;
  }

  // Handle creating new filter group
  const handleCreate = () => {
    setEditingGroup(undefined);
    setEditorVisible(true);
  };

  // Handle editing filter group
  const handleEdit = (group: FilterGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
    setEditorVisible(true);
  };

  // Handle deleting filter group
  const handleDelete = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteFilterGroup(groupId));
  };

  // Handle toggling filter group enabled state
  const handleToggle = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFilterGroup(groupId));
  };

  // Format filter for display
  const formatFilter = (filter: Filter): string => {
    const field = FIELD_METADATA[filter.field];
    if (!field) return 'Unknown filter';

    let valueStr = '';
    if ('value' in filter) {
      if (typeof filter.value === 'number') {
        valueStr = filter.value.toFixed(4);
      } else {
        valueStr = filter.value;
      }
    }

    if ('maxValue' in filter && filter.maxValue !== undefined) {
      valueStr += ` - ${filter.maxValue.toFixed(4)}`;
    }

    if ('values' in filter && filter.values) {
      valueStr = filter.values.join(', ');
    }

    const operatorSymbols: Record<string, string> = {
      equals: '=',
      notEquals: '≠',
      lessThan: '<',
      lessThanOrEqual: '≤',
      greaterThan: '>',
      greaterThanOrEqual: '≥',
      between: '≤ x ≤',
      notBetween: '< x >',
      in: '∈',
      notIn: '∉',
    };

    const symbol = operatorSymbols[filter.operator] || filter.operator;

    return `${field.label} ${symbol} ${valueStr}`;
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* Header with create button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size="small">
          <Text strong style={{ fontSize: '13px', color: '#262626' }}>
            Filters
          </Text>
          <Tag color="default" style={{ fontSize: '11px' }}>
            {filterGroups.length + 1} groups
          </Tag>
        </Space>
        <Tooltip title="Create filter group">
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          />
        </Tooltip>
      </div>

      {/* Primary Filters - independent Collapse */}
      <Collapse
        size="small"
        items={[{
          key: 'primary-filters',
          label: (
            <Space size="small">
              <Text strong>Primary Filters</Text>
              {activeFilterCount > 0 && (
                <Tag color="green" style={{ fontSize: '11px' }}>
                  {activeFilterCount} active
                </Tag>
              )}
            </Space>
          ),
          children: <PrimaryFilter hideCard={true} vertical={true} />,
        }]}
        defaultActiveKey={['primary-filters']}
        style={{ marginBottom: 8 }}
      />

      {/* Other filter groups - each as independent Collapse */}
      {filterGroups.map((group) => {
        const matchingCount = getCategoryIdsForFilterGroup(allData, group).length;
        return (
          <Collapse
            key={group.id}
            size="small"
            items={[{
              key: group.id,
              label: (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <Space size="small">
                    <Text
                      strong
                      style={{
                        textDecoration: !group.enabled ? 'line-through' : 'none',
                        opacity: group.enabled ? 1 : 0.5,
                      }}
                    >
                      {group.name}
                    </Text>
                    {group.enabled && (
                      <Tag color="blue" style={{ fontSize: '11px' }}>
                        {matchingCount}
                      </Tag>
                    )}
                  </Space>
                  <Space size="small" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={group.enabled ? 'Disable' : 'Enable'}>
                      <Button
                        type="text"
                        size="small"
                        icon={group.enabled ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={(e) => handleToggle(group.id, e)}
                        style={{ opacity: 0.7 }}
                      />
                    </Tooltip>
                    <Tooltip title="Edit">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => handleEdit(group, e)}
                        style={{ opacity: 0.7 }}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Delete filter group?"
                      description="This action cannot be undone."
                      onConfirm={(e) => handleDelete(group.id, e!)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                        style={{ opacity: 0.7 }}
                      />
                    </Popconfirm>
                  </Space>
                </div>
              ),
              children: (
                <div style={{ paddingLeft: 8 }}>
                  {group.description && (
                    <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic', display: 'block', marginBottom: 8 }}>
                      {group.description}
                    </Text>
                  )}
                  {group.filters.map((filter, index) => (
                    <div key={index} style={{ opacity: filter.enabled ? 1 : 0.5, marginBottom: 4 }}>
                      <Text style={{ fontSize: '12px', textDecoration: !filter.enabled ? 'line-through' : 'none' }}>
                        {formatFilter(filter)}
                      </Text>
                      {!filter.enabled && (
                        <Tag color="default" style={{ marginLeft: 8, fontSize: '10px' }}>
                          Disabled
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              ),
            }]}
            style={{ marginBottom: 8 }}
          />
        );
      })}

      {/* Remember Filters checkbox */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
        <Checkbox
          checked={rememberFilters}
          onChange={(e) => handleRememberFiltersChange(e.target.checked)}
          style={{ fontSize: '12px' }}
        >
          Remember filter settings
        </Checkbox>
      </div>

      {/* Filter Group Editor Modal */}
      <FilterGroupEditor
        visible={editorVisible}
        onClose={() => {
          setEditorVisible(false);
          setEditingGroup(undefined);
        }}
        editingGroup={editingGroup}
      />
    </div>
  );
}
