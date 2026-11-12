import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Transaction, TransactionType } from '../../core/models/transaction.model'; 
import { Storage } from '../../core/services/storage';
import { ChartData } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

const STORAGE_KEY = 'campusCartTransactions';

@Component({
  selector: 'app-budget',
  imports: [FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class Budget {
  private storage = inject(Storage);

  departments = ['Bookstore', 'IT', 'Library', 'Administration'];

  // The shared list, read from localStorage (empty list if nothing saved yet)
  transactions = signal<Transaction[]>(
    this.storage.getLocal<Transaction[]>(STORAGE_KEY) ?? []
  );

  selectedDepartment = signal('Bookstore');

  // Only the transactions of the selected department
  departmentTransactions = computed(() =>
    this.transactions().filter(t => t.department === this.selectedDepartment())
  );

  totalIncome = computed(() =>
    this.departmentTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  totalExpenses = computed(() =>
    this.departmentTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  balance = computed(() => this.totalIncome() - this.totalExpenses());

    // Data for the bar chart: recalculated whenever the totals change
  barChartData = computed<ChartData<'bar'>>(() => ({
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [this.totalIncome(), this.totalExpenses()],
        label: this.selectedDepartment(),
        backgroundColor: ['#2e9e6b', '#d9534f'],
      },
    ],
  }));

    // Data for the doughnut chart (same totals, shown as shares)
  doughnutChartData = computed<ChartData<'doughnut'>>(() => ({
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [this.totalIncome(), this.totalExpenses()],
        backgroundColor: ['#2e9e6b', '#d9534f'],
      },
    ],
  }));

    // Values typed into the "add transaction" form
  newType = signal<TransactionType>('income');
  newAmount = signal<number | null>(null);
  newDate = signal('');
  newDescription = signal('');
  errorMessage = signal('');

  addTransaction(): void {
    const amount = this.newAmount();

    // Basic check: do not save incomplete or invalid data
    if (amount === null || amount <= 0 || !this.newDate() || !this.newDescription().trim()) {
      this.errorMessage.set('Please enter a positive amount, a date and a description.');
      return;
    }

    const list = this.transactions();
    const nextId = list.length > 0 ? Math.max(...list.map(t => t.id)) + 1 : 1;

    const transaction: Transaction = {
      id: nextId,
      department: this.selectedDepartment(),
      type: this.newType(),
      amount: amount,
      date: this.newDate(),
      description: this.newDescription().trim(),
    };

    const updatedList = [...list, transaction];
    this.transactions.set(updatedList);
    this.storage.setLocal(STORAGE_KEY, updatedList);

    // Clear the form
    this.newAmount.set(null);
    this.newDate.set('');
    this.newDescription.set('');
    this.errorMessage.set('');
  }
  deleteTransaction(id: number): void {
    const updatedList = this.transactions().filter(t => t.id !== id);
    this.transactions.set(updatedList);
    this.storage.setLocal(STORAGE_KEY, updatedList);
}
 
}