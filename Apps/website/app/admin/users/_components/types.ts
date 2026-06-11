export interface AdminUser {
  id: string;
  name: string;
  email: string;
  // Platform roles map to backend globalRole (super_admin / admin_platform).
  role: "Super Admin" | "Platform Admin";
  status: "Active" | "Inactive";
  lastActive: string;
}
