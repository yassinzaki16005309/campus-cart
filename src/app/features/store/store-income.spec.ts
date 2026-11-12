import { TestBed } from '@angular/core/testing';
import { StoreIncome, TRANSACTIONS_KEY } from './store-income';
import { Transaction } from '../../core/models/transaction.model';

describe('StoreIncome', () => {
  let service: StoreIncome;

  const saved = (): Transaction[] => JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) ?? '[]');

  beforeEach(() => {
    localStorage.clear(); // fresh state for every test
    service = TestBed.inject(StoreIncome);
  });

  it('writes a Bookstore income transaction with the agreed shape', () => {
    service.recordBookstoreIncome(120, 'Pens');

    expect(saved()).toEqual([
      { id: 1, department: 'Bookstore', type: 'income', amount: 120, date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), description: 'Pens' },
    ]);
  });

  it('uses max id + 1, even when ids are not in order', () => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([
      { id: 7, department: 'IT', type: 'expense', amount: 5, date: '2026-11-01', description: 'x' },
      { id: 3, department: 'Library', type: 'income', amount: 9, date: '2026-11-01', description: 'y' },
    ]));

    const added = service.recordBookstoreIncome(50, 'Hoodie');

    expect(added?.id).toBe(8);
  });

  it("keeps other departments' transactions when adding", () => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([
      { id: 1, department: 'IT', type: 'expense', amount: 5, date: '2026-11-01', description: 'x' },
    ]));

    service.recordBookstoreIncome(50, 'Hoodie');

    expect(saved().length).toBe(2);
    expect(saved()[0].department).toBe('IT');
  });

  it('reads the latest list each time (picks up changes made by the Budget page)', () => {
    service.recordBookstoreIncome(10, 'a');
    const list = saved();
    list.push({ id: 2, department: 'IT', type: 'expense', amount: 1, date: '2026-11-01', description: 'b' });
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));

    const added = service.recordBookstoreIncome(10, 'c');

    expect(added?.id).toBe(3);
    expect(saved().length).toBe(3);
  });

  it.each([0, -5, NaN])('writes nothing for amount %s', amount => {
    expect(service.recordBookstoreIncome(amount, 'bad')).toBeNull();
    expect(localStorage.getItem(TRANSACTIONS_KEY)).toBeNull();
  });

  it('uses the current date in yyyy-mm-dd format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T10:00:00Z'));

    service.recordBookstoreIncome(10, 'a');

    expect(saved()[0].date).toBe('2026-11-12');
    vi.useRealTimers();
  });
});
