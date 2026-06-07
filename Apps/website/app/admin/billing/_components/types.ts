export interface Invoice {
  id: string;
  tenant: string;
  plan: "Enterprise" | "Pro" | "Basic";
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  dueDate: string;
  issuedDate: string;
}
