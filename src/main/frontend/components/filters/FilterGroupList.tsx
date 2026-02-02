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
  ClearOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllFilterGroups, toggleFilterGroup, deleteFilterGroup, updateFilterGroup } from '../../store/slices/filterSlice';
import { selectFilteredData } from '../../store/slices/categoryResultsSlice';
import { getCategoryIdsForFilterGroup } from '../../utils/filterEvaluation';
import { FIELD_METADATA } from '../../utils/filterMetadata';
import FilterGroupEditor from './FilterGroupEditor';
import FilterGroupEditorModal, { FilterConfig, FilterOperator, formatFilterDisplay, isBetweenOperator, isFilterActive } from './FilterGroupEditorModal';
import PrimaryFilter from '../PrimaryFilter';
import type { FilterGroup, Filter, NumericFilter } from '../../types/filterTypes';
import { getRememberFiltersPreference, setRememberFiltersPreference } from '../../utils/filterGroupPersistence';

/**
 * Convert Redux Filter to FilterConfig for modal editing
 * Note: If filter.enabled is false, we treat it as "all" (value undefined)
 */
function filterToConfig(filter: Filter): FilterConfig {
  const field = FIELD_METADATA[filter.field];
  let operator: FilterOperator = '>=';

  // Map old operators to new format
  if ('operator' in filter) {
    switch (filter.operator) {
      case 'greaterThan': operator = '>'; break;
      case 'greaterThanOrEqual': operator = '>='; break;
      case 'lessThan': operator = '<'; break;
      case 'lessThanOrEqual': operator = '<='; break;
      case 'between': operator = '[between]'; break;
      default: operator = '>=';
    }
  }

  // If filter was disabled, treat as "all" (no value)
  const hasValue = filter.enabled && 'value' in filter && typeof filter.value === 'number';

  return {
    id: filter.id,
    label: field?.label || filter.field,
    operator,
    value: hasValue ? (filter as NumericFilter).value : undefined,
    maxValue: hasValue && 'maxValue' in filter ? filter.maxValue : undefined,
    step: field?.name.includes('PValue') ? 0.001 : 1,
    precision: field?.name.includes('PValue') ? 4 : 0,
  };
}

/**
 * Convert FilterConfig back to Redux Filter format
 * Note: enabled is set based on whether value is defined (not "all")
 */
function configToFilter(config: FilterConfig, originalFilter: Filter): Filter {
  // Map new operators to old format
  let operator: string;
  switch (config.operator) {
    case '>': operator = 'greaterThan'; break;
    case '>=': operator = 'greaterThanOrEqual'; break;
    case '<': operator = 'lessThan'; break;
    case '<=': operator = 'lessThanOrEqual'; break;
    case '[between]':
    case 'between':
    case '[between':
    case 'between]':
      operator = 'between'; break;
    default: operator = 'greaterThanOrEqual';
  }

  // enabled = true if value is set (not "all")
  const isActive = isFilterActive(config);

  return {
    ...originalFilter,
    operator: operator as any,
    value: config.value ?? 0,
    maxValue: isBetweenOperator(config.operator) ? config.maxValue : undefined,
    enabled: isActive,
  } as Filter;
}

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

  // State for secondary group modal editing
  const [secondaryEditorVisible, setSecondaryEditorVisible] = useState(false);
  const [editingSecondaryGroup, setEditingSecondaryGroup] = useState<FilterGroup | null>(null);

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

  // Handle editing filter group (opens new modal)
  const handleEdit = (group: FilterGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSecondaryGroup(group);
    setSecondaryEditorVisible(true);
  };

  // Handle saving filter group from modal
  const handleSaveSecondaryGroup = (configs: FilterConfig[]) => {
    if (!editingSecondaryGroup) return;

    // Convert configs back to filters
    const updatedFilters = configs.map((config, index) =>
      configToFilter(config, editingSecondaryGroup.filters[index])
    );

    dispatch(updateFilterGroup({
      id: editingSecondaryGroup.id,
      changes: { filters: updatedFilters },
    }));
  };

  // Handle clearing all filters in a group (set to "all")
  const handleClearGroup = (group: FilterGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    // Set all filters to "all" by disabling them (they'll show as "all" in display)
    const clearedFilters = group.filters.map(f => ({ ...f, enabled: false }));
    dispatch(updateFilterGroup({
      id: group.id,
      changes: { filters: clearedFilters as Filter[] },
    }));
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

  // Format filter for display using new format
  const formatFilter = (filter: Filter): string => {
    const config = filterToConfig(filter);
    return formatFilterDisplay(config);
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
                    <Tooltip title={group.enabled ? 'Disable group' : 'Enable group'}>
                      <Button
                        type="text"
                        size="small"
                        icon={group.enabled ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={(e) => handleToggle(group.id, e)}
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
                <div style={{ paddingLeft: 0 }}>
                  {/* Action buttons at top */}
                  <Space size={8} style={{ marginBottom: 12 }}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => handleEdit(group, e)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={(e) => handleClearGroup(group, e)}
                    >
                      Clear All
                    </Button>
                  </Space>

                  {group.description && (
                    <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic', display: 'block', marginBottom: 8 }}>
                      {group.description}
                    </Text>
                  )}

                  {/* Filter list as text */}
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    {group.filters.map((filter) => (
                      <Text
                        key={filter.id}
                        style={{ fontSize: '12px' }}
                      >
                        {formatFilter(filter)}
                      </Text>
                    ))}
                  </Space>
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

      {/* Filter Group Editor Modal - for creating new groups */}
      <FilterGroupEditor
        visible={editorVisible}
        onClose={() => {
          setEditorVisible(false);
          setEditingGroup(undefined);
        }}
        editingGroup={editingGroup}
      />

      {/* Secondary Group Editor Modal - for editing existing groups */}
      {editingSecondaryGroup && (
        <FilterGroupEditorModal
          visible={secondaryEditorVisible}
          onClose={() => {
            setSecondaryEditorVisible(false);
            setEditingSecondaryGroup(null);
          }}
          onSave={handleSaveSecondaryGroup}
          filters={editingSecondaryGroup.filters.map(filterToConfig)}
          title={`Edit ${editingSecondaryGroup.name}`}
        />
      )}
    </div>
  );
}
