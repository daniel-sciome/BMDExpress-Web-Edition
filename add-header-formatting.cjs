#!/usr/bin/env node
/**
 * Script to add formatHeader import and wrap all title strings with formatHeader()
 */

const fs = require('fs');
const path = require('path');

const columnsDir = './src/main/frontend/components/categoryTable/columns';
const filesToUpdate = [
  'fishersColumns.ts',
  'bmdStatisticsColumns.ts',
  'rankColumns.ts',
  'filterAndPercentileColumns.ts',
  'directionalColumns.ts',
  'foldChangeColumns.ts',
  'advancedColumns.ts',
];

filesToUpdate.forEach(filename => {
  const filepath = path.join(columnsDir, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`Skipping ${filename} - file not found`);
    return;
  }

  let content = fs.readFileSync(filepath, 'utf8');

  // Check if already has formatHeader import
  if (content.includes('formatHeader')) {
    console.log(`Skipping ${filename} - already has formatHeader`);
    return;
  }

  // Add import after the last import statement
  const lastImportMatch = content.match(/^import[^;]+;$/gm);
  if (lastImportMatch) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    const importStatement = "\nimport { formatHeader } from '../utils/headerFormatting';";
    content = content.replace(lastImport, lastImport + importStatement);
  }

  // Replace title: 'String' with title: formatHeader('String')
  // Handle both single and double quotes
  content = content.replace(/title:\s*'([^']+)'/g, "title: formatHeader('$1')");
  content = content.replace(/title:\s*"([^"]+)"/g, 'title: formatHeader("$1")');

  // Write back
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`✓ Updated ${filename}`);
});

console.log('\nDone!');
