'use client';

import { useSetPageTitle } from '@/components/page-title-context';
import { OrganizationTreeNode } from '@/features/hr/organization/components/organization-tree-node';
import { useOrganizationTreeModel } from '@/features/hr/organization/hooks/useOrganizationTreeModel';

export default function OrganizationPage() {
  useSetPageTitle({ titleAr: 'خريطة المنظمة', descriptionAr: 'استكشف هيكل الشركة التفاعلي', iconName: 'Building2' });
  const { tree, expanded, toggle } = useOrganizationTreeModel();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-auto rounded-lg border border-border bg-card p-6 shadow-soft">
        <div className="absolute inset-0 dotted-bg opacity-30" />
        <div className="relative">
          <OrganizationTreeNode node={tree} expanded={expanded} onToggle={toggle} level={0} />
        </div>
      </div>
    </div>
  );
}
