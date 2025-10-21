# BMDExpress Web - Implementation Patterns & Code Examples

This document provides detailed code patterns and examples used throughout the application for quick reference when adding new features.

---

## 1. Redux State Management Patterns

### Adding a New Slice

**Template** (e.g., `newFeatureSlice.ts`):
```typescript
import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { SomeService } from 'Frontend/generated/endpoints';
import type SomeDto from 'Frontend/generated/com/sciome/dto/SomeDto';
import type { RootState } from '../store';

interface NewFeatureState {
  data: SomeDto[];
  loading: boolean;
  error: string | null;
  filters: Record<string, any>;
}

const initialState: NewFeatureState = {
  data: [],
  loading: false,
  error: null,
  filters: {},
};

// Async thunk for backend calls
export const loadNewData = createAsyncThunk(
  'newFeature/load',
  async (params: { projectId: string }) => {
    const data = await SomeService.getData(params.projectId);
    return (data || []).filter((item): item is SomeDto => item !== undefined);
  }
);

const newFeatureSlice = createSlice({
  name: 'newFeature',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.filters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNewData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNewData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loadNewData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load';
      });
  },
});

export const { setFilters } = newFeatureSlice.actions;
export default newFeatureSlice.reducer;

// Selectors
const selectNewFeatureData = (state: RootState) => state.newFeature.data;
const selectNewFeatureFilters = (state: RootState) => state.newFeature.filters;

export const selectFilteredData = createSelector(
  [selectNewFeatureData, selectNewFeatureFilters],
  (data, filters) => {
    return data.filter(item => {
      // Apply filter logic
      return true;
    });
  }
);
```

### Using Redux in a Component

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadNewData, setFilters, selectFilteredData } from '../store/slices/newFeatureSlice';

export default function MyComponent() {
  const dispatch = useAppDispatch();
  const filteredData = useAppSelector(selectFilteredData);
  const loading = useAppSelector((state) => state.newFeature.loading);

  useEffect(() => {
    dispatch(loadNewData({ projectId: 'some-id' }));
  }, [dispatch]);

  const handleFilter = (newFilters: any) => {
    dispatch(setFilters(newFilters));
  };

  if (loading) return <div>Loading...</div>;
  return <div>{filteredData.length} items</div>;
}
```

---

## 2. Chart Component Patterns

### Basic Plotly Chart with Selection

```typescript
import React from 'react';
import Plot from 'react-plotly.js';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { 
  selectChartData, 
  setSelectedCategoryIds,
  toggleCategorySelection 
} from '../../store/slices/categoryResultsSlice';

