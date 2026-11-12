import { TestBed } from '@angular/core/testing';
import { Budget } from './budget';
import { Transaction } from '../../core/models/transaction.model';

const KEY = 'campusCartTransactions';

describe('Budget', () => {
  // Creates the component. Optionally puts transactions in localStorage first,
  // like the Campus Store would do.
  async function createBudget(saved: Transaction[] = []): Promise<Budget> {
    localStorage.setItem(KEY, JSON.stringify(saved));
    await TestBed.configureTestingModule({ imports: [Budget] }).compileComponents();
    const fixture = TestBed.createComponent(Budget);
    return fixture.componentInstance;
  }

  // Fills the form fields and clicks "Add"
  function addTransaction(
    budget: Budget,
    type: 'income' | 'expense',
    amount: number
  ): void {
    budget.newType.set(type);
    budget.newAmount.set(amount);
    budget.newDate.set('2026-11-10');
    budget.newDescription.set('Test transaction');
    budget.addTransaction();
  }

  beforeEach(() => localStorage.clear());

  it('should create with zero totals when nothing is saved', async () => {
    const budget = await createBudget();
    expect(budget).toBeTruthy();
    expect(budget.totalIncome()).toBe(0);
    expect(budget.totalExpenses()).toBe(0);
    expect(budget.balance()).toBe(0);
  });

  it('should add an income transaction', async () => {
    const budget = await createBudget();
    addTransaction(budget, 'income', 450);

    expect(budget.transactions().length).toBe(1);
    expect(budget.transactions()[0].type).toBe('income');
    expect(budget.totalIncome()).toBe(450);
    // It must also be saved in the shared localStorage list
    expect(JSON.parse(localStorage.getItem(KEY)!).length).toBe(1);
  });

  it('should add an expense transaction', async () => {
    const budget = await createBudget();
    addTransaction(budget, 'expense', 100);

    expect(budget.transactions()[0].type).toBe('expense');
    expect(budget.totalExpenses()).toBe(100);
  });

  it('should calculate balance as income minus expenses', async () => {
    const budget = await createBudget();
    addTransaction(budget, 'income', 450);
    addTransaction(budget, 'expense', 100);

    expect(budget.totalIncome()).toBe(450);
    expect(budget.totalExpenses()).toBe(100);
    expect(budget.balance()).toBe(350);
  });

  it('should only count transactions of the selected department', async () => {
    const budget = await createBudget([
      { id: 1, department: 'Bookstore', type: 'income', amount: 200, date: '2026-11-01', description: 'a' },
      { id: 2, department: 'IT', type: 'income', amount: 999, date: '2026-11-01', description: 'b' },
    ]);

    budget.selectedDepartment.set('Bookstore');
    expect(budget.totalIncome()).toBe(200);

    budget.selectedDepartment.set('IT');
    expect(budget.totalIncome()).toBe(999);
  });

  it('should include Bookstore income saved by the Campus Store', async () => {
    // A transaction in the format agreed with Member 4
    const storeSale: Transaction = {
      id: 1,
      department: 'Bookstore',
      type: 'income',
      amount: 75,
      date: '2026-11-11',
      description: 'Store purchase',
    };
    const budget = await createBudget([storeSale]);

    budget.selectedDepartment.set('Bookstore');
    expect(budget.totalIncome()).toBe(75);
    expect(budget.balance()).toBe(75);
  });

  it('should update the chart data when transactions change', async () => {
    const budget = await createBudget();
    expect(budget.barChartData().datasets[0].data).toEqual([0, 0]);

    addTransaction(budget, 'income', 450);
    expect(budget.barChartData().datasets[0].data).toEqual([450, 0]);
    expect(budget.doughnutChartData().datasets[0].data).toEqual([450, 0]);

    addTransaction(budget, 'expense', 100);
    expect(budget.barChartData().datasets[0].data).toEqual([450, 100]);
    expect(budget.doughnutChartData().datasets[0].data).toEqual([450, 100]);
  });

  it('should delete a transaction', async () => {
    const budget = await createBudget();
    addTransaction(budget, 'income', 450);
    const id = budget.transactions()[0].id;

    budget.deleteTransaction(id);

    expect(budget.transactions().length).toBe(0);
    expect(budget.totalIncome()).toBe(0);
  });
});