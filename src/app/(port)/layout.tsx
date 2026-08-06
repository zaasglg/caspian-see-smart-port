import { AppShell } from '@/components/AppShell';

export default function PortLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
