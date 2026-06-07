export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "CS Agent" | "Support" | "Billing";
  status: "Active" | "Inactive";
  lastActive: string;
}
