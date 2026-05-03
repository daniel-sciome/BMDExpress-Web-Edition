/**
 * Category Results Table - Formatting Utilities
 *
 * This file contains utility functions for formatting numeric values,
 * p-values, and other data for display in the table.
 */

import { padNumber, type ColumnPaddingInfo } from './numberPadding';

/**
 * Format a numeric value with specified decimal places.
 *
 * When `decimals` is omitted, precision is chosen automatically:
 *   - |value| < 0.001 (but non-zero) → "<0.001" or ">-0.001" — avoids "0.000"
 *   - |value| < 1                     → 3 decimal places  (e.g. 0.003)
 *   - |value| ≥ 1                     → 2 decimal places  (e.g. 45.23)
 *
 * Passing an explicit `decimals` overrides all of the above — used for gene
 * counts (0), percentages (2), etc.
 *
 * @param value - The number to format
 * @param decimals - Decimal places; omit to use magnitude-based auto-select
 * @param paddingInfo - Optional padding info to align decimal points
 * @returns Formatted string or '-' if value is invalid
 */
export function formatNumber(value: unknown, decimals?: number, paddingInfo?: ColumnPaddingInfo): string {
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    if (paddingInfo) {
      // For the null-placeholder used in column padding, default to 3 since we
      // don't have a real value to inspect.
      return padNumber(null, paddingInfo, decimals ?? 3);
    }
    return '-';
  }

  // When auto-selecting, catch sub-threshold values before toFixed rounds them
  // to "0.000", which would look like zero.
  if (decimals === undefined && value !== 0 && Math.abs(value) < 0.001) {
    return value > 0 ? '<0.001' : '>-0.001';
  }

  // Auto-select precision: small fractions need an extra digit to be legible.
  const d = decimals ?? (Math.abs(value) < 1 ? 3 : 2);

  if (paddingInfo) {
    // Use the raw number and let padNumber handle formatting
    const formatted = value.toFixed(d);
    const num = parseFloat(formatted);
    return padNumber(num, paddingInfo, d);
  }

  return value.toFixed(d);
}

/**
 * Format a p-value with appropriate precision
 *
 * Uses scientific notation for very small p-values (< 0.001)
 * Otherwise uses 4 decimal places
 *
 * @param value - The p-value to format
 * @param paddingInfo - Optional padding info to align decimal points
 * @returns Formatted string or '-' if value is invalid
 */
export function formatPValue(value: unknown, paddingInfo?: ColumnPaddingInfo): string {
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    if (paddingInfo) {
      return padNumber(null, paddingInfo, 4);
    }
    return '-';
  }

  if (value < 0.001) {
    // Don't pad scientific notation
    return value.toExponential(2);
  }

  if (paddingInfo) {
    return padNumber(value, paddingInfo, 4);
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
export function formatPercentage(value: unknown, decimals: number = 2): string {
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
export function formatGeneList(value: unknown, maxLength: number = 50): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const str = String(value);
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
}
