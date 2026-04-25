import { redirect } from 'next/navigation';
import { hrDisciplineSections } from '@/lib/hr-discipline/types';

export default function DisciplinePage() {
  redirect(`/hr/discipline/${hrDisciplineSections[0].slug}`);
}
