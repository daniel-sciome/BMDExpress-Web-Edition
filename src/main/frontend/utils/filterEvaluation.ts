/**
 * Filter Evaluation Logic
 *
 * Evaluates filters against CategoryAnalysisResultDto data
 * - Filters within a group use AND logic (all must match)
 * - Multiple active groups use AND logic (all groups must match)
 */

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type { Filter, NumericFilter, CategoricalFilter, FilterGroup } from '../types/filterTypes';
import { getNumericOperatorConfig, getCategoricalOperatorConfig } from './filterMetadata';

/**
 * Evaluate a single numeric filter against a data row
 */
function evaluateNumericFilter(filter: NumericFilter, row: CategoryAnalysisResultDto): boolean {
  const value = (row as any)[filter.field];

  // Handle null/undefined values
  if (value === null || value === undefined) {
    return false;
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return false;
  }

  // Look up operator config and use its evaluate function
  const operatorConfig = getNumericOperatorConfig(filter.operator);
  if (!operatorConfig) {
    console.warn('[filterEvaluation] Unknown numeric operator:', filter.operator);
    return false;
  }

  // Check for required maxValue on range operators
  if (operatorConfig.requiresMaxValue && filter.maxValue === undefined) {
    console.warn(`[filterEvaluation] ${filter.operator} operator requires maxValue`);
    return false;
  }

  return operatorConfig.evaluate(numValue, filter.value, filter.maxValue);
}

/**
 * Evaluate a single categorical filter against a data row
 */
function evaluateCategoricalFilter(filter: CategoricalFilter, row: CategoryAnalysisResultDto): boolean {
  const value = (row as any)[filter.field];

  // Handle null/undefined values
  if (value === null || value === undefined) {
    return false;
  }

  const strValue = String(value);

  // Look up operator config and use its evaluate function
  const operatorConfig = getCategoricalOperatorConfig(filter.operator);
  if (!operatorConfig) {
    console.warn('[filterEvaluation] Unknown categorical operator:', filter.operator);
    return false;
  }

  // Check for required values array on 'in'/'notIn' operators
  if ((filter.operator === 'in' || filter.operator === 'notIn') && (!filter.values || filter.values.length === 0)) {
    console.warn(`[filterEvaluation] ${filter.operator} operator requires values array`);
    return false;
  }

  return operatorConfig.evaluate(strValue, filter.value, filter.values);
}

/**
 * Evaluate a single filter (numeric or categorical) against a data row
 */
export function evaluateFilter(filter: Filter, row: CategoryAnalysisResultDto): boolean {
  // Skip disabled filters
  if (!filter.enabled) {
    return true;
  }

  // Type guard for numeric filter
  if ('value' in filter && typeof filter.value === 'number') {
    return evaluateNumericFilter(filter as NumericFilter, row);
  }

  // Type guard for categorical filter
  if ('value' in filter && typeof filter.value === 'string') {
    return evaluateCategoricalFilter(filter as CategoricalFilter, row);
  }

  console.warn('[filterEvaluation] Unknown filter type:', filter);
  return false;
}

/**
 * Evaluate a filter group against a data row
 * Returns true if ALL enabled filters in the group pass (AND logic)
 */
export function evaluateFilterGroup(group: FilterGroup, row: CategoryAnalysisResultDto): boolean {
  // Skip disabled groups
  if (!group.enabled) {
    return true;
  }

  // Empty group passes all rows
  if (group.filters.length === 0) {
    return true;
  }

  // Get only enabled filters
  const enabledFilters = group.filters.filter(f => f.enabled);

  // If no filters are enabled, pass all rows
  if (enabledFilters.length === 0) {
    return true;
  }

  // AND logic: all enabled filters must pass
  return enabledFilters.every(filter => evaluateFilter(filter, row));
}

/**
 * Evaluate multiple filter groups against a data row
 * Returns true if ALL enabled groups pass (AND logic)
 */
export function evaluateFilterGroups(groups: FilterGroup[], row: CategoryAnalysisResultDto): boolean {
  // No groups means all rows pass
  if (groups.length === 0) {
    return true;
  }

  // AND logic: all enabled groups must pass
  return groups.every(group => evaluateFilterGroup(group, row));
}

/**
 * Filter an array of data rows using filter groups
 * Returns only rows that pass all enabled filter groups
 */
export function applyFilterGroups<T extends CategoryAnalysisResultDto>(
  data: T[],
  groups: FilterGroup[]
): T[] {
  // No groups or empty data
  if (groups.length === 0 || data.length === 0) {
    return data;
  }

  // Get only enabled groups
  const enabledGroups = groups.filter(g => g.enabled);
  if (enabledGroups.length === 0) {
    return data;
  }

  // Filter data
  return data.filter(row => evaluateFilterGroups(enabledGroups, row));
}

/**
 * Get category IDs that pass a specific filter group
 */
export function getCategoryIdsForFilterGroup(
  data: CategoryAnalysisResultDto[],
  group: FilterGroup
): string[] {
  if (!group.enabled) {
    return [];
  }

  return data
    .filter(row => evaluateFilterGroup(group, row))
    .map(row => row.categoryId)
    .filter(Boolean) as string[];
}

/**
 * Count how many rows pass each filter in a group
 * Useful for debugging and UI feedback
 */
export function getFilterPassCounts(
  group: FilterGroup,
  data: CategoryAnalysisResultDto[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  group.filters.forEach(filter => {
    counts[filter.id] = data.filter(row => evaluateFilter(filter, row)).length;
  });

  return counts;
}
