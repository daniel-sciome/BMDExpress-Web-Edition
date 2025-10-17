import { Outlet } from 'react-router';
import '@vaadin/icons';
import { AppLayout, Icon, ProgressBar, Scroller } from '@vaadin/react-components';
import { Suspense } from 'react';
import { Provider } from 'react-redux';
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
    <div className="mx-m">
      <h3 style={{
        padding: '8px 12px',
        margin: '8px 0',
        fontSize: '14px',
        fontWeight: 600,
        color: '#666',
        borderBottom: '1px solid #e0e0e0'
      }}>
        Available Projects
      </h3>
      <ProjectTreeSidebar />
    </div>
  );
}

export default function MainLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppLayout primarySection="drawer">
          <Header />
          <Scroller slot="drawer">
            <SidebarNav />
          </Scroller>
          <Suspense fallback={<ProgressBar indeterminate={true} className="m-0" />}>
            <Outlet />
          </Suspense>
        </AppLayout>
      </Provider>
    </ErrorBoundary>
  );
}
