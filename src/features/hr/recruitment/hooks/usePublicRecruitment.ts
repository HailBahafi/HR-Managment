'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicRecruitmentApi } from '@/features/hr/recruitment/lib/api/recruitment';
import { mapRecruitmentForm, mapRecruitmentJob } from '@/features/hr/recruitment/lib/api/mappers';
import { recruitmentKeys } from '@/features/hr/recruitment/hooks/recruitment-query-keys';

export function usePublicRecruitmentJob(slug: string) {
  return useQuery({
    queryKey: recruitmentKeys.publicJob(slug),
    queryFn: async () => {
      const data = await publicRecruitmentApi.getPublicJob(slug);
      return {
        job: mapRecruitmentJob(data.job),
        form: mapRecruitmentForm(data.form),
      };
    },
    enabled: !!slug,
    retry: false,
  });
}
