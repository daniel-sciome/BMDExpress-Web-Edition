/**
 * ExportDropdown Component
 *
 * Dropdown menu for exporting charts as SVG.
 * SVG is vector — PowerPoint can import it directly and export PNG from there if needed.
 */

import React, { useState, useCallback } from 'react';
import { Dropdown, Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
  exportChartWithPreset,
  EXPORT_PRESET_LABELS,
} from './utils/chartExport';
import type { MenuProps } from 'antd';

interface ExportDropdownProps {
  /** Ref to the container div wrapping the Plotly chart */
  plotRef: React.RefObject<HTMLDivElement | null>;
  /** Base filename (without extension) */
  filename: string;
  /** Optional button size */
  size?: 'small' | 'middle' | 'large';
}

export default function ExportDropdown({ plotRef, filename, size = 'small' }: ExportDropdownProps) {
  const [exporting, setExporting] = useState(false);

  const handlePresetExport = useCallback(async (presetKey: string) => {
    if (!plotRef.current) {
      message.error('Chart not available for export');
      return;
    }

    setExporting(true);
    try {
      await exportChartWithPreset(plotRef.current, presetKey, filename);
      message.success('SVG exported');
    } catch (err) {
      message.error(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }, [plotRef, filename]);

  const menuItems: MenuProps['items'] = Object.entries(EXPORT_PRESET_LABELS).map(([key, label]) => ({
    key,
    label: `SVG — ${label}`,
    onClick: () => handlePresetExport(key),
  }));

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} disabled={exporting}>
      <Button
        icon={<DownloadOutlined />}
        size={size}
        loading={exporting}
      >
        Export SVG
      </Button>
    </Dropdown>
  );
}
