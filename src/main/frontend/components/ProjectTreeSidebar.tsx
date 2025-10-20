import React, { useState, useEffect } from 'react';
import { Tree } from 'antd';
import type { TreeDataNode } from 'antd';
import { ProjectService, CategoryResultsService } from 'Frontend/generated/endpoints';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedProject, setSelectedCategoryResult } from '../store/slices/navigationSlice';

export default function ProjectTreeSidebar() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const selectedCategoryResult = useAppSelector((state) => state.navigation.selectedCategoryResult);

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
    if (selectedCategoryResult && selectedProject) {
      setSelectedKeys([`${selectedProject}::${selectedCategoryResult}`]);
    } else if (selectedProject) {
      setSelectedKeys([selectedProject]);
    } else {
      setSelectedKeys([]);
    }
  }, [selectedProject, selectedCategoryResult]);

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
    if (selectedKeys.length === 0) return;

    const key = selectedKeys[0] as string;

    // Check if it's a category result (contains ::)
    if (key.includes('::')) {
      const parts = key.split('::');

      // Check if it's a category type node (format: projectId::type::typeName)
      if (parts.length === 3 && parts[1] === 'type') {
        // It's a category type node - just expand/collapse, don't select
        return;
      }

      // It's a category result (format: projectId::resultName)
      const [projectId, resultName] = parts;
      dispatch(setSelectedProject(projectId));
      dispatch(setSelectedCategoryResult(resultName));
    } else {
      // It's a project
      dispatch(setSelectedProject(key));
      dispatch(setSelectedCategoryResult(null));
    }
  };

  const onExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', color: '#666' }}>
        Loading projects...
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#666' }}>
        No projects available
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
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
    </div>
  );
}
