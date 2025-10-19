import React, { useEffect, useState } from 'react';
import { Card, Select, Spin, Alert, Empty, Checkbox, Button } from 'antd';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type PathwayInfoDto from 'Frontend/generated/com/sciome/dto/PathwayInfoDto';
import type CurveDataDto from 'Frontend/generated/com/sciome/dto/CurveDataDto';
import DoseResponseCurveChart from './charts/DoseResponseCurveChart';

const { Option } = Select;

interface PathwayCurveViewerProps {
  projectId: string;
  resultName: string;
}

export default function PathwayCurveViewer({ projectId, resultName }: PathwayCurveViewerProps) {
  const [pathways, setPathways] = useState<PathwayInfoDto[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [availableGenes, setAvailableGenes] = useState<string[]>([]);
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [curveData, setCurveData] = useState<CurveDataDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCurves, setLoadingCurves] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load pathways on mount
  useEffect(() => {
    loadPathways();
  }, [projectId, resultName]);

  // Load genes when pathway changes
  useEffect(() => {
    if (selectedPathway) {
      loadGenes();
    } else {
      setAvailableGenes([]);
      setSelectedGenes([]);
    }
  }, [selectedPathway]);

  const loadPathways = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CategoryResultsService.getPathways(projectId, resultName);
      setPathways((data || []).filter((p): p is PathwayInfoDto => p !== undefined));
    } catch (err: any) {
      setError(`Failed to load pathways: ${err.message}`);
      console.error('Error loading pathways:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGenes = async () => {
    if (!selectedPathway) return;

    setLoading(true);
    setError(null);
    try {
      const genes = await CategoryResultsService.getGenesInPathway(
        projectId,
        resultName,
        selectedPathway
      );
      setAvailableGenes((genes || []).filter((g): g is string => g !== undefined));
      setSelectedGenes([]);
    } catch (err: any) {
      setError(`Failed to load genes: ${err.message}`);
      console.error('Error loading genes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePathwayChange = (value: string) => {
    setSelectedPathway(value);
  };

  const handleGeneChange = (checkedValues: string[]) => {
    setSelectedGenes(checkedValues);
    setCurveData([]); // Clear curves when selection changes
  };

  const handlePlotCurves = async () => {
    if (!selectedPathway || selectedGenes.length === 0) return;

    setLoadingCurves(true);
    setError(null);
    try {
      const data = await CategoryResultsService.getCurveData(
        projectId,
        resultName,
        selectedPathway,
        selectedGenes
      );
      setCurveData((data || []).filter((c): c is CurveDataDto => c !== undefined));
    } catch (err: any) {
      setError(`Failed to load curve data: ${err.message}`);
      console.error('Error loading curve data:', err);
    } finally {
      setLoadingCurves(false);
    }
  };

  return (
    <Card
      title="Pathway Curve Viewer"
      style={{ marginTop: '1rem' }}
    >
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

      {/* Pathway Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Select Pathway:
        </label>
        <Select
          showSearch
          placeholder="Search for a pathway..."
          style={{ width: '100%' }}
          value={selectedPathway}
          onChange={handlePathwayChange}
          loading={loading}
          filterOption={(input, option) =>
            String(option?.children || '')?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {pathways.map((pathway) => (
            <Option key={pathway.pathwayDescription} value={pathway.pathwayDescription}>
              {pathway.pathwayDescription} ({pathway.geneCount} genes)
            </Option>
          ))}
        </Select>
      </div>

      {/* Gene Selection */}
      {selectedPathway && availableGenes.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Select Genes ({selectedGenes.length} selected):
          </label>
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              padding: '8px'
            }}
          >
            <Checkbox.Group
              style={{ display: 'flex', flexDirection: 'column' }}
              value={selectedGenes}
              onChange={handleGeneChange}
            >
              {availableGenes.map((gene) => (
                <Checkbox key={gene} value={gene} style={{ marginLeft: 0, marginBottom: '4px' }}>
                  {gene}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spin size="large" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !selectedPathway && pathways.length > 0 && (
        <Empty
          description="Select a pathway to view dose-response curves"
          style={{ padding: '2rem' }}
        />
      )}

      {/* Plot Button */}
      {selectedPathway && selectedGenes.length > 0 && curveData.length === 0 && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            loading={loadingCurves}
            onClick={handlePlotCurves}
          >
            {loadingCurves ? 'Loading Curves...' : `Plot Curves for ${selectedGenes.length} Gene(s)`}
          </Button>
        </div>
      )}

      {/* Curve Plot */}
      {curveData.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <DoseResponseCurveChart curves={curveData} />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button onClick={() => setCurveData([])}>
              Clear Plot
            </Button>
          </div>
        </div>
      )}

      {/* No genes state */}
      {selectedPathway && availableGenes.length === 0 && !loading && (
        <Empty
          description={`No genes found in pathway: ${selectedPathway}`}
          style={{ padding: '2rem' }}
        />
      )}
    </Card>
  );
}
