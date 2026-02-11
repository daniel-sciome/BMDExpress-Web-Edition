# Detailed Synthesis of BMDExpress Web Plans

This document provides a detailed synthesis of plans related to the development of the BMDExpress web application, focusing on core frontend features.

## Core Frontend Feature: Persistent UI State

A significant planned enhancement to the user interface is the persistence of UI state, as detailed in the plan `hidden-crunching-wand.md`.

### Objective

The primary goal of this plan is to improve the user experience by ensuring that user's choices for chart visibility and section expansion/collapse are not lost when they navigate between different category results in the application. Currently, this state is managed locally and resets on component re-mounts.

### Technical Implementation Details

The plan proposes a robust solution using the Redux state management library, which is already in use for managing filters.

#### 1. New Redux Slice for UI State

A new Redux slice dedicated to UI state will be created at `src/main/frontend/store/slices/uiStateSlice.ts`. This slice will manage the state for UI elements.

The state interface will be:
```typescript
interface UiState {
  visibleCharts: string[];        // Stores the IDs of charts selected by the user
  openChartCollapses: string[];   // Stores the keys of collapse sections that are expanded
}
```

The slice will include the following actions to manipulate the state:
*   `setVisibleCharts(charts: string[])`: Sets the visible charts directly.
*   `toggleChart(chartId: string)`: Toggles the visibility of a single chart.
*   `setOpenCollapses(keys: string[])`: Sets the open collapse sections directly.
*   `toggleCollapse(key: string)`: Toggles a single collapse section.
*   `collapseAll()`: A utility to collapse all sections.

It will also export selectors to allow components to access this state:
*   `selectVisibleCharts`
*   `selectOpenCollapses`

#### 2. Store Integration

The new `uiState` reducer from the slice will be registered in the main Redux store configuration file located at `src/main/frontend/store/store.ts`.

#### 3. Component Refactoring

The `CategoryResultsView.tsx` component, located at `src/main/frontend/components/CategoryResultsView.tsx`, will be refactored to integrate with the new Redux state.

The current implementation using local `useState` hooks:
```typescript
const [visibleCharts, setVisibleCharts] = useState<string[]>([]);
const [openChartCollapses, setOpenChartCollapses] = useState<string[]>([...]);
```
will be replaced with selectors and dispatch hooks from Redux:
```typescript
const visibleCharts = useAppSelector(selectVisibleCharts);
const openChartCollapses = useAppSelector(selectOpenCollapses);
const dispatch = useAppDispatch();
```
Event handlers within the component will be updated to `dispatch` the new Redux actions instead of calling local state setters.

#### 4. Cross-Session Persistence (Optional)

The plan also suggests an optional but recommended enhancement: persisting the UI state to the browser's `localStorage`. This would ensure that the user's UI preferences are preserved even across browser refreshes and new sessions, similar to how filters are currently handled.
