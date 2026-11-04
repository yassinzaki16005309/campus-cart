export type InvoiceStatus = 'paid' | 'unpaid';

export interface Invoice {
  id: number;
  studentId: number;
  description: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}