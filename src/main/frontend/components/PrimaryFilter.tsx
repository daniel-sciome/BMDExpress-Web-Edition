// PrimaryFilter.tsx
// Master filter component for global filtering of category results
// Uses modal-based editing with flexible operators

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Badge, Tooltip, Radio, Row, Col, Typography } from 'antd';
import { FilterOutlined, ClearOutlined, InfoCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateFiltersWithRenderState, clearFilters, setComparisonMode } from '../store/slices/categoryResultsSlice';
import FilterGroupEditorModal, {
  FilterConfig,
  formatFilterDisplay,
  isBetweenOperator,
  isFilterActive,
} from './filters/FilterGroupEditorModal';

const { Text } = Typography;

const STORAGE_KEY = 'bmdexpress_primary_filters_v2';

/**
 * Primary Filter Configuration
 * Single source of truth for filter definitions and Redux state mapping
 */
interface PrimaryFilterDefinition {
  id: string;
  label: string;
  defaultOperator: string;
  defaultValue: number;
  defaultMaxValue?: number;
  step: number;
  precision: number;
  min: number;
  max?: number;
  /** Redux state key for minimum value */
  reduxMinKey: string;
  /** Redux state key for maximum value */
  reduxMaxKey: string;
}

const PRIMARY_FILTER_DEFINITIONS: PrimaryFilterDefinition[] = [
  {
    id: 'percentage',
    label: 'Percentage',
    defaultOperator: '>=',
    defaultValue: 5,
    step: 0.1,
    precision: 2,
    min: 0,
    max: 100,
    reduxMinKey: 'percentageMin',
    reduxMaxKey: 'percentageMax',
  },
  {
    id: 'genesPassed',
    label: 'Genes Passed',
    defaultOperator: '>=',
    defaultValue: 3,
    step: 1,
    precision: 0,
    min: 0,
    reduxMinKey: 'genesPassedFiltersMin',
    reduxMaxKey: 'genesPassedFiltersMax',
  },
  {
    id: 'allGenes',
    label: 'All Genes',
    defaultOperator: '[between]',
    defaultValue: 40,
    defaultMaxValue: 500,
    step: 1,
    precision: 0,
    min: 0,
    reduxMinKey: 'allGenesMin',
    reduxMaxKey: 'allGenesMax',
  },
];

// Lookup map for filter definitions by ID
const FILTER_DEF_MAP = new Map(PRIMARY_FILTER_DEFINITIONS.map(d => [d.id, d]));

// Generate default filter configs from definitions
const DEFAULT_FILTER_CONFIGS: FilterConfig[] = PRIMARY_FILTER_DEFINITIONS.map(def => ({
  id: def.id,
  label: def.label,
  operator: def.defaultOperator as FilterConfig['operator'],
  value: def.defaultValue,
  maxValue: def.defaultMaxValue,
  step: def.step,
  precision: def.precision,
  min: def.min,
  max: def.max,
}));

interface PrimaryFilterProps {
  hideCard?: boolean;
  showComparisonMode?: boolean;
  vertical?: boolean;
}

/**
 * Convert FilterConfig[] to Redux-compatible filter state
 * Uses centralized filter definitions for key mapping
 */
function configsToReduxState(configs: FilterConfig[]): Record<string, number | undefined> {
  const state: Record<string, number | undefined> = {};

  for (const config of configs) {
    // Skip if no value set (means "all" - no filtering)
    if (config.value === undefined) continue;

    // Look up filter definition for Redux key mapping
    const def = FILTER_DEF_MAP.get(config.id);
    if (!def) continue;

    // Map operator to appropriate Redux keys
    if (config.operator === '>=' || config.operator === '>') {
      state[def.reduxMinKey] = config.value;
    } else if (config.operator === '<=' || config.operator === '<') {
      state[def.reduxMaxKey] = config.value;
    } else if (isBetweenOperator(config.operator)) {
      state[def.reduxMinKey] = config.value;
      state[def.reduxMaxKey] = config.maxValue;
    }
  }

  return state;
}

/**
 * Primary Filter Title Component
 * Exported for use in Collapse headers
 */
