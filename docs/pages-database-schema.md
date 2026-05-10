# HR Frontend — Pages and Database Schema Reference

This document maps **Next.js App Router pages** under `src/app` to their **feature components** and the **data fields** implied by TypeScript models, forms, and tables in the codebase. Use it as a starting point for relational schema design and backend APIs.

**Conventions**

- Types cited below live primarily in `src/types/index.ts`, `src/lib/**`, and `src/features/hr/**` unless noted.
- Suggested SQL uses PostgreSQL-style names; adjust naming (snake_case / prefixes) to match your backend standards.
- Redirect-only routes list their **target URL** instead of duplicating field lists.

### How to read: UI vs types vs code

This document uses three layers so backend design matches **what users see**, **what TypeScript promises**, and **what the app actually reads/writes**:

| Layer | Meaning | Typical sources |
|-------|---------|-----------------|
| **UI** | Fields shown or edited on screens (including display-only). **Edit** = user can change the value in-place on that surface (drawers, tabs, forms). | `src/app/**`, `src/features/**` components |
| **Types** | Fields declared on interfaces / types — the **contract** for props, stores, and APIs. | `src/types/index.ts`, `src/lib/**/types.ts` |
| **Code** | Runtime usage: Zustand stores, `lib/data` mock aggregations, seeds, search helpers, PDF builders, audit diff — even when no dedicated screen exists. | `src/lib/**`, `src/components/**`, stores |

**Important:** several domains keep **two shapes** for the same real-world thing (e.g. `Employee` in `src/types` vs `HREmployeeDirectoryRow` in requests). The backend may normalize into one table with views, or keep satellite tables — the tables below flag divergence.

**Seed / demo data:** `lib/data` composes JSON under `data/` (`employees.json`, `mock-data.json`, …). Treat **types + UI + stores** as the product contract; JSON as sample payloads.

---

## 1. Shared core entities (multiple modules)

These recur across organization, payroll, requests, and attendance.

### 1.1 Employee — `Employee` (`src/types/index.ts`)

Single interface **`Employee`** holds the HR profile row used by `getEmployee()` / `data.employees`.

#### Per-field: UI (`/hr/organization/employees/[id]` and related)

Legend: **Vis** = visible on employee detail; **Edit-P** = editable on Personal tab when «تعديل» is on; **Edit-R** = editable on Permissions tab (`assignedRoleId`).

| Field (TS name) | Employee detail UI | Other UI |
|-------------------|-------------------|----------|
| `id` | Indirect (URLs, links) | Lists, every module referencing employee |
| `employeeCode` | Vis (read-only in Identity group) | Employees list, headers |
| `name`, `nameEn` | Vis; **Edit-P** | List, shell; ROSE PDFs use draft |
| `email`, `phone` | Vis; **Edit-P** | — |
| `nationalId`, `nationality` | Vis; **Edit-P** | — |
| `avatar` | Vis (header/shell only) | List avatars; **no avatar upload/editor on profile** |
| `position` | Vis (employment + header) | Read-only on profile (no employment edit mode) |
| `departmentId`, `branchId` | Vis as **resolved names** (not raw ids) | Filters elsewhere |
| `managerId` | Vis as link to manager profile | — |
| `contractType`, `contractStatus` | Vis | — |
| `startDate`, `endDate` | Vis | `startDate` also in hero |
| `baseSalary` … `gosi`, `bankAccount`, `iban` | Vis (financial) | **Read-only** on profile — no financial edit mode |
| `address` | Vis; **Edit-P** | — |
| `openStream`, `village`, `district`, `city` | **Not on employee detail** | — |
| `emergencyContact` | **Not on employee detail** | **`new-employee-drawer.tsx`** form |
| `gender`, `birthDate`, `maritalStatus` | Vis; **Edit-P** | — |
| `role` | Not a dedicated field control | Permissions tab infers default when `assignedRoleId` unset |
| `assignedRoleId` | **Edit-R** (Permissions) | `useEmployeeProfilePermissions` |

**Save behaviour:** `EmployeeProfileDraft` is the full `Employee`. **Personal «حفظ»** runs `Object.assign(employee, draft)` (in-memory). Financial/employment scalars are **not** given inline editors on their tabs, so in practice users change them only via Personal save if those values were ever mutated in draft elsewhere — the intended edits are Personal fields + Permissions role save.

