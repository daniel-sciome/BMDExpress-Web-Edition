/**
 * BmdMetricSelector Component
 *
 * Reusable dropdown(s) for selecting BMD metrics across charts.
 * Supports selecting base type (BMD/BMDL/BMDU) and statistic type.
 */

import React from 'react';
import { Select, Space, Typography } from 'antd';
import {
  BmdBaseType,
  BmdStatType,
  BASE_OPTIONS,
  STAT_OPTIONS,
} from './utils/bmdMetricConfig';

const { Text } = Typography;

interface BmdMetricSelectorProps {
  /** Current base type (bmd, bmdl, bmdu) */
  base: BmdBaseType;
  /** Current statistic type */
  stat: BmdStatType;
  /** Callback when base type changes */
  onBaseChange: (base: BmdBaseType) => void;
  /** Callback when statistic type changes */
  onStatChange: (stat: BmdStatType) => void;
  /** Whether to show the base type selector (default: true) */
  showBase?: boolean;
  /** Whether to show a label before the selectors (default: false) */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Compact mode for tight layouts */
  compact?: boolean;
  /** Disable the selectors */
  disabled?: boolean;
}

export default function BmdMetricSelector({
  base,
  stat,
  onBaseChange,
  onStatChange,
  showBase = true,
  showLabel = false,
  label = 'Metric:',
  compact = false,
  disabled = false,
}: BmdMetricSelectorProps) {
  return (
    <Space size={compact ? 4 : 8} align="center">
      {showLabel && (
        <Text style={{ fontSize: '12px', color: '#666' }}>{label}</Text>
      )}
      {showBase && (
        <Select
          value={base}
          onChange={onBaseChange}
          options={BASE_OPTIONS}
          size="small"
          style={{ width: 75 }}
          disabled={disabled}
        />
      )}
      <Select
        value={stat}
        onChange={onStatChange}
        options={STAT_OPTIONS}
        size="small"
        style={{ width: compact ? 115 : 135 }}
        disabled={disabled}
        popupMatchSelectWidth={false}
      />
    </Space>
  );
}

/**
 * Simplified selector for charts that only need statistic selection
 * (base type is fixed to BMD, BMDL, or BMDU)
 */
interface StatOnlySelectorProps {
  stat: BmdStatType;
  onStatChange: (stat: BmdStatType) => void;
  showLabel?: boolean;
  label?: string;
  compact?: boolean;
  disabled?: boolean;
}

export function BmdStatSelector({
  stat,
  onStatChange,
  showLabel = false,
  label = 'Statistic:',
  compact = false,
  disabled = false,
}: StatOnlySelectorProps) {
  return (
    <Space size={compact ? 4 : 8} align="center">
      {showLabel && (
        <Text style={{ fontSize: '12px', color: '#666' }}>{label}</Text>
      )}
      <Select
        value={stat}
        onChange={onStatChange}
        options={STAT_OPTIONS}
        size="small"
        style={{ width: compact ? 115 : 135 }}
        disabled={disabled}
        popupMatchSelectWidth={false}
      />
    </Space>
  );
}
