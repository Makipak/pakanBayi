import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell, type NavItem } from "@/components/AppShell";
import { IconHome } from "@/components/icons";

const navItems: NavItem[] = [
  { href: "/kader/dashboard", label: "Beranda", icon: <IconHome /> },
];

export default async function KaderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "KADER") redirect("/login");

  return (
    <AppShell navItems={navItems} userName={session.user.name ?? ""} roleLabel="Kader Posyandu">
      {children}
    </AppShell>
  );
}
