/**
 * FilterGroupList Component
 *
 * Displays filter groups in a collapsible tree format
 * - Show/hide filter groups
 * - Toggle enabled/disabled
 * - Edit/delete groups
 * - View filters within each group
 */

import React, { useState, useEffect } from 'react';
import { Tree, Button, Space, Tooltip, Typography, Tag, Popconfirm, Collapse, Checkbox } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllFilterGroups, toggleFilterGroup, deleteFilterGroup } from '../../store/slices/filterSlice';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { getCategoryIdsForFilterGroup } from '../../utils/filterEvaluation';
import { FIELD_METADATA } from '../../utils/filterMetadata';
import FilterGroupEditor from './FilterGroupEditor';
import type { FilterGroup, Filter } from '../../types/filterTypes';
import { getRememberFiltersPreference, setRememberFiltersPreference } from '../../utils/filterGroupPersistence';

const { Text } = Typography;

export default function FilterGroupList() {
  const dispatch = useAppDispatch();
  const filterGroups = useAppSelector(selectAllFilterGroups);
  const allData = useAppSelector(selectFilteredData);
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FilterGroup | undefined>(undefined);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
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

  // Build tree data from filter groups
  const treeData: DataNode[] = filterGroups.map((group) => {
    const matchingCount = getCategoryIdsForFilterGroup(allData, group).length;

    return {
      key: group.id,
      title: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0',
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
          <Space size="small">
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
      children: [
        ...(group.description
          ? [
              {
                key: `${group.id}-description`,
                title: (
                  <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                    {group.description}
                  </Text>
                ),
                isLeaf: true,
                selectable: false,
              },
            ]
          : []),
        ...group.filters.map((filter, index) => ({
          key: `${group.id}-filter-${index}`,
          title: (
            <div style={{ opacity: filter.enabled ? 1 : 0.5 }}>
              <Text style={{ fontSize: '12px', textDecoration: !filter.enabled ? 'line-through' : 'none' }}>
                {formatFilter(filter)}
              </Text>
              {!filter.enabled && (
                <Tag color="default" style={{ marginLeft: 8, fontSize: '10px' }}>
                  Disabled
                </Tag>
              )}
            </div>
          ),
          isLeaf: true,
          selectable: false,
        })),
      ],
    };
  });

  // Build collapse items
  const collapseItems = [
    {
      key: '1',
      label: (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Text strong style={{ fontSize: '13px', color: '#262626' }}>
            Filters
          </Text>
          {filterGroups.length > 0 && (
            <Tag color="default" style={{ fontSize: '11px' }}>
              {filterGroups.length} {filterGroups.length === 1 ? 'group' : 'groups'}
            </Tag>
          )}
          <Tooltip title="Create filter group">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleCreate();
              }}
            />
          </Tooltip>
        </div>
      ),
      children: (
        <>
          {/* Filter groups tree */}
          {filterGroups.length === 0 ? (
            <div
              style={{
                padding: '16px 8px',
                textAlign: 'center',
                color: '#999',
                fontSize: '12px',
              }}
            >
              No filter groups yet.
              <br />
              Click + to create one.
            </div>
          ) : (
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys)}
              showLine
              switcherIcon={<DownOutlined />}
              selectable={false}
            />
          )}

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
        </>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Collapse
        defaultActiveKey={['1']}
        items={collapseItems}
        size="small"
      />

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
