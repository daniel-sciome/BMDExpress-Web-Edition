import React, { useState, useEffect } from 'react';
import { Modal, Select } from 'antd';
import AppearancePanel from './AppearancePanel';
import type { SubplotDefinition } from 'Frontend/types/chartConfiguration';

interface ChartAppearanceModalProps {
  chartId: string;
  chartLabel: string;
  open: boolean;
  onClose: () => void;
  renderChart: () => React.ReactNode;
  subplots?: SubplotDefinition[];
}

export default function ChartAppearanceModal({
  chartId,
  chartLabel,
  open,
  onClose,
  renderChart,
  subplots,
}: ChartAppearanceModalProps) {
  const [selectedSubplot, setSelectedSubplot] = useState<string>('');

  // Reset subplot selection when chart changes
  useEffect(() => setSelectedSubplot(''), [chartId]);

  const hasSubplots = subplots && subplots.length > 0;

  return (
    <Modal
      title={`Appearance: ${chartLabel}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      styles={{ body: { padding: 16 } }}
      destroyOnClose
    >
      <div style={{ display: 'flex', gap: 16, minHeight: 500 }}>
        {/* Left: Live chart preview */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          {renderChart()}
        </div>

        {/* Right: Appearance controls */}
        <div style={{
          flex: '0 0 23%',
          minWidth: 0,
          overflow: 'auto',
          maxHeight: '70vh',
          borderLeft: '1px solid #f0f0f0',
          paddingLeft: 16,
        }}>
          {/* Target dropdown for multi-plot charts */}
          {hasSubplots && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Target</div>
              <Select
                style={{ width: '100%' }}
                size="small"
                value={selectedSubplot}
                onChange={setSelectedSubplot}
                options={[
                  { value: '', label: 'All Plots' },
                  ...subplots!.map(sp => ({ value: sp.key, label: sp.label })),
                ]}
              />
            </div>
          )}
          <AppearancePanel
            chartId={chartId}
            subplotKey={selectedSubplot || undefined}
          />
        </div>
      </div>
    </Modal>
  );
}
