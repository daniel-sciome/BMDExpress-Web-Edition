/**
 * Synchronized Tables Component
 * 
 * Displays multiple table groups side-by-side with synchronized:
 * - Row order (sorting)
 * - Row selection/highlighting
 * - Vertical scrolling
 * - Row heights
 */

import React, { useState, useRef, useEffect } from 'react';
import { Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';

interface SynchronizedTablesProps<T> {
  dataSource: T[];
  tableGroups: {
    key: string;
    columns: ColumnsType<T>;
    width?: number | string;
  }[];
  rowKey: string | ((record: T) => string);
  onRowClick?: (record: T) => void;
  selectedRowKey?: string;
}

export function SynchronizedTables<T extends Record<string, any>>({
  dataSource,
  tableGroups,
  rowKey,
  onRowClick,
  selectedRowKey,
}: SynchronizedTablesProps<T>) {
  const [sortedData, setSortedData] = useState(dataSource);
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrolling = useRef(false);

  // Update sorted data when source data changes
  useEffect(() => {
    setSortedData(dataSource);
  }, [dataSource]);

  // Synchronized scroll handler
  const handleScroll = (scrollingIndex: number) => (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrolling.current) return;
    
    const scrollTop = e.currentTarget.scrollTop;
    isScrolling.current = true;
    
    scrollRefs.current.forEach((ref, index) => {
      if (ref && index !== scrollingIndex) {
        ref.scrollTop = scrollTop;
      }
    });
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  };

  // Common table props
  const commonTableProps: TableProps<T> = {
    dataSource: sortedData,
    rowKey,
    pagination: false,
    size: 'small',
    rowClassName: (record) => {
      const key = typeof rowKey === 'function' ? rowKey(record) : record[rowKey];
      return key === selectedRowKey ? 'selected-row' : '';
    },
    onRow: (record) => ({
      onClick: () => onRowClick?.(record),
      style: { cursor: onRowClick ? 'pointer' : 'default' },
    }),
    // Handle sorting - update sortedData for ALL tables
    onChange: (pagination, filters, sorter: any) => {
      if (sorter.order) {
        const sorted = [...sortedData].sort((a, b) => {
          const aValue = a[sorter.field] || 0;
          const bValue = b[sorter.field] || 0;
          
          if (sorter.order === 'ascend') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        setSortedData(sorted);
      }
    },
  };

  return (
    <div style={{ display: 'flex', gap: '0', width: '100%', overflow: 'auto' }}>
      {tableGroups.map((group, index) => (
        <div
          key={group.key}
          style={{
            flex: group.width ? '0 0 auto' : 1,
            width: group.width,
            minWidth: group.width || 'auto',
            borderRight: index < tableGroups.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}
        >
          <div
            ref={(el) => (scrollRefs.current[index] = el)}
            onScroll={handleScroll(index)}
            style={{ overflow: 'auto', maxHeight: '600px' }}
          >
            <Table<T>
              {...commonTableProps}
              columns={group.columns}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>
      ))}

      <style>{`
        .selected-row {
          background-color: #e6f7ff !important;
        }
        .selected-row:hover {
          background-color: #bae7ff !important;
        }
      `}</style>
    </div>
  );
}
