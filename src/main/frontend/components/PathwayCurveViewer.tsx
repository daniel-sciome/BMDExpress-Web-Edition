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
  chartId?: string;
}

export default function PathwayCurveViewer({ projectId, resultName, chartId }: PathwayCurveViewerProps) {
  // Phase 4: Use reactive state hook - reacts to category selections
  const categoryState = useReactiveState('categoryId');

  // Get filtered categories to look up details
  const filteredCategories = useAppSelector(selectFilteredData);

  const [curveData, setCurveData] = useState<CurveDataDto[]>([]);
  const [loadedCategories, setLoadedCategories] = useState<typeof filteredCategories>([]);
  const [loadingCurves, setLoadingCurves] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable key for selected IDs — prevents useEffect from re-firing on array reference changes
  const selectedIdList = useMemo(() =>
    Array.from(categoryState.selectedIds).sort(),
    [categoryState.selectedIds]
  );
  const selectedIdsKey = selectedIdList.join(',');

  // Get selected category details
  const selectedCategories = useMemo(() => {
    return filteredCategories.filter(cat =>
      cat.categoryId && selectedIdList.includes(cat.categoryId)
    );
  }, [selectedIdsKey, filteredCategories]);

  // Automatically load curves when categories are selected
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setCurveData([]);
      return;
    }

    let cancelled = false;

    const loadCurvesForSelectedCategories = async () => {
      setLoadingCurves(true);
      setError(null);

      try {
        // Load top 20 categories by lowest BMD median to get the most relevant curves
        const categoriesToLoad = [...selectedCategories]
          .filter(c => c.categoryDescription)
          .sort((a, b) => (a.bmdMedian ?? Infinity) - (b.bmdMedian ?? Infinity))
          .slice(0, 20);

        // Load all categories in parallel
        const results = await Promise.all(
          categoriesToLoad.map(async (category) => {
            if (cancelled) return [];
            const genes = await CategoryResultsService.getGenesInPathway(
              projectId,
              resultName,
              category.categoryDescription!
            );
            if (!genes || genes.length === 0) return [];

            const curves = await CategoryResultsService.getCurveData(
              projectId,
              resultName,
              category.categoryDescription!,
              genes.filter((g): g is string => g !== undefined)
            );
            return curves?.filter((c): c is CurveDataDto => c !== undefined) ?? [];
          })
        );

        if (!cancelled) {
          setCurveData(results.flat());
          setLoadedCategories(categoriesToLoad);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(`Failed to load curve data: ${err instanceof Error ? err.message : String(err)}`);
        }
      } finally {
        if (!cancelled) {
          setLoadingCurves(false);
        }
      }
    };

    loadCurvesForSelectedCategories();
    return () => { cancelled = true; };
  }, [selectedIdsKey, projectId, resultName]);

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
          <DoseResponseCurveChart curves={curveData} selectedCategories={loadedCategories} chartId={chartId} />
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
