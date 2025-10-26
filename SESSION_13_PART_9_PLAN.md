# Session 13 Part 9: Venn Diagram Relocation to Multi-Set View

## Problem Statement

### Current Incorrect Architecture

The Venn diagram is currently located in `CategoryResultsView.tsx`, which displays analysis results for a **single category analysis dataset** (e.g., "Aflatoxin_Female_Liver_GO_BP"). However, the Venn diagram's purpose is to show **relationships among multiple category analysis sets** - comparing overlapping GO terms across different chemicals, sexes, or organs.

**Current Location:**
```
CategoryResultsView (Single Dataset View)
  └─ Charts Panel
      └─ Venn Diagram Checkbox ← WRONG: Can't compare multiple datasets from single dataset view
```

**Current User Flow:**
1. User selects individual category result from sidebar (e.g., "Aflatoxin_Female_Liver_GO_BP")
2. `CategoryResultsView` displays that ONE dataset
3. User sees "Venn Diagram" checkbox in chart options
4. User must manually select 2-5 OTHER datasets from dropdown
5. **Conceptually confusing**: Viewing one dataset but comparing across multiple

**Why This Is Wrong:**
- Venn diagram compares MULTIPLE datasets, but view context is SINGLE dataset
- User must navigate away from natural context (type group) to access comparison
- No visual indication that Venn is for cross-dataset comparison
- Backend API `getVennDiagramData(projectId, categoryResultNames[])` expects multiple result names

### Sidebar Tree Structure

```
BMDExpress_Project (Project Node)
  │
  ├─ GO Biological Process (Type Group Node) ← key: "projectId::type::GO_BP"
  │   │                                        ← SHOULD show CategoryAnalysisMultisetView
  │   ├─ Aflatoxin_Female_Liver_GO_BP         ← key: "projectId::resultName"
  │   ├─ Benzene_Female_Liver_GO_BP           ← Shows CategoryResultsView (single)
  │   ├─ Acetaminophen_Male_Liver_GO_BP
  │   └─ ...
  │
  ├─ GO Molecular Function (Type Group Node) ← key: "projectId::type::GO_MF"
  │   ├─ Aflatoxin_Female_Liver_GO_MF
  │   └─ ...
  │
  └─ KEGG Pathways (Type Group Node)
      └─ ...
```

**Current Behavior:**
- Clicking type group node (e.g., "GO Biological Process") → Just expands/collapses
- Clicking individual result → Shows `CategoryResultsView` (single dataset)

**Desired Behavior:**
- Clicking type group node → Shows `CategoryAnalysisMultisetView` (multi-dataset comparison)
- Clicking individual result → Shows `CategoryResultsView` (single dataset analysis)

## Solution Architecture

### New View: CategoryAnalysisMultisetView

Create a new view component that displays when user selects an **analysis type group** (e.g., "GO Biological Process") rather than an individual result.

**Purpose:**
- Display all category analysis results of a specific type within a project
- Provide Venn diagram for comparing overlaps across 2-5 results
- Potentially support other multi-dataset comparisons in the future

**View Hierarchy:**
```
LibraryView (Main View Router)
  ├─ No Selection → Welcome Screen
  ├─ Project Selected + Analysis Type Selected → CategoryAnalysisMultisetView (NEW)
  ├─ Project Selected + Individual Result Selected → CategoryResultsView (existing)
  └─ Project Selected Only → Show first available view
```

### Navigation State Update

The navigation state needs to track three levels:
1. Project (e.g., "BMDExpress_Project")
2. Analysis Type (e.g., "GO_BP") - **NEW**
3. Individual Category Result (e.g., "Aflatoxin_Female_Liver_GO_BP")

**State Machine:**
```
State 1: Nothing selected
  → selectedProject: null
  → selectedAnalysisType: null
  → selectedCategoryResult: null

State 2: Project selected
  → selectedProject: "BMDExpress_Project"
  → selectedAnalysisType: null
  → selectedCategoryResult: null

State 3: Analysis Type selected (NEW)
  → selectedProject: "BMDExpress_Project"
  → selectedAnalysisType: "GO_BP"
  → selectedCategoryResult: null
  → View: CategoryAnalysisMultisetView

State 4: Individual Result selected
  → selectedProject: "BMDExpress_Project"
  → selectedAnalysisType: "GO_BP" (inferred)
  → selectedCategoryResult: "Aflatoxin_Female_Liver_GO_BP"
  → View: CategoryResultsView
```

