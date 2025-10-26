import React, { useEffect, useState, useMemo } from 'react';
import { Card, Spin, Alert, Empty, Tag, Space } from 'antd';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type CurveDataDto from 'Frontend/generated/com/sciome/dto/CurveDataDto';
import DoseResponseCurveChart from './charts/DoseResponseCurveChart';
import { useReactiveState } from './charts/hooks/useReactiveState';
import { useAppSelector } from 'Frontend/store/hooks';
import { selectFilteredData } from 'Frontend/store/slices/categoryResultsSlice';

interface PathwayCurveViewerProps {
  projectId: string;
  resultName: string;
}

export default function PathwayCurveViewer({ projectId, resultName }: PathwayCurveViewerProps) {
  // Phase 4: Use reactive state hook - reacts to category selections
  const categoryState = useReactiveState('categoryId');

  // Get filtered categories to look up details
  const filteredCategories = useAppSelector(selectFilteredData);

  const [curveData, setCurveData] = useState<CurveDataDto[]>([]);
  const [loadingCurves, setLoadingCurves] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected category details
  const selectedCategories = useMemo(() => {
    const selectedIds = Array.from(categoryState.selectedIds);
    return filteredCategories.filter(cat =>
      cat.categoryId && selectedIds.includes(cat.categoryId)
    );
  }, [categoryState.selectedIds, filteredCategories]);

  console.log('[PathwayCurveViewer] Selected categories:', selectedCategories.length);

  // Automatically load curves when categories are selected
  useEffect(() => {
    const loadCurvesForSelectedCategories = async () => {
      if (selectedCategories.length === 0) {
        setCurveData([]);
        return;
      }

      setLoadingCurves(true);
      setError(null);

      try {
        // Load curves for each selected category
        const allCurves: CurveDataDto[] = [];

        for (const category of selectedCategories) {
          if (!category.categoryDescription) continue;

          // Get genes in this category
          const genes = await CategoryResultsService.getGenesInPathway(
            projectId,
            resultName,
            category.categoryDescription
          );

          if (!genes || genes.length === 0) continue;

          // Get curve data for these genes
          const curves = await CategoryResultsService.getCurveData(
            projectId,
            resultName,
            category.categoryDescription,
            genes.filter((g): g is string => g !== undefined)
          );

          if (curves) {
            allCurves.push(...curves.filter((c): c is CurveDataDto => c !== undefined));
          }
        }

        console.log('[PathwayCurveViewer] Loaded curves:', allCurves.length);
        setCurveData(allCurves);
      } catch (err: any) {
        setError(`Failed to load curve data: ${err.message}`);
        console.error('Error loading curve data:', err);
      } finally {
        setLoadingCurves(false);
      }
    };

    loadCurvesForSelectedCategories();
  }, [selectedCategories, projectId, resultName]);

  return (
    <Card
      title={
        <Space>
          <span>Dose-Response Curves</span>
          {selectedCategories.length > 0 && (
            <Tag color="blue">{selectedCategories.length} categories selected</Tag>
          )}
          {curveData.length > 0 && (
            <Tag color="green">{curveData.length} curves</Tag>
          )}
        </Space>
      }
      style={{ marginTop: '1rem' }}
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
            Selected Categories:
          </div>
          <Space wrap size="small">
            {selectedCategories.map(cat => (
              <Tag key={cat.categoryId} color="processing">
                {cat.categoryDescription}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Loading State */}
      {loadingCurves && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spin size="large" tip="Loading dose-response curves..." />
        </div>
      )}

      {/* Empty State - No Selection */}
      {!loadingCurves && selectedCategories.length === 0 && (
        <Empty
          description="Select categories from the table or UMAP plot to view their dose-response curves"
          style={{ padding: '2rem' }}
        />
      )}

      {/* Curve Plot */}
      {!loadingCurves && curveData.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <DoseResponseCurveChart curves={curveData} />
        </div>
      )}

      {/* Empty State - No Curves Found */}
      {!loadingCurves && selectedCategories.length > 0 && curveData.length === 0 && (
        <Empty
          description="No dose-response curves found for the selected categories"
          style={{ padding: '2rem' }}
        />
      )}
    </Card>
  );
}
