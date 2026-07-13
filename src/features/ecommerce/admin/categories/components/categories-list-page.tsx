'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FolderTree, Pencil, Plus, RefreshCw } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { CategoryFormDialog } from '@/features/ecommerce/admin/categories/components/category-form-dialog';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { PageHeader } from '@/components/layouts/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

export function CategoriesListPage() {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin');
  const tCommon = useTranslations('common');
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const { data, isLoading, isError, refetch } = useCategories({
    companyId,
    search: search || undefined,
    limit: 200,
  });

  const items = React.useMemo(() => data?.items ?? [], [data?.items]);
  const byId = React.useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setDialogOpen(true);
  }

  const columns: ColumnDef<Category>[] = [
    {
      key: 'category',
      title: 'التصنيف',
      render: (category) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {category.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={category.image.url} alt={category.image.alt} className="h-full w-full object-cover" />
            ) : (
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{category.nameAr}</span>
            {category.nameEn ? <span className="text-xs text-muted-foreground">{category.nameEn}</span> : null}
          </div>
        </div>
      ),
    },
    {
      key: 'parent',
      title: 'الأب',
      render: (category) => (
        <span className="text-sm text-muted-foreground">
          {category.parentId ? (byId.get(category.parentId)?.nameAr ?? category.parentId) : '— جذري —'}
        </span>
      ),
    },
    {
      key: 'brands',
      title: 'ماركات القائمة',
      render: (category) => (
        <span className="text-sm text-muted-foreground">{category.featuredBrandIds?.length ?? 0}</span>
      ),
    },
    {
      key: 'slug',
      title: 'الرابط',
      render: (category) => (
        <span className="text-sm text-muted-foreground" dir="ltr">
          {category.slug}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (category) => (
        <Badge variant={category.isActive ? 'success' : 'subtle'}>{category.isActive ? 'مفعّل' : 'معطّل'}</Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (category) => (
        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(category)}>
          <Pencil className="me-1 h-3.5 w-3.5" />
          تعديل
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={FolderTree}
        title={t('nav.categories')}
        description="الهيكل الشجري يغذي شريط التصنيفات والقائمة الضخمة في المتجر."
      />

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث بالاسم…"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label={tCommon('actions.retry')} onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="me-1 h-4 w-4" />
              إضافة تصنيف
            </Button>
          </div>
        }
      />

      {isError ? <p className="text-sm text-destructive">{t('catalog.loadError')}</p> : null}

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(category) => category.id}
        loading={isLoading}
        emptyText={t('catalog.empty')}
      />

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        categories={items}
      />
    </div>
  );
}
