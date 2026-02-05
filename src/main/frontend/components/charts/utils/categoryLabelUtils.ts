/**
 * Category Label Utilities
 *
 * Formatting utilities for category labels in charts.
 * Creates consistent, truncated labels with index and rank information.
 */

/**
 * Options for formatting a category label
 */
export interface CategoryLabelOptions {
  /** Category name/description */
  name: string;
  /** 1-based index for display ordering */
  index: number;
  /** Total count (for padding calculation) */
  totalCount: number;
  /** Optional rank value to display in parentheses */
  rank?: number;
  /** Optional suffix (e.g., "(5 genes)") */
  suffix?: string;
}

/**
 * Result of label formatting
 */
export interface FormattedLabel {
  /** Full untruncated label */
  full: string;
  /** Truncated label for display */
  truncated: string;
}

/**
 * Format a single category label with index and optional rank/suffix.
 *
 * @example
 * formatCategoryLabel({
 *   name: 'GO:0001234 - Very Long Pathway Name',
 *   index: 1,
 *   totalCount: 20,
 *   rank: 3,
 * })
 * // Returns: " 1. GO:0001234 - Very Long Pathway Name (3)"
 */
export function formatCategoryLabel(options: CategoryLabelOptions): string {
  const { name, index, totalCount, rank, suffix } = options;

  // Pad index to match width of largest index
  const maxIndexDigits = String(totalCount).length;
  const indexStr = String(index).padStart(maxIndexDigits, ' ');

  // Build label parts
  let label = `${indexStr}. ${name}`;

  if (rank !== undefined) {
    label += ` (${rank})`;
  } else if (suffix) {
    label += ` ${suffix}`;
  }

  return label;
}

/**
 * Truncate a label with ellipsis if it exceeds max length.
 *
 * @param label - The label to truncate
 * @param maxLen - Maximum length (including ellipsis)
 * @param padToLength - Optional: pad shorter labels to this length for alignment
 */
export function truncateLabel(
  label: string,
  maxLen: number,
  padToLength?: number
): string {
  if (label.length > maxLen) {
    return label.substring(0, maxLen - 3) + '...';
  }
  if (padToLength && label.length < padToLength) {
    return label.padEnd(padToLength, ' ');
  }
  return label;
}

/**
 * Calculate the maximum label length from a set of categories.
 * Useful for determining truncation width.
 *
 * @param categories - Array of category data
 * @param getName - Function to extract name from category
 * @param options - Additional formatting options
 */
export function calculateMaxLabelLength<T>(
  categories: T[],
  getName: (cat: T) => string,
  options?: {
    /** Include rank in calculation (assumes rank digits match index digits) */
    includeRank?: boolean;
  }
): number {
  const totalCount = categories.length;
  const maxIndexDigits = String(totalCount).length;

  let maxLen = 0;
  categories.forEach((cat, idx) => {
    const name = getName(cat);
    // Format: "NN. Name (RR)" where NN and RR are padded numbers
    let labelLen = maxIndexDigits + 2 + name.length; // "NN. Name"
    if (options?.includeRank) {
      labelLen += 2 + maxIndexDigits + 1; // " (RR)"
    }
    if (labelLen > maxLen) {
      maxLen = labelLen;
    }
  });

  return maxLen;
}

/**
 * Create a set of formatted labels for a list of categories.
 *
 * @param categories - Array of category data
 * @param options - Formatting options
 * @returns Array of { full, truncated } label pairs
 *
 * @example
 * const labels = createLabelSet(categories, {
 *   getName: cat => cat.categoryDescription || cat.categoryId || 'Unknown',
 *   getRank: cat => cat.bmdRank,
 *   maxDisplayLength: 40,
 * });
 */
