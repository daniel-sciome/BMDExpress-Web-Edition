import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setSelectedAnalysisType, setSelectedCategoryResult } from '../store/slices/navigationSlice';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import CategoryResultsView from '../components/CategoryResultsView';
import CategoryAnalysisMultisetView from './CategoryAnalysisMultisetView';
import { Icon } from '@vaadin/react-components';
import { Collapse, Typography, Tag, Tooltip } from 'antd';

const { Text } = Typography;

/**
 * Library View - Displays category results based on sidebar selection
 * Directly shows the selected result without tabs (navigation handled by sidebar tree)
 */
export default function LibraryView() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const selectedAnalysisType = useAppSelector((state) => state.navigation.selectedAnalysisType);
  const selectedCategoryResult = useAppSelector((state) => state.navigation.selectedCategoryResult);

  const [annotations, setAnnotations] = useState<AnalysisAnnotationDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Load category results when project changes
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
      const validAnnotations = (annotationList || []).filter((a): a is AnalysisAnnotationDto => a !== undefined);
      setAnnotations(validAnnotations);
      // No auto-selection - require explicit user clicks
    } catch (error) {
      console.error('Failed to load category results:', error);
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get friendly name for analysis type
  const getAnalysisTypeDisplayName = (analysisType: string | undefined): string => {
    if (!analysisType) return 'Other';
    const typeMap: Record<string, string> = {
      'GO_BP': 'GO Biological Process',
      'GO_MF': 'GO Molecular Function',
      'GO_CC': 'GO Cellular Component',
      'GO_ALL': 'GO All Terms',
      'KEGG': 'KEGG Pathways',
      'Reactome': 'Reactome Pathways',
      'BioPlanet': 'BioPlanet Pathways',
      'Pathway': 'Pathways',
      'GENE': 'Genes',
    };
    return typeMap[analysisType] || analysisType;
  };

  // Group annotations by analysis type
  const groupedAnnotations = annotations.reduce((acc, annotation) => {
    const type = annotation.analysisType || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(annotation);
    return acc;
  }, {} as Record<string, AnalysisAnnotationDto[]>);

  // Handle dataset chip click
  const handleDatasetClick = (datasetKey: string) => {
    dispatch(setSelectedCategoryResult(datasetKey));
  };

  // Handle analysis type click (group header)
  const handleAnalysisTypeClick = (analysisType: string) => {
    dispatch(setSelectedAnalysisType(analysisType));
  };

  // No selection - show welcome message
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
          <Icon
            icon="vaadin:book"
            style={{ fontSize: '4rem', color: '#1890ff' }}
            className="mb-m"
          />
          <h1 className="text-3xl font-bold mb-m">
            Welcome to BMDExpress Web
          </h1>
          <p className="text-secondary text-l">
            Select a project from the sidebar to get started.
          </p>
          <p className="text-secondary mt-m">
            Expand a project to view and analyze category results.
          </p>
        </div>
      </div>
    );
  }

  // Analysis type selected (multi-set view)
  if (selectedAnalysisType && !selectedCategoryResult) {
    return (
      <CategoryAnalysisMultisetView
        projectId={selectedProject}
        analysisType={selectedAnalysisType}
      />
    );
  }

  // Project selected but loading category results
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ padding: '2rem' }}>
          <p className="text-secondary text-l">Loading category results...</p>
        </div>
      </div>
    );
  }

  // Project selected but nothing specific chosen yet
  if (!selectedAnalysisType && !selectedCategoryResult) {
    if (annotations.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
            <Icon
              icon="vaadin:folder-open"
              style={{ fontSize: '4rem', color: '#faad14' }}
              className="mb-m"
            />
            <h2 className="text-2xl font-bold mb-m">
              Project: {selectedProject}
            </h2>
            <p className="text-secondary text-l">
              No category analysis results found in this project.
            </p>
          </div>
        </div>
      );
    }

    // Show datasets collapse for user to select
    return (
      <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 className="text-2xl font-bold mb-m">
          Project: {selectedProject}
        </h2>
        <Collapse
          defaultActiveKey={['datasets']}
          size="small"
          items={[{
            key: 'datasets',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text strong style={{ fontSize: '13px' }}>Datasets</Text>
                <Tag color="default" style={{ fontSize: '11px' }}>{annotations.length}</Tag>
              </div>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(groupedAnnotations).sort((a, b) => a[0].localeCompare(b[0])).map(([analysisType, items]) => (
                  <div key={analysisType}>
                    {/* Analysis type header */}
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#666',
                        marginBottom: '4px',
                        marginLeft: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>🧬</span>
                      {getAnalysisTypeDisplayName(analysisType)}
                      <Tag color="blue" style={{ fontSize: '10px', marginLeft: '4px' }}>{items.length}</Tag>
                    </div>
                    {/* Dataset chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginLeft: '4px' }}>
                      {items.map(ann => {
                        const datasetKey = ann.fullName || '';
                        return (
                          <Tooltip
                            key={datasetKey}
                            title="Click to select this dataset"
                          >
                            <div
                              onClick={() => handleDatasetClick(datasetKey)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                backgroundColor: '#fff',
                                color: '#333',
                                border: '1px solid #d9d9d9',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e6f7ff';
                                e.currentTarget.style.borderColor = '#91d5ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff';
                                e.currentTarget.style.borderColor = '#d9d9d9';
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
                {/* Hint text */}
                <div style={{ fontSize: '11px', color: '#8c8c8c', fontStyle: 'italic', marginTop: '4px' }}>
                  Click a dataset to view it, or click a group header to compare all in that category
                </div>
              </div>
            ),
          }]}
        />
      </div>
    );
  }

  // Individual category result selected - show directly (no tabs needed, sidebar handles navigation)
  if (selectedCategoryResult) {
    return (
      <div className="h-full">
        <CategoryResultsView
          projectId={selectedProject}
          resultName={selectedCategoryResult}
        />
      </div>
    );
  }

  // Project selected but no specific result - this should not happen with current navigation
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
        <Icon
          icon="vaadin:folder-open"
          style={{ fontSize: '4rem', color: '#1890ff' }}
          className="mb-m"
        />
        <h2 className="text-2xl font-bold mb-m">
          Project: {selectedProject}
        </h2>
        <p className="text-secondary text-l">
          Select a category analysis result from the sidebar.
        </p>
      </div>
    </div>
  );
}
