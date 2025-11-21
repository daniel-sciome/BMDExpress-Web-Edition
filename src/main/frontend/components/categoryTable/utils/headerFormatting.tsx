/**
 * Category Results Table - Header Formatting Utilities
 *
 * Provides consistent formatting for table column headers
 */

import React from 'react';

/**
 * Format a column header with bold and underline styling
 *
 * @param text - The header text to format
 * @returns Formatted React element
 */
export function formatHeader(text: string): React.ReactElement {
  return <strong><u>{text}</u></strong>;
}
