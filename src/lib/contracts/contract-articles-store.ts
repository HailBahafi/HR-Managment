import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HRContractArticle = {
  id: string;
  code: string;
  title: string;
  body: string;
  isBasic: boolean;
  isActive: boolean;
  updatedAt: string;
};

const nowIso = () => new Date().toISOString();
function newId() { return `art_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`; }
export function normalizeArticleBody(raw: string) { return raw.replace(/\r\n/g, '\n'); }

const SEED: HRContractArticle[] = [
  {
    id: 'art-seed-1', code: 'A-01', title: 'طبيعة العمل والواجبات',
    body: 'يلتزم الموظف بأداء المهام الموضحة في وصف وظيفته والتي يكلفه بها مديره المباشر.\nيحق للجهة تعديل المهام حسب احتياجات العمل مع إخطار الموظف مسبقاً.',
    isBasic: true, isActive: true, updatedAt: nowIso(),
  },
  {
    id: 'art-seed-2', code: 'A-02', title: 'ساعات العمل والإجازات',
    body: 'تُطبَّق ساعات الدوام الرسمية المعتمدة من الجهة وفقاً للوائح العمل المعمول بها.\nيستحق الموظف الإجازات السنوية والرسمية وفق نظام العمل.',
    isBasic: true, isActive: true, updatedAt: nowIso(),
  },
  {
    id: 'art-seed-3', code: 'A-03', title: 'السرية والملكية الفكرية',
    body: 'يتعهد الموظف بالحفاظ على سرية جميع المعلومات التي يطلع عليها بحكم عمله.\nتعود ملكية المنتجات والأفكار والابتكارات التي يطورها خلال فترة عمله إلى الجهة.',
    isBasic: true, isActive: true, updatedAt: nowIso(),
  },
  {
    id: 'art-seed-4', code: 'A-04', title: 'إنهاء العقد',
    body: 'يحق لأي من الطرفين إنهاء هذا العقد بإشعار خطي مسبق وفقاً لمدة الإشعار المنصوص عليها في نظام العمل.\nفي حالة الإخلال الجسيم يحق للجهة إنهاء العقد فوراً.',
    isBasic: true, isActive: true, updatedAt: nowIso(),
  },
  {
    id: 'art-seed-5', code: 'B-01', title: 'بند العمل عن بُعد',
    body: 'يجوز للموظف العمل عن بُعد بموافقة مكتوبة من مديره وبما لا يتعارض مع متطلبات العمل.',
    isBasic: false, isActive: true, updatedAt: nowIso(),
  },
];

type State = {
  articles: HRContractArticle[];
  userChoseEmptyList: boolean;
  add: (a: Omit<HRContractArticle, 'id' | 'updatedAt'>) => HRContractArticle;
  update: (id: string, patch: Partial<Pick<HRContractArticle, 'code' | 'title' | 'body' | 'isBasic' | 'isActive'>>) => boolean;
  remove: (id: string) => boolean;
  getById: (id: string) => HRContractArticle | undefined;
};

export const useHRContractArticlesStore = create<State>()(
  persist(
    (set, get) => ({
      articles: [...SEED],
      userChoseEmptyList: false,
      add: (a) => {
        const row: HRContractArticle = {
          id: newId(), code: a.code.trim(), title: a.title.trim(),
          body: normalizeArticleBody(a.body), isBasic: a.isBasic, isActive: a.isActive, updatedAt: nowIso(),
        };
        set(s => ({ articles: [row, ...s.articles], userChoseEmptyList: false }));
        return row;
      },
      update: (id, patch) => {
        const { articles } = get();
        const i = articles.findIndex(x => x.id === id);
        if (i < 0) return false;
        const cur = articles[i]!;
        const next: HRContractArticle = {
          ...cur,
          code: patch.code !== undefined ? patch.code.trim() : cur.code,
          title: patch.title !== undefined ? patch.title.trim() : cur.title,
          body: patch.body !== undefined ? normalizeArticleBody(patch.body) : cur.body,
          isBasic: typeof patch.isBasic === 'boolean' ? patch.isBasic : cur.isBasic,
          isActive: typeof patch.isActive === 'boolean' ? patch.isActive : cur.isActive,
          updatedAt: nowIso(),
        };
        const list = articles.slice(); list[i] = next;
        set({ articles: list });
        return true;
      },
      remove: (id) => {
        const { articles } = get();
        if (!articles.some(x => x.id === id)) return false;
        const next = articles.filter(x => x.id !== id);
        set({ articles: next, ...(next.length === 0 ? { userChoseEmptyList: true } : {}) });
        return true;
      },
      getById: (id) => get().articles.find(x => x.id === id),
    }),
    {
      name: 'hr_contract_articles_v1',
      partialize: s => ({ articles: s.articles, userChoseEmptyList: s.userChoseEmptyList }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.userChoseEmptyList && (!state.articles || state.articles.length === 0)) {
          useHRContractArticlesStore.setState({ articles: [...SEED], userChoseEmptyList: false });
        }
      },
    },
  ),
);
