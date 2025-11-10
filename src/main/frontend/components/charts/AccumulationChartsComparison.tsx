/**
 * Accumulation Charts Comparison Component
 *
 * Displays overlay accumulation charts comparing 2-5 category analysis results.
 * Each result's data is plotted with cluster colors and unique marker symbols.
 *
 * LOCATION: Used in CategoryAnalysisMultisetView alongside Venn diagram.
 *
 * NAVIGATION PATH: Sidebar → Project → Analysis Type Group → CategoryAnalysisMultisetView → AccumulationChartsComparison
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, Select, Button, Alert, Spin, Row, Col } from 'antd';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import Plot from 'react-plotly.js';
import { useClusterColors, getClusterLabel, getClusterIdForCategory } from './utils/clusterColors';
import { useNonSelectedDisplayMode } from './hooks/useNonSelectedDisplayMode';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

const { Option } = Select;

interface AccumulationChartsComparisonProps {
  projectId: string;
  availableResults: string[];
}

export default function AccumulationChartsComparison({
  projectId,
  availableResults
}: AccumulationChartsComparisonProps) {
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [resultDisplayNames, setResultDisplayNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cluster selection state (shared across all charts)
  const [selectedCluster, setSelectedCluster] = useState<string | number | null>(null);
  const hasSelection = selectedCluster !== null;
  const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = useNonSelectedDisplayMode(hasSelection);

  // Marker symbols for different datasets
  const markerSymbols = ['circle', 'square', 'diamond', 'cross', 'triangle-up'];

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  const handleGenerate = async () => {
    if (selectedResults.length < 2 || selectedResults.length > 5) {
      setError('Please select 2-5 category analysis results');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch annotations to get display names
      const allAnnotations = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
      const displayNameMap: Record<string, string> = {};

      allAnnotations?.forEach(annotation => {
        if (annotation?.fullName && annotation?.displayName) {
          displayNameMap[annotation.fullName] = annotation.displayName;
        }
      });

      setResultDisplayNames(displayNameMap);

      // Fetch data for all selected results
      const dataPromises = selectedResults.map(resultName =>
        CategoryResultsService.getCategoryResults(projectId, resultName)
      );

      const allResultsData = await Promise.all(dataPromises);

      setComparisonData({
        results: selectedResults,
        data: allResultsData
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate comparison charts');
      console.error('Error generating comparison charts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle legend click - same behavior as single dataset AccumulationCharts
  const handleLegendClick = useCallback((event: any) => {
    if (!event || event.curveNumber === undefined) {
      return false;
    }

    // Get the clicked trace name
    const traceName = event.data[event.curveNumber]?.name;
    if (!traceName) {
      return false;
    }

    // Extract cluster ID from trace name (format: "Cluster X" or "Cluster Outliers")
    const clusterMatch = traceName.match(/Cluster (\S+)/);
    if (!clusterMatch) {
      return false;
    }

    const clickedClusterId = clusterMatch[1] === 'Outliers' ? '-1' : clusterMatch[1];

    console.log('[AccumulationChartsComparison] Legend clicked for cluster:', clickedClusterId);

    // Check if this cluster is currently selected
    const isClusterSelected = String(selectedCluster) === String(clickedClusterId);

    if (!isClusterSelected) {
      // Cluster not selected - first click selects it AND makes non-selected markers outline
      console.log('[AccumulationChartsComparison] Selecting cluster, non-selected -> outline');
      setSelectedCluster(clickedClusterId);
      setNonSelectedDisplayMode('outline');
    } else {
      // Cluster is selected - cycle through: outline -> hidden -> deselect
      if (nonSelectedDisplayMode === 'outline') {
        console.log('[AccumulationChartsComparison] Switching to hidden mode');
        setNonSelectedDisplayMode('hidden');
      } else if (nonSelectedDisplayMode === 'hidden') {
        // hidden -> deselect
        console.log('[AccumulationChartsComparison] Deselecting cluster');
        setSelectedCluster(null);
        setNonSelectedDisplayMode('full'); // Reset for next selection
      } else {
        // Should not happen, but if in 'full' mode, go to outline
        console.log('[AccumulationChartsComparison] Unexpected state, switching to outline mode');
        setNonSelectedDisplayMode('outline');
      }
    }

    // Return false to prevent default legend toggle behavior
    return false;
  }, [selectedCluster, nonSelectedDisplayMode]);

  // Generate chart configurations
  const charts = useMemo(() => {
    if (!comparisonData) return [];

    const chartConfigs = [
      { title: 'BMD Median Accumulation', field: 'bmdMedian' },
      { title: 'BMD Mean Accumulation', field: 'bmdMean' },
      { title: 'BMDL Median Accumulation', field: 'bmdlMedian' },
      { title: 'BMDL Mean Accumulation', field: 'bmdlMean' },
      { title: 'BMDU Median Accumulation', field: 'bmduMedian' },
      { title: 'BMDU Mean Accumulation', field: 'bmduMean' },
    ];

    return chartConfigs.map(config => {
      const traces: any[] = [];
      let globalXMin = Infinity;
      let globalXMax = -Infinity;
      const clustersInLegend = new Set<string | number>(); // Track which clusters are in legend

      // Process each selected result
      comparisonData.results.forEach((resultName: string, resultIndex: number) => {
        const resultData = comparisonData.data[resultIndex];
        if (!resultData || !resultData.length) return;

        // Get all values for this result
        const allValues = resultData
          .map((row: any) => ({
            value: row[config.field],
            categoryId: row.categoryId
          }))
          .filter((item: any) => item.value != null && item.value > 0)
          .sort((a: any, b: any) => a.value - b.value);

        if (allValues.length === 0) return;

        // Update global x-axis range
        const allX = allValues.map((item: any) => item.value);
        const xMin = Math.min(...allX);
        const xMax = Math.max(...allX);
        globalXMin = Math.min(globalXMin, xMin);
        globalXMax = Math.max(globalXMax, xMax);

        // Group by cluster
        const byCluster = new Map<string | number, Array<{x: number, y: number}>>();

        allValues.forEach((item: any, index: number) => {
          const clusterId = getClusterIdForCategory(item.categoryId);
          const cumulativePercent = ((index + 1) / allValues.length) * 100;

          if (!byCluster.has(clusterId)) {
            byCluster.set(clusterId, []);
          }
          byCluster.get(clusterId)!.push({
            x: item.value,
            y: cumulativePercent,
          });
        });

        // Create a trace for each cluster
        byCluster.forEach((points, clusterId) => {
          const baseColor = clusterColors[clusterId] || '#999999';
          const markerSymbol = markerSymbols[resultIndex % markerSymbols.length];

          const displayName = resultDisplayNames[resultName] || resultName;

          // Only show this cluster in legend if it hasn't been added yet
          const showInLegend = !clustersInLegend.has(clusterId);
          if (showInLegend) {
            clustersInLegend.add(clusterId);
          }

          // Determine marker styling based on selection state and display mode
          const isClusterSelected = hasSelection && String(selectedCluster) === String(clusterId);
          let markerColor = baseColor;
          let markerSize = 8;
          let markerLineWidth = 1;
          let markerLineColor = 'white';
          let markerOpacity = 1.0;

          if (hasSelection && !isClusterSelected) {
            // This cluster is NOT selected, apply non-selected display mode
            if (nonSelectedDisplayMode === 'outline') {
              // Outline mode: transparent fill with colored border
              const rgb = [
                parseInt(baseColor.slice(1, 3), 16),
                parseInt(baseColor.slice(3, 5), 16),
                parseInt(baseColor.slice(5, 7), 16)
              ];
              markerColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`;
              markerLineWidth = 1;
              markerLineColor = baseColor;
            } else if (nonSelectedDisplayMode === 'hidden') {
              // Hidden mode: set opacity to 0 but keep trace visible for legend
              markerOpacity = 0;
            }
          } else if (isClusterSelected) {
            // Selected cluster: larger markers with white border
            markerSize = 10;
            markerLineWidth = 2;
          }

          traces.push({
            type: 'scatter',
            mode: 'markers',
            x: points.map(p => p.x),
            y: points.map(p => p.y),
            marker: {
              color: markerColor,
              size: markerSize,
              symbol: markerSymbol,
              opacity: markerOpacity,
              line: {
                color: markerLineColor,
                width: markerLineWidth
              }
            },
            name: getClusterLabel(clusterId),
            hovertemplate: `${displayName}<br>${getClusterLabel(clusterId)}<br>Value: %{x:.4f}<br>Cumulative %: %{y:.1f}%<extra></extra>`,
            showlegend: showInLegend, // Only first occurrence of each cluster shows in legend
            legendgroup: `cluster_${clusterId}`, // Group all traces of same cluster
          });
        });
      });

      if (traces.length === 0) return null;

      // Calculate x-axis range
      const xAxisRange = globalXMin !== Infinity && globalXMax !== -Infinity
        ? [Math.log10(globalXMin), Math.log10(globalXMax)]
        : undefined;

      return {
        data: traces,
        layout: {
          title: {
            text: config.title,
            font: { size: 14 },
          },
          xaxis: {
            title: { text: 'BMD Value' },
            type: 'log',
            range: xAxisRange,
            gridcolor: DEFAULT_GRID_COLOR,
          },
          yaxis: {
            title: { text: 'Cumulative Percentage (%)' },
            range: [0, 100],
            gridcolor: DEFAULT_GRID_COLOR,
          },
          height: 400,
          margin: { l: 70, r: 50, t: 50, b: 50 },
          ...DEFAULT_LAYOUT_STYLES,
          showlegend: true, // Show cluster legend
          legend: {
            x: 1.02,
            xanchor: 'left',
            y: 1,
            yanchor: 'top',
          },
        } as any,
        config: createPlotlyConfig() as any,
      };
    }).filter(chart => chart !== null);
  }, [comparisonData, clusterColors, markerSymbols, resultDisplayNames, hasSelection, selectedCluster, nonSelectedDisplayMode]);

  return (
    <Card
      title="Accumulation Charts - Multi-Result Comparison"
      style={{ marginBottom: '1rem' }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Select Category Analysis Results (2-5):</strong>
        </div>
        <Select
          mode="multiple"
          placeholder="Select 2-5 results to compare"
          value={selectedResults}
          onChange={setSelectedResults}
          style={{ width: '100%', marginBottom: '1rem' }}
          maxTagCount="responsive"
        >
          {availableResults.map(result => (
            <Option key={result} value={result}>
              {result}
            </Option>
          ))}
        </Select>
        <Button
          type="primary"
          onClick={handleGenerate}
          loading={loading}
          disabled={selectedResults.length < 2 || selectedResults.length > 5}
        >
          Generate Comparison Charts
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
          <Spin size="large" tip="Loading comparison data..." />
        </div>
      )}

      {!loading && comparisonData && charts.length > 0 && (
        <div>
          {/* Dataset Marker Symbols Legend */}
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: '#f0f5ff',
            borderRadius: '4px',
            border: '1px solid #adc6ff'
          }}>
            <strong>Dataset Marker Symbols:</strong>
            <div style={{ marginTop: '0.5rem' }}>
              {comparisonData.results.map((resultName: string, index: number) => {
                const displayName = resultDisplayNames[resultName] || resultName;
                const symbol = markerSymbols[index % markerSymbols.length];
                return (
                  <div key={resultName} style={{ marginBottom: '4px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 500 }}>{symbol}</span> - {displayName}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#666' }}>
              Cluster colors and visibility can be toggled using the chart legends.
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {charts.map((chart, index) => (
              <Col xs={24} lg={12} key={index}>
                <Plot
                  data={chart.data}
                  layout={chart.layout}
                  config={chart.config as any}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                  onLegendClick={handleLegendClick}
                />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {!loading && comparisonData && charts.length === 0 && (
        <Alert
          message="No Data"
          description="No valid BMD data available for the selected results."
          type="warning"
        />
      )}
    </Card>
  );
}
