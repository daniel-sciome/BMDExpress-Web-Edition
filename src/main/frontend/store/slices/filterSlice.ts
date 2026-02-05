/**
 * Filter Slice - Redux state management for filter groups
 *
 * Manages user-defined filter groups for filtering CategoryAnalysisResultDto data
 */

import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { FilterState, FilterGroup, Filter, NumericOperator, FilterableFieldName } from '../../types/filterTypes';
import { nanoid } from '@reduxjs/toolkit';
import { loadFilterGroups, saveFilterGroups, getRememberFiltersPreference } from '../../utils/filterGroupPersistence';

/**
 * Filter Group Definition Configuration
 * Single source of truth for standard filter groups and their field memberships
 */
interface FilterGroupDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  /** Field names to include in this group */
  fields: FilterableFieldName[];
  /** Default operator for filters (can be overridden per-field) */
  defaultOperator?: NumericOperator;
  /** Default value for filters (can be overridden per-field) */
  defaultValue?: number;
  /** Field-specific overrides for operator and value */
  fieldOverrides?: Partial<Record<FilterableFieldName, { operator?: NumericOperator; value?: number }>>;
}

/**
 * Standard filter group definitions
 * Fields are listed by name - Filter objects are generated automatically
 */
const FILTER_GROUP_DEFINITIONS: FilterGroupDefinition[] = [
  {
    id: 'standard-statistics',
    name: 'Statistics',
    description: "Filters for all Statistics columns (Fisher's Full + BMD/BMDL/BMDU Extended + Confidence Intervals)",
    color: '#52c41a',
    defaultOperator: 'greaterThanOrEqual',
    defaultValue: 0,
    fieldOverrides: {
      // Fisher's p-values use lessThanOrEqual with value 1
      fishersExactLeftPValue: { operator: 'lessThanOrEqual', value: 1 },
      fishersExactRightPValue: { operator: 'lessThanOrEqual', value: 1 },
    },
    fields: [
      // Fisher's (2 commonly used)
      'fishersExactLeftPValue', 'fishersExactRightPValue',
      // BMD Extended + Confidence
      'bmdMinimum', 'bmdSD', 'bmdWMean', 'bmdWSD', 'bmdLower95', 'bmdUpper95',
      // BMDL Stats + Confidence
      'bmdlMean', 'bmdlMedian', 'bmdlMinimum', 'bmdlSD', 'bmdlWMean', 'bmdlWSD', 'bmdlLower95', 'bmdlUpper95',
      // BMDU Stats + Confidence
      'bmduMean', 'bmduMedian', 'bmduMinimum', 'bmduSD', 'bmduWMean', 'bmduWSD', 'bmduLower95', 'bmduUpper95',
    ],
  },
  {
    id: 'standard-advanced-counts',
    name: 'Counts & Percentiles',
    description: 'Filters for Filter Counts (12) and Percentile Values (6)',
    color: '#722ed1',
    defaultOperator: 'greaterThanOrEqual',
    defaultValue: 0,
    fields: [
      // Filter Counts
      'genesWithBMDRSquaredValueGreaterEqualValue', 'genesWithBMDBMDLRatioBelowValue',
      'genesWithBMDUBMDLRatioBelowValue', 'genesWithBMDUBMDRatioBelowValue',
      'genesWithNFoldBelowLowPostiveDoseValue', 'genesWithPrefilterPValueAboveValue',
      'genesWithPrefilterAdjustedPValueAboveValue', 'genesNotStepFunction',
      'genesNotStepFunctionWithBMDLower', 'genesNotAdverseDirection',
      'genesWithABSZScoreAboveValue', 'genesWithABSModelFCAboveValue',
      // Percentiles
      'bmdFifthPercentileTotalGenes', 'bmdTenthPercentileTotalGenes',
      'bmdlFifthPercentileTotalGenes', 'bmdlTenthPercentileTotalGenes',
      'bmduFifthPercentileTotalGenes', 'bmduTenthPercentileTotalGenes',
    ],
  },
  {
    id: 'standard-advanced-directional',
    name: 'Direction',
    description: 'Filters for Directional UP (9), DOWN (9), and Analysis (3)',
    color: '#fa8c16',
    defaultOperator: 'greaterThanOrEqual',
    defaultValue: 0,
    fields: [
      // Directional UP
      'genesUpBMDMean', 'genesUpBMDMedian', 'genesUpBMDSD',
      'genesUpBMDLMean', 'genesUpBMDLMedian', 'genesUpBMDLSD',
      'genesUpBMDUMean', 'genesUpBMDUMedian', 'genesUpBMDUSD',
      // Directional DOWN
      'genesDownBMDMean', 'genesDownBMDMedian', 'genesDownBMDSD',
      'genesDownBMDLMean', 'genesDownBMDLMedian', 'genesDownBMDLSD',
      'genesDownBMDUMean', 'genesDownBMDUMedian', 'genesDownBMDUSD',
      // Directional Analysis
      'percentWithOverallDirectionUP', 'percentWithOverallDirectionDOWN', 'percentWithOverallDirectionConflict',
    ],
  },
  {
    id: 'standard-advanced-foldchange',
    name: 'FC & Scores',
    description: 'Filters for Fold Change (6), Z-Scores (4), and Model Fold Change (4)',
    color: '#13c2c2',
    defaultOperator: 'greaterThanOrEqual',
    defaultValue: 0,
    fields: [
      // Fold Change
      'totalFoldChange', 'meanFoldChange', 'medianFoldChange',
      'maxFoldChange', 'minFoldChange', 'stdDevFoldChange',
      // Z-Scores
      'minZScore', 'medianZScore', 'maxZScore', 'meanZScore',
      // Model Fold Change
      'minModelFoldChange', 'medianModelFoldChange', 'maxModelFoldChange', 'meanModelFoldChange',
    ],
  },
];

