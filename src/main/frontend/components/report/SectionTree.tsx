import React, { useMemo } from 'react';
import { Tree, Typography } from 'antd';
import type { TreeDataNode } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectActiveReport,
  selectActiveSectionId,
  setActiveSectionId,
  saveReport,
} from '../../store/slices/reportSlice';
import type { ReportSectionDto } from '../../types/reportTypes';

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  draft: '#faad14',
  reviewed: '#1890ff',
  final: '#52c41a',
};

export default function SectionTree() {
  const dispatch = useAppDispatch();
  const activeReport = useAppSelector(selectActiveReport);
  const activeSectionId = useAppSelector(selectActiveSectionId);

  const treeData = useMemo(() => {
    if (!activeReport) return [];
    return buildTreeData(activeReport.sections);
  }, [activeReport]);

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      dispatch(setActiveSectionId(selectedKeys[0] as string));
    }
  };

  const handleDrop = (info: any) => {
    if (!activeReport) return;

    const dropKey = info.node.key as string;
    const dragKey = info.dragNode.key as string;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const updatedSections = [...activeReport.sections];

    // Find the dragged section
    const dragSection = updatedSections.find(s => s.id === dragKey);
    if (!dragSection) return;

    // Determine new parent
    if (dropPosition === 0) {
      // Drop onto the node (make it a child)
      dragSection.parentId = dropKey;
    } else {
      // Drop between nodes (same parent as drop target)
      const dropSection = updatedSections.find(s => s.id === dropKey);
      if (dropSection) {
        dragSection.parentId = dropSection.parentId;
      }
    }

    // Reorder
    const siblings = updatedSections.filter(s => s.parentId === dragSection.parentId);
    siblings.sort((a, b) => a.order - b.order);
    siblings.forEach((s, i) => { s.order = i; });

    const updatedReport = { ...activeReport, sections: updatedSections };
    dispatch(saveReport(updatedReport));
  };

  return (
    <div style={{ padding: '8px 4px' }}>
      <div style={{ padding: '4px 12px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong style={{ fontSize: 13 }}>Sections</Text>
      </div>
      <Tree
        treeData={treeData}
        selectedKeys={activeSectionId ? [activeSectionId] : []}
        onSelect={handleSelect}
        draggable
        onDrop={handleDrop}
        blockNode
        defaultExpandAll
        style={{ fontSize: 12 }}
      />
    </div>
  );
}

function buildTreeData(sections: ReportSectionDto[]): TreeDataNode[] {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const rootSections = sorted.filter(s => !s.parentId);

  function buildNode(section: ReportSectionDto): TreeDataNode {
    const children = sorted
      .filter(s => s.parentId === section.id)
      .map(buildNode);

    const statusColor = STATUS_COLORS[section.status] || '#d9d9d9';
    const hasContent = section.content && section.content.trim().length > 0;

    return {
      key: section.id,
      title: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor,
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 12,
            color: hasContent ? '#262626' : '#999',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {section.title}
          </span>
        </span>
      ),
      children: children.length > 0 ? children : undefined,
    };
  }

  return rootSections.map(buildNode);
}
