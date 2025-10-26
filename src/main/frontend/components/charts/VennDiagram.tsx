/**
 * Venn Diagram Component
 *
 * Displays Venn diagram showing category overlaps across 2-5 category analysis results.
 *
 * LOCATION: This component is used in CategoryAnalysisMultisetView, which displays
 * when user selects an analysis type group in the sidebar (e.g., "GO Biological Process").
 *
 * RATIONALE: Venn diagrams compare multiple datasets, so they belong in a multi-set view,
 * not in the single-dataset CategoryResultsView. The multi-set view provides proper context
 * for cross-dataset comparisons by showing all available results of a specific analysis type.
 *
 * NAVIGATION PATH: Sidebar → Project → Analysis Type Group → CategoryAnalysisMultisetView → VennDiagram
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Select, Button, Table, Collapse, Alert, Spin } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import { useAppSelector } from '../../store/hooks';
import { Venn } from '@ant-design/charts';
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';

const { Option } = Select;
const { Panel } = Collapse;

interface VennDiagramProps {
  projectId: string;
  availableResults: string[];
}

export default function VennDiagram({ projectId, availableResults }: VennDiagramProps) {
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [vennData, setVennData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vennDiagramRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (selectedResults.length < 2 || selectedResults.length > 5) {
      setError('Please select 2-5 category analysis results');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await CategoryResultsService.getVennDiagramData(projectId, selectedResults);
      setVennData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Venn diagram');
      console.error('Error generating Venn diagram:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!vennData || !vennData.overlaps || !vennData.setNames) {
      setError('No data available to export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'BMDExpress Web';
      workbook.created = new Date();

      // Capture Venn diagram as image
      let imageId: number | null = null;
      let imageWidth = 800;
      let imageHeight = 500;
      if (vennDiagramRef.current) {
        try {
          const canvas = await html2canvas(vennDiagramRef.current, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
          });

          // Get actual canvas dimensions (divide by 2 because scale: 2 doubles the size)
          imageWidth = canvas.width / 2;
          imageHeight = canvas.height / 2;
          console.log('[VennDiagram] Captured canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('[VennDiagram] Display dimensions for Excel:', imageWidth, 'x', imageHeight);

          const base64Image = canvas.toDataURL('image/png');

          // Remove the data:image/png;base64, prefix
          const base64Data = base64Image.split(',')[1];

          // Add image to workbook
          imageId = workbook.addImage({
            base64: base64Data,
            extension: 'png',
          });
          console.log('[VennDiagram] Captured and added diagram image, ID:', imageId);
        } catch (err) {
          console.warn('[VennDiagram] Failed to capture diagram image:', err);
        }
      }

      // Sheet 1: Summary - Set names, mappings, and diagram image
      const summarySheet = workbook.addWorksheet('Summary');

      // Add header information
      summarySheet.addRow(['Venn Diagram Export Summary']);
      summarySheet.addRow(['Project:', projectId]);
      summarySheet.addRow(['Generated:', new Date().toLocaleString()]);
      summarySheet.addRow([]);

      if (imageId !== null) {
        summarySheet.addRow(['Diagram Image:']);
        summarySheet.addRow([]);

        // Set column widths BEFORE adding image to prevent squishing
        // Make columns wide enough to accommodate the 800px image
        summarySheet.getColumn(1).width = 30;
        summarySheet.getColumn(2).width = 30;
        summarySheet.getColumn(3).width = 30;
        summarySheet.getColumn(4).width = 30;
        summarySheet.getColumn(5).width = 30;
        summarySheet.getColumn(6).width = 30;

        // Embed the image starting at row 7, using actual captured dimensions
        summarySheet.addImage(imageId, {
          tl: { col: 0, row: 6 }, // top-left at A7
          ext: { width: imageWidth, height: imageHeight }, // Use actual canvas dimensions
          editAs: 'oneCell' // Prevent Excel from resizing based on cell dimensions
        });

        // Add spacing rows to push the legend below the image
        for (let i = 0; i < 28; i++) {
          summarySheet.addRow([]);
        }
      } else {
        summarySheet.addRow(['Diagram Image: Not available']);
        summarySheet.addRow([]);
      }

      // Add set mapping legend
      summarySheet.addRow(['Set Label', 'Analysis Result Name']);
      vennData.setNames.forEach((name: string, index: number) => {
        summarySheet.addRow([String.fromCharCode(65 + index), name]);
      });

      // Style the summary sheet
      summarySheet.getRow(1).font = { bold: true, size: 14 };
      // Column widths already set above if image exists, otherwise set them now
      if (imageId === null) {
        summarySheet.getColumn(1).width = 20;
        summarySheet.getColumn(2).width = 50;
      }

      // Sheet 2: Instructions for creating native Venn diagrams in Excel
      const instructionsSheet = workbook.addWorksheet('Instructions');

      const instructions = [
        ['How to Create a Native Venn Diagram in Excel'],
        [],
        ['Note: The "Summary" sheet contains a PNG image of the Venn diagram from BMDExpress Web.'],
        ['If you need an interactive/editable Venn diagram in Excel, follow these instructions:'],
        [],
        ['METHOD 1: Using Excel Add-ins (Recommended)'],
        ['1. Open Excel and go to Insert > Get Add-ins (or Insert > Office Add-ins)'],
        ['2. Search for "Venn Diagram" in the Office Add-ins store'],
        ['3. Popular options include:'],
        ['   - "Lucidchart Diagrams" - Professional diagramming tool'],
        ['   - "ChartExpo" - Specialized chart add-in with Venn diagrams'],
        ['   - "Power-user" - Advanced charting and productivity add-in'],
        ['4. Install your chosen add-in and follow its instructions'],
        ['5. Use the overlap counts from the "Overlaps" sheet as input data'],
        [],
        ['METHOD 2: Manual Drawing with Shapes'],
        ['1. Go to Insert > Shapes > select Circle'],
        ['2. Draw 2-5 circles (depending on your set count)'],
        ['3. Right-click each circle > Format Shape > Fill > Set transparency to 50%'],
        ['4. Assign different colors to each circle'],
        ['5. Position circles to overlap according to your data'],
        ['6. Add text boxes with labels and counts from the "Overlaps" sheet'],
        [],
        ['METHOD 3: Online Tools (Export as Image)'],
        ['1. Visit online Venn diagram creators:'],
        ['   - venndiagram.app'],
        ['   - bioinformatics.psb.ugent.be/webtools/Venn/'],
        ['   - meta-chart.com/venn'],
        ['2. Input your data from the "Overlaps" sheet'],
        ['3. Generate and download the diagram as an image'],
        ['4. Insert the image into Excel: Insert > Pictures'],
        [],
        ['METHOD 4: Using SmartArt (Limited)'],
        ['1. Go to Insert > SmartArt > Relationship'],
        ['2. Select a circular relationship diagram (not a true Venn)'],
        ['3. Customize text and colors'],
        ['Note: This is not a true Venn diagram but may be useful for simple cases'],
        [],
        ['DATA REFERENCE:'],
        ['- See "Overlaps" sheet for counts of each set combination'],
        ['- See sheets named after sets (A, B, A_B, etc.) for detailed category lists'],
        ['- Set labels are defined in the "Summary" sheet'],
      ];

      instructions.forEach(row => {
        instructionsSheet.addRow(row);
      });

      instructionsSheet.getRow(1).font = { bold: true, size: 14 };
      instructionsSheet.getColumn(1).width = 100;

      // Sort keys to show individual sets first, then combinations
      const sortedKeys = Object.keys(vennData.overlaps).sort((a, b) => {
        const aCount = a.split(',').length;
        const bCount = b.split(',').length;
        if (aCount !== bCount) return aCount - bCount;
        return a.localeCompare(b);
      });

      // Sheet 3: Overlaps - All combinations with counts
      const overlapsSheet = workbook.addWorksheet('Overlaps');
      overlapsSheet.addRow(['Set Combination', 'Analysis Results', 'Count', 'Description']);

      // Style header row
      overlapsSheet.getRow(1).font = { bold: true };
      overlapsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EAD3' }
      };

      sortedKeys.forEach(key => {
        const count = vennData.overlaps[key];
        const setLabels = key.split(',');
        const setNames = setLabels.map(label => {
          const index = label.charCodeAt(0) - 'A'.charCodeAt(0);
          return vennData.setNames?.[index] || label;
        });

        const description = setLabels.length === 1
          ? `Categories unique to ${setNames[0]}`
          : `Categories shared by: ${setNames.join(' AND ')}`;

        overlapsSheet.addRow([key, setNames.join(' ∩ '), count, description]);
      });

      // Auto-fit columns
      overlapsSheet.getColumn(1).width = 20;
      overlapsSheet.getColumn(2).width = 50;
      overlapsSheet.getColumn(3).width = 10;
      overlapsSheet.getColumn(4).width = 60;

      // Sheets 4+: Detailed category lists for each overlap
      sortedKeys.forEach(key => {
        const items = vennData.overlapItems?.[key] || [];
        if (items.length === 0) return;

        const setLabels = key.split(',');
        const setNames = setLabels.map(label => {
          const index = label.charCodeAt(0) - 'A'.charCodeAt(0);
          return vennData.setNames?.[index] || label;
        });

        // Sheet name must be <= 31 chars and not contain special chars
        let sheetName = key.replace(/,/g, '_');
        if (sheetName.length > 31) {
          sheetName = sheetName.substring(0, 31);
        }

        const itemSheet = workbook.addWorksheet(sheetName);

        itemSheet.addRow([setLabels.length === 1 ? 'Unique Categories' : 'Shared Categories']);
        itemSheet.addRow(['Set(s):', key]);
        itemSheet.addRow(['Analysis Result(s):', setNames.join(' ∩ ')]);
        itemSheet.addRow(['Count:', items.length]);
        itemSheet.addRow([]);
        itemSheet.addRow(['Category ID']);

        items.forEach((item: string) => {
          itemSheet.addRow([item]);
        });

        // Style
        itemSheet.getRow(1).font = { bold: true, size: 12 };
        itemSheet.getRow(6).font = { bold: true };
        itemSheet.getRow(6).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9EAD3' }
        };
        itemSheet.getColumn(1).width = 50;
        itemSheet.getColumn(2).width = 50;
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `VennDiagram_${projectId}_${timestamp}.xlsx`;

      // Write and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      console.log(`[VennDiagram] Exported to ${filename}`);
    } catch (err: any) {
      setError(err.message || 'Failed to export to Excel');
      console.error('Error exporting to Excel:', err);
    }
  };

  // Prepare Venn diagram data format for @ant-design/charts
  const vennChartData = useMemo(() => {
    console.log('[VennDiagram] Processing vennData:', vennData);

    if (!vennData || !vennData.overlaps || !vennData.setNames) {
      console.log('[VennDiagram] Missing vennData, overlaps, or setNames');
      return null;
    }

    // Transform backend data to Venn chart format
    // Backend provides INTERSECTION counts: "A" (unique to A), "A,B" (overlap), etc.
    // Venn library expects TOTAL SET SIZES

    const setCount = vennData.setCount;
    const setLabels = Array.from({ length: setCount }, (_, i) => String.fromCharCode(65 + i)); // ['A', 'B', 'C', ...]
    const overlaps = vennData.overlaps;

    // Calculate total size for each set by summing all intersections containing that set
    const setTotals = new Map<string, number>();

    setLabels.forEach(label => {
      let total = 0;
      // Sum all overlaps that include this set
      Object.entries(overlaps).forEach(([key, count]) => {
        const sets = key.split(',');
        if (sets.includes(label)) {
          total += count as number;
        }
      });
      setTotals.set(label, total);
      console.log(`[VennDiagram] Set ${label} total size: ${total}`);
    });

    // Build chart data: individual sets with totals, plus all overlaps
    const chartData: Array<{sets: string[], size: number, label: string}> = [];

    // Add individual sets with their TOTAL sizes
    setLabels.forEach(label => {
      chartData.push({
        sets: [label],
        size: setTotals.get(label) || 0,
        label: label
      });
    });

    // Add all overlaps (2+ sets)
    Object.entries(overlaps).forEach(([key, count]) => {
      const sets = key.split(',');
      if (sets.length > 1) {
        chartData.push({
          sets: sets,
          size: count as number,
          label: key
        });
      }
    });

    console.log('[VennDiagram] Chart data prepared:', chartData);
    console.log('[VennDiagram] Chart data length:', chartData.length);
    console.log('[VennDiagram] Full chart data JSON:', JSON.stringify(chartData, null, 2));
    return chartData;
  }, [vennData]);

  // Prepare table data from overlaps
  const getTableData = () => {
    if (!vennData || !vennData.overlaps) return [];

    const data: any[] = [];

    // Sort keys to show individual sets first, then combinations
    const sortedKeys = Object.keys(vennData.overlaps).sort((a, b) => {
      const aCount = a.split(',').length;
      const bCount = b.split(',').length;
      if (aCount !== bCount) return aCount - bCount;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      const count = vennData.overlaps[key];
      const items = vennData.overlapItems?.[key] || [];

      // Map key to set names
      const setLabels = key.split(',').map(label => {
        const index = label.charCodeAt(0) - 'A'.charCodeAt(0);
        return vennData.setNames?.[index] || label;
      });

      data.push({
        key,
        sets: key,
        setNames: setLabels.join(' ∩ '),
        count,
        items: items.slice(0, 10), // Show first 10 items
        allItems: items,
      });
    });

    return data;
  };

  const columns = [
    {
      title: 'Sets',
      dataIndex: 'sets',
      key: 'sets',
      width: 100,
    },
    {
      title: 'Analysis Results',
      dataIndex: 'setNames',
      key: 'setNames',
      width: 300,
      ellipsis: true,
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: 'Categories (Sample)',
      dataIndex: 'items',
      key: 'items',
      render: (items: string[]) => (
        <div style={{ fontSize: '0.85em' }}>
          {items.slice(0, 3).join(', ')}
          {items.length > 3 && '...'}
        </div>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Card
        title="Venn Diagram - Category Overlap Analysis"
        style={{ marginBottom: '1rem' }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Select 2-5 Category Analysis Results to Compare:</strong>
          </div>
          <Select
            mode="multiple"
            style={{ width: '100%', marginBottom: '1rem' }}
            placeholder="Select analysis results to compare"
            value={selectedResults}
            onChange={setSelectedResults}
            maxTagCount={5}
          >
            {availableResults.map(name => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="primary"
              onClick={handleGenerate}
              disabled={selectedResults.length < 2 || selectedResults.length > 5}
              loading={loading}
            >
              Generate Venn Diagram
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportToExcel}
              disabled={!vennData}
              title="Export Venn diagram data to Excel"
            >
              Export to Excel
            </Button>
          </div>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spin size="large" tip="Calculating overlaps..." />
          </div>
        )}

        {vennData && !loading && (
          <div>
            <h4 style={{ marginTop: '1rem' }}>
              Comparing {vennData.setCount} Analysis Results
            </h4>

            {/* Venn Diagram Visualization */}
            {(() => {
              console.log('[VennDiagram] Rendering check - vennChartData:', vennChartData);
              console.log('[VennDiagram] Rendering check - length:', vennChartData?.length);

              if (vennChartData && vennChartData.length > 0) {
                console.log('[VennDiagram] Rendering Venn chart with data:', vennChartData);
                return (
                  <div ref={vennDiagramRef} style={{
                    marginBottom: '2rem',
                    display: 'inline-block',
                    width: '800px',
                    height: '500px',
                    overflow: 'hidden'
                  }}>
                    <Venn
                      data={vennChartData}
                      setsField="sets"
                      sizeField="size"
                      width={800}
                      height={500}
                    />
                  </div>
                );
              } else {
                console.log('[VennDiagram] NOT rendering Venn chart - data missing or empty');
                return null;
              }
            })()}

            <p style={{ color: '#666', marginBottom: '1rem' }}>
              The Venn diagram above shows the overlaps between selected category analysis results. The table below provides detailed counts and category names for each combination.
            </p>

            <Table
              dataSource={getTableData()}
              columns={columns}
              pagination={false}
              size="small"
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                    <strong>All Categories in this Overlap ({record.allItems.length}):</strong>
                    <ul style={{ marginTop: '0.5rem', columnCount: 2, columnGap: '2rem' }}>
                      {record.allItems.map((item: string, index: number) => (
                        <li key={index} style={{ fontSize: '0.85em', marginBottom: '0.25rem' }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
                rowExpandable: (record) => record.allItems.length > 0,
              }}
            />

            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Legend:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                {vennData.setNames?.map((name: string, index: number) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>
                    <strong>{String.fromCharCode(65 + index)}</strong>: {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!vennData && !loading && !error && (
          <Alert
            message="Select datasets to compare"
            description="Choose 2-5 category analysis results from the dropdown above and click 'Generate Venn Diagram' to see overlapping categories."
            type="info"
          />
        )}
      </Card>
    </div>
  );
}
