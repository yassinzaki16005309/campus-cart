# CampusCart — Project Guidelines

## 1. Project Overview

CampusCart is a university finance portal with an integrated campus store.

The application supports three user roles:

- Admin
- Accountant
- Student

The project is developed using Angular for GIU Web Programming (ICS 511), Winter Semester 2026.

Milestone 1 is frontend-only. No backend or database implementation is required.

## 2. Team Responsibilities

| Member | Responsibility |
|---|---|
| Member 1 | Shared architecture, authentication, Home, Login, Signup, Profile |
| Member 2 | Staff Payroll |
| Member 3 | Department Budget |
| Member 4 | Campus Store and Student Fees |

Each member should work primarily within their assigned feature files.

Do not modify another member's files without coordinating first.

## 3. Project Architecture

All development takes place inside the same Angular application.

```text
src/app/
│
├── core/
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── employee.model.ts
│   │   ├── product.model.ts
│   │   ├── invoice.model.ts
│   │   └── transaction.model.ts
│   │
│   ├── services/
│   │   ├── auth.ts
│   │   └── storage.ts
│   │
│   └── guards/
│       └── role-guard.ts
│
├── shared/
│   └── components/
│       ├── navbar/
│       ├── sidebar/
│       └── footer/
│
└── features/
    ├── home/
    ├── auth/
    │   ├── login/
    │   └── signup/
    ├── profile/
    ├── payroll/
    ├── budget/
    ├── store/
    └── student-fees/
```

## 4. Shared Models

Always reuse the existing models instead of creating duplicates.

- `User`: user information and role.
- `Employee`: employee salary information.
- `Product`: campus store products.
- `Invoice`: student invoices.
- `Transaction`: department income and expenses.

If a model needs to change, coordinate with the project owner before modifying it.

## 5. Shared Services

### Auth service

Location: `core/services/auth.ts`

Responsible for:

- Login and logout.
- Current logged-in user.
- Checking user roles.
- Registering new accounts.

Do not implement another authentication service.

### Storage service

Location: `core/services/storage.ts`

Responsible for:

- localStorage.
- sessionStorage.
- Cookies.

Reuse this service instead of implementing separate browser storage methods in every feature.

Do not store real passwords or credit card information.

## 6. User Roles and Permissions

| Feature | Admin | Accountant | Student |
|---|---|---|---|
| Home | Yes | Yes | Yes |
| Profile | Yes | Yes | Yes |
| Payroll | Yes | Yes | No |
| Department Budget | Yes | Yes | No |
| Campus Store | Yes | No | Yes |
| Student Fees | Yes | No | Yes |

The existing Angular routes already use role-based protection.

Do not change route permissions without coordinating with Member 1.

## 7. Important Integration: Store and Budget

Campus Store sales must contribute to the Bookstore department's income.

Member 3 and Member 4 must agree on the shared transaction format.

Use the existing `Transaction` model:

```typescript
{
  id: number;
  department: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
}
```

Agreed shared localStorage key:

`campusCartTransactions`

Integration rules:

1. Completed store payments generate a Bookstore income transaction.
2. Store purchases added to an unpaid student invoice are not yet received income.
3. When the relevant invoice is paid, the Bookstore income transaction for its store-purchase portion must be recorded.
4. The same purchase must never be counted twice.
5. Member 3 reads the shared transactions and includes Bookstore income in the budget calculations and chart.

Both members must use the same key and transaction structure.

## 8. Angular Development Rules

Follow the concepts taught in the course lectures and labs.

Prefer:

- Standalone Angular components.
- TypeScript.
- Angular templates.
- Interpolation and property binding.
- Event binding.
- `[(ngModel)]` when appropriate.
- `@if` and `@for`.
- Angular Router and `routerLink`.
- Signals for reactive state.
- Services for shared functionality.
- Responsive CSS using Flexbox, Grid and media queries.

Avoid:

- Direct DOM manipulation.
- Unnecessary libraries.
- NgRx for this project.
- Duplicate shared functionality.
- Unnecessary abstractions.
- Backend or database implementation.

## 9. Design and Responsive Requirements

All feature pages should:

- Use consistent spacing, typography and colours.
- Work on desktop, tablet and mobile.
- Use readable tables and forms.
- Use appropriate interactive elements.
- Follow the existing application's visual style.

Use simple CSS and BEM-style class names where appropriate.

## 10. Browser Storage and Security

Milestone 1 requires cookies, sessionStorage and localStorage.

Use the existing Storage service.

Suggested responsibilities:

- sessionStorage: current login session.
- localStorage: application data that needs to persist after refreshing the page.
- Cookies: appropriate non-sensitive preferences or simple application settings.

Never persist real passwords or real credit card numbers.

Payments must be simulated because this milestone has no backend payment system.

Client-side authentication is for demonstration only and is not production security.

## 11. Git and Collaboration

All members work in the same GitHub repository.

Repository:

https://github.com/yassinzaki16005309/campus-cart

Before starting work:

1. Pull the latest changes from the shared repository.
2. Create a separate branch for your feature.
3. Work only on your assigned files.
4. Build and test your changes.
5. Commit your work.
6. Push your branch and submit it for integration.

Do not push unfinished changes directly to the main branch.

Before modifying shared models or services, coordinate with Member 1.

## 12. Testing

Each member is responsible for testing their own components and services.

Use Jasmine and Karma.

Test the important functionality of each feature and ensure the complete project builds successfully after integration.

## 13. Final Restrictions

This is Milestone 1 only.

Do not implement anything beyond the official milestone requirements.

Do not introduce unnecessary features, packages, services or architectural complexity.

Keep the code understandable and be prepared to explain your implementation during the TA evaluation.