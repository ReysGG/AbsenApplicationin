export interface Registration {
  id: string;
  tenant: string;
  initials: string;
  plan: "Enterprise" | "Pro" | "Basic";
  status: "Active" | "Trial" | "Churned";
  date: string;
}

export interface Tenant {
  name: string;
  users: number;
  percentage: number;
}
