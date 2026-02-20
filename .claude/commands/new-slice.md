Scaffold a new Redux Toolkit slice.

Ask the user for:
- Slice name (e.g., "comparison")
- What state it manages (e.g., "selected datasets for multi-set comparison")
- Key state fields and their types

Then:

1. **Create the slice** at `src/main/frontend/store/slices/{name}Slice.ts` following this pattern:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface {Name}State {
  // state fields here
}

const initialState: {Name}State = {
  // initial values
};

const {name}Slice = createSlice({
  name: '{name}',
  initialState,
  reducers: {
    // actions here
  },
});

export const { /* action names */ } = {name}Slice.actions;

// Selectors
export const select{Field} = (state: RootState) => state.{name}.{field};

export default {name}Slice.reducer;
```

2. **Register in store** — add the import and reducer entry in `src/main/frontend/store/store.ts`:
   - Import: `import {name}Reducer from './slices/{name}Slice';`
   - Add to `reducer: { ... {name}: {name}Reducer, ... }`

Key conventions (from existing slices like `uiStateSlice.ts`, `filterSlice.ts`):
- Use `PayloadAction<T>` for typed action payloads
- Export selectors alongside the slice (collocated)
- Use typed hooks from `store/hooks.ts`: `useAppDispatch`, `useAppSelector`
- If state needs localStorage persistence, add load/save helpers (see `uiStateSlice.ts` pattern)
- If actions need middleware (e.g., auto-save), export middleware and register in `store.ts`