export default function MyScatterChart() {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector(selectChartData);
  const selectedCategoryIds = useSelector((state: RootState) => state.categoryResults.selectedCategoryIds);

  // Prepare data
  const xData = data.map(row => row.someField || 0);
  const yData = data.map(row => row.anotherField || 0);
  const categoryIds = data.map(row => row.categoryId || '');

  // Split into selected/unselected for visual distinction
  const hasSelection = selectedCategoryIds.size > 0;
  const selectedIndices: number[] = [];
  const unselectedIndices: number[] = [];

  data.forEach((row, idx) => {
    if (selectedCategoryIds.has(row.categoryId || '')) {
      selectedIndices.push(idx);
    } else {
      unselectedIndices.push(idx);
    }
  });

  // Build traces
  const traces: any[] = [];

  if (hasSelection && unselectedIndices.length > 0) {
    traces.push({
      x: unselectedIndices.map(i => xData[i]),
      y: unselectedIndices.map(i => yData[i]),
      text: unselectedIndices.map(i => data[i].categoryDescription),
      customdata: unselectedIndices.map(i => categoryIds[i]),
      type: 'scatter',
      mode: 'markers',
      marker: {
        color: 'rgba(100, 100, 100, 0.3)',
        size: 8,
        line: { color: 'rgba(100, 100, 100, 0.5)', width: 1 },
      },
      name: 'Unselected',
      showlegend: true,
    });
  }

  if (selectedIndices.length > 0) {
    traces.push({
      x: selectedIndices.map(i => xData[i]),
      y: selectedIndices.map(i => yData[i]),
      text: selectedIndices.map(i => data[i].categoryDescription),
      customdata: selectedIndices.map(i => categoryIds[i]),
      type: 'scatter',
      mode: 'markers',
      marker: {
        color: '#1890ff',
        size: 12,
        line: { color: '#0050b3', width: 2 },
      },
      name: 'Selected',
      showlegend: hasSelection,
    });
  }

  if (!hasSelection) {
    traces.push({
      x: xData,
      y: yData,
      text: data.map(d => d.categoryDescription),
      customdata: categoryIds,
      type: 'scatter',
      mode: 'markers',
      marker: { color: '#1890ff', size: 8 },
    });
  }

  // Handle click events
  const handlePlotClick = (event: any) => {
    if (event.points && event.points.length > 0) {
      const categoryId = event.points[0].customdata;
      if (categoryId) {
        if (event.event?.ctrlKey || event.event?.metaKey) {
          dispatch(toggleCategorySelection(categoryId));
        } else {
          dispatch(setSelectedCategoryIds([categoryId]));
        }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Plot
        data={traces}
        layout={{
          title: 'My Chart',
          xaxis: { title: 'X Axis', gridcolor: '#e0e0e0' },
          yaxis: { title: 'Y Axis', gridcolor: '#e0e0e0' },
          hovermode: 'closest',
          showlegend: hasSelection,
        }}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        onClick={handlePlotClick}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
```

### Chart with Dynamic Data Source

```typescript
export default function MyBarChart({ projectId, resultName }: Props) {
  const [plotData, setPlotData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [projectId, resultName]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const data = await CategoryResultsService.getChartData(projectId, resultName);
      
      // Transform data for chart
      const trace = {
        x: data.map(d => d.label),
        y: data.map(d => d.value),
        type: 'bar',
      };
      
      setPlotData([trace]);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (plotData.length === 0) return <div>No data</div>;

  return <Plot data={plotData} layout={{ title: 'Chart' }} />;
}
```

---

## 3. Backend Service Patterns

### Hilla Service Basics

```java
package com.sciome.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.stereotype.Service;

@Service
@BrowserCallable              // Exposes to browser RPC
@AnonymousAllowed            // Allow unauthenticated access
public class MyService {
  
  /**
   * Browser-callable method - returns data directly
   */
  public List<MyDto> getDataList() {
    // Implementation
    return new ArrayList<>();
  }

  /**
   * Browser-callable method with parameters
   */
  public MyDto getDataById(String id) {
    // Implementation
    return new MyDto();
  }

  /**
   * Package-private helper - NOT exposed to browser
   */
  MyInternalModel getInternalModel(String id) {
    // Only called from Java code
    return new MyInternalModel();
  }
}
```

### Data Conversion to DTOs

```java
// Desktop model (never exposed directly)
CategoryAnalysisResult desktopModel = ...;

// Convert to DTO for Hilla
CategoryAnalysisResultDto dto = CategoryAnalysisResultDto.fromDesktopObject(desktopModel);

// Return to browser
return dto;  // Hilla serializes automatically
```

### Backend Service Method Template

```java
public List<SomeDto> processData(String projectId, List<String> filters) {
  // Validate inputs
  if (projectId == null || projectId.isEmpty()) {
    throw new IllegalArgumentException("projectId required");
  }

  // Get internal model
  BMDProject project = projectService.getProject(projectId);
  if (project == null) {
    throw new IllegalArgumentException("Project not found");
  }

  // Process data
  List<SomeDto> results = new ArrayList<>();
  for (SomeInternalModel item : project.getItems()) {
    if (item.matches(filters)) {
      results.add(SomeDto.fromInternalModel(item));
    }
  }

  // Return to browser
  return results;
}
```

---

## 4. DTO Pattern

### Creating a DTO

```java
package com.sciome.dto;

/**
 * Data Transfer Object for Hilla serialization
 * All fields should have getters/setters for Jackson
 */
public class MyDto {
  private String id;
  private String name;
  private Double value;
  private List<String> tags;

  // Default constructor for deserialization
  public MyDto() {
  }

  // Conversion from internal model
  public static MyDto fromInternalModel(InternalModel model) {
    MyDto dto = new MyDto();
    dto.setId(model.getId());
    dto.setName(model.getName());
    dto.setValue(model.calculateValue());
    dto.setTags(new ArrayList<>(model.getTags()));
    return dto;
  }

  // Getters and setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }

  public Double getValue() { return value; }
  public void setValue(Double value) { this.value = value; }

  public List<String> getTags() { return tags; }
  public void setTags(List<String> tags) { this.tags = tags; }
}
```

---

## 5. Component Integration Patterns

### Adding a New Visualization

**Step 1**: Create chart component (e.g., `src/main/frontend/components/charts/MyNewChart.tsx`):
```typescript
export default function MyNewChart() {
  const data = useAppSelector(selectChartData);
  
  return (
    <div style={{ width: '100%', height: '500px' }}>
      {/* Chart implementation */}
    </div>
  );
}
```

**Step 2**: Add to CHART_TYPES in CategoryResultsView:
```typescript
const CHART_TYPES = {
  // ... existing types
  MY_NEW_CHART: 'My New Chart',
} as const;
```

**Step 3**: Add chart option to selector and render:
```typescript
{selectedChartType === CHART_TYPES.MY_NEW_CHART && <MyNewChart />}
```

### Adding Filter UI

**Step 1**: Create filter component:
```typescript
interface FilterProps {
  value: number;
  onChange: (value: number) => void;
}

export default function MinValueFilter({ value, onChange }: FilterProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      placeholder="Min value"
    />
  );
}
```

**Step 2**: Use in parent with Redux dispatch:
```typescript
const handleFilterChange = (newValue: number) => {
  dispatch(setFilters({ minValue: newValue }));
};

return <MinValueFilter value={filters.minValue || 0} onChange={handleFilterChange} />;
```

---

## 6. Data Loading Patterns

### Pattern 1: Simple Load on Mount

```typescript
useEffect(() => {
  const load = async () => {
    try {
      const data = await SomeService.getData();
      setData(data);
    } catch (error) {
      console.error('Load failed:', error);
    }
  };
  load();
}, []);
```

### Pattern 2: Load with Dependencies

```typescript
useEffect(() => {
  if (!projectId || !resultName) return;
  
  dispatch(loadCategoryResults({ projectId, resultName }));
}, [dispatch, projectId, resultName]);
```

### Pattern 3: Cascade Loading

```typescript
// Load project list
useEffect(() => {
  loadProjects();
}, []);

// When project selected, load results
useEffect(() => {
  if (!selectedProject) return;
  loadCategoryResults(selectedProject);
}, [selectedProject]);

// When result selected, load details
useEffect(() => {
  if (!selectedCategoryResult) return;
  loadDetails();
}, [selectedCategoryResult]);
```

---

## 7. Common Utility Functions

### Formatting Numbers
```typescript
const formatNumber = (value: any, decimals: number = 3): string => {
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    return '-';
  }
  return value.toFixed(decimals);
};

const formatPValue = (value: any): string => {
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    return '-';
  }
  if (value < 0.001) return value.toExponential(2);
  return value.toFixed(4);
};
```

### Data Filtering
```typescript
const filterOutUndefined = <T,>(items: (T | undefined)[]): T[] => {
  return items.filter((item): item is T => item !== undefined);
};

// Usage
const projects = (rawData || []).filter((p): p is string => p !== undefined);
```

### Array to Set Conversion (for Redux)
```typescript
const selectedKeys = useMemo(() => {
  return Array.from(selectedCategoryIds);
}, [selectedCategoryIds]);

// Or vice versa
const handleSelectionChange = (selectedRowKeys: React.Key[]) => {
  const categoryIds = selectedRowKeys.map(key => String(key));
  dispatch(setSelectedCategoryIds(categoryIds));
};
```

---

## 8. Error Handling Patterns

### Backend Error Response

```java
throw new IllegalArgumentException("Invalid project ID");
// Hilla converts to frontend error automatically
```

### Frontend Error Handling

```typescript
try {
  const data = await SomeService.getData();
  setData(data);
} catch (error: any) {
  // Hilla backend errors have error.message
  const message = error.message || 'Unknown error';
  Notification.show(`Error: ${message}`, {
    theme: 'error',
    position: 'top-center',
    duration: 5000
  });
  setError(message);
}
```

### Redux Error Handling

```typescript
.addCase(loadData.rejected, (state, action) => {
  state.loading = false;
  state.error = action.error.message || 'Failed to load';
  // Could also log to Notification
});
```

---

## 9. Type Safety

### Using Generated Types

```typescript
// Auto-generated from Java DTO
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

// Type-safe array
const results: CategoryAnalysisResultDto[] = [];

// Type-safe property access (autocomplete in IDE)
const bmd = result.bmdMean;
```

### Generic Component

```typescript
interface GenericProps<T> {
  data: T[];
  onSelect: (item: T) => void;
  keyField: keyof T;
  labelField: keyof T;
}

function GenericSelector<T>({ data, onSelect, keyField, labelField }: GenericProps<T>) {
  return (
    <select onChange={(e) => {
      const item = data.find(d => String(d[keyField]) === e.target.value);
      if (item) onSelect(item);
    }}>
      {data.map(item => (
        <option key={String(item[keyField])} value={String(item[keyField])}>
          {String(item[labelField])}
        </option>
      ))}
    </select>
  );
}
```

---

## 10. Testing Patterns (Reference)

### Component Test Pattern

```typescript
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import MyComponent from './MyComponent';

test('renders with data', () => {
  render(
    <Provider store={store}>
      <MyComponent />
    </Provider>
  );
  
  expect(screen.getByText(/expected text/)).toBeInTheDocument();
});
```

### Mock Service

```typescript
jest.mock('Frontend/generated/endpoints', () => ({
  SomeService: {
    getData: jest.fn().mockResolvedValue([{ id: '1', name: 'Test' }]),
  },
}));
```

---

## Summary

These patterns provide reusable templates for:
- Adding Redux slices for new state
- Creating chart components with selection
- Exposing backend services to frontend
- Loading and transforming data
- Formatting and filtering data
- Error handling across the stack

When adding new features, follow these patterns to maintain consistency and leverage the existing architecture.

