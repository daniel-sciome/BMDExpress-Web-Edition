import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Switch, Space, Typography, Alert, Button } from 'antd';
import { SkillDefinition } from './SkillConfigDrawer';

const { Text } = Typography;
const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { value: 'data_extraction', label: 'Data Extraction' },
  { value: 'chart_interpretation', label: 'Chart Interpretation' },
  { value: 'integrative', label: 'Integrative Analysis' },
];

const TIER_OPTIONS = [
  { value: 1, label: 'Tier 1 — Core' },
  { value: 2, label: 'Tier 2 — Quality' },
  { value: 3, label: 'Tier 3 — Integrative' },
];

interface SkillEditModalProps {
  open: boolean;
  mode: 'edit' | 'create';
  skill: SkillDefinition | null;
  isModified: boolean;
  onSave: (skill: SkillDefinition) => void;
  onReset: (skillId: string) => void;
  onCancel: () => void;
}

export default function SkillEditModal({
  open,
  mode,
  skill,
  isModified,
  onSave,
  onReset,
  onCancel,
}: SkillEditModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SkillDefinition['category']>('chart_interpretation');
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [chartTypes, setChartTypes] = useState<string[]>([]);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [defaultEnabled, setDefaultEnabled] = useState(false);

  const isCreate = mode === 'create';
  const isBackend = !isCreate && skill?.isBackend === true;
  const isCustom = !isCreate && skill ? skill.id.startsWith('custom_') : false;

  useEffect(() => {
    if (open) {
      if (isCreate) {
        setName('');
        setDescription('');
        setCategory('chart_interpretation');
        setTier(1);
        setChartTypes([]);
        setPromptTemplate('');
        setDefaultEnabled(false);
      } else if (skill) {
        setName(skill.name);
        setDescription(skill.description);
        setCategory(skill.category);
        setTier(skill.tier);
        setChartTypes(skill.chartTypes);
        setPromptTemplate(skill.promptTemplate || '');
        setDefaultEnabled(skill.defaultEnabled);
      }
    }
  }, [open, skill, isCreate]);

  const canSave = () => {
    if (!name.trim()) return false;
    if (!isBackend && !promptTemplate.trim()) return false;
    return true;
  };

  const handleSave = () => {
    if (!canSave()) return;

    const id = isCreate
      ? `custom_${crypto.randomUUID()}`
      : skill!.id;

    onSave({
      id,
      name: name.trim(),
      description: description.trim(),
      category,
      tier,
      chartTypes,
      defaultEnabled,
      isBackend: isCreate ? false : skill!.isBackend,
      promptTemplate: isBackend ? skill!.promptTemplate : promptTemplate.trim() || undefined,
    });
  };

  const title = isCreate
    ? 'Create Custom Skill'
    : isBackend
      ? `${skill?.name} (Read-Only)`
      : `Edit: ${skill?.name}`;

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      okText={isCreate ? 'Create' : 'Save'}
      okButtonProps={{ disabled: isBackend || !canSave() }}
      width={560}
      footer={isBackend ? (
        <Button onClick={onCancel}>Close</Button>
      ) : undefined}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {isBackend && (
          <Alert
            type="info"
            message="Backend skill — configuration is read-only"
            description="This skill runs on the server. Its prompt and parameters are managed in the backend code."
            showIcon
          />
        )}

        <div>
          <Text strong>Name</Text>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Oxidative Stress Detector"
            disabled={isBackend}
            style={{ marginTop: 4 }}
            status={!name.trim() && !isBackend ? 'error' : undefined}
          />
        </div>

        <div>
          <Text strong>Description</Text>
          <TextArea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What does this skill analyze?"
            rows={3}
            disabled={isBackend}
            style={{ marginTop: 4 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Text strong>Category</Text>
            <Select
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
              disabled={isBackend || (!isCreate && !isCustom)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>Tier</Text>
            <Select
              value={tier}
              onChange={setTier}
              options={TIER_OPTIONS}
              disabled={isBackend}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
        </div>

        <div>
          <Text strong>Chart Types</Text>
          <Select
            mode="tags"
            value={chartTypes}
            onChange={setChartTypes}
            placeholder="Type chart names and press Enter"
            disabled={isBackend}
            style={{ width: '100%', marginTop: 4 }}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Chart types this skill applies to. Type a name and press Enter.
          </Text>
        </div>

        {!isBackend && (
          <div>
            <Text strong>Prompt Template</Text>
            <TextArea
              value={promptTemplate}
              onChange={e => setPromptTemplate(e.target.value)}
              placeholder="Instructions the AI will follow when this skill is active..."
              autoSize={{ minRows: 8 }}
              style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}
              status={!promptTemplate.trim() ? 'error' : undefined}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              This prompt is appended to the LLM instruction when the skill is enabled.
            </Text>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong>Enabled by Default</Text>
          <Switch
            checked={defaultEnabled}
            onChange={setDefaultEnabled}
            disabled={isBackend}
            size="small"
          />
        </div>

        {isModified && !isBackend && (
          <Button
            danger
            block
            onClick={() => onReset(skill!.id)}
          >
            Reset to Default
          </Button>
        )}
      </Space>
    </Modal>
  );
}