export function PrimaryFilterTitle({ activeCount }: { activeCount: number }) {
  return (
    <Space>
      <FilterOutlined />
      <span>Primary Filters</span>
      {activeCount > 0 && (
        <Badge count={activeCount} style={{ backgroundColor: '#52c41a' }} />
      )}
      <Tooltip title="Filter categories across all visualizations. Filters are global and persist across analyses. Not applied to GENE analyses.">
        <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
      </Tooltip>
    </Space>
  );
}

export default function PrimaryFilter({ hideCard = false, showComparisonMode = false, vertical = false }: PrimaryFilterProps) {
  const dispatch = useAppDispatch();
  const comparisonMode = useAppSelector(state => state.categoryResults.comparisonMode);

  // Filter configurations state
  const [filterConfigs, setFilterConfigs] = useState<FilterConfig[]>(DEFAULT_FILTER_CONFIGS);
  const [editorVisible, setEditorVisible] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let configsToLoad = DEFAULT_FILTER_CONFIGS;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          configsToLoad = parsed;
        }
      } catch (error) {
        console.error('Failed to load stored filters, using defaults:', error);
      }
    }

    setFilterConfigs(configsToLoad);
    // Auto-apply filters on mount
    dispatch(updateFiltersWithRenderState(configsToReduxState(configsToLoad)));
  }, [dispatch]);

  // Count active filters (those with values set, not "all")
  const activeFilterCount = filterConfigs.filter(f => isFilterActive(f)).length;

  // Handle save from modal
  const handleSave = (configs: FilterConfig[]) => {
    setFilterConfigs(configs);
    const reduxState = configsToReduxState(configs);
    dispatch(updateFiltersWithRenderState(reduxState));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  };

  // Handle reset to defaults
  const handleReset = () => {
    setFilterConfigs(DEFAULT_FILTER_CONFIGS);
    dispatch(updateFiltersWithRenderState(configsToReduxState(DEFAULT_FILTER_CONFIGS)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FILTER_CONFIGS));
  };

  // Handle show all (clear all filter values to "all")
  const handleShowAll = () => {
    const cleared = filterConfigs.map(f => ({ ...f, value: undefined, maxValue: undefined }));
    setFilterConfigs(cleared);
    dispatch(clearFilters());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
  };

  const filterContent = (
    <>
      {/* Action buttons at top */}
      <Space size={8} style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => setEditorVisible(true)}
        >
          Edit
        </Button>
        <Button size="small" icon={<ClearOutlined />} onClick={handleReset}>
          Reset
        </Button>
        <Button size="small" danger onClick={handleShowAll}>
          Clear All
        </Button>
      </Space>

      {/* Filter display as text */}
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {filterConfigs.map(filter => (
          <Text
            key={filter.id}
            style={{ fontSize: '13px' }}
          >
            {formatFilterDisplay(filter)}
          </Text>
        ))}
      </Space>

      {/* Multi-dataset Comparison Mode - only shown in multi-dataset context */}
      {showComparisonMode && (
        <Row style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Col span={24}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>
                Multi-Dataset Comparison Mode
                <Tooltip title="Controls how categories are combined when comparing multiple datasets">
                  <InfoCircleOutlined style={{ marginLeft: '8px', color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </div>
              <Radio.Group
                value={comparisonMode}
                onChange={(e) => dispatch(setComparisonMode(e.target.value))}
                size="small"
                style={{ width: '100%' }}
              >
                <Radio.Button value="intersection" style={{ width: '50%', textAlign: 'center' }}>
                  <Tooltip title="Show only categories that appear in ALL selected datasets">
                    Intersection
                  </Tooltip>
                </Radio.Button>
                <Radio.Button value="union" style={{ width: '50%', textAlign: 'center' }}>
                  <Tooltip title="Show all categories from any selected dataset">
                    Union
                  </Tooltip>
                </Radio.Button>
              </Radio.Group>
            </Space>
          </Col>
        </Row>
      )}

      {/* Editor Modal */}
      <FilterGroupEditorModal
        visible={editorVisible}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
        filters={filterConfigs}
        title="Edit Primary Filters"
      />
    </>
  );

  // Render with or without Card wrapper based on hideCard prop
  if (hideCard) {
    return filterContent;
  }

  return (
    <Card
      title={<PrimaryFilterTitle activeCount={activeFilterCount} />}
      style={{ marginBottom: 16 }}
      size="small"
    >
      {filterContent}
    </Card>
  );
}
