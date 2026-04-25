'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Users, Building2 } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { EmployeeTab } from '@/components/hr-requests/employee-tab';
import { DepartmentsTab } from '@/components/hr-requests/departments-tab';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'employees', label: 'الموظفين', icon: Users },
  { key: 'departments', label: 'الأقسام', icon: Building2 },
] as const;

type TabKey = typeof TABS[number]['key'];

function HREmployeesContent() {
  useSetPageTitle({ titleAr: 'الموظفين والأقسام', descriptionAr: 'دليل الموظفين والهيكل التنظيمي في مكان واحد', icon: Users });
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const section = searchParams.get('section');
  const employeeId = searchParams.get('employee');

  const [activeTab, setActiveTab] = React.useState<TabKey>(
    section === 'departments' ? 'departments' : 'employees'
  );

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    router.replace(pathname, { scroll: false });
  };

  const clearDeepLink = React.useCallback(() => {
    if (employeeId) router.replace(pathname, { scroll: false });
  }, [employeeId, router, pathname]);

  return (
    <div className="w-full min-w-0 space-y-6 animate-fade-in">
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map(tab => (
          <button key={tab.key} type="button" onClick={() => switchTab(tab.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === tab.key ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
            )}>
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'employees'
        ? <EmployeeTab openEmployeeId={employeeId} onClearDeepLink={clearDeepLink} />
        : <DepartmentsTab />
      }
    </div>
  );
}

export default function HREmployeesPage() {
  return (
    <React.Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">جاري التحميل…</div>}>
      <HREmployeesContent />
    </React.Suspense>
  );
}
