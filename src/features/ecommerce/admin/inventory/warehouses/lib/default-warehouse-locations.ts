import type {
  CreateWarehouseLocationInput,
  Warehouse,
  WarehouseIncomingSteps,
  WarehouseOutgoingSteps,
} from '@/features/ecommerce/domain/types/warehouse';

type SeedSpec = {
  key: string;
  nameAr: string;
  when?: (incoming: WarehouseIncomingSteps, outgoing: WarehouseOutgoingSteps) => boolean;
};

const DEFAULT_LOCATION_SPECS: SeedSpec[] = [
  { key: 'Stock', nameAr: 'المخزون' },
  {
    key: 'Input',
    nameAr: 'المدخلات',
    when: (incoming) => incoming >= 2,
  },
  {
    key: 'Quality',
    nameAr: 'مراقبة الجودة',
    when: (incoming) => incoming >= 3,
  },
  {
    key: 'Output',
    nameAr: 'المخرجات',
    when: (_i, outgoing) => outgoing >= 2,
  },
  {
    key: 'Packing',
    nameAr: 'منطقة التعبئة',
    when: (_i, outgoing) => outgoing >= 3,
  },
];

/**
 * Builds the standard system locations for a new warehouse.
 * Example short code `فثسف` → `فثسف/المخزون`, `فثسف/المدخلات`, …
 */
export function buildDefaultWarehouseLocations(warehouse: Warehouse): CreateWarehouseLocationInput[] {
  const prefix = warehouse.code.trim() || 'WH';

  return DEFAULT_LOCATION_SPECS.filter((spec) =>
    spec.when ? spec.when(warehouse.incomingSteps, warehouse.outgoingSteps) : true,
  ).map((spec) => ({
    companyId: warehouse.companyId,
    warehouseId: warehouse.id,
    code: `${prefix}/${spec.key}`,
    nameAr: `${prefix}/${spec.nameAr}`,
    locationType: 'internal',
    replenish: false,
    cycleCountFrequencyDays: 0,
    removalStrategy: 'fifo',
    isActive: true,
    isSystem: true,
  }));
}
