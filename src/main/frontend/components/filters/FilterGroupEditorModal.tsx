/**
 * FilterGroupEditorModal Component
 *
 * Reusable modal for editing a group of numeric filters.
 * Each filter has:
 * - Label
 * - Operator dropdown: <, <=, >, >=, between, [between], [between, between]
 * - One or two value inputs depending on operator
 */

import React, { useState, useEffect } from 'react';
import { Modal, Select, InputNumber, Space, Typography, Button } from 'antd';

const { Text } = Typography;

/**
 * Operator types using interval notation for "between" variants
 */
export type FilterOperator =
  | '<'
  | '<='
  | '>'
  | '>='
  | 'between'      // exclusive: min < x < max
  | '[between]'    // inclusive: min <= x <= max
  | '[between'     // left inclusive: min <= x < max
  | 'between]';    // right inclusive: min < x <= max

/**
 * Single filter configuration
 * Note: "all" means no filtering (value undefined)
 */
export interface FilterConfig {
  id: string;
  label: string;
  operator: FilterOperator;
  value: number | undefined;  // undefined = "all" (no filtering)
  maxValue?: number;          // For between operators
  step?: number;              // Input step (default 1)
  precision?: number;         // Decimal places (default 0)
  min?: number;               // Minimum allowed value
  max?: number;               // Maximum allowed value
}

/**
 * Check if operator requires two values
 */
export function isBetweenOperator(op: FilterOperator): boolean {
  return op === 'between' || op === '[between]' || op === '[between' || op === 'between]';
}

/**
 * Check if a filter is active (has a value set)
 */
export function isFilterActive(filter: FilterConfig): boolean {
  if (filter.value === undefined) return false;
  if (isBetweenOperator(filter.operator) && filter.maxValue === undefined) return false;
  return true;
}

/**
 * Format a filter for display as text
 * Shows "all" when no filtering, otherwise shows operator and value(s)
 */
export function formatFilterDisplay(filter: FilterConfig): string {
  if (filter.value === undefined) {
    return `${filter.label}: all`;
  }

  if (isBetweenOperator(filter.operator)) {
    if (filter.maxValue === undefined) {
      return `${filter.label}: all`;
    }
    return `${filter.label}: ${filter.operator} ${filter.value} and ${filter.maxValue}`;
  }

  return `${filter.label}: ${filter.operator} ${filter.value}`;
}

interface FilterGroupEditorModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (filters: FilterConfig[]) => void;
  filters: FilterConfig[];
  title?: string;
}

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: '>=', label: '>=' },
  { value: '>', label: '>' },
  { value: '<=', label: '<=' },
  { value: '<', label: '<' },
  { value: '[between]', label: '[between]' },
  { value: 'between', label: 'between' },
  { value: '[between', label: '[between' },
  { value: 'between]', label: 'between]' },
];

export default function FilterGroupEditorModal({
  visible,
  onClose,
  onSave,
  filters,
  title = 'Edit Filters',
}: FilterGroupEditorModalProps) {
  // Local state for editing
  const [localFilters, setLocalFilters] = useState<FilterConfig[]>([]);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters.map(f => ({ ...f })));
    }
  }, [visible, filters]);

  const handleFilterChange = (index: number, changes: Partial<FilterConfig>) => {
    setLocalFilters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...changes };

      // Clear maxValue if switching from between to non-between operator
      if (changes.operator && !isBetweenOperator(changes.operator)) {
        updated[index].maxValue = undefined;
      }

      return updated;
    });
  };

  // Set a filter to "all" (clear values)
  const handleSetToAll = (index: number) => {
    setLocalFilters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: undefined, maxValue: undefined };
      return updated;
    });
  };

  const handleSave = () => {
    onSave(localFilters);
    onClose();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText="Save"
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {localFilters.map((filter, index) => {
          const isActive = isFilterActive(filter);
          return (
            <div
              key={filter.id}
              style={{
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Label */}
              <Text strong style={{ minWidth: 140 }}>{filter.label}</Text>

              {/* Operator selector */}
              <Select
                value={filter.operator}
                onChange={(op) => handleFilterChange(index, { operator: op })}
                style={{ width: 100 }}
                size="small"
              >
                {OPERATORS.map(op => (
                  <Select.Option key={op.value} value={op.value}>
                    {op.label}
                  </Select.Option>
                ))}
              </Select>

              {/* Value input(s) */}
              <InputNumber
                value={filter.value}
                onChange={(val) => handleFilterChange(index, { value: val ?? undefined })}
                style={{ width: 80 }}
                step={filter.step ?? 1}
                precision={filter.precision ?? 0}
                min={filter.min}
                max={filter.max}
                size="small"
                placeholder="all"
              />

              {isBetweenOperator(filter.operator) && (
                <>
                  <Text type="secondary" style={{ fontSize: '12px' }}>and</Text>
                  <InputNumber
                    value={filter.maxValue}
                    onChange={(val) => handleFilterChange(index, { maxValue: val ?? undefined })}
                    style={{ width: 80 }}
                    step={filter.step ?? 1}
                    precision={filter.precision ?? 0}
                    min={filter.min}
                    max={filter.max}
                    size="small"
                    placeholder="max"
                  />
                </>
              )}

              {/* Set to All button */}
              {isActive && (
                <Button
                  size="small"
                  type="link"
                  onClick={() => handleSetToAll(index)}
                  style={{ padding: '0 4px', fontSize: '12px' }}
                >
                  all
                </Button>
              )}
            </div>
          );
        })}
      </Space>
    </Modal>
  );
}
