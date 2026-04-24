import { SidebarProvider } from '@/components/sidebar-context';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-h-screen flex-col lg:pr-64">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
