export interface Registration {
  id: string;
  tenant: string;
  initials: string;
  plan: string;
  /** Tenant status: Active | Suspended | Inactive (real values from the DB). */
  status: string;
  date: string;
}

export interface Tenant {
  name: string;
  users: number;
  percentage: number;
}
