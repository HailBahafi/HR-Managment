import { redirect } from 'next/navigation';

type Search = { [key: string]: string | string[] | undefined };

export default async function HrAttendanceAliasPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const section = typeof sp.section === 'string' ? sp.section : 'templates';
  const safe = ['templates', 'assignment', 'daily', 'checkpoints', 'checkpoint-links'].includes(section) ? section : 'templates';
  redirect(`/attendance?section=${encodeURIComponent(safe)}`);
}
