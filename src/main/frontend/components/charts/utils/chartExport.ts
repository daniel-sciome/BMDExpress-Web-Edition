/**
 * Chart Export Utilities
 *
 * Multi-format export using Plotly.toImage() directly.
 * Supports SVG, PNG, JPEG, WebP with custom dimensions/scale.
 *
 * NOTE: We do NOT `import Plotly from 'plotly.js'` here because
 * the raw plotly.js bundle uses CommonJS `global` which Vite doesn't
 * polyfill, causing "global is not defined" at module load.
 * Instead we access the Plotly API from the graph div at runtime
 * (react-plotly.js attaches it) or lazy-import it.
 */

export type ExportFormat = 'png' | 'svg' | 'jpeg' | 'webp';

export interface ExportOptions {
  format: ExportFormat;
  width: number;
  height: number;
  scale: number;
  filename: string;
}

export const EXPORT_PRESETS: Record<string, ExportOptions> = {
  'presentation-png': {
    format: 'png',
    width: 1920,
    height: 1080,
    scale: 2,
    filename: 'chart',
  },
  'publication-png': {
    format: 'png',
    width: 2400,
    height: 1800,
    scale: 4,
    filename: 'chart',
  },
  'vector-svg': {
    format: 'svg',
    width: 1200,
    height: 800,
    scale: 1,
    filename: 'chart',
  },
  'quick-png': {
    format: 'png',
    width: 1200,
    height: 800,
    scale: 2,
    filename: 'chart',
  },
};

export const EXPORT_PRESET_LABELS: Record<string, string> = {
  'quick-png': 'Quick PNG (1200x800 @2x)',
  'presentation-png': 'Presentation PNG (1920x1080 @2x)',
  'publication-png': 'Publication PNG (2400x1800 @4x, 300dpi)',
  'vector-svg': 'Vector SVG (1200x800)',
};

/** Plotly graph div shape (subset of what react-plotly.js attaches) */
interface PlotlyGraphDiv extends HTMLElement {
  data?: unknown;
  layout?: unknown;
  _fullLayout?: unknown;
}

/**
 * Get a reference to the Plotly module at runtime.
 * react-plotly.js loads Plotly and attaches it to window — we can also
 * access toImage via the graph div's internal reference.
 */
async function getPlotly(): Promise<{ toImage: (gd: any, opts: any) => Promise<string> }> {
  // window.Plotly is set by the plotly.js bundle that react-plotly.js loads
  const win = window as any;
  if (win.Plotly?.toImage) {
    return win.Plotly;
  }

  // Fallback: dynamic import (deferred, avoids the static-import crash)
  const mod = await import('plotly.js');
  return mod.default ?? mod;
}

/**
 * Find the Plotly graph div inside a container element.
 */
function findPlotlyGraphDiv(container: HTMLElement): PlotlyGraphDiv | null {
  // react-plotly.js renders a div with class "js-plotly-plot"
  const plotDiv = container.querySelector('.js-plotly-plot') as PlotlyGraphDiv | null;
  if (plotDiv?.data && plotDiv?.layout) return plotDiv;

  // Fallback: the container itself might be the plot div
  const el = container as PlotlyGraphDiv;
  if (el.data && el.layout) return el;

  return null;
}

/**
 * Export a chart to an image file and trigger a download.
 *
 * @param container - The container div wrapping the Plotly chart (use plotRef.current)
 * @param options - Export format, dimensions, and filename
 */
export async function exportChart(
  container: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const graphDiv = findPlotlyGraphDiv(container);
  if (!graphDiv) {
    throw new Error('No Plotly chart found in the provided container');
  }

  const Plotly = await getPlotly();
  const dataUrl = await Plotly.toImage(graphDiv, {
    format: options.format,
    width: options.width,
    height: options.height,
    scale: options.scale,
  });

  // Trigger download
  const extension = options.format === 'svg' ? 'svg' : options.format;
  const filename = `${options.filename}.${extension}`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export a chart using a named preset.
 */
export async function exportChartWithPreset(
  container: HTMLElement,
  presetKey: string,
  filename: string
): Promise<void> {
  const preset = EXPORT_PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Unknown export preset: ${presetKey}`);
  }

  await exportChart(container, { ...preset, filename });
}
