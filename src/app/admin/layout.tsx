import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell, type NavItem } from "@/components/AppShell";
import { IconBaby, IconDownload, IconHome, IconUsers } from "@/components/icons";

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <IconHome /> },
  { href: "/admin/balita", label: "Balita", icon: <IconBaby /> },
  { href: "/admin/kader", label: "Kader", icon: <IconUsers /> },
  { href: "/admin/export", label: "Export", icon: <IconDownload /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <AppShell navItems={navItems} userName={session.user.name ?? ""} roleLabel="SPV Kader">
      {children}
    </AppShell>
  );
}
