import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentFees } from './student-fees';
import { Auth } from '../../core/services/auth';
import { Invoices } from './invoices';
import { TRANSACTIONS_KEY } from '../store/store-income';

describe('StudentFees', () => {
  let fixture: ComponentFixture<StudentFees>;
  let component: StudentFees;
  let el: HTMLElement;
  let invoices: Invoices;

  const transactions = () => JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) ?? '[]');
  const rows = () => el.querySelectorAll('.invoice-row');

  async function setup(username: string, password: string) {
    await TestBed.configureTestingModule({ imports: [StudentFees] }).compileComponents();
    TestBed.inject(Auth).login(username, password);
    invoices = TestBed.inject(Invoices);
    fixture = TestBed.createComponent(StudentFees);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should create and show an empty message when there are no invoices', async () => {
    await setup('student', 'Student123');

    expect(component).toBeTruthy();
    expect(el.querySelector('.fees__empty')).not.toBeNull();
  });

  it('a student creates an invoice for themselves', async () => {
    await setup('student', 'Student123');
    component.newDescription.set('Lab fee');
    component.newAmount.set(300);
    component.newDueDate.set('2026-12-20');
    component.createInvoice();
    await fixture.whenStable();

    expect(rows().length).toBe(1);
    expect(invoices.invoices()[0].studentId).toBe(3);
    expect(component.newDescription()).toBe(''); // form reset
  });

  it('shows an error for an incomplete form', async () => {
    await setup('student', 'Student123');
    component.createInvoice();

    expect(component.message()).toContain('fill');
    expect(invoices.invoices().length).toBe(0);
  });

  it('a student only sees their own invoices, an admin sees all', async () => {
    localStorage.clear();
    await setup('student', 'Student123');
    invoices.create(3, 'Mine', 100, '2026-12-01');
    invoices.create(9, 'Someone else', 100, '2026-12-01');
    fixture.detectChanges();
    expect(component.visibleInvoices().length).toBe(1);

    TestBed.inject(Auth).login('admin', 'Admin123');
    expect(component.visibleInvoices().length).toBe(2);
  });

  it('clicking Mark paid changes the status and hides the button', async () => {
    await setup('student', 'Student123');
    invoices.create(3, 'Tuition', 1000, '2026-12-01');
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('.invoice-row__pay')!.click();
    await fixture.whenStable();

    expect(el.querySelector('.invoice-row__status')?.textContent).toContain('paid');
    expect(el.querySelector('.invoice-row__pay')).toBeNull();
    expect(transactions().length).toBe(0); // fee invoice: no Bookstore income
  });

  it('paying an invoice that has store purchases records Bookstore income once', async () => {
    await setup('student', 'Student123');
    invoices.create(3, 'Tuition', 1000, '2026-12-01');
    const store = invoices.addStorePurchase(3, 250)!;
    await fixture.whenStable();

    component.markPaid(store);
    component.markPaid(store); // second click must do nothing

    expect(transactions().length).toBe(1);
    expect(transactions()[0]).toMatchObject({ department: 'Bookstore', type: 'income', amount: 250 });
  });

  it('filters the history by status', async () => {
    await setup('student', 'Student123');
    const a = invoices.create(3, 'A', 10, '2026-12-01')!;
    invoices.create(3, 'B', 20, '2026-12-01');
    invoices.markPaid(a.id);

    component.filter.set('paid');
    expect(component.visibleInvoices().map(i => i.description)).toEqual(['A']);
    component.filter.set('unpaid');
    expect(component.visibleInvoices().map(i => i.description)).toEqual(['B']);
    expect(component.totalUnpaid()).toBe(20);
  });
});
