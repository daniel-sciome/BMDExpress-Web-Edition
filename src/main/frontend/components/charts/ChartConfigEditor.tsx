/**
 * Chart Configuration Editor Component
 *
 * A modal dialog for editing chart configurations. Allows users to:
 * - Edit chart name
 * - Select fields for axes (X, Y, Size)
 * - Choose data transforms (log, -log, etc.)
 * - Configure options (log scale, top N)
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Space,
  Typography,
  Divider,
  Alert,
} from 'antd';
import type {
  ChartConfiguration,
  ChartConfigurationInput,
  ChartKey,
  ChartTransform,
  ChartType,
} from 'Frontend/types/chartConfiguration';
import {
  CATEGORY_FIELDS,
  getFieldsByCategory,
  FIELD_CATEGORIES,
  type ChartFieldDef,
} from 'Frontend/utils/chartFields';

const { Text } = Typography;
const { Option, OptGroup } = Select;

interface ChartConfigEditorProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The configuration being edited (null for new chart) */
  config: ChartConfiguration | null;
  /** Called when user saves changes */
  onSave: (config: ChartConfigurationInput) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Whether this is creating a new chart (enables chart type selection) */
  isNew?: boolean;
}

/**
 * Chart type options for the dropdown.
 */
const CHART_TYPE_OPTIONS: { value: ChartType; label: string; description: string }[] = [
  {
    value: 'scatter',
    label: 'Scatter Plot',
    description: 'X-Y scatter plot of two numeric fields',
  },
  {
    value: 'bubble',
    label: 'Bubble Chart',
    description: 'Scatter plot with bubble size representing a third field',
  },
  {
    value: 'histogram',
    label: 'Histogram',
    description: 'Distribution of a single numeric field',
  },
  {
    value: 'bar',
    label: 'Bar Chart',
    description: 'Bar chart of categories sorted by a numeric field',
  },
];

/**
 * Transform options for the dropdown.
 */
const TRANSFORM_OPTIONS: { value: ChartTransform; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'log10', label: 'Log\u2081\u2080' },
  { value: 'negLog10', label: '-Log\u2081\u2080' },
  { value: 'abs', label: 'Absolute Value' },
  { value: 'sqrt', label: 'Square Root' },
];

/**
 * Get axis requirements for a chart type.
 */
function getAxisRequirements(chartType: ChartType): {
  x: { required: boolean; label: string };
  y: { required: boolean; label: string };
  size: { required: boolean; label: string };
} {
  switch (chartType) {
    case 'scatter':
      return {
        x: { required: true, label: 'X-Axis' },
        y: { required: true, label: 'Y-Axis' },
        size: { required: false, label: 'Size (optional)' },
      };
    case 'bubble':
      return {
        x: { required: true, label: 'X-Axis' },
        y: { required: true, label: 'Y-Axis' },
        size: { required: true, label: 'Bubble Size' },
      };
    case 'histogram':
      return {
        x: { required: true, label: 'Value Field' },
        y: { required: false, label: '' },
        size: { required: false, label: '' },
      };
    case 'bar':
      return {
        x: { required: false, label: '' },
        y: { required: true, label: 'Value Field' },
        size: { required: false, label: '' },
      };
    default:
      return {
        x: { required: false, label: 'X-Axis' },
        y: { required: false, label: 'Y-Axis' },
        size: { required: false, label: 'Size' },
      };
  }
}

/**
 * Field selector component with grouped options.
 */
function FieldSelector({
  value,
  onChange,
  placeholder,
  allowClear = false,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const fieldsByCategory = useMemo(() => getFieldsByCategory(), []);

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      showSearch
      optionFilterProp="children"
      style={{ width: '100%' }}
    >
      {FIELD_CATEGORIES.map(category => {
        const fields = fieldsByCategory.get(category);
        if (!fields || fields.length === 0) return null;

        return (
          <OptGroup key={category} label={category}>
            {fields.map(field => (
              <Option key={field.field} value={field.field}>
                {field.label}
              </Option>
            ))}
          </OptGroup>
        );
      })}
    </Select>
  );
}

/**
 * Axis configuration row component.
 */