export function createLabelSet<T>(
  categories: T[],
  options: {
    /** Extract category name */
    getName: (cat: T) => string;
    /** Optional: extract rank value */
    getRank?: (cat: T) => number | undefined;
    /** Optional: extract suffix string */
    getSuffix?: (cat: T) => string | undefined;
    /** Max length for truncated display (default: calculate from data) */
    maxDisplayLength?: number;
    /** Fraction of max length to use for truncation (default: 1/3) */
    truncateFraction?: number;
  }
): FormattedLabel[] {
  const {
    getName,
    getRank,
    getSuffix,
    maxDisplayLength,
    truncateFraction = 1 / 3,
  } = options;

  const totalCount = categories.length;

  // Calculate max length if not provided
  const calculatedMaxLen = calculateMaxLabelLength(categories, getName, {
    includeRank: !!getRank,
  });
  const effectiveMaxLen = maxDisplayLength ?? calculatedMaxLen;
  const truncateLen = Math.ceil(effectiveMaxLen * truncateFraction);

  return categories.map((cat, idx) => {
    const full = formatCategoryLabel({
      name: getName(cat),
      index: idx + 1,
      totalCount,
      rank: getRank?.(cat),
      suffix: getSuffix?.(cat),
    });

    const truncated = truncateLabel(full, truncateLen, truncateLen);

    return { full, truncated };
  });
}

/**
 * Wrap text at a specified character width, keeping suffix on its own line if needed.
 * Returns text with <br> tags for use in Plotly annotations.
 *
 * @param text - Main text to wrap
 * @param suffix - Suffix to append (e.g., "(BMD Rank: 3)")
 * @param maxWidth - Maximum characters per line
 *
 * @example
 * wrapTextWithSuffix('GO:0001234 - Very Long Pathway Name Here', '(Rank: 3)', 35)
 * // Returns: "GO:0001234 - Very Long<br>Pathway Name Here<br>(Rank: 3)"
 */
export function wrapTextWithSuffix(
  text: string,
  suffix: string,
  maxWidth: number
): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  // Check if suffix fits on current line
  if (currentLine.length + suffix.length + 1 <= maxWidth) {
    currentLine += ' ' + suffix;
    lines.push(currentLine);
  } else {
    if (currentLine) lines.push(currentLine);
    lines.push(suffix);
  }

  return lines.join('<br>');
}

/**
 * Create Plotly annotations for y-axis labels with word wrapping.
 * Use this when you want wrapped, centered labels in the left margin.
 *
 * @param labels - Array of { name, suffix } pairs
 * @param yPositions - Numeric y positions for each label
 * @param options - Annotation styling options
 *
 * @example
 * const annotations = createYAxisAnnotations(
 *   categories.map(c => ({
 *     name: c.categoryDescription,
 *     suffix: `(${c.geneCount} genes)`,
 *   })),
 *   categories.map((_, i) => i),
 *   { maxWidth: 35, xShift: -140 }
 * );
 * // Use in layout: { annotations }
 */
export function createYAxisAnnotations(
  labels: Array<{ name: string; suffix: string }>,
  yPositions: number[],
  options?: {
    /** Max characters per line (default: 35) */
    maxWidth?: number;
    /** Horizontal shift from left edge (default: -140) */
    xShift?: number;
    /** Font size (default: 11) */
    fontSize?: number;
  }
): Array<{
  x: number;
  y: number;
  xref: 'paper';
  yref: 'y';
  text: string;
  showarrow: boolean;
  xanchor: 'center';
  yanchor: 'middle';
  align: 'center';
  font: { size: number };
  xshift: number;
}> {
  const { maxWidth = 35, xShift = -140, fontSize = 11 } = options ?? {};

  return labels.map((label, i) => ({
    x: 0,
    y: yPositions[i],
    xref: 'paper' as const,
    yref: 'y' as const,
    text: wrapTextWithSuffix(label.name, label.suffix, maxWidth),
    showarrow: false,
    xanchor: 'center' as const,
    yanchor: 'middle' as const,
    align: 'center' as const,
    font: { size: fontSize },
    xshift: xShift,
  }));
}