/**
 * Generate a Filter object from a field name and definition
 */
function createFilterFromField(
  field: FilterableFieldName,
  definition: FilterGroupDefinition
): Filter {
  const override = definition.fieldOverrides?.[field];
  return {
    id: nanoid(),
    field,
    operator: override?.operator ?? definition.defaultOperator ?? 'greaterThanOrEqual',
    value: override?.value ?? definition.defaultValue ?? 0,
    enabled: false,
  } as Filter;
}

/**
 * Generate a FilterGroup from a definition
 */
function createFilterGroupFromDefinition(definition: FilterGroupDefinition): FilterGroup {
  const now = Date.now();
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    enabled: false,
    filters: definition.fields.map(field => createFilterFromField(field, definition)),
    color: definition.color,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create standard/preset filter groups from definitions
 */
function createStandardFilterGroups(): FilterGroup[] {
  return FILTER_GROUP_DEFINITIONS.map(createFilterGroupFromDefinition);
}

// Create initial state with enabled groups automatically activated
// Try to load from localStorage first if "remember filters" is enabled
const savedGroups = loadFilterGroups();
const standardGroups = createStandardFilterGroups();
const groups = savedGroups || standardGroups;
const enabledGroupIds = groups.filter(g => g.enabled).map(g => g.id);

console.log('[filterSlice] Initializing filter state:');
console.log('[filterSlice] Loaded from localStorage:', savedGroups !== null);
console.log('[filterSlice] Groups count:', groups.length);
console.log('[filterSlice] Enabled groups:', groups.filter(g => g.enabled).map(g => ({ id: g.id, name: g.name, enabled: g.enabled })));
console.log('[filterSlice] Active group IDs:', enabledGroupIds);

const initialState: FilterState = {
  groups,
  activeGroupIds: enabledGroupIds,
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

// Base selectors (direct state access - no memoization needed)
export const selectAllFilterGroups = (state: { filters: FilterState }) => state.filters.groups;
export const selectActiveGroupIds = (state: { filters: FilterState }) => state.filters.activeGroupIds;

// Memoized selectors (use createSelector to avoid returning new array references)
export const selectActiveFilterGroups = createSelector(
  [selectAllFilterGroups, selectActiveGroupIds],
  (groups, activeIds) => groups.filter(g => activeIds.includes(g.id))
);

export const selectEnabledFilterGroups = createSelector(
  [selectAllFilterGroups],
  (groups) => groups.filter(g => g.enabled)
);

export const selectFilterGroupById = (id: string) => (state: { filters: FilterState }) =>
  state.filters.groups.find(g => g.id === id);
