import { redirect } from 'next/navigation';
import { hrContractsRoutes } from '@/features/hr/contracts/constants/routes';

export default function ContractsRootPage() {
  redirect(hrContractsRoutes.employment);
}