#### Per-field: types vs code (always refer to `Employee` in `src/types/index.ts`)

| Field | In `Employee` type? | Code usage (representative) |
|-------|---------------------|-----------------------------|
| All columns above | Yes | `lib/data` employees; `employee-profile-field` (`keyof Employee`); `diff-employee.ts` audit labels for most keys |
| `openStream`, `village`, `district`, `city` | Optional | `attendance/checkpoint-links/utils/employee-search-haystack.ts` (search text) |
| `emergencyContact` | Required string | `new-employee-drawer.tsx`; audit diff label in `diff-employee.ts` |

#### Parallel model: directory row (not on `Employee` interface)

**`HREmployeeDirectoryRow`** (`src/lib/hr-requests/employee-directory-store.ts`) — **Types:** yes, separate interface. **UI:** approver pickers, org chart, request flows. **Code:** seeded from `data.employees`, extended fields (`bridgeId`, `hierarchyRole`, `notes`, …). Use for backend **only if** you keep a workforce-directory projection distinct from legal HR profile.

| Field | UI | Types | Code |
|-------|----|-------|------|
| Core identity / job / dept | Pickers, charts | `HREmployeeDirectoryRow` | Store + seeds |
| `reportsToId` | Hierarchy | ✓ | Tree layouts |
| `hierarchyRole` | Chart | ✓ | Enum-like string |
| `status` | Often implicit | `active` \| `probation` \| `suspended` | Differs from `Employee.contractStatus` — **two lifecycles** in product |

### 1.2 Branch — two shapes

| Layer | Shape | Notes |
|-------|--------|------|
| **Types** | `Branch` in `src/types/index.ts` | `id`, `name`, `nameEn`, `city`, `employeesCount`, `manager` |
| **UI** | `BranchRow` / `BranchDraftForm` — branches **settings** page | Form edits **`name`, `city`** only; `manager` / `employeesCount` carried on row object |
| **Code** | `data.branches` via `lib/data.ts`; `getBranch()` | Org chart & employee profile resolve branch **name** |

### 1.3 Department — two shapes

| Layer | Shape | Notes |
|-------|--------|------|
| **Types** | `Department` in `src/types/index.ts` | `branchId`, `managerId`, `color`, counts — tied to **legacy mock** departments |
| **Types** | `HRDepartmentEntity` in `src/lib/hr-requests/types.ts` | Tree: `parentId`, `nameAr`, `nameEn`, `slug`, `sortOrder`, `isActive` |
| **UI** | `/hr/organization/departments` | Drawer: `nameAr`, `parentId`, `sortOrder`, `isActive` — **HR entity**, not necessarily identical JSON to `data.departments` |
| **Code** | `useHRConfigurationStore` + `lib/data` departments | Requests module uses configuration store |

Backend recommendation: model **one** canonical `departments` table; frontend **mock** may diverge until consolidated.

### 1.4 Job title template (`JobTitleTemplateRecord`)

| Layer | Notes |
|-------|------|
| **Types** | `src/lib/directory/job-title-templates-store.ts` |
| **UI** | `/hr/organization/job-titles` — form: `titleAr`, `defaultDepartmentId`, `descriptionAr` |
| **Code** | Persisted store + seed from `data.employees` positions |

### 1.5 External contact (`ExternalPartyRecord`)

| Layer | Notes |
|-------|------|
| **Types** | `src/lib/directory/external-contacts-store.ts` |
| **UI** | `/hr/organization/contacts` — full form matches record |
| **Code** | Zustand + persist |

---

### 1.6 Other `src/types` interfaces (global domain — UI coverage varies)

Declared in **`src/types/index.ts`**; screens may only touch a subset.

| Interface | Types (fields) | UI / code notes |
|-----------|----------------|------------------|
| `Shift`, `AttendanceRecord`, `GeoPoint` | Full interface | Legacy / dashboard paths; **attendance module** prefers `src/lib/attendance/types.ts` (`ShiftTemplate`, …) for product screens |
| `Request` | `requestNumber`, `type`, `status`, `timeline`, … | Employee profile «requests» tab uses `data.requests`; HR requests module uses **`HRRequestSubmissionRecord`** (`lib/hr-requests/types.ts`) — **parallel submission model** |
| `PayrollRun`, `Payslip` | Full | Dashboard / payslip series builders |
| `Role`, `Permission` | ids, permissions strings | `/hr/settings`, `/hr/permissions`; `PermissionRole` in features extends with **color token** |
| `ActivityItem` | Activity feed | Dashboard widgets |

