import { SidebarProvider } from '@/components/layouts/sidebar-context';
import { PageTitleProvider } from '@/components/layouts/page-title-context';
import { FilterPanelProvider } from '@/components/layouts/filter-panel-context';
import { EntityFilterSlotProvider } from '@/components/layouts/entity-filter-slot-context';
import { AppEntityFilterRegion } from '@/components/layouts/app-entity-filter-region';
import { Sidebar } from '@/components/layouts/sidebar';
import { Topbar } from '@/components/layouts/topbar';
import { FilterPanel } from '@/components/layouts/filter-panel';
import { Toaster } from 'sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PageTitleProvider>
        <FilterPanelProvider>
          <EntityFilterSlotProvider>
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
          </EntityFilterSlotProvider>
        </FilterPanelProvider>
      </PageTitleProvider>
    </SidebarProvider>
  );
}
