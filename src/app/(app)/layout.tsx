import { SidebarProvider } from '@/components/sidebar-context';
import { PageTitleProvider } from '@/components/page-title-context';
import { FilterPanelProvider } from '@/components/filter-panel-context';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { FilterPanel } from '@/components/filter-panel';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PageTitleProvider>
        <FilterPanelProvider>
          <div className="min-h-screen bg-background">
            <Topbar />
            <Sidebar />
            <FilterPanel />
            <main className="min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </FilterPanelProvider>
      </PageTitleProvider>
    </SidebarProvider>
  );
}
