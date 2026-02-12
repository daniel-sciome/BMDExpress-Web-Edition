import type { ChartAppearance } from 'Frontend/types/chartAppearance';
import { DEFAULT_CHART_APPEARANCE } from 'Frontend/types/chartAppearance';

export interface BuiltInTheme {
  id: string;
  name: string;
  appearance: ChartAppearance;
}

const defaultTheme: BuiltInTheme = {
  id: 'default',
  name: 'Default',
  appearance: DEFAULT_CHART_APPEARANCE,
};

const publicationBW: BuiltInTheme = {
  id: 'publication-bw',
  name: 'Publication (B&W)',
  appearance: {
    version: 1,
    name: 'Publication (B&W)',
    title: {
      font: { size: 14, color: '#000000', family: 'Times New Roman' },
    },
    xAxis: {
      titleFont: { size: 12, color: '#000000', family: 'Times New Roman' },
      tickFont: { size: 10, color: '#000000', family: 'Times New Roman' },
      showGrid: false,
      showLine: true,
      lineColor: '#000000',
    },
    yAxis: {
      titleFont: { size: 12, color: '#000000', family: 'Times New Roman' },
      tickFont: { size: 10, color: '#000000', family: 'Times New Roman' },
      showGrid: false,
      showLine: true,
      lineColor: '#000000',
    },
    legend: {
      font: { size: 10, color: '#000000', family: 'Times New Roman' },
    },
    colors: {
      paperBgcolor: '#ffffff',
      plotBgcolor: '#ffffff',
      colorway: ['#000000', '#555555', '#999999', '#bbbbbb', '#333333', '#777777'],
    },
  },
};

const presentation: BuiltInTheme = {
  id: 'presentation',
  name: 'Presentation',
  appearance: {
    version: 1,
    name: 'Presentation',
    title: {
      font: { size: 18, color: '#333333', family: 'Arial', weight: 700 },
    },
    xAxis: {
      titleFont: { size: 14, color: '#333333', family: 'Arial' },
      tickFont: { size: 12, color: '#555555', family: 'Arial' },
      showGrid: true,
      gridColor: '#e0e0e0',
    },
    yAxis: {
      titleFont: { size: 14, color: '#333333', family: 'Arial' },
      tickFont: { size: 12, color: '#555555', family: 'Arial' },
      showGrid: true,
      gridColor: '#e0e0e0',
    },
    legend: {
      font: { size: 12, color: '#333333', family: 'Arial' },
    },
    colors: {
      paperBgcolor: '#ffffff',
      plotBgcolor: '#fafafa',
    },
    margins: { t: 60, b: 60, l: 80, r: 40 },
  },
};

const highContrast: BuiltInTheme = {
  id: 'high-contrast',
  name: 'High Contrast',
  appearance: {
    version: 1,
    name: 'High Contrast',
    title: {
      font: { size: 16, color: '#ffffff', family: 'Arial' },
    },
    xAxis: {
      titleFont: { size: 13, color: '#ffffff', family: 'Arial' },
      tickFont: { size: 11, color: '#cccccc', family: 'Arial' },
      showGrid: true,
      gridColor: '#444466',
      showLine: true,
      lineColor: '#666688',
    },
    yAxis: {
      titleFont: { size: 13, color: '#ffffff', family: 'Arial' },
      tickFont: { size: 11, color: '#cccccc', family: 'Arial' },
      showGrid: true,
      gridColor: '#444466',
      showLine: true,
      lineColor: '#666688',
    },
    legend: {
      font: { size: 11, color: '#ffffff', family: 'Arial' },
      bgcolor: 'rgba(26,26,46,0.8)',
    },
    colors: {
      paperBgcolor: '#1a1a2e',
      plotBgcolor: '#1a1a2e',
      colorway: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8', '#00cec9', '#fab1a0', '#81ecec'],
    },
  },
};

const minimal: BuiltInTheme = {
  id: 'minimal',
  name: 'Minimal',
  appearance: {
    version: 1,
    name: 'Minimal',
    title: {
      font: { size: 14, color: '#444444', family: 'Helvetica' },
    },
    xAxis: {
      titleFont: { size: 11, color: '#666666', family: 'Helvetica' },
      tickFont: { size: 10, color: '#999999', family: 'Helvetica' },
      showGrid: false,
      showLine: false,
    },
    yAxis: {
      titleFont: { size: 11, color: '#666666', family: 'Helvetica' },
      tickFont: { size: 10, color: '#999999', family: 'Helvetica' },
      showGrid: false,
      showLine: false,
    },
    legend: {
      font: { size: 10, color: '#666666', family: 'Helvetica' },
    },
    colors: {
      paperBgcolor: '#ffffff',
      plotBgcolor: '#ffffff',
    },
  },
};

export const BUILT_IN_THEMES: BuiltInTheme[] = [
  defaultTheme,
  publicationBW,
  presentation,
  highContrast,
  minimal,
];
