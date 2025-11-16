/**
 * Filter Slice - Redux state management for filter groups
 *
 * Manages user-defined filter groups for filtering CategoryAnalysisResultDto data
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FilterState, FilterGroup, Filter } from '../../types/filterTypes';
import { nanoid } from '@reduxjs/toolkit';

const initialState: FilterState = {
  groups: [],
  activeGroupIds: [],
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    /**
     * Add a new filter group
     */
    addFilterGroup: (state, action: PayloadAction<Omit<FilterGroup, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const now = Date.now();
      const newGroup: FilterGroup = {
        ...action.payload,
        id: nanoid(),
        createdAt: now,
        updatedAt: now,
      };
      state.groups.push(newGroup);

      // Automatically enable the group if it's created as enabled
      if (newGroup.enabled) {
        state.activeGroupIds.push(newGroup.id);
      }
    },

    /**
     * Update an existing filter group
     */
    updateFilterGroup: (state, action: PayloadAction<{ id: string; changes: Partial<FilterGroup> }>) => {
      const index = state.groups.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.groups[index] = {
          ...state.groups[index],
          ...action.payload.changes,
          updatedAt: Date.now(),
        };

        // Update active groups if enabled status changed
        const wasActive = state.activeGroupIds.includes(action.payload.id);
        const isNowEnabled = state.groups[index].enabled;

        if (isNowEnabled && !wasActive) {
          state.activeGroupIds.push(action.payload.id);
        } else if (!isNowEnabled && wasActive) {
          state.activeGroupIds = state.activeGroupIds.filter(id => id !== action.payload.id);
        }
      }
    },

    /**
     * Delete a filter group
     */
    deleteFilterGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter(g => g.id !== action.payload);
      state.activeGroupIds = state.activeGroupIds.filter(id => id !== action.payload);
    },

    /**
     * Toggle a filter group's enabled state
     */
    toggleFilterGroup: (state, action: PayloadAction<string>) => {
      const group = state.groups.find(g => g.id === action.payload);
      if (group) {
        group.enabled = !group.enabled;
        group.updatedAt = Date.now();

        if (group.enabled) {
          if (!state.activeGroupIds.includes(action.payload)) {
            state.activeGroupIds.push(action.payload);
          }
        } else {
          state.activeGroupIds = state.activeGroupIds.filter(id => id !== action.payload);
        }
      }
    },

    /**
     * Add a filter to a group
     */
    addFilter: (state, action: PayloadAction<{ groupId: string; filter: Omit<Filter, 'id'> }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group) {
        const newFilter: Filter = {
          ...action.payload.filter,
          id: nanoid(),
        } as Filter;
        group.filters.push(newFilter);
        group.updatedAt = Date.now();
      }
    },

    /**
     * Update a filter within a group
     */
    updateFilter: (state, action: PayloadAction<{ groupId: string; filterId: string; changes: Partial<Filter> }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group) {
        const filterIndex = group.filters.findIndex(f => f.id === action.payload.filterId);
        if (filterIndex !== -1) {
          group.filters[filterIndex] = {
            ...group.filters[filterIndex],
            ...action.payload.changes,
          } as Filter;
          group.updatedAt = Date.now();
        }
      }
    },

    /**
     * Delete a filter from a group
     */
    deleteFilter: (state, action: PayloadAction<{ groupId: string; filterId: string }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group) {
        group.filters = group.filters.filter(f => f.id !== action.payload.filterId);
        group.updatedAt = Date.now();
      }
    },

    /**
     * Toggle a filter's enabled state
     */
    toggleFilter: (state, action: PayloadAction<{ groupId: string; filterId: string }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group) {
        const filter = group.filters.find(f => f.id === action.payload.filterId);
        if (filter) {
          filter.enabled = !filter.enabled;
          group.updatedAt = Date.now();
        }
      }
    },

    /**
     * Clear all filter groups
     */
    clearAllFilterGroups: (state) => {
      state.groups = [];
      state.activeGroupIds = [];
    },

    /**
     * Set active group IDs (for bulk operations)
     */
    setActiveGroupIds: (state, action: PayloadAction<string[]>) => {
      state.activeGroupIds = action.payload;
    },
  },
});

export const {
  addFilterGroup,
  updateFilterGroup,
  deleteFilterGroup,
  toggleFilterGroup,
  addFilter,
  updateFilter,
  deleteFilter,
  toggleFilter,
  clearAllFilterGroups,
  setActiveGroupIds,
} = filterSlice.actions;

export default filterSlice.reducer;

/**
 * Selectors
 */

export const selectAllFilterGroups = (state: { filters: FilterState }) => state.filters.groups;

export const selectActiveFilterGroups = (state: { filters: FilterState }) =>
  state.filters.groups.filter(g => state.filters.activeGroupIds.includes(g.id));

export const selectEnabledFilterGroups = (state: { filters: FilterState }) =>
  state.filters.groups.filter(g => g.enabled);

export const selectFilterGroupById = (id: string) => (state: { filters: FilterState }) =>
  state.filters.groups.find(g => g.id === id);

export const selectActiveGroupIds = (state: { filters: FilterState }) => state.filters.activeGroupIds;
