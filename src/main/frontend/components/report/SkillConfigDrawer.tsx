import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer, Switch, Tag, Typography, Space, Collapse, Badge,
  Tooltip, Input, Empty, Button, Popconfirm,
} from 'antd';
import {
  ExperimentOutlined, ThunderboltOutlined, LineChartOutlined,
  SearchOutlined, InfoCircleOutlined, CheckCircleFilled,
  EditOutlined, DeleteOutlined, PlusOutlined,
} from '@ant-design/icons';
import SkillEditModal from './SkillEditModal';

const { Text, Title } = Typography;

// ── Skill catalog ──────────────────────────────────────────────

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: 'data_extraction' | 'chart_interpretation' | 'integrative';
  tier: 1 | 2 | 3;
  chartTypes: string[];
  defaultEnabled: boolean;
  isBackend: boolean;
  promptTemplate?: string;
}

const SKILL_CATALOG: SkillDefinition[] = [
  // ── Data Extraction (backend) ──
  {
    id: 'experiment_summary',
    name: 'Experiment Summary',
    description: 'Extracts species, strain, sex, organ, test article, dose levels, and probe counts from all experiments in the project.',
    category: 'data_extraction',
    tier: 1,
    chartTypes: [],
    defaultEnabled: true,
    isBackend: true,
  },
  {
    id: 'prefilter_summary',
    name: 'Prefilter Summary',
    description: 'Summarizes all prefilter analyses (ANOVA, Williams Trend, Oriogen, Curve Fit) with probe counts and filter parameters.',
    category: 'data_extraction',
    tier: 1,
    chartTypes: [],
    defaultEnabled: true,
    isBackend: true,
  },
  {
    id: 'bmd_analysis_summary',
    name: 'BMD Analysis Summary',
    description: 'Summarizes benchmark dose modeling: probes modeled, model type distribution (Hill/Power/Poly), and BMD value statistics.',
    category: 'data_extraction',
    tier: 1,
    chartTypes: [],
    defaultEnabled: true,
    isBackend: true,
  },
  {
    id: 'category_analysis_summary',
    name: 'Category Analysis Summary',
    description: 'Extracts top 20 pathways by Fisher\'s p-value with gene counts, BMD/BMDL medians, direction, and gene symbols.',
    category: 'data_extraction',
    tier: 1,
    chartTypes: [],
    defaultEnabled: true,
    isBackend: true,
  },

  // ── Chart Interpretation (Tier 1 — Core) ──
  {
    id: 'dose_response_shape',
    name: 'Dose-Response Shape Classifier',
    description: 'Classifies curve shapes (monotonic, U-shaped, threshold, supralinear) and explains what each pattern means for health risk at different dose levels.',
    category: 'chart_interpretation',
    tier: 1,
    chartTypes: ['Dose-Response Curves'],
    defaultEnabled: true,
    isBackend: false,
    promptTemplate: 'When interpreting dose-response curves, classify each gene\'s curve shape (monotonic up/down, U-shaped/hormetic, J-shaped, threshold, supralinear). Explain the toxicological significance: monotonic = classic toxic response scaling with dose; U-shaped = hormesis with beneficial low-dose effect; threshold = safe below critical dose. Identify genes with the steepest dose-response and flag any non-monotonic patterns that may complicate risk assessment.',
  },
  {
    id: 'bmd_sensitivity_profiler',
    name: 'BMD Sensitivity Profiler',
    description: 'Characterizes overall sensitivity from BMD distributions — are values clustered low (highly sensitive organ) or spread wide? Identifies the dose range where disruption begins.',
    category: 'chart_interpretation',
    tier: 1,
    chartTypes: ['BMD Box Plot', 'Histograms', 'Accumulation Charts'],
    defaultEnabled: true,
    isBackend: false,
    promptTemplate: 'Analyze the distribution of BMD values across all pathways. Determine if the organ is highly sensitive (BMDs clustered at low doses), moderately sensitive (spread distribution), or relatively resistant (BMDs at high doses). Identify the dose range where biological disruption begins and what fraction of pathways are affected at each dose level. Comment on how the BMD distribution shape informs the overall toxicological profile.',
  },
  {
    id: 'pathway_toxicity_ranker',
    name: 'Pathway Toxicity Ranker',
    description: 'Identifies high-concern pathways combining statistical significance, sensitivity (low BMD), and gene count — the upper-left quadrant of bubble/volcano plots.',
    category: 'chart_interpretation',
    tier: 1,
    chartTypes: ['Bar Charts', 'Bubble Chart', 'BMD vs P-Value Scatter'],
    defaultEnabled: true,
    isBackend: false,
    promptTemplate: 'Rank pathways by toxicological concern using a combined assessment of: (1) Fisher p-value (statistical significance of enrichment), (2) BMD value (sensitivity — lower is more concerning), (3) gene count (breadth of disruption), and (4) direction of effect. Identify the "high-concern" pathways that are simultaneously significant, sensitive, and broadly affected. Explain what each high-concern pathway\'s disruption means for organ function and health.',
  },
  {
    id: 'pod_estimator',
    name: 'Point-of-Departure Estimator',
    description: 'Synthesizes BMD data to recommend a transcriptomic point-of-departure (tPoD) — the dose below which genomic perturbations are minimal.',
    category: 'chart_interpretation',
    tier: 1,
    chartTypes: ['Accumulation Charts', 'Bar Charts', 'Range Plot'],
    defaultEnabled: true,
    isBackend: false,
    promptTemplate: 'Based on the accumulation of BMD values across pathways, estimate a transcriptomic point-of-departure (tPoD). Consider the 10th percentile of pathway BMDL values as the primary tPoD candidate. Evaluate whether this tPoD is protective of the most sensitive biological processes. Compare the tPoD to the dose levels tested in the study and assess whether sufficient margin of safety exists. Note any caveats about confidence interval width or pathway-specific considerations.',
  },
  {
    id: 'direction_interpreter',
    name: 'Direction of Effect Interpreter',
    description: 'Analyzes up/down regulation patterns: up-regulated inflammatory pathways = tissue damage; down-regulated metabolic pathways = organ impairment.',
    category: 'chart_interpretation',
    tier: 1,
    chartTypes: ['Category Analysis', 'Dose-Response Curves'],
    defaultEnabled: true,
    isBackend: false,
    promptTemplate: 'Analyze the direction of effect (UP, DOWN, CONFLICT) for the top pathways. Group pathways by direction and explain the biological significance: up-regulated inflammatory, apoptotic, or stress-response pathways suggest active tissue damage; down-regulated metabolic, biosynthetic, or transport pathways suggest impaired organ function; CONFLICT direction suggests complex, multi-gene responses. Identify whether the overall pattern points toward a specific toxicity mechanism (e.g., oxidative stress, mitochondrial dysfunction, immune activation).',
  },

  // ── Chart Interpretation (Tier 2 — Confidence & Quality) ──
  {
    id: 'confidence_assessor',
    name: 'Confidence Interval Assessor',
    description: 'Evaluates precision of BMD estimates from BMDL-BMDU spread. Narrow CIs = reliable for decisions; wide CIs = uncertain.',
    category: 'chart_interpretation',
    tier: 2,
    chartTypes: ['Range Plot', 'BMD vs BMDL Scatter'],
    defaultEnabled: false,
    isBackend: false,
    promptTemplate: 'Evaluate the precision of BMD estimates by examining the BMDL-to-BMDU confidence interval width. Identify pathways with narrow confidence intervals (reliable for regulatory decision-making) versus wide intervals (uncertain estimates needing more data). Flag any pathways where BMDL approaches zero or where BMDU is orders of magnitude above BMD, as these indicate poor model fit or insufficient data for that pathway.',
  },
  {
    id: 'model_fit_evaluator',
    name: 'Model Fit Quality Evaluator',
    description: 'Assesses model distribution (Hill vs Power vs Poly dominance) and what it implies about dose-response behavior and data quality.',
    category: 'chart_interpretation',
    tier: 2,
    chartTypes: ['Best Models Pie', 'Dose-Response Curves'],
    defaultEnabled: false,
    isBackend: false,
    promptTemplate: 'Assess the distribution of best-fit models across all probes. If Hill models dominate, this suggests classic sigmoidal dose-response (expected for most toxicological responses). High Exponential or Power model counts may indicate steep or gradual responses. A high proportion of failed fits suggests data quality concerns or non-standard response patterns. Comment on whether the model distribution is consistent with expected toxicological behavior for the test article and organ.',
  },
  {
    id: 'homogeneity_assessor',
    name: 'Within-Pathway Homogeneity Assessor',
    description: 'Evaluates whether genes within each pathway respond at similar doses (coordinated response) or very different doses (partial disruption).',
    category: 'chart_interpretation',
    tier: 2,
    chartTypes: ['Violin Per Category'],
    defaultEnabled: false,
    isBackend: false,
    promptTemplate: 'For each key pathway, assess how uniformly the member genes respond. A tight distribution of gene-level BMD values within a pathway indicates a coordinated biological response at a specific dose. A wide or bimodal distribution suggests only some genes are affected, and the pathway may be partially compensated. Relate homogeneity to pathway function — highly coordinated disruption of a critical pathway is more concerning than heterogeneous partial effects.',
  },

  // ── Integrative (Tier 3) ──
  {
    id: 'cross_analysis_comparator',
    name: 'Cross-Analysis Comparator',
    description: 'Compares findings across sex, organ, or platform. Identifies sex-specific effects, organ targets, and consistent findings.',
    category: 'integrative',
    tier: 3,
    chartTypes: ['Venn Diagram', 'Accumulation Comparison', 'Global Violin'],
    defaultEnabled: false,
    isBackend: false,
    promptTemplate: 'Compare findings across the available analyses (different sexes, organs, or platforms). Identify pathways that are consistently disrupted across analyses (high confidence) versus those unique to one condition (potentially sex-specific or organ-specific effects). Assess whether sensitivity differs between conditions and what this means for population-level risk assessment.',
  },
  {
    id: 'cluster_annotator',
    name: 'Gene Cluster Functional Annotator',
    description: 'Interprets UMAP and gene clusters — identifies coordinated pathway disruptions suggesting specific toxicity mechanisms.',
    category: 'integrative',
    tier: 3,
    chartTypes: ['UMAP Scatter', 'Cluster Heatmap', 'Cluster Scatter'],
    defaultEnabled: false,
    isBackend: false,
    promptTemplate: 'Interpret the gene/pathway clusters identified by UMAP analysis. For each major cluster, describe the common biological theme (e.g., "oxidative stress pathways cluster together," "cell cycle regulation pathways form a distinct group"). Explain what co-clustering implies about coordinated biological disruption and whether the cluster pattern suggests a specific mechanism of toxicity.',
  },
  {
    id: 'concordance_evaluator',
    name: 'Clinical-Genomic Concordance',
    description: 'Cross-references genomic findings with clinical data (organ weights, chemistry, histopathology) to validate molecular observations.',
    category: 'integrative',
    tier: 3,
    chartTypes: ['All genomic charts + clinical data'],
    defaultEnabled: false,
    isBackend: false,
    promptTemplate: 'Cross-reference the genomic pathway findings with any available clinical, histopathological, or organ weight data. Identify concordant findings (e.g., lipid metabolism pathway disruption at BMD X + liver weight increase at dose Y). Assess whether genomic changes precede, coincide with, or follow clinical effects. Concordant multi-level evidence strengthens the weight of evidence for adverse effects at specific doses.',
  },
  {
    id: 'aop_mapper',
    name: 'Adverse Outcome Pathway Mapper',
    description: 'Maps enriched pathways to known adverse outcome pathways: molecular initiating events → key events → adverse outcomes.',
    category: 'integrative',
    tier: 3,
    chartTypes: ['Category Analysis', 'UMAP Scatter'],
    defaultEnabled: false,
    isBackend: false,
    promptTemplate: 'Map the disrupted pathways to known adverse outcome pathways (AOPs). For the most significant pathway findings, trace the chain from molecular initiating event (MIE) through key events (KE) to the predicted adverse outcome (AO). For example: "NRF2 pathway activation (MIE) → sustained oxidative stress (KE1) → hepatocyte injury (KE2) → liver fibrosis (AO)." This connects molecular observations to organism-level health predictions.',
  },
];

