import React, { useState } from 'react';
import { Button, Modal, Input, Select, Space, Typography, Alert, Spin, Badge, Tag } from 'antd';
import { RobotOutlined, SettingOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectActiveSection,
  selectActiveReport,
  selectLlmGenerating,
  setLlmGenerating,
  updateSectionContentLocally,
} from '../../store/slices/reportSlice';
import { LlmService } from 'Frontend/generated/endpoints';
import LlmSettingsModal from './LlmSettingsModal';
import SkillConfigDrawer, { getEnabledSkillCount, getEnabledInterpretationPrompt } from './SkillConfigDrawer';

const { TextArea } = Input;
const { Text } = Typography;

const PROVIDER_OPTIONS = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini (Google)' },
];

export default function AssistButton() {
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector(selectActiveSection);
  const activeReport = useAppSelector(selectActiveReport);
  const generating = useAppSelector(selectLlmGenerating);

  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [provider, setProvider] = useState(() =>
    localStorage.getItem('llm_provider') || 'claude'
  );
  const [model, setModel] = useState(() =>
    localStorage.getItem('llm_model') || ''
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [skillsUsed, setSkillsUsed] = useState<string[]>([]);

  const getApiKey = () => {
    return localStorage.getItem(`llm_api_key_${provider}`) || '';
  };

  const handleGenerate = async () => {
    if (!activeReport || !activeSection) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setError('No API key configured. Click the settings icon to add one.');
      return;
    }

    setError(null);
    setResult(null);
    setSkillsUsed([]);
    dispatch(setLlmGenerating(true));

    try {
      // Build combined instruction: user instruction + interpretation skill prompts
      const baseInstruction = instruction || 'Draft this section based on the available data and section purpose.';
      const interpretationPrompt = getEnabledInterpretationPrompt();
      const combinedInstruction = interpretationPrompt
        ? `${baseInstruction}\n\n--- ANALYSIS SKILLS ---\nApply the following analysis perspectives when interpreting the data:\n\n${interpretationPrompt}`
        : baseInstruction;

      const response = await LlmService.generateSectionContent({
        reportId: activeReport.id,
        sectionId: activeSection.id,
        provider,
        apiKey,
        model: model || null,
        instruction: combinedInstruction,
        includeAdjacentSections: true,
        useSkills: true,
        temperature: null,
        maxTokens: null,
      });

      if (response?.success) {
        setResult(response.content || '');
        setSkillsUsed(response.skillsUsed || []);
      } else {
        setError(response?.error || 'Generation failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
    } finally {
      dispatch(setLlmGenerating(false));
    }
  };

  const handleApply = () => {
    if (result && activeSection) {
      dispatch(updateSectionContentLocally({ sectionId: activeSection.id, content: result }));
      setModalOpen(false);
      setResult(null);
      setInstruction('');
      setSkillsUsed([]);
    }
  };

  const skillCount = getEnabledSkillCount();

  return (
    <>
      <Button
        icon={<RobotOutlined />}
        onClick={() => setModalOpen(true)}
        size="small"
        loading={generating}
      >
        Assist
      </Button>

      <Modal
        title="AI Writing Assistant"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setResult(null); setError(null); setSkillsUsed([]); }}
        footer={null}
        width={640}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Provider row + settings + skills */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Text strong>Provider</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={provider}
                onChange={(v) => { setProvider(v); localStorage.setItem('llm_provider', v); }}
                options={PROVIDER_OPTIONS}
              />
            </div>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsOpen(true)}
              size="small"
            />
            <Badge count={skillCount} size="small" offset={[-4, 0]} color="#722ed1">
              <Button
                icon={<ExperimentOutlined />}
                onClick={() => setSkillsOpen(true)}
                size="small"
              >
                Skills
              </Button>
            </Badge>
          </div>

          {/* Instruction */}
          <div>
            <Text strong>Instruction</Text>
            <TextArea
              rows={3}
              placeholder="e.g., Draft this section focusing on dose-response concordance between genomic and apical endpoints..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>

          {/* Generate button */}
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleGenerate}
            loading={generating}
            block
          >
            Generate
          </Button>

          {/* Loading state */}
          {generating && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin />
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Running {skillCount} skills and generating content...
              </Text>
            </div>
          )}

          {error && <Alert type="error" message={error} showIcon />}

          {/* Result preview */}
          {result && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Preview</Text>
                {skillsUsed.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {skillsUsed.map(s => (
                      <Tag key={s} color="purple" style={{ fontSize: 10, margin: 0 }}>
                        {s}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
              <div style={{
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                padding: 12,
                maxHeight: 300,
                overflow: 'auto',
                marginTop: 4,
                fontSize: 13,
              }}>
                <div dangerouslySetInnerHTML={{ __html: result }} />
              </div>
              <Space style={{ marginTop: 8 }}>
                <Button type="primary" onClick={handleApply}>
                  Apply to Section
                </Button>
                <Button onClick={() => { setResult(null); setSkillsUsed([]); }}>
                  Discard
                </Button>
              </Space>
            </div>
          )}
        </Space>
      </Modal>

      <LlmSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SkillConfigDrawer open={skillsOpen} onClose={() => setSkillsOpen(false)} />
    </>
  );
}
