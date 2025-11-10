/**
 * Cluster Legend Component
 *
 * Interactive legend showing cluster colors with click-to-toggle functionality.
 * Displays all clusters with visual feedback for hidden/visible state.
 *
 * Used by: ViolinPlotPerCategory, and potentially other cluster-colored charts
 */

import React from 'react';
import { umapDataService } from 'Frontend/data/umapDataService';
import { getClusterLabel } from './utils/clusterColors';

interface ClusterLegendProps {
  /** Map of cluster IDs to their assigned colors */
  clusterColors: Record<string | number, string>;
  /** Set of cluster IDs that are currently hidden */
  hiddenClusters: Set<string | number>;
  /** Callback when a cluster is clicked to toggle visibility */
  onToggleCluster: (clusterId: string | number) => void;
  /** Optional title for the legend */
  title?: string;
  /** Optional instruction text */
  instructionText?: string;
}

export default function ClusterLegend({
  clusterColors,
  hiddenClusters,
  onToggleCluster,
  title = 'Cluster Colors',
  instructionText = '(click to show/hide)'
}: ClusterLegendProps) {
  return (
    <div style={{
      marginTop: '1rem',
      padding: '1rem',
      background: '#f5f5f5',
      borderRadius: '4px',
      border: '1px solid #d9d9d9'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
        {title} <span style={{ fontSize: '12px', fontWeight: 400, color: '#666' }}>{instructionText}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {umapDataService.getAllClusterIds().map((clusterId) => {
          const color = clusterColors[clusterId] || '#999999';
          const label = getClusterLabel(clusterId);
          const isHidden = hiddenClusters.has(clusterId);

          return (
            <div
              key={clusterId}
              onClick={() => onToggleCluster(clusterId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                opacity: isHidden ? 0.4 : 1,
                transition: 'opacity 0.2s',
                padding: '4px 8px',
                borderRadius: '4px',
                background: isHidden ? 'transparent' : 'white',
                border: isHidden ? '1px dashed #ccc' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isHidden ? '#e8e8e8' : '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isHidden ? 'transparent' : 'white';
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: isHidden ? 'transparent' : color,
                border: `2px solid ${color}`,
                borderRadius: '2px',
                position: 'relative'
              }}>
                {isHidden && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    width: '1.5px',
                    height: '16px',
                    backgroundColor: color,
                  }} />
                )}
              </div>
              <span style={{ fontSize: '13px', textDecoration: isHidden ? 'line-through' : 'none' }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