## Implementation Plan

### 1. Update Navigation State Slice

**File:** `src/main/frontend/store/slices/navigationSlice.ts`

**Changes:**
```typescript
interface NavigationState {
  selectedProject: string | null;
  selectedAnalysisType: string | null;  // NEW: e.g., "GO_BP"
  selectedCategoryResult: string | null;
}

const initialState: NavigationState = {
  selectedProject: null,
  selectedAnalysisType: null,  // NEW
  selectedCategoryResult: null,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<string | null>) => {
      state.selectedProject = action.payload;
      // Clear both type and result when project changes
      if (state.selectedProject !== action.payload) {
        state.selectedAnalysisType = null;  // NEW
        state.selectedCategoryResult = null;
      }
    },

    // NEW ACTION
    setSelectedAnalysisType: (state, action: PayloadAction<string | null>) => {
      state.selectedAnalysisType = action.payload;
      // Clear individual result when type changes
      if (state.selectedAnalysisType !== action.payload) {
        state.selectedCategoryResult = null;
      }
    },

    setSelectedCategoryResult: (state, action: PayloadAction<string | null>) => {
      state.selectedCategoryResult = action.payload;
      // Clear analysis type when individual result selected
      if (action.payload !== null) {
        state.selectedAnalysisType = null;
      }
    },

    clearSelection: (state) => {
      state.selectedProject = null;
      state.selectedAnalysisType = null;  // NEW
      state.selectedCategoryResult = null;
    },
  },
});

export const {
  setSelectedProject,
  setSelectedAnalysisType,  // NEW EXPORT
  setSelectedCategoryResult,
  clearSelection,
} = navigationSlice.actions;

// NEW SELECTOR
export const selectSelectedAnalysisType = (state: RootState) =>
  state.navigation.selectedAnalysisType;

export const selectSelectedProject = (state: RootState) =>
  state.navigation.selectedProject;

export const selectSelectedCategoryResult = (state: RootState) =>
  state.navigation.selectedCategoryResult;
```

**Rationale:**
- `selectedAnalysisType` and `selectedCategoryResult` are mutually exclusive
- Selecting analysis type clears individual result (for multi-set view)
- Selecting individual result clears analysis type (for single-set view)
- Changing project clears both subordinate selections

### 2. Update ProjectTreeSidebar Selection Logic

**File:** `src/main/frontend/components/ProjectTreeSidebar.tsx`

**Current Code (lines 155-179):**
```typescript
const onSelect = (selectedKeys: React.Key[], info: any) => {
  if (selectedKeys.length === 0) return;

  const key = selectedKeys[0] as string;

  // Check if it's a category result (contains ::)
  if (key.includes('::')) {
    const parts = key.split('::');

    // Check if it's a category type node (format: projectId::type::typeName)
    if (parts.length === 3 && parts[1] === 'type') {
      // It's a category type node - just expand/collapse, don't select
      return;  // ← WRONG: Should select for multi-set view
    }

    // It's a category result (format: projectId::resultName)
    const [projectId, resultName] = parts;
    dispatch(setSelectedProject(projectId));
    dispatch(setSelectedCategoryResult(resultName));
  } else {
    // It's a project
    dispatch(setSelectedProject(key));
    dispatch(setSelectedCategoryResult(null));
  }
};
```

**Updated Code:**
```typescript
const onSelect = (selectedKeys: React.Key[], info: any) => {
  if (selectedKeys.length === 0) return;

  const key = selectedKeys[0] as string;

  // Check if it's a category result (contains ::)
  if (key.includes('::')) {
    const parts = key.split('::');

    // Check if it's a category type node (format: projectId::type::typeName)
    if (parts.length === 3 && parts[1] === 'type') {
      // It's a category type node - SELECT IT for multi-set view
      const [projectId, , analysisType] = parts;
      dispatch(setSelectedProject(projectId));
      dispatch(setSelectedAnalysisType(analysisType));  // NEW
      // Note: setSelectedAnalysisType will automatically clear selectedCategoryResult
      return;
    }

    // It's a category result (format: projectId::resultName)
    const [projectId, resultName] = parts;
    dispatch(setSelectedProject(projectId));
    dispatch(setSelectedCategoryResult(resultName));
    // Note: setSelectedCategoryResult will automatically clear selectedAnalysisType
  } else {
    // It's a project
    dispatch(setSelectedProject(key));
    dispatch(setSelectedAnalysisType(null));  // NEW
    dispatch(setSelectedCategoryResult(null));
  }
};
```

