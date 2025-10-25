# Session 13 Part 7: Interactive UMAP Legend and Visual Controls

## Summary
Implemented comprehensive interactive controls for the UMAP plot legend, enabling cluster selection, multi-select, and progressive visual decluttering through legend clicks. Added 3-way toggles for both cluster visibility and reference space backdrop.

## Changes Made

### 1. Cluster Legend Click Selection
**File: `src/main/frontend/components/charts/UmapScatterPlot.tsx`**

Clicking a cluster in the legend now selects all categories in that cluster and immediately makes non-selected clusters outline-only for focused analysis.

**Implementation**:
- Added `handleLegendClick` callback with cluster ID extraction
- Finds all category IDs in clicked cluster from filtered points
- Calls `categoryState.handleMultiSelect()` to update selection state
- Integrates with Phase 4 reactive infrastructure

### 2. Multi-Select with Cmd/Ctrl
**Modifier Key Support**:
- Detects `Cmd` (Mac) or `Ctrl` (Windows/Linux) key presses
- Without modifier: Single selection (replaces current selection)
- With modifier: Toggles cluster in/out of selection

**Toggle Behavior**:
- Cmd/Ctrl + click on selected cluster → Removes cluster from selection
- Cmd/Ctrl + click on unselected cluster → Adds cluster to selection
- Prevents duplicate category IDs with Set deduplication

### 3. Progressive Visual Decluttering - 3-Way Toggle

**Clicking a cluster legend item cycles through:**

**First Click**:
- Selects cluster (filled colored markers at full opacity)
- Non-selected clusters → **Outline only** (transparent fill, colored border)
- Effect: Immediate focus on selected cluster

**Second Click**:
- Cluster remains selected (filled markers)
- Non-selected clusters → **Hidden** (opacity 0)
- Effect: Maximum focus, only selected cluster visible

**Third Click**:
- **Deselects** cluster
- All clusters → Full visibility (filled markers)
- Resets to normal state

**State Management**:
- `nonSelectedDisplayMode`: `'full'` | `'outline'` | `'hidden'`
- Applied globally to all non-selected clusters
- First click immediately sets to `'outline'` for focused view

**Visual Implementation**:
- Outline mode: `rgba(..., 0)` transparent fill with 1px colored border
- Hidden mode: Opacity 0 (invisible but legend remains clickable)
- Full mode: Normal filled markers with cluster color

### 4. Reference Space Backdrop Toggle
**3-Way Visibility Cycle**:

Clicking "Reference Space" in legend cycles backdrop through:

1. **Full** (default): Black points at 0.4 opacity
2. **Dimmed**: Black points at 0.1 opacity (faint)
3. **Hidden**: Opacity 0 (invisible)
4. Cycles back to Full

**Implementation**:
- `backdropVisibility` state: `'full'` | `'dimmed'` | `'hidden'`
- Uses opacity instead of `visible: false` to keep legend clickable
- Legend marker shows outline when dimmed/hidden

### 5. Legend Marker Visual Feedback

Legend markers provide clear visual feedback about trace state:

**Filled Markers**:
- Selected clusters (when any selection exists)
- All clusters (when no selection exists)
- Active reference space backdrop (full visibility)

**Outlined Markers**:
- Non-selected clusters (when selection exists)
- Hidden/dimmed reference space backdrop
- Transparent fill with colored 1px border

**Implementation**:
- Converts hex colors to `rgba(r, g, b, 0)` for transparent fill
- Adds 1px colored border for outline effect
- Applies to both cluster traces and reference space trace

### 6. Simplified Selected Marker Styling

Selected markers use clean, minimal styling:
- **Size**: 8px (consistent for all clusters, no size change on selection)
- **Color**: Cluster color (unchanged)
- **Border**: No border (width: 0) for clean appearance
- **Opacity**: Full (1.0)

Non-selected markers when selection exists:
- **Opacity**: Controlled by `nonSelectedDisplayMode`
  - Full: 1.0
  - Outline: 1.0 with transparent fill
  - Hidden: 0

**Previous complexity removed**: Earlier implementation had variable borders and size changes that added visual noise.

