import { useState, useEffect } from 'react';
import { Card, Tag, Spin, Collapse } from 'antd';
import { Icon } from '@vaadin/react-components';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import type ExperimentDescriptionDto from 'Frontend/generated/com/sciome/dto/ExperimentDescriptionDto';
import VennDiagram from '../components/charts/VennDiagram';
import AccumulationChartsComparison from '../components/charts/AccumulationChartsComparison';
import GlobalViolinComparison from '../components/charts/GlobalViolinComparison';
import ComparisonTable from '../components/charts/ComparisonTable';
import PrimaryFilter, { PrimaryFilterTitle } from '../components/PrimaryFilter';
import { useAppSelector } from '../store/hooks';

interface CategoryAnalysisMultisetViewProps {
  projectId: string;
  analysisType: string;  // e.g., "GO_BP"
}

/**
 * Multi-Set View for Category Analysis Results
 *
 * Shows all category analysis results of a specific type (e.g., all GO_BP results)
 * within a project. Provides Venn diagram for comparing overlaps across multiple
 * results (e.g., comparing Aflatoxin vs Benzene vs Acetaminophen).
 *
 * Accessed by clicking an analysis type group node in the sidebar tree
 * (e.g., "GO Biological Process").
 */
export default function CategoryAnalysisMultisetView({
  projectId,
  analysisType
}: CategoryAnalysisMultisetViewProps) {
  const [annotations, setAnnotations] = useState<AnalysisAnnotationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  // Map of fullName -> ExperimentDescriptionDto
  const [experimentDescriptions, setExperimentDescriptions] = useState<Record<string, ExperimentDescriptionDto>>({});
  // Track results with missing/incomplete experiment descriptions
  const [missingDescriptions, setMissingDescriptions] = useState<string[]>([]);

  // Get master filters from Redux
  const filters = useAppSelector((state) => state.categoryResults.filters);

  // Debug: Log filters whenever they change
  useEffect(() => {
    console.log('[CategoryAnalysisMultisetView] Filters changed:', filters);
  }, [filters]);

  // Calculate active filter count for Primary Filter title
  const activeFilterCount = Object.entries(filters).filter(
    ([_, value]) => value !== undefined && value !== null
  ).length;

  // Map analysis types to display names
  const getAnalysisTypeDisplayName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'GO_BP': 'GO Biological Process',
      'GO_MF': 'GO Molecular Function',
      'GO_CC': 'GO Cellular Component',
      'KEGG': 'KEGG Pathways',
      'Reactome': 'Reactome Pathways',
      'Pathway': 'Pathways',
      'GENE': 'Genes',
    };
    return typeMap[type] || type;
  };

  // Generate display name from experiment description: "Sex Organ (Species)"
  // Returns null if experiment description is not available or incomplete
  const getDisplayNameFromExperimentDesc = (desc: ExperimentDescriptionDto | undefined): string | null => {
    if (!desc) {
      return null;
    }

    const parts: string[] = [];
    if (desc.sex) parts.push(desc.sex);
    if (desc.organ) parts.push(desc.organ);

    const prefix = parts.join(' ');
    const suffix = desc.species ? `(${desc.species})` : '';

    if (!prefix || !suffix) {
      return null;
    }

    return `${prefix} ${suffix}`;
  };

  // Check if experiment description is complete
  const isExperimentDescriptionComplete = (desc: ExperimentDescriptionDto | undefined): boolean => {
    if (!desc) return false;
    return !!(desc.sex && desc.organ && desc.species);
  };

  // Load all category results of this type
  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const allAnnotations = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
        const validAnnotations = (allAnnotations || [])
          .filter((a): a is AnalysisAnnotationDto => a !== undefined);

        // Filter to only this analysis type
        const filteredAnnotations = validAnnotations.filter(
          (a) => a.analysisType === analysisType
        );

        setAnnotations(filteredAnnotations);

        // Fetch experiment descriptions for all results
        const descMap: Record<string, ExperimentDescriptionDto> = {};
        const missing: string[] = [];

        await Promise.all(
          filteredAnnotations.map(async (annotation) => {
            if (annotation.fullName) {
              try {
                const resultData = await CategoryResultsService.getCategoryResults(
                  projectId,
                  annotation.fullName
                );
                if (resultData && resultData.length > 0 && resultData[0].experimentDescription) {
                  const desc = resultData[0].experimentDescription;
                  descMap[annotation.fullName] = desc;

                  // Check if description is incomplete
                  if (!desc.sex || !desc.organ || !desc.species) {
                    missing.push(annotation.fullName);
                  }
                } else {
                  missing.push(annotation.fullName);
                }
              } catch (error) {
                console.error(`Failed to load experiment description for ${annotation.fullName}:`, error);
                missing.push(annotation.fullName);
              }
            }
          })
        );

        setExperimentDescriptions(descMap);
        setMissingDescriptions(missing);
      } catch (error) {
        console.error('Failed to load category results:', error);
        setAnnotations([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [projectId, analysisType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="Loading category analysis results..." />
      </div>
    );
  }

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
            No {getAnalysisTypeDisplayName(analysisType)} Results
          </h2>
          <p className="text-secondary text-l">
            No category analysis results of type "{analysisType}" found in project {projectId}.
          </p>
        </div>
      </div>
    );
  }

  // Show missing experiment descriptions state
  if (missingDescriptions.length > 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ maxWidth: '700px', padding: '2rem' }}>
          <Icon
            icon="vaadin:warning"
            style={{ fontSize: '4rem', color: '#faad14' }}
            className="mb-m"
          />
          <h2 className="text-2xl font-bold mb-m">
            Experiment Descriptions Required
          </h2>
          <p className="text-secondary text-l mb-l">
            Multi-dataset comparisons require experiment metadata to be set for all analyses.
            {missingDescriptions.length === annotations.length ? (
              <> All {annotations.length} analyses are missing experiment descriptions.</>
            ) : (
              <> {missingDescriptions.length} of {annotations.length} analyses are missing or have incomplete experiment descriptions.</>
            )}
          </p>
          <div style={{
            background: '#f0f0f0',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Required fields:</p>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Sex (e.g., Male, Female)</li>
              <li>Organ (e.g., Liver, Kidney)</li>
              <li>Species (e.g., Rat, Mouse)</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => {
                // Open desktop application instructions or link
                alert('Please open your project in BMDExpress Desktop Application and set experiment descriptions for all experiments.\n\nTo set experiment descriptions:\n1. Right-click on an experiment in the tree\n2. Select "Edit Experiment Description"\n3. Fill in Sex, Organ, and Species fields\n4. Save the project\n5. Reload this page');
              }}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#fff',
                background: '#1890ff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              How to Add Experiment Descriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract result names for Venn diagram
  const availableResults = annotations.map((a) => a.fullName || '').filter(Boolean);

  // Build mapping of fullName -> displayName for comparison table
  const resultDisplayNames: Record<string, string> = {};
  annotations.forEach((a) => {
    if (a.fullName) {
      const experimentDesc = experimentDescriptions[a.fullName];
      const displayName = getDisplayNameFromExperimentDesc(experimentDesc);
      resultDisplayNames[a.fullName] = displayName || a.fullName || 'Unknown';
    }
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
        flexShrink: 0
      }}>
        <h2 className="text-xl font-semibold mb-s flex items-center gap-s">
          <Icon icon="vaadin:chart-3d" style={{ color: '#1890ff' }} />
          {getAnalysisTypeDisplayName(analysisType)}
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Tag color="blue">{projectId}</Tag>
          <Tag color="green">{annotations.length} analysis results</Tag>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem'
      }}>
        {/* Primary Filter - Collapsible */}
        <Collapse
          size="small"
          items={[{
            key: 'masterfilter',
            label: <PrimaryFilterTitle activeCount={activeFilterCount} />,
            children: <PrimaryFilter hideCard={true} showComparisonMode={true} />,
          }]}
          style={{ marginBottom: '1rem', border: 'none' }}
          bordered={false}
        />

        {/* Available Results Summary - Click to Toggle */}
        <Card
          title={`Available Category Analysis Results (${selectedResults.length} selected)`}
          style={{ marginBottom: '1rem' }}
          size="small"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {annotations.map((annotation) => {
              const isSelected = selectedResults.includes(annotation.fullName || '');
              const experimentDesc = annotation.fullName ? experimentDescriptions[annotation.fullName] : undefined;
              const displayName = getDisplayNameFromExperimentDesc(experimentDesc) || annotation.fullName || 'Unknown';

              return (
                <Tag
                  key={annotation.fullName}
                  color={isSelected ? 'blue' : 'default'}
                  style={{
                    fontSize: '13px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    fontWeight: isSelected ? 600 : 400,
                    userSelect: 'none',
                    position: 'relative'
                  }}
                  onClick={() => {
                    const resultName = annotation.fullName || '';
                    if (isSelected) {
                      setSelectedResults(prev => prev.filter(r => r !== resultName));
                    } else {
                      setSelectedResults(prev => [...prev, resultName]);
                    }
                  }}
                >
                  {displayName}
                </Tag>
              );
            })}
          </div>
          <div style={{ marginTop: '1rem', color: '#666', fontSize: '13px' }}>
            Click datasets above to select/deselect them for comparison visualizations below.
            {selectedResults.length > 0 && (
              <span style={{ color: '#1890ff', marginLeft: '0.5rem' }}>
                {selectedResults.length} dataset{selectedResults.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </Card>

        {/* Comparison Tools - All rendered in collapsible panels */}
        <Collapse
          defaultActiveKey={['comparisonTable', 'venn', 'accumulation', 'globalViolin']}
          style={{ marginBottom: '1rem' }}
          items={[
            {
              key: 'comparisonTable',
              label: 'Comparison Table',
              children: (
                <ComparisonTable
                  projectId={projectId}
                  selectedResults={selectedResults}
                  resultDisplayNames={resultDisplayNames}
                  analysisType={analysisType}
                />
              ),
            },
            {
              key: 'venn',
              label: 'Venn Diagram',
              children: (
                <VennDiagram
                  projectId={projectId}
                  availableResults={availableResults}
                  selectedResults={selectedResults}
                />
              ),
            },
            {
              key: 'accumulation',
              label: 'Accumulation Charts',
              children: (
                <AccumulationChartsComparison
                  projectId={projectId}
                  availableResults={availableResults}
                  selectedResults={selectedResults}
                  analysisType={analysisType}
                />
              ),
            },
            {
              key: 'globalViolin',
              label: 'Global Violin Plot',
              children: (
                <GlobalViolinComparison
                  projectId={projectId}
                  availableResults={availableResults}
                  selectedResults={selectedResults}
                  analysisType={analysisType}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
