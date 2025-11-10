import React, { useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import { selectChartData } from '../../store/slices/categoryResultsSlice';
import { umapDataService } from 'Frontend/data/umapDataService';
import { useReactiveState } from 'Frontend/components/charts/hooks/useReactiveState';
import { useClusterColors, getClusterLabel } from './utils/clusterColors';
import { createPlotlyConfigWithExport, DEFAULT_LAYOUT_STYLES, DEFAULT_GRID_COLOR } from './utils/plotlyConfig';

export default function BMDvsPValueScatter() {
  // Use reactive state hook to sync with UMAP
  const categoryState = useReactiveState('categoryId');
  const data = useSelector(selectChartData);

  // Non-selected cluster display mode (same as UMAP)
  const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = React.useState<'full' | 'outline' | 'hidden'>('full');

  // Background visibility state: 'full' -> 'dimmed' -> 'hidden' -> 'full'
  const [backdropVisibility, setBackdropVisibility] = React.useState<'full' | 'dimmed' | 'hidden'>('full');

  // Get cluster colors using shared utility
  const clusterColors = useClusterColors();

  // Prepare data for plotting
  const xData = data.map(row => row.bmdMean || 0);
  const yData = data.map(row => {
    const pValue = row.fishersExactTwoTailPValue;
    if (pValue === undefined || pValue === null || pValue === 0) return 0;
    return -Math.log10(pValue);
  });
  const textData = data.map(row => row.categoryDescription || row.categoryId || 'Unknown');
  const categoryIds = data.map(row => row.categoryId || '');

  const hasSelection = categoryState.selectedIds.size > 0;

  // Reset display mode when selection is cleared
  React.useEffect(() => {
    if (!hasSelection) {
      setNonSelectedDisplayMode('full');
    }
  }, [hasSelection]);

  // Calculate fixed axis ranges from all data
  const xRange = useMemo(() => {
    if (xData.length === 0) return undefined;
    const validX = xData.filter(x => x > 0);
    if (validX.length === 0) return undefined;
    const xMin = Math.min(...validX);
    const xMax = Math.max(...validX);
    return [Math.log10(xMin) - 0.5, Math.log10(xMax) + 0.5];
  }, [xData]);

  const yRange = useMemo(() => {
    if (yData.length === 0) return undefined;
    const validY = yData.filter(y => y > 0);
    if (validY.length === 0) return undefined;
    const yMin = Math.min(...validY);
    const yMax = Math.max(...validY);
    const padding = (yMax - yMin) * 0.1;
    return [Math.max(0, yMin - padding), yMax + padding];
  }, [yData]);

  // Build traces with reactive styling (same as UMAP)
  const traces = useMemo(() => {
    const result: any[] = [];

    // Layer 1: Backdrop - ALL points in gray (like UMAP Reference Space)
    const backdropOpacity = backdropVisibility === 'full' ? 0.4 : backdropVisibility === 'dimmed' ? 0.1 : 0;
    const isBackdropHidden = backdropVisibility !== 'full';

    result.push({
      x: xData,
      y: yData,
      text: textData,
      mode: 'markers',
      type: 'scatter',
      name: 'Background',
      marker: {
        size: 3,
        color: isBackdropHidden ? 'rgba(0,0,0,0)' : '#666666',
        opacity: backdropOpacity,
        line: {
          width: isBackdropHidden ? 1 : 0,
          color: '#666666'
        },
      },
      hovertemplate: '<b>%{text}</b><br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>',
      showlegend: true,
    });

    // Layer 2: Cluster traces with reactive styling
    const byCluster = new Map<string | number, number[]>();
    data.forEach((row, idx) => {
      const umapItem = umapDataService.getByGoId(row.categoryId || '');
      const clusterId = umapItem?.cluster_id ?? -1;

      if (!byCluster.has(clusterId)) {
        byCluster.set(clusterId, []);
      }
      byCluster.get(clusterId)!.push(idx);
    });

    // Create a trace for each cluster with reactive styling
    byCluster.forEach((indices, clusterId) => {
      // Check if ANY category from this cluster is selected
      const isClusterSelected = hasSelection && indices.some(idx => categoryState.isSelected(categoryIds[idx]));

      // Determine marker styling based on selection state and display mode
      const baseColor = clusterColors[clusterId] || '#999999';
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
      }

      result.push({
        x: indices.map(i => xData[i]),
        y: indices.map(i => yData[i]),
        text: indices.map(i => textData[i]),
        customdata: indices.map(i => categoryIds[i]),
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: markerColor,
          size: markerSize,
          opacity: markerOpacity,
          line: {
            color: markerLineColor,
            width: markerLineWidth,
          },
        },
        hovertemplate: `<b>%{text}</b><br>Cluster ${clusterId === -1 ? 'Outliers' : clusterId}<br>BMD Mean: %{x:.4f}<br>-log10(p): %{y:.4f}<extra></extra>`,
        name: `Cluster ${clusterId}`,
        showlegend: true,
        legendgroup: `cluster_${clusterId}`,
      });
    });

    return result;
  }, [data, xData, yData, textData, categoryIds, clusterColors, hasSelection, categoryState.selectedIds.size, categoryState.isSelected, nonSelectedDisplayMode, backdropVisibility]);

  const handlePlotClick = useCallback((event: any) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const categoryId = point.customdata;

      if (categoryId) {
        // Check if Ctrl/Cmd key is pressed for multi-select
        if (event.event?.ctrlKey || event.event?.metaKey) {
          categoryState.handleSelect(categoryId, true, 'chart');
        } else {
          // Single select - replace selection
          categoryState.handleMultiSelect([categoryId], 'chart');
        }
      }
    }
  }, [categoryState]);

  // Handle legend click - same behavior as UMAP
  const handleLegendClick = useCallback((event: any) => {
    if (!event || event.curveNumber === undefined) {
      return false;
    }

    // Get the trace that was clicked
    const trace = traces[event.curveNumber];
    if (!trace || !trace.name) {
      return false;
    }

    // Handle Background clicks - 3-way toggle (like UMAP Reference Space)
    if (trace.name === 'Background') {
      setBackdropVisibility(current => {
        if (current === 'full') {
          console.log('[BMDvsPValueScatter] Background: full -> dimmed');
          return 'dimmed';
        } else if (current === 'dimmed') {
          console.log('[BMDvsPValueScatter] Background: dimmed -> hidden');
          return 'hidden';
        } else {
          console.log('[BMDvsPValueScatter] Background: hidden -> full');
          return 'full';
        }
      });
      return false; // Prevent default legend toggle
    }

    // Extract cluster ID from trace name (format: "Cluster X")
    const clusterMatch = trace.name.match(/Cluster (\S+)/);
    if (!clusterMatch) {
      return false;
    }

    const clusterId = clusterMatch[1];

    // Check if Cmd (Mac) or Ctrl (Windows/Linux) key is pressed for multi-select
    const isMultiSelect = event.event?.ctrlKey || event.event?.metaKey;

    console.log('[BMDvsPValueScatter] Legend clicked for cluster:', clusterId, 'multiselect:', isMultiSelect);

    // Find all category IDs in this cluster
    const categoriesInCluster = data
      .filter(row => {
        const umapItem = umapDataService.getByGoId(row.categoryId || '');
        const rowClusterId = umapItem?.cluster_id ?? -1;
        return String(rowClusterId) === clusterId;
      })
      .map(row => row.categoryId)
      .filter(Boolean) as string[];

    console.log('[BMDvsPValueScatter] Categories in cluster:', categoriesInCluster.length);

    // Check if this cluster is currently selected
    const isClusterSelected = categoriesInCluster.some(catId => categoryState.selectedIds.has(catId));

    if (!isClusterSelected) {
      // Cluster not selected - first click selects it AND makes non-selected markers outline
      console.log('[BMDvsPValueScatter] Selecting cluster, non-selected -> outline');
      setNonSelectedDisplayMode('outline');

      if (isMultiSelect) {
        // Multi-select: add to existing selection
        const currentSelection = Array.from(categoryState.selectedIds);
        const mergedSelection = [...new Set([...currentSelection, ...categoriesInCluster])];
        categoryState.handleMultiSelect(mergedSelection, 'chart');
      } else {
        // Single select: replace selection
        categoryState.handleMultiSelect(categoriesInCluster, 'chart');
      }
    } else {
      // Cluster is selected - cycle through: outline -> hidden -> deselect
      if (nonSelectedDisplayMode === 'outline') {
        console.log('[BMDvsPValueScatter] Switching to hidden mode');
        setNonSelectedDisplayMode('hidden');
      } else if (nonSelectedDisplayMode === 'hidden') {
        // hidden -> deselect
        console.log('[BMDvsPValueScatter] Deselecting cluster');
        setNonSelectedDisplayMode('full'); // Reset for next selection

        if (isMultiSelect) {
          // Multi-select: remove from selection
          const currentSelection = Array.from(categoryState.selectedIds);
          const categoriesInClusterSet = new Set(categoriesInCluster);
          const newSelection = currentSelection.filter(catId => !categoriesInClusterSet.has(String(catId)));

          if (newSelection.length > 0) {
            categoryState.handleMultiSelect(newSelection, 'chart');
          } else {
            categoryState.handleClear();
          }
        } else {
          // Single select: clear all
          categoryState.handleClear();
        }
      } else {
        // Should not happen, but if in 'full' mode, go to outline
        console.log('[BMDvsPValueScatter] Unexpected state, switching to outline mode');
        setNonSelectedDisplayMode('outline');
      }
    }

    // Return false to prevent default legend toggle behavior
    return false;
  }, [traces, data, categoryState, nonSelectedDisplayMode]);

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Plot
        data={traces}
        layout={{
          title: 'BMD vs Fisher Exact P-Value (Colored by Cluster)',
          xaxis: {
            title: 'BMD Mean',
            type: 'log',
            range: xRange, // Fixed range based on all data
            gridcolor: DEFAULT_GRID_COLOR,
          },
          yaxis: {
            title: '-log10(Fisher Exact P-Value)',
            range: yRange, // Fixed range based on all data
            gridcolor: DEFAULT_GRID_COLOR,
          },
          hovermode: 'closest',
          ...DEFAULT_LAYOUT_STYLES,
          margin: { l: 60, r: 30, t: 50, b: 60 },
          showlegend: true, // Always show legend for visibility toggle
          legend: {
            x: 1.02,
            y: 1,
            xanchor: 'left',
            yanchor: 'top',
          },
        } as any}
        config={createPlotlyConfigWithExport('bmd_vs_pvalue_scatter')}
        onClick={handlePlotClick}
        onLegendClick={handleLegendClick}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