**Add Import:**
```typescript
import { setSelectedProject, setSelectedCategoryResult, setSelectedAnalysisType } from '../store/slices/navigationSlice';
```

### 3. Create CategoryAnalysisMultisetView Component

**File:** `src/main/frontend/views/CategoryAnalysisMultisetView.tsx` (NEW FILE)

**Component Structure:**
```typescript
import { useState, useEffect } from 'react';
import { Card, Tag, Spin } from 'antd';
import { Icon } from '@vaadin/react-components';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import VennDiagram from '../components/charts/VennDiagram';

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
            Use the Venn diagram below to compare overlapping categories across these results.
          </div>
        </Card>

        {/* Venn Diagram - Moved from CategoryResultsView */}
        <VennDiagram
          projectId={projectId}
          availableResults={availableResults}
        />

        {/* Future: Other multi-set comparison tools */}
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: '4px',
          color: '#666'
        }}>
          <strong>Future Multi-Set Comparisons:</strong>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            <li>Upset plots for complex set relationships</li>
            <li>Heatmaps showing category presence across results</li>
            <li>Statistical overlap significance testing</li>
            <li>Concordance analysis for shared categories</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

**Key Features:**
- Displays header with analysis type name and project
- Shows all available category results of this type as tags
- Contains VennDiagram component (relocated from CategoryResultsView)
- Provides context for why user is seeing multi-set comparison
- Placeholder for future multi-set comparison features

### 4. Update LibraryView Routing Logic

**File:** `src/main/frontend/views/LibraryView.tsx`

**Current Code:**
```typescript
export default function LibraryView() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const selectedCategoryResult = useAppSelector((state) => state.navigation.selectedCategoryResult);

  // ... (annotations loading)

  // No selection - show welcome message
  if (!selectedProject) {
    return <WelcomeScreen />;
  }

  // ... loading and empty states

  // Build tabs for individual results
  const tabItems = annotations.map(...);

  return <TabsView items={tabItems} />;
}
```

**Updated Code:**
```typescript
import CategoryAnalysisMultisetView from './CategoryAnalysisMultisetView';  // NEW IMPORT

export default function LibraryView() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const selectedAnalysisType = useAppSelector((state) => state.navigation.selectedAnalysisType);  // NEW
  const selectedCategoryResult = useAppSelector((state) => state.navigation.selectedCategoryResult);

  // ... (annotations loading)

  // No selection - show welcome message
  if (!selectedProject) {
    return <WelcomeScreen />;
  }

  // NEW: Analysis type selected (multi-set view)
  if (selectedAnalysisType && !selectedCategoryResult) {
    return (
      <CategoryAnalysisMultisetView
        projectId={selectedProject}
        analysisType={selectedAnalysisType}
      />
    );
  }

  // ... loading and empty states

  // Build tabs for individual results (existing behavior)
  const tabItems = annotations.map(...);

  return <TabsView items={tabItems} />;
}
```

**View Routing Logic:**
```
1. No project selected → Welcome screen
2. Project + Analysis Type selected → CategoryAnalysisMultisetView
3. Project + Individual Result selected → Tabs with CategoryResultsView
4. Project only → Tabs with all results
```

### 5. Remove Venn Diagram from CategoryResultsView

**File:** `src/main/frontend/components/CategoryResultsView.tsx`

**Remove Import (line 16):**
```typescript
import VennDiagram from './charts/VennDiagram';  // DELETE
```

**Remove from Chart Visibility Checkbox (line 218):**
```typescript
<Checkbox value="14">Venn Diagram</Checkbox>  // DELETE
```

**Remove from Collapse Items (lines 321-325):**
```typescript
visibleCharts.includes('14') && {
  key: '14',
  label: 'Venn Diagram',
  children: <VennDiagram key={`${projectId}-${resultName}`} projectId={projectId} availableResults={availableResults} />,
},  // DELETE ENTIRE BLOCK
```

**Remove availableResults State (lines 29, 55-64):**
```typescript
const [availableResults, setAvailableResults] = useState<string[]>([]);  // DELETE

