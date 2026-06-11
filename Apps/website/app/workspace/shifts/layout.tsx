import { requirePermissionServer } from "@/lib/requirePermissionServer";
import { PERMISSIONS } from "@/lib/permissionGuards";

export default async function ShiftsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermissionServer(PERMISSIONS.MANAGE_SHIFTS);
  return children;
}
