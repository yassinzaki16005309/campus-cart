import { Injectable, inject } from '@angular/core';
import { Transaction } from '../../core/models/transaction.model';
import { Storage } from '../../core/services/storage';

// Shared localStorage key agreed with Member 3 (Department Budget)
export const TRANSACTIONS_KEY = 'campusCartTransactions';

// Today as yyyy-mm-dd
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class StoreIncome {
  private storage = inject(Storage);

  // Adds ONE Bookstore income transaction to the shared list.
  // Call it only when money has really been received.
  recordBookstoreIncome(amount: number, description: string): Transaction | null {
    if (!Number.isFinite(amount) || amount <= 0) {
      return null; // nothing received, nothing recorded
    }

    // Read the latest list first, so we never overwrite Member 3's data
    const list = this.storage.getLocal<Transaction[]>(TRANSACTIONS_KEY) ?? [];
    const id = list.reduce((max, t) => Math.max(max, t.id), 0) + 1;

    const transaction: Transaction = {
      id,
      department: 'Bookstore',
      type: 'income',
      amount,
      date: today(),
      description,
    };

    this.storage.setLocal(TRANSACTIONS_KEY, [...list, transaction]);
    return transaction;
  }
}
