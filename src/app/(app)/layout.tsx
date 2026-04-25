import { SidebarProvider } from '@/components/sidebar-context';
import { PageTitleProvider } from '@/components/page-title-context';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PageTitleProvider>
        <div className="min-h-screen bg-background">
          <Topbar />
          <Sidebar />
          <main className="min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </PageTitleProvider>
    </SidebarProvider>
  );
}
