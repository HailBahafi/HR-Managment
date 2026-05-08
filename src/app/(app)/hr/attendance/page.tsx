import { Suspense } from 'react';
import { AttendanceClient } from './attendance-client';

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-24 rounded-lg bg-muted/40" />
          <div className="h-12 rounded-full bg-muted/30" />
          <div className="h-96 rounded-lg bg-muted/30" />
        </div>
      }
    >
      <AttendanceClient />
    </Suspense>
  );
}
