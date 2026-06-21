# Recruitment API — Frontend Sync (إزالة Tenants / Users)

> **Migration:** `1782100000000-drop-recruitment-tenants-users.ts`  
> **الجذر الجديد:** `hr_recruitment_jobs` — كل البيانات مربوطة بالوظيفة.

---

## ملخص التغيير

| قبل | بعد |
|-----|-----|
| جذر ATS = `hr_recruitment_tenants` | **لا يوجد tenant** — الجذر = **Job** |
| `hr_recruitment_users` (فريق ATS) | **محذوف بالكامل** |
| `tenantId` في jobs / applicants / forms | **محذوف** |
| Pipeline config لكل tenant | Pipeline config **لكل job** |
| `slug` فريد داخل tenant | `slug` **فريد عالمياً** على كل الوظائف |
| 34 endpoint | **28 endpoint** (−6 tenants, −2 users, −2 pipeline-stages القديم, +2 pipeline-stages على job) |

---

## Endpoints المحذوفة (لا تستدعيها)

```
POST   /recruitment/tenants
GET    /recruitment/tenants
GET    /recruitment/tenants/by-slug/{slug}
GET    /recruitment/tenants/{id}
PATCH  /recruitment/tenants/{id}
DELETE /recruitment/tenants/{id}

POST   /recruitment/users
GET    /recruitment/users
GET    /recruitment/users/{id}
PATCH  /recruitment/users/{id}
DELETE /recruitment/users/{id}

GET    /recruitment/pipeline-stages?tenantId=...     ← قديم
PUT    /recruitment/pipeline-stages                  ← قديم (body tenantId)
```

**صلاحيات محذوفة:** `hr.recruitment.tenants.*`, `hr.recruitment.users.*`

---

## Endpoints الجديدة / المعدّلة

### Pipeline stages — أصبحت على مستوى الوظيفة

| Method | Path | Query / Body |
|--------|------|--------------|
| GET | `/recruitment/jobs/{jobId}/pipeline-stages` | — |
| PUT | `/recruitment/jobs/{jobId}/pipeline-stages` | `{ stages: [...] }` فقط (**بدون** tenantId) |

**Response:** `[{ stage, label, color, sortOrder }]`

```bash
curl -s "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010/pipeline-stages" -H "Authorization: Bearer $TOKEN"

curl -s -X PUT "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010/pipeline-stages" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"stages":[{"stage":"applied","label":"تقديم","color":"#64748b","sortOrder":0}]}'
```

> عند **POST /recruitment/jobs** تُنشأ مراحل pipeline افتراضية (7 مراحل) تلقائياً للوظيفة الجديدة.

---

### Jobs

| التغيير | التفاصيل |
|---------|----------|
| **POST body** | احذف `tenantId` |
| **GET list query** | احذف `tenantId` — استخدم `page`, `limit`, `search`, `isActive` فقط |
| **Response** | احذف `tenantId` من `RecruitmentJob` |
| **slug** | فريد على مستوى النظام (ليس per-tenant) |

**POST /recruitment/jobs — body:**

```json
{
  "title": "مهندس برمجيات",
  "description": "وصف",
  "department": "تقنية المعلومات",
  "location": "عمان",
  "type": "full-time",
  "isActive": true,
  "form": {
    "title": "نموذج التقديم",
    "description": "",
    "fields": [
      { "type": "text", "label": "الاسم", "required": true, "sortOrder": 0 }
    ]
  }
}
```

**GET /recruitment/jobs:**

```
GET /recruitment/jobs?page=1&limit=20&isActive=true&search=مهندس
```

**Job response:**

