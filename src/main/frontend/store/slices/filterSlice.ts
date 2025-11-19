/**
 * Filter Slice - Redux state management for filter groups
 *
 * Manages user-defined filter groups for filtering CategoryAnalysisResultDto data
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FilterState, FilterGroup, Filter } from '../../types/filterTypes';
import { nanoid } from '@reduxjs/toolkit';
import { loadFilterGroups, saveFilterGroups, getRememberFiltersPreference } from '../../utils/filterGroupPersistence';

/**
 * Create standard/preset filter groups that correspond to the 3 column categories
 * Each filter group includes filters for ALL columns in that category
 */
function createStandardFilterGroups(): FilterGroup[] {
  const now = Date.now();

  return [
    // 1. Primary Filter Columns: Gene Counts
    {
      id: 'standard-essential',
      name: 'Essential: Gene Counts',
      description: 'Filters for all Essential columns (Gene Counts)',
      enabled: true,
      filters: [
        {
          id: nanoid(),
          field: 'genesThatPassedAllFilters',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'geneAllCount',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'percentage',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
      ],
      color: '#1890ff',
      createdAt: now,
      updatedAt: now,
    },

    // 2. Statistics Columns: Fisher's, BMD, BMDL, BMDU
    {
      id: 'standard-statistics',
      name: 'Statistics: Fisher\'s & BMD/BMDL/BMDU',
      description: 'Filters for all Statistics columns (Fisher\'s Full + BMD/BMDL/BMDU Extended + Confidence Intervals)',
      enabled: true,
      filters: [
        // Fisher's Full (6 fields)
        {
          id: nanoid(),
          field: 'fishersExactLeftPValue',
          operator: 'lessThanOrEqual',
          value: 1,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'fishersExactRightPValue',
          operator: 'lessThanOrEqual',
          value: 1,
          enabled: false,
        },
        // BMD Extended (4 fields)
        {
          id: nanoid(),
          field: 'bmdMinimum',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdWMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdWSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // BMD Confidence (2 fields)
        {
          id: nanoid(),
          field: 'bmdLower95',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdUpper95',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // BMDL Stats (6 fields)
        {
          id: nanoid(),
          field: 'bmdlMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdlMedian',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdlMinimum',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdlSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdlWMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdlWSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // BMDL Confidence (2 fields)
        {
          id: nanoid(),
          field: 'bmdlLower95',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdlUpper95',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // BMDU Stats (6 fields)
        {
          id: nanoid(),
          field: 'bmduMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmduMedian',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmduMinimum',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmduSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmduWMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmduWSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // BMDU Confidence (2 fields)
        {
          id: nanoid(),
          field: 'bmduLower95',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmduUpper95',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
      ],
      color: '#52c41a',
      createdAt: now,
      updatedAt: now,
    },

    // 3. Advanced Columns - Filter Counts & Percentiles
    {
      id: 'standard-advanced-counts',
      name: 'Advanced: Filter Counts & Percentiles',
      description: 'Filters for Filter Counts (12) and Percentile Values (6)',
      enabled: true,
      filters: [
        // Filter Counts (12 fields)
        {
          id: nanoid(),
          field: 'genesWithBMDRSquaredValueGreaterEqualValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesWithBMDBMDLRatioBelowValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesWithBMDUBMDLRatioBelowValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesWithBMDUBMDRatioBelowValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesWithNFoldBelowLowPostiveDoseValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesWithPrefilterPValueAboveValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesWithPrefilterAdjustedPValueAboveValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesNotStepFunction',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesNotStepFunctionWithBMDLower',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesNotAdverseDirection',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesWithABSZScoreAboveValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesWithABSModelFCAboveValue',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // Percentiles (6 fields)
        {
          id: nanoid(),
          field: 'bmdFifthPercentileTotalGenes',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdTenthPercentileTotalGenes',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdlFifthPercentileTotalGenes',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmdlTenthPercentileTotalGenes',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmduFifthPercentileTotalGenes',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'bmduTenthPercentileTotalGenes',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
      ],
      color: '#722ed1',
      createdAt: now,
      updatedAt: now,
    },

    // 4. Advanced Columns - Directional Analysis
    {
      id: 'standard-advanced-directional',
      name: 'Advanced: Directional Analysis',
      description: 'Filters for Directional UP (9), DOWN (9), and Analysis (3)',
      enabled: true,
      filters: [
        // Directional UP (9 fields)
        {
          id: nanoid(),
          field: 'genesUpBMDMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesUpBMDMedian',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesUpBMDSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesUpBMDLMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesUpBMDLMedian',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesUpBMDLSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesUpBMDUMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesUpBMDUMedian',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesUpBMDUSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // Directional DOWN (9 fields)
        {
          id: nanoid(),
          field: 'genesDownBMDMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesDownBMDMedian',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesDownBMDSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesDownBMDLMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesDownBMDLMedian',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesDownBMDLSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesDownBMDUMean',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesDownBMDUMedian',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'genesDownBMDUSD',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // Directional Analysis (3 numeric fields)
        {
          id: nanoid(),
          field: 'percentWithOverallDirectionUP',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'percentWithOverallDirectionDOWN',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'percentWithOverallDirectionConflict',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
      ],
      color: '#fa8c16',
      createdAt: now,
      updatedAt: now,
    },

    // 5. Advanced Columns - Fold Change & Scores
    {
      id: 'standard-advanced-foldchange',
      name: 'Advanced: Fold Change & Scores',
      description: 'Filters for Fold Change (6), Z-Scores (4), and Model Fold Change (4)',
      enabled: true,
      filters: [
        // Fold Change (6 fields)
        {
          id: nanoid(),
          field: 'totalFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'meanFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'medianFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'maxFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'minFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'stdDevFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // Z-Scores (4 fields)
        {
          id: nanoid(),
          field: 'minZScore',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'medianZScore',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'maxZScore',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'meanZScore',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        // Model Fold Change (4 fields)
        {
          id: nanoid(),
          field: 'minModelFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'medianModelFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'maxModelFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
        {
          id: nanoid(),
          field: 'meanModelFoldChange',
          operator: 'greaterThanOrEqual',
          value: 0,
          enabled: false,
        },
      ],
      color: '#13c2c2',
      createdAt: now,
      updatedAt: now,
    },
  ];
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

export const selectAllFilterGroups = (state: { filters: FilterState }) => state.filters.groups;

export const selectActiveFilterGroups = (state: { filters: FilterState }) =>
  state.filters.groups.filter(g => state.filters.activeGroupIds.includes(g.id));

export const selectEnabledFilterGroups = (state: { filters: FilterState }) =>
  state.filters.groups.filter(g => g.enabled);

export const selectFilterGroupById = (id: string) => (state: { filters: FilterState }) =>
  state.filters.groups.find(g => g.id === id);

export const selectActiveGroupIds = (state: { filters: FilterState }) => state.filters.activeGroupIds;
