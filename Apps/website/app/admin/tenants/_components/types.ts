export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: "Enterprise" | "Pro" | "Basic";
  users: number;
  status: "Active" | "Suspended";
  lastActive: string;
  mrr: number;
}
