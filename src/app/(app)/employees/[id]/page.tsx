'use client';

import * as React from 'react';
import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  X,
  ChevronLeft,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  CreditCard,
  Edit3,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  FileSignature,
  MapPinned,
  ExternalLink,
  Link2,
  Layers,
  Search,
  Unlink,
  UserRound,
  Receipt,
  Heart,
  Plus,
  User,
  Hash,
  AtSign,
  Globe,
  CircleDot,
  Share2,
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, ContractTypeLabel, RequestTypeLabel } from '@/components/status-badge';
import { getEmployee, getBranch, getDepartment, data } from '@/lib/data';
import { useAttendanceStore } from '@/lib/attendance/store';
import { useHRViolationCasesStore } from '@/lib/hr-discipline/violation-cases-store';
import { useHRContractsStore } from '@/lib/contracts/contracts-store';
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SingleDatePicker } from '@/components/ui/single-date-picker';

const SECTIONS = [
  { id: 'personal', label: 'البيانات الشخصية', icon: User },
  { id: 'employment', label: 'بيانات التوظيف', icon: Briefcase },
  { id: 'financial', label: 'البيانات المالية', icon: CreditCard },
  { id: 'attendance', label: 'الحضور والانصراف', icon: Clock },
  { id: 'leaves', label: 'الإجازات', icon: Calendar },
  { id: 'requests', label: 'الطلبات', icon: FileText },
  { id: 'violations', label: 'المخالفات', icon: AlertTriangle },
  { id: 'contracts', label: 'العقود', icon: FileSignature },
  { id: 'salary', label: 'كشوف الرواتب', icon: Receipt },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

function Prop({ icon: Icon, label, children, mono, accent }: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  accent?: 'primary' | 'gold' | 'success' | 'warning' | 'destructive';
}) {
  if (children === null || children === undefined || children === '' || children === false) return null;
  const accentCls = {
    primary: 'text-primary',
    gold: 'text-gold',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  } as const;
  return (
    <div className="group relative flex items-start gap-3 py-3 px-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-xs transition-all">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80 mb-0.5 font-medium">{label}</div>
        <div className={cn(
          "text-sm font-medium truncate min-w-0",
          mono && "font-mono text-xs",
          accent ? accentCls[accent] : "text-foreground"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionH({ action }: {
  icon?: React.ElementType;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  if (!action) return null;
  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      {action}
    </div>
  );
}

function FieldGroup({ title, hint, children }: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-7 last:mb-0">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {hint && <span className="text-[10px] text-muted-foreground/60">{hint}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {children}
      </div>
    </div>
  );
}

function ItemRow({ children, href }: {
  children: React.ReactNode;
  href?: string;
}) {
  const cls = "group flex items-center justify-between gap-3 py-3 px-3 -mx-3 rounded-md border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors";
  if (href) return <Link href={href} className={cn(cls, "cursor-pointer")}>{children}</Link>;
  return <div className={cls}>{children}</div>;
}

function Stat({ value, label, sub, accent, icon: Icon }: {
  value: React.ReactNode;
  label: string;
  sub?: string;
  accent?: 'gold' | 'success' | 'destructive' | 'warning' | 'primary';
  icon?: React.ElementType;
}) {
  const accentCls = {
    gold: 'text-gold border-gold/20 bg-gold/5',
    success: 'text-success border-success/20 bg-success/5',
    destructive: 'text-destructive border-destructive/20 bg-destructive/5',
    warning: 'text-warning border-warning/20 bg-warning/5',
    primary: 'text-primary border-primary/20 bg-primary/5',
  } as const;
  const valueColor = accent ? accentCls[accent].split(' ')[0] : 'text-foreground';
  const cardBorder = accent ? accentCls[accent].split(' ').slice(1).join(' ') : 'border-border/50 bg-card';
  return (
    <div className={cn("relative rounded-xl border p-4 transition-all hover:shadow-xs", cardBorder)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</div>
        {Icon && <Icon className={cn("h-3.5 w-3.5", valueColor, "opacity-70")} />}
      </div>
      <div className={cn("font-arabic-display text-2xl font-semibold tabular-nums leading-none", valueColor)}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Empty({ icon: Icon, text, action }: {
  icon: React.ElementType;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-8 text-center text-muted-foreground border border-dashed border-border/60 rounded-xl bg-muted/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 border border-border/50">
        <Icon className="h-5 w-5 opacity-60" />
      </div>
      <p className="text-sm">{text}</p>
      {action}
    </div>
  );
}

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employee = getEmployee(id);
  if (!employee) return notFound();

  const branch = getBranch(employee.branchId);
  const department = getDepartment(employee.departmentId);
  const manager = employee.managerId ? getEmployee(employee.managerId) : null;

  const { events, daySummaries, checkpointLinks, checkpoints, assignments, shiftTemplates, addCheckpointLinkBatch, removeCheckpointLink, addAssignmentBatch, removeAssignment } = useAttendanceStore();
  const { cases: violationCases } = useHRViolationCasesStore();
  const { contracts } = useHRContractsStore();

  const employeeEvents = events.filter(e => e.employeeId === employee.id);
  const employeeSummaries = daySummaries.filter(s => s.employeeId === employee.id);
  const employeeCheckpoints = checkpointLinks.filter(c => c.employeeId === employee.id);
  const employeeAssignments = assignments.filter(a => a.targetType === 'employee' && a.targetId === employee.id);
  const employeeViolations = violationCases.filter(v => v.employeeId === employee.id);
  const employeeContracts = contracts.filter(c => c.employeeId === employee.id);
  const employeeRequests = data.requests.filter(r => r.employeeId === employee.id);
  const employeePayslips = data.payslips?.filter(p => p.employeeId === employee.id) || [];

  const stats = {
    present: employeeSummaries.filter(s => s.status === 'present').length,
    absent: employeeSummaries.filter(s => s.status === 'absent').length,
    late: employeeSummaries.filter(s => s.status === 'late').length,
    earlyLeave: employeeSummaries.filter(s => s.status === 'early_leave').length,
    total: employeeSummaries.length,
  };

  // ─── Edit mode ───────────────────────────────────────────────────────
  type Draft = typeof employee;
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(() => ({ ...employee }));

  React.useEffect(() => {
    setDraft({ ...employee });
  }, [employee.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    Object.assign(employee, draft);
    setEditing(false);
  };
  const handleCancel = () => {
    setDraft({ ...employee });
    setEditing(false);
  };

  // Derived from draft so they update live while editing
  const totalSalary =
    draft.baseSalary + draft.housingAllowance + draft.transportAllowance + draft.otherAllowances;
  const netSalary = totalSalary - draft.gosi;

  const yearsOfService = (() => {
    const start = new Date(draft.startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return (diff / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  })();

  const [activeSection, setActiveSection] = React.useState<SectionId>('personal');

  // ─── Checkpoint connect/disconnect ───────────────────────────────────
  const [cpOpen, setCpOpen] = React.useState(false);
  const [cpDate, setCpDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [cpSel, setCpSel] = React.useState<Set<string>>(new Set());
  const [cpQuery, setCpQuery] = React.useState('');
  const [cpUnlinkTarget, setCpUnlinkTarget] = React.useState<string | null>(null);

  const openCpDialog = () => {
    setCpDate(new Date().toISOString().slice(0, 10));
    setCpSel(new Set());
    setCpQuery('');
    setCpOpen(true);
  };

  const submitCpLink = () => {
    if (cpSel.size === 0) return;
    addCheckpointLinkBatch({
      effectiveFrom: cpDate,
      pairs: [...cpSel].map(checkInPointId => ({ employeeId: employee.id, checkInPointId })),
    });
    setCpOpen(false);
  };

  // ─── Shift connect/disconnect ─────────────────────────────────────────
  const [shiftOpen, setShiftOpen] = React.useState(false);
  const [shiftMode, setShiftMode] = React.useState<'template' | 'open'>('template');
  const [shiftTemplateId, setShiftTemplateId] = React.useState('');
  const [shiftDate, setShiftDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [shiftHours, setShiftHours] = React.useState('8');
  const [shiftUnlinkTarget, setShiftUnlinkTarget] = React.useState<string | null>(null);

  const openShiftDialog = () => {
    const active = shiftTemplates.filter(t => t.isActive);
    setShiftMode('template');
    setShiftTemplateId(active[0]?.id ?? '');
    setShiftDate(new Date().toISOString().slice(0, 10));
    setShiftHours('8');
    setShiftOpen(true);
  };

  const submitShift = () => {
    if (shiftMode === 'template' && !shiftTemplateId) return;
    addAssignmentBatch({
      templateId: shiftMode === 'open' ? '__open__' : shiftTemplateId,
      effectiveFrom: shiftDate,
      openShiftHours: shiftMode === 'open' ? Number(shiftHours) : undefined,
      items: [{ targetType: 'employee', targetId: employee.id, targetLabel: employee.name }],
    });
    setShiftOpen(false);
  };
  const contentRef = React.useRef<HTMLElement | null>(null);
  // Reset scroll on section change
  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  // Inline Field — renders input when editing, else value via children/format
  function Field<K extends keyof Draft>({ field, type = 'text', mono, accent, format, icon, label }: {
    field: K;
    type?: 'text' | 'email' | 'tel' | 'date' | 'number';
    mono?: boolean;
    accent?: 'primary' | 'gold' | 'success' | 'warning' | 'destructive';
    format?: (v: Draft[K]) => React.ReactNode;
    icon: React.ElementType;
    label: string;
  }) {
    const value = draft[field];
    const display: React.ReactNode = format ? format(value) : (value as React.ReactNode);

    if (!editing) {
      return <Prop icon={icon} label={label} mono={mono} accent={accent}>{display}</Prop>;
    }

    return (
      <div className="group relative flex items-start gap-3 py-3 px-3.5 rounded-xl border border-primary/30 bg-card transition-all">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {React.createElement(icon, { className: 'h-3.5 w-3.5' })}
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80 mb-1 font-medium block">{label}</label>
          <input
            type={type}
            value={String(value ?? '')}
            onChange={(e) => {
              const v = type === 'number' ? Number(e.target.value) : e.target.value;
              updateField(field, v as Draft[K]);
            }}
            dir={mono ? 'ltr' : undefined}
            className={cn(
              "w-full bg-transparent text-sm font-medium text-foreground border-0 border-b border-primary/30 px-0 py-0.5 focus:outline-none focus:border-primary transition-colors",
              mono && "font-mono text-xs"
            )}
          />
        </div>
      </div>
    );
  }

  const counts: Partial<Record<SectionId, number>> = {
    requests: employeeRequests.length,
    violations: employeeViolations.length,
    contracts: employeeContracts.length,
    salary: employeePayslips.length,
  };

  return (
    <div dir="rtl" className="h-full flex flex-col overflow-hidden bg-background -mx-4 sm:-mx-6">
      {/* Top breadcrumb bar */}
      <div className="shrink-0 border-b border-border/60 bg-card/50 backdrop-blur-md">
        <div className="px-3 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/employees" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              <span className="hidden sm:inline">الموظفون</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium truncate max-w-[140px] sm:max-w-[200px]">{employee.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">إلغاء</span>
                </Button>
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleSave}>
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">حفظ التغييرات</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden sm:flex">
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setEditing(true)}>
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">تعديل</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: identity strip + horizontal section tabs */}
      <div className="md:hidden shrink-0 border-b border-border/60 bg-card/30">
        <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40">
          <Avatar className="h-9 w-9 ring-2 ring-background shadow-xs shrink-0">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback className="text-xs font-arabic-display bg-primary text-primary-foreground">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{employee.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{employee.position}</div>
          </div>
          <StatusBadge status={employee.contractStatus} />
        </div>
        <div className="flex overflow-x-auto scrollbar-hide gap-0.5 px-2 py-1.5">
          {SECTIONS.map(s => {
            const isActive = activeSection === s.id;
            const count = counts[s.id];
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                {s.label}
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] tabular-nums",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex w-72 lg:w-80 shrink-0 border-l border-border/60 bg-card/30 flex-col overflow-hidden">
          {/* Identity card */}
          <div className="p-5 border-b border-border/60">
            <div className="flex items-start gap-3">
              <Avatar className="h-14 w-14 ring-2 ring-background shadow-xs">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="text-base font-arabic-display bg-primary text-primary-foreground">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="font-arabic-display text-lg font-semibold tracking-tight text-foreground truncate">
                  {employee.name}
                </h1>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{employee.position}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <StatusBadge status={employee.contractStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 px-2">
              الأقسام
            </div>
            <div className="space-y-0.5">
              {SECTIONS.map(s => {
                const isActive = activeSection === s.id;
                const count = counts[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all text-right",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <s.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    <span className="flex-1 truncate text-right">{s.label}</span>
                    {count !== undefined && count > 0 && (
                      <Badge
                        variant={isActive ? 'gold' : 'subtle'}
                        className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums"
                      >
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

        </aside>

        {/* Content area (only this scrolls) */}
        <main ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-5">
            {/* Personal (merged with overview + quick metadata) */}
            {activeSection === 'personal' && (
              <section>
                {/* Hero banner */}
                <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-bl from-primary/6 via-card to-gold/4 mb-8">
                  <div className="absolute inset-0 dotted-bg opacity-5" />
                  <div className="relative p-6 md:p-7">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 mb-6">
                      <Avatar className="h-20 w-20 ring-4 ring-background shadow-sm">
                        <AvatarImage src={employee.avatar} alt={employee.name} />
                        <AvatarFallback className="text-xl font-arabic-display bg-primary text-primary-foreground">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h1 className="font-arabic-display text-3xl font-semibold tracking-tight text-foreground">
                            {employee.name}
                          </h1>
                          <StatusBadge status={employee.contractStatus} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {employee.position}
                          <span className="text-muted-foreground/40 mx-2">·</span>
                          {department?.name}
                          <span className="text-muted-foreground/40 mx-2">·</span>
                          {branch?.name}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3" />
                            <span className="font-mono">{employee.employeeCode}</span>
                          </span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            انضم في {formatDate(employee.startDate)}
                          </span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="flex items-center gap-1.5 text-gold">
                            <Sparkles className="h-3 w-3" />
                            {yearsOfService} سنة
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <SectionH icon={User} title="البيانات الشخصية" subtitle="المعلومات الأساسية وبيانات الاتصال للموظف" />

                <FieldGroup title="الهوية">
                  <Prop icon={Hash} label="رقم الموظف" mono>{draft.employeeCode}</Prop>
                  <Field icon={User} field="name" label="الاسم" />
                  <Field icon={User} field="nameEn" label="الاسم بالإنجليزية" />
                  <Field icon={Hash} field="nationalId" label="رقم الهوية" mono />
                  <Field icon={Globe} field="nationality" label="الجنسية" />
                  <Field icon={Calendar} field="birthDate" label="تاريخ الميلاد" type="date" format={(v) => formatDate(v as string)} />
                  <Prop icon={UserRound} label="الجنس">{draft.gender === 'male' ? 'ذكر' : 'أنثى'}</Prop>
                  <Prop icon={Heart} label="الحالة الاجتماعية">
                    {draft.maritalStatus === 'married' ? 'متزوج' : 'أعزب'}
                  </Prop>
                </FieldGroup>

                <FieldGroup title="بيانات الاتصال">
                  <Field
                    icon={AtSign}
                    field="email"
                    label="البريد الإلكتروني"
                    type="email"
                    format={(v) => (
                      <a href={`mailto:${v as string}`} className="hover:text-primary hover:underline underline-offset-4">
                        {v as string}
                      </a>
                    )}
                  />
                  <Field icon={Phone} field="phone" label="رقم الجوال" type="tel" mono />
                  <Field icon={MapPin} field="address" label="العنوان" />
                </FieldGroup>

                <FieldGroup title="الموقع الوظيفي">
                  <Prop icon={Building2} label="الفرع">{branch?.name}</Prop>
                  <Prop icon={Briefcase} label="القسم">{department?.name}</Prop>
                  <Prop icon={Sparkles} label="مدة الخدمة" accent="gold">{yearsOfService} سنة</Prop>
                </FieldGroup>
              </section>
            )}

            {/* Employment */}
            {activeSection === 'employment' && (
              <section>
                <SectionH icon={Briefcase} title="بيانات التوظيف" subtitle="تفاصيل الوظيفة والتسلسل الإداري" />

                <FieldGroup title="الوظيفة والتسلسل الإداري">
                  <Prop icon={Hash} label="رقم الموظف" mono>{draft.employeeCode}</Prop>
                  <Field icon={Briefcase} field="position" label="المسمى الوظيفي" />
                  <Prop icon={UserRound} label="المدير المباشر">
                    {manager ? (
                      <Link href={`/employees/${manager.id}`} className="hover:text-primary inline-flex items-center gap-1">
                        {manager.name}<ArrowUpRight className="h-3 w-3" />
                      </Link>
                    ) : null}
                  </Prop>
                  <Prop icon={Building2} label="الفرع">{branch?.name}</Prop>
                  <Prop icon={Building2} label="القسم">{department?.name}</Prop>
                </FieldGroup>

                <FieldGroup title="العقد">
                  <Field icon={Calendar} field="startDate" label="تاريخ التعيين" type="date" format={(v) => formatDate(v as string)} />
                  <Prop icon={Sparkles} label="مدة الخدمة" accent="gold">{yearsOfService} سنة</Prop>
                  <Prop icon={FileSignature} label="نوع العقد">
                    <ContractTypeLabel type={draft.contractType} />
                  </Prop>
                  <Prop icon={CircleDot} label="حالة العقد">
                    <StatusBadge status={draft.contractStatus} />
                  </Prop>
                </FieldGroup>
              </section>
            )}

            {/* Financial */}
            {activeSection === 'financial' && (
              <section>
                <SectionH icon={CreditCard} title="البيانات المالية" subtitle="الراتب والبدلات والحساب البنكي" />

                {/* Salary breakdown highlight */}
                <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-linear-to-bl from-gold/5 via-card to-card mb-8">
                  <div className="absolute inset-0 dotted-bg opacity-5" />
                  <div className="relative p-6">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                        الراتب الصافي الشهري
                      </span>
                      <Wallet className="h-4 w-4 text-gold" />
                    </div>
                    <div className="font-arabic-display text-4xl font-semibold tabular-nums text-gold mb-4">
                      {formatCurrency(netSalary)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>إجمالي: <span className="font-arabic-display font-semibold text-foreground tabular-nums">{formatCurrency(totalSalary)}</span></span>
                      <span className="text-muted-foreground/30">·</span>
                      <span>خصومات: <span className="font-arabic-display font-semibold text-destructive tabular-nums">−{formatCurrency(draft.gosi)}</span></span>
                    </div>
                  </div>
                </div>

                <FieldGroup title="مكوّنات الراتب">
                  <Field icon={Wallet} field="baseSalary" label="الراتب الأساسي" type="number" format={(v) => formatCurrency(v as number)} />
                  <Field icon={Wallet} field="housingAllowance" label="بدل السكن" type="number" format={(v) => formatCurrency(v as number)} />
                  <Field icon={Wallet} field="transportAllowance" label="بدل المواصلات" type="number" format={(v) => formatCurrency(v as number)} />
                  <Field icon={Wallet} field="otherAllowances" label="بدلات أخرى" type="number" format={(v) => formatCurrency(v as number)} />
                  <Field icon={Wallet} field="gosi" label="التأمينات (GOSI)" type="number" accent="destructive" format={(v) => `−${formatCurrency(v as number)}`} />
                  <Prop icon={Wallet} label="الصافي" accent="gold">{formatCurrency(netSalary)}</Prop>
                </FieldGroup>

                <FieldGroup title="الحساب البنكي" hint="تستخدم لتحويل الرواتب">
                  <Field icon={CreditCard} field="bankAccount" label="رقم الحساب" mono />
                  <Field icon={CreditCard} field="iban" label="رقم الآيبان (IBAN)" mono />
                </FieldGroup>
              </section>
            )}

            {activeSection === 'attendance' && (
              <section className="space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'حاضر', value: stats.present, color: 'success' as const },
                    { label: 'متأخر', value: stats.late, color: 'warning' as const },
                    { label: 'غائب', value: stats.absent, color: 'destructive' as const },
                    { label: 'خروج مبكر', value: stats.earlyLeave, color: 'warning' as const },
                  ].map(s => (
                    <div key={s.label} className={cn(
                      'rounded-xl border p-3 bg-card',
                      s.value > 0
                        ? s.color === 'success' ? 'border-success/40 bg-success/5'
                          : s.color === 'warning' ? 'border-warning/40 bg-warning/5'
                          : 'border-destructive/40 bg-destructive/5'
                        : 'border-border/60'
                    )}>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</div>
                      <div className={cn(
                        'font-arabic-display text-xl font-semibold tabular-nums',
                        s.value > 0
                          ? s.color === 'success' ? 'text-success'
                            : s.color === 'warning' ? 'text-warning'
                            : 'text-destructive'
                          : 'text-foreground'
                      )}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Two-column: shift + checkpoints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shift assignments */}
                  <div className="rounded-xl border border-border/60 bg-card/50">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">الشيفت المرتبط</h3>
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] px-2" onClick={openShiftDialog}>
                        <Layers className="h-3 w-3" /> ربط
                      </Button>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {employeeAssignments.length > 0 ? employeeAssignments.map(asg => {
                        const isOpen = asg.templateId === '__open__';
                        const tpl = !isOpen ? shiftTemplates.find(t => t.id === asg.templateId) : null;
                        return (
                          <div
                            key={asg.id}
                            className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 border-r-2"
                            style={{ borderRightColor: !isOpen && tpl ? tpl.colorHex : undefined }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                                style={!isOpen && tpl ? { background: tpl.colorHex + '22', color: tpl.colorHex } : undefined}
                              >
                                {isOpen ? <Clock className="h-3.5 w-3.5 text-primary" /> : <Layers className="h-3.5 w-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">
                                  {isOpen ? `شيفت مفتوح · ${asg.openShiftHours ?? '?'} ساعة` : (tpl?.nameAr ?? 'شيفت')}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono" dir="ltr">{asg.effectiveFrom}</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setShiftUnlinkTarget(asg.id)}>
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      }) : (
                        <div className="flex flex-col items-center gap-1.5 py-5 text-center text-muted-foreground">
                          <Layers className="h-5 w-5 opacity-40" />
                          <p className="text-xs">لم يُرتبط بشيفت بعد</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checkpoints */}
                  <div className="rounded-xl border border-border/60 bg-card/50">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">نقاط التسجيل</h3>
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] px-2" onClick={openCpDialog}>
                        <Link2 className="h-3 w-3" /> ربط
                      </Button>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {employeeCheckpoints.length > 0 ? employeeCheckpoints.map(link => {
                        const cp = checkpoints.find(c => c.id === link.checkInPointId);
                        return (
                          <div key={link.id} className={cn(
                            'flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 border-r-2',
                            link.linkActive ? 'border-r-success' : 'border-r-muted-foreground/25'
                          )}>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                                link.linkActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                              )}>
                                <MapPinned className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">{cp?.nameAr || 'نقطة تسجيل'}</div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                                    {cp?.latitude?.toFixed(4)}, {cp?.longitude?.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant={link.linkActive ? 'success' : 'subtle'} className="text-[10px] h-4 px-1.5">
                                {link.linkActive ? 'نشط' : 'موقوف'}
                              </Badge>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setCpUnlinkTarget(link.id)}>
                                <Unlink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="flex flex-col items-center gap-1.5 py-5 text-center text-muted-foreground">
                          <MapPinned className="h-5 w-5 opacity-40" />
                          <p className="text-xs">لا توجد نقاط مرتبطة</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last attendance events — day-grouped */}
                {(() => {
                  const srcLabel: Record<string, string> = { device: 'جهاز', manual: 'يدوي', gps: 'GPS' };
                  const parseMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                  const durLabel = (from: string, to: string) => {
                    const d = parseMins(to) - parseMins(from);
                    if (d <= 0) return null;
                    const h = Math.floor(d / 60), m = d % 60;
                    return h > 0 ? `${h}س${m > 0 ? ` ${m}د` : ''}` : `${m}د`;
                  };

                  const grouped = new Map<string, { checkIn?: typeof employeeEvents[0]; checkOut?: typeof employeeEvents[0] }>();
                  for (const evt of [...employeeEvents].sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at))) {
                    if (!grouped.has(evt.date)) grouped.set(evt.date, {});
                    const g = grouped.get(evt.date)!;
                    if (evt.type === 'check_in' && !g.checkIn) g.checkIn = evt;
                    if (evt.type === 'check_out') g.checkOut = evt;
                  }
                  const days = [...grouped.entries()].slice(0, 6);

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/70">آخر حركات الحضور</h3>
                        <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] px-2" asChild>
                          <Link href="/hr/attendance/daily"><ExternalLink className="h-3 w-3" /> الكل</Link>
                        </Button>
                      </div>

                      {days.length > 0 ? (
                        <div className="space-y-2">
                          {days.map(([date, g]) => {
                            const dur = g.checkIn && g.checkOut ? durLabel(g.checkIn.at, g.checkOut.at) : null;
                            const hasIn  = !!g.checkIn;
                            const hasOut = !!g.checkOut;
                            return (
                              <div key={date} className="overflow-hidden rounded-xl border bg-card">
                                {/* Date header */}
                                <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2">
                                  <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                                  <span className="text-[11px] font-medium text-muted-foreground">{formatDate(date)}</span>
                                  {dur ? (
                                    <span className="mr-auto flex items-center gap-1 font-mono text-[11px] text-primary/70">
                                      <Clock className="h-3 w-3" />{dur}
                                    </span>
                                  ) : !hasIn && !hasOut ? null : (
                                    <span className="mr-auto text-[10px] text-muted-foreground/50">
                                      {hasIn && !hasOut ? 'لم يتسجل خروج' : !hasIn && hasOut ? 'لم يتسجل دخول' : ''}
                                    </span>
                                  )}
                                </div>

                                {/* In / Out side by side */}
                                <div className="grid grid-cols-2 divide-x divide-x-reverse divide-border/30">
                                  {([
                                    { key: 'in',  event: g.checkIn,  label: 'دخول',  Icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
                                    { key: 'out', event: g.checkOut, label: 'خروج', Icon: CircleDot,     color: 'text-warning', bg: 'bg-warning/10' },
                                  ] as const).map(({ key, event, label, Icon, color, bg }) => (
                                    <div key={key} className={cn('flex items-center gap-3 px-4 py-3 transition-colors', !event && 'opacity-35')}>
                                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg, color)}>
                                        <Icon className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                                        <div className={cn('font-mono text-base font-bold tabular-nums leading-tight', event ? color : 'text-muted-foreground/30')}>
                                          {event?.at ?? '——:——'}
                                        </div>
                                        {event?.source && (
                                          <div className="text-[10px] text-muted-foreground/50">{srcLabel[event.source] ?? event.source}</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Empty icon={Clock} text="لا توجد حركات حضور حتى الآن" />
                      )}
                    </div>
                  );
                })()}

            {/* ── Connect shift dialog ── */}
            <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
              <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
                <DialogHeader className="border-b border-border px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <DialogTitle className="text-base">ربط شيفت</DialogTitle>
                      <DialogDescription className="text-xs">حدد نوع الشيفت لـ {employee.name}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="px-5 py-4 space-y-4">
                  {/* mode toggle */}
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
                    <button
                      type="button"
                      className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all', shiftMode === 'template' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground')}
                      onClick={() => setShiftMode('template')}
                    >
                      <Layers className="h-3.5 w-3.5" /> شيفت محدد
                    </button>
                    <button
                      type="button"
                      className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all', shiftMode === 'open' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground')}
                      onClick={() => setShiftMode('open')}
                    >
                      <Clock className="h-3.5 w-3.5" /> شيفت مفتوح
                    </button>
                  </div>

                  {/* effective date */}
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0 text-xs">ساري من</Label>
                    <SingleDatePicker value={shiftDate} onChange={setShiftDate} />
                  </div>

                  {shiftMode === 'template' ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs">اختر الشيفت</Label>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {shiftTemplates.filter(t => t.isActive).map(tpl => {
                          const sel = shiftTemplateId === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => setShiftTemplateId(tpl.id)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm transition-all',
                                sel ? 'bg-primary/10' : 'hover:bg-muted/50',
                              )}
                            >
                              <div
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
                                style={sel ? { borderColor: tpl.colorHex, background: tpl.colorHex } : { borderColor: tpl.colorHex + '80' }}
                              >
                                {sel && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="h-3 w-3 rounded-full shrink-0" style={{ background: tpl.colorHex }} />
                              <span className="flex-1 truncate font-medium">{tpl.nameAr}</span>
                              <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">{tpl.effectiveFrom}</span>
                            </button>
                          );
                        })}
                        {shiftTemplates.filter(t => t.isActive).length === 0 && (
                          <p className="py-4 text-center text-xs text-muted-foreground">لا توجد شيفتات نشطة</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs">عدد ساعات العمل اليومية</Label>
                      <div className="relative">
                        <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          min="1" max="24" step="0.5"
                          value={shiftHours}
                          onChange={e => setShiftHours(e.target.value)}
                          placeholder="8"
                          className="pr-9"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">الموظف يعمل ساعات مرنة بدون شيفت ثابت</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
                  <Button variant="outline" size="sm" onClick={() => setShiftOpen(false)}>إلغاء</Button>
                  <Button
                    variant="luxe" size="sm"
                    onClick={submitShift}
                    disabled={shiftMode === 'template' && !shiftTemplateId}
                    className="gap-1.5"
                  >
                    <Layers className="h-3.5 w-3.5" /> ربط الشيفت
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* ── Unlink shift confirm dialog ── */}
            <Dialog open={!!shiftUnlinkTarget} onOpenChange={o => { if (!o) setShiftUnlinkTarget(null); }}>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <Unlink className="h-4 w-4" /> فك ربط الشيفت
                  </DialogTitle>
                  <DialogDescription>هل تريد إزالة هذا الشيفت من الموظف؟</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShiftUnlinkTarget(null)}>إلغاء</Button>
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => {
                    if (shiftUnlinkTarget) { removeAssignment(shiftUnlinkTarget); setShiftUnlinkTarget(null); }
                  }}>
                    <Unlink className="h-3.5 w-3.5" /> فك الربط
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── Connect checkpoint dialog ── */}
            <Dialog open={cpOpen} onOpenChange={setCpOpen}>
              <DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="border-b border-border px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div>
                      <DialogTitle className="text-base">ربط نقطة تسجيل</DialogTitle>
                      <DialogDescription className="text-xs">اختر نقطة أو أكثر لربطها بـ {employee.name}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="border-b border-border bg-muted/20 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0 text-xs">ساري من</Label>
                    <SingleDatePicker value={cpDate} onChange={setCpDate} />
                  </div>
                </div>

                <div className="border-b border-border px-3 py-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={cpQuery}
                      onChange={e => setCpQuery(e.target.value)}
                      placeholder="ابحث باسم النقطة…"
                      className="h-8 bg-background pr-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                  {(() => {
                    const linkedIds = new Set(employeeCheckpoints.map(l => l.checkInPointId));
                    const q = cpQuery.trim().toLowerCase();
                    const list = checkpoints.filter(cp =>
                      (!q || cp.nameAr.toLowerCase().includes(q))
                    );
                    if (list.length === 0) return (
                      <p className="py-6 text-center text-xs text-muted-foreground">لا توجد نقاط مطابقة</p>
                    );
                    return list.map(cp => {
                      const sel = cpSel.has(cp.id);
                      const alreadyLinked = linkedIds.has(cp.id);
                      return (
                        <button
                          key={cp.id}
                          type="button"
                          disabled={alreadyLinked}
                          onClick={() => {
                            setCpSel(prev => {
                              const n = new Set(prev);
                              n.has(cp.id) ? n.delete(cp.id) : n.add(cp.id);
                              return n;
                            });
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-right text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                            sel ? 'bg-primary/10 text-primary' : alreadyLinked ? 'bg-muted/40' : 'hover:bg-muted/50',
                          )}
                        >
                          <div className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                            sel ? 'border-primary bg-primary' : 'border-border',
                          )}>
                            {sel && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            sel ? 'bg-primary/15' : 'bg-muted',
                          )}>
                            <MapPinned className={cn('h-4 w-4', sel ? 'text-primary' : 'text-muted-foreground')} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{cp.nameAr}</p>
                            <p className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                              {cp.latitude.toFixed(4)}, {cp.longitude.toFixed(4)}
                            </p>
                          </div>
                          {alreadyLinked && (
                            <Badge variant="subtle" className="shrink-0 text-[9px]">مرتبط</Badge>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>

                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
                  <p className="text-xs text-muted-foreground">
                    {cpSel.size > 0
                      ? <><span className="number-ar font-semibold text-foreground">{cpSel.size}</span> نقطة محددة</>
                      : 'اختر نقطة أو أكثر'}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCpOpen(false)}>إلغاء</Button>
                    <Button variant="luxe" size="sm" onClick={submitCpLink} disabled={cpSel.size === 0}>
                      <Link2 className="h-3.5 w-3.5" /> ربط
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* ── Unlink confirm dialog ── */}
            <Dialog open={!!cpUnlinkTarget} onOpenChange={o => !o && setCpUnlinkTarget(null)}>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <Unlink className="h-4 w-4" /> فك ربط النقطة
                  </DialogTitle>
                  <DialogDescription>هل تريد فك ربط هذه النقطة من الموظف؟</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setCpUnlinkTarget(null)}>إلغاء</Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                    if (cpUnlinkTarget) { removeCheckpointLink(cpUnlinkTarget); setCpUnlinkTarget(null); }
                  }}>
                    <Unlink className="h-3.5 w-3.5" /> فك الربط
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

              </section>
            )}

            {activeSection === 'leaves' && (
              <section>
                <SectionH
                  icon={Calendar}
                  title="الإجازات"
                  subtitle="رصيد الإجازات والطلبات"
                  action={
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <Link href="/hr/leaves"><ExternalLink className="h-3 w-3" />الإجازات</Link>
                    </Button>
                  }
                />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: 'سنوية', used: 9, total: 30 },
                { label: 'مرضية', used: 15, total: 60 },
                { label: 'أخرى', used: 0, total: 10 },
              ].map(b => {
                const pct = (b.used / b.total) * 100;
                return (
                  <div key={b.label} className={cn(
                      'rounded-xl border bg-card p-4 transition-all',
                      pct > 70 ? 'border-warning/40 bg-warning/5' : 'border-border/60'
                    )}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{b.label}</span>
                      <span className="font-arabic-display text-2xl font-semibold tabular-nums">
                        {b.total - b.used}
                        <span className="text-xs text-muted-foreground font-normal">/{b.total}</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', pct > 70 ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {employeeRequests.filter(r => r.type === 'leave').length > 0 ? (
              <div className="space-y-2">
                {employeeRequests.filter(r => r.type === 'leave').map(req => {
                  const isApproved = req.status === 'approved';
                  const isPending  = ['pending', 'under_review'].includes(req.status);
                  return (
                    <div key={req.id} className={cn(
                      'flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-xs',
                      isApproved ? 'border-success/30 border-r-2 border-r-success'
                      : isPending ? 'border-warning/30 border-r-2 border-r-warning'
                      : 'border-destructive/30 border-r-2 border-r-destructive'
                    )}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isApproved ? 'bg-success/10 text-success'
                          : isPending ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                        )}>
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{req.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {req.fromDate && formatDate(req.fromDate)}
                            {req.toDate && ` ← ${formatDate(req.toDate)}`}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty icon={Calendar} text="لا توجد طلبات إجازة" />
            )}
              </section>
            )}

            {activeSection === 'requests' && (
              <section>
                <SectionH
                  icon={FileText}
                  title="الطلبات"
                  subtitle={`${employeeRequests.length} طلب مسجّل`}
                />
            {employeeRequests.length > 0 ? (
              <div className="space-y-2">
                {employeeRequests.map(req => {
                  const isApproved = req.status === 'approved';
                  const isPending  = ['pending', 'under_review'].includes(req.status);
                  return (
                    <div key={req.id} className={cn(
                      'flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-xs',
                      isApproved ? 'border-success/30 border-r-2 border-r-success'
                      : isPending ? 'border-warning/30 border-r-2 border-r-warning'
                      : 'border-border/60 border-r-2 border-r-muted-foreground/25'
                    )}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isApproved ? 'bg-success/10 text-success'
                          : isPending ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                        )}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            <RequestTypeLabel type={req.type} />
                            <span className="text-muted-foreground/70 mx-1.5">·</span>
                            <span className="text-muted-foreground/80">{req.title}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(req.submittedAt)}
                            {req.requestNumber && (
                              <>
                                <span className="mx-1.5 text-muted-foreground/40">·</span>
                                <span className="font-mono">#{req.requestNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty icon={FileText} text="لا توجد طلبات" />
            )}
              </section>
            )}

            {activeSection === 'violations' && (
              <section>
                <SectionH
                  icon={AlertTriangle}
                  title="المخالفات"
                  subtitle="سجل المخالفات والإنذارات"
                  action={
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <Link href="/hr/discipline/cases"><ExternalLink className="h-3 w-3" />السجل الكامل</Link>
                    </Button>
                  }
                />
            {employeeViolations.length > 0 ? (
              <div className="space-y-2">
                {employeeViolations.map(v => {
                  const isResolved = v.status === 'closed';
                  return (
                    <div key={v.id} className={cn(
                      'flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-xs',
                      isResolved
                        ? 'border-border/60 border-r-2 border-r-muted-foreground/25'
                        : 'border-warning/30 bg-warning/5 border-r-2 border-r-warning'
                    )}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isResolved ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning'
                        )}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{v.typeNameAr}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatDate(v.date)}
                            {v.description && <> <span className="mx-1.5 text-muted-foreground/40">·</span> {v.description}</>}
                          </div>
                          {v.typeHasDeduction && (
                            <div className="text-xs text-destructive mt-0.5">
                              خصم {v.typeDeductionValue}{' '}
                              {v.typeDeductionKind === 'amount' ? 'ريال' : v.typeDeductionKind === 'day' ? 'يوم' : 'ساعة'}
                            </div>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={v.status} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty icon={Award} text="سجل نظيف — لا توجد مخالفات" />
            )}
              </section>
            )}

            {activeSection === 'contracts' && (
              <section>
                <SectionH
                  icon={FileSignature}
                  title="العقود"
                  subtitle="العقود الحالية والسابقة"
                  action={
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <Link href="/hr/employees/contracts"><ExternalLink className="h-3 w-3" />إدارة العقود</Link>
                    </Button>
                  }
                />
            {employeeContracts.length > 0 ? (
              <div className="space-y-2">
                {employeeContracts.map(c => {
                  const isActive = ['active', 'signed'].includes(c.status);
                  const isDraft  = c.status === 'draft';
                  return (
                    <Link
                      key={c.id}
                      href={`/hr/employees/contracts?contractId=${c.id}`}
                      className={cn(
                        'group flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-xs',
                        isActive ? 'border-gold/40 bg-gold/5 border-r-2 border-r-gold'
                        : isDraft ? 'border-warning/30 border-r-2 border-r-warning'
                        : 'border-border/60 border-r-2 border-r-muted-foreground/25'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isActive ? 'bg-gold/10 text-gold' : 'bg-muted text-muted-foreground'
                        )}>
                          <FileSignature className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            عقد <span className="font-mono">#{c.contractNumber}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(c.startDate)} ← {formatDate(c.endDate)}
                            <span className="mx-1.5 text-muted-foreground/40">·</span>
                            {formatCurrency(c.baseSalary)}
                            {c.allowanceLines.length > 0 && (
                              <> <span className="mx-1.5 text-muted-foreground/40">·</span> +{c.allowanceLines.length} بدلات</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={c.status} />
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Empty
                icon={FileSignature}
                text="لا توجد عقود مسجلة"
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/hr/employees/contracts">
                      <Plus className="h-3.5 w-3.5 ml-1" />
                      إضافة عقد
                    </Link>
                  </Button>
                }
              />
            )}
              </section>
            )}

            {activeSection === 'salary' && (
              <section>
                <SectionH
                  icon={Receipt}
                  title="كشوف الرواتب"
                  subtitle="كشوف الرواتب الشهرية للموظف"
                  action={
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <Link href="/payroll"><ExternalLink className="h-3 w-3" />الرواتب</Link>
                    </Button>
                  }
                />
            {employeePayslips.length > 0 ? (
              <div className="space-y-2">
                {employeePayslips.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-card px-4 py-3 transition-all hover:shadow-xs hover:border-gold/50 border-r-2 border-r-gold">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{p.month} {p.year}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.presentDays}/{p.workingDays} يوم
                          {p.lateDays > 0 && <> <span className="mx-1.5 text-muted-foreground/40">·</span> {p.lateDays} تأخير</>}
                        </div>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="font-arabic-display font-semibold text-sm tabular-nums text-gold">{formatCurrency(p.net)}</div>
                      <div className="text-[10px] text-muted-foreground">صافي</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon={Receipt} text="لا توجد كشوف رواتب" />
            )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
