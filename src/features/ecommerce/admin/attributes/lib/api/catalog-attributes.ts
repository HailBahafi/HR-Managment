import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import type {
  CatalogAttribute,
  CatalogAttributeListQuery,
  CreateCatalogAttributeInput,
  UpdateCatalogAttributeInput,
} from '@/features/ecommerce/domain/types/catalog-attribute';
import attributesSeed from '@/features/ecommerce/shared/lib/mock/catalog-attributes.json';

const repository = createMockRepository<CatalogAttribute>(attributesSeed as CatalogAttribute[]);

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const catalogAttributesApi = {
  getAll(query: CatalogAttributeListQuery) {
    return repository.list(
      query,
      (item, q) => {
        if (!q.search) return true;
        const search = q.search.toLowerCase();
        return item.nameAr.toLowerCase().includes(search);
      },
      (a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'),
    );
  },
  getById(companyId: string, id: string) {
    return repository.getById(companyId, id);
  },
  create(input: CreateCatalogAttributeInput) {
    const now = new Date().toISOString();
    return repository.create({
      ...input,
      id: newId('attr'),
      createdAt: now,
      updatedAt: now,
    });
  },
  update(companyId: string, id: string, patch: UpdateCatalogAttributeInput) {
    return repository.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
  remove(companyId: string, id: string) {
    return repository.remove(companyId, id);
  },
};
