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
      <ProjectTreeSidebar />
    </div>
  );
}

export default function MainLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
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
      </Provider>
    </ErrorBoundary>
  );
}
