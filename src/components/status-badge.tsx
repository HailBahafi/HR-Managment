import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Eye, Pause, AlertCircle } from 'lucide-react';

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'gold' | 'subtle'; icon?: React.ElementType }> = {
    active: { label: 'نشط', variant: 'success', icon: Check },
    suspended: { label: 'موقوف', variant: 'warning', icon: Pause },
    ended: { label: 'منتهي', variant: 'subtle', icon: X },
    pending: { label: 'قيد الانتظار', variant: 'warning', icon: Clock },
    approved: { label: 'موافق عليه', variant: 'success', icon: Check },
    rejected: { label: 'مرفوض', variant: 'destructive', icon: X },
    'in-review': { label: 'قيد المراجعة', variant: 'gold', icon: Eye },
    present: { label: 'حاضر', variant: 'success', icon: Check },
    absent: { label: 'غائب', variant: 'destructive', icon: X },
    late: { label: 'متأخر', variant: 'warning', icon: Clock },
    'early-leave': { label: 'خروج مبكر', variant: 'warning', icon: AlertCircle },
    'on-leave': { label: 'في إجازة', variant: 'secondary', icon: Pause },
    draft: { label: 'مسودة', variant: 'subtle' },
    processing: { label: 'قيد المعالجة', variant: 'gold', icon: Clock },
    completed: { label: 'مكتمل', variant: 'success', icon: Check },
  };

  const c = config[status] || { label: status, variant: 'subtle' as const };
  const Icon = c.icon;

  return (
    <Badge variant={c.variant} className={cn('gap-1')}>
      {Icon && <Icon className="h-3 w-3" />}
      {c.label}
    </Badge>
  );
}

export function ContractTypeLabel({ type }: { type: string }) {
  const map: Record<string, string> = {
    permanent: 'دائم',
    temporary: 'مؤقت',
    'part-time': 'جزئي',
    contract: 'تعاقد',
  };
  return <span>{map[type] || type}</span>;
}

export function RequestTypeLabel({ type }: { type: string }) {
  const map: Record<string, string> = {
    leave: 'إجازة',
    permission: 'استئذان',
    advance: 'سلفة مالية',
    'salary-letter': 'خطاب تعريف',
    equipment: 'طلب معدات',
    'attendance-correction': 'تصحيح حضور',
  };
  return <span>{map[type] || type}</span>;
}