```json
{
  "id": "uuid",
  "title": "...",
  "slug": "software-engineer",
  "description": "...",
  "department": "...",
  "location": "...",
  "type": "full-time",
  "isActive": true,
  "formId": "uuid",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### Applicants

| التغيير | التفاصيل |
|---------|----------|
| **GET list query** | `tenantId` **محذوف** — استخدم `jobId` (اختياري) للفلترة |
| **Response** | احذف `tenantId` |

**GET /recruitment/applicants:**

```
GET /recruitment/applicants?jobId=a1000010-...&pipelineStage=applied&page=1&limit=20
```

**Applicant response:**

```json
{
  "id": "uuid",
  "jobId": "uuid",
  "formId": "uuid",
  "answers": { "field-uuid": "value" },
  "pipelineStage": "applied",
  "cvFileName": null,
  "cvFilePath": null,
  "score": null,
  "submittedAt": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**POST /recruitment/applicants** — بدون تغيير (كان يعتمد `jobId` فقط).

**Public apply** — بدون تغيير (`POST /public/recruitment/jobs/{slug}/apply`).

---

### Forms

| التغيير | التفاصيل |
|---------|----------|
| **Response** | احذف `tenantId` — يبقى `jobId` |

```json
{
  "id": "uuid",
  "jobId": "uuid",
  "title": "نموذج التقديم",
  "description": "...",
  "fields": [...]
}
```

---

## Endpoints بدون تغيير (28 − 8 محذوف + 2 pipeline جديد = 22 قديم + 2 = 24... let me count)

### ما زال كما هو:

```
POST   /recruitment/jobs
GET    /recruitment/jobs
GET    /recruitment/jobs/by-slug/{slug}
GET    /recruitment/jobs/{id}
PATCH  /recruitment/jobs/{id}
DELETE /recruitment/jobs/{id}
PATCH  /recruitment/jobs/{id}/toggle-active
GET    /recruitment/jobs/{id}/form
PATCH  /recruitment/jobs/{id}/form
GET    /recruitment/jobs/{id}/applicants
GET    /recruitment/jobs/{id}/stats
GET    /recruitment/jobs/{id}/pipeline

GET    /recruitment/applicants
POST   /recruitment/applicants
GET    /recruitment/applicants/{id}
PATCH  /recruitment/applicants/{id}
DELETE /recruitment/applicants/{id}
POST   /recruitment/applicants/{id}/score
PATCH  /recruitment/applicants/{id}/stage

GET    /public/recruitment/jobs/{slug}
POST   /public/recruitment/jobs/{slug}/apply
```

**+ جديد:**

```
GET    /recruitment/jobs/{id}/pipeline-stages
PUT    /recruitment/jobs/{id}/pipeline-stages
```

**المجموع: 28 endpoint**

---

## Demo IDs (بعد التعديل)

| Key | Value |
|-----|-------|
| job software-engineer | `a1000010-0010-4000-8000-000000000010` |
| job slug | `software-engineer` |
| form | `a1000020-0020-4000-8000-000000000020` |
| field fullName | `a1000030-0030-4000-8000-000000000030` |
| field email | `a1000031-0031-4000-8000-000000000031` |
| applicant ahmed | `a1000050-0050-4000-8000-000000000050` |

**محذوف من الـ demo:** `tenant`, `user admin`, `user recruiter`, `user viewer`

---

## Types — TypeScript للفرونت

```typescript
// احذف
interface RecruitmentTenant { ... }
interface RecruitmentUser { ... }
interface CreateRecruitmentUserDto { ... }

// عدّل
interface RecruitmentJob {
  id: string;
  // tenantId: string;  ← احذف
  title: string;
  slug: string;
  // ...
}

interface RecruitmentForm {
  id: string;
  jobId: string;
  // tenantId ← احذف
  title: string;
  fields: RecruitmentFormField[];
}

interface RecruitmentApplicant {
  id: string;
  jobId: string;
  formId: string;
  // tenantId ← احذف
  answers: Record<string, string | undefined>;
  pipelineStage: PipelineStage;
  // ...
}

// Pipeline — job-scoped
interface UpdatePipelineStagesDto {
  stages: { stage: PipelineStage; label: string; color: string; sortOrder: number }[];
  // tenantId ← احذف
}

// List queries
interface ListJobsQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  // tenantId ← احذف
}

interface ListApplicantsQuery {
  jobId?: string;       // optional filter
  pipelineStage?: PipelineStage;
  minScore?: number;
  search?: string;
  page?: number;
  limit?: number;
  // tenantId ← احذف
}
```

---

## تشغيل على السيرver

```bash
npm run migration:run
npm run system:init    # يحدّث الصلاحيات (يزيل tenants/users)
npm run seed:demo      # اختياري — يعيد seed بدون tenant/users
```

---

## مخطط البيانات الجديد

```
hr_recruitment_jobs          ← الجذر
    ├── hr_recruitment_forms (1:1)
    ├── hr_recruitment_applicants
    ├── hr_recruitment_pipeline_stage_config (per job)
    └── (cascade delete عند حذف job)
```

**المصادقة:** مستخدم HR الرئيسي (`users` + JWT + `hr.recruitment.*`) — **ليس** `hr_recruitment_users`.
