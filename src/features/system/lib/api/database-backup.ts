import { apiDownloadToDevice } from '@/features/hr/lib/api/client';

export type DatabaseBackupFormat = 'plain';

export const databaseBackupApi = {
  exportBackup(format: DatabaseBackupFormat = 'plain') {
    return apiDownloadToDevice('/system/database-backup/export', {
      method: 'POST',
      query: { format },
      defaultFileName: `database-backup-${new Date().toISOString().slice(0, 10)}.sql`,
    });
  },
};
