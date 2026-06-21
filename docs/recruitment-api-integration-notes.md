# Recruitment API — cURL (tested)

```bash
export BASE_URL="http://localhost:3000"
export TOKEN="eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NDhkMDkxYi1hMDhiLTRhMzUtODJlMC1iNGUwMjRhZjYyZDgiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwidHYiOjIsImlhdCI6MTc4MjA3NTA1MSwiZXhwIjoxNzgyNjc5ODUxfQ.Q5GS1m3rZKb7Q3J7yDKz2WNcaRn7UlhqCTQEKSM2kIAfzzjVRi0r2Dg0Tr7NPTkV1WWGmjxK2sU49LwsXkc4vw"
export AUTH="Authorization: Bearer $TOKEN"
```

**Response shape:** `{ "status", "message", "data", "error" }`  
**Lists:** `data.items[]` + `data.pagination { page, limit, total, totalPages }`

## Demo IDs (seed)

| Key | Value |
|-----|-------|
| tenant | `a1000001-0001-4000-8000-000000000001` |
| tenant slug | `demo-recruitment` |
| user admin | `a1000002-0002-4000-8000-000000000002` |
| job software-engineer | `a1000010-0010-4000-8000-000000000010` |
| job slug | `software-engineer` |
| form | `a1000020-0020-4000-8000-000000000020` |
| field fullName | `a1000030-0030-4000-8000-000000000030` |
| field email | `a1000031-0031-4000-8000-000000000031` |
| field phone | `a1000032-0032-4000-8000-000000000032` |
| field experience | `a1000033-0033-4000-8000-000000000033` |
| field education | `a1000034-0034-4000-8000-000000000034` |
| applicant ahmed | `a1000050-0050-4000-8000-000000000050` |

**Enums:** `job.type` → `full-time` \| `part-time` \| `contract` \| `internship` · `user.role` → `admin` \| `recruiter` \| `viewer` · `pipelineStage` → `applied` \| `screening` \| `interview` \| `technical` \| `offer` \| `hired` \| `rejected` · education select → `بكالوريوس` \| `ماجستير` \| `دكتوراه`

---

## Tenants

### POST `/recruitment/tenants` → 201

```bash
curl -s -X POST "$BASE_URL/recruitment/tenants" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"شركة التوظيف","slug":"acme-hr","logo":null}'
```

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| slug | string | no (auto from name) |
| logo | string \| null | no |

### GET `/recruitment/tenants` → 200

```bash
curl -s "$BASE_URL/recruitment/tenants?page=1&limit=20&search=demo" \
  -H "$AUTH"
```

| Query | Required |
|-------|----------|
| page | no |
| limit | no |
| search | no |

### GET `/recruitment/tenants/by-slug/{slug}` → 200

```bash
curl -s "$BASE_URL/recruitment/tenants/by-slug/demo-recruitment" \
  -H "$AUTH"
```

### GET `/recruitment/tenants/{id}` → 200

```bash
curl -s "$BASE_URL/recruitment/tenants/a1000001-0001-4000-8000-000000000001" \
  -H "$AUTH"
```

### PATCH `/recruitment/tenants/{id}` → 200

```bash
curl -s -X PATCH "$BASE_URL/recruitment/tenants/a1000001-0001-4000-8000-000000000001" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"شركة التوظيف التجريبية","logo":null}'
```

### DELETE `/recruitment/tenants/{id}` → 204

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/recruitment/tenants/{NEW_TENANT_ID}" \
  -H "$AUTH"
```

---

## Users

### POST `/recruitment/users` → 201

```bash
curl -s -X POST "$BASE_URL/recruitment/users" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "tenantId": "a1000001-0001-4000-8000-000000000001",
    "name": "سارة المحمد",
    "email": "recruiter@company.com",
    "role": "recruiter"
  }'
```

| Field | Type | Required |
|-------|------|----------|
| tenantId | uuid | yes |
| name | string | yes |
| email | string | yes |
| role | `admin` \| `recruiter` \| `viewer` | no (default `recruiter`) |

### GET `/recruitment/users` → 200

```bash
curl -s "$BASE_URL/recruitment/users?tenantId=a1000001-0001-4000-8000-000000000001&page=1&limit=20&role=recruiter&search=سارة" \
  -H "$AUTH"
```

| Query | Required |
|-------|----------|
| tenantId | yes |
| page, limit, search, role | no |

### GET `/recruitment/users/{id}` → 200

```bash
curl -s "$BASE_URL/recruitment/users/a1000002-0002-4000-8000-000000000002" \
  -H "$AUTH"
```

### PATCH `/recruitment/users/{id}` → 200

```bash
curl -s -X PATCH "$BASE_URL/recruitment/users/a1000002-0002-4000-8000-000000000002" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"مدير ATS","role":"admin"}'
```

### DELETE `/recruitment/users/{id}` → 204

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/recruitment/users/{NEW_USER_ID}" \
  -H "$AUTH"
```

