import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Invoice } from '../../core/models/invoice.model';
import { Auth } from '../../core/services/auth';
import { Invoices } from './invoices';

@Component({
  selector: 'app-student-fees',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './student-fees.html',
  styleUrl: './student-fees.css',
})
export class StudentFees {
  private auth = inject(Auth);
  private invoiceService = inject(Invoices);

  filter = signal<'all' | 'paid' | 'unpaid'>('all');
  message = signal('');

  // Create-invoice form values
  newStudentId = signal<number | null>(null);
  newDescription = signal('');
  newAmount = signal<number | null>(null);
  newDueDate = signal('');

  isAdmin = computed(() => this.auth.hasRole('admin'));

  // Admin sees every invoice; a student sees only their own
  visibleInvoices = computed<Invoice[]>(() => {
    const user = this.auth.currentUser();
    return this.invoiceService.invoices().filter(i =>
      (this.isAdmin() || i.studentId === user?.id) &&
      (this.filter() === 'all' || i.status === this.filter())
    );
  });

  totalUnpaid = computed(() =>
    this.visibleInvoices().filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0)
  );

  createInvoice(): void {
    const studentId = this.isAdmin() ? this.newStudentId() : this.auth.currentUser()?.id ?? null;
    if (studentId === null) {
      this.message.set('Student ID is required.');
      return;
    }
    const created = this.invoiceService.create(
      studentId, this.newDescription(), this.newAmount() ?? 0, this.newDueDate()
    );
    if (!created) {
      this.message.set('Please fill description, amount and due date.');
      return;
    }
    this.message.set(`Invoice #${created.id} created.`);
    this.newDescription.set('');
    this.newAmount.set(null);
    this.newDueDate.set('');
  }

  markPaid(invoice: Invoice): void {
    if (this.invoiceService.markPaid(invoice.id)) {
      this.message.set(`Invoice #${invoice.id} marked as paid.`);
    }
  }
}