---

## 2. Routes — page file → UI → fields / tables

### Auth & root

| Route | Page file | Feature component | Fields / data |
|-------|-----------|-------------------|---------------|
| `/` | `src/app/page.tsx` | redirect → `/login` | — |
| `/login` | `src/app/login/page.tsx` | `LoginPage` | Form: `email`, `password`; optional UI: remember device |

---

### HR dashboard & notifications

| Route | Page file | Feature component | Fields / data |
|-------|-----------|-------------------|---------------|
| `/hr/dashboard` | `src/app/(app)/hr/dashboard/page.tsx` | `DashboardPage` | **Aggregates only**: employee counts, attendance today (`present`/`late`/`absent`), pending requests, contracts by status, violation cases under review, unified leaves sample, sparklines — ties to `data` + Zustand stores |
| `/hr/notifications` | `src/app/(app)/hr/notifications/page.tsx` | `NotificationsPage` | **Notification** (`HRNotificationRecord`): `id`, `title_ar`, `body_ar`, `recipient_employee_id`, `created_at`, `read_at`, `dismissed_at`; filters: status, date, recipient multi-select |

---

### Organization

| Route | Page file | Feature component | Fields / data |
|-------|-----------|-------------------|---------------|
| `/hr/organization` | `src/app/(app)/hr/organization/page.tsx` | redirect → `/hr/organization/employees` | — |
| `/hr/organization/employees` | `src/app/(app)/hr/organization/employees/page.tsx` | `EmployeesListPage` | List/table over `Employee` + filters |
| `/hr/organization/employees/[id]` | `src/app/(app)/hr/organization/employees/[id]/page.tsx` | `EmployeeProfileBody` | **§1.1** across tabs; edits via profile model (`draft` mirrors `Employee` fields in hooks) |
| `/hr/organization/branches` | `src/app/(app)/hr/organization/branches/page.tsx` | `BranchesPage` | Form: `name`, `city`; row: **§1.2** |
| `/hr/organization/departments` | `src/app/(app)/hr/organization/departments/page.tsx` | `DepartmentsPage` | Form: `name_ar`, `parent_id`, `sort_order`, `is_active`; entity: **§1.3** |
| `/hr/organization/job-titles` | `src/app/(app)/hr/organization/job-titles/page.tsx` | `JobTitlesPage` | Form: `title_ar`, `default_department_id`, `description_ar`; record: **§1.4** |
| `/hr/organization/contacts` | `src/app/(app)/hr/organization/contacts/page.tsx` | `ContactsPage` | Form: `kind`, `name_ar`, `organization_ar`, `phone`, `email`, `notes`; **§1.5** |
| `/hr/organization/chart` | `src/app/(app)/hr/organization/chart/page.tsx` | `OrganizationPage` | Org tree visualization — nodes use departments + employee hierarchy (`HREmployeeDirectoryRow.reports_to_id`, etc.) |

---

### Attendance (`/hr/attendance/[section]`)

**Page:** `src/app/(app)/hr/attendance/[section]/page.tsx` → `AttendancePage`.

Sections (`src/lib/attendance/types.ts`): `daily`, `templates`, `assignment`, `checkpoints`, `checkpoint-links`.

| Area | Main structures |
|------|------------------|
| **Shift template** | `ShiftTemplate`: `id`, `name_ar`, `name_en`, `color_hex`, `effective_from`, `is_active`, `week_days[]` → `TemplateDayConfig`: `day`, `is_rest`, `periods[]` → `ShiftPeriod`: times, break, flexibility, `check_in`/`check_out` windows, `strict_mode` + penalty flags |
| **Assignment** | `ShiftAssignment`: `id`, `template_id`, `open_shift_hours`, `target_type` (`employee` \| `department` \| `location`), `target_id`, `target_label`, `effective_from`, `batch_id` |
| **Daily** | `AttendanceDaySummary`, `DailyAttendanceRow`, `AttendanceEvent` |
| **Checkpoints** | `AttendanceCheckInPoint`: `id`, `name_ar`, `name_en`, `latitude`, `longitude`, `radius_meters`, `is_active` |
| **Checkpoint links** | `AttendanceCheckInPointLink`: `id`, `employee_id`, `check_in_point_id`, `batch_id`, `effective_from`, `link_active` |

