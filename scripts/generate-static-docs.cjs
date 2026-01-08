#!/usr/bin/env node
/**
 * Generate Static Design Documents (Standalone)
 *
 * This script processes design document HTML files and generates fully
 * standalone HTML files with:
 * - All source code embedded inline
 * - All CSS inlined (including Prism.js themes)
 * - All JavaScript inlined (including Prism.js for syntax highlighting)
 *
 * The resulting documents work offline without any server.
 *
 * Usage:
 *   node scripts/generate-static-docs.cjs
 *   node scripts/generate-static-docs.cjs --output-dir ./dist/docs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  docsDir: path.join(__dirname, '../src/main/resources/META-INF/resources/docs'),
  projectRoot: path.join(__dirname, '..'),
  outputDir: null,
  documentFiles: [
    'DATA_RETRIEVAL_ARCHITECTURE.html',
    'REACTIVITY_ARCHITECTURE_DESIGN.html'
  ],
  outputSuffix: '-static',

  // CDN resources to inline
  cdnResources: {
    prismCss: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css',
    prismLineNumbersCss: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css',
    prismJs: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
    prismLineNumbersJs: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js',
  }
};

// Parse CLI arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output-dir' && args[i + 1]) {
    CONFIG.outputDir = args[i + 1];
    i++;
  }
}

if (!CONFIG.outputDir) {
  CONFIG.outputDir = CONFIG.docsDir;
}

/**
 * Fetch content from a URL
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Detect programming language from file extension
 */
