/**
 * Chart Configuration System
 *
 * Exports all components and utilities for the configurable chart system.
 */

// Types
export type {
  ChartConfiguration,
  ChartConfigurationInput,
  ChartConfigState,
  ChartKey,
  ChartTransform,
  ChartType,
  ChartSpec,
  ChartOptions,
  ChartConfigurationGroup,
} from 'Frontend/types/chartConfiguration';

// Utilities
export { applyTransform, getTransformLabel, getChartKeyLabel, CHART_CONFIG_VERSION } from 'Frontend/types/chartConfiguration';

// Field registry
export {
  CATEGORY_FIELDS,
  getFieldsByCategory,
  getCommonFields,
  getFieldDef,
  getFieldLabel,
  buildFieldLabelsMap,
  FIELD_CATEGORIES,
  type ChartFieldDef,
  type FieldCategory,
} from 'Frontend/utils/chartFields';

// Redux slice
export {
  saveConfiguration,
  deleteConfiguration,
  setConfigVisibility,
  toggleConfigVisibility,
  updateConfigOptions,
  updateConfigKeys,
  reorderConfigurations,
  addGroup,
  toggleGroupCollapse,
  resetToDefaults,
  duplicateConfiguration,
  syncToServer,
  loadFromServer,
  selectAllConfigurations,
  selectVisibleConfigurations,
  selectConfigurationsByGroup,
  selectConfigurationById,
  selectAllGroups,
  selectSortedGroups,
  selectUserConfigurations,
  selectPresetConfigurations,
  PRESET_CONFIGURATIONS,
  PRESET_GROUPS,
} from 'Frontend/store/slices/chartConfigSlice';

// Components
export { default as ConfigurableChart } from '../ConfigurableChart';
export { default as ChartConfigEditor } from '../ChartConfigEditor';
