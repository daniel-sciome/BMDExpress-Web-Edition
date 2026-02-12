/**
 * ExportDropdown Component
 *
 * Dropdown menu for exporting charts in multiple formats.
 * Offers preset export options and a custom export modal.
 */

import React, { useState, useCallback } from 'react';
import { Dropdown, Button, Modal, Select, InputNumber, Space, Typography, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
  exportChart,
  exportChartWithPreset,
  EXPORT_PRESET_LABELS,
  type ExportFormat,
  type ExportOptions,
} from './utils/chartExport';
import type { MenuProps } from 'antd';

const { Text } = Typography;

interface ExportDropdownProps {
  /** Ref to the container div wrapping the Plotly chart */
  plotRef: React.RefObject<HTMLDivElement | null>;
  /** Base filename (without extension) */
  filename: string;
  /** Optional button size */
  size?: 'small' | 'middle' | 'large';
}

const FORMAT_OPTIONS: Array<{ value: ExportFormat; label: string }> = [
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG (Vector)' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
];

export default function ExportDropdown({ plotRef, filename, size = 'small' }: ExportDropdownProps) {
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customFormat, setCustomFormat] = useState<ExportFormat>('png');
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(800);
  const [customScale, setCustomScale] = useState(2);
  const [exporting, setExporting] = useState(false);

  const handlePresetExport = useCallback(async (presetKey: string) => {
    if (!plotRef.current) {
      message.error('Chart not available for export');
      return;
    }

    setExporting(true);
    try {
      await exportChartWithPreset(plotRef.current, presetKey, filename);
      message.success('Chart exported successfully');
    } catch (err) {
      message.error(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }, [plotRef, filename]);

  const handleCustomExport = useCallback(async () => {
    if (!plotRef.current) {
      message.error('Chart not available for export');
      return;
    }

    setExporting(true);
    try {
      const options: ExportOptions = {
        format: customFormat,
        width: customWidth,
        height: customHeight,
        scale: customScale,
        filename,
      };
      await exportChart(plotRef.current, options);
      message.success('Chart exported successfully');
      setCustomModalOpen(false);
    } catch (err) {
      message.error(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }, [plotRef, filename, customFormat, customWidth, customHeight, customScale]);

  const menuItems: MenuProps['items'] = [
    ...Object.entries(EXPORT_PRESET_LABELS).map(([key, label]) => ({
      key,
      label,
      onClick: () => handlePresetExport(key),
    })),
    { type: 'divider' as const },
    {
      key: 'custom',
      label: 'Custom Export...',
      onClick: () => setCustomModalOpen(true),
    },
  ];

  // Approximate DPI display
  const approxDpi = Math.round(72 * customScale);

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={['click']} disabled={exporting}>
        <Button
          icon={<DownloadOutlined />}
          size={size}
          loading={exporting}
        >
          Export
        </Button>
      </Dropdown>

      <Modal
        title="Custom Chart Export"
        open={customModalOpen}
        onOk={handleCustomExport}
        onCancel={() => setCustomModalOpen(false)}
        okText="Export"
        confirmLoading={exporting}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Format</Text>
            <Select
              value={customFormat}
              onChange={setCustomFormat}
              options={FORMAT_OPTIONS}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Text strong>Width (px)</Text>
              <InputNumber
                value={customWidth}
                onChange={(v) => v && setCustomWidth(v)}
                min={100}
                max={10000}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text strong>Height (px)</Text>
              <InputNumber
                value={customHeight}
                onChange={(v) => v && setCustomHeight(v)}
                min={100}
                max={10000}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>
          </div>
          <div>
            <Text strong>Scale Factor</Text>
            <InputNumber
              value={customScale}
              onChange={(v) => v && setCustomScale(v)}
              min={0.5}
              max={10}
              step={0.5}
              style={{ width: '100%', marginTop: 4 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              ~{approxDpi} DPI. Use ~4.17 for 300 DPI, ~8.33 for 600 DPI
            </Text>
          </div>
        </Space>
      </Modal>
    </>
  );
}
