import { Outlet } from 'react-router';
import '@vaadin/icons';
import { AppLayout, Icon, ProgressBar, Scroller } from '@vaadin/react-components';
import { Suspense } from 'react';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from '../store/store';
import ErrorBoundary from '../components/ErrorBoundary';
import ProjectTreeSidebar from '../components/ProjectTreeSidebar';

function Header() {
  return (
    <div className="flex p-m gap-m items-center" slot="drawer">
      <Icon icon="vaadin:cubes" className="text-primary icon-l" />
      <span className="font-semibold text-l">BMDExpress Web</span>
    </div>
  );
}

function SidebarNav() {
  return (
    <div style={{ marginLeft: '16px', marginRight: '3px' }}>
      <ProjectTreeSidebar />
    </div>
  );
}

export default function MainLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ConfigProvider
          theme={{
            components: {
              Table: {
                rowSelectedBg: 'rgba(200, 180, 50, 0.15)',
                rowSelectedHoverBg: 'rgba(200, 180, 50, 0.15)',
                rowHoverBg: 'rgba(0, 0, 0, 0.06)',
              },
            },
          }}
        >
        <style>
          {`
            /* Wider sidebar drawer */
            vaadin-app-layout::part(drawer) {
              width: 300px;
            }

            /* Ensure scroller has proper overflow */
            vaadin-scroller {
              height: 100%;
              overflow-y: auto;
              overflow-x: hidden;
            }
          `}
        </style>
        <AppLayout primarySection="drawer">
          <Header />
          <Scroller slot="drawer" style={{ height: '100%' }}>
            <SidebarNav />
          </Scroller>
          <Suspense fallback={<ProgressBar indeterminate={true} className="m-0" />}>
            <Outlet />
          </Suspense>
        </AppLayout>
        </ConfigProvider>
      </Provider>
    </ErrorBoundary>
  );
}
