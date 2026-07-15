import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  Users,
  LayoutTemplate,
  Navigation,
  FileText,
  Settings,
  Image,
  Newspaper,
  CircleHelp,
  PanelBottom,
  Megaphone,
  Globe,
  Warehouse,
  MapPinned,
  MapPin,
  SlidersHorizontal,
  Library,
} from 'lucide-react';
import {
  ecommerceAdminRoutes,
  ecommerceContentHref,
  ecommerceNavigationHref,
} from '@/features/ecommerce/admin/constants/routes';

export type EcommerceAdminNavItem = {
  /** next-intl key under `ecommerceAdmin.nav.*` */
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export type EcommerceAdminNavSection = {
  /** Optional section label key under `ecommerceAdmin.nav.sections.*` */
  sectionKey?: 'content' | 'appearance' | 'catalogSetup' | 'inventorySetup';
  items: EcommerceAdminNavItem[];
};

export type EcommerceAdminNavGroup = {
  key: 'products' | 'catalogSetup' | 'inventory' | 'sales' | 'website';
  labelKey: string;
  icon: LucideIcon;
  sections: EcommerceAdminNavSection[];
};

/**
 * Order: operational catalog → master setup → inventory setup → sales → website.
 * Empty future domains (finance/system) are omitted until they have real screens.
 */
export const ecommerceAdminOverviewItem: EcommerceAdminNavItem = {
  labelKey: 'overview',
  href: ecommerceAdminRoutes.overview,
  icon: LayoutDashboard,
};

export const ecommerceAdminNavGroups: EcommerceAdminNavGroup[] = [
  {
    key: 'products',
    labelKey: 'groups.products',
    icon: Package,
    sections: [
      {
        items: [{ labelKey: 'products', href: ecommerceAdminRoutes.products, icon: Package }],
      },
    ],
  },
  {
    key: 'catalogSetup',
    labelKey: 'groups.catalogSetup',
    icon: Library,
    sections: [
      {
        sectionKey: 'catalogSetup',
        items: [
          { labelKey: 'categories', href: ecommerceAdminRoutes.categories, icon: FolderTree },
          { labelKey: 'attributes', href: ecommerceAdminRoutes.attributes, icon: SlidersHorizontal },
          { labelKey: 'brands', href: ecommerceAdminRoutes.brands, icon: Tag },
        ],
      },
    ],
  },
  {
    key: 'inventory',
    labelKey: 'groups.inventory',
    icon: Warehouse,
    sections: [
      {
        sectionKey: 'inventorySetup',
        items: [
          { labelKey: 'warehouses', href: ecommerceAdminRoutes.warehouses, icon: Warehouse },
          { labelKey: 'locations', href: ecommerceAdminRoutes.locations, icon: MapPin },
          { labelKey: 'putawayRules', href: ecommerceAdminRoutes.putawayRules, icon: MapPinned },
        ],
      },
    ],
  },
  {
    key: 'sales',
    labelKey: 'groups.sales',
    icon: ShoppingCart,
    sections: [
      {
        items: [
          { labelKey: 'orders', href: ecommerceAdminRoutes.orders, icon: ShoppingCart },
          { labelKey: 'customers', href: ecommerceAdminRoutes.customers, icon: Users },
        ],
      },
    ],
  },
  {
    key: 'website',
    labelKey: 'groups.website',
    icon: Globe,
    sections: [
      {
        items: [
          { labelKey: 'homepage', href: ecommerceAdminRoutes.homepage, icon: LayoutTemplate },
          { labelKey: 'navigation', href: ecommerceNavigationHref('header'), icon: Navigation },
          { labelKey: 'banners', href: ecommerceAdminRoutes.banners, icon: Image },
        ],
      },
      {
        sectionKey: 'content',
        items: [
          { labelKey: 'contentPages', href: ecommerceContentHref('pages'), icon: FileText },
          { labelKey: 'contentBlog', href: ecommerceContentHref('blog'), icon: Newspaper },
          { labelKey: 'contentFaq', href: ecommerceContentHref('faq'), icon: CircleHelp },
        ],
      },
      {
        sectionKey: 'appearance',
        items: [
          { labelKey: 'appearanceFooter', href: ecommerceNavigationHref('footer'), icon: PanelBottom },
          {
            labelKey: 'appearanceAnnouncement',
            href: ecommerceNavigationHref('announcement'),
            icon: Megaphone,
          },
        ],
      },
      {
        items: [{ labelKey: 'websiteSettings', href: ecommerceAdminRoutes.settings, icon: Settings }],
      },
    ],
  },
];

function collectHrefs(group: EcommerceAdminNavGroup): string[] {
  return group.sections.flatMap((section) => section.items.map((item) => item.href.split('?')[0]!));
}

const ECOMMERCE_ADMIN_PATHS: string[] = [
  ecommerceAdminOverviewItem.href,
  ...ecommerceAdminNavGroups.flatMap(collectHrefs),
];

/** True when `pathname` belongs to one of the ecommerce admin pages. */
export function isEcommerceAdminNavPath(pathname: string): boolean {
  return ECOMMERCE_ADMIN_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export function flattenEcommerceNavItems(group: EcommerceAdminNavGroup): EcommerceAdminNavItem[] {
  return group.sections.flatMap((section) => section.items);
}
