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
          <div className="h-screen flex flex-col bg-background overflow-hidden">
            <Topbar />
            <Sidebar />
            <FilterPanel />
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4">{children}</main>
          </div>
        </FilterPanelProvider>
      </PageTitleProvider>
    </SidebarProvider>
  );
}
