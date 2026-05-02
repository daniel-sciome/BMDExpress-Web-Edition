/**
 * TableColumnPicker Component
 *
 * Reusable column visibility picker for the category results table.
 * ColumnGroup fields (those with individual sub-columns) are rendered
 * as expandable Collapse panels so users can toggle individual columns.
 * Simple boolean fields are plain checkboxes with no sub-columns.
 *
 * Used by both CategoryResultsView (single-dataset) and MultiDatasetView
 * so the picker behaves identically in both views.
 */

import React from 'react';
import { Checkbox, Button, Collapse, Space } from 'antd';
import type { ColumnVisibility } from './utils/types';
import { DEFAULT_COLUMN_VISIBILITY, COLUMN_GROUPS } from './utils/types';

/**
 * Human-readable labels for individual columns within each ColumnGroup.
 * Keys must match the column keys defined in ColumnVisibility.
 */
const COLUMN_LABELS: Partial<Record<keyof ColumnVisibility, Record<string, string>>> = {
  primaryFilters: {
    genesPassed: 'Genes (Passed)',
    allGenes: 'All Genes',
    percentage: 'Percentage',
    bmdMean: 'BMD Mean',
    bmdMedian: 'BMD Median',
  },
  preFilters: {
    anova: 'ANOVA',
  },
  filterCounts: {
    bmdLessEqualHighDose: 'BMD ≤ High Dose',
    bmdPValueGreaterEqual: 'BMD P-Value ≥',
    foldChangeAbove: 'Fold Change ≥',
    rSquared: 'R² ≥',
    bmdBmdlRatio: 'BMD/BMDL <',
    bmduBmdlRatio: 'BMDU/BMDL <',
    bmduBmdRatio: 'BMDU/BMD <',
    nFoldBelow: 'N-Fold Below',
    prefilterPValue: 'Pre-P ≥',
    prefilterAdjustedPValue: 'Pre-Adj-P ≥',
    notStepFunction: 'Not Step Fn',
    notStepFunctionBMDL: 'Not Step (BMDL)',
    notAdverse: 'Not Adverse',
    absZScore: 'ABS Z-Score ≥',
    absModelFC: 'ABS Model FC ≥',
  },
  percentiles: {
    bmd5th: 'BMD 5th %ile',
    bmd10th: 'BMD 10th %ile',
    bmdl5th: 'BMDL 5th %ile',
    bmdl10th: 'BMDL 10th %ile',
    bmdu5th: 'BMDU 5th %ile',
    bmdu10th: 'BMDU 10th %ile',
  },
  directionalUp: {
    bmdMean: 'BMD Mean',
    bmdMedian: 'BMD Median',
    bmdSD: 'BMD SD',
    bmdlMean: 'BMDL Mean',
    bmdlMedian: 'BMDL Median',
    bmdlSD: 'BMDL SD',
    bmduMean: 'BMDU Mean',
    bmduMedian: 'BMDU Median',
    bmduSD: 'BMDU SD',
  },
  directionalDown: {
    bmdMean: 'BMD Mean',
    bmdMedian: 'BMD Median',
    bmdSD: 'BMD SD',
    bmdlMean: 'BMDL Mean',
    bmdlMedian: 'BMDL Median',
    bmdlSD: 'BMDL SD',
    bmduMean: 'BMDU Mean',
    bmduMedian: 'BMDU Median',
    bmduSD: 'BMDU SD',
  },
  directionalAnalysis: {
    overallDirection: 'Overall Direction',
    percentUP: '% UP',
    percentDOWN: '% DOWN',
    percentConflict: '% Conflict',
  },
  foldChange: {
    total: 'Total',
    mean: 'Mean',
    median: 'Median',
    max: 'Max',
    min: 'Min',
    stdDev: 'Std Dev',
  },
  zScores: {
    min: 'Min',
    median: 'Median',
    max: 'Max',
    mean: 'Mean',
  },
  modelFoldChange: {
    min: 'Min',
    median: 'Median',
    max: 'Max',
    mean: 'Mean',
  },
  geneLists: {
    genes: 'Genes',
    geneSymbols: 'Gene Symbols',
    bmdList: 'BMD List',
    bmdlList: 'BMDL List',
    bmduList: 'BMDU List',
  },
};

