import React, { useState } from 'react';
import { Drawer, Button, Input, List, Typography, Empty, Image, Popconfirm } from 'antd';
import { CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectActiveSection, selectActiveReport, updateSection } from '../../store/slices/reportSlice';
import type { ChartSnapshotDto } from '../../types/reportTypes';

const { Text } = Typography;

interface ChartSnapshotPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function ChartSnapshotPanel({ open, onClose }: ChartSnapshotPanelProps) {
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector(selectActiveSection);
  const activeReport = useAppSelector(selectActiveReport);
  const [snapshotTitle, setSnapshotTitle] = useState('');

  const captureVisibleChart = async () => {
    // Find visible Plotly chart on the page
    const plotlyDivs = document.querySelectorAll('.js-plotly-plot');
    if (plotlyDivs.length === 0) {
      alert('No Plotly chart is currently visible. Navigate to a chart view first.');
      return;
    }

    try {
      const Plotly = (window as any).Plotly || await import('plotly.js');
      const graphDiv = plotlyDivs[0] as any;
      const dataUrl = await Plotly.toImage(graphDiv, {
        format: 'png',
        width: 1200,
        height: 800,
        scale: 2,
      });

      const snapshot: ChartSnapshotDto = {
        id: crypto.randomUUID(),
        chartType: 'plotly',
        title: snapshotTitle || 'Chart Snapshot',
        dataUrl,
        width: 1200,
        height: 800,
        capturedAt: new Date().toISOString(),
      };

      if (activeSection && activeReport) {
        const updatedSection = {
          ...activeSection,
          chartSnapshots: [...activeSection.chartSnapshots, snapshot],
        };
        dispatch(updateSection({ reportId: activeReport.id, section: updatedSection }));
        setSnapshotTitle('');
      }
    } catch (err) {
      console.error('Failed to capture chart:', err);
      alert('Failed to capture chart. Make sure a Plotly chart is visible.');
    }
  };

  const handleRemove = (snapshotId: string) => {
    if (!activeSection || !activeReport) return;
    const updatedSnapshots = activeSection.chartSnapshots.filter(s => s.id !== snapshotId);
    const updatedSection = { ...activeSection, chartSnapshots: updatedSnapshots };
    dispatch(updateSection({ reportId: activeReport.id, section: updatedSection }));
  };

  return (
    <Drawer
      title="Chart Snapshots"
      open={open}
      onClose={onClose}
      width={450}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          Navigate to an analysis chart, then click "Capture" to snapshot it into this section.
        </Text>
        <Input
          placeholder="Snapshot title (optional)"
          value={snapshotTitle}
          onChange={(e) => setSnapshotTitle(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Button
          type="primary"
          icon={<CameraOutlined />}
          onClick={captureVisibleChart}
          block
        >
          Capture Visible Chart
        </Button>
      </div>

      <Text strong>Captured Snapshots</Text>
      {(activeSection?.chartSnapshots.length || 0) === 0 ? (
        <Empty description="No snapshots yet" style={{ marginTop: 16 }} />
      ) : (
        <List
          style={{ marginTop: 8 }}
          dataSource={activeSection?.chartSnapshots || []}
          renderItem={(snap) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title="Remove this snapshot?"
                  onConfirm={() => handleRemove(snap.id)}
                >
                  <DeleteOutlined style={{ color: '#ff4d4f' }} />
                </Popconfirm>,
              ]}
            >
              <div>
                <Text strong style={{ fontSize: 12 }}>{snap.title}</Text>
                <div style={{ marginTop: 4 }}>
                  <Image
                    src={snap.dataUrl}
                    alt={snap.title}
                    style={{ maxWidth: 300, borderRadius: 4 }}
                    preview
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 10 }}>
                  {new Date(snap.capturedAt).toLocaleString()}
                </Text>
              </div>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}
