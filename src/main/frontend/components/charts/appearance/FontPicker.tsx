import React from 'react';
import { Select, InputNumber, ColorPicker } from 'antd';
import type { FontConfig } from 'Frontend/types/chartAppearance';

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'System UI', value: 'system-ui' },
];

interface FontPickerProps {
  value?: FontConfig;
  onChange: (font: FontConfig) => void;
  label?: string;
}

export default function FontPicker({ value = {}, onChange, label }: FontPickerProps) {
  const update = (patch: Partial<FontConfig>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div>
      {label && (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Select
          size="small"
          style={{ width: 140 }}
          value={value.family}
          onChange={(family) => update({ family })}
          options={FONT_FAMILIES}
          placeholder="Font"
          allowClear
        />
        <InputNumber
          size="small"
          style={{ width: 64 }}
          min={8}
          max={48}
          value={value.size}
          onChange={(size) => update({ size: size ?? undefined })}
          placeholder="Size"
        />
        <ColorPicker
          size="small"
          value={value.color}
          onChange={(color) => update({ color: color.toHexString() })}
        />
      </div>
    </div>
  );
}
