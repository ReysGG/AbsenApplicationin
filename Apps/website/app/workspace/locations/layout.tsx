import { requirePermissionServer } from "@/lib/requirePermissionServer";
import { PERMISSIONS } from "@/lib/permissionGuards";

export default async function LocationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermissionServer(PERMISSIONS.MANAGE_LOCATIONS);
  return children;
}
