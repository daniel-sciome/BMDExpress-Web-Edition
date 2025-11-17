/**
 * Global Violin Comparison Component
 *
 * Displays side-by-side violin plots comparing the distribution of category-level
 * BMD median values across 2-5 selected analysis results.
 *
 * Each violin shows ONE distribution representing how the median BMD values
 * are distributed across all categories within that analysis.
 *
 * LOCATION: Used in CategoryAnalysisMultisetView for multi-result comparison.
 *
 * NAVIGATION PATH: Sidebar → Project → Analysis Type Group → CategoryAnalysisMultisetView → Global Violin Comparison
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Card, Select, Button, Alert, Spin } from 'antd';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import Plot from 'react-plotly.js';
import { createPlotlyConfig, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';
import { useAppSelector } from '../../store/hooks';
import { applyMasterFilters } from '../../utils/applyMasterFilters';

const { Option } = Select;

interface GlobalViolinComparisonProps {
  projectId: string;
  availableResults: string[];
  selectedResults: string[];
  analysisType?: string;
}

export default function GlobalViolinComparison({
  projectId,
  availableResults,
  selectedResults,
  analysisType
}: GlobalViolinComparisonProps) {
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [resultDisplayNames, setResultDisplayNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'bmd' | 'bmdl' | 'bmdu'>('bmd'); // Using bmdMedian (bmd = median)
  const [activeResults, setActiveResults] = useState<string[]>(selectedResults);

  // Get master filters and comparison mode from Redux
  const filters = useAppSelector((state) => state.categoryResults.filters);
  const comparisonMode = useAppSelector((state) => state.categoryResults.comparisonMode);

  // Color palette for different datasets
  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

  const handleGenerate = async (resultsToLoad: string[]) => {
    if (resultsToLoad.length === 0) {
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
      const dataPromises = resultsToLoad.map(resultName =>
        CategoryResultsService.getCategoryResults(projectId, resultName)
      );

      const allResultsData = await Promise.all(dataPromises);

      // Apply master filters to each dataset
      const filteredResultsData = allResultsData.map(data =>
        applyMasterFilters(data || [], filters, analysisType)
      );

      // Apply intersection/union logic
      let finalResultsData = filteredResultsData;

      if (comparisonMode === 'intersection') {
        // Find categories that appear in ALL datasets
        const categorySetsPerDataset = filteredResultsData.map(data =>
          new Set(data.map(row => row.categoryId).filter(Boolean))
        );

        if (categorySetsPerDataset.length > 0) {
          // Get intersection
          const intersectionCategories = new Set<string>();
          const firstDatasetCategories = categorySetsPerDataset[0];

          firstDatasetCategories.forEach(catId => {
            const appearsInAll = categorySetsPerDataset.every(categorySet =>
              categorySet.has(catId as string)
            );
            if (appearsInAll) {
              intersectionCategories.add(catId as string);
            }
          });

          // Filter each dataset to only include intersection categories
          finalResultsData = filteredResultsData.map(data =>
            data.filter(row => intersectionCategories.has(row.categoryId || ''))
          );

          console.log('[GlobalViolinComparison] Intersection mode:',
            'Total categories:', intersectionCategories.size,
            'Per dataset:', finalResultsData.map(d => d.length));
        }
      } else {
        console.log('[GlobalViolinComparison] Union mode:',
          'Per dataset:', finalResultsData.map(d => d.length));
      }

      setComparisonData({
        results: resultsToLoad,
        data: finalResultsData
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate global violin comparison');
      console.error('Error generating global violin comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount if selectedResults are provided
  // Also regenerate when filters, analysisType, or comparisonMode change
  useEffect(() => {
    if (selectedResults.length > 0) {
      handleGenerate(selectedResults);
    }
  }, [projectId, selectedResults, filters, analysisType, comparisonMode]);

  // Toggle other datasets
  const toggleDataset = (resultName: string) => {
    setActiveResults(prev => {
      const newResults = prev.includes(resultName)
        ? prev.filter(r => r !== resultName)
        : [...prev, resultName];

      if (newResults.length > 0) {
        handleGenerate(newResults);
      }
      return newResults;
    });
  };

  // Generate violin plot data
  const violinPlotData = useMemo(() => {
    if (!comparisonData) return null;

    const traces: any[] = [];
    let globalMin = Infinity;
    let globalMax = -Infinity;

    // Process each selected result
    comparisonData.results.forEach((resultName: string, resultIndex: number) => {
      const resultData = comparisonData.data[resultIndex];
      if (!resultData || !resultData.length) return;

      // Extract median values from all categories in this result
      const medianValues: number[] = [];

      resultData.forEach((row: any) => {
        let value: number | undefined;

        switch (selectedMetric) {
          case 'bmd':
            value = row.bmdMedian;
            break;
          case 'bmdl':
            value = row.bmdlMedian;
            break;
          case 'bmdu':
            value = row.bmduMedian;
            break;
        }

        if (value != null && value > 0 && !isNaN(value) && isFinite(value)) {
          medianValues.push(value);
          globalMin = Math.min(globalMin, value);
          globalMax = Math.max(globalMax, value);
        }
      });

      if (medianValues.length === 0) return;

      const displayName = resultDisplayNames[resultName] || resultName;
      const color = colors[resultIndex % colors.length];

      // Create violin trace for this analysis result
      traces.push({
        type: 'violin',
        y: medianValues,
        x: Array(medianValues.length).fill(displayName),
        name: displayName,
        box: {
          visible: true,
          fillcolor: color,
          line: {
            color: '#000000',
            width: 1
          }
        },
        meanline: {
          visible: true,
          color: '#000000',
          width: 2
        },
        marker: {
          color: color
        },
        line: {
          color: color,
          width: 1.5
        },
        fillcolor: color,
        opacity: 0.6,
        points: 'outliers',
        hoverinfo: 'y+name',
        hovertemplate: `<b>${displayName}</b><br>Median Value: %{y:.4f}<extra></extra>`,
        bandwidth: undefined, // Let Plotly auto-calculate
      });
    });

    // Calculate y-axis range with fake zero at bottom
    let yRange: [number, number] | undefined;
    if (globalMin !== Infinity && globalMax !== -Infinity) {
      // Fake zero: one order of magnitude less than the decade of the minimum value
      const minDecade = Math.floor(Math.log10(globalMin));
      const fakeZero = Math.pow(10, minDecade - 1);

      const logMin = Math.log10(fakeZero);
      const logMax = Math.log10(globalMax);
      const rangeSize = logMax - logMin;
      const bottomPadding = rangeSize * 0.05; // 5% padding at bottom
      const topPadding = rangeSize * 0.1; // 10% padding at top
      yRange = [logMin - bottomPadding, logMax + topPadding];
    }

    return { traces, yRange };
  }, [comparisonData, selectedMetric, colors, resultDisplayNames]);

  const metricLabel = selectedMetric === 'bmd' ? 'BMD' : selectedMetric === 'bmdl' ? 'BMDL' : 'BMDU';

  // Get other available results (excluding the current one being viewed)
  const otherResults = availableResults.filter(r => !selectedResults.includes(r));

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 500 }}>Metric:</span>
          <Select
            value={selectedMetric}
            onChange={setSelectedMetric}
            style={{ width: 120 }}
          >
            <Option value="bmd">BMD</Option>
            <Option value="bmdl">BMDL</Option>
            <Option value="bmdu">BMDU</Option>
          </Select>
        </div>

        {otherResults.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
              Add other datasets for comparison:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {otherResults.map(resultName => {
                const isActive = activeResults.includes(resultName);
                const displayName = resultDisplayNames[resultName] || resultName;
                return (
                  <Button
                    key={resultName}
                    size="small"
                    type={isActive ? 'primary' : 'default'}
                    onClick={() => toggleDataset(resultName)}
                    disabled={!isActive && activeResults.length >= 5}
                  >
                    {displayName}
                  </Button>
                );
              })}
            </div>
            {activeResults.length >= 5 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85em', color: '#666' }}>
                Maximum 5 datasets can be compared at once
              </div>
            )}
          </div>
        )}
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
          <Spin size="large" tip="Loading global violin data..." />
        </div>
      )}

      {!loading && comparisonData && violinPlotData && violinPlotData.traces.length > 0 && (
        <div>
          <Plot
            data={violinPlotData.traces}
            layout={{
              title: {
                text: `Global ${metricLabel} Median Distribution Comparison`,
                font: { size: 14 },
              },
              xaxis: {
                title: { text: 'Analysis Result' },
                tickangle: -45,
                automargin: true,
                ticklen: 0,
                standoff: 30,
              },
              yaxis: {
                title: { text: `${metricLabel} Median Value` },
                type: 'log',
                range: violinPlotData.yRange,
                showgrid: true,
                gridcolor: DEFAULT_GRID_COLOR,
                gridwidth: 1,
                dtick: 1,
                tick0: 0,
              },
              height: 600,
              margin: { l: 70, r: 50, t: 80, b: 200 },
              ...DEFAULT_LAYOUT_STYLES,
              showlegend: false,
              violinmode: 'group',
            } as any}
            config={createPlotlyConfig() as any}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />

          <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#666' }}>
            <p><strong>About this chart:</strong></p>
            <ul style={{ marginLeft: '1.5rem' }}>
              <li>Each violin shows the distribution of category-level {metricLabel} median values for one analysis</li>
              <li>Wider sections indicate more categories have {metricLabel} median values in that range</li>
              <li>Box plot inside each violin shows overall median and quartiles across all categories</li>
              <li>Mean line is displayed as a dashed line</li>
              <li>Use this to compare how different treatments/conditions affect the overall distribution of pathway-level responses</li>
            </ul>
          </div>
        </div>
      )}

      {!loading && comparisonData && violinPlotData && violinPlotData.traces.length === 0 && (
        <Alert
          message="No Data"
          description={`No valid ${metricLabel} median data available for the selected results.`}
          type="warning"
        />
      )}
    </div>
  );
}
