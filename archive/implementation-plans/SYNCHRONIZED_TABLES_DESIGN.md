# Synchronized Tables Architecture

## Problem Statement

Ant Design's multi-level table headers don't visually center well when a parent header has only one child column. The "ANOVA" parent header looks off-center because it only spans 60-85px.

## Solution: Side-by-Side Synchronized Tables

Split the single large table into multiple smaller tables displayed side-by-side, where each table represents a logical column group.

## Architecture

### Component Structure

```
SynchronizedTables (Wrapper Component)
├── Shared State
│   ├── sortedData (keeps all tables in same row order)
│   ├── selectedRowKey (highlights same row across all tables)
│   └── scrollRefs (synchronizes vertical scrolling)
│
├── Table Group 1: Gene Counts
├── Table Group 2: ANOVA
├── Table Group 3: Fisher's Test  
├── Table Group 4: BMD Statistics
└── ... (more groups as needed)
```

### Key Synchronization Mechanisms

#### 1. Row Order (Sorting)
```typescript
// Single source of truth for sorted data
const [sortedData, setSortedData] = useState(dataSource);

// All tables receive same sorted data
<Table dataSource={sortedData} ... />

// When any table sorts, update shared state
onChange: (pagination, filters, sorter) => {
  const sorted = [...sortedData].sort(...)
  setSortedData(sorted); // All tables re-render with new order
}
```

#### 2. Vertical Scrolling
```typescript
const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);

const handleScroll = (scrollingIndex) => (e) => {
  const scrollTop = e.currentTarget.scrollTop;
  
  // Update all OTHER tables to match
  scrollRefs.current.forEach((ref, index) => {
    if (index !== scrollingIndex) {
      ref.scrollTop = scrollTop;
    }
  });
};
```

#### 3. Row Selection/Highlighting
```typescript
// Common row class name generator
rowClassName: (record) => 
  record.categoryId === selectedRowKey ? 'selected-row' : '';

// CSS applies to all tables
.selected-row { background-color: #e6f7ff !important; }
```

#### 4. Row Heights
- Ant Design automatically keeps row heights consistent when using same `size` prop
- Same CSS classes across all tables ensure uniform rendering
- All tables use identical data, so content length is same

### Benefits

1. **Perfect Header Centering**
   - Each table group has its own header row
   - Parent header naturally centers across full table width
   - No more cramped single-child headers

2. **Visual Grouping**
   - Each column group is clearly distinct
   - Easy to see logical relationships

3. **Flexible Widths**
   - Can assign different widths to different groups
   - Important columns can be wider

4. **Easy Show/Hide**
   - Hide entire table group vs filtering individual columns
   - Cleaner column visibility UI

### Trade-offs

1. **Sorting UX**
   - User must understand sorting one table affects all tables
   - Could add visual indicator showing active sort column

2. **No Global Horizontal Scroll**
   - Each table scrolls horizontally independently
   - For very wide datasets, need good width management

3. **State Management**
   - More complex than single table
   - But follows same patterns as other synchronized components in app

4. **Column Reordering**
   - Can't drag column from one group to another
   - But can reorder within a group

### Integration Points

The existing app already has synchronization patterns:
- Charts sync with table selection
- Filters sync across all visualizations  
- UMAP highlighting syncs with table

Adding table-to-table sync follows the same architectural pattern.

## Implementation Steps

1. ✅ Create `SynchronizedTables` component
2. ⏳ Test with 2-3 column groups
3. ⏳ Integrate with existing `CategoryResultsGrid`
4. ⏳ Add column visibility controls (show/hide groups)
5. ⏳ Handle edge cases (empty data, loading states)
6. ⏳ Performance testing with large datasets

## Testing Plan

- [ ] Verify row order stays synchronized across all tables
- [ ] Verify scrolling stays synchronized
- [ ] Verify row selection highlights across all tables  
- [ ] Test with different column group configurations
- [ ] Test with filtered data
- [ ] Test performance with 1000+ rows
- [ ] Test responsive behavior

