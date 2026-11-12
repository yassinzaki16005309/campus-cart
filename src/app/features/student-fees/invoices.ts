import { Injectable, inject, signal } from '@angular/core';
import { Invoice } from '../../core/models/invoice.model';
import { Storage } from '../../core/services/storage';
import { StoreIncome, today } from '../store/store-income';

export const INVOICES_KEY = 'campusCartInvoices';
export const STORE_PARTS_KEY = 'campusCartInvoiceStoreParts';

// How much of an invoice came from store purchases, and whether its
// Bookstore income has already been recorded (prevents double counting).
export interface StorePart {
  amount: number;
  recorded: boolean;
}
type StoreParts = Record<number, StorePart>;

@Injectable({ providedIn: 'root' })
export class Invoices {
  private storage = inject(Storage);
  private income = inject(StoreIncome);

  invoices = signal<Invoice[]>(this.storage.getLocal<Invoice[]>(INVOICES_KEY) ?? []);

  private save(list: Invoice[]): void {
    this.invoices.set(list);
    this.storage.setLocal(INVOICES_KEY, list);
  }

  private loadParts(): StoreParts {
    return this.storage.getLocal<StoreParts>(STORE_PARTS_KEY) ?? {};
  }

  private nextId(): number {
    return this.invoices().reduce((max, i) => Math.max(max, i.id), 0) + 1;
  }

  // Normal fee invoice (no store part)
  create(studentId: number, description: string, amount: number, dueDate: string): Invoice | null {
    if (!description.trim() || !(amount > 0) || !dueDate) {
      return null;
    }
    const invoice: Invoice = {
      id: this.nextId(), studentId, description: description.trim(), amount,
      status: 'unpaid', issueDate: today(), dueDate,
    };
    this.save([...this.invoices(), invoice]);
    return invoice;
  }

  // Store purchase put on the student's account: NOT income yet.
  // Added to the student's open store invoice, or a new one is created.
  addStorePurchase(studentId: number, amount: number): Invoice | null {
    if (!(amount > 0)) {
      return null;
    }
    const parts = this.loadParts();
    const open = this.invoices().find(
      i => i.studentId === studentId && i.status === 'unpaid' && parts[i.id]
    );

    let result: Invoice;
    if (open) {
      result = { ...open, amount: open.amount + amount };
      this.save(this.invoices().map(i => (i.id === open.id ? result : i)));
      parts[open.id] = { ...parts[open.id], amount: parts[open.id].amount + amount };
    } else {
      const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      result = {
        id: this.nextId(), studentId, description: 'Campus store purchases',
        amount, status: 'unpaid', issueDate: today(), dueDate: due,
      };
      this.save([...this.invoices(), result]);
      parts[result.id] = { amount, recorded: false };
    }
    this.storage.setLocal(STORE_PARTS_KEY, parts);
    return result;
  }

  // Marks an invoice paid. Only now is the store part real income.
  markPaid(id: number): boolean {
    const invoice = this.invoices().find(i => i.id === id);
    if (!invoice || invoice.status === 'paid') {
      return false;
    }
    this.save(this.invoices().map(i => (i.id === id ? { ...i, status: 'paid' as const } : i)));

    const parts = this.loadParts();
    const part = parts[id];
    if (part && !part.recorded) {
      this.income.recordBookstoreIncome(part.amount, `Store purchases paid via invoice #${id}`);
      parts[id] = { ...part, recorded: true };
      this.storage.setLocal(STORE_PARTS_KEY, parts);
    }
    return true;
  }
}
