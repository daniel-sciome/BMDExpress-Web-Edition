/**
 * FilterBuilder Component
 *
 * UI for building a single filter
 * - Select field from categorized dropdown
 * - Select operator
 * - Input value(s)
 */

import React, { useState, useEffect } from 'react';
import { Select, InputNumber, Checkbox, Space, Button, Row, Col } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { Filter, PartialFilter, NumericFilter, CategoricalFilter, FilterableFieldName, FilterOperator } from '../../types/filterTypes';
import { FIELD_METADATA, NUMERIC_OPERATORS, CATEGORICAL_OPERATORS, DIRECTION_VALUES, getFieldsByCategory } from '../../utils/filterMetadata';

const { Option, OptGroup } = Select;

interface FilterBuilderProps {
  filter?: Filter | PartialFilter;
  onChange: (filter: PartialFilter) => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export default function FilterBuilder({ filter, onChange, onDelete, showDelete = true }: FilterBuilderProps) {
  const [selectedField, setSelectedField] = useState<FilterableFieldName | undefined>(filter?.field);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator | undefined>(filter?.operator);
  const [value, setValue] = useState<number | string | undefined>(
    filter && 'value' in filter ? filter.value : undefined
  );
  const [maxValue, setMaxValue] = useState<number | undefined>(
    filter && 'maxValue' in filter ? filter.maxValue : undefined
  );
  const [selectedValues, setSelectedValues] = useState<string[]>(
    filter && 'values' in filter && filter.values ? filter.values : []
  );
  const [enabled, setEnabled] = useState<boolean>(filter?.enabled ?? true);

  // Get field metadata
  const fieldMetadata = selectedField ? FIELD_METADATA[selectedField] : undefined;
  const isNumeric = fieldMetadata?.type === 'numeric';
  const isCategorical = fieldMetadata?.type === 'categorical';

  // Get available operators based on field type
  const availableOperators = isNumeric ? NUMERIC_OPERATORS : isCategorical ? CATEGORICAL_OPERATORS : [];

  // Get operator metadata
  const operatorMetadata = availableOperators.find(op => op.operator === selectedOperator);

  // Update parent whenever values change
  useEffect(() => {
    if (!selectedField || !selectedOperator) return;

    const filterData: PartialFilter = {
      field: selectedField,
      operator: selectedOperator,
      enabled,
    };

    if (isNumeric && value !== undefined) {
      filterData.value = value as number;
      if (operatorMetadata?.requiresMaxValue && maxValue !== undefined) {
        filterData.maxValue = maxValue;
      }
    } else if (isCategorical) {
      if (selectedOperator === 'in' || selectedOperator === 'notIn') {
        filterData.values = selectedValues;
      } else if (value !== undefined) {
        filterData.value = value as string;
      }
    }

    onChange(filterData);
  }, [selectedField, selectedOperator, value, maxValue, selectedValues, enabled, isNumeric, isCategorical, operatorMetadata, onChange]);

  // Group fields by category
  const fieldsByCategory = getFieldsByCategory();

  return (
    <div style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: 4, marginBottom: 8 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* Header with enabled checkbox and delete button */}
        <Row justify="space-between" align="middle">
          <Col>
            <Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)}>
              Enabled
            </Checkbox>
          </Col>
          {showDelete && onDelete && (
            <Col>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={onDelete}
              />
            </Col>
          )}
        </Row>

        {/* Field selector */}
        <Select
          placeholder="Select field"
          value={selectedField}
          onChange={(field) => {
            setSelectedField(field);
            setSelectedOperator(undefined); // Reset operator when field changes
            setValue(undefined);
            setMaxValue(undefined);
            setSelectedValues([]);
          }}
          style={{ width: '100%' }}
          showSearch
          filterOption={(input, option) =>
            (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {Object.entries(fieldsByCategory).map(([category, fields]) => (
            <OptGroup key={category} label={category}>
              {fields.map((field) => (
                <Option key={field.name} value={field.name} label={field.label}>
                  {field.label}
                  {field.unit && ` (${field.unit})`}
                </Option>
              ))}
            </OptGroup>
          ))}
        </Select>

        {/* Operator selector */}
        {selectedField && (
          <Select
            placeholder="Select operator"
            value={selectedOperator}
            onChange={setSelectedOperator}
            style={{ width: '100%' }}
          >
            {availableOperators.map((op) => (
              <Option key={op.operator} value={op.operator}>
                {op.label} ({op.symbol})
              </Option>
            ))}
          </Select>
        )}

        {/* Value input(s) */}
        {selectedField && selectedOperator && (
          <>
            {/* Numeric value input */}
            {isNumeric && operatorMetadata?.requiresValue && (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <InputNumber
                  placeholder="Value"
                  value={value as number}
                  onChange={(val) => setValue(val ?? undefined)}
                  style={{ width: '100%' }}
                  step={selectedField.includes('PValue') ? 0.001 : 0.1}
                />
                {operatorMetadata.requiresMaxValue && (
                  <InputNumber
                    placeholder="Max value"
                    value={maxValue}
                    onChange={(val) => setMaxValue(val ?? undefined)}
                    style={{ width: '100%' }}
                    step={selectedField.includes('PValue') ? 0.001 : 0.1}
                  />
                )}
              </Space>
            )}

            {/* Categorical value input */}
            {isCategorical && (
              <>
                {(selectedOperator === 'equals' || selectedOperator === 'notEquals') && (
                  <Select
                    placeholder="Select value"
                    value={value as string}
                    onChange={(val) => setValue(val)}
                    style={{ width: '100%' }}
                  >
                    {DIRECTION_VALUES.map((dir) => (
                      <Option key={dir} value={dir}>
                        {dir}
                      </Option>
                    ))}
                  </Select>
                )}

                {(selectedOperator === 'in' || selectedOperator === 'notIn') && (
                  <Select
                    mode="multiple"
                    placeholder="Select values"
                    value={selectedValues}
                    onChange={setSelectedValues}
                    style={{ width: '100%' }}
                  >
                    {DIRECTION_VALUES.map((dir) => (
                      <Option key={dir} value={dir}>
                        {dir}
                      </Option>
                    ))}
                  </Select>
                )}
              </>
            )}
          </>
        )}
      </Space>
    </div>
  );
}