---

## Jobs

### POST `/recruitment/jobs` → 201

```bash
curl -s -X POST "$BASE_URL/recruitment/jobs" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "tenantId": "a1000001-0001-4000-8000-000000000001",
    "title": "مهندس برمجيات",
    "description": "وصف الوظيفة",
    "department": "تقنية المعلومات",
    "location": "عمان",
    "type": "full-time",
    "isActive": true,
    "form": {
      "title": "نموذج التقديم",
      "description": "",
      "fields": [
        {"type": "text", "label": "الاسم الكامل", "required": true, "sortOrder": 0},
        {"type": "text", "label": "البريد الإلكتروني", "required": true, "sortOrder": 1},
        {"type": "number", "label": "سنوات الخبرة", "required": true, "sortOrder": 2}
      ]
    }
  }'
```

| Field | Type | Required |
|-------|------|----------|
| tenantId | uuid | yes |
| title | string | yes |
| department | string | yes |
| type | enum | yes |
| description, location, isActive | — | no |
| form.title | string | yes |
| form.fields[] | array | yes |
| form.fields[].type | `text` \| `number` \| `select` \| `file` | yes |
| form.fields[].label | string | yes |
| form.fields[].required | boolean | yes |
| form.fields[].options | string[] | for `select` |
| form.fields[].sortOrder | number | no |

### GET `/recruitment/jobs` → 200

```bash
curl -s "$BASE_URL/recruitment/jobs?tenantId=a1000001-0001-4000-8000-000000000001&page=1&limit=20&isActive=true&search=مهندس" \
  -H "$AUTH"
```

| Query | Required |
|-------|----------|
| tenantId | yes |
| page, limit, search, isActive | no |

### GET `/recruitment/jobs/by-slug/{slug}` → 200

```bash
curl -s "$BASE_URL/recruitment/jobs/by-slug/software-engineer" \
  -H "$AUTH"
```

### GET `/recruitment/jobs/{id}/form` → 200

```bash
curl -s "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010/form" \
  -H "$AUTH"
```

### PATCH `/recruitment/jobs/{id}/form` → 200

```bash
curl -s -X PATCH "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010/form" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "title": "نموذج التقديم",
    "description": "يرجى تعبئة جميع الحقول المطلوبة.",
    "fields": [
      {"id": "a1000030-0030-4000-8000-000000000030", "type": "text", "label": "الاسم الكامل", "required": true, "sortOrder": 0},
      {"id": "a1000031-0031-4000-8000-000000000031", "type": "text", "label": "البريد الإلكتروني", "required": true, "sortOrder": 1},
      {"id": "a1000032-0032-4000-8000-000000000032", "type": "text", "label": "الهاتف", "required": false, "sortOrder": 2},
      {"id": "a1000033-0033-4000-8000-000000000033", "type": "number", "label": "سنوات الخبرة", "required": true, "sortOrder": 3},
      {"id": "a1000034-0034-4000-8000-000000000034", "type": "select", "label": "المؤهل", "required": true, "options": ["بكالوريوس", "ماجستير", "دكتوراه"], "sortOrder": 4}
    ]
  }'
```

> `fields` replaces all form fields. Pass `id` on each field to keep stable UUIDs for `answers` keys.

### GET `/recruitment/jobs/{id}/applicants` → 200

```bash
curl -s "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010/applicants" \
  -H "$AUTH"
```

### GET `/recruitment/jobs/{id}/stats` → 200

```bash
curl -s "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010/stats" \
  -H "$AUTH"
```

### GET `/recruitment/jobs/{id}/pipeline` → 200

```bash
curl -s "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010/pipeline" \
  -H "$AUTH"
```

### GET `/recruitment/jobs/{id}` → 200

```bash
curl -s "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010" \
  -H "$AUTH"
```

### PATCH `/recruitment/jobs/{id}` → 200

```bash
curl -s -X PATCH "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title":"مهندس برمجيات أول","location":"عمان","isActive":true}'
```

### PATCH `/recruitment/jobs/{id}/toggle-active` → 200

```bash
curl -s -X PATCH "$BASE_URL/recruitment/jobs/a1000010-0010-4000-8000-000000000010/toggle-active" \
  -H "$AUTH"
```

### DELETE `/recruitment/jobs/{id}` → 204

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/recruitment/jobs/{NEW_JOB_ID}" \
  -H "$AUTH"
```

---

## Applicants

**`answers` keys = form field UUIDs** (from `GET .../jobs/{id}/form` → `data.fields[].id`).

### GET `/recruitment/applicants` → 200

```bash
curl -s "$BASE_URL/recruitment/applicants?tenantId=a1000001-0001-4000-8000-000000000001&jobId=a1000010-0010-4000-8000-000000000010&pipelineStage=applied&minScore=0&page=1&limit=20&search=ahmed" \
  -H "$AUTH"