### 7. TypeScript Type Safety
Fixed type mismatch in filter operation:
- `categoryState.selectedIds` is `Set<string | number>`
- Converted to string with `String(catId)` when filtering
- Ensures type safety in Set operations

## User Experience Flow

### Basic Selection Workflow
1. User clicks "Cluster 5" in legend
   - Cluster 5 selected (filled markers)
   - Other clusters become outlines immediately
   - Table highlights Cluster 5 rows
   - All charts update reactively

2. User clicks "Cluster 5" again
   - Cluster 5 remains selected
   - Other clusters hidden (opacity 0)
   - Maximum focus on Cluster 5 alone

3. User clicks "Cluster 5" again
   - Cluster 5 deselected
   - All clusters return to full visibility
   - Normal state restored

### Multi-Select Workflow
1. Click "Cluster 5" → Selected (others outlined)
2. Cmd+click "Cluster 8" → Both selected (others outlined)
3. Cmd+click "Cluster 12" → Three selected (others outlined)
4. Click any selected cluster again → Others hidden
5. Click again → Others still hidden (all selected clusters remain)
6. Click again → Deselects that specific cluster
7. Cmd+click last cluster → Deselects, back to normal

### Reference Space Control
1. Click "Reference Space" → Dims to 0.1 opacity
2. Click again → Hides completely (0 opacity)
3. Click again → Restores to 0.4 opacity

## Technical Architecture

### State Management
```typescript
// Reference space visibility (3 states)
const [backdropVisibility, setBackdropVisibility] =
  useState<'full' | 'dimmed' | 'hidden'>('full');

// Non-selected cluster display (3 states)
const [nonSelectedDisplayMode, setNonSelectedDisplayMode] =
  useState<'full' | 'outline' | 'hidden'>('full');
```

### Legend Click Handler
```typescript
handleLegendClick(event) {
  if (Reference Space clicked) {
    // Cycle: full → dimmed → hidden → full
    setBackdropVisibility(nextState);
  } else if (Cluster clicked) {
    if (!isClusterSelected) {
      // First click: select + outline non-selected
      setNonSelectedDisplayMode('outline');
      selectCluster(...);
    } else {
      // Subsequent clicks
      if (mode === 'outline') {
        setNonSelectedDisplayMode('hidden');
      } else if (mode === 'hidden') {
        deselectCluster(...);
        setNonSelectedDisplayMode('full'); // Reset
      }
    }
  }
}
```

### Trace Rendering with Display Modes
```typescript
// For each cluster trace
if (hasSelection && !isClusterSelected) {
  // Apply non-selected display mode
  if (nonSelectedDisplayMode === 'outline') {
    color = rgba(..., 0);  // Transparent
    lineWidth = 1;         // Colored border
  } else if (nonSelectedDisplayMode === 'hidden') {
    opacity = 0;           // Invisible
  }
}
```

## Updated Help Text

**Tooltip**:
"Use box/lasso select to filter categories, or click a cluster in the legend to select it. Click again to make non-selected clusters outline-only, then hidden, then deselect. Hold Cmd/Ctrl while clicking to add/remove multiple clusters. Click 'Reference Space' to cycle backdrop visibility: full → dimmed → hidden."

**Instructions Panel**:
"Use the lasso or box select tool to select GO terms, or click a cluster in the legend to select it. Click again to cycle through views of non-selected clusters: filled → outline → hidden, then click once more to deselect."

## Benefits

### Enhanced Focus
- First click immediately reduces visual noise (outlines)
- Second click maximizes focus (hides non-selected)
- Progressive decluttering matches user intent

### Intuitive Interaction
- Legend clicks directly control what you see
- Visual feedback (filled vs outlined) matches state
- Familiar modifier keys (Cmd/Ctrl) for multi-select

### Flexible Analysis
- Single cluster deep-dive: Click → hide others → deselect
- Multi-cluster comparison: Cmd+click multiple → compare selected
- Clean visualization: Hide reference space + non-selected clusters

### Reactive Integration
- Uses Phase 4 reactive infrastructure
- Selection propagates to table automatically
- All charts update synchronously
- Consistent behavior across components

## Files Changed
- src/main/frontend/components/charts/UmapScatterPlot.tsx (MODIFIED)
