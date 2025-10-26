/**
 * Venn Diagram Component
 *
 * Displays Venn diagram showing category overlaps across 2-5 category analysis results.
 *
 * LOCATION: This component is used in CategoryAnalysisMultisetView, which displays
 * when user selects an analysis type group in the sidebar (e.g., "GO Biological Process").
 *
 * RATIONALE: Venn diagrams compare multiple datasets, so they belong in a multi-set view,
 * not in the single-dataset CategoryResultsView. The multi-set view provides proper context
 * for cross-dataset comparisons by showing all available results of a specific analysis type.
 *
 * NAVIGATION PATH: Sidebar → Project → Analysis Type Group → CategoryAnalysisMultisetView → VennDiagram
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Select, Button, Table, Collapse, Alert, Spin } from 'antd';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import { useAppSelector } from '../../store/hooks';
import { Venn } from '@ant-design/charts';

const { Option } = Select;
const { Panel } = Collapse;

interface VennDiagramProps {
  projectId: string;
  availableResults: string[];
}

export default function VennDiagram({ projectId, availableResults }: VennDiagramProps) {
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [vennData, setVennData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (selectedResults.length < 2 || selectedResults.length > 5) {
      setError('Please select 2-5 category analysis results');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await CategoryResultsService.getVennDiagramData(projectId, selectedResults);
      setVennData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Venn diagram');
      console.error('Error generating Venn diagram:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare Venn diagram data format for @ant-design/charts
  const vennChartData = useMemo(() => {
    console.log('[VennDiagram] Processing vennData:', vennData);

    if (!vennData || !vennData.overlaps || !vennData.setNames) {
      console.log('[VennDiagram] Missing vennData, overlaps, or setNames');
      return null;
    }

    // Transform backend data to Venn chart format
    // Backend provides INTERSECTION counts: "A" (unique to A), "A,B" (overlap), etc.
    // Venn library expects TOTAL SET SIZES

    const setCount = vennData.setCount;
    const setLabels = Array.from({ length: setCount }, (_, i) => String.fromCharCode(65 + i)); // ['A', 'B', 'C', ...]
    const overlaps = vennData.overlaps;

    // Calculate total size for each set by summing all intersections containing that set
    const setTotals = new Map<string, number>();

    setLabels.forEach(label => {
      let total = 0;
      // Sum all overlaps that include this set
      Object.entries(overlaps).forEach(([key, count]) => {
        const sets = key.split(',');
        if (sets.includes(label)) {
          total += count as number;
        }
      });
      setTotals.set(label, total);
      console.log(`[VennDiagram] Set ${label} total size: ${total}`);
    });

    // Build chart data: individual sets with totals, plus all overlaps
    const chartData: Array<{sets: string[], size: number, label: string}> = [];

    // Add individual sets with their TOTAL sizes
    setLabels.forEach(label => {
      chartData.push({
        sets: [label],
        size: setTotals.get(label) || 0,
        label: label
      });
    });

    // Add all overlaps (2+ sets)
    Object.entries(overlaps).forEach(([key, count]) => {
      const sets = key.split(',');
      if (sets.length > 1) {
        chartData.push({
          sets: sets,
          size: count as number,
          label: key
        });
      }
    });

    console.log('[VennDiagram] Chart data prepared:', chartData);
    console.log('[VennDiagram] Chart data length:', chartData.length);
    console.log('[VennDiagram] Full chart data JSON:', JSON.stringify(chartData, null, 2));
    return chartData;
  }, [vennData]);

  // Prepare table data from overlaps
  const getTableData = () => {
    if (!vennData || !vennData.overlaps) return [];

    const data: any[] = [];

    // Sort keys to show individual sets first, then combinations
    const sortedKeys = Object.keys(vennData.overlaps).sort((a, b) => {
      const aCount = a.split(',').length;
      const bCount = b.split(',').length;
      if (aCount !== bCount) return aCount - bCount;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      const count = vennData.overlaps[key];
      const items = vennData.overlapItems?.[key] || [];

      // Map key to set names
      const setLabels = key.split(',').map(label => {
        const index = label.charCodeAt(0) - 'A'.charCodeAt(0);
        return vennData.setNames?.[index] || label;
      });

      data.push({
        key,
        sets: key,
        setNames: setLabels.join(' ∩ '),
        count,
        items: items.slice(0, 10), // Show first 10 items
        allItems: items,
      });
    });

    return data;
  };

  const columns = [
    {
      title: 'Sets',
      dataIndex: 'sets',
      key: 'sets',
      width: 100,
    },
    {
      title: 'Analysis Results',
      dataIndex: 'setNames',
      key: 'setNames',
      width: 300,
      ellipsis: true,
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: 'Categories (Sample)',
      dataIndex: 'items',
      key: 'items',
      render: (items: string[]) => (
        <div style={{ fontSize: '0.85em' }}>
          {items.slice(0, 3).join(', ')}
          {items.length > 3 && '...'}
        </div>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Card
        title="Venn Diagram - Category Overlap Analysis"
        style={{ marginBottom: '1rem' }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Select 2-5 Category Analysis Results to Compare:</strong>
          </div>
          <Select
            mode="multiple"
            style={{ width: '100%', marginBottom: '1rem' }}
            placeholder="Select analysis results to compare"
            value={selectedResults}
            onChange={setSelectedResults}
            maxTagCount={5}
          >
            {availableResults.map(name => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            onClick={handleGenerate}
            disabled={selectedResults.length < 2 || selectedResults.length > 5}
            loading={loading}
          >
            Generate Venn Diagram
          </Button>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spin size="large" tip="Calculating overlaps..." />
          </div>
        )}

        {vennData && !loading && (
          <div>
            <h4 style={{ marginTop: '1rem' }}>
              Comparing {vennData.setCount} Analysis Results
            </h4>

            {/* Venn Diagram Visualization */}
            {(() => {
              console.log('[VennDiagram] Rendering check - vennChartData:', vennChartData);
              console.log('[VennDiagram] Rendering check - length:', vennChartData?.length);

              if (vennChartData && vennChartData.length > 0) {
                console.log('[VennDiagram] Rendering Venn chart with data:', vennChartData);
                return (
                  <div style={{ marginBottom: '2rem' }}>
                    <Venn
                      data={vennChartData}
                      setsField="sets"
                      sizeField="size"
                      width={800}
                      height={500}
                    />
                  </div>
                );
              } else {
                console.log('[VennDiagram] NOT rendering Venn chart - data missing or empty');
                return null;
              }
            })()}

            <p style={{ color: '#666', marginBottom: '1rem' }}>
              The Venn diagram above shows the overlaps between selected category analysis results. The table below provides detailed counts and category names for each combination.
            </p>

            <Table
              dataSource={getTableData()}
              columns={columns}
              pagination={false}
              size="small"
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                    <strong>All Categories in this Overlap ({record.allItems.length}):</strong>
                    <ul style={{ marginTop: '0.5rem', columnCount: 2, columnGap: '2rem' }}>
                      {record.allItems.map((item: string, index: number) => (
                        <li key={index} style={{ fontSize: '0.85em', marginBottom: '0.25rem' }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
                rowExpandable: (record) => record.allItems.length > 0,
              }}
            />

            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Legend:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                {vennData.setNames?.map((name: string, index: number) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>
                    <strong>{String.fromCharCode(65 + index)}</strong>: {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!vennData && !loading && !error && (
          <Alert
            message="Select datasets to compare"
            description="Choose 2-5 category analysis results from the dropdown above and click 'Generate Venn Diagram' to see overlapping categories."
            type="info"
          />
        )}
      </Card>
    </div>
  );
}
