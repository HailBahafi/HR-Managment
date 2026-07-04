import { Toaster } from 'sonner';

export default function LauncherLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" dir="rtl" closeButton />
    </>
  );
}
