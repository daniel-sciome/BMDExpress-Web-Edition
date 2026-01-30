import React, { useState, useEffect } from 'react';
import { Collapse, Tag, Typography, Switch, Space, Radio, Spin, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { ProjectService } from 'Frontend/generated/endpoints';
import type ProjectMetadataDto from 'Frontend/generated/com/sciome/dto/ProjectMetadataDto';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedProject } from '../store/slices/navigationSlice';
import { setViewMode } from '../store/slices/categoryResultsSlice';
import { selectAllFilterGroups } from '../store/slices/filterSlice';
import { setDisplayMode, selectDisplayMode } from '../store/slices/visibilitySlice';
import type { DisplayMode } from '../types/visibilityTypes';
import FilterGroupList from './filters/FilterGroupList';
import FilterGroupEditor from './filters/FilterGroupEditor';

const { Text } = Typography;

export default function ProjectTreeSidebar() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const viewMode = useAppSelector((state) => state.categoryResults.viewMode);
  const filterGroups = useAppSelector(selectAllFilterGroups);
  const displayMode = useAppSelector(selectDisplayMode);

  // Find the Essential filter group
  const essentialGroup = filterGroups.find(group => group.id === 'standard-essential');

  // State for essential filter group editor
  const [essentialEditorVisible, setEssentialEditorVisible] = useState(false);

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
  const renderMetadataTags = (metadata: ProjectMetadataDto | null) => {
    if (!metadata || !metadata.experimentDescription) {
      return <Text type="secondary" style={{ fontSize: '12px' }}>No metadata available</Text>;
    }

    const exp = metadata.experimentDescription;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Row 1: Strain + Species combined */}
        {(exp.strain || exp.species) && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <Tag color="orange" style={{ fontSize: '11px', margin: 0 }}>{[exp.strain, exp.species ? exp.species.charAt(0).toUpperCase() + exp.species.slice(1) : null].filter(Boolean).join(' ')}</Tag>
          </div>
        )}
        {/* Row 2: Sex, Organ */}
        {(exp.sex || exp.organ) && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {exp.sex && <Tag color="purple" style={{ fontSize: '11px', margin: 0 }}>{exp.sex}</Tag>}
            {exp.organ && <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>{exp.organ}</Tag>}
          </div>
        )}
        {/* Row 3: Platform */}
        {exp.platform && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <Tag color="cyan" style={{ fontSize: '11px', margin: 0 }}>{exp.platform}</Tag>
          </div>
        )}
        {/* Row 4: CASRN, DSSTOX */}
        {(exp.casrn || exp.dsstox) && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {exp.casrn && <Tag color="geekblue" style={{ fontSize: '11px', margin: 0 }}>CASRN {exp.casrn}</Tag>}
            {exp.dsstox && <Tag color="geekblue" style={{ fontSize: '11px', margin: 0 }}>{exp.dsstox.replace(/^(DTXSID)(\d+)$/, '$1 $2')}</Tag>}
          </div>
        )}
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

      {/* Power User mode: Filter groups */}
      {viewMode === 'power' && (
        <>
          <FilterGroupList />
        </>
      )}
    </div>
  );
}
