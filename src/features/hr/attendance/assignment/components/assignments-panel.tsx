'use client';

import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { useAssignmentsPanelModel } from '@/features/hr/attendance/assignment/hooks/useAssignmentsPanelModel';
import { AssignmentsBatchCard } from '@/features/hr/attendance/assignment/components/assignments-batch-card';
import { AssignmentsBatchDialog } from '@/features/hr/attendance/assignment/components/assignments-batch-dialog';

export function AssignmentsPanel() {
  const model = useAssignmentsPanelModel();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="luxe" className="gap-2" type="button" onClick={model.openNew}>
          <Plus className="h-4 w-4" />
          ربط قالب جديد
        </Button>
      </div>

      {model.batches.length === 0 ? (
        <EmptyStateCard icon={Users} title="لا توجد دفعات تعيين بعد" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {model.batches.map((batch) => (
            <AssignmentsBatchCard
              key={batch.batchId}
              batch={batch}
              shiftTemplates={model.shiftTemplates}
              onRemoveBatch={model.removeAssignmentBatch}
            />
          ))}
        </div>
      )}

      <AssignmentsBatchDialog model={model} />
    </div>
  );
}
