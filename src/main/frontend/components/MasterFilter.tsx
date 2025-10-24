// MasterFilter.tsx
// Master filter component for global filtering of category results
// Phase 1: Three numeric range filters with localStorage persistence

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, InputNumber, Button, Space, Badge, Tooltip } from 'antd';
import { FilterOutlined, ClearOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setFilters, clearFilters } from '../store/slices/categoryResultsSlice';

const STORAGE_KEY = 'bmdexpress_master_filters_global';

interface MasterFilterState {
  percentageMin?: number;
  genesPassedFiltersMin?: number;
  allGenesMin?: number;
  allGenesMax?: number;
}

// Default filter values
const DEFAULT_FILTERS: MasterFilterState = {
  percentageMin: 5,
  genesPassedFiltersMin: 3,
  allGenesMin: 40,
  allGenesMax: 500,
};

export default function MasterFilter() {
  const dispatch = useAppDispatch();
  const currentFilters = useAppSelector(state => state.categoryResults.filters);

  // Local state for form inputs (before applying)
  const [localFilters, setLocalFilters] = useState<MasterFilterState>(DEFAULT_FILTERS);

  // Load from localStorage on mount, merge with defaults
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let filtersToLoad = DEFAULT_FILTERS;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge stored with defaults (stored values take precedence)
        filtersToLoad = { ...DEFAULT_FILTERS, ...parsed };
      } catch (error) {
        console.error('Failed to load stored filters, using defaults:', error);
      }
    }

    setLocalFilters(filtersToLoad);
    // Auto-apply filters on mount
    dispatch(setFilters(filtersToLoad));
  }, [dispatch]);

  // Count active filters
  const activeFilterCount = Object.entries(localFilters).filter(
    ([_, value]) => value !== undefined && value !== null
  ).length;

  // Handle apply filters
  const handleApply = () => {
    // Filter out undefined values
    const filtersToApply = Object.fromEntries(
      Object.entries(localFilters).filter(([_, value]) => value !== undefined && value !== null)
    );

    dispatch(setFilters(filtersToApply));

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localFilters));
  };

  // Handle reset to defaults
  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    dispatch(setFilters(DEFAULT_FILTERS));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FILTERS));
  };

  // Handle show all (clear all filters)
  const handleShowAll = () => {
    const emptyFilters: MasterFilterState = {
      percentageMin: undefined,
      genesPassedFiltersMin: undefined,
      allGenesMin: undefined,
      allGenesMax: undefined,
    };
    setLocalFilters(emptyFilters);
    dispatch(clearFilters());
    localStorage.removeItem(STORAGE_KEY);
  };

  // Handle individual filter changes
  const updateFilter = <K extends keyof MasterFilterState>(
    key: K,
    value: number | null
  ) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === null ? undefined : value,
    }));
  };

  return (
    <Card
      title={
        <Space>
          <FilterOutlined />
          <span>Master Filters</span>
          {activeFilterCount > 0 && (
            <Badge count={activeFilterCount} style={{ backgroundColor: '#52c41a' }} />
          )}
          <Tooltip title="Filter categories across all visualizations. Filters are global and persist across analyses. Default: Percentage ≥5%, Genes Passed ≥3, All Genes 40-500. Use 'Reset' to restore defaults, 'Show All' to remove all filters. Not applied to GENE analyses.">
            <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
          </Tooltip>
        </Space>
      }
      style={{ marginBottom: 16 }}
      size="small"
    >
      <Row gutter={[16, 16]} align="middle">
        {/* Percentage Min */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
            Percentage (Min %)
          </div>
          <InputNumber
            style={{ width: '100%' }}
            placeholder="No minimum"
            value={localFilters.percentageMin}
            onChange={(value) => updateFilter('percentageMin', value)}
            min={0}
            max={100}
            step={1}
            precision={1}
          />
        </Col>

        {/* Genes Passed Filters Min */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
            Genes Passed Filters (Min)
          </div>
          <InputNumber
            style={{ width: '100%' }}
            placeholder="No minimum"
            value={localFilters.genesPassedFiltersMin}
            onChange={(value) => updateFilter('genesPassedFiltersMin', value)}
            min={0}
            step={1}
            precision={0}
          />
        </Col>

        {/* All Genes Min */}
        <Col xs={24} sm={12} md={5}>
          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
            All Genes (Min)
          </div>
          <InputNumber
            style={{ width: '100%' }}
            placeholder="No minimum"
            value={localFilters.allGenesMin}
            onChange={(value) => updateFilter('allGenesMin', value)}
            min={0}
            step={1}
            precision={0}
          />
        </Col>

        {/* All Genes Max */}
        <Col xs={24} sm={12} md={5}>
          <div style={{ marginBottom: 4, fontWeight: 500, fontSize: '13px' }}>
            All Genes (Max)
          </div>
          <InputNumber
            style={{ width: '100%' }}
            placeholder="No maximum"
            value={localFilters.allGenesMax}
            onChange={(value) => updateFilter('allGenesMax', value)}
            min={0}
            step={1}
            precision={0}
          />
        </Col>

        {/* Action Buttons */}
        <Col xs={24} md={2}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={handleApply}
              block
              size="small"
            >
              Apply
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleReset}
              block
              size="small"
            >
              Reset
            </Button>
            <Button
              onClick={handleShowAll}
              block
              size="small"
              danger
            >
              Show All
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
