// ClusterPicker.tsx
// Cluster picker component for the sidebar
// Shows all cluster colors with tri-state checkboxes
// Integrates with reactive selection for highlighting categories

import React, { useCallback, useMemo } from 'react';
import { Collapse, Checkbox, Tag, Typography, Tooltip } from 'antd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCategorySetsByType } from '../store/slices/renderStateSlice';
import { CategorySetType } from '../types/renderState';
import { setReactiveSelection, clearReactiveSelection } from '../store/slices/categoryResultsSlice';
import { useReactiveState } from './charts/hooks/useReactiveState';
import type { GroupSelectionState } from '../types/visibilityTypes';

const { Text } = Typography;

/**
 * Calculate selection state for a cluster based on highlighted IDs.
 */
function getClusterSelectionState(
  categoryIds: string[],
  highlightedIds: Set<string>
): { state: GroupSelectionState; selectedCount: number; totalCount: number } {
  const totalCount = categoryIds.length;
  if (totalCount === 0) {
    return { state: 'none', selectedCount: 0, totalCount: 0 };
  }

  const selectedCount = categoryIds.filter(id => highlightedIds.has(id)).length;

  let state: GroupSelectionState;
  if (selectedCount === 0) {
    state = 'none';
  } else if (selectedCount === totalCount) {
    state = 'full';
  } else {
    state = 'partial';
  }

  return { state, selectedCount, totalCount };
}

export default function ClusterPicker() {
  const dispatch = useAppDispatch();
  const categoryState = useReactiveState('categoryId');
  // Category IDs are always strings, cast for type safety
  const highlightedIds = categoryState.selectedIds as Set<string>;

  // Get all cluster sets from renderStateSlice
  const clusterSets = useAppSelector(state => selectCategorySetsByType(CategorySetType.CLUSTER)(state));

  // Calculate overall stats
  const stats = useMemo(() => {
    let totalHighlighted = 0;
    let totalCategories = 0;
    let clustersWithSelection = 0;

    clusterSets.forEach(set => {
      const { selectedCount, totalCount } = getClusterSelectionState(set.categoryIds, highlightedIds);
      totalHighlighted += selectedCount;
      totalCategories += totalCount;
      if (selectedCount > 0) clustersWithSelection++;
    });

    return { totalHighlighted, totalCategories, clustersWithSelection };
  }, [clusterSets, highlightedIds]);

  /**
   * Handle cluster checkbox click.
   * - Unchecked -> Checked: Highlight all categories in cluster
   * - Checked/Partial -> Unchecked: Remove highlight from cluster's categories
   * Supports Cmd/Ctrl for additive selection.
   */
  const handleClusterClick = useCallback((
    categoryIds: string[],
    currentState: GroupSelectionState,
    event: React.MouseEvent
  ) => {
    const isAdditive = event.ctrlKey || event.metaKey;

    if (currentState === 'none') {
      // Select this cluster
      if (isAdditive) {
        // Add to existing highlights
        const currentHighlights = Array.from(highlightedIds);
        const merged = [...new Set([...currentHighlights, ...categoryIds])];
        dispatch(setReactiveSelection({ type: 'category', ids: merged, source: 'cluster-picker' }));
      } else {
        // Replace selection with this cluster
        dispatch(setReactiveSelection({ type: 'category', ids: categoryIds, source: 'cluster-picker' }));
      }
    } else {
      // Deselect this cluster
      if (isAdditive && highlightedIds.size > categoryIds.length) {
        // Remove only this cluster's categories from highlights
        const remaining = Array.from(highlightedIds).filter(
          id => !categoryIds.includes(id)
        );
        if (remaining.length > 0) {
          dispatch(setReactiveSelection({ type: 'category', ids: remaining, source: 'cluster-picker' }));
        } else {
          dispatch(clearReactiveSelection('category'));
        }
      } else {
        // Clear all highlights
        dispatch(clearReactiveSelection('category'));
      }
    }
  }, [dispatch, highlightedIds]);

  if (clusterSets.length === 0) {
    return null;
  }

  // Build collapse items
  const collapseItems = [
    {
      key: '1',
      label: (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Text strong style={{ fontSize: '13px', color: '#262626' }}>
            Category Clusters
          </Text>
          <Tag color="default" style={{ fontSize: '11px' }}>
            {clusterSets.length}
          </Tag>
          {stats.totalHighlighted > 0 && (
            <Tag color="blue" style={{ fontSize: '11px' }}>
              {stats.totalHighlighted} selected
            </Tag>
          )}
        </div>
      ),
      children: (
        <div style={{ fontSize: '13px', paddingTop: '8px' }}>
          {/* Cluster buttons - flex wrap to flow within container */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              alignItems: 'center',
            }}
          >
            {clusterSets.map(set => {
              const { state, selectedCount, totalCount } = getClusterSelectionState(
                set.categoryIds,
                highlightedIds
              );

              // Remove "Cluster " prefix from label
              const shortLabel = set.label.replace(/^Cluster\s*/i, '');

              // Special labels that get auto width
              const isSpecialLabel = shortLabel === 'Unclassified' || shortLabel === 'Not in Semantic Space';

              return (
                <Tooltip
                  key={set.setId}
                  title={`${set.label}: ${selectedCount}/${totalCount} selected`}
                >
                  <div
                    onClick={(e) => handleClusterClick(set.categoryIds, state, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: 4,
                      transition: 'background-color 0.2s',
                      backgroundColor: state !== 'none' ? '#e6f7ff' : '#ffffff',
                      border: '1px solid #91d5ff',
                      boxShadow: state !== 'none' ? '0 0 0 1px #91d5ff' : 'none',
                      width: isSpecialLabel ? 'auto' : 40,
                    }}
                    onMouseEnter={(e) => {
                      if (state === 'none') {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = state !== 'none' ? '#e6f7ff' : '#ffffff';
                    }}
                  >
                    {/* Color swatch */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        background: set.color,
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.1)',
                        flexShrink: 0,
                      }}
                    />

                    {/* Short label */}
                    <span style={{
                      color: '#595959',
                      fontWeight: state !== 'none' ? 600 : 400,
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                    }}>
                      {shortLabel}
                    </span>
                  </div>
                </Tooltip>
              );
            })}
          </div>

          {/* Hint text */}
          <div style={{
            marginTop: '4px',
            marginBottom: '-4px',
            fontSize: '11px',
            color: '#8c8c8c',
            fontStyle: 'italic',
          }}>
            Cmd/Ctrl+click to add to selection
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Collapse
        defaultActiveKey={['1']}
        items={collapseItems}
        size="small"
      />
    </div>
  );
}
