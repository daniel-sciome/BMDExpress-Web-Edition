import React, { useMemo } from 'react';
import { Modal, Typography } from 'antd';
import type { ReportDto, ReportSectionDto } from '../../types/reportTypes';

const { Title, Text } = Typography;

interface ReportDocumentViewProps {
  report: ReportDto;
  open: boolean;
  onClose: () => void;
}

/** Template-specific accent colours used for headings and rules. */
const TEMPLATE_THEME: Record<string, { accent: string; headerBg: string }> = {
  'EPA BMD Guidance': { accent: '#1a5276', headerBg: '#d4e6f1' },
  'ICH General Tox':  { accent: '#6c3483', headerBg: '#e8daef' },
  'OECD TG':          { accent: '#1e8449', headerBg: '#d5f5e3' },
};

const DEFAULT_THEME = { accent: '#333', headerBg: '#f0f0f0' };

/**
 * Build a tree of sections with numbering labels (e.g. "1", "1.1", "1.2").
 * Children are ordered by `order` and nested under their parent.
 */
interface NumberedSection {
  section: ReportSectionDto;
  label: string;
  children: NumberedSection[];
}

function buildTree(sections: ReportSectionDto[]): NumberedSection[] {
  const byParent = new Map<string | null, ReportSectionDto[]>();
  for (const s of sections) {
    const key = s.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(s);
  }

  function walk(parentId: string | null, prefix: string): NumberedSection[] {
    const children = (byParent.get(parentId) || []).sort((a, b) => a.order - b.order);
    return children.map((s, i) => {
      const label = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
      return { section: s, label, children: walk(s.id, label) };
    });
  }

  return walk(null, '');
}

/** Recursively render a numbered section and its children. */
function SectionBlock({
  node,
  depth,
  accent,
}: {
  node: NumberedSection;
  depth: number;
  accent: string;
}) {
  const { section, label, children } = node;
  const isTopLevel = depth === 0;

  return (
    <div style={{ marginBottom: isTopLevel ? 28 : 14 }}>
      {/* Section heading */}
      <div
        style={{
          borderBottom: isTopLevel ? `2px solid ${accent}` : `1px solid #d9d9d9`,
          paddingBottom: 4,
          marginBottom: 8,
        }}
      >
        <Title
          level={(Math.min(depth + 2, 5)) as 1 | 2 | 3 | 4 | 5}
          style={{ margin: 0, color: accent }}
        >
          {label}&ensp;{section.title}
        </Title>
      </div>

      {/* Content */}
      {section.content ? (
        <div
          className="report-doc-content"
          dangerouslySetInnerHTML={{ __html: section.content }}
          style={{ lineHeight: 1.7, fontSize: 14 }}
        />
      ) : (
        <Text type="secondary" italic>No content yet</Text>
      )}

      {/* Chart snapshots */}
      {section.chartSnapshots.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {section.chartSnapshots.map((snap) => (
            <figure key={snap.id} style={{ margin: 0, textAlign: 'center' }}>
              <img
                src={snap.dataUrl}
                alt={snap.title}
                style={{ maxWidth: 360, border: '1px solid #d9d9d9', borderRadius: 4 }}
              />
              <figcaption style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                {snap.title}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* Data attachment summaries */}
      {section.dataAttachments.length > 0 && (
        <div style={{ marginTop: 8, padding: 8, background: '#f9f9f9', borderRadius: 4, fontSize: 12 }}>
          <strong>Data:</strong>{' '}
          {section.dataAttachments.map(a => a.label).join(', ')}
        </div>
      )}

      {/* Recurse into children */}
      {children.map((child) => (
        <SectionBlock key={child.section.id} node={child} depth={depth + 1} accent={accent} />
      ))}
    </div>
  );
}

export default function ReportDocumentView({ report, open, onClose }: ReportDocumentViewProps) {
  const tree = useMemo(() => buildTree(report.sections), [report.sections]);
  const theme = TEMPLATE_THEME[report.templateName] || DEFAULT_THEME;

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      styles={{ body: { maxHeight: '80vh', overflowY: 'auto', padding: '32px 40px' } }}
    >
      {/* Title page */}
      <div
        style={{
          textAlign: 'center',
          padding: '32px 0 24px',
          marginBottom: 32,
          borderBottom: `3px double ${theme.accent}`,
        }}
      >
        <Title level={2} style={{ margin: 0, color: theme.accent }}>
          {report.title}
        </Title>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">{report.templateName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Project: {report.projectId}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Created: {new Date(report.createdAt).toLocaleDateString()}
            {' | '}
            Updated: {new Date(report.updatedAt).toLocaleDateString()}
          </Text>
        </div>
      </div>

      {/* Document body */}
      {tree.map((node) => (
        <SectionBlock key={node.section.id} node={node} depth={0} accent={theme.accent} />
      ))}
    </Modal>
  );
}
