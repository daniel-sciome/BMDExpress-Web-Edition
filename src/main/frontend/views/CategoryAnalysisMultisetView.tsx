import { useState, useEffect } from 'react';
import { Card, Tag, Spin, Collapse } from 'antd';
import { Icon } from '@vaadin/react-components';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import VennDiagram from '../components/charts/VennDiagram';
import AccumulationChartsComparison from '../components/charts/AccumulationChartsComparison';

const { Panel } = Collapse;

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

  // Extract result names for Venn diagram
  const availableResults = annotations.map((a) => a.fullName || '').filter(Boolean);

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
        {/* Available Results Summary */}
        <Card
          title="Available Category Analysis Results"
          style={{ marginBottom: '1rem' }}
          size="small"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {annotations.map((annotation) => (
              <Tag
                key={annotation.fullName}
                color="processing"
                style={{ fontSize: '13px', padding: '4px 8px' }}
              >
                {annotation.displayName || annotation.fullName}
              </Tag>
            ))}
          </div>
          <div style={{ marginTop: '1rem', color: '#666', fontSize: '13px' }}>
            Use the comparison tools below to analyze overlaps and trends across these results.
          </div>
        </Card>

        {/* Multi-Set Comparison Tools */}
        <Collapse
          defaultActiveKey={['venn', 'accumulation']}
          style={{ marginBottom: '1rem' }}
        >
          <Panel header="Venn Diagram - Category Overlap Analysis" key="venn">
            <VennDiagram
              projectId={projectId}
              availableResults={availableResults}
            />
          </Panel>

          <Panel header="Accumulation Charts - Multi-Result Comparison" key="accumulation">
            <AccumulationChartsComparison
              projectId={projectId}
              availableResults={availableResults}
            />
          </Panel>
        </Collapse>
      </div>
    </div>
  );
}
