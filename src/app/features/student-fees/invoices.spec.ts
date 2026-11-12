import { TestBed } from '@angular/core/testing';
import { Invoices, STORE_PARTS_KEY } from './invoices';
import { StoreIncome } from '../store/store-income';

describe('Invoices (with a fake StoreIncome)', () => {
  // Test double: lets us check exactly when income is recorded
  const income = { recordBookstoreIncome: vi.fn() };
  let service: Invoices;

  beforeEach(() => {
    localStorage.clear();
    income.recordBookstoreIncome.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: StoreIncome, useValue: income }],
    });
    service = TestBed.inject(Invoices);
  });

  it('creates a normal invoice as unpaid and saves it', () => {
    const inv = service.create(3, 'Tuition', 1000, '2026-12-01');

    expect(inv).toMatchObject({ id: 1, studentId: 3, amount: 1000, status: 'unpaid' });
    expect(JSON.parse(localStorage.getItem('campusCartInvoices')!).length).toBe(1);
  });

  it('rejects an invalid invoice', () => {
    expect(service.create(3, '  ', 100, '2026-12-01')).toBeNull();
    expect(service.create(3, 'Fee', 0, '2026-12-01')).toBeNull();
    expect(service.create(3, 'Fee', 100, '')).toBeNull();
    expect(service.invoices().length).toBe(0);
  });

  it('records no income when a store purchase is added to an unpaid invoice', () => {
    service.addStorePurchase(3, 200);

    expect(income.recordBookstoreIncome).not.toHaveBeenCalled();
  });

  it('merges store purchases into one open invoice for the same student', () => {
    service.addStorePurchase(3, 200);
    service.addStorePurchase(3, 100);
    service.addStorePurchase(4, 50);

    expect(service.invoices().length).toBe(2);
    expect(service.invoices()[0].amount).toBe(300);
  });

  it('records income only for the store part when the invoice is paid', () => {
    const fee = service.create(3, 'Tuition', 1000, '2026-12-01')!;
    const store = service.addStorePurchase(3, 200)!;

    service.markPaid(fee.id); // no store part -> no income
    expect(income.recordBookstoreIncome).not.toHaveBeenCalled();

    service.markPaid(store.id);
    expect(income.recordBookstoreIncome).toHaveBeenCalledTimes(1);
    expect(income.recordBookstoreIncome).toHaveBeenCalledWith(200, expect.stringContaining(`#${store.id}`));
  });

  it('never counts the same purchase twice', () => {
    const store = service.addStorePurchase(3, 200)!;

    expect(service.markPaid(store.id)).toBe(true);
    expect(service.markPaid(store.id)).toBe(false); // already paid
    expect(income.recordBookstoreIncome).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(STORE_PARTS_KEY)!)[store.id].recorded).toBe(true);
  });

  it('starts a new invoice for purchases made after the old one was paid', () => {
    const first = service.addStorePurchase(3, 200)!;
    service.markPaid(first.id);

    const second = service.addStorePurchase(3, 80)!;

    expect(second.id).not.toBe(first.id);
    service.markPaid(second.id);
    expect(income.recordBookstoreIncome).toHaveBeenCalledTimes(2);
    expect(income.recordBookstoreIncome).toHaveBeenLastCalledWith(80, expect.any(String));
  });

  it('returns false for an unknown invoice id', () => {
    expect(service.markPaid(99)).toBe(false);
  });
});
