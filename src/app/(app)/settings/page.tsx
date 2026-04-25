'use client';

import * as React from 'react';
import { Shield, Users, Building2, Clock, MapPin, Plus, Edit, Trash2, Check, Settings } from 'lucide-react';
import { useSetPageTitle } from '@/components/page-title-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { data } from '@/lib/data';
import { cn } from '@/lib/utils';

const resources = [
  { id: 'employees', label: 'الموظفين', icon: Users },
  { id: 'attendance', label: 'الحضور', icon: Clock },
  { id: 'requests', label: 'الطلبات', icon: Shield },
  { id: 'payroll', label: 'الرواتب', icon: Building2 },
  { id: 'reports', label: 'التقارير', icon: MapPin },
  { id: 'settings', label: 'الإعدادات', icon: Shield },
];

const actions = ['view', 'create', 'edit', 'delete', 'approve'] as const;
const actionLabels: Record<string, string> = { view: 'عرض', create: 'إنشاء', edit: 'تعديل', delete: 'حذف', approve: 'موافقة' };

export default function SettingsPage() {
  useSetPageTitle({ titleAr: 'إعدادات النظام', descriptionAr: 'إدارة الأدوار والصلاحيات والسياسات', icon: Settings });
  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">الأدوار والصلاحيات</TabsTrigger>
          <TabsTrigger value="branches">الفروع والأقسام</TabsTrigger>
          <TabsTrigger value="shifts">سياسات الشفت</TabsTrigger>
          <TabsTrigger value="general">إعدادات عامة</TabsTrigger>
        </TabsList>

        {/* Roles */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground number-ar">{data.roles.length}</span> أدوار مُعرّفة
            </p>
            <Button variant="luxe" className="gap-2">
              <Plus className="h-4 w-4" />
              دور جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.roles.map((role) => (
              <div
                key={role.id}
                className="relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-soft"
                style={{ borderTop: `4px solid ${role.color}` }}
              >
                <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full blur-3xl" style={{ background: `${role.color}20` }} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: `${role.color}20`, color: role.color }}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <Badge variant="subtle" className="text-[10px] number-ar">{role.usersCount} مستخدم</Badge>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{role.name}</h3>
                  <p className="mt-1 min-h-[40px] text-xs leading-relaxed text-muted-foreground">{role.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((p) => (
                      <Badge key={p} variant="subtle" className="text-[10px]">{p}</Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="subtle" className="text-[10px]">+{role.permissions.length - 3}</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-border pt-3">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Edit className="h-3 w-3" /> تعديل
                    </Button>
                    <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Permission Matrix */}
          <div className="rounded-lg border border-border bg-card shadow-soft">
            <div className="border-b border-border p-5">
              <h3 className="font-display text-lg font-bold">مصفوفة الصلاحيات</h3>
              <p className="text-xs text-muted-foreground">صلاحيات كل دور على الموارد المختلفة</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 text-right">المورد</th>
                    {data.roles.map((r) => (
                      <th key={r.id} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                          <span>{r.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res, resIdx) => (
                    <tr key={res.id} className="border-b border-border/60 last:border-b-0">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <res.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{res.label}</span>
                        </div>
                      </td>
                      {data.roles.map((role, roleIdx) => {
                        const intensity = Math.max(0, 5 - Math.abs(resIdx - roleIdx)) / 5;
                        const hasAll = role.permissions.includes('all');
                        return (
                          <td key={role.id} className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              {actions.map((action) => {
                                const granted = hasAll || (intensity > 0.3 && Math.random() > 0.3);
                                return (
                                  <div
                                    key={action}
                                    title={actionLabels[action]}
                                    className={cn(
                                      'h-5 w-5 rounded transition-all',
                                      granted ? 'bg-success/80' : 'bg-muted'
                                    )}
                                  >
                                    {granted && <Check className="h-3 w-3 m-0.5 text-white" />}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 border-t border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-success/80" />
                <span>ممنوح</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-muted" />
                <span>غير ممنوح</span>
              </div>
              <span className="mr-auto">الأعمدة من اليمين: عرض · إنشاء · تعديل · حذف · موافقة</span>
            </div>
          </div>
        </TabsContent>

        {/* Branches & Departments */}
        <TabsContent value="branches" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h3 className="font-display text-lg font-bold">الفروع</h3>
                  <p className="text-xs text-muted-foreground">{data.branches.length} فروع</p>
                </div>
                <Button variant="luxe" size="sm" className="gap-2">
                  <Plus className="h-3 w-3" />
                  فرع
                </Button>
              </div>
              <div className="divide-y divide-border">
                {data.branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{branch.name}</p>
                        <p className="text-xs text-muted-foreground">{branch.city} · {branch.employeesCount} موظف</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h3 className="font-display text-lg font-bold">الأقسام</h3>
                  <p className="text-xs text-muted-foreground">{data.departments.length} أقسام</p>
                </div>
                <Button variant="luxe" size="sm" className="gap-2">
                  <Plus className="h-3 w-3" />
                  قسم
                </Button>
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {data.departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-1 rounded-full" style={{ background: dept.color }} />
                      <div>
                        <p className="font-semibold">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.employeesCount} موظف</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Shifts policies */}
        <TabsContent value="shifts" className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold mb-4">سياسات الشفت العامة</h3>
            <div className="space-y-4">
              <SettingRow label="السماح بالتوقيت المرن" description="يمكن للموظفين الحضور ضمن نطاق زمني محدد">
                <Switch defaultChecked />
              </SettingRow>
              <SettingRow label="الخصم التلقائي على التأخير" description="خصم مالي تلقائي عند تجاوز فترة السماح">
                <Switch defaultChecked />
              </SettingRow>
              <SettingRow label="السماح بالخروج المبكر" description="يتطلب موافقة المدير المباشر">
                <Switch />
              </SettingRow>
              <SettingRow label="تسجيل الحضور بالبصمة الجغرافية" description="التحقق من الموقع عند تسجيل الدخول">
                <Switch defaultChecked />
              </SettingRow>
              <SettingRow label="إشعارات التأخر اللحظية" description="إرسال تنبيه للمدير عند تأخر الموظف">
                <Switch defaultChecked />
              </SettingRow>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold mb-4">إعدادات متقدمة</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>فترة السماح الافتراضية (دقائق)</Label>
                <Input type="number" defaultValue={15} />
              </div>
              <div className="space-y-2">
                <Label>حد التأخير للخصم (دقائق)</Label>
                <Input type="number" defaultValue={30} />
              </div>
              <div className="space-y-2">
                <Label>نسبة خصم الساعة (%)</Label>
                <Input type="number" defaultValue={0.5} step={0.1} />
              </div>
              <div className="space-y-2">
                <Label>نطاق البصمة الجغرافية (متر)</Label>
                <Input type="number" defaultValue={100} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline">إلغاء</Button>
              <Button variant="luxe">حفظ التغييرات</Button>
            </div>
          </div>
        </TabsContent>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold mb-4">معلومات الشركة</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم الشركة</Label>
                <Input defaultValue="نواة" />
              </div>
              <div className="space-y-2">
                <Label>الاسم التجاري</Label>
                <Input defaultValue="Nawa" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>البريد الرسمي</Label>
                <Input defaultValue="info@nawa.sa" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>الموقع الإلكتروني</Label>
                <Input defaultValue="https://nawa.sa" dir="ltr" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold mb-4">تفضيلات النظام</h3>
            <div className="space-y-4">
              <SettingRow label="الوضع الداكن التلقائي" description="تبديل السمة حسب إعدادات النظام">
                <Switch />
              </SettingRow>
              <SettingRow label="إشعارات البريد الإلكتروني" description="تلقي تحديثات وإشعارات عبر البريد">
                <Switch defaultChecked />
              </SettingRow>
              <SettingRow label="المصادقة الثنائية" description="طبقة حماية إضافية عند تسجيل الدخول">
                <Switch defaultChecked />
              </SettingRow>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-muted/20 p-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
