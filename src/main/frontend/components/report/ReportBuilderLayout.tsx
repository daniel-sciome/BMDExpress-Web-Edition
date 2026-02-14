import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loadReportList, selectActiveReport, selectReportLoading } from '../../store/slices/reportSlice';
import ReportListPanel from './ReportListPanel';
import SectionTree from './SectionTree';
import SectionEditor from './SectionEditor';
import { Spin } from 'antd';

export default function ReportBuilderLayout() {
  const dispatch = useAppDispatch();
  const activeReport = useAppSelector(selectActiveReport);
  const loading = useAppSelector(selectReportLoading);

  useEffect(() => {
    dispatch(loadReportList());
  }, [dispatch]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left sidebar: report list + section tree */}
      <div style={{
        width: 280,
        minWidth: 280,
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#fafafa',
      }}>
        <ReportListPanel />
        {activeReport && (
          <div style={{ flex: 1, overflow: 'auto', borderTop: '1px solid #f0f0f0' }}>
            <SectionTree />
          </div>
        )}
      </div>

      {/* Right pane: section editor */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin size="large" />
          </div>
        ) : activeReport ? (
          <SectionEditor />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#999',
            fontSize: 16,
          }}>
            Select or create a report to begin editing
          </div>
        )}
      </div>
    </div>
  );
}
