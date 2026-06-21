import type { AtsApplicant, AtsForm, AtsJob } from '@/features/hr/recruitment/lib/ats/types';
import type {
  RecruitmentApplicant,
  RecruitmentForm,
  RecruitmentJob,
  RecruitmentJobDetail,
} from '@/features/hr/recruitment/lib/api/types';

export function mapRecruitmentJob(job: RecruitmentJob): AtsJob {
  return {
    id: job.id,
    tenantId: job.tenantId,
    title: job.title,
    slug: job.slug,
    description: job.description,
    department: job.department,
    location: job.location,
    type: job.type,
    isActive: job.isActive,
    formId: job.formId,
    createdAt: job.createdAt,
  };
}

export function mapRecruitmentForm(form: RecruitmentForm): AtsForm {
  return {
    id: form.id,
    tenantId: form.tenantId,
    jobId: form.jobId,
    title: form.title,
    description: form.description,
    fields: (form.fields ?? []).map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      required: f.required,
      options: f.options,
    })),
    createdAt: form.createdAt,
  };
}

export function mapRecruitmentApplicant(applicant: RecruitmentApplicant): AtsApplicant {
  return {
    id: applicant.id,
    tenantId: applicant.tenantId,
    jobId: applicant.jobId,
    formId: applicant.formId,
    answers: applicant.answers,
    cvFileName: applicant.cvFileName,
    cvFileData: applicant.cvFilePath,
    pipelineStage: applicant.pipelineStage,
    score: applicant.score
      ? {
          ruleScore: applicant.score.ruleScore,
          aiScore: applicant.score.aiScore,
          finalScore: applicant.score.finalScore,
          reasoning: applicant.score.reasoning,
        }
      : null,
    submittedAt: applicant.submittedAt,
  };
}

export function mapRecruitmentJobDetail(detail: RecruitmentJobDetail) {
  return {
    job: mapRecruitmentJob(detail),
    form: detail.form ? mapRecruitmentForm(detail.form) : null,
  };
}