```

| Query | Required |
|-------|----------|
| tenantId | yes |
| jobId, pipelineStage, minScore, search, page, limit | no |

### POST `/recruitment/applicants` → 201

```bash
curl -s -X POST "$BASE_URL/recruitment/applicants" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "jobId": "a1000010-0010-4000-8000-000000000010",
    "answers": {
      "a1000030-0030-4000-8000-000000000030": "محمد علي",
      "a1000031-0031-4000-8000-000000000031": "mohammed@example.com",
      "a1000032-0032-4000-8000-000000000032": "+962790000001",
      "a1000033-0033-4000-8000-000000000033": "4",
      "a1000034-0034-4000-8000-000000000034": "بكالوريوس"
    },
    "pipelineStage": "applied",
    "cvFileName": null,
    "cvFilePath": null
  }'
```

| Field | Type | Required |
|-------|------|----------|
| jobId | uuid | yes |
| answers | `{ [fieldId]: string }` | yes |
| pipelineStage | enum | no (default `applied`) |
| cvFileName, cvFilePath | string \| null | no |

### GET `/recruitment/applicants/{id}` → 200

```bash
curl -s "$BASE_URL/recruitment/applicants/a1000050-0050-4000-8000-000000000050" \
  -H "$AUTH"
```

### PATCH `/recruitment/applicants/{id}` → 200

```bash
curl -s -X PATCH "$BASE_URL/recruitment/applicants/a1000050-0050-4000-8000-000000000050" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "answers": {"a1000033-0033-4000-8000-000000000033": "6"},
    "pipelineStage": "screening",
    "cvFileName": "cv.pdf"
  }'
```

### POST `/recruitment/applicants/{id}/score` → 201

```bash
curl -s -X POST "$BASE_URL/recruitment/applicants/a1000050-0050-4000-8000-000000000050/score" \
  -H "$AUTH"
```

### PATCH `/recruitment/applicants/{id}/stage` → 200

```bash
curl -s -X PATCH "$BASE_URL/recruitment/applicants/a1000050-0050-4000-8000-000000000050/stage" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"pipelineStage": "interview"}'
```

### DELETE `/recruitment/applicants/{id}` → 204

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/recruitment/applicants/{NEW_APPLICANT_ID}" \
  -H "$AUTH"
```

---

## Pipeline Stages

### GET `/recruitment/pipeline-stages` → 200

```bash
curl -s "$BASE_URL/recruitment/pipeline-stages?tenantId=a1000001-0001-4000-8000-000000000001" \
  -H "$AUTH"
```

| Query | Required |
|-------|----------|
| tenantId | yes |

### PUT `/recruitment/pipeline-stages` → 200

```bash
curl -s -X PUT "$BASE_URL/recruitment/pipeline-stages" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "tenantId": "a1000001-0001-4000-8000-000000000001",
    "stages": [
      {"stage": "applied", "label": "تقديم", "color": "#64748b", "sortOrder": 0},
      {"stage": "screening", "label": "فرز", "color": "#0ea5e9", "sortOrder": 1},
      {"stage": "interview", "label": "مقابلة", "color": "#8b5cf6", "sortOrder": 2},
      {"stage": "technical", "label": "اختبار تقني", "color": "#f59e0b", "sortOrder": 3},
      {"stage": "offer", "label": "عرض", "color": "#14b8a6", "sortOrder": 4},
      {"stage": "hired", "label": "تم التعيين", "color": "#16a34a", "sortOrder": 5},
      {"stage": "rejected", "label": "مرفوض", "color": "#dc2626", "sortOrder": 6}
    ]
  }'
```

| Field | Type | Required |
|-------|------|----------|
| tenantId | uuid | yes |
| stages[].stage | enum | yes |
| stages[].label | string | yes |
| stages[].color | string | yes |
| stages[].sortOrder | number | yes |

---

## Public (no auth)

### GET `/public/recruitment/jobs/{slug}` → 200

```bash
curl -s "$BASE_URL/public/recruitment/jobs/software-engineer"
```

Returns `{ job, form }` — job must be `isActive: true`.

### POST `/public/recruitment/jobs/{slug}/apply` → 201

```bash
curl -s -X POST "$BASE_URL/public/recruitment/jobs/software-engineer/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "a1000030-0030-4000-8000-000000000030": "علي حسن",
      "a1000031-0031-4000-8000-000000000031": "ali@example.com",
      "a1000032-0032-4000-8000-000000000032": "+962790000002",
      "a1000033-0033-4000-8000-000000000033": "3",
      "a1000034-0034-4000-8000-000000000034": "بكالوريوس"
    },
    "cvFileName": null,
    "cvFileBase64": null
  }'
```

| Field | Type | Required |
|-------|------|----------|
| answers | `{ [fieldId]: string }` | yes (all required fields) |
| cvFileName | string \| null | no |
| cvFileBase64 | string \| null | no |
