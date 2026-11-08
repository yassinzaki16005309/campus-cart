import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Payroll } from './payroll';

describe('Payroll', () => {
  let component: Payroll;
  let fixture: ComponentFixture<Payroll>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [Payroll] }).compileComponents();
    fixture = TestBed.createComponent(Payroll);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate net salary as base + allowances - deductions', () => {
    const emp = { id: 99, fullName: 'Test', department: 'IT', baseSalary: 10000, allowances: 1500, deductions: 500 };
    expect(component.getNetSalary(emp)).toBe(11000);
  });

  it('should add a new employee and save it to localStorage', () => {
    const before = component.employees().length;
    component.formName = 'Laila Samir';
    component.formDepartment = 'Library';
    component.formBaseSalary = 8000;
    component.formAllowances = 300;
    component.formDeductions = 100;

    component.saveEmployee();

    expect(component.employees().length).toBe(before + 1);
    const added = component.employees()[before];
    expect(added.fullName).toBe('Laila Samir');
    expect(component.getNetSalary(added)).toBe(8200);

    const saved = JSON.parse(localStorage.getItem('campusCartEmployees')!);
    expect(saved.length).toBe(before + 1);
  });

  it('should not add an employee with an empty name', () => {
    const before = component.employees().length;
    component.formName = '   ';
    component.formDepartment = 'Library';
    component.formBaseSalary = 8000;

    component.saveEmployee();

    expect(component.employees().length).toBe(before);
    expect(component.errorMessage()).not.toBe('');
  });

  it('should edit payroll information of an existing employee', () => {
    const first = component.employees()[0];
    component.startEdit(first);
    component.formBaseSalary = 25000;
    component.formDeductions = 1000;

    component.saveEmployee();

    const updated = component.employees()[0];
    expect(updated.id).toBe(first.id);
    expect(updated.baseSalary).toBe(25000);
    expect(component.getNetSalary(updated)).toBe(25000 + first.allowances - 1000);
    expect(component.editingId()).toBeNull();
  });

  it('should build a report with the month and correct net salaries', () => {
    component.selectedMonth = '2026-11';
    const report = component.buildReport();

    expect(report.month).toBe('2026-11');
    expect(report.employees.length).toBe(component.employees().length);
    report.employees.forEach(r => {
      expect(r.netSalary).toBe(r.baseSalary + r.allowances - r.deductions);
    });
    const total = report.employees.reduce((sum, r) => sum + r.netSalary, 0);
    expect(report.totalNetSalary).toBe(total);
  });

  it('should generate valid JSON text for the report', () => {
    component.selectedMonth = '2026-11';
    component.generateReport();

    const parsed = JSON.parse(component.reportJson());
    expect(parsed.month).toBe('2026-11');
    expect(parsed.employees.length).toBe(component.employees().length);
  });

  it('should show one table row per employee', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(component.employees().length);
  });
});
