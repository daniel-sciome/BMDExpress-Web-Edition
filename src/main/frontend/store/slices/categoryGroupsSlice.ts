import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CategoryGroupService } from 'Frontend/generated/endpoints';
import type CategoryGroupDto from 'Frontend/generated/com/sciome/dto/CategoryGroupDto';
import type { RootState } from '../store';
import type { GroupSelectionState, CategoryGroupWithSelection } from '../../types/visibilityTypes';

/**
 * State for managing category groups (UMAP clusters, gene clusters, etc.).
 */
interface CategoryGroupsState {
  /** All groups by type (e.g., 'umap_cluster' -> groups) */
  groupsByType: Record<string, CategoryGroupDto[]>;

  /** Currently active group type for display */
  activeGroupType: string | null;

  /** Loading state */
  loading: boolean;

  /** Error message */
  error: string | null;

  /** Available group types */
  availableGroupTypes: string[];
}

/**
 * Initial state for category groups slice.
 */
const initialState: CategoryGroupsState = {
  groupsByType: {},
  activeGroupType: null,
  loading: false,
  error: null,
  availableGroupTypes: [],
};

/**
 * Load available group types from the backend.
 */
export const loadAvailableGroupTypes = createAsyncThunk(
  'categoryGroups/loadAvailableGroupTypes',
  async () => {
    console.log('[categoryGroups] Loading available group types');
    const types = await CategoryGroupService.getAvailableGroupTypes();
    console.log('[categoryGroups] Received group types:', types);
    return types?.filter((t): t is string => t !== undefined) || [];
  }
);

/**
 * Create groups from cluster assignments.
 * This is typically called after UMAP clustering or gene clustering.
 */
export const createGroupsFromClusters = createAsyncThunk(
  'categoryGroups/createFromClusters',
  async ({
    clusterAssignments,
    groupType,
    clusterLabels,
  }: {
    clusterAssignments: Record<string, number>;
    groupType: string;
    clusterLabels?: Record<number, string>;
  }) => {
    console.log('[categoryGroups] Creating groups from clusters:', { groupType, clusterCount: Object.keys(clusterAssignments).length });

    // Convert clusterLabels from number keys to string keys for the API
    const stringKeyLabels: Record<string, string> | undefined = clusterLabels
      ? Object.fromEntries(Object.entries(clusterLabels).map(([k, v]) => [k, v]))
      : undefined;

    const groups = await CategoryGroupService.createGroupsFromClusters(
      clusterAssignments,
      groupType,
      stringKeyLabels
    );

    console.log('[categoryGroups] Created groups:', groups);
    return {
      groupType,
      groups: groups?.filter((g): g is CategoryGroupDto => g !== undefined) || [],
    };
  }
);

/**
 * Category groups slice for managing cluster groups.
 */
const categoryGroupsSlice = createSlice({
  name: 'categoryGroups',
  initialState,

  reducers: {
    /**
     * Set groups for a specific type directly (without backend call).
     * Useful for client-side clustering or testing.
     */
    setGroups: (
      state,
      action: PayloadAction<{ groupType: string; groups: CategoryGroupDto[] }>
    ) => {
      const { groupType, groups } = action.payload;
      state.groupsByType[groupType] = groups;
      if (!state.activeGroupType) {
        state.activeGroupType = groupType;
      }
    },

    /**
     * Set the active group type for display.
     */
    setActiveGroupType: (state, action: PayloadAction<string | null>) => {
      state.activeGroupType = action.payload;
    },

    /**
     * Clear groups for a specific type.
     */
    clearGroups: (state, action: PayloadAction<string>) => {
      delete state.groupsByType[action.payload];
      if (state.activeGroupType === action.payload) {
        const remainingTypes = Object.keys(state.groupsByType);
        state.activeGroupType = remainingTypes.length > 0 ? remainingTypes[0] : null;
      }
    },

    /**
     * Clear all groups.
     */
    clearAllGroups: (state) => {
      state.groupsByType = {};
      state.activeGroupType = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Load available group types
      .addCase(loadAvailableGroupTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAvailableGroupTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.availableGroupTypes = action.payload;
      })
      .addCase(loadAvailableGroupTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load group types';
      })

      // Create groups from clusters
      .addCase(createGroupsFromClusters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroupsFromClusters.fulfilled, (state, action) => {
        state.loading = false;
        const { groupType, groups } = action.payload;
        state.groupsByType[groupType] = groups;
        if (!state.activeGroupType) {
          state.activeGroupType = groupType;
        }
      })
      .addCase(createGroupsFromClusters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create groups';
      });
  },
});

// Export actions
export const {
  setGroups,
  setActiveGroupType,
  clearGroups,
  clearAllGroups,
} = categoryGroupsSlice.actions;

// Export reducer
export default categoryGroupsSlice.reducer;

// Base selectors
export const selectCategoryGroupsState = (state: RootState) => state.categoryGroups;
export const selectGroupsByType = (state: RootState) => state.categoryGroups.groupsByType;
export const selectActiveGroupType = (state: RootState) => state.categoryGroups.activeGroupType;
export const selectAvailableGroupTypes = (state: RootState) => state.categoryGroups.availableGroupTypes;
export const selectCategoryGroupsLoading = (state: RootState) => state.categoryGroups.loading;
export const selectCategoryGroupsError = (state: RootState) => state.categoryGroups.error;

/**
 * Get groups for a specific type.
 */
export const selectGroupsForType = (groupType: string) => (state: RootState): CategoryGroupDto[] => {
  return state.categoryGroups.groupsByType[groupType] || [];
};

/**
 * Get the currently active groups.
 */
export const selectActiveGroups = (state: RootState): CategoryGroupDto[] => {
  const activeType = state.categoryGroups.activeGroupType;
  if (!activeType) return [];
  return state.categoryGroups.groupsByType[activeType] || [];
};

/**
 * Get all category IDs from active groups.
 * Useful for quickly checking if a category belongs to any group.
 */
export const selectAllGroupedCategoryIds = (state: RootState): Set<string> => {
  const result = new Set<string>();
  const groups = selectActiveGroups(state);
  for (const group of groups) {
    if (group.categoryIds) {
      for (const id of group.categoryIds) {
        if (id) result.add(id);
      }
    }
  }
  return result;
};

/**
 * Calculate selection state for a group based on highlighted category IDs.
 * Returns 'none', 'partial', or 'full'.
 */
export function calculateGroupSelectionState(
  group: CategoryGroupDto,
  highlightedIds: Set<string>
): GroupSelectionState {
  const categoryIds = group.categoryIds?.filter((id): id is string => id !== undefined) || [];
  if (categoryIds.length === 0) return 'none';

  const selectedCount = categoryIds.filter(id => highlightedIds.has(id)).length;

  if (selectedCount === 0) return 'none';
  if (selectedCount === categoryIds.length) return 'full';
  return 'partial';
}

/**
 * Get groups with selection state computed from visibility state.
 * This is a utility function, not a selector (requires highlightedIds parameter).
 */
export function getGroupsWithSelection(
  groups: CategoryGroupDto[],
  highlightedIds: Set<string>
): CategoryGroupWithSelection[] {
  return groups.map(group => {
    const categoryIds = group.categoryIds?.filter((id): id is string => id !== undefined) || [];
    const selectedCount = categoryIds.filter(id => highlightedIds.has(id)).length;

    return {
      id: group.id || '',
      type: group.type || '',
      name: group.name || '',
      categoryIds,
      selectionState: calculateGroupSelectionState(group, highlightedIds),
      selectedCount,
      totalCount: categoryIds.length,
    };
  });
}
