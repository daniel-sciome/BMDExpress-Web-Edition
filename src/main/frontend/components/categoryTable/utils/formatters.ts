/**
 * Category Results Table - Formatting Utilities
 *
 * This file contains utility functions for formatting numeric values,
 * p-values, and other data for display in the table.
 */

/**
 * Format a numeric value with specified decimal places
 *
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted string or '-' if value is invalid
 */
export function formatNumber(value: any, decimals: number = 3): string {
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    return '-';
  }
  return value.toFixed(decimals);
}

/**
 * Format a p-value with appropriate precision
 *
 * Uses scientific notation for very small p-values (< 0.001)
 * Otherwise uses 4 decimal places
 *
 * @param value - The p-value to format
 * @returns Formatted string or '-' if value is invalid
 */
export function formatPValue(value: any): string {
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    return '-';
  }
  if (value < 0.001) {
    return value.toExponential(2);
  }
  return value.toFixed(4);
}

/**
 * Format a percentage value
 *
 * @param value - The percentage to format (0-100)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with '%' suffix or '-' if invalid
 */
export function formatPercentage(value: any, decimals: number = 2): string {
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    return '-';
  }
  return value.toFixed(decimals) + '%';
}

/**
 * Format a gene list (comma-separated values) for display
 *
 * Truncates long lists with ellipsis
 *
 * @param value - Comma-separated gene list
 * @param maxLength - Maximum string length before truncation (default: 50)
 * @returns Formatted string or '-' if invalid
 */
export function formatGeneList(value: any, maxLength: number = 50): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const str = String(value);
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
}
