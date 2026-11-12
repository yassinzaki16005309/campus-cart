import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../core/models/employee.model';
import { Storage } from '../../core/services/storage';

const STORAGE_KEY = 'campusCartEmployees';

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 1, fullName: 'Ahmed Hassan', department: 'Computer Science', baseSalary: 18000, allowances: 2000, deductions: 1500 },
  { id: 2, fullName: 'Sara Mahmoud', department: 'Engineering', baseSalary: 20000, allowances: 2500, deductions: 2000 },
  { id: 3, fullName: 'Omar Khaled', department: 'Bookstore', baseSalary: 9000, allowances: 500, deductions: 400 },
  { id: 4, fullName: 'Nour Adel', department: 'Administration', baseSalary: 12000, allowances: 1000, deductions: 900 },
];

export interface SalaryReport {
  month: string;
  generatedAt: string;
  employees: (Employee & { netSalary: number })[];
  totalNetSalary: number;
}

@Component({
  selector: 'app-payroll',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './payroll.html',
  styleUrl: './payroll.css',
})
export class Payroll {
  private storage = inject(Storage);

  // Reactive state (signals)
  employees = signal<Employee[]>(
    this.storage.getLocal<Employee[]>(STORAGE_KEY) ?? DEFAULT_EMPLOYEES
  );
  editingId = signal<number | null>(null);
  errorMessage = signal('');
  reportJson = signal('');

  // Form fields (bound with [(ngModel)])
  formName = '';
  formDepartment = '';
  formBaseSalary: number | null = null;
  formAllowances: number | null = 0;
  formDeductions: number | null = 0;

  // Report month, e.g. "2026-11"
  selectedMonth = new Date().toISOString().slice(0, 7);

  // Net Salary = Base Salary + Allowances - Deductions
  getNetSalary(employee: Employee): number {
    return employee.baseSalary + employee.allowances - employee.deductions;
  }

  saveEmployee(): void {
    const name = this.formName.trim();
    const department = this.formDepartment.trim();
    const base = this.formBaseSalary;
    const allowances = this.formAllowances;
    const deductions = this.formDeductions;

    if (!name || !department) {
      this.errorMessage.set('Name and department are required.');
      return;
    }
    if (
      base === null || allowances === null || deductions === null ||
      base < 0 || allowances < 0 || deductions < 0
    ) {
      this.errorMessage.set('Salary, allowances and deductions must be numbers that are 0 or more.');
      return;
    }
    if (deductions > base + allowances) {
      this.errorMessage.set('Deductions cannot be more than base salary plus allowances.');
      return;
    }

    const editingId = this.editingId();

    if (editingId === null) {
      // ADD
      const ids = this.employees().map(e => e.id);
      const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      const newEmployee: Employee = {
        id: nextId,
        fullName: name,
        department,
        baseSalary: base,
        allowances,
        deductions,
      };
      this.employees.update(list => [...list, newEmployee]);
    } else {
      // EDIT
      this.employees.update(list =>
        list.map(e =>
          e.id === editingId
            ? { ...e, fullName: name, department, baseSalary: base, allowances, deductions }
            : e
        )
      );
    }

    this.storage.setLocal(STORAGE_KEY, this.employees());
    this.resetForm();
  }

  startEdit(employee: Employee): void {
    this.editingId.set(employee.id);
    this.formName = employee.fullName;
    this.formDepartment = employee.department;
    this.formBaseSalary = employee.baseSalary;
    this.formAllowances = employee.allowances;
    this.formDeductions = employee.deductions;
    this.errorMessage.set('');
  }

  resetForm(): void {
    this.editingId.set(null);
    this.formName = '';
    this.formDepartment = '';
    this.formBaseSalary = null;
    this.formAllowances = 0;
    this.formDeductions = 0;
    this.errorMessage.set('');
  }

  buildReport(): SalaryReport {
    const rows = this.employees().map(e => ({ ...e, netSalary: this.getNetSalary(e) }));
    return {
      month: this.selectedMonth,
      generatedAt: new Date().toISOString(),
      employees: rows,
      totalNetSalary: rows.reduce((sum, r) => sum + r.netSalary, 0),
    };
  }

  generateReport(): void {
    this.reportJson.set(JSON.stringify(this.buildReport(), null, 2));
  }

  downloadReport(): void {
    this.generateReport();
    const blob = new Blob([this.reportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary-report-${this.selectedMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}