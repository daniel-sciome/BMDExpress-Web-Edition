/**
 * Filter Group Persistence Utilities
 *
 * Manages loading and saving filter groups to/from localStorage
 */

import type { FilterGroup } from '../types/filterTypes';

const FILTER_GROUPS_STORAGE_KEY = 'bmdexpress_filterGroups';
const REMEMBER_FILTERS_STORAGE_KEY = 'bmdexpress_rememberFilters';

/**
 * Load filter groups from localStorage
 * Returns null if nothing is saved or if remember filters is disabled
 */
export function loadFilterGroups(): FilterGroup[] | null {
  const rememberFilters = localStorage.getItem(REMEMBER_FILTERS_STORAGE_KEY);
  // Remember filters defaults to true (only skip if explicitly 'false')
  if (rememberFilters === 'false') {
    return null;
  }

  const saved = localStorage.getItem(FILTER_GROUPS_STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse saved filter groups:', e);
    return null;
  }
}

/**
 * Save filter groups to localStorage
 */
export function saveFilterGroups(groups: FilterGroup[]): void {
  const rememberFilters = localStorage.getItem(REMEMBER_FILTERS_STORAGE_KEY);
  // Remember filters defaults to true (only skip if explicitly 'false')
  if (rememberFilters === 'false') {
    return;
  }

  try {
    localStorage.setItem(FILTER_GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch (e) {
    console.error('Failed to save filter groups:', e);
  }
}

/**
 * Clear saved filter groups from localStorage
 */
export function clearSavedFilterGroups(): void {
  try {
    localStorage.removeItem(FILTER_GROUPS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear saved filter groups:', e);
  }
}

/**
 * Get remember filters preference (defaults to true)
 */
export function getRememberFiltersPreference(): boolean {
  const saved = localStorage.getItem(REMEMBER_FILTERS_STORAGE_KEY);
  // Default to true if no preference saved
  return saved !== 'false';
}

/**
 * Set remember filters preference
 */
export function setRememberFiltersPreference(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_FILTERS_STORAGE_KEY, String(remember));
    if (!remember) {
      clearSavedFilterGroups();
    }
  } catch (e) {
    console.error('Failed to save remember filters preference:', e);
  }
}
