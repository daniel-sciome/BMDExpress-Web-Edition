import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Slider, Typography, Space, Alert } from 'antd';

const { Text } = Typography;

const PROVIDERS = [
  { value: 'claude', label: 'Claude (Anthropic)', defaultModel: 'claude-sonnet-4-5-20250929' },
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o' },
  { value: 'gemini', label: 'Gemini (Google)', defaultModel: 'gemini-2.0-flash' },
];

interface LlmSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LlmSettingsModal({ open, onClose }: LlmSettingsModalProps) {
  const [provider, setProvider] = useState('claude');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.3);

  useEffect(() => {
    if (open) {
      const savedProvider = localStorage.getItem('llm_provider') || 'claude';
      setProvider(savedProvider);
      setApiKey(localStorage.getItem(`llm_api_key_${savedProvider}`) || '');
      setModel(localStorage.getItem('llm_model') || '');
      setTemperature(parseFloat(localStorage.getItem('llm_temperature') || '0.3'));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setApiKey(localStorage.getItem(`llm_api_key_${provider}`) || '');
      const providerInfo = PROVIDERS.find(p => p.value === provider);
      if (!model || PROVIDERS.some(p => p.defaultModel === model)) {
        setModel(providerInfo?.defaultModel || '');
      }
    }
  }, [provider]);

  const handleSave = () => {
    localStorage.setItem('llm_provider', provider);
    localStorage.setItem(`llm_api_key_${provider}`, apiKey);
    localStorage.setItem('llm_model', model);
    localStorage.setItem('llm_temperature', String(temperature));
    onClose();
  };

  return (
    <Modal
      title="LLM Settings"
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      okText="Save"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Alert
          type="info"
          message="API keys are stored in your browser's localStorage only. They are never saved to the server."
          showIcon
        />

        <div>
          <Text strong>Provider</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={provider}
            onChange={setProvider}
            options={PROVIDERS}
          />
        </div>

        <div>
          <Text strong>API Key</Text>
          <Input.Password
            placeholder={`Enter your ${PROVIDERS.find(p => p.value === provider)?.label} API key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>

        <div>
          <Text strong>Model Override (optional)</Text>
          <Input
            placeholder={PROVIDERS.find(p => p.value === provider)?.defaultModel}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>

        <div>
          <Text strong>Temperature: {temperature}</Text>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={setTemperature}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Lower = more focused, Higher = more creative
          </Text>
        </div>
      </Space>
    </Modal>
  );
}
