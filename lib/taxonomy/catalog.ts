import { ServiceCategory, ServiceItem, ServiceAlias } from '@/types';

export const INITIAL_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-interior',
    name: 'Interior Design',
    slug: 'interior-design',
    icon: 'Layout',
    description: 'Modular kitchen renovation, false ceiling, custom wardrobes, and turnkey woodwork',
    is_active: true,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-carpentry',
    name: 'Carpentry & Plywood',
    slug: 'carpentry',
    icon: 'Hammer',
    description: 'Custom plywood furniture, door fittings, modular storage, and wood craftsmanship',
    is_active: true,
    sort_order: 2,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-electrical',
    name: 'Electrical',
    slug: 'electrical',
    icon: 'Zap',
    description: 'Wiring, switchboard fixes, fan installation, and lighting solutions',
    is_active: true,
    sort_order: 3,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-plumbing',
    name: 'Plumbing',
    slug: 'plumbing',
    icon: 'Wrench',
    description: 'Pipe repairs, tap fittings, bathroom plumbing, and water tank solutions',
    is_active: true,
    sort_order: 4,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-painting',
    name: 'Painting',
    slug: 'painting',
    icon: 'Sparkles',
    description: 'Interior touch-up painting, wall crack putty filling, waterproofing',
    is_active: true,
    sort_order: 5,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-ac-appliances',
    name: 'AC & Appliances',
    slug: 'ac-appliances',
    icon: 'Tv',
    description: 'AC servicing, washing machine repair, refrigerator cooling issues',
    is_active: true,
    sort_order: 6,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-cleaning',
    name: 'Cleaning',
    slug: 'cleaning',
    icon: 'Sparkles',
    description: 'Deep bathroom cleaning, kitchen degreasing, water tank cleaning',
    is_active: true,
    sort_order: 7,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-other',
    name: 'Other Services',
    slug: 'other-services',
    icon: 'HelpCircle',
    description: 'Custom and specialized home trade requirements',
    is_active: true,
    sort_order: 8,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const INITIAL_SERVICES: ServiceItem[] = [
  // 1. Plumbing
  {
    id: 'srv-plumbing',
    category_id: 'cat-plumbing',
    name: 'Plumbing',
    slug: 'plumbing',
    description: 'General plumbing inspection and repair',
    is_active: true,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-tap-repair',
    category_id: 'cat-plumbing',
    name: 'Tap Repair & Replacement',
    slug: 'tap-repair',
    description: 'Leaking taps, new mixer installation, angle valve replacement',
    is_active: true,
    sort_order: 2,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-pipe-leakage',
    category_id: 'cat-plumbing',
    name: 'Pipe Leakage & Drainage Repair',
    slug: 'pipe-leakage',
    description: 'Concealed pipe leaks, bathroom sink drain blockages, PVC joint sealing',
    is_active: true,
    sort_order: 3,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-water-tank',
    category_id: 'cat-plumbing',
    name: 'Water Tank & Motor Plumbing',
    slug: 'water-tank-plumbing',
    description: 'Overhead tank pipe connection, float valve, booster pump piping',
    is_active: true,
    sort_order: 4,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-toilet-repair',
    category_id: 'cat-plumbing',
    name: 'Toilet & Flush Tank Repair',
    slug: 'toilet-flush-repair',
    description: 'Flush valve replacement, commode re-fixing, jet spray fitting',
    is_active: true,
    sort_order: 5,
    created_at: '2026-01-01T00:00:00.000Z',
  },

  // 2. Electrical
  {
    id: 'srv-electrical',
    category_id: 'cat-electrical',
    name: 'Electrical',
    slug: 'electrical',
    description: 'General electrical inspection and repairs',
    is_active: true,
    sort_order: 6,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-switchboard-repair',
    category_id: 'cat-electrical',
    name: 'Switchboard Repair & Socket Replacement',
    slug: 'switchboard-repair',
    description: 'Burnt switches, sparking plug points, modular box replacement',
    is_active: true,
    sort_order: 7,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-fan-installation',
    category_id: 'cat-electrical',
    name: 'Ceiling Fan Installation & Repair',
    slug: 'fan-installation',
    description: 'Ceiling fan mounting, regulator issues, wobbling fix, capacitor change',
    is_active: true,
    sort_order: 8,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-wiring-lighting',
    category_id: 'cat-electrical',
    name: 'Short Circuit & Wiring Troubleshooting',
    slug: 'wiring-lighting',
    description: 'Tripping MCB diagnosis, concealed wire burnt fault finding, new light points',
    is_active: true,
    sort_order: 9,
    created_at: '2026-01-01T00:00:00.000Z',
  },

  // 3. Carpentry
  {
    id: 'srv-carpentry',
    category_id: 'cat-carpentry',
    name: 'Carpentry',
    slug: 'carpentry',
    description: 'General carpentry, doors, hinges and wood fixing',
    is_active: true,
    sort_order: 10,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-door-repair',
    category_id: 'cat-carpentry',
    name: 'Door & Window Repair',
    slug: 'door-repair',
    description: 'Door sticking, alignment, new latch fitting, mesh door repair',
    is_active: true,
    sort_order: 11,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-lock-repair',
    category_id: 'cat-carpentry',
    name: 'Lock Repair & Installation',
    slug: 'lock-repair',
    description: 'Main door handle lock, cupboard lock, cylinder replacement, safety latch',
    is_active: true,
    sort_order: 12,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-wood-furniture',
    category_id: 'cat-carpentry',
    name: 'Furniture Assembly & Woodwork Fix',
    slug: 'wood-furniture',
    description: 'Bed hinge fix, modular cabinet repair, dining chair loose joints, drawer slider',
    is_active: true,
    sort_order: 13,
    created_at: '2026-01-01T00:00:00.000Z',
  },

  // 4. AC & Appliances
  {
    id: 'srv-ac',
    category_id: 'cat-ac-appliances',
    name: 'AC Service',
    slug: 'ac-service',
    description: 'AC jet cleaning, gas charging, cooling fault troubleshooting',
    is_active: true,
    sort_order: 14,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'srv-washing-machine',
    category_id: 'cat-ac-appliances',
    name: 'Washing Machine Repair',
    slug: 'washing-machine-repair',
    description: 'Drum spinning fault, water inlet valve issue, vibration repair',
    is_active: true,
    sort_order: 15,
    created_at: '2026-01-01T00:00:00.000Z',
  },

  // 5. Cleaning
  {
    id: 'srv-cleaning',
    category_id: 'cat-cleaning',
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Deep bathroom cleaning, kitchen cleaning, overhead tank cleaning',
    is_active: true,
    sort_order: 16,
    created_at: '2026-01-01T00:00:00.000Z',
  },

  // 6. Painting
  {
    id: 'srv-painting',
    category_id: 'cat-painting',
    name: 'Painting',
    slug: 'painting',
    description: 'Interior wall painting, touch-up painting, crack putty filling',
    is_active: true,
    sort_order: 17,
    created_at: '2026-01-01T00:00:00.000Z',
  },

  // 7. Interior Design
  {
    id: 'srv-interior',
    category_id: 'cat-interior',
    name: 'Interior Design',
    slug: 'interior-design',
    description: 'Modular kitchens, false ceiling, wardrobes, woodwork consultation',
    is_active: true,
    sort_order: 18,
    created_at: '2026-01-01T00:00:00.000Z',
  },

  // 8. Other
  {
    id: 'srv-other',
    category_id: 'cat-other',
    name: 'Other',
    slug: 'other',
    description: 'Custom, specialized or unlisted home service requirement',
    is_active: true,
    sort_order: 19,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const INITIAL_ALIASES: ServiceAlias[] = [
  { id: 'al-1', service_id: 'srv-tap-repair', alias: 'tap leak' },
  { id: 'al-2', service_id: 'srv-tap-repair', alias: 'faucet repair' },
  { id: 'al-3', service_id: 'srv-pipe-leakage', alias: 'pipe burst' },
  { id: 'al-4', service_id: 'srv-pipe-leakage', alias: 'drain blockage' },
  { id: 'al-5', service_id: 'srv-fan-installation', alias: 'fan fitting' },
  { id: 'al-6', service_id: 'srv-switchboard-repair', alias: 'power problem' },
  { id: 'al-7', service_id: 'srv-door-repair', alias: 'lock change' },
  { id: 'al-8', service_id: 'srv-wood-furniture', alias: 'woodwork' },
  { id: 'al-9', service_id: 'srv-ac', alias: 'ac not cooling' },
  { id: 'al-10', service_id: 'srv-tap-repair', alias: 'kuzhai' },
  { id: 'al-11', service_id: 'srv-tap-repair', alias: 'water tap' },
  { id: 'al-12', service_id: 'srv-pipe-leakage', alias: 'leakage' },
  { id: 'al-13', service_id: 'srv-fan-installation', alias: 'fan repair' },
  { id: 'al-14', service_id: 'srv-switchboard-repair', alias: 'current switch' },
  { id: 'al-15', service_id: 'srv-lock-repair', alias: 'poottu repair' },
  { id: 'al-16', service_id: 'srv-ac', alias: 'ac gas filling' },
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