// ── Storage helpers ──────────────────────────────────────────

const STORAGE_KEY = 'skill_config';
const CUSTOMIZATIONS_KEY = 'skill_customizations';

export interface SkillCustomizations {
  overrides: Record<string, Partial<Omit<SkillDefinition, 'id' | 'isBackend'>>>;
  custom: SkillDefinition[];
}

export function loadSkillCustomizations(): SkillCustomizations {
  try {
    const raw = localStorage.getItem(CUSTOMIZATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        overrides: parsed.overrides || {},
        custom: parsed.custom || [],
      };
    }
  } catch { /* ignore */ }
  return { overrides: {}, custom: [] };
}

export function saveSkillCustomizations(customizations: SkillCustomizations) {
  localStorage.setItem(CUSTOMIZATIONS_KEY, JSON.stringify(customizations));
}

export function getResolvedSkillCatalog(): SkillDefinition[] {
  const { overrides, custom } = loadSkillCustomizations();
  const resolved = SKILL_CATALOG.map(skill => {
    const override = overrides[skill.id];
    if (!override) return skill;
    return { ...skill, ...override, id: skill.id, isBackend: skill.isBackend };
  });
  return [...resolved, ...custom];
}

export function isSkillModified(skillId: string): boolean {
  const { overrides } = loadSkillCustomizations();
  return skillId in overrides;
}

