import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MOCK_APP_SESSION } from '@/lib/app-session';
import type { HRViolationCaseRecord, HRApproverRole } from './types';
import { CASE_STATUS_LABELS } from './types';
import { summarizeViolationCase } from './discipline-audit-log';
import { appendDisciplineAuditLog } from './discipline-audit-log-store';

function uid() { return `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

function buildApproversQueue(needsApproval: boolean, templateStageCount: number): HRApproverRole[] {
  if (!needsApproval) return [];
  const roles: HRApproverRole[] = ['manager', 'hr', 'executive'];
  const count = Math.min(Math.max(templateStageCount || 3, 1), 3);
  return roles.slice(0, count);
}

const SEED: HRViolationCaseRecord[] = [
  /* ── e1: 3 من كل نوع — فقط: انصراف مبكر، غياب، سوء سلوك، زي، تأخر — دوران حتى لا يتكرر النوع متتاليًا ── */
  {
    id:'case-e1-r01', caseNumber:'VIO-2026-0301',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-01', description:'مغادرة المكتب قبل نهاية الدوام بـ 45 دقيقة دون استئذان', notes:'سجل البصمة', attachmentsNote:'',
    violationTypeId:'vt-5', typeCode:'EARLY', typeNameAr:'الانصراف المبكر',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'submitted', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-01T09:00:00Z', updatedAt:'2026-04-01T09:00:00Z',
  },
  {
    id:'case-e1-r02', caseNumber:'VIO-2026-0302',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-03', description:'غياب يوم كامل دون تقديم طلب في النظام', notes:'لم يُجب على الاتصال', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-03T08:00:00Z', updatedAt:'2026-04-03T08:00:00Z',
  },
  {
    id:'case-e1-r03', caseNumber:'VIO-2026-0303',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-05', description:'نبرة غير لائقة في رسالة داخلية لزميل', notes:'مرفق لقطة شاشة', attachmentsNote:'',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'draft', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-05T11:00:00Z', updatedAt:'2026-04-05T11:00:00Z',
  },
  {
    id:'case-e1-r04', caseNumber:'VIO-2026-0304',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-07', description:'حضور بزي غير مطابق لسياسة الشركة يوم اجتماع عملاء', notes:'تنبيه أول', attachmentsNote:'',
    violationTypeId:'vt-2', typeCode:'DRESS', typeNameAr:'مخالفة الزي الرسمي',
    typeHasDeduction:false, typeDeductionKind:'none', typeDeductionValue:0,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'approved', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-07T10:30:00Z', updatedAt:'2026-04-08T08:00:00Z',
  },
  {
    id:'case-1', caseNumber:'VIO-2026-0001',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-09', description:'تأخر 40 دقيقة عن بداية الدوام دون إشعار مسبق', notes:'سجل الحضور يؤكد', attachmentsNote:'',
    violationTypeId:'vt-1', typeCode:'LATE', typeNameAr:'التأخر عن العمل',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'approved', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:true, createdAt:'2026-04-09T08:15:00Z', updatedAt:'2026-04-09T09:00:00Z',
  },
  {
    id:'case-e1-r06', caseNumber:'VIO-2026-0306',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-11', description:'انصراف مبكر قبل نهاية الوردية بساعة ونصف', notes:'تكرار ثاني خلال الشهر', attachmentsNote:'',
    violationTypeId:'vt-5', typeCode:'EARLY', typeNameAr:'الانصراف المبكر',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'executed', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:true, createdAt:'2026-04-11T15:00:00Z', updatedAt:'2026-04-12T08:00:00Z',
  },
  {
    id:'case-e1-r07', caseNumber:'VIO-2026-0307',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-14', description:'غياب يومين متتاليين دون إذن أو عذر مقبول', notes:'المدير أبلغ الموارد البشرية', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'closed', requiredApprovers:['manager','hr'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager', action:'approved', note:'ثبوت الغياب', at:'2026-04-15T08:00:00Z' },
      { role:'hr', action:'approved', note:'إغلاق بعد الخصم', at:'2026-04-16T09:00:00Z' },
    ],
    postedToPayroll:true, createdAt:'2026-04-14T09:00:00Z', updatedAt:'2026-04-16T09:00:00Z',
  },
  {
    id:'case-e1-r08', caseNumber:'VIO-2026-0308',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-16', description:'جدال أمام فريق العمل أثناء الاجتماع الأسبوعي', notes:'شهود حاضرون', attachmentsNote:'',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'الواقعة موثقة', at:'2026-04-17T08:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-16T13:00:00Z', updatedAt:'2026-04-17T08:00:00Z',
  },
  {
    id:'case-e1-r09', caseNumber:'VIO-2026-0309',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-18', description:'عدم ارتداء السترة الرسمية في يوم زيارة جهة خارجية', notes:'', attachmentsNote:'',
    violationTypeId:'vt-2', typeCode:'DRESS', typeNameAr:'مخالفة الزي الرسمي',
    typeHasDeduction:false, typeDeductionKind:'none', typeDeductionValue:0,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'submitted', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-18T10:00:00Z', updatedAt:'2026-04-18T10:00:00Z',
  },
  {
    id:'case-e1-r10', caseNumber:'VIO-2026-0310',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-19', description:'تأخر متكرر عن اجتماعات الصباح (ثلاث مرات)', notes:'', attachmentsNote:'',
    violationTypeId:'vt-1', typeCode:'LATE', typeNameAr:'التأخر عن العمل',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'rejected', requiredApprovers:['manager'], currentApprovalIndex:0,
    approvalLog:[{ role:'manager', action:'rejected', note:'قُبل العذر بعد مراجعة الجدول', at:'2026-04-20T09:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-19T08:00:00Z', updatedAt:'2026-04-20T09:00:00Z',
  },
  {
    id:'case-e1-r11', caseNumber:'VIO-2026-0311',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-22', description:'مغادرة قبل انتهاء الدوام دون تسجيل خروج إلكتروني', notes:'سجل الأبواب', attachmentsNote:'',
    violationTypeId:'vt-5', typeCode:'EARLY', typeNameAr:'الانصراف المبكر',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'approved', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-22T14:20:00Z', updatedAt:'2026-04-23T08:00:00Z',
  },
  {
    id:'case-e1-r12', caseNumber:'VIO-2026-0312',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-24', description:'غياب نصف يوم دون إذن أو إجازة في النظام', notes:'', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'نصف يوم موثق', at:'2026-04-25T07:30:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-24T09:00:00Z', updatedAt:'2026-04-25T07:30:00Z',
  },
  {
    id:'case-e1-r13', caseNumber:'VIO-2026-0313',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-26', description:'رسالة مهينة لموظف عبر البريد الداخلي', notes:'نسخة مرفقة', attachmentsNote:'',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'executed', requiredApprovers:['manager','hr'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager', action:'approved', note:'', at:'2026-04-27T08:00:00Z' },
      { role:'hr', action:'approved', note:'تنفيذ الإجراء', at:'2026-04-28T09:00:00Z' },
    ],
    postedToPayroll:true, createdAt:'2026-04-26T11:00:00Z', updatedAt:'2026-04-28T09:00:00Z',
  },
  {
    id:'case-e1-r14', caseNumber:'VIO-2026-0314',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-27', description:'حذاء غير رسمي في يوم اجتماعات الإدارة', notes:'', attachmentsNote:'',
    violationTypeId:'vt-2', typeCode:'DRESS', typeNameAr:'مخالفة الزي الرسمي',
    typeHasDeduction:false, typeDeductionKind:'none', typeDeductionValue:0,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'closed', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-27T09:00:00Z', updatedAt:'2026-04-28T10:00:00Z',
  },
  {
    id:'case-e1-r15', caseNumber:'VIO-2026-0315',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-29', description:'تأخر ساعة عن موعد اجتماع مع مورد خارجي', notes:'ازدحام مروري — قيد التحقق', attachmentsNote:'',
    violationTypeId:'vt-1', typeCode:'LATE', typeNameAr:'التأخر عن العمل',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-29T08:45:00Z', updatedAt:'2026-04-29T08:45:00Z',
  },
  {
    id:'case-3', caseNumber:'VIO-2026-0010',
    employeeId:'e3', employeeNameAr:'فهد العنزي', employeeNameEn:'Fahd Al-Anzi',
    date:'2026-02-28', description:'سوء سلوك مع زميل في العمل — شتائم والتهجم لفظيًا', notes:'شهادة شهود متوفرة وتقرير الحادثة موثق', attachmentsNote:'تقرير الشهود',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'draft', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-03-01T10:00:00Z', updatedAt:'2026-03-01T10:00:00Z',
  },

  /* ── قيد الاعتماد — دور المدير (index 0) ── */
  {
    id:'case-4', caseNumber:'VIO-2026-0004',
    employeeId:'e2', employeeNameAr:'ريم الشهراني', employeeNameEn:'Reem Al-Shahrani',
    date:'2026-03-05', description:'غياب يوم كامل بدون إذن مسبق ولم يُقدّم أي عذر', notes:'تم التواصل هاتفيًا ولم يُبلَغ عن سبب', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-03-05T08:00:00Z', updatedAt:'2026-03-05T09:00:00Z',
  },
  {
    id:'case-5', caseNumber:'VIO-2026-0005',
    employeeId:'e4', employeeNameAr:'لينا الحربي', employeeNameEn:'Lina Al-Harbi',
    date:'2026-03-10', description:'استخدام الهاتف الشخصي خلال ساعات العمل مع إفشاء معلومات سرية للعميل', notes:'رصدها مدير قسم تقنية المعلومات أثناء اجتماع عمل', attachmentsNote:'لقطة شاشة مرفقة',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-03-10T11:00:00Z', updatedAt:'2026-03-10T11:30:00Z',
  },
  {
    id:'case-6', caseNumber:'VIO-2026-0006',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري', employeeNameEn:'Sultan Al-Dosari',
    date:'2026-03-15', description:'تقديم تقرير عمل يحتوي على بيانات غير دقيقة ومضللة للإدارة', notes:'أثبت التدقيق وجود أخطاء جوهرية في التقرير', attachmentsNote:'نسخة التقرير المعدل',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:2,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-03-15T09:00:00Z', updatedAt:'2026-03-15T10:00:00Z',
  },

  /* ── قيد الاعتماد — دور موارد بشرية (index 1) ── */
  {
    id:'case-2', caseNumber:'VIO-2026-0002',
    employeeId:'e6', employeeNameAr:'هدى العمري', employeeNameEn:'Huda Al-Omari',
    date:'2026-02-03', description:'غياب يوم كامل بدون إذن مسبق وعدم الرد على محاولات التواصل', notes:'تم التواصل مع الموظفة ولم يُبلَغ', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'تمت المراجعة والحالة واضحة', at:'2026-02-04T08:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-02-03T14:00:00Z', updatedAt:'2026-02-04T08:00:00Z',
  },
  {
    id:'case-7', caseNumber:'VIO-2026-0007',
    employeeId:'e7', employeeNameAr:'يوسف الزهراني', employeeNameEn:'Yousuf Al-Zahrani',
    date:'2026-03-18', description:'مغادرة موقع العمل قبل وقت الانصراف الرسمي مرتين خلال أسبوعين', notes:'رصدها جهاز بصمة الدخول والخروج', attachmentsNote:'سجل بصمة مرفق',
    violationTypeId:'vt-5', typeCode:'EARLY', typeNameAr:'الانصراف المبكر',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:2,
    typeNeedsWarning:false, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'تم التحقق من سجل الدوام وحضور المخالفة', at:'2026-03-19T09:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-03-18T16:00:00Z', updatedAt:'2026-03-19T09:00:00Z',
  },
  {
    id:'case-8', caseNumber:'VIO-2026-0008',
    employeeId:'e8', employeeNameAr:'مها السبيعي', employeeNameEn:'Maha Al-Subaie',
    date:'2026-03-20', description:'تكرار التأخر لأكثر من 30 دقيقة خلال شهر مارس — ست مرات', notes:'أبلغ عن سبب في مرتين فقط', attachmentsNote:'',
    violationTypeId:'vt-1', typeCode:'LATE', typeNameAr:'التأخر عن العمل',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'المخالفة موثقة', at:'2026-03-21T08:30:00Z' }],
    postedToPayroll:false, createdAt:'2026-03-20T12:00:00Z', updatedAt:'2026-03-21T08:30:00Z',
  },

  /* ── قيد الاعتماد — دور تنفيذي (index 2) ── */
  {
    id:'case-9', caseNumber:'VIO-2026-0009',
    employeeId:'e3', employeeNameAr:'فهد العنزي', employeeNameEn:'Fahd Al-Anzi',
    date:'2026-03-22', description:'رفض تنفيذ تعليمات مباشرة من المدير وإبداء التجاهل بشكل صريح', notes:'محضر رسمي موثق وشهود على الحادثة', attachmentsNote:'المحضر الرسمي',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:3,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager',  action:'approved', note:'تم التحقق من الشهادات', at:'2026-03-23T08:00:00Z' },
      { role:'hr',       action:'approved', note:'السجلات متطابقة والمخالفة ثابتة', at:'2026-03-24T10:00:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-03-22T14:00:00Z', updatedAt:'2026-03-24T10:00:00Z',
  },
  {
    id:'case-10', caseNumber:'VIO-2026-0010',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري', employeeNameEn:'Sultan Al-Dosari',
    date:'2026-03-25', description:'استخدام وسائل الشركة لأغراض شخصية خلال أوقات العمل', notes:'اكتُشف بواسطة فريق تقنية المعلومات أثناء مراجعة سجلات الشبكة', attachmentsNote:'سجلات الشبكة',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:2,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager',  action:'approved', note:'المخالفة موثقة بسجلات الشبكة', at:'2026-03-26T09:00:00Z' },
      { role:'hr',       action:'approved', note:'تمت مراجعة ملف الموظف ولا يوجد ما يخفف', at:'2026-03-27T11:00:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-03-25T15:00:00Z', updatedAt:'2026-03-27T11:00:00Z',
  },
  {
    id:'case-11', caseNumber:'VIO-2026-0011',
    employeeId:'e9', employeeNameAr:'ماجد البقمي', employeeNameEn:'Majed Al-Baqami',
    date:'2026-04-01', description:'التغيب عن اجتماع المجلس التنفيذي بدون عذر مقبول', notes:'', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:false, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager',  action:'approved', note:'الغياب متعمد حسب سجل الحضور', at:'2026-04-02T08:00:00Z' },
      { role:'hr',       action:'approved', note:'لا يوجد خطاب إذن في ملف الموظف', at:'2026-04-03T09:30:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-04-01T10:00:00Z', updatedAt:'2026-04-03T09:30:00Z',
  },

  /* ── دور المدير — 8 حالات إضافية (index 0) ── */
  {
    id:'case-12', caseNumber:'VIO-2026-0012',
    employeeId:'e2', employeeNameAr:'ريم الشهراني', employeeNameEn:'Reem Al-Shahrani',
    date:'2026-04-03', description:'تأخر متكرر عن موعد الدوام أربع مرات خلال أسبوعين', notes:'سجل الدوام يثبت التأخر', attachmentsNote:'سجل الحضور',
    violationTypeId:'vt-1', typeCode:'LATE', typeNameAr:'التأخر عن العمل',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-03T08:00:00Z', updatedAt:'2026-04-03T09:00:00Z',
  },
  {
    id:'case-13', caseNumber:'VIO-2026-0013',
    employeeId:'e4', employeeNameAr:'لينا الحربي', employeeNameEn:'Lina Al-Harbi',
    date:'2026-04-04', description:'غياب يومين متتاليين بدون إذن مسبق أو إشعار', notes:'لم يُبلَغ بأي عذر', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:2,
    typeNeedsWarning:false, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-04T08:00:00Z', updatedAt:'2026-04-04T09:00:00Z',
  },
  {
    id:'case-14', caseNumber:'VIO-2026-0014',
    employeeId:'e7', employeeNameAr:'يوسف الزهراني', employeeNameEn:'Yousuf Al-Zahrani',
    date:'2026-04-05', description:'استخدام شبكة الإنترنت لأغراض شخصية وغير رسمية خلال ساعات الدوام', notes:'رصدها مسؤول الشبكة في سجل الاتصالات', attachmentsNote:'سجل الإنترنت',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-05T10:00:00Z', updatedAt:'2026-04-05T10:00:00Z',
  },
  {
    id:'case-15', caseNumber:'VIO-2026-0015',
    employeeId:'e3', employeeNameAr:'فهد العنزي', employeeNameEn:'Fahd Al-Anzi',
    date:'2026-04-06', description:'مغادرة موقع العمل ثلاث مرات قبل الوقت الرسمي خلال أسبوع واحد', notes:'جهاز البصمة يسجل الخروج المبكر بوضوح', attachmentsNote:'تقرير البصمة',
    violationTypeId:'vt-5', typeCode:'EARLY', typeNameAr:'الانصراف المبكر',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:3,
    typeNeedsWarning:false, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-06T08:30:00Z', updatedAt:'2026-04-06T09:00:00Z',
  },
  {
    id:'case-16', caseNumber:'VIO-2026-0016',
    employeeId:'e8', employeeNameAr:'مها السبيعي', employeeNameEn:'Maha Al-Subaie',
    date:'2026-04-07', description:'عدم الامتثال لتعليمات السلامة المهنية في موقع الميدان', notes:'تم تحذيرها شفهيًا من قبل', attachmentsNote:'تقرير السلامة',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-07T07:00:00Z', updatedAt:'2026-04-07T08:00:00Z',
  },
  {
    id:'case-17', caseNumber:'VIO-2026-0017',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري', employeeNameEn:'Sultan Al-Dosari',
    date:'2026-04-08', description:'إهمال تسليم تقارير الأداء الأسبوعية لثلاثة أسابيع متتالية', notes:'تم التذكير مرتين عبر البريد الإلكتروني', attachmentsNote:'',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-08T09:00:00Z', updatedAt:'2026-04-08T09:30:00Z',
  },
  {
    id:'case-18', caseNumber:'VIO-2026-0018',
    employeeId:'e6', employeeNameAr:'هدى العمري', employeeNameEn:'Huda Al-Omari',
    date:'2026-04-09', description:'نزاع لفظي مع موظف آخر في اجتماع رسمي أمام العملاء', notes:'أبلغ مدير المشاريع عن الحادثة فورًا', attachmentsNote:'محضر الاجتماع',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-09T11:00:00Z', updatedAt:'2026-04-09T11:30:00Z',
  },
  {
    id:'case-19', caseNumber:'VIO-2026-0019',
    employeeId:'e2', employeeNameAr:'ريم الشهراني', employeeNameEn:'Reem Al-Shahrani',
    date:'2026-04-10', description:'تجاوز صلاحيات المنصب الوظيفي بإبرام اتفاقية مع مورّد بدون موافقة الإدارة', notes:'المورّد أكد وجود التواصل المباشر', attachmentsNote:'مراسلات البريد الإلكتروني',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:2,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-10T09:00:00Z', updatedAt:'2026-04-10T09:30:00Z',
  },

  /* ── دور موارد بشرية — 7 حالات إضافية (index 1) ── */
  {
    id:'case-20', caseNumber:'VIO-2026-0020',
    employeeId:'e2', employeeNameAr:'ريم الشهراني', employeeNameEn:'Reem Al-Shahrani',
    date:'2026-04-02', description:'تكرار التأخر عن الدوام خمس مرات خلال شهر مارس', notes:'سبق أن تلقت إنذارًا شفهيًا', attachmentsNote:'',
    violationTypeId:'vt-1', typeCode:'LATE', typeNameAr:'التأخر عن العمل',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:2,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'سجل الدوام يؤكد المخالفة', at:'2026-04-03T08:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-02T08:00:00Z', updatedAt:'2026-04-03T08:00:00Z',
  },
  {
    id:'case-21', caseNumber:'VIO-2026-0021',
    employeeId:'e3', employeeNameAr:'فهد العنزي', employeeNameEn:'Fahd Al-Anzi',
    date:'2026-04-03', description:'تجاوز صلاحيات النظام والاطلاع على ملفات سرية لموظفين آخرين', notes:'سجلات الدخول تثبت ذلك', attachmentsNote:'سجل الدخول للنظام',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:2,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'التجاوز موثق في سجلات النظام', at:'2026-04-04T09:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-03T10:00:00Z', updatedAt:'2026-04-04T09:00:00Z',
  },
  {
    id:'case-22', caseNumber:'VIO-2026-0022',
    employeeId:'e4', employeeNameAr:'لينا الحربي', employeeNameEn:'Lina Al-Harbi',
    date:'2026-04-04', description:'إهمال تنفيذ مهام موكلة مما أخّر مشروعًا للعميل', notes:'العميل أبدى شكوى رسمية', attachmentsNote:'شكوى العميل',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'تأخر التسليم مؤثر على العميل', at:'2026-04-05T08:30:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-04T09:00:00Z', updatedAt:'2026-04-05T08:30:00Z',
  },
  {
    id:'case-23', caseNumber:'VIO-2026-0023',
    employeeId:'e7', employeeNameAr:'يوسف الزهراني', employeeNameEn:'Yousuf Al-Zahrani',
    date:'2026-04-05', description:'تهاون في توثيق معاملات مالية يومية مما أوجد فجوة في السجلات', notes:'المراجع المالي رصد الخلل', attachmentsNote:'تقرير المراجعة',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'الخلل المالي موثق في تقرير المراجعة', at:'2026-04-06T08:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-05T11:00:00Z', updatedAt:'2026-04-06T08:00:00Z',
  },
  {
    id:'case-24', caseNumber:'VIO-2026-0024',
    employeeId:'e8', employeeNameAr:'مها السبيعي', employeeNameEn:'Maha Al-Subaie',
    date:'2026-04-06', description:'مشاركة بيانات عملاء عبر قنوات غير آمنة في المراسلات', notes:'قسم الأمن السيبراني رصد المخالفة', attachmentsNote:'تقرير الأمن السيبراني',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:2,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'الحادثة تستوجب مراجعة HR', at:'2026-04-07T09:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-06T13:00:00Z', updatedAt:'2026-04-07T09:00:00Z',
  },
  {
    id:'case-25', caseNumber:'VIO-2026-0025',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري', employeeNameEn:'Sultan Al-Dosari',
    date:'2026-04-07', description:'إساءة استخدام صلاحيات النظام لحذف سجلات غير مرتبطة بعمله', notes:'سجل النظام يثبت العمليات الممسوحة', attachmentsNote:'سجل عمليات النظام',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:3,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'الفعل متعمد وخطير', at:'2026-04-08T08:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-07T10:00:00Z', updatedAt:'2026-04-08T08:00:00Z',
  },
  {
    id:'case-26', caseNumber:'VIO-2026-0026',
    employeeId:'e6', employeeNameAr:'هدى العمري', employeeNameEn:'Huda Al-Omari',
    date:'2026-04-08', description:'تكرار الغياب بدون إذن ثلاث مرات في شهر واحد', notes:'الموظفة لم تقدم أي مبررات', attachmentsNote:'',
    violationTypeId:'vt-4', typeCode:'ABS_NX', typeNameAr:'الغياب بدون إذن',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:3,
    typeNeedsWarning:false, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'الغياب المتكرر يستوجب إجراء رسمي', at:'2026-04-09T08:30:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-08T08:00:00Z', updatedAt:'2026-04-09T08:30:00Z',
  },

  /* ── دور تنفيذي — 5 حالات إضافية (index 2) ── */
  {
    id:'case-27', caseNumber:'VIO-2026-0027',
    employeeId:'e3', employeeNameAr:'فهد العنزي', employeeNameEn:'Fahd Al-Anzi',
    date:'2026-04-05', description:'التلاعب في مصروفات المشاريع لصرف مبالغ إضافية غير مستحقة', notes:'تحقق المراجع الداخلي من السحوبات المشبوهة', attachmentsNote:'تقرير المراجع الداخلي',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:5,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager', action:'approved', note:'الأدلة المالية قاطعة', at:'2026-04-06T08:00:00Z' },
      { role:'hr',      action:'approved', note:'تم مراجعة ملف الموظف كاملًا', at:'2026-04-07T10:00:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-04-05T14:00:00Z', updatedAt:'2026-04-07T10:00:00Z',
  },
  {
    id:'case-28', caseNumber:'VIO-2026-0028',
    employeeId:'e3', employeeNameAr:'فهد العنزي', employeeNameEn:'Fahd Al-Anzi',
    date:'2026-04-06', description:'تزوير توقيع إلكتروني في وثيقة رسمية مقدمة لجهة حكومية', notes:'الجهة الحكومية أشارت إلى التزوير رسميًا', attachmentsNote:'المراسلة الرسمية',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:5,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager', action:'approved', note:'المخالفة تستوجب توصية بالإنهاء', at:'2026-04-07T08:00:00Z' },
      { role:'hr',      action:'approved', note:'لا توجد سوابق تخفيفية في الملف', at:'2026-04-08T09:00:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-04-06T10:00:00Z', updatedAt:'2026-04-08T09:00:00Z',
  },
  {
    id:'case-29', caseNumber:'VIO-2026-0029',
    employeeId:'e4', employeeNameAr:'لينا الحربي', employeeNameEn:'Lina Al-Harbi',
    date:'2026-04-07', description:'تهديد زميل في العمل بالأذى خلال نقاش حاد داخل الشركة', notes:'موثق بشهادة ثلاثة موظفين', attachmentsNote:'شهادات الشهود',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:5,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager', action:'approved', note:'الشهادات متسقة ومصداقيتها عالية', at:'2026-04-08T08:30:00Z' },
      { role:'hr',      action:'approved', note:'يستوجب الإجراء التأديبي الرسمي', at:'2026-04-09T10:00:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-04-07T15:00:00Z', updatedAt:'2026-04-09T10:00:00Z',
  },
  {
    id:'case-30', caseNumber:'VIO-2026-0030',
    employeeId:'e7', employeeNameAr:'يوسف الزهراني', employeeNameEn:'Yousuf Al-Zahrani',
    date:'2026-04-08', description:'تسريب خطة منتج سري للمنافس قبل إطلاقه الرسمي بأسبوعين', notes:'قسم الاستراتيجية رصد التسريب عبر تقرير المنافسين', attachmentsNote:'تقرير المنافسة',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:5,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager', action:'approved', note:'الضرر التجاري جسيم', at:'2026-04-09T08:00:00Z' },
      { role:'hr',      action:'approved', note:'مراجعة ملف الموظف تدعم الإجراء', at:'2026-04-10T09:30:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-04-08T09:00:00Z', updatedAt:'2026-04-10T09:30:00Z',
  },
  {
    id:'case-31', caseNumber:'VIO-2026-0031',
    employeeId:'e2', employeeNameAr:'ريم الشهراني', employeeNameEn:'Reem Al-Shahrani',
    date:'2026-04-09', description:'نشر تغريدات علنية تسيء لسمعة الشركة ومنتجاتها من حسابها الشخصي', notes:'تم التحقق من الحسابات والتوقيت', attachmentsNote:'لقطات شاشة للتغريدات',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'day', typeDeductionValue:3,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager', action:'approved', note:'التغريدات واضحة وتمس السمعة مباشرة', at:'2026-04-10T08:00:00Z' },
      { role:'hr',      action:'approved', note:'تعارض صريح مع سياسة التواصل الاجتماعي', at:'2026-04-11T09:00:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-04-09T12:00:00Z', updatedAt:'2026-04-11T09:00:00Z',
  },
];

/** localStorage JSON turns holes into `null`; bad merges can leave nullish entries. */
function sanitizeViolationCases(raw: unknown): HRViolationCaseRecord[] {
  if (!Array.isArray(raw)) return [...SEED];
  const out = raw.filter(
    (c): c is HRViolationCaseRecord =>
      c != null &&
      typeof (c as HRViolationCaseRecord).id === 'string' &&
      typeof (c as HRViolationCaseRecord).caseNumber === 'string',
  );
  return out.length > 0 ? out : [...SEED];
}

interface CasesState {
  cases: HRViolationCaseRecord[];
  _seq: number;
  add: (draft: Omit<HRViolationCaseRecord,'id'|'caseNumber'|'status'|'requiredApprovers'|'currentApprovalIndex'|'approvalLog'|'postedToPayroll'|'createdAt'|'updatedAt'>) => { ok:boolean; id?:string; error?:string };
  submit: (id: string) => { ok:boolean; error?:string };
  approve: (id: string, role: HRApproverRole, note?: string) => { ok:boolean; error?:string };
  reject: (id: string, role: HRApproverRole, note?: string) => { ok:boolean; error?:string };
  requestEdit: (id: string, role: HRApproverRole, note: string) => { ok:boolean; error?:string };
  update: (id: string, patch: Partial<HRViolationCaseRecord>) => void;
  remove: (id: string) => void;
  markPayrollPosted: (id: string) => void;
}

export const useHRViolationCasesStore = create<CasesState>()(
  persist(
    (set, get) => ({
      cases: SEED,
      _seq: 31,

      add: (draft) => {
        const state = get();
        const newSeq = state._seq + 1;
        const year = new Date().getFullYear();
        const caseNumber = `VIO-${year}-${String(newSeq).padStart(4,'0')}`;
        const approvers = buildApproversQueue(draft.typeNeedsApproval, draft.approvalTemplateId ? 2 : 3);
        const rec: HRViolationCaseRecord = {
          ...draft, id:uid(), caseNumber, status:'draft',
          requiredApprovers: approvers, currentApprovalIndex:0,
          approvalLog:[], postedToPayroll:false,
          createdAt:now(), updatedAt:now(),
        };
        set(s => ({ cases:[...s.cases, rec], _seq: newSeq }));
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'violation_case',
          actionType: 'create',
          recordId: rec.id,
          recordRefAr: rec.caseNumber,
          recordStatusAfterAr: CASE_STATUS_LABELS[rec.status],
          previousSnapshotAr: '—',
          currentSnapshotAr: summarizeViolationCase(rec),
        });
        return { ok:true, id: rec.id };
      },

      submit: (id) => {
        const prev = get().cases.find(x => x.id === id);
        if (!prev) return { ok:false, error:'المخالفة غير موجودة' };
        if (!prev.typeNeedsApproval) {
          set(s => ({ cases: s.cases.map(x => x.id === id ? { ...x, status:'approved', updatedAt:now() } : x) }));
          const updated = get().cases.find(x => x.id === id)!;
          appendDisciplineAuditLog({
            actorNameAr: MOCK_APP_SESSION.employeeNameAr,
            category: 'violation_case',
            actionType: 'submit',
            recordId: id,
            recordRefAr: prev.caseNumber,
            recordStatusAfterAr: CASE_STATUS_LABELS[updated.status],
            previousSnapshotAr: summarizeViolationCase(prev),
            currentSnapshotAr: summarizeViolationCase(updated),
          });
          if (updated.typeHasDeduction) {
            const month = new Date().toISOString().slice(0,7);
            import('./payroll-deductions-store').then(m => m.useHRDisciplinePayrollDeductionsStore.getState().syncFromCase(updated, month));
          }
        } else {
          set(s => ({ cases: s.cases.map(x => x.id === id ? { ...x, status:'under_review', updatedAt:now() } : x) }));
          const updated = get().cases.find(x => x.id === id)!;
          appendDisciplineAuditLog({
            actorNameAr: MOCK_APP_SESSION.employeeNameAr,
            category: 'violation_case',
            actionType: 'submit',
            recordId: id,
            recordRefAr: prev.caseNumber,
            recordStatusAfterAr: CASE_STATUS_LABELS[updated.status],
            previousSnapshotAr: summarizeViolationCase(prev),
            currentSnapshotAr: summarizeViolationCase(updated),
          });
        }
        return { ok:true };
      },

      approve: (id, role, note) => {
        const prev = get().cases.find(x => x.id === id);
        if (!prev) return { ok:false, error:'المخالفة غير موجودة' };
        const logEntry = { role, action: 'approved' as const, note, at: now() };
        const newIndex = prev.currentApprovalIndex + 1;
        const isLast = newIndex >= prev.requiredApprovers.length;
        const newStatus = isLast ? 'approved' : 'under_review';
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: newStatus as HRViolationCaseRecord['status'],
            currentApprovalIndex: newIndex,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        const updated = get().cases.find(x => x.id === id)!;
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'violation_case',
          actionType: 'approve',
          recordId: id,
          recordRefAr: prev.caseNumber,
          recordStatusAfterAr: CASE_STATUS_LABELS[updated.status],
          previousSnapshotAr: summarizeViolationCase(prev),
          currentSnapshotAr: summarizeViolationCase(updated),
        });
        if (isLast) {
          if (updated.typeHasDeduction) {
            const month = new Date().toISOString().slice(0,7);
            import('./payroll-deductions-store').then(m => m.useHRDisciplinePayrollDeductionsStore.getState().syncFromCase(updated, month));
          }
        }
        return { ok:true };
      },

      reject: (id, role, note) => {
        const prev = get().cases.find(x => x.id === id);
        if (!prev) return { ok:false, error:'المخالفة غير موجودة' };
        const logEntry = { role, action: 'rejected' as const, note, at: now() };
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: 'rejected' as const,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        const updated = get().cases.find(x => x.id === id)!;
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'violation_case',
          actionType: 'reject',
          recordId: id,
          recordRefAr: prev.caseNumber,
          recordStatusAfterAr: CASE_STATUS_LABELS[updated.status],
          previousSnapshotAr: summarizeViolationCase(prev),
          currentSnapshotAr: summarizeViolationCase(updated),
        });
        return { ok:true };
      },

      requestEdit: (id, role, note) => {
        const prev = get().cases.find(x => x.id === id);
        if (!prev) return { ok:false, error:'المخالفة غير موجودة' };
        const logEntry = { role, action: 'edit_requested' as const, note, at: now() };
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: 'draft' as const,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        const updated = get().cases.find(x => x.id === id)!;
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'violation_case',
          actionType: 'request_edit',
          recordId: id,
          recordRefAr: prev.caseNumber,
          recordStatusAfterAr: CASE_STATUS_LABELS[updated.status],
          previousSnapshotAr: summarizeViolationCase(prev),
          currentSnapshotAr: summarizeViolationCase(updated),
        });
        return { ok:true };
      },

      update: (id, patch) => {
        const prev = get().cases.find(x => x.id === id);
        if (!prev) return;
        const merged: HRViolationCaseRecord = { ...prev, ...patch, updatedAt: now() };
        set(s => ({ cases: s.cases.map(x => x.id === id ? merged : x) }));
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'violation_case',
          actionType: 'update',
          recordId: id,
          recordRefAr: merged.caseNumber,
          recordStatusAfterAr: CASE_STATUS_LABELS[merged.status],
          previousSnapshotAr: summarizeViolationCase(prev),
          currentSnapshotAr: summarizeViolationCase(merged),
        });
      },

      remove: (id) => {
        const prev = get().cases.find(x => x.id === id);
        set(s => ({ cases: s.cases.filter(x => x.id !== id) }));
        if (prev) {
          appendDisciplineAuditLog({
            actorNameAr: MOCK_APP_SESSION.employeeNameAr,
            category: 'violation_case',
            actionType: 'delete',
            recordId: id,
            recordRefAr: prev.caseNumber,
            recordStatusAfterAr: 'محذوف',
            previousSnapshotAr: summarizeViolationCase(prev),
            currentSnapshotAr: '—',
          });
        }
      },

      markPayrollPosted: (id) => {
        const prev = get().cases.find(x => x.id === id);
        if (!prev) return;
        set(s => ({
          cases: s.cases.map(x => x.id === id ? { ...x, postedToPayroll:true, updatedAt:now() } : x),
        }));
        const updated = get().cases.find(x => x.id === id)!;
        appendDisciplineAuditLog({
          actorNameAr: MOCK_APP_SESSION.employeeNameAr,
          category: 'violation_case',
          actionType: 'payroll_posted',
          recordId: id,
          recordRefAr: prev.caseNumber,
          recordStatusAfterAr: `${CASE_STATUS_LABELS[updated.status]} · مُدرَج في الرواتب`,
          previousSnapshotAr: summarizeViolationCase(prev),
          currentSnapshotAr: summarizeViolationCase(updated),
        });
      },
    }),
    {
      name: 'hr_discipline_cases_v1',
      storage: createJSONStorage(() => localStorage),
      version: 7,
      migrate: (persisted, fromVersion) => {
        if (fromVersion < 6) return { cases: [...SEED], _seq: 31 };
        const p = persisted as Partial<CasesState> | undefined;
        return {
          cases: sanitizeViolationCases(p?.cases),
          _seq: typeof p?._seq === 'number' && Number.isFinite(p._seq) ? p._seq : 31,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state?.cases || !Array.isArray(state.cases)) return;
        const dirty = state.cases.some(
          (c) => c == null || typeof c.id !== 'string' || typeof c.caseNumber !== 'string',
        );
        if (dirty) {
          useHRViolationCasesStore.setState({ cases: sanitizeViolationCases(state.cases) });
        }
      },
    },
  ),
);
