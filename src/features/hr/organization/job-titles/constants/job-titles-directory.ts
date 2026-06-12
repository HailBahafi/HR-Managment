export type JobTitleDraftForm = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  notes: string;
  isActive: boolean;
};

export const JOB_TITLE_EMPTY_FORM: JobTitleDraftForm = {
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  notes: '',
  isActive: true,
};
