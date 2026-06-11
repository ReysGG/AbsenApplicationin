import { requirePermissionServer } from "@/lib/requirePermissionServer";
import { PERMISSIONS } from "@/lib/permissionGuards";

export default async function ExportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermissionServer(PERMISSIONS.EXPORT_REPORTS);
  return children;
}