**Index redirect:** `src/app/(app)/hr/attendance/page.tsx` → `/hr/attendance/daily` (or `?section=` when valid).

---

### Discipline (`/hr/discipline/[section]`)

**Page:** `src/app/(app)/hr/discipline/[section]/page.tsx` → `HRDisciplineSectionRoot`.

| Section | Client | Primary records / forms |
|---------|--------|-------------------------|
| `violation-types` | `ViolationTypesClient` | **HRViolationTypeRecord**: `code`, `name_ar`, `name_en`, `sort_order`, `is_active`, `has_deduction`, `deduction_kind`, `deduction_value`, `needs_warning`, `needs_investigation`, `needs_approval`, `approval_template_id`, `updated_at` |
| `approval-assignment` | `DisciplineApprovalClient` | **HRApprovalAssignmentTemplate** + stages (**HRApprovalTemplateStage**: `mode`, `approvers[]` with `employee_id`, `mandatory`, `parallel_rule`, `optional_timeout_hours`); links: `assignment_link_kind`, `assignment_linked_ids` |
| `violation-cases` | `ViolationCasesClient` | **HRViolationCaseRecord** — see `src/lib/hr-discipline/types.ts` (case workflow, approvers, approval_log JSON, payroll flags) |
| `notices` | `NoticesClient` | **HRDisciplineNoticeRecord**: employee, `kind` (`verbal` \| `first` \| `second` \| `final`), `reason_ar`, `date`, `linked_case_id`, `attachments_note` |
| `circulars` | `CircularsClient` | **HRDisciplineCircularRecord**: `date`, `title_ar`, `body_ar`, `audience`, `target_employee_ids[]`, `branch_ids[]`, `department_ids[]`, snapshots, `sent_at` |
| `investigations` | `InvestigationsClient` | **HRDisciplineInvestigationRecord**: `case_id`, investigator, statements, `result`, `recommendation`, dates |
| `deductions` | `DeductionsClient` | **HRDisciplinePayrollDeductionRecord**: amounts, `deduction_kind`, `month`, `status` |
| `appeals` | `AppealsClient` | **HRDisciplineAppealRecord**: `channel`, `status`, `grounds`, `response_note` |
| `audit-log` | `DisciplineAuditLogClient` | Append-only operational events (implement as `discipline_audit_events` with actor, action code, payload JSON) |

**Index redirect:** `src/app/(app)/hr/discipline/page.tsx` → first section slug in config.

---

### Contracts & payroll

| Route | Page file | Feature component | Fields / data |
|-------|-----------|-------------------|---------------|
| `/hr/contracts` | `src/app/(app)/hr/contracts/page.tsx` | redirect → `/hr/contracts/employment` | — |
| `/hr/contracts/employment` | `src/app/(app)/hr/contracts/employment/page.tsx` | `EmploymentContractsClient` | **HRContractRecord** (`src/lib/contracts/contracts-store.ts`): `employee_id`, `contract_number`, `contract_type` (nature enum), `work_arrangement`, `start_date`, `end_date`, `probation_days`, `annual_leave_days`, `base_salary`, `currency`, `status`, `template_id`, `allowance_lines[]` (`allowance_type_id`, `amount`), `allowances_note`, `deductions_note`, `article_ids[]`, amendment links, `updated_at` |
| `/hr/contracts/articles` | `src/app/(app)/hr/contracts/articles/page.tsx` | `ContractArticlesClient` | **HRContractArticle**: `code`, `title`, `body`, `is_basic`, `is_active` |
| `/hr/contracts/employee-advances` | `src/app/(app)/hr/contracts/employee-advances/page.tsx` | `EmployeeAdvancesClient` | **HREmployeeAdvance**: `employee_id`, `amount`, `currency`, `advance_date`, `note`, `status`, `advance_kind`, `repayment_mode`, `repayment_months`, `monthly_installment_amount` |
| `/hr/contracts/payroll-periods` | `src/app/(app)/hr/contracts/payroll-periods/page.tsx` | `PayrollPeriodsClient` | **HRPayrollPeriodRecord**: `code`, `name_ar`, `name_en`, `period_start`, `period_end`, `status`, `compensation_review_status`, `snapshot_contract_ids[]`, `employment_lines[]` (**HRPayrollEmploymentLine**), `employment_line_monthly_inputs` (map line id → **HRPayrollMonthlyInput[]**: `kind`, `value`, `note`), `notes`, timestamps |
| `/hr/contracts/payroll-salary-approvals` | `src/app/(app)/hr/contracts/payroll-salary-approvals/page.tsx` | `PayrollSalaryApprovalClient` | **PayrollSalaryCircularEntry** per period + employment line: `send_status`, `sent_at`, `read_status`, `read_at`, `approval_status`, `responded_at` |
| `/hr/contracts/reports` | `src/app/(app)/hr/contracts/reports/page.tsx` | `ReportsClient` | PDF/report generation from periods + contracts — no extra persistent form fields |
| `/hr/contracts/period/[periodId]` | `src/app/(app)/hr/contracts/period/[periodId]/page.tsx` | redirect → `…/compensation` | — |
| `/hr/contracts/period/[periodId]/compensation` | `src/app/(app)/hr/contracts/period/[periodId]/compensation/page.tsx` | `CompensationReportRouteClient` | Reads same **payroll period** + contracts + allowance types; calculated compensation previews |

