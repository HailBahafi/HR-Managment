'use client';

import { Pencil, Trash2, ChevronRight, Building2, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from '@/features/hr/requests/components/shared-ui';
import type { HRDepartmentEntity } from '@/features/hr/requests/lib/types';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardDecoration,
  DirectoryGridCardEyebrow,
  DirectoryGridCardFooter,
  DirectoryGridCardHeading,
  DirectoryGridCardIconWrap,
  DirectoryGridCardMetaChips,
} from '@/components/ui/directory-grid-card';
import type { DepartmentRecord } from '@/features/hr/organization/departments/constants/departments-directory';

type FlatNode = { dept: HRDepartmentEntity; depth: number };

type DepartmentsListGridProps = {
  departments: DepartmentRecord[];
  filtered: FlatNode[];
  onEdit: (dept: HRDepartmentEntity) => void;
  onDelete: (id: string) => void;
};

export function DepartmentsListGrid({ departments, filtered, onEdit, onDelete }: DepartmentsListGridProps) {
  return (
    <DirectoryGrid variant="wide">
      {filtered.map(({ dept, depth }) => {
        const parent = departments.find((d) => d.id === dept.parentId);
        const subDepts = departments.filter((d) => d.parentId === dept.id);
        return (
          <DirectoryGridCard key={dept.id} interactive hoverLift onClick={() => onEdit(dept)}>
            <DirectoryGridCardDecoration />
            <div className="relative mb-4 flex items-start justify-between">
              <DirectoryGridCardIconWrap active={dept.isActive}>
                <Building2 className="h-5 w-5" />
              </DirectoryGridCardIconWrap>
              <ActiveBadge active={dept.isActive} />
            </div>

            <div className="relative mb-4">
              {parent && (
                <DirectoryGridCardEyebrow>
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{parent.nameAr}</span>
                </DirectoryGridCardEyebrow>
              )}
              <DirectoryGridCardHeading>{dept.nameAr}</DirectoryGridCardHeading>
            </div>

            <DirectoryGridCardMetaChips>
              {subDepts.length > 0 && (
                <span className="flex items-center gap-1">
                  <Network className="h-3.5 w-3.5" />
                  {subDepts.length} فرعي
                </span>
              )}
              {depth > 0 && (
                <span className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5" />
                  مستوى {depth + 1}
                </span>
              )}
            </DirectoryGridCardMetaChips>

            <DirectoryGridCardFooter className="border-border/60 pt-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(dept);
                }}
                aria-label="تعديل"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(dept.id);
                }}
                aria-label="حذف"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </DirectoryGridCardFooter>
          </DirectoryGridCard>
        );
      })}
    </DirectoryGrid>
  );
}
