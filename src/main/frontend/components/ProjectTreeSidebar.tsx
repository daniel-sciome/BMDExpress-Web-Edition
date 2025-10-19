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

  const loadCategoryResults = async (projectId: string): Promise<TreeDataNode[]> => {
    try {
      const annotations = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
      const validAnnotations = (annotations || []).filter((a): a is import('Frontend/generated/com/sciome/dto/AnalysisAnnotationDto').default => a !== undefined);

      return validAnnotations.map((annotation) => ({
        title: annotation.displayName || annotation.fullName || 'Unknown',
        key: `${projectId}::${annotation.fullName}`,
        isLeaf: true,
        icon: <span style={{ fontSize: '12px' }}>📊</span>,
        data: annotation, // Store full annotation for later use
      }));
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

    // Load category results for this project
    const categoryNodes = await loadCategoryResults(key as string);

    // Update tree data
    setTreeData((prevData) =>
      updateTreeData(prevData, key, categoryNodes)
    );
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
      const [projectId, resultName] = key.split('::');
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
