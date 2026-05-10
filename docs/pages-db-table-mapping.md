# Pages → Database Tables (compact mapping)

Purpose: route coverage for `src/app/**/page.tsx` next to concise table lists. Mirrors `docs/full-database-schema.md` naming (canonical); use that file for nullable columns/FKs/detail.

Format:
- Page (route) — Feature component  
- Tables (table_name) — primary columns (concise)

--- 

## Organization

- /hr/organization/employees — `EmployeesListPage`  
  - employees — id, employee_code, name_ar, department_id, branch_id, position, contract_status
  - departments — id, name_ar, parent_id
  - branches — id, name, city

- /hr/organization/chart — org chart workspace  
  - employees — hierarchy links (reports_to typical source is directory extension)
  - employee_workforce_extensions — optional bridge_id, reports_to_id, hierarchy_role, employment_status

- /hr/organization/page.tsx — umbrella / links (no extra tables beyond org module)

- /hr/organization/employees/[id] — `EmployeeProfileBody`  
  - employees — id, employee_code, name_ar, name_en, email, phone, national_id, nationality, avatar, position, department_id, branch_id, manager_id, contract_type, contract_status, start_date, end_date, base_salary, housing_allowance, transport_allowance, other_allowances, gosi, bank_account, iban, address, gender, birth_date, marital_status, assigned_role_id
  - contracts — id, employee_id, contract_number, start_date, end_date, base_salary, currency, status
  - payslips — id, payroll_period_id, employee_id, month, year, gross, net

- /hr/organization/branches — `BranchesPage`  
  - branches — id, name_ar, name_en, city, manager, employees_count

- /hr/organization/departments — `DepartmentsPage`  
  - departments — id, parent_id, name_ar, name_en, slug, sort_order, is_active

- /hr/organization/job-titles — `JobTitlesPage`  
  - job_title_templates — id, title_ar, description_ar, default_department_id

- /hr/organization/contacts — `ContactsPage`  
  - external_parties — id, kind, name_ar, phone, email, organization_ar, notes

## Attendance

`/hr/attendance` redirects to **`/hr/attendance/daily`** (or legacy `?section=` slug when valid).

- /hr/attendance/[section] — `AttendancePage` (daily/templates/assignment/checkpoints)  
  - shift_templates — id, name_ar, effective_from, is_active
  - shift_periods — id, template_id, start_time, end_time, break_enabled
  - shift_assignments — id, template_id, target_type, target_id, effective_from
  - attendance_events — id, employee_id, date, type (check_in/check_out), at, source
  - attendance_day_summaries — id, employee_id, date, status, worked_minutes, late_minutes
  - check_in_points — id, name_ar, latitude, longitude, radius_meters
  - check_in_point_links — id, employee_id, check_in_point_id, effective_from

## Contracts & Payroll

`/hr/contracts` redirects to **`/hr/contracts/employment`**.

- /hr/contracts/employment — `EmploymentContractsClient`  
  - contracts — id, employee_id, contract_number, contract_type, work_arrangement, start_date, end_date, probation_days, base_salary, currency, status, template_id
  - contract_allowance_lines — id, contract_id, allowance_type_id, amount
  - contract_articles — id, code, title, body, is_basic

- /hr/contracts/employee-advances — `EmployeeAdvancesClient`  
  - employee_advances — id, employee_id, amount, currency, advance_date, status, repayment_mode, repayment_months, monthly_installment_amount

- /hr/contracts/payroll-periods — `PayrollPeriodsClient`  
  - payroll_periods — id, code, name_ar, period_start, period_end, status
  - payroll_employment_lines — id, period_id, employee_id, contract_id, base_salary_snapshot
  - payroll_monthly_inputs — id, employment_line_id, kind, value, note
  - payroll_salary_circular_states — key(period_id, employment_line_id), send_status, sent_at, read_status, approval_status

- /hr/contracts/period/[periodId] — payroll period drill-down (same payroll_* tables keyed by period)

- /hr/contracts/period/[periodId]/compensation — compensation review pane  
  - payroll_periods.compensation_review_status (and siblings on period / lines per `full-database-schema.md`)

- /hr/contracts/payroll-salary-approvals — salary circular approvals  
  - payroll_salary_circular_states — send/read/approval statuses per line  

- /hr/contracts/articles — contract article presets  
  - contract_articles — id, code, title, body, is_basic

- /hr/contracts/reports — payroll register / PDF exports  
  - payroll_* (read-only rollup), employees, branches; printable company name may need settings row (optional)

## Requests & Approvals

- /hr/requests → redirects to `/hr/requests/general` (no persistence)

