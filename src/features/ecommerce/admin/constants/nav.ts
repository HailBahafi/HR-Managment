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
  Truck,
  ClipboardList,
  Factory,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import {
  ecommerceAdminRoutes,
  ecommerceContentHref,
  ecommerceNavigationHref,
} from '@/features/ecommerce/admin/constants/routes';
import {
  INVENTORY_HEADER_OPERATION_KINDS,
  WAREHOUSE_OPERATION_KIND_META,
} from '@/features/ecommerce/domain/constants/warehouse-operation-kinds';
import type { WarehouseOperationKind } from '@/features/ecommerce/domain/types/warehouse';

export type EcommerceAdminNavItem = {
  /** next-intl key under `ecommerceAdmin.nav.*` */
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export type EcommerceAdminNavSection = {
  /** Optional section label key under `ecommerceAdmin.nav.sections.*` */
  sectionKey?: 'content' | 'appearance' | 'catalogSetup' | 'inventorySetup' | 'inventoryOps';
  items: EcommerceAdminNavItem[];
};

export type EcommerceAdminNavGroup = {
  key: 'products' | 'catalogSetup' | 'inventory' | 'inventorySetup' | 'inventoryReports' | 'sales' | 'website';
  labelKey: string;
  icon: LucideIcon;
  sections: EcommerceAdminNavSection[];
};

const HEADER_OP_ICONS: Partial<Record<WarehouseOperationKind, LucideIcon>> = {
  transfer: Truck,
  adjustment: SlidersHorizontal,
  physical_count: ClipboardList,
  scrap: Factory,
  purchase: ShoppingCart,
  replenishment: RefreshCw,
};

const inventoryOpsNavItems: EcommerceAdminNavItem[] = INVENTORY_HEADER_OPERATION_KINDS.map((kind) => {
  const segment = WAREHOUSE_OPERATION_KIND_META[kind].pathSegment!;
  return {
    labelKey: WAREHOUSE_OPERATION_KIND_META[kind].navLabelKey,
    href: ecommerceAdminRoutes.operationsForKind(segment),
    icon: HEADER_OP_ICONS[kind] ?? Package,
  };
});

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
    icon: Package,
    sections: [
      {
        items: inventoryOpsNavItems,
      },
    ],
  },
  {
    key: 'inventorySetup',
    labelKey: 'groups.inventorySetup',
    icon: Warehouse,
    sections: [
      {
        items: [
          { labelKey: 'warehouses', href: ecommerceAdminRoutes.warehouses, icon: Warehouse },
          { labelKey: 'locations', href: ecommerceAdminRoutes.locations, icon: MapPin },
          { labelKey: 'putawayRules', href: ecommerceAdminRoutes.putawayRules, icon: MapPinned },
        ],
      },
    ],
  },
  {
    key: 'inventoryReports',
    labelKey: 'groups.inventoryReports',
    icon: BarChart3,
    sections: [
      {
        items: [
          { labelKey: 'reportStock', href: ecommerceAdminRoutes.reportStock, icon: Package },
          {
            labelKey: 'reportDetailedStock',
            href: ecommerceAdminRoutes.reportDetailedStock,
            icon: ClipboardList,
          },
          { labelKey: 'reportMoves', href: ecommerceAdminRoutes.reportMoves, icon: FileText },
          {
            labelKey: 'reportMovesAnalysis',
            href: ecommerceAdminRoutes.reportMovesAnalysis,
            icon: BarChart3,
          },
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

export function isEcommerceAdminNavPath(pathname: string): boolean {
  return ECOMMERCE_ADMIN_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export function flattenEcommerceNavItems(group: EcommerceAdminNavGroup): EcommerceAdminNavItem[] {
  return group.sections.flatMap((section) => section.items);
}