function getLanguage(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const langMap = {
    'ts': 'typescript',
    'tsx': 'tsx',
    'js': 'javascript',
    'jsx': 'jsx',
    'java': 'java',
    'yml': 'yaml',
    'yaml': 'yaml',
    'json': 'json',
    'css': 'css',
    'html': 'html',
    'xml': 'xml',
    'properties': 'properties',
  };
  return langMap[ext] || 'plaintext';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Try to read a source file
 */
function readSourceFile(filePath) {
  const fullPath = path.join(CONFIG.projectRoot, filePath);
  try {
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
  } catch (err) {
    console.warn(`  Warning: Could not read ${filePath}: ${err.message}`);
  }
  return null;
}

/**
 * Generate HTML for a code block
 */
function generateCodeBlockHtml(filePath, content, lines) {
  const fileName = filePath.split('/').pop();
  const language = getLanguage(filePath);

  if (lines && content) {
    const [start, end] = lines.split('-').map(n => parseInt(n, 10));
    const allLines = content.split('\n');
    content = allLines.slice(start - 1, end).join('\n');
  }

  if (content) {
    const lineCount = content.split('\n').length;
    const escapedContent = escapeHtml(content);

    return `
            <div class="code-file code-file-static">
                <div class="code-header code-collapsed" onclick="this.classList.toggle('code-collapsed'); this.nextElementSibling.classList.toggle('code-body-hidden');">
                    <span class="code-toggle">▶</span>
                    <span class="code-filename">${escapeHtml(fileName)}</span>
                    <span class="code-line-count">${lineCount} lines</span>
                    <span class="code-path-display">${escapeHtml(filePath)}</span>
                </div>
                <div class="code-body code-body-hidden">
                    <pre class="line-numbers"><code class="language-${language}">${escapedContent}</code></pre>
                </div>
            </div>`;
  } else {
    return `
            <div class="code-file code-file-static">
                <div class="code-header code-not-found">
                    <span class="code-filename">${escapeHtml(fileName)}</span>
                    <span class="code-status">TO BE CREATED</span>
                </div>
                <div class="code-placeholder">
                    <p>📄 This file will be created during implementation.</p>
                    <p class="code-path">${escapeHtml(filePath)}</p>
                </div>
            </div>`;
  }
}

/**
 * Process a single HTML document
 */
function processDocument(htmlContent, docName, inlinedResources) {
  console.log(`\nProcessing ${docName}...`);

  let processedCount = 0;
  let foundCount = 0;
  let notFoundCount = 0;

  // Replace code-file divs with embedded code
  const codeFileRegex = /<div\s+class="code-file"\s+data-file="([^"]+)"(?:\s+data-lines="([^"]+)")?><\/div>/g;

  let processedHtml = htmlContent.replace(codeFileRegex, (match, filePath, lines) => {
    processedCount++;
    const content = readSourceFile(filePath);

    if (content) {
      foundCount++;
      console.log(`  ✓ Embedded: ${filePath}`);
    } else {
      notFoundCount++;
      console.log(`  ○ Placeholder: ${filePath} (file not found)`);
    }

    return generateCodeBlockHtml(filePath, content, lines);
  });

  // Replace CDN CSS links with inline styles
  processedHtml = processedHtml.replace(
    /<link\s+href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/prism\/[^"]+\/themes\/prism-tomorrow\.min\.css"[^>]*>/,
    `<style>/* Prism Tomorrow Theme - Inlined */\n${inlinedResources.prismCss}</style>`
  );

  processedHtml = processedHtml.replace(
    /<link\s+href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/prism\/[^"]+\/plugins\/line-numbers\/prism-line-numbers\.min\.css"[^>]*>/,
    `<style>/* Prism Line Numbers CSS - Inlined */\n${inlinedResources.prismLineNumbersCss}</style>`
  );

  // Replace CDN script tags with inline scripts
  processedHtml = processedHtml.replace(
    /<script\s+src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/prism\/[^"]+\/prism\.min\.js"><\/script>/,
    `<script>/* Prism.js Core - Inlined */\n${inlinedResources.prismJs}</script>`
  );

  processedHtml = processedHtml.replace(
    /<script\s+src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/prism\/[^"]+\/plugins\/line-numbers\/prism-line-numbers\.min\.js"><\/script>/,
    `<script>/* Prism Line Numbers - Inlined */\n${inlinedResources.prismLineNumbersJs}</script>`
  );

  // Remove the autoloader plugin reference (we don't need it for standalone)
  processedHtml = processedHtml.replace(
    /<script\s+src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/prism\/[^"]+\/plugins\/autoloader\/prism-autoloader\.min\.js"><\/script>/,
    ''
  );

  // Replace the CodeFileLoader script with a simple Prism initializer
  const staticScript = `
    <script>
    // Static document - run Prism highlighting on load
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof Prism !== 'undefined') {
            Prism.highlightAll();
        }
    });
    </script>`;

  const loaderScriptRegex = /<script>\s*\/\*\*\s*\*\s*Code File Loader[\s\S]*?<\/script>/;
  processedHtml = processedHtml.replace(loaderScriptRegex, staticScript);

  // Add language component scripts inline for common languages
  const languageComponents = `
    <script>
    /* Prism Language Components - Inline definitions for common languages */
    if (typeof Prism !== 'undefined') {
      // TypeScript (extends JavaScript)
      Prism.languages.typescript = Prism.languages.extend('javascript', {
        'class-name': {
          pattern: /(\\b(?:class|extends|implements|instanceof|interface|new|type)\\s+)(?!keyof\\b)[_$a-zA-Z\\xA0-\\uFFFF][$\\w\\xA0-\\uFFFF]*(?:\\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
          lookbehind: true,
          greedy: true,
          inside: null
        },
        'builtin': /\\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\\b/,
      });
      Prism.languages.ts = Prism.languages.typescript;
      Prism.languages.tsx = Prism.languages.typescript;

      // Java
      Prism.languages.java = Prism.languages.extend('clike', {
        'keyword': /\\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|null|open|opens|package|private|protected|provides|public|record|requires|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\\b/,
        'number': /\\b0b[01][01_]*L?\\b|\\b0x[\\da-f_]*\\.?[\\da-f_p+-]+\\b|(?:\\b\\d[\\d_]*\\.?[\\d_]*|\\B\\.\\d[\\d_]*)(?:e[+-]?\\d[\\d_]*)?[dfl]?/i,
        'operator': {
          pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\\+\\+|&&|\\|\\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
          lookbehind: true
        }
      });

      // YAML
      Prism.languages.yaml = {
        'scalar': {
          pattern: /([\\-:]\\s*(?:\\s<<prop>>[ \\t]+)?[|>])[ \\t]*(?:((?:\\r?\\n|\\r)[ \\t]+)\\S[^\\r\\n]*(?:\\2[^\\r\\n]+)*)/,
          lookbehind: true,
          alias: 'string'
        },
        'comment': /#.*/,
        'key': {
          pattern: /(\\s*(?:^|[:\\-,[{\\r\\n?])[ \\t]*(?:<<prop>>[ \\t]+)?)[^\\r\\n{\\[\\]},#\\s]+?(?=\\s*:\\s)/,
          lookbehind: true,
          alias: 'atrule'
        },
        'directive': {
          pattern: /(^[ \\t]*)%.+/m,
          lookbehind: true,
          alias: 'important'
        },
        'datetime': {
          pattern: /([:\\-,[{]\\s*(?:\\s<<prop>>[ \\t]+)?)(\\d{4}-\\d\\d?-\\d\\d?(?:[tT]|[ \\t]+)\\d\\d?:\\d{2}:\\d{2}(?:\\.\\d*)?(?:[ \\t]*(?:Z|[-+]\\d\\d?(?::\\d{2})?))?|\\d{4}-\\d{2}-\\d{2}|\\d\\d?:\\d{2}(?::\\d{2}(?:\\.\\d*)?)?)(?=[ \\t]*(?:$|,|\\]|\\}))/m,
          lookbehind: true,
          alias: 'number'
        },
        'boolean': {
          pattern: /([:\\-,[{]\\s*(?:\\s<<prop>>[ \\t]+)?)(?:true|false)[ \\t]*(?=$|,|\\]|\\})/im,
          lookbehind: true,
          alias: 'important'
        },
        'null': {
          pattern: /([:\\-,[{]\\s*(?:\\s<<prop>>[ \\t]+)?)(?:null|~)[ \\t]*(?=$|,|\\]|\\})/im,
          lookbehind: true,
          alias: 'important'
        },
        'string': {
          pattern: /([:\\-,[{]\\s*(?:\\s<<prop>>[ \\t]+)?)("|')(?:(?!\\2)[^\\\\\\r\\n]|\\\\.)*\\2(?=[ \\t]*(?:$|,|\\]|\\}|(?:\\r?\\n|\\r)))/m,
          lookbehind: true,
          greedy: true
        },
        'number': {
          pattern: /([:\\-,[{]\\s*(?:\\s<<prop>>[ \\t]+)?)[+-]?(?:0x[\\da-f]+|0o[0-7]+|(?:\\d+\\.?\\d*|\\.?\\d+)(?:e[+-]?\\d+)?|\\.inf|\\.nan)[ \\t]*(?=$|,|\\]|\\})/im,
          lookbehind: true
        },
        'punctuation': /---|[:[\\]{}\\-,|>?]|\\.\\.\\./
      };
      Prism.languages.yml = Prism.languages.yaml;
    }
    </script>`;

  // Insert language components before the highlighting script
  processedHtml = processedHtml.replace(staticScript, languageComponents + staticScript);

  // Add generation comment
  const generatedComment = `
    <!--
      STANDALONE STATIC DOCUMENT
      Generated: ${new Date().toISOString()}
      Source: ${docName}

      This document is fully standalone with all resources inlined.
      No server required - just open in any browser.
      Regenerate with: node scripts/generate-static-docs.cjs
    -->`;

  processedHtml = processedHtml.replace('<head>', '<head>' + generatedComment);

  console.log(`  Summary: ${processedCount} code blocks (${foundCount} embedded, ${notFoundCount} placeholders)`);

  return processedHtml;
}

/**
 * Main entry point
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Generating Standalone Static Design Documents');
  console.log('='.repeat(60));
  console.log(`\nSource directory: ${CONFIG.docsDir}`);
  console.log(`Output directory: ${CONFIG.outputDir}`);

  // Fetch CDN resources
  console.log('\nFetching CDN resources for inlining...');
  const inlinedResources = {};

  try {
    console.log('  Fetching Prism CSS...');
    inlinedResources.prismCss = await fetchUrl(CONFIG.cdnResources.prismCss);

    console.log('  Fetching Prism Line Numbers CSS...');
    inlinedResources.prismLineNumbersCss = await fetchUrl(CONFIG.cdnResources.prismLineNumbersCss);

    console.log('  Fetching Prism JS...');
    inlinedResources.prismJs = await fetchUrl(CONFIG.cdnResources.prismJs);

    console.log('  Fetching Prism Line Numbers JS...');
    inlinedResources.prismLineNumbersJs = await fetchUrl(CONFIG.cdnResources.prismLineNumbersJs);

    console.log('  ✓ All CDN resources fetched');
  } catch (err) {
    console.error(`\nError fetching CDN resources: ${err.message}`);
    console.error('Falling back to CDN links (document will require internet)');
    inlinedResources.prismCss = '';
    inlinedResources.prismLineNumbersCss = '';
    inlinedResources.prismJs = '';
    inlinedResources.prismLineNumbersJs = '';
  }

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const results = [];

  for (const docFile of CONFIG.documentFiles) {
    const inputPath = path.join(CONFIG.docsDir, docFile);

    if (!fs.existsSync(inputPath)) {
      console.log(`\nSkipping ${docFile} (not found)`);
      continue;
    }

    const htmlContent = fs.readFileSync(inputPath, 'utf8');
    const staticHtml = processDocument(htmlContent, docFile, inlinedResources);

    const baseName = path.basename(docFile, '.html');
    const outputFile = `${baseName}${CONFIG.outputSuffix}.html`;
    const outputPath = path.join(CONFIG.outputDir, outputFile);

    fs.writeFileSync(outputPath, staticHtml, 'utf8');

    const stats = fs.statSync(outputPath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    console.log(`  Output: ${outputPath} (${sizeKb} KB)`);

    results.push({
      source: docFile,
      output: outputFile,
      outputPath: outputPath,
      size: sizeKb
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Generation Complete');
  console.log('='.repeat(60));
  console.log('\nGenerated standalone files:');
  for (const result of results) {
    console.log(`  ${result.source} → ${result.output} (${result.size} KB)`);
  }

  console.log('\nTo view the standalone documents:');
  console.log('  Simply open the HTML files directly in any browser.');
  console.log('  No server required!');
  console.log('\n  Files:');
  for (const result of results) {
    console.log(`    file://${result.outputPath}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