interface TableColumnPickerProps {
  /** Current column visibility state */
  value: ColumnVisibility;
  /** Called whenever any toggle changes */
  onChange: (vis: ColumnVisibility) => void;
}

/**
 * Toggle an entire group on or off.
 * Turning off a ColumnGroup zeroes its individual column flags so
 * the useMemo's some(v=>v) check doesn't keep them visible.
 */
function toggleGroup(
  current: ColumnVisibility,
  key: keyof ColumnVisibility,
  checked: boolean
): ColumnVisibility {
  const next = { ...current };
  if (typeof next[key] === 'boolean') {
    (next as any)[key] = checked;
  } else {
    const group = next[key] as any;
    if (checked) {
      (next as any)[key] = { ...group, all: true };
    } else {
      const cleared = Object.fromEntries(
        Object.keys(group.columns).map((k: string) => [k, false])
      );
      (next as any)[key] = { ...group, all: false, columns: cleared };
    }
  }
  return next;
}

/**
 * Toggle a single column within a ColumnGroup.
 * Always sets all:false so individual flags are respected by the useMemo.
 */
function toggleColumn(
  current: ColumnVisibility,
  groupKey: keyof ColumnVisibility,
  colKey: string,
  checked: boolean
): ColumnVisibility {
  const group = current[groupKey] as any;
  return {
    ...current,
    [groupKey]: {
      ...group,
      all: false,
      columns: { ...group.columns, [colKey]: checked },
    },
  };
}

export default function TableColumnPicker({ value, onChange }: TableColumnPickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '450px', overflowY: 'auto', width: '280px' }}>
      {COLUMN_GROUPS.map(({ key, label }) => {
        const val = value[key];
        const isBoolean = typeof val === 'boolean';
        const colLabels = COLUMN_LABELS[key];

        // Simple boolean field — plain checkbox, no expand arrow
        if (isBoolean || !colLabels) {
          return (
            <div key={key} style={{ padding: '4px 8px' }}>
              <Checkbox
                checked={val as boolean}
                onChange={(e) => onChange(toggleGroup(value, key, e.target.checked))}
              >
                {label}
              </Checkbox>
            </div>
          );
        }

        // ColumnGroup field — expandable panel with per-column checkboxes
        const group = val as any;
        const colValues = Object.values(group.columns) as boolean[];
        const isOn = group.all as boolean;
        const isIndeterminate = !group.all && colValues.some(v => v);

        return (
          <Collapse
            key={key}
            ghost
            size="small"
            style={{ background: '#fafafa' }}
            items={[{
              key,
              label: (
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isOn}
                    indeterminate={isIndeterminate}
                    onChange={(e) => {
                      e.stopPropagation();
                      onChange(toggleGroup(value, key, e.target.checked));
                    }}
                  >
                    {label}
                  </Checkbox>
                </div>
              ),
              children: (
                <div style={{ paddingLeft: '24px' }}>
                  <Space direction="vertical" size={2}>
                    {Object.entries(colLabels).map(([colKey, colLabel]) => (
                      <Checkbox
                        key={colKey}
                        checked={group.columns[colKey] ?? false}
                        onChange={(e) => onChange(toggleColumn(value, key, colKey, e.target.checked))}
                      >
                        {colLabel}
                      </Checkbox>
                    ))}
                  </Space>
                </div>
              ),
            }]}
          />
        );
      })}

      {/* Bulk actions */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '8px', marginTop: '4px', display: 'flex', gap: '8px', padding: '8px' }}>
        <Button size="small" onClick={() => {
          const all = { ...value } as any;
          COLUMN_GROUPS.forEach(({ key }) => {
            if (typeof all[key] === 'boolean') all[key] = true;
            else all[key] = { ...all[key], all: true };
          });
          onChange(all as ColumnVisibility);
        }}>Show All</Button>
        <Button size="small" onClick={() =>
          onChange(JSON.parse(JSON.stringify(DEFAULT_COLUMN_VISIBILITY)))
        }>Reset</Button>
      </div>
    </div>
  );
}
