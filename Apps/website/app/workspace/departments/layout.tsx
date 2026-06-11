import { requirePermissionServer } from "@/lib/requirePermissionServer";
import { PERMISSIONS } from "@/lib/permissionGuards";

export default async function DepartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermissionServer(PERMISSIONS.VIEW_EMPLOYEES);
  return children;
}