function AxisConfigRow({
  label,
  required,
  fieldValue,
  transformValue,
  onFieldChange,
  onTransformChange,
}: {
  label: string;
  required: boolean;
  fieldValue?: string;
  transformValue?: ChartTransform;
  onFieldChange: (value: string | undefined) => void;
  onTransformChange: (value: ChartTransform) => void;
}) {
  return (
    <Form.Item
      label={
        <Space>
          <Text strong>{label}</Text>
          {required && <Text type="danger">*</Text>}
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <FieldSelector
          value={fieldValue}
          onChange={onFieldChange}
          placeholder="Select field..."
          allowClear={!required}
        />
        {fieldValue && (
          <Select
            value={transformValue || 'none'}
            onChange={onTransformChange}
            style={{ width: 150 }}
            size="small"
          >
            {TRANSFORM_OPTIONS.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        )}
      </Space>
    </Form.Item>
  );
}

/**
 * ChartConfigEditor - Modal for editing chart configurations.
 */
export default function ChartConfigEditor({
  visible,
  config,
  onSave,
  onCancel,
  isNew = false,
}: ChartConfigEditorProps) {
  // Form state
  const [name, setName] = useState(config?.name || 'New Chart');
  const [chartType, setChartType] = useState<ChartType>(config?.chartType || 'scatter');
  const [xKey, setXKey] = useState<ChartKey | undefined>(config?.keys.x);
  const [yKey, setYKey] = useState<ChartKey | undefined>(config?.keys.y);
  const [sizeKey, setSizeKey] = useState<ChartKey | undefined>(config?.keys.size);
  const [xLogScale, setXLogScale] = useState(config?.options.xLogScale ?? false);
  const [yLogScale, setYLogScale] = useState(config?.options.yLogScale ?? false);
  const [topN, setTopN] = useState<number | 'All'>(config?.options.topN ?? 20);

  // Reset form when config changes
  React.useEffect(() => {
    if (config) {
      setName(config.name);
      setChartType(config.chartType);
      setXKey(config.keys.x);
      setYKey(config.keys.y);
      setSizeKey(config.keys.size);
      setXLogScale(config.options.xLogScale ?? false);
      setYLogScale(config.options.yLogScale ?? false);
      setTopN(config.options.topN ?? 20);
    } else {
      // New chart defaults
      setName('New Chart');
      setChartType('scatter');
      setXKey(undefined);
      setYKey(undefined);
      setSizeKey(undefined);
      setXLogScale(false);
      setYLogScale(false);
      setTopN(20);
    }
  }, [config, visible]);

  // Get axis requirements for current chart type
  const axisReqs = useMemo(() => getAxisRequirements(chartType), [chartType]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('Chart name is required');
    }

    if (axisReqs.x.required && !xKey?.field) {
      errors.push(`${axisReqs.x.label} field is required`);
    }

    if (axisReqs.y.required && !yKey?.field) {
      errors.push(`${axisReqs.y.label} field is required`);
    }

    if (axisReqs.size.required && !sizeKey?.field) {
      errors.push(`${axisReqs.size.label} field is required`);
    }

    return errors;
  }, [name, chartType, xKey, yKey, sizeKey, axisReqs]);

  const canSave = validationErrors.length === 0;

  // Handle save
  const handleSave = () => {
    if (!canSave) return;

    const result: ChartConfigurationInput = {
      id: config?.id,
      name: name.trim(),
      chartType,
      keys: {
        x: xKey,
        y: yKey,
        size: sizeKey,
      },
      options: {
        xLogScale,
        yLogScale,
        topN,
      },
      isPreset: config?.isPreset ?? false,
      isVisible: config?.isVisible ?? true,
      order: config?.order,
      groupId: config?.groupId ?? 'custom-charts',
    };

    onSave(result);
  };

  // Update key helpers
  const updateXKey = (field: string | undefined, transform?: ChartTransform) => {
    if (!field) {
      setXKey(undefined);
    } else {
      setXKey({ field, transform: transform ?? xKey?.transform ?? 'none' });
    }
  };

  const updateYKey = (field: string | undefined, transform?: ChartTransform) => {
    if (!field) {
      setYKey(undefined);
    } else {
      setYKey({ field, transform: transform ?? yKey?.transform ?? 'none' });
    }
  };

  const updateSizeKey = (field: string | undefined, transform?: ChartTransform) => {
    if (!field) {
      setSizeKey(undefined);
    } else {
      setSizeKey({ field, transform: transform ?? sizeKey?.transform ?? 'none' });
    }
  };

  return (
    <Modal
      title={isNew ? 'Create New Chart' : `Edit: ${config?.name || 'Chart'}`}
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      okText="Save"
      cancelText="Cancel"
      okButtonProps={{ disabled: !canSave }}
      width={600}
    >
      <Form layout="vertical">
        {/* Chart Name */}
        <Form.Item label="Chart Name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter chart name..."
          />
        </Form.Item>

        {/* Chart Type (only for new charts or non-presets) */}
        {(isNew || !config?.isPreset) && (
          <Form.Item label="Chart Type">
            <Select
              value={chartType}
              onChange={(value) => {
                setChartType(value);
                // Clear keys when type changes to avoid invalid configurations
                if (value === 'histogram') {
                  setYKey(undefined);
                  setSizeKey(undefined);
                } else if (value === 'bar') {
                  setXKey(undefined);
                  setSizeKey(undefined);
                }
              }}
              style={{ width: '100%' }}
            >
              {CHART_TYPE_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>
                  <div>
                    <Text strong>{opt.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '0.85em' }}>
                      {opt.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Divider>Axis Configuration</Divider>

        {/* X-Axis */}
        {axisReqs.x.label && (
          <AxisConfigRow
            label={axisReqs.x.label}
            required={axisReqs.x.required}
            fieldValue={xKey?.field}
            transformValue={xKey?.transform}
            onFieldChange={(field) => updateXKey(field)}
            onTransformChange={(transform) => xKey && updateXKey(xKey.field, transform)}
          />
        )}

        {/* Y-Axis */}
        {axisReqs.y.label && (
          <AxisConfigRow
            label={axisReqs.y.label}
            required={axisReqs.y.required}
            fieldValue={yKey?.field}
            transformValue={yKey?.transform}
            onFieldChange={(field) => updateYKey(field)}
            onTransformChange={(transform) => yKey && updateYKey(yKey.field, transform)}
          />
        )}

        {/* Size (for bubble charts) */}
        {axisReqs.size.label && (
          <AxisConfigRow
            label={axisReqs.size.label}
            required={axisReqs.size.required}
            fieldValue={sizeKey?.field}
            transformValue={sizeKey?.transform}
            onFieldChange={(field) => updateSizeKey(field)}
            onTransformChange={(transform) => sizeKey && updateSizeKey(sizeKey.field, transform)}
          />
        )}

        <Divider>Options</Divider>

        {/* Log Scale Options (for scatter/bubble) */}
        {(chartType === 'scatter' || chartType === 'bubble') && (
          <Space size="large">
            <Form.Item label="Log X-Axis" style={{ marginBottom: 0 }}>
              <Switch checked={xLogScale} onChange={setXLogScale} />
            </Form.Item>
            <Form.Item label="Log Y-Axis" style={{ marginBottom: 0 }}>
              <Switch checked={yLogScale} onChange={setYLogScale} />
            </Form.Item>
          </Space>
        )}

        {/* Top N (for bar charts) */}
        {chartType === 'bar' && (
          <Form.Item label="Top N Categories">
            <InputNumber
              value={topN === 'All' ? undefined : topN}
              onChange={(value) => setTopN(value ?? 'All')}
              min={1}
              max={100}
              placeholder="All"
              style={{ width: 120 }}
            />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              Leave empty for all categories
            </Text>
          </Form.Item>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert
            type="warning"
            message="Please fix the following:"
            description={
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            }
            style={{ marginTop: '1rem' }}
          />
        )}

        {/* Preset Warning */}
        {config?.isPreset && (
          <Alert
            type="info"
            message="This is a preset chart"
            description="Changes to preset charts will be saved locally. You can reset to defaults from the chart menu."
            style={{ marginTop: '1rem' }}
          />
        )}
      </Form>
    </Modal>
  );
}
