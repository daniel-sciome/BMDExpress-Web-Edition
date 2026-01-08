#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/main/frontend/components/CategoryResultsGrid.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to match: key: 'someKey', followed by width: number
const regex = /key: '([^']+)',\s*width: (\d+),/g;

content = content.replace(regex, (match, key, width) => {
  // Only replace if this is in a column definition (has dataIndex before it)
  return match.replace(`width: ${width},`, `width: columnWidths.${key},`);
});

// Now add onHeaderCell to each column definition
// Pattern: sorter: (...) => ... (captures entire sorter line)
const sorterRegex = /(key: '([^']+)',[\s\S]*?)(sorter: \([^)]+\) => [^,]+,)/g;

content = content.replace(sorterRegex, (match, beforeSorter, key, sorterLine) => {
  // Check if onHeaderCell already exists
  if (match.includes('onHeaderCell')) {
    return match;
  }
  // Add onHeaderCell after sorter
  return beforeSorter + sorterLine + `\n          onHeaderCell: () => ({\n            width: columnWidths.${key},\n            onResize: handleResize('${key}'),\n          }),`;
});

// Also handle columns without sorter but with render
const renderRegex = /(key: '([^']+)',[\s\S]*?)(render: [^}]+},)/g;

content = content.replace(renderRegex, (match, beforeRender, key, renderLine) => {
  // Check if onHeaderCell already exists or if there's a sorter after this
  if (match.includes('onHeaderCell') || match.includes('sorter:')) {
    return match;
  }
  // Add onHeaderCell after render
  return beforeRender + renderLine + `\n          onHeaderCell: () => ({\n            width: columnWidths.${key},\n            onResize: handleResize('${key}'),\n          }),`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated column widths and added resize handlers');
