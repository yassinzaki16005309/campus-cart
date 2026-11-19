
import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Invoice } from '../../core/models/invoice.model';
import { Transaction } from '../../core/models/transaction.model';
import { Storage } from '../../core/services/storage';
import { Auth } from '../../core/services/auth';

const INVOICES_KEY = 'campusCartInvoices';
const TRANSACTIONS_KEY = 'campusCartTransactions';

@Component({
  selector: 'app-student-fees',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './student-fees.html',
  styleUrl: './student-fees.css',
})
export class StudentFees {
  private storage = inject(Storage);
  private auth = inject(Auth);

  invoices = signal<Invoice[]>(
    this.storage.getLocal<Invoice[]>(INVOICES_KEY) ?? []
  );

  description = '';
  amount: number | null = null;
  dueDate = this.getDefaultDueDate();

  errorMessage = signal('');
  successMessage = signal('');

  // Show only the logged-in student's invoices.
  // Admins can see all invoices.
  myInvoices = computed(() => {
    const user = this.auth.currentUser();

    if (!user) {
      return [];
    }

    if (user.role === 'admin' || user.role === 'accountant') {
  return this.invoices();
}
    return this.invoices().filter(
      invoice => invoice.studentId === user.id
    );
  });

  unpaidInvoices = computed(() =>
    this.myInvoices().filter(invoice => invoice.status === 'unpaid')
  );

  paidInvoices = computed(() =>
    this.myInvoices().filter(invoice => invoice.status === 'paid')
  );

  // Create a new invoice
  createInvoice(): void {
    const user = this.auth.currentUser();

    if (!user) {
      this.errorMessage.set('Please log in first.');
      return;
    }

    if (!this.description.trim() || !this.amount || this.amount <= 0) {
      this.errorMessage.set('Please enter a description and a valid amount.');
      return;
    }

    if (!this.dueDate) {
      this.errorMessage.set('Please select a due date.');
      return;
    }

    const nextId = this.invoices().length > 0
      ? Math.max(...this.invoices().map(invoice => invoice.id)) + 1
      : 1;

    const invoice: Invoice = {
      id: nextId,
      studentId: user.id,
      description: this.description.trim(),
      amount: this.amount,
      status: 'unpaid',
      issueDate: this.getToday(),
      dueDate: this.dueDate
    };

    const updatedInvoices = [...this.invoices(), invoice];

    this.invoices.set(updatedInvoices);
    this.storage.setLocal(INVOICES_KEY, updatedInvoices);

    this.description = '';
    this.amount = null;
    this.dueDate = this.getDefaultDueDate();

    this.errorMessage.set('');
    this.successMessage.set('Invoice created successfully.');
  }

  // Mark an unpaid invoice as paid
  markAsPaid(invoice: Invoice): void {
    if (invoice.status === 'paid') {
      return;
    }

    const updatedInvoices = this.invoices().map(item =>
      item.id === invoice.id
        ? { ...item, status: 'paid' as const }
        : item
    );

    this.invoices.set(updatedInvoices);
    this.storage.setLocal(INVOICES_KEY, updatedInvoices);

    // Store purchases become Bookstore income when their invoice is paid.
    if (invoice.description === 'Campus store purchase') {
      this.recordBookstoreIncome(invoice);
    }

    this.errorMessage.set('');
    this.successMessage.set('Payment recorded successfully.');
  }

  // Add paid store purchases to the Budget transactions.
  private recordBookstoreIncome(invoice: Invoice): void {
    const transactions =
      this.storage.getLocal<Transaction[]>(TRANSACTIONS_KEY) ?? [];

    const nextId = transactions.length > 0
      ? Math.max(...transactions.map(transaction => transaction.id)) + 1
      : 1;

    const transaction: Transaction = {
      id: nextId,
      department: 'Bookstore',
      type: 'income',
      amount: invoice.amount,
      date: this.getToday(),
      description: `Campus store purchase - Invoice #${invoice.id}`
    };

    this.storage.setLocal(TRANSACTIONS_KEY, [
      ...transactions,
      transaction
    ]);
  }

  private getToday(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getDefaultDueDate(): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
