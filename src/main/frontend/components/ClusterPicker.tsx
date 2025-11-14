// ClusterPicker.tsx
// Cluster picker component for the sidebar
// Shows all cluster colors with labels
// Behaves exactly like UMAP legend - selects/deselects categories

import React, { useState, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCategorySetsByType } from '../store/slices/renderStateSlice';
import { CategorySetType } from '../types/renderState';
import { useReactiveState } from './charts/hooks/useReactiveState';

export default function ClusterPicker() {
  const categoryState = useReactiveState('categoryId');
  const [nonSelectedDisplayMode, setNonSelectedDisplayMode] = useState<'full' | 'outline' | 'hidden'>('full');

  // Get all cluster sets
  const clusterSets = useAppSelector(state => selectCategorySetsByType(CategorySetType.CLUSTER)(state));

  const handleClusterClick = useCallback((categoryIds: string[], event: React.MouseEvent) => {
    // Check if Cmd (Mac) or Ctrl (Windows/Linux) key is pressed for multi-select
    const isMultiSelect = event.ctrlKey || event.metaKey;

    // Check if this cluster is currently selected
    const isClusterSelected = categoryIds.some(catId => categoryState.selectedIds.has(catId));

    if (!isClusterSelected) {
      // Cluster not selected - first click selects it AND makes non-selected markers outline
      console.log('[ClusterPicker] Selecting cluster, non-selected -> outline');
      console.log('[ClusterPicker] Calling handleMultiSelect with:', {
        categoryIds: categoryIds.slice(0, 5),
        totalCount: categoryIds.length,
        source: 'cluster-picker'
      });
      setNonSelectedDisplayMode('outline');

      if (isMultiSelect) {
        // Multi-select: add to existing selection
        const currentSelection = Array.from(categoryState.selectedIds);
        const mergedSelection = [...new Set([...currentSelection, ...categoryIds])];
        categoryState.handleMultiSelect(mergedSelection, 'cluster-picker');
      } else {
        // Single select: replace selection
        categoryState.handleMultiSelect(categoryIds, 'cluster-picker');
      }
    } else {
      // Cluster is selected - cycle through: outline -> hidden -> deselect
      if (nonSelectedDisplayMode === 'outline') {
        console.log('[ClusterPicker] Switching to hidden mode');
        setNonSelectedDisplayMode('hidden');
      } else if (nonSelectedDisplayMode === 'hidden') {
        // hidden -> deselect
        console.log('[ClusterPicker] Deselecting cluster');
        setNonSelectedDisplayMode('full'); // Reset for next selection

        if (isMultiSelect) {
          // Multi-select: remove from selection
          const currentSelection = Array.from(categoryState.selectedIds);
          const categoryIdsSet = new Set(categoryIds);
          const newSelection = currentSelection.filter(id => !categoryIdsSet.has(String(id)));

          if (newSelection.length > 0) {
            categoryState.handleMultiSelect(newSelection, 'cluster-picker');
          } else {
            categoryState.handleClear();
          }
        } else {
          // Single-select: clear all
          categoryState.handleClear();
        }
      }
    }
  }, [categoryState, nonSelectedDisplayMode]);

  if (clusterSets.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        background: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        fontSize: '13px',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#262626' }}>
        Clusters
      </div>
      {clusterSets.map(set => {
        // Check if this cluster is selected (any category in the cluster is selected)
        const isSelected = set.categoryIds.some(catId => categoryState.selectedIds.has(catId));

        return (
          <div
            key={set.setId}
            onClick={(e) => handleClusterClick(set.categoryIds, e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: 2,
              transition: 'background-color 0.2s',
              backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
              border: isSelected ? '1px solid #1890ff' : '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isSelected ? '#e6f7ff' : 'transparent';
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                background: set.color,
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#595959', fontWeight: isSelected ? 600 : 400 }}>{set.label}</span>
          </div>
        );
      })}
    </div>
  );
}
