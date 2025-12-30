import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type CategoryGroupDto from 'Frontend/generated/com/sciome/dto/CategoryGroupDto';
import type { GroupSelectionState, CategoryGroupWithSelection } from '../../types/visibilityTypes';

/**
 * Memoized selectors for category groups.
 * These selectors combine group data with visibility state for tri-state selection.
 */

// Base selectors
const selectGroupsByType = (state: RootState) => state.categoryGroups.groupsByType;
const selectActiveGroupType = (state: RootState) => state.categoryGroups.activeGroupType;
const selectHighlightedIds = (state: RootState) => state.visibility.highlightedIds;

/**
 * Get the active groups.
 */
export const selectActiveGroups = createSelector(
  [selectGroupsByType, selectActiveGroupType],
  (groupsByType, activeType): CategoryGroupDto[] => {
    if (!activeType) return [];
    return groupsByType[activeType] || [];
  }
);

/**
 * Get groups with their selection state computed from highlighted IDs.
 */
export const selectGroupsWithSelection = createSelector(
  [selectActiveGroups, selectHighlightedIds],
  (groups, highlightedIds): CategoryGroupWithSelection[] => {
    return groups.map(group => {
      const categoryIds = group.categoryIds?.filter((id): id is string => id !== undefined) || [];
      const selectedCount = categoryIds.filter(id => highlightedIds.has(id)).length;
      const totalCount = categoryIds.length;

      let selectionState: GroupSelectionState;
      if (selectedCount === 0) {
        selectionState = 'none';
      } else if (selectedCount === totalCount) {
        selectionState = 'full';
      } else {
        selectionState = 'partial';
      }

      return {
        id: group.id || '',
        type: group.type || '',
        name: group.name || '',
        categoryIds,
        selectionState,
        selectedCount,
        totalCount,
      };
    });
  }
);

/**
 * Get groups that have at least one category selected.
 */
export const selectGroupsWithSelectedCategories = createSelector(
  [selectGroupsWithSelection],
  (groups): CategoryGroupWithSelection[] => {
    return groups.filter(g => g.selectionState !== 'none');
  }
);

/**
 * Get groups that are fully selected.
 */
export const selectFullySelectedGroups = createSelector(
  [selectGroupsWithSelection],
  (groups): CategoryGroupWithSelection[] => {
    return groups.filter(g => g.selectionState === 'full');
  }
);

/**
 * Get groups that are partially selected.
 */
export const selectPartiallySelectedGroups = createSelector(
  [selectGroupsWithSelection],
  (groups): CategoryGroupWithSelection[] => {
    return groups.filter(g => g.selectionState === 'partial');
  }
);

/**
 * Get a mapping of categoryId -> group for quick lookups.
 */
export const selectCategoryToGroupMap = createSelector(
  [selectActiveGroups],
  (groups): Map<string, CategoryGroupDto> => {
    const map = new Map<string, CategoryGroupDto>();
    for (const group of groups) {
      if (group.categoryIds) {
        for (const categoryId of group.categoryIds) {
          if (categoryId) {
            map.set(categoryId, group);
          }
        }
      }
    }
    return map;
  }
);

/**
 * Get all category IDs that belong to any group.
 */
export const selectGroupedCategoryIds = createSelector(
  [selectActiveGroups],
  (groups): Set<string> => {
    const result = new Set<string>();
    for (const group of groups) {
      if (group.categoryIds) {
        for (const id of group.categoryIds) {
          if (id) result.add(id);
        }
      }
    }
    return result;
  }
);

/**
 * Get group statistics.
 */
export const selectGroupStats = createSelector(
  [selectGroupsWithSelection],
  (groups) => {
    return {
      totalGroups: groups.length,
      fullySelected: groups.filter(g => g.selectionState === 'full').length,
      partiallySelected: groups.filter(g => g.selectionState === 'partial').length,
      noneSelected: groups.filter(g => g.selectionState === 'none').length,
      totalCategories: groups.reduce((sum, g) => sum + g.totalCount, 0),
      selectedCategories: groups.reduce((sum, g) => sum + g.selectedCount, 0),
    };
  }
);

/**
 * Factory selector to get a specific group with selection state.
 */
export const makeSelectGroupWithSelection = (groupId: string) =>
  createSelector(
    [selectGroupsWithSelection],
    (groups): CategoryGroupWithSelection | undefined => {
      return groups.find(g => g.id === groupId);
    }
  );

/**
 * Get the group that a category belongs to.
 */
export const makeSelectCategoryGroup = (categoryId: string) =>
  createSelector(
    [selectCategoryToGroupMap],
    (categoryToGroup): CategoryGroupDto | undefined => {
      return categoryToGroup.get(categoryId);
    }
  );

/**
 * Get category IDs for a specific group.
 */
export const makeSelectGroupCategoryIds = (groupId: string) =>
  createSelector(
    [selectActiveGroups],
    (groups): string[] => {
      const group = groups.find(g => g.id === groupId);
      return group?.categoryIds?.filter((id): id is string => id !== undefined) || [];
    }
  );

/**
 * Check if a specific group is fully selected.
 */
export const makeSelectIsGroupFullySelected = (groupId: string) =>
  createSelector(
    [selectGroupsWithSelection],
    (groups): boolean => {
      const group = groups.find(g => g.id === groupId);
      return group?.selectionState === 'full';
    }
  );

/**
 * Get the selection percentage for a group.
 */
export const makeSelectGroupSelectionPercentage = (groupId: string) =>
  createSelector(
    [selectGroupsWithSelection],
    (groups): number => {
      const group = groups.find(g => g.id === groupId);
      if (!group || group.totalCount === 0) return 0;
      return (group.selectedCount / group.totalCount) * 100;
    }
  );
