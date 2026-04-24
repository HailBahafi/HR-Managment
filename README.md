# نواة — Nawa HR Management System

منصة متكاملة لإدارة الموارد البشرية، مصممة بعناية للمؤسسات متعددة الفروع.
A complete, production-grade HR Management System built with a distinctive editorial enterprise aesthetic.

## ✨ Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** with centralized design tokens
- **shadcn/ui** primitives (Radix-based)
- **TanStack Query** for data fetching
- **TanStack Table** (used where applicable)
- **Recharts** for data visualization
- **React Hook Form** + **Zod** for forms & validation
- **Framer Motion** for animations
- **Lucide React** icons
- **IBM Plex Sans Arabic** + **Rubik** — Arabic-native typography

## 🎨 Design System

- Deep forest-teal primary + burnished gold accent + ivory parchment background
- Fully RTL (Arabic-native)
- Light & dark themes via CSS variables
- Custom shadow scale (`soft` → `elevated` → `luxe`)
- Grain textures, dotted backgrounds, gold accent lines
- All colors, spacing, radii centralized in `tailwind.config.ts` + `globals.css`

## 📂 Structure

```
├── data/                        # Mock data JSON
│   ├── mock-data.json           # employees, branches, departments, etc.
│   ├── attendance.json          # daily attendance + trends
│   ├── requests.json            # requests + timelines
│   └── payroll.json             # payroll runs, payslips
├── public/                      # Static assets
└── src/
    ├── app/
    │   ├── (app)/               # Authenticated app shell
    │   │   ├── layout.tsx       # Sidebar + Topbar
    │   │   ├── dashboard/       # Main KPI dashboard
    │   │   ├── employees/       # List + dynamic profile
    │   │   ├── organization/    # Interactive org chart
    │   │   ├── attendance/      # Daily/shifts/geo-points
    │   │   ├── requests/        # Approval inbox + timeline
    │   │   ├── payroll/         # Runs + payslips + history
    │   │   ├── reports/         # Charts & analytics
    │   │   └── settings/        # Roles + permissions matrix
    │   ├── login/               # Atmospheric brand entry
    │   ├── layout.tsx           # Root (fonts + providers)
    │   └── globals.css          # Design tokens
    ├── components/
    │   ├── ui/                  # shadcn primitives
    │   ├── sidebar.tsx
    │   ├── topbar.tsx
    │   ├── logo.tsx
    │   ├── kpi-card.tsx
    │   ├── status-badge.tsx
    │   └── providers.tsx
    ├── lib/
    │   ├── utils.ts             # Arabic formatters, helpers
    │   └── data.ts              # Data loader
    └── types/index.ts           # Full type system
```

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the login page.
Credentials are pre-filled: `admin@nawa.sa` / `nawa2026` — just click **تسجيل الدخول**.

## 📄 Pages

| Page | Path | Description |
|------|------|-------------|
| تسجيل الدخول | `/login` | Two-panel atmospheric entry with brand storytelling |
| لوحة التحكم | `/dashboard` | KPIs, charts, activity feed, late-employees widget, quick actions |
| الموظفين | `/employees` | Filterable table + grid view |
| ملف موظف | `/employees/[id]` | Editorial hero + tabs (info, employment, salary, requests) |
| الهيكل التنظيمي | `/organization` | Interactive expandable tree |
| الحضور والانصراف | `/attendance` | Daily records, shifts, geo-points with map |
| مركز الطلبات | `/requests` | Inbox + detail panel + approval timeline + new request form |
| الرواتب | `/payroll` | Hero run card, payslips (print-ready), history, charts |
| التقارير | `/reports` | 4 tabs × multiple charts (line, bar, pie, radar, area) |
| الإعدادات | `/settings` | Roles, permission matrix, branches, shift policies |

## 🎯 Design Decisions

- **Aesthetic direction**: refined editorial enterprise — not typical dashboard-beige. Dominant deep teal, gold as the one sharp accent, used intentionally for emphasis (not decoration).
- **Typography**: IBM Plex Sans Arabic for UI readability + Rubik as the display face for headlines. Both are Arabic-native and avoid generic system fonts.
- **Atmosphere**: grain overlays, gradient orbs, dotted backgrounds, gold accent lines, layered cards with elevated shadows — the app feels alive without being noisy.
- **RTL**: native throughout, from sidebar placement to chart tooltips to form layouts.
- **Data density**: rich tables, multi-metric widgets, but held together with generous whitespace and clear typographic hierarchy.

---

© 2026 نواة. Built with care.
