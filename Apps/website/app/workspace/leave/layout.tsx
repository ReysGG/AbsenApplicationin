import { requirePermissionServer } from "@/lib/requirePermissionServer";
import { PERMISSIONS } from "@/lib/permissionGuards";

export default async function LeaveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermissionServer(PERMISSIONS.APPROVE_LEAVE);
  return children;
}
