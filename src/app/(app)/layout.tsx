import { SidebarProvider } from '@/components/sidebar-context';
import { PageTitleProvider } from '@/components/page-title-context';
import { FilterPanelProvider } from '@/components/filter-panel-context';
import { EntityFilterSlotProvider } from '@/components/entity-filter-slot-context';
import { PageHeaderActionsProvider } from '@/components/layouts/page-header-actions-context';
import { AppEntityFilterRegion } from '@/components/app-entity-filter-region';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { FilterPanel } from '@/components/filter-panel';
import { Toaster } from 'sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PageTitleProvider>
        <FilterPanelProvider>
          <EntityFilterSlotProvider>
            <PageHeaderActionsProvider>
              <div className="h-screen flex flex-col bg-background overflow-hidden">
                <Topbar />
                <Sidebar />
                <FilterPanel />
                <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4">
                  <AppEntityFilterRegion />
                  {children}
                </main>
                <Toaster richColors position="top-center" dir="rtl" />
              </div>
            </PageHeaderActionsProvider>
          </EntityFilterSlotProvider>
        </FilterPanelProvider>
      </PageTitleProvider>
    </SidebarProvider>
  );
}
