import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HRViolationCaseRecord, HRApproverRole } from './types';

function uid() { return `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

function buildApproversQueue(needsApproval: boolean, templateStageCount: number): HRApproverRole[] {
  if (!needsApproval) return [];
  const roles: HRApproverRole[] = ['manager', 'hr', 'executive'];
  const count = Math.min(Math.max(templateStageCount || 3, 1), 3);
  return roles.slice(0, count);
}

const SEED: HRViolationCaseRecord[] = [
  /* ── مغلقة / معتمدة ── */
  {
    id:'case-1', caseNumber:'VIO-2026-0001',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-01-08', description:'تأخر 45 دقيقة عن موعد الدوام الرسمي لثلاثة أيام متتالية', notes:'أبلغ المشرف وتمت معالجتها فوراً', attachmentsNote:'',
    violationTypeId:'vt-1', typeCode:'LATE', typeNameAr:'التأخر عن العمل',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:1,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:false,
    approvalTemplateId:null, status:'approved', requiredApprovers:[], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:true, createdAt:'2026-01-08T09:00:00Z', updatedAt:'2026-01-08T10:00:00Z',
  },
  {
    id:'case-3', caseNumber:'VIO-2026-0003',
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
    violationTypeId:'vt-5', typeCode:'INFO_LEAK', typeNameAr:'إفشاء معلومات سرية',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:500,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-03-10T11:00:00Z', updatedAt:'2026-03-10T11:30:00Z',
  },
  {
    id:'case-6', caseNumber:'VIO-2026-0006',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري', employeeNameEn:'Sultan Al-Dosari',
    date:'2026-03-15', description:'تقديم تقرير عمل يحتوي على بيانات غير دقيقة ومضللة للإدارة', notes:'أثبت التدقيق وجود أخطاء جوهرية في التقرير', attachmentsNote:'نسخة التقرير المعدل',
    violationTypeId:'vt-6', typeCode:'FALSEREPORT', typeNameAr:'تقرير مضلل',
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
    violationTypeId:'vt-2', typeCode:'EARLYEXIT', typeNameAr:'الانصراف المبكر',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:2,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
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
    violationTypeId:'vt-7', typeCode:'ASSET_ABUSE', typeNameAr:'إساءة استخدام ممتلكات الشركة',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:1000,
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
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-01', description:'التغيب عن اجتماع المجلس التنفيذي بدون عذر مقبول', notes:'', attachmentsNote:'',
    violationTypeId:'vt-8', typeCode:'MEETING_ABS', typeNameAr:'التغيب عن اجتماع رسمي',
    typeHasDeduction:false, typeDeductionKind:'none', typeDeductionValue:0,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
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
    violationTypeId:'vt-7', typeCode:'ASSET_ABUSE', typeNameAr:'إساءة استخدام ممتلكات الشركة',
    typeHasDeduction:false, typeDeductionKind:'none', typeDeductionValue:0,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-05T10:00:00Z', updatedAt:'2026-04-05T10:00:00Z',
  },
  {
    id:'case-15', caseNumber:'VIO-2026-0015',
    employeeId:'e3', employeeNameAr:'فهد العنزي', employeeNameEn:'Fahd Al-Anzi',
    date:'2026-04-06', description:'مغادرة موقع العمل ثلاث مرات قبل الوقت الرسمي خلال أسبوع واحد', notes:'جهاز البصمة يسجل الخروج المبكر بوضوح', attachmentsNote:'تقرير البصمة',
    violationTypeId:'vt-2', typeCode:'EARLYEXIT', typeNameAr:'الانصراف المبكر',
    typeHasDeduction:true, typeDeductionKind:'hours', typeDeductionValue:3,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-06T08:30:00Z', updatedAt:'2026-04-06T09:00:00Z',
  },
  {
    id:'case-16', caseNumber:'VIO-2026-0016',
    employeeId:'e8', employeeNameAr:'مها السبيعي', employeeNameEn:'Maha Al-Subaie',
    date:'2026-04-07', description:'عدم الامتثال لتعليمات السلامة المهنية في موقع الميدان', notes:'تم تحذيرها شفهيًا من قبل', attachmentsNote:'تقرير السلامة',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:false, typeDeductionKind:'none', typeDeductionValue:0,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-07T07:00:00Z', updatedAt:'2026-04-07T08:00:00Z',
  },
  {
    id:'case-17', caseNumber:'VIO-2026-0017',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري', employeeNameEn:'Sultan Al-Dosari',
    date:'2026-04-08', description:'إهمال تسليم تقارير الأداء الأسبوعية لثلاثة أسابيع متتالية', notes:'تم التذكير مرتين عبر البريد الإلكتروني', attachmentsNote:'',
    violationTypeId:'vt-6', typeCode:'FALSEREPORT', typeNameAr:'إهمال مهني',
    typeHasDeduction:false, typeDeductionKind:'none', typeDeductionValue:0,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-08T09:00:00Z', updatedAt:'2026-04-08T09:30:00Z',
  },
  {
    id:'case-18', caseNumber:'VIO-2026-0018',
    employeeId:'e6', employeeNameAr:'هدى العمري', employeeNameEn:'Huda Al-Omari',
    date:'2026-04-09', description:'نزاع لفظي مع موظف آخر في اجتماع رسمي أمام العملاء', notes:'أبلغ مدير المشاريع عن الحادثة فورًا', attachmentsNote:'محضر الاجتماع',
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'سوء السلوك',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:300,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:0,
    approvalLog:[], postedToPayroll:false, createdAt:'2026-04-09T11:00:00Z', updatedAt:'2026-04-09T11:30:00Z',
  },
  {
    id:'case-19', caseNumber:'VIO-2026-0019',
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-10', description:'تجاوز صلاحيات المنصب الوظيفي بإبرام اتفاقية مع مورّد بدون موافقة الإدارة', notes:'المورّد أكد وجود التواصل المباشر', attachmentsNote:'مراسلات البريد الإلكتروني',
    violationTypeId:'vt-5', typeCode:'INFO_LEAK', typeNameAr:'تجاوز الصلاحيات',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:1500,
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
    violationTypeId:'vt-5', typeCode:'INFO_LEAK', typeNameAr:'تجاوز صلاحيات النظام',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:700,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'التجاوز موثق في سجلات النظام', at:'2026-04-04T09:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-03T10:00:00Z', updatedAt:'2026-04-04T09:00:00Z',
  },
  {
    id:'case-22', caseNumber:'VIO-2026-0022',
    employeeId:'e4', employeeNameAr:'لينا الحربي', employeeNameEn:'Lina Al-Harbi',
    date:'2026-04-04', description:'إهمال تنفيذ مهام موكلة مما أخّر مشروعًا للعميل', notes:'العميل أبدى شكوى رسمية', attachmentsNote:'شكوى العميل',
    violationTypeId:'vt-6', typeCode:'FALSEREPORT', typeNameAr:'إهمال مهني',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:400,
    typeNeedsWarning:true, typeNeedsInvestigation:false, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'تأخر التسليم مؤثر على العميل', at:'2026-04-05T08:30:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-04T09:00:00Z', updatedAt:'2026-04-05T08:30:00Z',
  },
  {
    id:'case-23', caseNumber:'VIO-2026-0023',
    employeeId:'e7', employeeNameAr:'يوسف الزهراني', employeeNameEn:'Yousuf Al-Zahrani',
    date:'2026-04-05', description:'تهاون في توثيق معاملات مالية يومية مما أوجد فجوة في السجلات', notes:'المراجع المالي رصد الخلل', attachmentsNote:'تقرير المراجعة',
    violationTypeId:'vt-6', typeCode:'FALSEREPORT', typeNameAr:'تهاون في التوثيق',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:500,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'الخلل المالي موثق في تقرير المراجعة', at:'2026-04-06T08:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-05T11:00:00Z', updatedAt:'2026-04-06T08:00:00Z',
  },
  {
    id:'case-24', caseNumber:'VIO-2026-0024',
    employeeId:'e8', employeeNameAr:'مها السبيعي', employeeNameEn:'Maha Al-Subaie',
    date:'2026-04-06', description:'مشاركة بيانات عملاء عبر قنوات غير آمنة في المراسلات', notes:'قسم الأمن السيبراني رصد المخالفة', attachmentsNote:'تقرير الأمن السيبراني',
    violationTypeId:'vt-5', typeCode:'INFO_LEAK', typeNameAr:'إفشاء بيانات العملاء',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:800,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:1,
    approvalLog:[{ role:'manager', action:'approved', note:'الحادثة تستوجب مراجعة HR', at:'2026-04-07T09:00:00Z' }],
    postedToPayroll:false, createdAt:'2026-04-06T13:00:00Z', updatedAt:'2026-04-07T09:00:00Z',
  },
  {
    id:'case-25', caseNumber:'VIO-2026-0025',
    employeeId:'e5', employeeNameAr:'سلطان الدوسري', employeeNameEn:'Sultan Al-Dosari',
    date:'2026-04-07', description:'إساءة استخدام صلاحيات النظام لحذف سجلات غير مرتبطة بعمله', notes:'سجل النظام يثبت العمليات الممسوحة', attachmentsNote:'سجل عمليات النظام',
    violationTypeId:'vt-7', typeCode:'ASSET_ABUSE', typeNameAr:'إساءة استخدام صلاحيات النظام',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:1200,
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
    employeeId:'e1', employeeNameAr:'عبدالرحمن المالكي', employeeNameEn:'Abdulrahman Al-Malki',
    date:'2026-04-05', description:'التلاعب في مصروفات المشاريع لصرف مبالغ إضافية غير مستحقة', notes:'تحقق المراجع الداخلي من السحوبات المشبوهة', attachmentsNote:'تقرير المراجع الداخلي',
    violationTypeId:'vt-7', typeCode:'ASSET_ABUSE', typeNameAr:'التلاعب في المصروفات',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:3000,
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
    violationTypeId:'vt-6', typeCode:'FALSEREPORT', typeNameAr:'تزوير وثيقة رسمية',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:5000,
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
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'التهديد والتخويف',
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
    violationTypeId:'vt-5', typeCode:'INFO_LEAK', typeNameAr:'تسريب أسرار تجارية',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:10000,
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
    violationTypeId:'vt-3', typeCode:'MIS', typeNameAr:'الإساءة لسمعة الشركة',
    typeHasDeduction:true, typeDeductionKind:'amount', typeDeductionValue:2000,
    typeNeedsWarning:true, typeNeedsInvestigation:true, typeNeedsApproval:true,
    approvalTemplateId:null, status:'under_review', requiredApprovers:['manager','hr','executive'], currentApprovalIndex:2,
    approvalLog:[
      { role:'manager', action:'approved', note:'التغريدات واضحة وتمس السمعة مباشرة', at:'2026-04-10T08:00:00Z' },
      { role:'hr',      action:'approved', note:'تعارض صريح مع سياسة التواصل الاجتماعي', at:'2026-04-11T09:00:00Z' },
    ],
    postedToPayroll:false, createdAt:'2026-04-09T12:00:00Z', updatedAt:'2026-04-11T09:00:00Z',
  },
];

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
        return { ok:true, id: rec.id };
      },

      submit: (id) => {
        const c = get().cases.find(x => x.id === id);
        if (!c) return { ok:false, error:'المخالفة غير موجودة' };
        if (!c.typeNeedsApproval) {
          // auto approve
          set(s => ({ cases: s.cases.map(x => x.id === id ? { ...x, status:'approved', updatedAt:now() } : x) }));
          const updated = get().cases.find(x => x.id === id)!;
          if (updated.typeHasDeduction) {
            const month = new Date().toISOString().slice(0,7);
            import('./payroll-deductions-store').then(m => m.useHRDisciplinePayrollDeductionsStore.getState().syncFromCase(updated, month));
          }
        } else {
          set(s => ({ cases: s.cases.map(x => x.id === id ? { ...x, status:'under_review', updatedAt:now() } : x) }));
        }
        return { ok:true };
      },

      approve: (id, role, note) => {
        const c = get().cases.find(x => x.id === id);
        if (!c) return { ok:false, error:'المخالفة غير موجودة' };
        const logEntry = { role, action: 'approved' as const, note, at: now() };
        const newIndex = c.currentApprovalIndex + 1;
        const isLast = newIndex >= c.requiredApprovers.length;
        const newStatus = isLast ? 'approved' : 'under_review';
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: newStatus as HRViolationCaseRecord['status'],
            currentApprovalIndex: newIndex,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        if (isLast) {
          const updated = get().cases.find(x => x.id === id)!;
          if (updated.typeHasDeduction) {
            const month = new Date().toISOString().slice(0,7);
            import('./payroll-deductions-store').then(m => m.useHRDisciplinePayrollDeductionsStore.getState().syncFromCase(updated, month));
          }
        }
        return { ok:true };
      },

      reject: (id, role, note) => {
        const logEntry = { role, action: 'rejected' as const, note, at: now() };
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: 'rejected' as const,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        return { ok:true };
      },

      requestEdit: (id, role, note) => {
        const logEntry = { role, action: 'edit_requested' as const, note, at: now() };
        set(s => ({
          cases: s.cases.map(x => x.id === id ? {
            ...x, status: 'draft' as const,
            approvalLog: [...x.approvalLog, logEntry],
            updatedAt: now(),
          } : x),
        }));
        return { ok:true };
      },

      update: (id, patch) => set(s => ({
        cases: s.cases.map(x => x.id === id ? { ...x, ...patch, updatedAt:now() } : x),
      })),

      remove: (id) => set(s => ({ cases: s.cases.filter(x => x.id !== id) })),

      markPayrollPosted: (id) => set(s => ({
        cases: s.cases.map(x => x.id === id ? { ...x, postedToPayroll:true, updatedAt:now() } : x),
      })),
    }),
    { name:'hr_discipline_cases_v1', storage: createJSONStorage(() => localStorage), version:4, migrate: () => ({ cases: SEED, _seq: 31 }) },
  ),
);
