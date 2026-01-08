/**
 * Example: Using SynchronizedTables with Category Results
 * 
 * This shows how to split the category results table into synchronized groups
 */

import React from 'react';
import { SynchronizedTables } from './SynchronizedTables';
import {
  getGeneCountsColumns,
  getSignificantANOVAColumn,
  getFishersFullColumns,
  getBMDEssentialColumns,
} from './categoryTable/columns';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

interface Props {
  data: CategoryAnalysisResultDto[];
  selectedCategoryId?: string;
  onCategoryClick?: (category: CategoryAnalysisResultDto) => void;
}

export function CategoryResultsGridSynchronized({ data, selectedCategoryId, onCategoryClick }: Props) {
  // Define table groups - each becomes its own table
  const tableGroups = [
    {
      key: 'geneCounts',
      columns: getGeneCountsColumns(),
      width: '250px', // Fixed width or flex: 1 for proportional
    },
    {
      key: 'anova',
      columns: getSignificantANOVAColumn(),
      width: '120px',
    },
    {
      key: 'fishers',
      columns: getFishersFullColumns(),
      width: '350px',
    },
    {
      key: 'bmdStats',
      columns: getBMDEssentialColumns(),
      width: '300px',
    },
  ];

  return (
    <SynchronizedTables
      dataSource={data}
      tableGroups={tableGroups}
      rowKey="categoryId"
      selectedRowKey={selectedCategoryId}
      onRowClick={onCategoryClick}
    />
  );
}

/**
 * Key Features of This Approach:
 * 
 * 1. SYNCHRONIZED SCROLLING:
 *    - Scroll any table, all tables scroll together
 *    - Uses refs and scroll event handlers
 * 
 * 2. SYNCHRONIZED SORTING:
 *    - Sort any column, all tables re-order together
 *    - Shared sortedData state in parent
 * 
 * 3. SYNCHRONIZED SELECTION:
 *    - Click any row, that row highlights across all tables
 *    - Shared selectedRowKey prop
 * 
 * 4. ROW HEIGHT SYNC:
 *    - Ant Design handles this automatically
 *    - All tables use same dataSource, same size="small"
 *    - CSS classes ensure consistent heights
 * 
 * 5. FLEXIBLE WIDTH:
 *    - Each table group can have fixed width or flex
 *    - Responsive to container size
 * 
 * BENEFITS:
 * - Parent headers naturally center (single <th> spans full width)
 * - Each group is visually distinct
 * - Easy to hide/show entire groups
 * - Can have different widths per group
 * 
 * TRADE-OFFS:
 * - More complex state management
 * - No drag-and-drop column reordering across groups
 * - Horizontal scrolling per group (not global)
 */
