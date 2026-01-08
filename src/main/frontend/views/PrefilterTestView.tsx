import React, { useState } from 'react';
import { Button, Card, Statistic, Row, Col, Alert, Progress, Space, Descriptions } from 'antd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  runOneWayANOVA,
  selectAllPrefilterResults,
  selectSelectedPrefilterResults,
  selectIsRunning,
  selectProgress,
  selectStatusMessage,
  selectError,
  type OneWayANOVAInput,
} from '../store/slices/prefilterSlice';

/**
 * Test view for prefilter functionality
 * Tests mock service integration and Redux state management
 */
export default function PrefilterTestView() {
  const dispatch = useAppDispatch();

  // Redux state
  const allResults = useAppSelector(selectAllPrefilterResults);
  const selectedResults = useAppSelector(selectSelectedPrefilterResults);
  const isRunning = useAppSelector(selectIsRunning);
  const progress = useAppSelector(selectProgress);
  const statusMessage = useAppSelector(selectStatusMessage);
  const error = useAppSelector(selectError);

  // Local state for test input
  const [testInput] = useState<OneWayANOVAInput>({
    doseResponseExperimentId: 'P3MP-Parham',  // Real project from resources
    name: 'P3MP-Parham ANOVA Analysis',
    pValueCutOff: 0.05,
    filterControlGenes: true,
    useBenAndHoch: false,
    useFoldChange: true,
    foldChangeValue: 2.0,
    loelPValue: 0.05,
    loelFoldChangeValue: 2.0,
    tTest: true,
    numThreads: 4,
  });

  const handleRunTest = async () => {
    try {
      await dispatch(runOneWayANOVA(testInput)).unwrap();
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Prefilter Test View</h1>
      <p>Test the prefilter foundation: DTOs, service, TypeScript generation, and Redux integration.</p>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Test Controls */}
        <Col span={24}>
          <Card title="Test Controls">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleRunTest}
                loading={isRunning}
                disabled={isRunning}
              >
                Run Mock ANOVA Analysis
              </Button>

              {isRunning && (
                <div>
                  <Progress percent={progress} />
                  <p>{statusMessage}</p>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* Results Summary */}
        <Col span={24}>
          <Card title="Results Summary">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Results"
                  value={allResults.length}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Selected Result ID"
                  value={selectedResults?.id || 'None'}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Status"
                  value={isRunning ? 'Running' : 'Idle'}
                  valueStyle={{ color: isRunning ? '#1890ff' : '#52c41a' }}
                />
              </Col>
            </Row>

            {/* Download Button - shown after analysis completes */}
            {!isRunning && allResults.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  size="large"
                  href="/api/download/bm2/P3MP-Parham-with-anova.bm2"
                  download
                  icon={<span>⬇️</span>}
                >
                  Download P3MP-Parham-with-anova.bm2
                </Button>
                <p style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                  Download the updated .bm2 file with ANOVA results for all 21 experiments
                </p>
              </div>
            )}
          </Card>
        </Col>

        {/* Selected Result Details */}
        {selectedResults && (
          <Col span={24}>
            <Card title="Selected Result Details">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="ID">{selectedResults.id}</Descriptions.Item>
                <Descriptions.Item label="Name">{selectedResults.name}</Descriptions.Item>
                <Descriptions.Item label="Type">{selectedResults.prefilterType}</Descriptions.Item>
                <Descriptions.Item label="Created">
                  {selectedResults.createdDate ? new Date(selectedResults.createdDate).toLocaleString() : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Version">{selectedResults.version || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Experiment ID">
                  {selectedResults.doseResponseExperimentId}
                </Descriptions.Item>
                <Descriptions.Item label="Total Probes Analyzed">
                  {selectedResults.totalProbesAnalyzed}
                </Descriptions.Item>
                <Descriptions.Item label="Probes Passed">
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {selectedResults.probesPassed}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Probes Failed">
                  <span style={{ color: '#ff4d4f' }}>
                    {selectedResults.probesFailed}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Pass Rate">
                  {selectedResults.totalProbesAnalyzed > 0
                    ? ((selectedResults.probesPassed / selectedResults.totalProbesAnalyzed) * 100).toFixed(1) + '%'
                    : 'N/A'}
                </Descriptions.Item>
              </Descriptions>

              <h3 style={{ marginTop: 16 }}>Input Parameters</h3>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="P-Value Cutoff">
                  {selectedResults.inputParameters?.pValueCutOff}
                </Descriptions.Item>
                <Descriptions.Item label="Use FDR Correction">
                  {selectedResults.inputParameters?.useBenAndHoch ? 'Yes' : 'No'}
                </Descriptions.Item>
                <Descriptions.Item label="Use Fold Change Filter">
                  {selectedResults.inputParameters?.useFoldChange ? 'Yes' : 'No'}
                </Descriptions.Item>
                <Descriptions.Item label="Fold Change Threshold">
                  {selectedResults.inputParameters?.foldChangeValue}
                </Descriptions.Item>
                <Descriptions.Item label="Filter Control Genes">
                  {selectedResults.inputParameters?.filterControlGenes ? 'Yes' : 'No'}
                </Descriptions.Item>
                <Descriptions.Item label="Number of Threads">
                  {selectedResults.inputParameters?.numThreads}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        )}

        {/* All Results List */}
        {allResults.length > 0 && (
          <Col span={24}>
            <Card title={`All Results (${allResults.length})`}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {allResults.map((result, index) => (
                  <Card
                    key={result.id}
                    size="small"
                    type={selectedResults?.id === result.id ? 'inner' : undefined}
                  >
                    <div>
                      <strong>#{index + 1}:</strong> {result.name} ({result.prefilterType})
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ID: {result.id} | Probes: {result.probesPassed}/{result.totalProbesAnalyzed}
                    </div>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        )}

        {/* Test Input Display */}
        <Col span={24}>
          <Card title="Test Input (OneWayANOVAInput)">
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
              {JSON.stringify(testInput, null, 2)}
            </pre>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
