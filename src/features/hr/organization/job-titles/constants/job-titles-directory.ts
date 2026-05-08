export type JobTitleDraftForm = {
  titleAr: string;
  descriptionAr: string;
  defaultDepartmentId: string;
};

export const JOB_TITLE_EMPTY_FORM: JobTitleDraftForm = {
  titleAr: '',
  descriptionAr: '',
  defaultDepartmentId: '',
};
