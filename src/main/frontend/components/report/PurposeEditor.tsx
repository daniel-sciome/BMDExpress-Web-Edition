import React, { useState } from 'react';
import { Collapse, Input, Typography } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectActiveSection,
  selectActiveReport,
  updateSection,
} from '../../store/slices/reportSlice';

const { TextArea } = Input;
const { Text } = Typography;

export default function PurposeEditor() {
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector(selectActiveSection);
  const activeReport = useAppSelector(selectActiveReport);
  const [localPurpose, setLocalPurpose] = useState<string | null>(null);

  if (!activeSection || !activeReport) return null;

  const displayPurpose = localPurpose !== null ? localPurpose : (activeSection.purpose || '');

  const handleBlur = () => {
    if (localPurpose !== null && localPurpose !== activeSection.purpose) {
      const updated = { ...activeSection, purpose: localPurpose };
      dispatch(updateSection({ reportId: activeReport.id, section: updated }));
    }
    setLocalPurpose(null);
  };

  return (
    <Collapse
      size="small"
      defaultActiveKey={activeSection.purpose ? ['purpose'] : []}
      items={[{
        key: 'purpose',
        label: (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Section Purpose
          </Text>
        ),
        children: (
          <TextArea
            value={displayPurpose}
            onChange={(e) => setLocalPurpose(e.target.value)}
            onBlur={handleBlur}
            placeholder="Describe the purpose and scope of this section..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ fontSize: 13 }}
          />
        ),
      }]}
      style={{ marginBottom: 0 }}
    />
  );
}
