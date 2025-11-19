import React, { useState, useEffect } from 'react';
import { Tree, Collapse, Tag, Typography, Switch, Space, Divider, Button } from 'antd';
import type { TreeDataNode } from 'antd';
import { ProjectService, CategoryResultsService } from 'Frontend/generated/endpoints';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedProject, setSelectedAnalysisType, setSelectedCategoryResult } from '../store/slices/navigationSlice';
import { setViewMode } from '../store/slices/categoryResultsSlice';
import { selectAllFilterGroups } from '../store/slices/filterSlice';
import ClusterPicker from './ClusterPicker';
import FilterGroupList from './filters/FilterGroupList';
import FilterGroupEditor from './filters/FilterGroupEditor';

const { Text } = Typography;

export default function ProjectTreeSidebar() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const selectedAnalysisType = useAppSelector((state) => state.navigation.selectedAnalysisType);
  const selectedCategoryResult = useAppSelector((state) => state.navigation.selectedCategoryResult);
  const viewMode = useAppSelector((state) => state.categoryResults.viewMode);
  const filterGroups = useAppSelector(selectAllFilterGroups);

  // Find the Essential filter group
  const essentialGroup = filterGroups.find(group => group.id === 'standard-essential');

  // State for essential filter group editor
  const [essentialEditorVisible, setEssentialEditorVisible] = useState(false);

  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Update selected keys when Redux state changes
  useEffect(() => {
    let newKeys: React.Key[] = [];

    if (selectedCategoryResult && selectedProject) {
      // Individual result selected
      newKeys = [`${selectedProject}::${selectedCategoryResult}`];
      console.log('[ProjectTreeSidebar] Setting selectedKeys to individual result:', newKeys);
    } else if (selectedAnalysisType && selectedProject) {
      // Analysis type selected (multiset view)
      newKeys = [`${selectedProject}::type::${selectedAnalysisType}`];
      console.log('[ProjectTreeSidebar] Setting selectedKeys to analysis type:', newKeys);
    } else if (selectedProject) {
      // Just project selected
      newKeys = [selectedProject];
      console.log('[ProjectTreeSidebar] Setting selectedKeys to project:', newKeys);
    } else {
      // Nothing selected
      newKeys = [];
      console.log('[ProjectTreeSidebar] Clearing selectedKeys');
    }

    setSelectedKeys(newKeys);
  }, [selectedProject, selectedAnalysisType, selectedCategoryResult]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await ProjectService.getAllProjectIds();
      const projects = (projectList || []).filter((p): p is string => p !== undefined);

      // Build tree structure
      const tree: TreeDataNode[] = projects.map((projectId) => ({
        title: projectId,
        key: projectId,
        isLeaf: false,
        selectable: false,  // Project nodes are NOT selectable, only expandable
        children: [], // Will be loaded on expand
      }));

      setTreeData(tree);
    } catch (error) {
      console.error('Failed to load projects:', error);
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
      'KEGG': 'KEGG Pathways',
      'Reactome': 'Reactome Pathways',
      'Pathway': 'Pathways',
      'GENE': 'Genes',
    };

    return typeMap[analysisType] || analysisType;
  };

  const loadCategoryResults = async (projectId: string): Promise<TreeDataNode[]> => {
    try {
      const annotations = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
      const validAnnotations = (annotations || []).filter((a): a is import('Frontend/generated/com/sciome/dto/AnalysisAnnotationDto').default => a !== undefined);

      // Group annotations by analysisType
      const groupedByType = validAnnotations.reduce((acc, annotation) => {
        const type = annotation.analysisType || 'Other';
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(annotation);
        return acc;
      }, {} as Record<string, typeof validAnnotations>);

      // Create tree nodes for each category type
      const typeNodes = Object.entries(groupedByType).map(([analysisType, annotations]) => ({
        title: getAnalysisTypeDisplayName(analysisType),
        key: `${projectId}::type::${analysisType}`,
        isLeaf: false,
        icon: <span style={{ fontSize: '12px' }}>📂</span>,
        children: annotations.map((annotation) => ({
          title: annotation.displayName || annotation.fullName || 'Unknown',
          key: `${projectId}::${annotation.fullName}`,
          isLeaf: true,
          icon: <span style={{ fontSize: '12px' }}>📊</span>,
          data: annotation, // Store full annotation for later use
        })),
      }));

      // Sort by type name for consistent display
      return typeNodes.sort((a, b) => (a.title as string).localeCompare(b.title as string));
    } catch (error) {
      console.error('Failed to load category results:', error);
      return [];
    }
  };

  const onLoadData = async (node: any): Promise<void> => {
    const { key, children } = node;

    // Already loaded
    if (children && children.length > 0) {
      return;
    }

    // Check if this is a project node (no :: in key)
    const keyStr = key as string;
    if (!keyStr.includes('::')) {
      // Load category type groups for this project
      const categoryTypeNodes = await loadCategoryResults(keyStr);

      // Update tree data
      setTreeData((prevData) =>
        updateTreeData(prevData, key, categoryTypeNodes)
      );
    }
    // Category type nodes already have their children loaded inline
  };

  const updateTreeData = (
    list: TreeDataNode[],
    key: React.Key,
    children: TreeDataNode[]
  ): TreeDataNode[] => {
    return list.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });
  };

  const onSelect = (selectedKeys: React.Key[], info: any) => {
    console.log('[ProjectTreeSidebar] onSelect called with keys:', selectedKeys);

    if (selectedKeys.length === 0) {
      console.log('[ProjectTreeSidebar] Empty selection, ignoring');
      return;
    }

    const key = selectedKeys[0] as string;
    console.log('[ProjectTreeSidebar] Selected key:', key);

    // All selectable nodes contain :: (projects are non-selectable)
    if (!key.includes('::')) {
      console.warn('[ProjectTreeSidebar] Unexpected selection of non-:: key:', key);
      return;
    }

    const parts = key.split('::');

    // Check if it's a category type node (format: projectId::type::typeName)
    if (parts.length === 3 && parts[1] === 'type') {
      // It's a category type node - SELECT IT for multi-set view
      const [projectId, , analysisType] = parts;
      console.log('[ProjectTreeSidebar] Type node selected:', { projectId, analysisType });
      dispatch(setSelectedProject(projectId));
      dispatch(setSelectedAnalysisType(analysisType));
      return;
    }

    // It's a category result (format: projectId::resultName)
    const [projectId, resultName] = parts;
    console.log('[ProjectTreeSidebar] Individual result selected:', { projectId, resultName });
    dispatch(setSelectedProject(projectId));
    dispatch(setSelectedCategoryResult(resultName));
  };

  const onExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  // Build collapse items for projects
  const projectCollapseItems = [
    {
      key: '1',
      label: (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Text strong style={{ fontSize: '13px', color: '#262626' }}>
            BMD Express 3 Projects
          </Text>
          {!loading && treeData.length > 0 && (
            <Tag color="default" style={{ fontSize: '11px' }}>
              {treeData.length} {treeData.length === 1 ? 'project' : 'projects'}
            </Tag>
          )}
        </div>
      ),
      children: loading ? (
        <div style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
          Loading projects...
        </div>
      ) : treeData.length === 0 ? (
        <div style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
          No projects available
        </div>
      ) : (
        <Tree
          showIcon
          loadData={onLoadData}
          treeData={treeData}
          expandedKeys={expandedKeys}
          selectedKeys={selectedKeys}
          onSelect={onSelect}
          onExpand={onExpand}
          style={{
            background: 'transparent',
            fontSize: '14px',
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '8px 0' }}>
      {/* View Mode Toggle */}
      <div style={{
        padding: '12px 16px',
        marginBottom: '8px',
        background: '#f0f5ff',
        borderRadius: '4px',
        border: '1px solid #adc6ff'
      }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text strong style={{ fontSize: '12px', color: '#262626' }}>
            View Mode
          </Text>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: '13px', color: viewMode === 'simple' ? '#1890ff' : '#666' }}>
              Simple
            </Text>
            <Switch
              checked={viewMode === 'power'}
              onChange={(checked) => dispatch(setViewMode(checked ? 'power' : 'simple'))}
              size="small"
            />
            <Text style={{ fontSize: '13px', color: viewMode === 'power' ? '#1890ff' : '#666' }}>
              Power User
            </Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {viewMode === 'simple'
              ? 'Simple view with table and filters'
              : 'Advanced view with charts and visualizations'
            }
          </Text>
        </Space>
      </div>

      <Collapse
        defaultActiveKey={['1']}
        items={projectCollapseItems}
        size="small"
      />

      {/* Simple mode: Essential Filter Group */}
      {viewMode === 'simple' && essentialGroup && selectedProject && (
        <>
          <Collapse
            size="small"
            defaultActiveKey={['essential']}
            style={{ marginTop: '8px' }}
            items={[{
              key: 'essential',
              label: (
                <Space>
                  <Text strong style={{ fontSize: '13px' }}>{essentialGroup.name}</Text>
                  {essentialGroup.enabled && (
                    <Tag color="green" style={{ fontSize: '11px' }}>Active</Tag>
                  )}
                </Space>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {essentialGroup.description}
                    </Text>
                  </div>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => setEssentialEditorVisible(true)}
                    style={{ width: '100%' }}
                  >
                    Edit Filters
                  </Button>
                </div>
              ),
            }]}
          />
          {essentialEditorVisible && (
            <FilterGroupEditor
              visible={essentialEditorVisible}
              onClose={() => setEssentialEditorVisible(false)}
              editingGroup={essentialGroup}
            />
          )}
        </>
      )}

      {/* Power User mode: Cluster picker and Filter groups */}
      {viewMode === 'power' && (
        <>
          <ClusterPicker />
          <FilterGroupList />
        </>
      )}
    </div>
  );
}
