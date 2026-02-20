Scaffold a new Plotly chart component following the project's reactive visualization patterns.

Ask the user for:
- Chart name (e.g., "VolcanoPlot")
- What data it visualizes (e.g., "fold change vs p-value per gene")
- Whether it needs cluster coloring

Then create a new file at `src/main/frontend/components/charts/{ChartName}.tsx` following these patterns:

**Required structure:**
```tsx
import React, { useMemo, useRef } from 'react';
import Plot from 'react-plotly.js';
import { useAppSelector } from '../../store/hooks';
import ExportDropdown from './ExportDropdown';
// Import relevant selectors from store slices
```

**Key patterns to follow (see existing charts like BMDvsPValueScatter.tsx, BMDBoxPlot.tsx):**

1. **Two-layer rendering**: Background layer (all data, gray/dim) + foreground layer (selected/filtered data, colored by cluster)

2. **Reactive selection**: Use `useAppSelector` to read selection state from Redux. Highlight selected items. Support click-to-select via Plotly's `onClick` event.

3. **Cluster coloring**: Import cluster color utilities from `utils/clusterColors.ts`. Color traces by cluster ID.

4. **Export**: Include `ExportDropdown` component with a `plotRef` pointing to the chart container div. The export is SVG-only with Standard/Presentation/Publication size presets.

5. **Memoization**: Wrap trace computation in `useMemo` to prevent unnecessary recalculation.

6. **Layout**: Use Plotly layout with `autosize: true`, responsive container div. Include axis labels, title, and legend.

7. **Props interface**: Accept typed props for the data source, with optional appearance overrides.

Reference files:
- `src/main/frontend/components/charts/BMDvsPValueScatter.tsx` — standard two-layer scatter
- `src/main/frontend/components/charts/BMDBoxPlot.tsx` — box plot with jittered overlay
- `src/main/frontend/components/charts/ExportDropdown.tsx` — SVG export dropdown
- `src/main/frontend/components/charts/utils/clusterColors.ts` — cluster color palette
- `src/main/frontend/components/charts/utils/chartExport.ts` — export utilities
