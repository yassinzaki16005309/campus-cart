export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  department: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
}