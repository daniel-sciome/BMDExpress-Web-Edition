/**
 * Color Palette Definitions
 *
 * Named palettes for cluster coloring. Users can switch between these
 * in the Appearance Panel. Colors wrap with modulo for clusters beyond
 * palette size.
 */

import { CLUSTER_COLOR_PALETTE } from '../utils/clusterColors';

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'default',
    name: 'Default (Tab20)',
    colors: [...CLUSTER_COLOR_PALETTE.slice(0, 20)],
  },
  {
    id: 'plotly',
    name: 'Plotly',
    colors: [
      '#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A',
      '#19D3F3', '#FF6692', '#B6E880', '#FF97FF', '#FECB52',
    ],
  },
  {
    id: 'colorblind',
    name: 'Color-blind Safe',
    colors: [
      '#E69F00', '#56B4E9', '#009E73', '#F0E442',
      '#0072B2', '#D55E00', '#CC79A7', '#000000',
    ],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: [
      '#AEC7E8', '#FFBB78', '#98DF8A', '#FF9896', '#C5B0D5',
      '#C49C94', '#F7B6D2', '#C7C7C7', '#DBDB8D', '#9EDAE5',
    ],
  },
  {
    id: 'bold',
    name: 'Bold',
    colors: [
      '#E41A1C', '#377EB8', '#4DAF4A', '#984EA3', '#FF7F00',
      '#FFFF33', '#A65628', '#F781BF', '#999999', '#66C2A5',
    ],
  },
  {
    id: 'earth',
    name: 'Earth Tones',
    colors: [
      '#8C510A', '#BF812D', '#DFC27D', '#80CDC1', '#35978F',
      '#01665E', '#543005', '#C7EAE5', '#F6E8C3', '#A6611A',
    ],
  },
];
