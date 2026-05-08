import { notFound } from 'next/navigation';
import { isDisciplineSection, hrDisciplineSections } from '@/lib/hr-discipline/types';
import { HRDisciplineSectionRoot } from '@/features/hr/discipline/components/discipline-section-root';

export function generateStaticParams() {
  return hrDisciplineSections.map((s) => ({ section: s.slug }));
}

export default async function DisciplineSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isDisciplineSection(section)) notFound();
  const meta = hrDisciplineSections.find((s) => s.slug === section)!;
  return <HRDisciplineSectionRoot section={section} titleAr={meta.titleAr} titleEn={meta.titleEn} />;
}