export function isCustomSkill(skillId: string): boolean {
  return skillId.startsWith('custom_');
}

export function loadEnabledSkills(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Defaults
  const defaults: Record<string, boolean> = {};
  getResolvedSkillCatalog().forEach(s => { defaults[s.id] = s.defaultEnabled; });
  return defaults;
}

function saveEnabledSkills(config: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getEnabledSkillIds(): string[] {
  const config = loadEnabledSkills();
  return Object.entries(config).filter(([, v]) => v).map(([k]) => k);
}

export function getEnabledInterpretationPrompt(): string {
  const config = loadEnabledSkills();
  const catalog = getResolvedSkillCatalog();
  const lines: string[] = [];
  catalog.forEach(skill => {
    if (config[skill.id] && skill.promptTemplate) {
      lines.push(`[${skill.name.toUpperCase()}]\n${skill.promptTemplate}`);
    }
  });
  return lines.join('\n\n');
}

export function getEnabledSkillCount(): number {
  const config = loadEnabledSkills();
  return Object.values(config).filter(Boolean).length;
}

export { SKILL_CATALOG };

// ── Category metadata ──────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  data_extraction: {
    label: 'Data Extraction',
    icon: <ExperimentOutlined />,
    color: '#1890ff',
  },
  chart_interpretation: {
    label: 'Chart Interpretation',
    icon: <LineChartOutlined />,
    color: '#722ed1',
  },
  integrative: {
    label: 'Integrative Analysis',
    icon: <ThunderboltOutlined />,
    color: '#13c2c2',
  },
};

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Core', color: 'green' },
  2: { label: 'Quality', color: 'blue' },
  3: { label: 'Integrative', color: 'purple' },
};

