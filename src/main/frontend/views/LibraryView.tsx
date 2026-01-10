import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setSelectedAnalysisType, setSelectedCategoryResult } from '../store/slices/navigationSlice';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import CategoryResultsView from '../components/CategoryResultsView';
import CategoryAnalysisMultisetView from './CategoryAnalysisMultisetView';
import { Icon } from '@vaadin/react-components';
import { Collapse, Tree, Typography, Tag } from 'antd';
import type { TreeDataNode } from 'antd';

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
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

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

  // Build tree data from annotations
  const buildDatasetsTree = (): TreeDataNode[] => {
    // Group by analysisType
    const grouped = annotations.reduce((acc, annotation) => {
      const type = annotation.analysisType || 'Other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(annotation);
      return acc;
    }, {} as Record<string, AnalysisAnnotationDto[]>);

    return Object.entries(grouped).map(([analysisType, items]) => ({
      title: (
        <span>
          {getAnalysisTypeDisplayName(analysisType)}
          <Tag color="blue" style={{ marginLeft: 8, fontSize: '11px' }}>{items.length}</Tag>
        </span>
      ),
      key: `type::${analysisType}`,
      icon: <span style={{ fontSize: '12px' }}>📂</span>,
      children: items.map(annotation => ({
        title: annotation.displayName || annotation.fullName || 'Unknown',
        key: annotation.fullName || '',
        icon: <span style={{ fontSize: '12px' }}>📊</span>,
        isLeaf: true,
      })),
    })).sort((a, b) => String(a.title).localeCompare(String(b.title)));
  };

  // Handle tree selection
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) return;
    const key = selectedKeys[0] as string;

    if (key.startsWith('type::')) {
      // Analysis type selected
      const analysisType = key.replace('type::', '');
      dispatch(setSelectedAnalysisType(analysisType));
    } else {
      // Individual result selected
      dispatch(setSelectedCategoryResult(key));
    }
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
    const datasetsTree = buildDatasetsTree();
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
              <Tree
                showIcon
                treeData={datasetsTree}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys)}
                onSelect={handleTreeSelect}
                style={{ background: 'transparent' }}
              />
            ),
          }]}
        />
        <div style={{ marginTop: '1rem', color: '#666', fontSize: '13px' }}>
          <p><strong>📂 Analysis Type Groups</strong> - Click to compare multiple results</p>
          <p style={{ marginTop: '4px' }}><strong>📊 Individual Results</strong> - Click to analyze a single dataset</p>
        </div>
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