- /hr/requests/general — `GeneralRequestsClient`  
  - request_templates — id, name_ar, is_active (field defs in **`form_fields` JSONB** or normalized sibling table if you split)
  - request_types — id, department_id, name_ar, slug, request_category, approval_assignment_template_id
  - request_submissions — id, employee_id, request_type_id, template_id, field_values_json, status, created_at
  - approval_assignment_templates — id, name_ar, stages_json

- /hr/requests/attendance-corrections — `AttendanceCorrectionRequestsClient`  
  - attendance_correction_requests — id, employee_id, department_id, approver_id, work_date, previous_check_in, previous_check_out, corrected_check_in, corrected_check_out, status, reason

- /hr/requests/table — tabular approvals view (`request_submissions` + resolved names)

- /hr/requests/[department]/[requestType] — dynamic submission surface  
  - request_types, request_templates, request_submissions, approval_assignment_templates

- /hr/requests/unified-management — unified leave approvals (mounted under leaves feature)  
  - leave_requests (unified)

- /hr/requests/approval-assignment — request-side approval presets  
  - approval_assignment_templates

- `/hr/requests/request-types` — `RequestTypesClient`  
  - request_types, departments, approval_assignment_templates

## Leaves

`/hr/leaves` redirects to **`/hr/leaves/leave-types`**.

- /hr/leaves/public-holidays — `PublicHolidaysPanel`  
  - public_holidays — id, code, name_ar, date, recurring

- `/hr/leaves/leave-types` — `LeaveTypesPanel`  
  - leave_types — id, code, name_ar, paid, requires_approval, max_days_per_request, is_active
  - public_holidays — id, code, name_ar, date, recurring
  - leave_requests (unified) — id, employee_id, type, start, end, status, approval_chain_json
  - leave_balance_credit_requests — id, employee_id, days_added, reason_ar, status

- `/hr/leaves/balance-credit` — balance-credit admin  
  - `leave_balance_credit_requests`; **`employee_leave_balances`** (`buckets` JSONB per `EmployeeLeaveBalanceRow`; see full schema § leaves)

- `/hr/leaves/analytics` — `AnalyticsClient` (mock-heavy today); production backend derives cards from **`leave_requests`**, **`employees`** (including `avatar_hue`), **`branches`** — no extra analytics table unless you snapshot dashboards.

## Discipline & Compliance

`/hr/discipline` redirects to the first configured section slug (see `hrDisciplineSections` in code).

All sections share `/hr/discipline/[section]` where `section` ∈ `violation-types` | `approval-assignment` | `violation-cases` | `notices` | `circulars` | `investigations` | `deductions` | `appeals` | `audit-log`.

- /hr/discipline/violation-types — `ViolationTypesClient`  
  - violation_types — id, code, name_ar, has_deduction, deduction_kind, deduction_value, needs_warning, needs_investigation, is_active

- /hr/discipline/violation-cases — `ViolationCasesClient`  
  - violation_cases — id, case_number, employee_id, date, violation_type_id, description, status, approval_snapshot_json, approval_log_json

**Same route tree, additional tables:** `notices` → `discipline_notices`; `circulars` → `discipline_circulars`; `investigations` → `discipline_investigations`; `investigations` penalties UI → **`discipline_penalties`** when modeled separately; `deductions` → `discipline_payroll_deductions`; `appeals` → `discipline_appeals`; `audit-log` → `discipline_audit_log_entries`. `approval-assignment` under discipline consumes **`approval_assignment_templates`** (same table as `/hr/requests/approval-assignment`, different UX entry).

## Settings & Permissions

- /hr/settings/departments — `HRDepartmentEntity` editors  
  - departments — id, parent_id, name_ar, name_en, slug, sort_order, is_active

- /hr/settings — landing / links  

- `/hr/permissions` — `PermissionsManagementPage`  
  - roles — id, name_ar, name_en, description, color
  - role_permissions — id, role_id, permission_key (e.g. employees.view)
  - employees table links to roles via assigned_role_id

## Auth & Shell

- /login — `LoginPage` (demo form) → backend **`users`** (see `docs/full-database-schema.md` § Authentication) + session transport of your choice (`employees.assigned_role_id` for HR permissions until IAM expands).

## Dashboard & Notifications

`/`, app root → redirects to **`/login`**.

- /hr/dashboard — `DashboardPage` (aggregates)  
  - uses: employees, attendance_events, requests, contracts, violation_cases, payroll_periods (no new tables)

- /hr/notifications — `NotificationsPage`  
  - notifications — id, title_ar, body_ar, recipient_employee_id, created_at, read_at, dismissed_at

---

Notes:
- This file is intentionally compact — it lists only pages and the DB tables (with core columns) that are used by those pages.
- Use this mapping as the canonical UI → DB reference when creating migrations, APIs, or ER diagrams.

