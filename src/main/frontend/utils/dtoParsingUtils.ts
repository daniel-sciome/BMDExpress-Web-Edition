/**
 * DTO Parsing Utilities
 *
 * Common utilities for parsing semicolon-delimited data fields from backend DTOs.
 * Many DTO fields (like bmdList, geneSymbols) use semicolon delimiters and require
 * consistent parsing logic.
 */

/**
 * Parse a semicolon-delimited string of numeric values into an array of valid numbers.
 *
 * Handles common data quality issues:
 * - Trims whitespace from each value
 * - Filters out empty strings and 'NA' values
 * - Parses to float and filters out NaN values
 * - Optionally filters out non-positive values
 *
 * @param value - Semicolon-delimited string (e.g., "1.5; 2.3; NA; 4.1")
 * @param options - Parsing options
 * @param options.positiveOnly - If true, only include values > 0 (default: true)
 * @returns Array of valid numeric values
 *
 * @example
 * parseSemicolonNumericList("1.5; 2.3; NA; 4.1")
 * // Returns: [1.5, 2.3, 4.1]
 *
 * @example
 * parseSemicolonNumericList("1.5; -2.3; 0; 4.1", { positiveOnly: false })
 * // Returns: [1.5, -2.3, 0, 4.1]
 *
 * @example
 * // Typical usage with CategoryAnalysisResultDto
 * const bmdValues = parseSemicolonNumericList(row.bmdList);
 */
export function parseSemicolonNumericList(
  value: string | undefined | null,
  options: { positiveOnly?: boolean } = {}
): number[] {
  const { positiveOnly = true } = options;

  if (!value) {
    return [];
  }

  let values = value
    .split(';')
    .map(v => v.trim())
    .filter(v => v !== '' && v !== 'NA')
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v));

  if (positiveOnly) {
    values = values.filter(v => v > 0);
  }

  return values;
}

/**
 * Parse a semicolon-delimited string into an array of trimmed strings.
 *
 * Handles common data quality issues:
 * - Trims whitespace from each value
 * - Filters out empty strings
 * - Optionally removes duplicates
 *
 * @param value - Semicolon-delimited string (e.g., "GENE1; GENE2; ; GENE3")
 * @param options - Parsing options
 * @param options.unique - If true, remove duplicate values (default: false)
 * @returns Array of trimmed string values
 *
 * @example
 * parseSemicolonStringList("GENE1; GENE2; ; GENE3")
 * // Returns: ["GENE1", "GENE2", "GENE3"]
 *
 * @example
 * parseSemicolonStringList("A; B; A; C", { unique: true })
 * // Returns: ["A", "B", "C"]
 *
 * @example
 * // Typical usage with CategoryAnalysisResultDto
 * const geneSymbols = parseSemicolonStringList(row.geneSymbols);
 */
export function parseSemicolonStringList(
  value: string | undefined | null,
  options: { unique?: boolean } = {}
): string[] {
  const { unique = false } = options;

  if (!value) {
    return [];
  }

  let values = value
    .split(';')
    .map(v => v.trim())
    .filter(v => v !== '');

  if (unique) {
    values = Array.from(new Set(values));
  }

  return values;
}

/**
 * Format an array of strings as a comma-separated list.
 * Useful for displaying parsed semicolon lists in UI.
 *
 * @param values - Array of strings
 * @param options - Formatting options
 * @param options.limit - Maximum number of items to display (default: no limit)
 * @param options.ellipsis - Text to show when limit is exceeded (default: "...")
 * @returns Comma-separated string
 *
 * @example
 * formatAsCommaList(["A", "B", "C"])
 * // Returns: "A, B, C"
 *
 * @example
 * formatAsCommaList(["A", "B", "C", "D"], { limit: 2 })
 * // Returns: "A, B, ..."
 */
export function formatAsCommaList(
  values: string[],
  options: { limit?: number; ellipsis?: string } = {}
): string {
  const { limit, ellipsis = '...' } = options;

  if (!values || values.length === 0) {
    return '';
  }

  if (limit && values.length > limit) {
    return values.slice(0, limit).join(', ') + ', ' + ellipsis;
  }

  return values.join(', ');
}