**Supporting stores:** allowance types (`useHRAllowanceTypesStore`), contract templates referenced by `template_id`.

---

### Leaves

| Route | Page file | Feature component | Fields / data |
|-------|-----------|-------------------|---------------|
| `/hr/leaves` | `src/app/(app)/hr/leaves/page.tsx` | redirect → `/hr/leaves/leave-types` | — |
| `/hr/leaves/[section]` | `src/app/(app)/hr/leaves/[section]/page.tsx` | `LeaveTypesPanel` / `PublicHolidaysPanel` | Sections: `leave-types`, `public-holidays` (`LEAVE_APP_SECTION_SLUGS`) |
| Leave types | (panel) | — | **HRLeaveTypeRecord** (`src/lib/leaves/types.ts`): `code`, `name_ar`, `name_en`, `paid`, `deducts_from_balance`, `requires_approval`, `max_days_per_request`, `sort_order`, `is_active` |
| Public holidays | (panel) | — | **HRPublicHolidayRecord**: `code`, `name_ar`, `name_en`, `date` (MM-DD), `recurring`, `sort_order`, `is_active` |
| `/hr/leaves/unified-management` | `src/app/(app)/hr/leaves/unified-management/page.tsx` | `UnifiedManagementPageLoader` | **UnifiedLeaveRecord**: `employee_id`, `type`, `status`, `start`, `end`, `request_branch_id`, `working_days`, notes, **approval_chain[]** |
| `/hr/leaves/balance-credit` | `src/app/(app)/hr/leaves/balance-credit/page.tsx` | `LeaveBalanceCreditPageLoader` | **LeaveBalanceCreditRequest**: `employee_id`, `days_added`, `reason_ar`, `status`, `created_at`, `decided_at` |
| `/hr/leaves/analytics` | `src/app/(app)/hr/leaves/analytics/page.tsx` | `AnalyticsClient` | **EmployeeLeaveAnalyticsRow**, **TimelineLeaveBar** — aggregates for charts/tables |

---

### Requests

