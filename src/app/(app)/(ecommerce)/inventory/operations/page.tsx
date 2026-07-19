import { redirect } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

/** المسار القديم — يُحوَّل لأول صفحة عمليات مستقلة */
export default function InventoryOperationsIndexPage() {
  redirect(ecommerceAdminRoutes.operations);
}
