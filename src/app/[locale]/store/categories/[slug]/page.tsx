import type { Metadata } from 'next';
import { CategoryDetailPage } from '@/features/ecommerce/storefront/components/category-detail-page';
import { categoryMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontProductsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontCategoryBySlug } from '@/features/ecommerce/storefront/lib/loaders/storefront-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

const PAGE_SIZE = 12;

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getStorefrontCategoryBySlug(slug);
  const config = await getStorefrontCompanyConfig();
  return categoryMetadata(category, config, locale as StorefrontLocale);
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);
  const category = await getStorefrontCategoryBySlug(slug);
  const productsResult = await getStorefrontProductsList({
    categoryId: category.id,
    page: pageNumber,
    limit: PAGE_SIZE,
  });

  return <CategoryDetailPage category={category} page={pageNumber} productsResult={productsResult} />;
}
