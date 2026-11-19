
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentFees } from './student-fees';
import { Storage } from '../../core/services/storage';
import { Auth } from '../../core/services/auth';
import { Invoice } from '../../core/models/invoice.model';

describe('StudentFees', () => {
  let component: StudentFees;
  let fixture: ComponentFixture<StudentFees>;
  let storageMock: jasmine.SpyObj<Storage>;
  let auth: Auth;

  beforeEach(async () => {
    storageMock = jasmine.createSpyObj<Storage>('Storage', [
      'getLocal',
      'setLocal',
      'getSession',
      'setSession',
      'removeSession'
    ]);

    storageMock.getLocal.and.returnValue(null);
    storageMock.getSession.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [StudentFees],
      providers: [
        { provide: Storage, useValue: storageMock }
      ]
    }).compileComponents();

    auth = TestBed.inject(Auth);
    auth.login('student', 'Student123');

    fixture = TestBed.createComponent(StudentFees);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  const createInvoice = (
    id: number,
    studentId: number,
    status: 'paid' | 'unpaid',
    description = 'Tuition fees'
  ): Invoice => ({
    id,
    studentId,
    description,
    amount: 1000,
    status,
    issueDate: '2026-11-01',
    dueDate: '2026-12-01'
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty invoice list when no invoices are saved', () => {
    expect(component.invoices()).toEqual([]);
    expect(component.myInvoices()).toEqual([]);
  });

  it('should show students only their own invoices', () => {
    component.invoices.set([
      createInvoice(1, 3, 'unpaid'),
      createInvoice(2, 4, 'unpaid')
    ]);

    expect(component.myInvoices().length).toBe(1);
    expect(component.myInvoices()[0].studentId).toBe(3);
  });

  it('should allow admins to see all invoices', () => {
    auth.login('admin', 'Admin123');

    component.invoices.set([
      createInvoice(1, 3, 'unpaid'),
      createInvoice(2, 4, 'paid')
    ]);

    expect(component.myInvoices().length).toBe(2);
  });

  it('should allow accountants to see all invoices', () => {
    auth.login('accountant', 'Account123');

    component.invoices.set([
      createInvoice(1, 3, 'unpaid'),
      createInvoice(2, 4, 'paid')
    ]);

    expect(component.myInvoices().length).toBe(2);
  });

  it('should separate unpaid and paid invoices', () => {
    component.invoices.set([
      createInvoice(1, 3, 'unpaid'),
      createInvoice(2, 3, 'paid'),
      createInvoice(3, 3, 'unpaid')
    ]);

    expect(component.unpaidInvoices().length).toBe(2);
    expect(component.paidInvoices().length).toBe(1);
  });

  it('should create and save a new invoice', () => {
    component.description = 'Semester tuition';
    component.amount = 5000;
    component.createInvoice();

    expect(component.invoices().length).toBe(1);
    expect(component.invoices()[0]).toEqual(jasmine.objectContaining({
      id: 1,
      studentId: 3,
      description: 'Semester tuition',
      amount: 5000,
      status: 'unpaid'
    }));

    expect(storageMock.setLocal).toHaveBeenCalledWith(
      'campusCartInvoices',
      jasmine.any(Array)
    );
    expect(component.successMessage()).toBe('Invoice created successfully.');
  });

  it('should trim whitespace from the invoice description', () => {
    component.description = '  Semester tuition  ';
    component.amount = 5000;
    component.createInvoice();

    expect(component.invoices()[0].description).toBe('Semester tuition');
  });

  it('should reject an empty description or invalid amount', () => {
    component.description = '';
    component.amount = 500;
    component.createInvoice();

    expect(component.invoices()).toEqual([]);
    expect(component.errorMessage()).toBe(
      'Please enter a description and a valid amount.'
    );

    component.description = 'Tuition';
    component.amount = 0;
    component.createInvoice();

    expect(component.invoices()).toEqual([]);
  });

  it('should reject invoice creation without a due date', () => {
    component.description = 'Tuition';
    component.amount = 500;
    component.dueDate = '';

    component.createInvoice();

    expect(component.invoices()).toEqual([]);
    expect(component.errorMessage()).toBe('Please select a due date.');
  });

  it('should reject invoice creation when the user is logged out', () => {
    auth.logout();

    component.description = 'Tuition';
    component.amount = 500;
    component.createInvoice();

    expect(component.invoices()).toEqual([]);
    expect(component.errorMessage()).toBe('Please log in first.');
  });

  it('should assign the next invoice ID based on existing invoices', () => {
    component.invoices.set([
      createInvoice(5, 3, 'paid'),
      createInvoice(8, 3, 'unpaid')
    ]);

    component.description = 'New tuition invoice';
    component.amount = 2000;
    component.createInvoice();

    expect(component.invoices()[2].id).toBe(9);
  });

  it('should mark an unpaid invoice as paid and save the change', () => {
    const invoice = createInvoice(1, 3, 'unpaid');
    component.invoices.set([invoice]);

    component.markAsPaid(invoice);

    expect(component.invoices()[0].status).toBe('paid');
    expect(storageMock.setLocal).toHaveBeenCalledWith(
      'campusCartInvoices',
      jasmine.arrayContaining([
        jasmine.objectContaining({
          id: 1,
          status: 'paid'
        })
      ])
    );
    expect(component.successMessage()).toBe('Payment recorded successfully.');
  });

  it('should not process an invoice that is already paid', () => {
    const invoice = createInvoice(1, 3, 'paid');
    component.invoices.set([invoice]);

    component.markAsPaid(invoice);

    expect(storageMock.setLocal).not.toHaveBeenCalled();
  });

  it('should record Bookstore income when a store purchase invoice is paid', () => {
    const invoice = createInvoice(
      1,
      3,
      'unpaid',
      'Campus store purchase'
    );
    component.invoices.set([invoice]);

    component.markAsPaid(invoice);

    expect(storageMock.setLocal).toHaveBeenCalledWith(
      'campusCartTransactions',
      jasmine.arrayContaining([
        jasmine.objectContaining({
          department: 'Bookstore',
          type: 'income',
          amount: invoice.amount,
          description: 'Campus store purchase - Invoice #1'
        })
      ])
    );
  });

  it('should not record Bookstore income for ordinary tuition invoices', () => {
    const invoice = createInvoice(1, 3, 'unpaid', 'Tuition fees');
    component.invoices.set([invoice]);

    component.markAsPaid(invoice);

    expect(storageMock.setLocal).not.toHaveBeenCalledWith(
      'campusCartTransactions',
      jasmine.anything()
    );
  });
});
