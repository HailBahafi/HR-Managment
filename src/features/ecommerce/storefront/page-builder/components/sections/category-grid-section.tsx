import type { ResolvedCategoryGridSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { CategoryCard } from '@/features/ecommerce/storefront/components/catalog/category-card';
import { SectionHeader } from '@/features/ecommerce/storefront/components/catalog/section-header';
import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';

function resolveCategoryVariant(layout: ResolvedCategoryGridSection['style']['layout']) {
  if (layout === 'cards') return 'card' as const;
  if (layout === 'list') return 'list' as const;
  return 'circle' as const;
}

function sortRootCategories(categories: StorefrontCategory[]) {
  return categories.filter((category) => !category.parentId).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function CategoryGridSection({ section }: { section: ResolvedCategoryGridSection }) {
  const categories = section.data.categories;
  if (categories.length === 0) return null;

  const roots = sortRootCategories(categories);
  if (roots.length === 0) return null;

  const variant = resolveCategoryVariant(section.style.layout);
  const showLabels = section.settings.showLabels;

  return (
    <section className="flex flex-col gap-4">
      {section.heading.title ? (
        <SectionHeader title={section.heading.title} subtitle={section.heading.subtitle || undefined} />
      ) : null}

      {variant === 'circle' ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {roots.map((category) => (
            <CategoryCard key={category.id} category={category} variant="circle" showLabel={showLabels} />
          ))}
        </div>
      ) : (
        <div className={variant === 'list' ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'}>
          {roots.map((category) => (
            <CategoryCard key={category.id} category={category} variant={variant} showLabel={showLabels} />
          ))}
        </div>
      )}
    </section>
  );
}
