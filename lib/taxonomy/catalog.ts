import { ServiceCategory, ServiceItem, ServiceAlias } from '@/types';

export const INITIAL_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-plumbing',
    name: 'Plumbing',
    slug: 'plumbing',
    icon: 'Wrench',
    description: 'Pipe repairs, tap fittings, bathroom plumbing, and water tank solutions',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-electrical',
    name: 'Electrical',
    slug: 'electrical',
    icon: 'Zap',
    description: 'Wiring, switchboard fixes, fan installation, and lighting solutions',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-carpentry',
    name: 'Carpentry',
    slug: 'carpentry',
    icon: 'Hammer',
    description: 'Door repairs, wooden furniture fixes, locks, and custom woodwork',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-ac-appliances',
    name: 'AC & Appliances',
    slug: 'ac-appliances',
    icon: 'Tv',
    description: 'AC servicing, washing machine repair, refrigerator cooling issues',
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-cleaning-painting',
    name: 'Cleaning & Painting',
    slug: 'cleaning-painting',
    icon: 'Sparkles',
    description: 'Deep bathroom cleaning, water tank cleaning, interior touch-up painting',
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_SERVICES: ServiceItem[] = [
  // Plumbing
  {
    id: 'srv-tap-repair',
    category_id: 'cat-plumbing',
    name: 'Tap Repair & Replacement',
    slug: 'tap-repair',
    description: 'Leaking taps, new mixer installation, angle valve replacement',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-pipe-leakage',
    category_id: 'cat-plumbing',
    name: 'Pipe Leakage & Drainage Repair',
    slug: 'pipe-leakage',
    description: 'Concealed pipe leaks, bathroom sink drain blockages, PVC joint sealing',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-water-tank',
    category_id: 'cat-plumbing',
    name: 'Water Tank & Motor Plumbing',
    slug: 'water-tank-plumbing',
    description: 'Overhead tank pipe connection, float valve, booster pump piping',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-toilet-repair',
    category_id: 'cat-plumbing',
    name: 'Toilet & Flush Tank Repair',
    slug: 'toilet-flush-repair',
    description: 'Flush valve replacement, commode re-fixing, jet spray fitting',
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },

  // Electrical
  {
    id: 'srv-switchboard-repair',
    category_id: 'cat-electrical',
    name: 'Switchboard & MCB Repair',
    slug: 'switchboard-mcb-repair',
    description: 'Blown fuses, tripping MCB, burnt sockets, new switch replacement',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-fan-installation',
    category_id: 'cat-electrical',
    name: 'Ceiling Fan Installation & Repair',
    slug: 'fan-installation',
    description: 'Ceiling fan hanging, regulator change, capacitor replacement',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-wiring-lighting',
    category_id: 'cat-electrical',
    name: 'Short Circuit & Concealed Wiring',
    slug: 'wiring-lighting',
    description: 'Short circuit fault detection, tube lights, chandelier setup',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },

  // Carpentry
  {
    id: 'srv-door-lock-repair',
    category_id: 'cat-carpentry',
    name: 'Door Repair & Lock Fitting',
    slug: 'door-lock-repair',
    description: 'Door alignment, latch / lock change, hinge screeching repair',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-furniture-repair',
    category_id: 'cat-carpentry',
    name: 'Furniture & Cupboard Repair',
    slug: 'furniture-repair',
    description: 'Wardrobe drawer tracks, sliding wardrobe repair, chair / table fixes',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-woodwork-general',
    category_id: 'cat-carpentry',
    name: 'General Woodwork & Drilling',
    slug: 'general-woodwork',
    description: 'Wooden pelmet fitting, curtain rod setup, wall shelf mounting',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },

  // AC & Appliances
  {
    id: 'srv-ac-service',
    category_id: 'cat-ac-appliances',
    name: 'AC Filter Service & Gas Check',
    slug: 'ac-service',
    description: 'Deep jet spray wash, gas leak check, cooling problem diagnosis',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-washing-machine',
    category_id: 'cat-ac-appliances',
    name: 'Washing Machine Repair',
    slug: 'washing-machine-repair',
    description: 'Drum not spinning, water drainage issue, vibration troubleshooting',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_ALIASES: ServiceAlias[] = [
  { id: 'al-1', service_id: 'srv-tap-repair', alias: 'tap leak' },
  { id: 'al-2', service_id: 'srv-tap-repair', alias: 'faucet repair' },
  { id: 'al-3', service_id: 'srv-pipe-leakage', alias: 'pipe burst' },
  { id: 'al-4', service_id: 'srv-pipe-leakage', alias: 'drain blockage' },
  { id: 'al-5', service_id: 'srv-fan-installation', alias: 'fan fitting' },
  { id: 'al-6', service_id: 'srv-switchboard-repair', alias: 'power problem' },
  { id: 'al-7', service_id: 'srv-door-lock-repair', alias: 'lock change' },
  { id: 'al-8', service_id: 'srv-furniture-repair', alias: 'woodwork' },
  { id: 'al-9', service_id: 'srv-ac-service', alias: 'ac not cooling' },
];

/**
 * Normalizes customer input to suggest or map controlled service
 */
export function resolveServiceFromInput(input: string): ServiceItem | undefined {
  const normalized = input.trim().toLowerCase();
  
  // 1. Check exact or partial name match on services
  const directMatch = INITIAL_SERVICES.find(
    s => s.name.toLowerCase().includes(normalized) || normalized.includes(s.name.toLowerCase())
  );
  if (directMatch) return directMatch;

  // 2. Check alias mapping
  const aliasMatch = INITIAL_ALIASES.find(a => normalized.includes(a.alias.toLowerCase()));
  if (aliasMatch) {
    return INITIAL_SERVICES.find(s => s.id === aliasMatch.service_id);
  }

  return undefined;
}