| Route | Page file | Feature component | Fields / data |
|-------|-----------|-------------------|---------------|
| `/hr/requests` | `src/app/(app)/hr/requests/page.tsx` | redirect → `/hr/requests/general` | — |
| `/hr/requests/general` | `src/app/(app)/hr/requests/general/page.tsx` | `GeneralRequestsClient` | **HRRequestSubmissionRecord**: employee, request type & department snapshots, `template_id`, **`field_values` JSON** keyed by field id; template drives dynamic fields (**HRRequestFieldDefinition**: `kind`, `options`, `required`, …). **HRSubmissionApprovalSnapshot** for workflow |
| `/hr/requests/request-types` | `src/app/(app)/hr/requests/request-types/page.tsx` | `RequestTypesClient` | **HRRequestTypeEntity**: per **department_id**, `name_ar`, `slug`, `sort_order`, `is_active`, `request_category` (`leaves` \| `attendance` \| `advances`), `subtypes[]`, optional `approval_assignment_template_id` / embedded stages |
| `/hr/requests/approval-assignment` | `src/app/(app)/hr/requests/approval-assignment/page.tsx` | `ApprovalAssignmentClient` | **HRApprovalAssignmentTemplate** + linked HR request type ids (`hr_request_assignment_linked_ids`) |
| `/hr/requests/attendance-corrections` | `src/app/(app)/hr/requests/attendance-corrections/page.tsx` | `AttendanceCorrectionRequestsClient` | **AttendanceCorrectionRequest**: employee, department, `approver_id`, `work_date`, previous/corrected check-in/out times, `previous_status_ar`, `reason_ar`, `status`, timestamps |
| `/hr/requests/[department]/[requestType]` | `src/app/(app)/hr/requests/[department]/[requestType]/page.tsx` | `department-request-type-page` | Same submission model as general requests — scoped by department + type slug |
| `/hr/requests/table` | `src/app/(app)/hr/requests/table/page.tsx` | redirect → `/hr/requests/general` | — |

**Configuration store** also holds **HRRequestTemplateEntity** (form builder: `form_fields[]`) for reusable field sets.

---

### Settings & permissions

| Route | Page file | Feature component | Fields / data |
|-------|-----------|-------------------|---------------|
| `/hr/settings` | `src/app/(app)/hr/settings/page.tsx` | `SettingsPage` | Read-only cards + matrix preview over `data.roles`: role `name`, `description`, `users_count`, `permissions[]` string keys |
| `/hr/settings/departments` | `src/app/(app)/hr/settings/departments/page.tsx` | redirect → `/hr/organization/departments` | — |
| `/hr/settings/request-types` | `src/app/(app)/hr/settings/request-types/page.tsx` | redirect → `/hr/requests/request-types` | — |
| `/hr/permissions` | `src/app/(app)/hr/permissions/page.tsx` | `PermissionsManagementPage` | **PermissionRole**: `name`, `description`, `users_count`, `permissions[]` (`resource.action` keys), `color` token; matrix over **PERMISSION_RESOURCES** × **PERMISSION_ACTIONS** |

---

## 3. Suggested relational tables (consolidated)

Use this as an ER starting point; split or merge to match normalization rules.

| Table | Purpose |
|-------|---------|
| `employees` | §1.1 (`Employee`) |
| `employee_directory_extensions` | Optional: `HREmployeeDirectoryRow` fields if split from core HR profile |
| `branches` | §1.2 |
| `departments` | §1.3 |
| `job_title_templates` | §1.4 |
| `external_parties` | §1.5 |
| `roles`, `role_permissions` | Permissions page + `Employee.assigned_role_id` |
| `shift_templates`, `shift_template_days`, `shift_periods` | Attendance templates |
| `shift_assignments` | |
| `attendance_events`, `attendance_day_summaries` | Daily attendance |
| `check_in_points`, `employee_check_in_point_links` | Geo checkpoints |
| `violation_types`, `violation_cases`, `discipline_notices`, `discipline_circulars`, `investigations`, `payroll_deductions`, `appeals`, `discipline_audit_events` | Discipline module |
| `approval_assignment_templates`, `approval_template_stages`, `approval_template_stage_approvers` | Shared by HR requests & discipline |
| `contracts`, `contract_allowance_lines`, `contract_article_links` | Employment contracts |
| `contract_articles` | Legal clauses library |
| `employee_advances` | |
| `payroll_periods`, `payroll_employment_lines`, `payroll_monthly_inputs` | |
| `payroll_salary_circular_states` | Composite key `(period_id, employment_line_id)` → circular entry |
| `leave_types`, `public_holidays` | |
| `leave_requests` (unified), `leave_approval_steps`, `leave_balance_credit_requests` | |
| `request_templates`, `request_template_fields`, `request_template_field_options` | Dynamic forms |
| `request_types`, `request_subtypes` | |
| `request_submissions`, `request_submission_field_values` | JSON column or EAV per field kind |
| `attendance_correction_requests` | |
| `notifications` | Inbox |

---

## 4. API contract reminder

Align list/detail payloads with the project standard `{ "data": { ... }, "success": true }` and typed error codes for mutations.

---

*Generated from the HR frontend codebase (pages, feature components, and `src/lib` / `src/types` models). Update this document when screens or types change.*