const loadAvailableResults = async () => {  // DELETE ENTIRE FUNCTION
  try {
    const results = await CategoryResultsService.getCategoryResultNames(projectId);
    if (results && Array.isArray(results)) {
      setAvailableResults(results.filter((r): r is string => typeof r === 'string'));
    }
  } catch (err) {
    console.error('Failed to load available results:', err);
  }
};

useEffect(() => {
  // ...
  loadAvailableResults();  // DELETE THIS CALL
}, [dispatch, projectId, resultName]);
```

**Update Default Visible Charts (line 30):**
```typescript
// Remove '14' from default visible charts
const [visibleCharts, setVisibleCharts] = useState(['1']); // Already correct
```

### 6. Update VennDiagram Component Documentation

**File:** `src/main/frontend/components/charts/VennDiagram.tsx`

**Add Comment at Top:**
```typescript
/**
 * Venn Diagram Component
 *
 * Displays Venn diagram showing category overlaps across 2-5 category analysis results.
 *
 * LOCATION: This component is used in CategoryAnalysisMultisetView, which displays
 * when user selects an analysis type group in the sidebar (e.g., "GO Biological Process").
 *
 * RATIONALE: Venn diagrams compare multiple datasets, so they belong in a multi-set view,
 * not in the single-dataset CategoryResultsView.
 */
```

No functional changes to VennDiagram component - it already accepts `projectId` and `availableResults` props correctly.

## User Experience Flow

### Before (Current - Confusing)

1. User clicks "GO Biological Process" type node in sidebar
   - Nothing happens (just expands/collapses)
2. User clicks "Aflatoxin_Female_Liver_GO_BP" (individual result)
   - Shows CategoryResultsView (single dataset)
3. User scrolls through charts, checks "Venn Diagram" checkbox
   - Confused: "I'm viewing ONE dataset, why am I comparing multiple?"
4. User selects 2-5 datasets from dropdown
   - Dropdown includes ALL results in project, even different types
5. User clicks "Generate Venn Diagram"
   - Works, but conceptually disconnected from current view

**Problems:**
- No indication that Venn is for cross-dataset comparison
- Context mismatch: viewing single dataset, but comparing multiple
- Must leave natural grouping (type node) to access comparison

### After (Improved - Intuitive)

1. User clicks "GO Biological Process" type node in sidebar
   - **Shows CategoryAnalysisMultisetView**
   - Lists all GO_BP results: Aflatoxin, Benzene, Acetaminophen, etc.
   - Venn diagram immediately visible
2. User sees clear context: "Compare overlaps across these GO_BP results"
3. User selects 2-5 results from dropdown (filtered to GO_BP only)
4. User clicks "Generate Venn Diagram"
   - Natural context: already in multi-set comparison view

**Benefits:**
- Clear visual hierarchy: type node → multi-set view
- Context matches intent: comparing datasets within same type
- Natural navigation: drill down for single-set, drill up for multi-set

### Navigation Hierarchy

```
Project Level
  └─ Shows project info, upload interface (HomeView/LibraryView)
      │
      ├─ Analysis Type Level (NEW)
      │  └─ Shows CategoryAnalysisMultisetView
      │      └─ Venn diagram for comparing results of this type
      │      └─ Lists all results of this type
      │      └─ Future: other multi-set comparisons
      │
      └─ Individual Result Level
         └─ Shows CategoryResultsView
             └─ Table with categories
             └─ Charts for single dataset (UMAP, BMD scatter, etc.)
             └─ Master filter
             └─ Reactive selection infrastructure