// ── Component ──────────────────────────────────────────────────

interface SkillConfigDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SkillConfigDrawer({ open, onClose }: SkillConfigDrawerProps) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [customizations, setCustomizations] = useState<SkillCustomizations>({ overrides: {}, custom: [] });
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null);
  const [editModalMode, setEditModalMode] = useState<'edit' | 'create'>('edit');

  const catalog = useMemo(() => {
    // Re-derive catalog whenever customizations change
    const { overrides, custom } = customizations;
    const resolved = SKILL_CATALOG.map(skill => {
      const override = overrides[skill.id];
      if (!override) return skill;
      return { ...skill, ...override, id: skill.id, isBackend: skill.isBackend };
    });
    return [...resolved, ...custom];
  }, [customizations]);

  useEffect(() => {
    if (open) {
      setEnabled(loadEnabledSkills());
      setCustomizations(loadSkillCustomizations());
      setSearch('');
    }
  }, [open]);

  const handleToggle = (skillId: string, checked: boolean) => {
    const next = { ...enabled, [skillId]: checked };
    setEnabled(next);
    saveEnabledSkills(next);
  };

  const handleEnableAll = () => {
    const next: Record<string, boolean> = {};
    catalog.forEach(s => { next[s.id] = true; });
    setEnabled(next);
    saveEnabledSkills(next);
  };

  const handleEnableDefaults = () => {
    const next: Record<string, boolean> = {};
    catalog.forEach(s => { next[s.id] = s.defaultEnabled; });
    setEnabled(next);
    saveEnabledSkills(next);
  };

  const handleEditSkill = (skill: SkillDefinition) => {
    setEditingSkill(skill);
    setEditModalMode('edit');
  };

  const handleCreateSkill = () => {
    setEditingSkill(null);
    setEditModalMode('create');
  };

  const handleSaveSkill = (updated: SkillDefinition) => {
    const next = { ...customizations };
    if (isCustomSkill(updated.id)) {
      // Custom skill — update or add
      const idx = next.custom.findIndex(s => s.id === updated.id);
      if (idx >= 0) {
        next.custom = [...next.custom];
        next.custom[idx] = updated;
      } else {
        next.custom = [...next.custom, updated];
      }
    } else {
      // Built-in skill — store as override (diff from original)
      const original = SKILL_CATALOG.find(s => s.id === updated.id);
      if (original) {
        const diff: Record<string, any> = {};
        if (updated.name !== original.name) diff.name = updated.name;
        if (updated.description !== original.description) diff.description = updated.description;
        if (updated.category !== original.category) diff.category = updated.category;
        if (updated.tier !== original.tier) diff.tier = updated.tier;
        if (updated.promptTemplate !== original.promptTemplate) diff.promptTemplate = updated.promptTemplate;
        if (updated.defaultEnabled !== original.defaultEnabled) diff.defaultEnabled = updated.defaultEnabled;
        if (JSON.stringify(updated.chartTypes) !== JSON.stringify(original.chartTypes)) diff.chartTypes = updated.chartTypes;
        if (Object.keys(diff).length > 0) {
          next.overrides = { ...next.overrides, [updated.id]: diff };
        } else {
          // No diff — remove override
          next.overrides = { ...next.overrides };
          delete next.overrides[updated.id];
        }
      }
    }
    setCustomizations(next);
    saveSkillCustomizations(next);
    // Also auto-enable newly created custom skills
    if (isCustomSkill(updated.id) && !(updated.id in enabled)) {
      const nextEnabled = { ...enabled, [updated.id]: updated.defaultEnabled };
      setEnabled(nextEnabled);
      saveEnabledSkills(nextEnabled);
    }
    setEditingSkill(null);
    setEditModalMode('edit');
  };

  const handleResetSkill = (skillId: string) => {
    const next = { ...customizations, overrides: { ...customizations.overrides } };
    delete next.overrides[skillId];
    setCustomizations(next);
    saveSkillCustomizations(next);
    setEditingSkill(null);
    setEditModalMode('edit');
  };

  const handleDeleteSkill = (skillId: string) => {
    const next = {
      ...customizations,
      custom: customizations.custom.filter(s => s.id !== skillId),
    };
    setCustomizations(next);
    saveSkillCustomizations(next);
    // Also remove from enabled config
    const nextEnabled = { ...enabled };
    delete nextEnabled[skillId];
    setEnabled(nextEnabled);
    saveEnabledSkills(nextEnabled);
  };

  const enabledCount = useMemo(() =>
    Object.values(enabled).filter(Boolean).length,
    [enabled]
  );

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.chartTypes.some(c => c.toLowerCase().includes(q))
    );
  }, [search, catalog]);

  const groupedSkills = useMemo(() => {
    const groups: Record<string, SkillDefinition[]> = {
      data_extraction: [],
      chart_interpretation: [],
      integrative: [],
    };
    filteredCatalog.forEach(s => {
      groups[s.category]?.push(s);
    });
    return groups;
  }, [filteredCatalog]);

  const collapseItems = Object.entries(groupedSkills)
    .filter(([, skills]) => skills.length > 0)
    .map(([category, skills]) => {
      const meta = CATEGORY_META[category];
      const catEnabled = skills.filter(s => enabled[s.id]).length;
      return {
        key: category,
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {meta.icon}
            <span style={{ fontWeight: 600 }}>{meta.label}</span>
            <Badge
              count={`${catEnabled}/${skills.length}`}
              style={{ backgroundColor: catEnabled > 0 ? meta.color : '#d9d9d9' }}
              size="small"
            />
          </span>
        ),
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {skills.map(skill => (
              <SkillRow
                key={skill.id}
                skill={skill}
                checked={!!enabled[skill.id]}
                onToggle={(checked) => handleToggle(skill.id, checked)}
                onEdit={() => handleEditSkill(skill)}
                onDelete={isCustomSkill(skill.id) ? () => handleDeleteSkill(skill.id) : undefined}
                isModified={!isCustomSkill(skill.id) && isSkillModified(skill.id)}
                isCustom={isCustomSkill(skill.id)}
              />
            ))}
          </div>
        ),
      };
    });

  return (
    <Drawer
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          AI Skills
          <Badge count={enabledCount} style={{ backgroundColor: '#722ed1' }} size="small" />
        </span>
      }
      open={open}
      onClose={onClose}
      width={480}
      styles={{ body: { padding: '12px 16px' } }}
      extra={
        <Space size="small">
          <Button size="small" onClick={handleEnableDefaults}>Defaults</Button>
          <Button size="small" onClick={handleEnableAll}>All On</Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          size="small"
        />

        <div style={{
          padding: '6px 10px',
          background: '#fafafa',
          borderRadius: 4,
          fontSize: 11,
          color: '#595959',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>{enabledCount} of {catalog.length} skills enabled</span>
          <Tooltip title="Data extraction skills run on the server and produce structured data. Interpretation skills add analysis instructions to the AI prompt.">
            <InfoCircleOutlined style={{ cursor: 'pointer' }} />
          </Tooltip>
        </div>

        {filteredCatalog.length === 0 ? (
          <Empty description="No skills match your search" style={{ marginTop: 32 }} />
        ) : (
          <Collapse
            items={collapseItems}
            defaultActiveKey={['data_extraction', 'chart_interpretation', 'integrative']}
            size="small"
            style={{ background: 'transparent' }}
          />
        )}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleCreateSkill}
          block
          style={{ marginTop: 4 }}
        >
          New Custom Skill
        </Button>
      </Space>

      <SkillEditModal
        open={editModalMode === 'create' || editingSkill !== null}
        mode={editModalMode}
        skill={editingSkill}
        isModified={editingSkill ? isSkillModified(editingSkill.id) : false}
        onSave={handleSaveSkill}
        onReset={handleResetSkill}
        onCancel={() => { setEditingSkill(null); setEditModalMode('edit'); }}
      />
    </Drawer>
  );
}

