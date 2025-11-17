/**
 * ComparisonTable Component
 *
 * Displays category analysis results from multiple datasets side-by-side
 * for easy comparison. Shows key metrics for each category across all
 * selected analyses.
 */

import React, { useState, useEffect } from 'react';
import { Table, Spin, Empty, Select, Typography, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { useAppSelector } from '../../store/hooks';
import { applyMasterFilters } from '../../utils/applyMasterFilters';

const { Text } = Typography;
const { Option } = Select;

interface ComparisonTableProps {
  projectId: string;
  selectedResults: string[];
  resultDisplayNames?: Record<string, string>; // Map fullName -> displayName
  analysisType?: string; // e.g., "GO_BP", "GENE"
}

interface ComparisonRow {
  categoryId: string;
  categoryName: string;
  [key: string]: any; // Dynamic columns for each dataset
}

/**
 * Abbreviate dataset name to sex/organ format
 * Examples:
 *   "Aflatoxin - Male - Liver" -> "Male-Liver"
 *   "Benzene - Female - Kidney" -> "Female-Kidney"
 *   "Chemical - M - Liver" -> "M-Liver"
 */
function abbreviateDatasetName(fullName: string): string {
  // Split by common delimiters (-, |, etc.)
  const parts = fullName.split(/\s*[-|]\s*/);

  // If we have at least 3 parts (Chemical - Sex - Organ), take the last 2
  if (parts.length >= 3) {
    return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
  }

  // If we have 2 parts, use both
  if (parts.length === 2) {
    return `${parts[0]}-${parts[1]}`;
  }

  // Otherwise, return the full name
  return fullName;
}

export default function ComparisonTable({
  projectId,
  selectedResults,
  resultDisplayNames = {},
  analysisType,
}: ComparisonTableProps) {
  const [loading, setLoading] = useState(false);
  const [dataByResult, setDataByResult] = useState<Record<string, CategoryAnalysisResultDto[]>>({});
  const [comparisonData, setComparisonData] = useState<ComparisonRow[]>([]);
  const [comparisonMetric, setComparisonMetric] = useState<string>('bmdMedian');

  // Get master filters and comparison mode from Redux
  const filters = useAppSelector((state) => state.categoryResults.filters);
  const comparisonMode = useAppSelector((state) => state.categoryResults.comparisonMode);
  const showIntersection = comparisonMode === 'intersection';

  // Available metrics for comparison
  const metrics = [
    { value: 'bmdMean', label: 'BMD Mean' },
    { value: 'bmdMedian', label: 'BMD Median' },
    { value: 'fishersExactTwoTailPValue', label: "Fisher's P-Value" },
    { value: 'genesThatPassedAllFilters', label: 'Genes Passed' },
    { value: 'geneAllCount', label: 'Total Genes' },
    { value: 'percentage', label: 'Percentage' },
  ];

  // Load data for all selected results
  useEffect(() => {
    if (selectedResults.length === 0) {
      setDataByResult({});
      setComparisonData([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const dataMap: Record<string, CategoryAnalysisResultDto[]> = {};

        console.log('[ComparisonTable] Loading data for results:', selectedResults);
        console.log('[ComparisonTable] Current filters:', JSON.stringify(filters, null, 2));
        console.log('[ComparisonTable] Analysis type:', analysisType);

        // Load data for each selected result
        await Promise.all(
          selectedResults.map(async (resultName) => {
            const data = await CategoryResultsService.getCategoryResults(projectId, resultName);
            console.log(`[ComparisonTable] Loaded ${data?.length || 0} rows for ${resultName}`);

            // Apply master filters to the loaded data
            const filteredData = applyMasterFilters(data || [], filters, analysisType);
            console.log(`[ComparisonTable] After filtering: ${filteredData.length} rows for ${resultName}`);

            dataMap[resultName] = filteredData;
          })
        );

        setDataByResult(dataMap);
      } catch (error) {
        console.error('Failed to load comparison data:', error);
        setDataByResult({});
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, selectedResults, filters, analysisType]);

  // Build comparison table data
  useEffect(() => {
    if (Object.keys(dataByResult).length === 0) {
      setComparisonData([]);
      return;
    }

    console.log('[ComparisonTable] Building comparison data from filtered datasets:',
      Object.entries(dataByResult).map(([name, data]) => `${name}: ${data.length} rows`));

    // Collect category IDs for each dataset
    const categorySetsByDataset: Map<string, Set<string>> = new Map();
    const categoryNames: Record<string, string> = {};

    Object.entries(dataByResult).forEach(([resultName, data]) => {
      const categoryIds = new Set<string>();
      data.forEach((row) => {
        if (row.categoryId) {
          categoryIds.add(row.categoryId);
          if (!categoryNames[row.categoryId] && row.categoryDescription) {
            categoryNames[row.categoryId] = row.categoryDescription;
          }
        }
      });
      categorySetsByDataset.set(resultName, categoryIds);
    });

    // Find intersection or union based on toggle
    const allDatasets = Array.from(categorySetsByDataset.values());
    const categorySet = new Set<string>();

    if (showIntersection) {
      // Intersection: categories that appear in ALL datasets
      if (allDatasets.length > 0) {
        // Start with categories from the first dataset
        const firstDatasetCategories = allDatasets[0];
        firstDatasetCategories.forEach(catId => {
          // Check if this category appears in ALL other datasets
          const appearsInAll = allDatasets.every(datasetCategories =>
            datasetCategories.has(catId)
          );
          if (appearsInAll) {
            categorySet.add(catId);
          }
        });
      }
      console.log('[ComparisonTable] Categories in intersection (appear in all datasets):', categorySet.size);
    } else {
      // Union: all unique categories across all datasets
      categorySetsByDataset.forEach(categoryIds => {
        categoryIds.forEach(catId => categorySet.add(catId));
      });
      console.log('[ComparisonTable] Categories in union (appear in any dataset):', categorySet.size);
    }

    // Build comparison rows
    const rows: ComparisonRow[] = Array.from(categorySet).map((catId) => {
      const row: ComparisonRow = {
        categoryId: catId,
        categoryName: categoryNames[catId] || catId,
      };

      // Add metric value for each dataset
      selectedResults.forEach((resultName) => {
        const data = dataByResult[resultName] || [];
        const categoryRow = data.find((r) => r.categoryId === catId);
        row[resultName] = categoryRow?.[comparisonMetric as keyof CategoryAnalysisResultDto];
      });

      return row;
    });

    setComparisonData(rows);
  }, [dataByResult, selectedResults, comparisonMetric, showIntersection]);

  // Build dynamic columns
  const columns: ColumnsType<ComparisonRow> = [
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      fixed: 'left',
      width: 300,
      ellipsis: true,
      render: (text: string, record: ComparisonRow) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>{record.categoryId}</div>
        </div>
      ),
    },
    ...selectedResults.map((resultName) => {
      const displayName = resultDisplayNames[resultName] || abbreviateDatasetName(resultName);
      return {
        title: (
          <Tooltip title={resultName}>
            <span>{displayName}</span>
          </Tooltip>
        ),
        dataIndex: resultName,
        key: resultName,
        width: 150,
        render: (value: any) => {
          if (value === undefined || value === null) {
            return <Text type="secondary">—</Text>;
          }
          if (typeof value === 'number') {
            return value.toFixed(4);
          }
          return String(value);
        },
      };
    }),
  ];

  if (selectedResults.length === 0) {
    return (
      <Empty
        description="Select datasets above to compare them in a table"
        style={{ padding: '2rem' }}
      />
    );
  }

  return (
    <div>
      {/* Metric selector */}
      <div style={{ marginBottom: '1rem' }}>
        <Text strong style={{ marginRight: '0.5rem' }}>Compare by:</Text>
        <Select
          value={comparisonMetric}
          onChange={setComparisonMetric}
          style={{ width: 200 }}
        >
          {metrics.map((m) => (
            <Option key={m.value} value={m.value}>
              {m.label}
            </Option>
          ))}
        </Select>
      </div>

      {/* Comparison table */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={comparisonData}
          rowKey="categoryId"
          size="small"
          scroll={{ x: 'max-content', y: 600 }}
          pagination={{
            defaultPageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
          }}
        />
      </Spin>
    </div>
  );
}
