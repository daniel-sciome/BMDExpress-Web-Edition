import React, { useState, useEffect } from 'react';
import { Collapse, Tag, Typography, Switch, Space, Radio, Spin, Tooltip, Checkbox } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getRememberFiltersPreference, setRememberFiltersPreference } from '../utils/filterGroupPersistence';
import { ProjectService } from 'Frontend/generated/endpoints';
import type ProjectMetadataDto from 'Frontend/generated/com/sciome/dto/ProjectMetadataDto';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedProject } from '../store/slices/navigationSlice';
import { setViewMode } from '../store/slices/categoryResultsSlice';
import { setDisplayMode, selectDisplayMode } from '../store/slices/visibilitySlice';
import type { DisplayMode } from '../types/visibilityTypes';
import FilterGroupList from './filters/FilterGroupList';

const { Text } = Typography;

export default function ProjectTreeSidebar() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const viewMode = useAppSelector((state) => state.categoryResults.viewMode);
  const displayMode = useAppSelector(selectDisplayMode);

  // State for remember filters preference
  const [rememberFilters, setRememberFilters] = useState<boolean>(() => getRememberFiltersPreference());

  // Handle remember filters change
  const handleRememberFiltersChange = (checked: boolean) => {
    const wasEnabled = rememberFilters;
    setRememberFilters(checked);
    setRememberFiltersPreference(checked);
    // Reload if user just disabled it (to clear saved state)
    if (wasEnabled && !checked) {
      window.location.reload();
    }
  };

  // Project list state
  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Metadata state - keyed by project ID
  const [projectMetadata, setProjectMetadata] = useState<Record<string, ProjectMetadataDto | null>>({});
  const [loadingMetadata, setLoadingMetadata] = useState<Record<string, boolean>>({});

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await ProjectService.getAllProjectIds();
      const validProjects = (projectList || []).filter((p): p is string => p !== undefined);
      setProjects(validProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load metadata for a project when its collapse is expanded
  const loadMetadataForProject = async (projectId: string) => {
    if (projectMetadata[projectId] !== undefined || loadingMetadata[projectId]) {
      return; // Already loaded or loading
    }

    setLoadingMetadata(prev => ({ ...prev, [projectId]: true }));
    try {
      const metadata = await ProjectService.getProjectMetadata(projectId);
      setProjectMetadata(prev => ({ ...prev, [projectId]: metadata }));
    } catch (error) {
      console.error('Failed to load metadata for project:', projectId, error);
      setProjectMetadata(prev => ({ ...prev, [projectId]: null }));
    } finally {
      setLoadingMetadata(prev => ({ ...prev, [projectId]: false }));
    }
  };

  // Handle project selection via radio
  const handleProjectSelect = (projectId: string) => {
    dispatch(setSelectedProject(projectId));
  };

  // Handle collapse expansion - load metadata
  const handleCollapseChange = (keys: string | string[]) => {
    const expandedKeys = Array.isArray(keys) ? keys : [keys];
    expandedKeys.forEach(key => {
      if (key && !projectMetadata[key]) {
        loadMetadataForProject(key);
      }
    });
  };

  // Render metadata tags for a project
  // TODO: Project-level metadata is not well-defined. Currently showing placeholder.
  const renderMetadataTags = (_metadata: ProjectMetadataDto | null) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '-10px' }}>
        <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>project metadata goes here</Text>
      </div>
    );
  };

  // Build project items for the nested collapse (each project is a collapse item)
  const projectItems = projects.map(projectId => ({
    key: projectId,
    label: (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Radio
          checked={selectedProject === projectId}
          onClick={(e) => {
            e.stopPropagation();
            handleProjectSelect(projectId);
          }}
        />
        <Text style={{ fontSize: '13px' }}>{projectId}</Text>
      </div>
    ),
    children: loadingMetadata[projectId] ? (
      <div style={{ padding: '8px', textAlign: 'center' }}>
        <Spin size="small" />
      </div>
    ) : (
      renderMetadataTags(projectMetadata[projectId] || null)
    ),
  }));

  // Build collapse items for projects section
  const projectCollapseItems = [
    {
      key: '1',
      label: (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Text strong style={{ fontSize: '13px', color: '#262626' }}>
            Projects
          </Text>
          {!loading && projects.length > 0 && (
            <Tag color="default" style={{ fontSize: '11px' }}>
              {projects.length}
            </Tag>
          )}
        </div>
      ),
      children: loading ? (
        <div style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
          No projects available
        </div>
      ) : (
        <Collapse
          size="small"
          items={projectItems}
          onChange={handleCollapseChange}
          style={{ background: 'transparent' }}
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
        <Space align="center">
          <Text strong style={{ fontSize: '13px', color: '#262626' }}>
            View:
          </Text>
          <Text style={{ fontSize: '13px', color: viewMode === 'simple' ? '#1890ff' : '#666' }}>
            Simple
          </Text>
            <Switch
              checked={viewMode === 'power'}
              onChange={(checked) => dispatch(setViewMode(checked ? 'power' : 'simple'))}
              size="small"
            />
          <Text style={{ fontSize: '13px', color: viewMode === 'power' ? '#1890ff' : '#666' }}>
            Advanced
          </Text>
        </Space>
      </div>

      <Collapse
        defaultActiveKey={['1']}
        items={projectCollapseItems}
        size="small"
      />

      {/* Visibility Toggle */}
      {selectedProject && (
        <div style={{
          padding: '12px 16px',
          marginTop: '8px',
          background: '#fafafa',
          borderRadius: '4px',
          border: '1px solid #d9d9d9'
        }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space align="center">
              <EyeOutlined style={{ color: '#666' }} />
              <Text strong style={{ fontSize: '13px', color: '#262626' }}>Visibility</Text>
            </Space>
            <Radio.Group
              value={displayMode}
              onChange={(e) => dispatch(setDisplayMode(e.target.value as DisplayMode))}
              size="small"
              optionType="button"
              buttonStyle="solid"
              style={{ width: '100%' }}
            >
              <Tooltip title="Show all categories at full opacity">
                <Radio.Button value="highlight" style={{ width: '33.33%', textAlign: 'center', fontSize: '11px' }}>All</Radio.Button>
              </Tooltip>
              <Tooltip title="Dim categories that don't pass filters">
                <Radio.Button value="dim" style={{ width: '33.33%', textAlign: 'center', fontSize: '11px' }}>Dim</Radio.Button>
              </Tooltip>
              <Tooltip title="Hide categories that don't pass filters">
                <Radio.Button value="isolate" style={{ width: '33.34%', textAlign: 'center', fontSize: '11px' }}>Hide</Radio.Button>
              </Tooltip>
            </Radio.Group>
          </Space>
        </div>
      )}

      {/* Simple mode: Remember Filters checkbox */}
      {viewMode === 'simple' && selectedProject && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <Checkbox
            checked={rememberFilters}
            onChange={(e) => handleRememberFiltersChange(e.target.checked)}
            style={{ fontSize: '12px' }}
          >
            Remember filter settings
          </Checkbox>
        </div>
      )}

      {/* Power User mode: Filter groups */}
      {viewMode === 'power' && (
        <>
          <FilterGroupList />
        </>
      )}
    </div>
  );
}