// ── Individual skill row ──────────────────────────────────────

function SkillRow({
  skill,
  checked,
  onToggle,
  onEdit,
  onDelete,
  isModified,
  isCustom,
}: {
  skill: SkillDefinition;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onEdit: () => void;
  onDelete?: () => void;
  isModified: boolean;
  isCustom: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const tierMeta = TIER_LABELS[skill.tier];

  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: 6,
      background: checked ? '#f9f0ff' : '#fafafa',
      border: `1px solid ${checked ? '#d3adf7' : '#f0f0f0'}`,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Switch
          size="small"
          checked={checked}
          onChange={onToggle}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: 13 }}>{skill.name}</Text>
            <Tag
              color={tierMeta.color}
              style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}
            >
              {tierMeta.label}
            </Tag>
            {skill.isBackend && (
              <Tag
                style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}
              >
                Server
              </Tag>
            )}
            {isModified && (
              <Tag
                color="orange"
                style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}
              >
                Modified
              </Tag>
            )}
            {isCustom && (
              <Tag
                color="purple"
                style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}
              >
                Custom
              </Tag>
            )}
          </div>
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 99 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '16px',
              marginTop: 2,
              cursor: 'pointer',
            }}
            onClick={() => setExpanded(!expanded)}
          >
            {skill.description}
          </Text>
          {skill.chartTypes.length > 0 && (
            <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {skill.chartTypes.map(ct => (
                <Tag
                  key={ct}
                  style={{
                    fontSize: 10,
                    lineHeight: '14px',
                    padding: '0 4px',
                    margin: 0,
                    color: '#8c8c8c',
                    borderColor: '#e8e8e8',
                  }}
                >
                  {ct}
                </Tag>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginTop: 2 }}>
          <Tooltip title="Edit skill">
            <EditOutlined
              style={{ fontSize: 13, color: '#8c8c8c', cursor: 'pointer' }}
              onClick={onEdit}
            />
          </Tooltip>
          {onDelete && (
            <Popconfirm
              title="Delete this custom skill?"
              onConfirm={onDelete}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete skill">
                <DeleteOutlined
                  style={{ fontSize: 13, color: '#ff4d4f', cursor: 'pointer' }}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      </div>
    </div>
  );
}