```

## Technical Benefits

### 1. Conceptual Clarity
- Multi-set operations (Venn diagram) in multi-set view
- Single-set operations (UMAP, scatter plots) in single-set view
- Clear separation of concerns

### 2. Navigation Consistency
- Three-level hierarchy: Project → Type → Individual Result
- Each level has appropriate actions and views
- Type nodes are now interactive, not just organizational

### 3. Filtering Correctness
- Venn diagram naturally filtered to same analysis type
- No confusion about comparing GO_BP vs GO_MF (different types)
- Backend API receives homogeneous result sets

### 4. Future Extensibility
- CategoryAnalysisMultisetView can host other multi-set comparisons:
  - UpSet plots (for >5 sets)
  - Overlap heatmaps
  - Statistical significance testing
  - Concordance analysis
- Clear place to add multi-set features without cluttering single-set view

### 5. Redux State Machine
- Three-level state matches three-level UI hierarchy
- Mutually exclusive: type XOR individual result
- Clear state transitions

## Backend Compatibility

**No backend changes required.** The existing API already supports this:

```java
// CategoryResultsService.java (lines 452-523)
public VennDiagramDataDto getVennDiagramData(
  String projectId,
  List<String> categoryResultNames  // Already accepts multiple results
) {
  // Returns overlaps across 2-5 results
}
```

The backend is already designed for multi-set comparison. We're just fixing the frontend to match.

## Testing Checklist

### Navigation State
- [ ] Click project node → sets selectedProject, clears type and result
- [ ] Click type node → sets selectedProject + selectedAnalysisType, clears result
- [ ] Click individual result → sets selectedProject + selectedCategoryResult, clears type
- [ ] selectedAnalysisType and selectedCategoryResult are mutually exclusive

### View Routing
- [ ] No selection → Welcome screen
- [ ] Project only → Shows tabs with all results
- [ ] Project + Type → Shows CategoryAnalysisMultisetView
- [ ] Project + Individual result → Shows CategoryResultsView in tab

### CategoryAnalysisMultisetView
- [ ] Displays correct analysis type display name (e.g., "GO Biological Process")
- [ ] Shows all results of that type as tags
- [ ] VennDiagram component receives correct availableResults (filtered to type)
- [ ] Empty state when no results of that type exist

### CategoryResultsView
- [ ] Venn Diagram checkbox removed from chart options
- [ ] Venn Diagram panel no longer rendered
- [ ] All other charts still function correctly
- [ ] No availableResults loading (removed)

### Backward Compatibility
- [ ] Existing single-result views work unchanged
- [ ] LibraryView tabs still function for individual results
- [ ] HomeView upload and project management unchanged

## Migration Notes

### For Users
- **New Feature:** Click analysis type groups (e.g., "GO Biological Process") to compare multiple results
- **Changed Location:** Venn diagram moved from individual result view to type group view
- **Benefit:** More intuitive location for cross-dataset comparisons

### For Developers
- **New Component:** `CategoryAnalysisMultisetView.tsx` - multi-set comparison view
- **Updated State:** `navigationSlice.ts` now tracks `selectedAnalysisType`
- **Updated Routing:** `LibraryView.tsx` routes to multi-set view when type selected
- **Removed:** Venn diagram from `CategoryResultsView.tsx`

## Files to Modify

### New Files
1. `src/main/frontend/views/CategoryAnalysisMultisetView.tsx` - New multi-set view component

### Modified Files
1. `src/main/frontend/store/slices/navigationSlice.ts` - Add selectedAnalysisType state
2. `src/main/frontend/components/ProjectTreeSidebar.tsx` - Update onSelect to handle type nodes
3. `src/main/frontend/views/LibraryView.tsx` - Add routing for multi-set view
4. `src/main/frontend/components/CategoryResultsView.tsx` - Remove Venn diagram
5. `src/main/frontend/components/charts/VennDiagram.tsx` - Add documentation comment

### Documentation
1. `SESSION_13_PART_9_PLAN.md` - This file (planning document)
2. `SESSION_13_PART_9_NOTES.md` - Implementation notes (to be created after implementation)

## Implementation Order

1. **Update navigationSlice.ts** - Add state infrastructure first
2. **Create CategoryAnalysisMultisetView.tsx** - Build new view component
3. **Update ProjectTreeSidebar.tsx** - Enable type node selection
4. **Update LibraryView.tsx** - Add routing logic
5. **Update CategoryResultsView.tsx** - Remove Venn diagram
6. **Update VennDiagram.tsx** - Add documentation
7. **Test** - Verify all navigation paths and views
8. **Commit** - Session 13 Part 9 with comprehensive changes
9. **Deploy** - Push to production

## Success Criteria

- [x] Plan document created and reviewed
- [ ] All navigation states implemented correctly
- [ ] CategoryAnalysisMultisetView displays correctly
- [ ] Type nodes in sidebar are selectable
- [ ] LibraryView routes correctly to multi-set or single-set views
- [ ] Venn diagram removed from CategoryResultsView
- [ ] No regressions in existing single-result views
- [ ] All TypeScript type errors resolved
- [ ] Successful deployment to production
