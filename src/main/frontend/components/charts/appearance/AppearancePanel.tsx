import React, { useState } from 'react';
import { Collapse, Select, Switch, InputNumber, ColorPicker, Radio, Button, Space, Input, message } from 'antd';
import { useAppSelector, useAppDispatch } from 'Frontend/store/hooks';
import {
  selectGlobalAppearance,
  selectSavedThemes,
  setGlobalAppearance,
  updateGlobalAppearance,
  saveTheme,
  deleteTheme,
} from 'Frontend/store/slices/chartConfigSlice';
import { DEFAULT_CHART_APPEARANCE } from 'Frontend/types/chartAppearance';
import type { ChartAppearance, FontConfig } from 'Frontend/types/chartAppearance';
import { BUILT_IN_THEMES } from './builtInThemes';
import { COLOR_PALETTES } from './colorPalettes';
import FontPicker from './FontPicker';

const GRID_STYLES = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dot', value: 'dot' },
  { label: 'Dash', value: 'dash' },
  { label: 'Long Dash', value: 'longdash' },
  { label: 'Dash-Dot', value: 'dashdot' },
];

export default function AppearancePanel() {
  const dispatch = useAppDispatch();
  const appearance = useAppSelector(selectGlobalAppearance);
  const savedThemes = useAppSelector(selectSavedThemes);
  const [saveModalName, setSaveModalName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  // Determine which theme is active (if any)
  const activeThemeId = (() => {
    const builtIn = BUILT_IN_THEMES.find(t => t.appearance.name === appearance.name);
    if (builtIn) return builtIn.id;
    const saved = savedThemes.find(t => t.appearance.name === appearance.name);
    if (saved) return saved.id;
    return undefined;
  })();

  const handleThemeSelect = (themeId: string) => {
    const builtIn = BUILT_IN_THEMES.find(t => t.id === themeId);
    if (builtIn) {
      dispatch(setGlobalAppearance(builtIn.appearance));
      return;
    }
    const saved = savedThemes.find(t => t.id === themeId);
    if (saved) {
      dispatch(setGlobalAppearance(saved.appearance));
    }
  };

  const handleSaveTheme = () => {
    if (!saveModalName.trim()) return;
    const id = `custom-${Date.now()}`;
    dispatch(saveTheme({
      id,
      name: saveModalName.trim(),
      appearance: { ...appearance, name: saveModalName.trim() },
    }));
    setSaveModalName('');
    setShowSaveInput(false);
    message.success('Theme saved');
  };

  const handleDeleteSavedTheme = (id: string) => {
    dispatch(deleteTheme(id));
    message.success('Theme deleted');
  };

  const handleReset = () => {
    dispatch(setGlobalAppearance(DEFAULT_CHART_APPEARANCE));
  };

  // Helpers for dispatching partial updates
  const updateColors = (patch: Partial<NonNullable<ChartAppearance['colors']>>) => {
    dispatch(updateGlobalAppearance({ colors: { ...appearance.colors, ...patch } }));
  };

  const updateTitle = (font: FontConfig) => {
    dispatch(updateGlobalAppearance({ title: { font } }));
  };

  const updateAxisTitleFont = (font: FontConfig) => {
    dispatch(updateGlobalAppearance({
      xAxis: { ...appearance.xAxis, titleFont: font },
      yAxis: { ...appearance.yAxis, titleFont: font },
    }));
  };

  const updateAxisTickFont = (font: FontConfig) => {
    dispatch(updateGlobalAppearance({
      xAxis: { ...appearance.xAxis, tickFont: font },
      yAxis: { ...appearance.yAxis, tickFont: font },
    }));
  };

  const updateAxes = (patch: Record<string, unknown>) => {
    dispatch(updateGlobalAppearance({
      xAxis: { ...appearance.xAxis, ...patch },
      yAxis: { ...appearance.yAxis, ...patch },
    }));
  };

  const updateMargins = (patch: Partial<NonNullable<ChartAppearance['margins']>>) => {
    dispatch(updateGlobalAppearance({ margins: { ...appearance.margins, ...patch } }));
  };

  const updateLegend = (patch: Partial<NonNullable<ChartAppearance['legend']>>) => {
    dispatch(updateGlobalAppearance({ legend: { ...appearance.legend, ...patch } }));
  };

  // Determine active palette by matching colorway against known palettes
  const activePaletteId = (() => {
    const colorway = appearance.colors?.colorway;
    if (!colorway || colorway.length === 0) return 'default';
    for (const palette of COLOR_PALETTES) {
      if (palette.colors.length === colorway.length &&
          palette.colors.every((c, i) => c.toLowerCase() === colorway[i].toLowerCase())) {
        return palette.id;
      }
    }
    return undefined; // Custom / unrecognized palette
  })();

  const handlePaletteSelect = (paletteId: string) => {
    if (paletteId === 'default') {
      dispatch(updateGlobalAppearance({ colors: { ...appearance.colors, colorway: undefined } }));
    } else {
      const palette = COLOR_PALETTES.find(p => p.id === paletteId);
      if (palette) {
        dispatch(updateGlobalAppearance({ colors: { ...appearance.colors, colorway: palette.colors } }));
      }
    }
  };

  const themeOptions = [
    {
      label: 'Built-in',
      options: BUILT_IN_THEMES.map(t => ({ label: t.name, value: t.id })),
    },
    ...(savedThemes.length > 0 ? [{
      label: 'Saved',
      options: savedThemes.map(t => ({ label: t.name, value: t.id })),
    }] : []),
  ];

  const items = [
    {
      key: 'colors',
      label: 'Colors',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Color Palette</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {COLOR_PALETTES.map(palette => (
                <div
                  key={palette.id}
                  onClick={() => handlePaletteSelect(palette.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: activePaletteId === palette.id ? '1px solid #1677ff' : '1px solid #d9d9d9',
                    background: activePaletteId === palette.id ? '#e6f4ff' : 'transparent',
                  }}
                >
                  <Radio checked={activePaletteId === palette.id} style={{ marginRight: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, marginBottom: 2 }}>{palette.name}</div>
                    <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {palette.colors.map((color, i) => (
                        <div
                          key={i}
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: color,
                            borderRadius: 1,
                            border: '1px solid rgba(0,0,0,0.1)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>Paper Background</span>
            <ColorPicker
              size="small"
              value={appearance.colors?.paperBgcolor}
              onChange={(c) => updateColors({ paperBgcolor: c.toHexString() })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>Plot Background</span>
            <ColorPicker
              size="small"
              value={appearance.colors?.plotBgcolor}
              onChange={(c) => updateColors({ plotBgcolor: c.toHexString() })}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'fonts',
      label: 'Fonts',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FontPicker
            label="Title Font"
            value={appearance.title?.font}
            onChange={updateTitle}
          />
          <FontPicker
            label="Axis Title Font"
            value={appearance.xAxis?.titleFont}
            onChange={updateAxisTitleFont}
          />
          <FontPicker
            label="Tick Label Font"
            value={appearance.xAxis?.tickFont}
            onChange={updateAxisTickFont}
          />
        </div>
      ),
    },
    {
      key: 'axes',
      label: 'Axes',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>Show Grid Lines</span>
            <Switch
              size="small"
              checked={appearance.xAxis?.showGrid ?? true}
              onChange={(checked) => updateAxes({ showGrid: checked })}
            />
          </div>
          {appearance.xAxis?.showGrid !== false && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>Grid Color</span>
                <ColorPicker
                  size="small"
                  value={appearance.xAxis?.gridColor}
                  onChange={(c) => updateAxes({ gridColor: c.toHexString() })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>Grid Style</span>
                <Select
                  size="small"
                  style={{ width: 120 }}
                  value={appearance.xAxis?.gridDash ?? 'solid'}
                  onChange={(val) => updateAxes({ gridDash: val })}
                  options={GRID_STYLES}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>Grid Width</span>
                <InputNumber
                  size="small"
                  style={{ width: 64 }}
                  min={1}
                  max={5}
                  value={appearance.xAxis?.gridWidth ?? 1}
                  onChange={(val) => updateAxes({ gridWidth: val ?? 1 })}
                />
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>Show Axis Lines</span>
            <Switch
              size="small"
              checked={appearance.xAxis?.showLine ?? false}
              onChange={(checked) => updateAxes({ showLine: checked })}
            />
          </div>
          {appearance.xAxis?.showLine && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12 }}>Axis Line Color</span>
              <ColorPicker
                size="small"
                value={appearance.xAxis?.lineColor}
                onChange={(c) => updateAxes({ lineColor: c.toHexString() })}
              />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>Show Zero Line</span>
            <Switch
              size="small"
              checked={appearance.xAxis?.showZeroline ?? false}
              onChange={(checked) => updateAxes({ showZeroline: checked })}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'margins',
      label: 'Margins',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <span style={{ fontSize: 12 }}>Top</span>
              <InputNumber size="small" style={{ width: '100%' }} min={0} max={200}
                value={appearance.margins?.t} onChange={(v) => updateMargins({ t: v ?? undefined })} />
            </div>
            <div>
              <span style={{ fontSize: 12 }}>Bottom</span>
              <InputNumber size="small" style={{ width: '100%' }} min={0} max={200}
                value={appearance.margins?.b} onChange={(v) => updateMargins({ b: v ?? undefined })} />
            </div>
            <div>
              <span style={{ fontSize: 12 }}>Left</span>
              <InputNumber size="small" style={{ width: '100%' }} min={0} max={200}
                value={appearance.margins?.l} onChange={(v) => updateMargins({ l: v ?? undefined })} />
            </div>
            <div>
              <span style={{ fontSize: 12 }}>Right</span>
              <InputNumber size="small" style={{ width: '100%' }} min={0} max={200}
                value={appearance.margins?.r} onChange={(v) => updateMargins({ r: v ?? undefined })} />
            </div>
          </div>
          <div>
            <span style={{ fontSize: 12 }}>Pad</span>
            <InputNumber size="small" style={{ width: '100%' }} min={0} max={20}
              value={appearance.margins?.pad} onChange={(v) => updateMargins({ pad: v ?? undefined })} />
          </div>
        </div>
      ),
    },
    {
      key: 'legend',
      label: 'Legend',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>Show Legend</span>
            <Switch
              size="small"
              checked={appearance.legend?.show ?? true}
              onChange={(checked) => updateLegend({ show: checked })}
            />
          </div>
          {appearance.legend?.show !== false && (
            <>
              <div>
                <span style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Orientation</span>
                <Radio.Group
                  size="small"
                  value={appearance.legend?.orientation ?? 'v'}
                  onChange={(e) => updateLegend({ orientation: e.target.value })}
                >
                  <Radio.Button value="v">Vertical</Radio.Button>
                  <Radio.Button value="h">Horizontal</Radio.Button>
                </Radio.Group>
              </div>
              <FontPicker
                label="Legend Font"
                value={appearance.legend?.font}
                onChange={(font) => updateLegend({ font })}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Theme Selector */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Theme</div>
        <Select
          style={{ width: '100%' }}
          size="small"
          value={activeThemeId}
          onChange={handleThemeSelect}
          options={themeOptions}
          placeholder="Select a theme..."
        />
        <Space style={{ marginTop: 8 }}>
          <Button size="small" onClick={() => setShowSaveInput(true)}>Save Current...</Button>
          <Button size="small" onClick={handleReset}>Reset to Default</Button>
        </Space>
        {showSaveInput && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              size="small"
              placeholder="Theme name"
              value={saveModalName}
              onChange={(e) => setSaveModalName(e.target.value)}
              onPressEnter={handleSaveTheme}
            />
            <Button size="small" type="primary" onClick={handleSaveTheme}>Save</Button>
            <Button size="small" onClick={() => { setShowSaveInput(false); setSaveModalName(''); }}>Cancel</Button>
          </div>
        )}
        {savedThemes.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Saved themes:</div>
            {savedThemes.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                <span style={{ fontSize: 12 }}>{t.name}</span>
                <Button size="small" type="text" danger onClick={() => handleDeleteSavedTheme(t.id)}>Delete</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Sections */}
      <Collapse
        size="small"
        defaultActiveKey={['colors', 'fonts']}
        items={items}
      />
    </div>
  );
}
