/**
 * LibraryView.tsx — Main content area for viewing category analysis results.
 *
 * When a project is selected, shows dataset chips grouped by analysis type
 * (GO_BP, GENE, etc.). Each chip represents one category analysis result,
 * labeled with experiment metadata (sex, organ, species) from the linked
 * DoseResponseExperiment.
 *
 * Selection behavior:
 *   - Click a chip: select that single dataset (replaces any existing selection)
 *   - Ctrl+click (or Cmd+click on Mac): toggle a chip in/out of a multi-selection
 *   - The dataset chips always remain visible so the user can adjust their selection
 *
 * The selected datasets drive what's shown in the visualization area below the chips.
 */

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setSelectedCategoryResult,
  toggleSelectedCategoryResult,
  selectSelectedCategoryResults,
} from '../store/slices/navigationSlice';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import CategoryResultsView from '../components/CategoryResultsView';
import MultiDatasetView from './MultiDatasetView';
import { Icon } from '@vaadin/react-components';
import { Collapse, Typography, Tag, Tooltip } from 'antd';
import { getAnalysisTypeDisplayName } from '../utils/analysisTypeConfig';

const { Text } = Typography;

export default function LibraryView() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const selectedResults = useAppSelector(selectSelectedCategoryResults);

  const [annotations, setAnnotations] = useState<AnalysisAnnotationDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Load category result annotations when project changes
  useEffect(() => {
    if (selectedProject) {
      loadCategoryResults(selectedProject);
    } else {
      setAnnotations([]);
    }
  }, [selectedProject]);

  const loadCategoryResults = async (projectId: string) => {
    try {
      setLoading(true);
      const annotationList = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
      const validAnnotations = (annotationList || []).filter(
        (a): a is AnalysisAnnotationDto => a !== undefined
      );
      setAnnotations(validAnnotations);
    } catch (error) {
      console.error('Failed to load category results:', error);
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  };

  // Group annotations by analysis type for display
  const groupedAnnotations = annotations.reduce((acc, annotation) => {
    const type = annotation.analysisType || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(annotation);
    return acc;
  }, {} as Record<string, AnalysisAnnotationDto[]>);

  // Handle chip click — plain click selects one, ctrl/cmd+click toggles multi-select
  const handleChipClick = (datasetKey: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+click: toggle this dataset in/out of multi-selection
      dispatch(toggleSelectedCategoryResult(datasetKey));
    } else {
      // Plain click: select only this dataset
      dispatch(setSelectedCategoryResult(datasetKey));
    }
  };

  // Build a Set for quick lookup of selected state
  const selectedSet = new Set(selectedResults);

  // --- No project selected: welcome screen ---
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
          <Icon icon="vaadin:book" style={{ fontSize: '4rem', color: '#1890ff' }} className="mb-m" />
          <h1 className="text-3xl font-bold mb-m">Welcome to BMD Express Web</h1>
          <p className="text-secondary text-l">Select a project from the sidebar to get started.</p>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ padding: '2rem' }}>
          <p className="text-secondary text-l">Loading category results...</p>
        </div>
      </div>
    );
  }

  // --- No annotations found ---
  if (annotations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
          <Icon icon="vaadin:folder-open" style={{ fontSize: '4rem', color: '#faad14' }} className="mb-m" />
          <h2 className="text-2xl font-bold mb-m">Project: {selectedProject}</h2>
          <p className="text-secondary text-l">No category analysis results found in this project.</p>
        </div>
      </div>
    );
  }

  // --- Main view: dataset chips + visualization ---
  // Each selected dataset gets its own full set of visualizations.
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Dataset chips — always visible at the top */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <Collapse
          defaultActiveKey={['datasets']}
          size="small"
          bordered={false}
          items={[{
            key: 'datasets',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text strong style={{ fontSize: '13px' }}>Datasets</Text>
                <Tag color="default" style={{ fontSize: '11px' }}>{annotations.length}</Tag>
                {selectedResults.length > 0 && (
                  <Tag color="blue" style={{ fontSize: '11px' }}>
                    {selectedResults.length} selected
                  </Tag>
                )}
              </div>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(groupedAnnotations)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([analysisType, items]) => {
                    // Sub-group by organ within each analysis type
                    const byOrgan = items.reduce((acc, ann) => {
                      const organ = ann.organ || 'Other';
                      if (!acc[organ]) acc[organ] = [];
                      acc[organ].push(ann);
                      return acc;
                    }, {} as Record<string, AnalysisAnnotationDto[]>);

                    return (
                      <div key={analysisType}>
                        {/* Analysis type header */}
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#333',
                          marginBottom: '6px',
                          marginLeft: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          {getAnalysisTypeDisplayName(analysisType)}
                          <Tag color="blue" style={{ fontSize: '10px', marginLeft: '4px' }}>
                            {items.length}
                          </Tag>
                        </div>

                        {/* Organ subsections */}
                        {Object.entries(byOrgan)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([organ, organItems]) => (
                            <div key={`${analysisType}-${organ}`} style={{ marginLeft: '12px', marginBottom: '6px' }}>
                              {/* Organ label — only show if there are multiple organs */}
                              {Object.keys(byOrgan).length > 1 && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color: '#888',
                                  marginBottom: '3px',
                                }}>
                                  {organ}
                                </div>
                              )}
                              {/* Dataset chips for this organ */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {organItems.map(ann => {
                                  const datasetKey = ann.fullName || '';
                                  const isSelected = selectedSet.has(datasetKey);
                                  return (
                                    <Tooltip
                                      key={datasetKey}
                                      title={`Click to select. Ctrl+click to multi-select.\n${datasetKey}`}
                                    >
                                      <div
                                        onClick={(e) => handleChipClick(datasetKey, e)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          padding: '3px 8px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                                          color: isSelected ? '#1890ff' : '#333',
                                          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                          fontWeight: isSelected ? 600 : 400,
                                          transition: 'all 0.15s',
                                          userSelect: 'none',
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isSelected) {
                                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                                            e.currentTarget.style.borderColor = '#91d5ff';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isSelected) {
                                            e.currentTarget.style.backgroundColor = '#fff';
                                            e.currentTarget.style.borderColor = '#d9d9d9';
                                          }
                                        }}
                                      >
                                        {ann.displayName || ann.fullName}
                                      </div>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                <div style={{ fontSize: '11px', color: '#8c8c8c', fontStyle: 'italic', marginTop: '4px' }}>
                  Click to select a dataset. Ctrl+click to select multiple.
                </div>
              </div>
            ),
          }]}
        />
      </div>

      {/* Visualization area */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {selectedResults.length > 1 ? (
          /* Multiple datasets: side-by-side comparison via MultiDatasetView.
             Each chart type gets its own collapse, with all datasets' charts
             rendered in a grid inside. Uses DatasetContext for data isolation. */
          <MultiDatasetView
            key={selectedResults.join(',')}
            projectId={selectedProject}
            resultNames={selectedResults}
            annotations={annotations}
          />
        ) : selectedResults.length === 1 ? (
          /* Single dataset: full CategoryResultsView with all features */
          <CategoryResultsView
            key={`${selectedProject}-${selectedResults[0]}`}
            projectId={selectedProject}
            resultName={selectedResults[0]}
          />
        ) : (
          /* No selection: prompt */
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
              <Icon icon="vaadin:pointer" style={{ fontSize: '3rem', color: '#1890ff' }} className="mb-m" />
              <h2 className="text-xl font-bold mb-s">Select a dataset</h2>
              <p className="text-secondary">
                Click a dataset chip above to view its analysis results.
                Ctrl+click to select multiple for side-by-side comparison.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
