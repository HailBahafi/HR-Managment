'use client';

import type { HRDisciplineSection } from '@/lib/hr-discipline/types';
import { ShieldAlert } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { ViolationTypesClient } from './violation-types-client';
import { DisciplineApprovalClient } from './discipline-approval-client';
import { ViolationCasesClient } from './violation-cases-client';
import { ViolationApprovalsClient } from './violation-approvals-client';
import { NoticesClient } from './notices-client';
import { InvestigationsClient } from './investigations-client';
import { PenaltiesClient } from './penalties-client';
import { DeductionsClient } from './deductions-client';
import { AppealsClient } from './appeals-client';

interface Props {
  section: HRDisciplineSection;
  titleAr: string;
  titleEn: string;
}

export function HRDisciplineSectionRoot({ section, titleAr }: Props) {
  useSetPageTitle({ titleAr, descriptionAr: 'الانضباط الوظيفي وإدارة المخالفات', iconName: 'ShieldAlert' });
  return (
    <div className="space-y-6">
      {section === 'violation-types' && <ViolationTypesClient />}
      {section === 'approval-assignment' && <DisciplineApprovalClient />}
      {section === 'violation-cases' && <ViolationCasesClient />}
      {section === 'violation-approvals' && <ViolationApprovalsClient />}
      {section === 'notices' && <NoticesClient />}
      {section === 'investigations' && <InvestigationsClient />}
      {section === 'penalties' && <PenaltiesClient />}
      {section === 'deductions' && <DeductionsClient />}
      {section === 'appeals' && <AppealsClient />}
    </div>
  );
}
