'use client';

import * as React from 'react';
import { Building2, Users, ChevronDown, ChevronLeft, Network, ZoomIn, ZoomOut } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { data, getEmployee } from '@/lib/data';
import { getInitials, cn } from '@/lib/utils';

interface TreeNode {
  id: string;
  name: string;
  type: 'company' | 'branch' | 'department' | 'employee';
  meta?: string;
  avatar?: string;
  color?: string;
  children?: TreeNode[];
}

function buildTree(): TreeNode {
  return {
    id: 'company',
    name: data.company.name,
    type: 'company',
    meta: `${data.company.totalEmployees} موظف`,
    children: data.branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      type: 'branch' as const,
      meta: `${branch.employeesCount} موظف · ${branch.city}`,
      color: '#0f766e',
      children: data.departments
        .filter((d) => d.branchId === branch.id)
        .map((dept) => {
          const manager = getEmployee(dept.managerId);
          const deptEmployees = data.employees.filter((e) => e.departmentId === dept.id);
          return {
            id: dept.id,
            name: dept.name,
            type: 'department' as const,
            meta: `${dept.employeesCount} موظف`,
            color: dept.color,
            children: deptEmployees.map((emp) => ({
              id: emp.id,
              name: emp.name,
              type: 'employee' as const,
              meta: emp.position,
              avatar: emp.avatar,
              color: dept.color,
            })),
          };
        }),
    })),
  };
}

export default function OrganizationPage() {
  useSetPageTitle({ titleAr: 'خريطة المنظمة', descriptionAr: 'استكشف هيكل الشركة التفاعلي', iconName: 'Building2' });
  const tree = React.useMemo(buildTree, []);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['company', ...data.branches.map((b) => b.id)]));

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Tree visualization */}
      <div className="relative overflow-auto rounded-lg border border-border bg-card p-6 shadow-soft">
        <div className="absolute inset-0 dotted-bg opacity-30" />
        <div className="relative">
          <TreeNodeRender node={tree} expanded={expanded} onToggle={toggle} level={0} />
        </div>
      </div>
    </div>
  );
}

function TreeNodeRender({
  node,
  expanded,
  onToggle,
  level,
}: {
  node: TreeNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  level: number;
}) {
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  const containerStyle = {
    borderColor: node.color ? `${node.color}40` : undefined,
    background: level > 0 ? `${node.color}08` : undefined,
  };

  return (
    <div className="relative" style={{ marginRight: level > 0 ? '2rem' : 0 }}>
      <div
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onClick={() => hasChildren && onToggle(node.id)}
        onKeyDown={(e) => {
          if (!hasChildren) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(node.id);
          }
        }}
        className={cn(
          'group relative inline-flex min-w-[280px] items-center gap-3 rounded-lg border bg-card p-3 shadow-soft transition-all hover:shadow-elevated',
          level === 0 && 'border-gold/40 bg-gradient-to-l from-primary to-primary-700 text-primary-foreground shadow-elevated',
          hasChildren && 'cursor-pointer select-none',
        )}
        style={level > 0 ? containerStyle : undefined}
      >
        {node.type === 'employee' ? (
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={node.avatar} />
            <AvatarFallback>{getInitials(node.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
              level === 0 ? 'bg-gold/20 text-gold' : 'bg-primary/10 text-primary',
            )}
            style={level > 0 && node.color ? { background: `${node.color}20`, color: node.color } : undefined}
          >
            {node.type === 'company' ? <Building2 className="h-5 w-5" /> :
             node.type === 'branch' ? <Network className="h-5 w-5" /> :
             <Users className="h-5 w-5" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold', level === 0 && 'text-primary-foreground')}>
            {node.name}
          </p>
          <p className={cn('truncate text-xs', level === 0 ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {node.meta}
          </p>
        </div>
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
              level === 0
                ? 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                : 'hover:bg-muted',
            )}
            aria-label={isOpen ? 'طي' : 'توسيع'}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="relative mr-6 mt-3 space-y-3 border-r-2 border-dashed border-border pr-4">
          {node.children!.map((child) => (
            <TreeNodeRender
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent: string }) {
  const map: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    gold: 'text-gold bg-gold/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-md', map[accent])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold number-ar">{value}</p>
        </div>
      </div>
    </div>
  );
}
