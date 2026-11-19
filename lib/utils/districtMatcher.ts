import {
  TAMIL_NADU_DISTRICTS,
  TAMIL_NADU_DISTRICT_COORDINATES,
  TamilNaduDistrict,
} from '@/lib/constants';

/**
 * Normalizes an arbitrary text string for district comparison.
 * Strips common administrative suffixes ("district", "taluk", "tk", "corporation", etc.)
 * and special characters.
 */
export function cleanAdministrativeText(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\b(district|dist\.?|taluk|tk\.?|circle|division|corporation|municipality|city|dt\.?)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Comprehensive mapping of variations, common spellings, aliases, and major taluks/towns
 * to official canonical Tamil Nadu district options in TAMIL_NADU_DISTRICTS.
 */
const DISTRICT_ALIAS_MAP: Record<string, TamilNaduDistrict> = {
  // Ariyalur
  ariyalur: 'Ariyalur',
  udayarpalayam: 'Ariyalur',
  sendurai: 'Ariyalur',
  andimadam: 'Ariyalur',

  // Chengalpattu
  chengalpattu: 'Chengalpattu',
  chengalpet: 'Chengalpattu',
  chingleput: 'Chengalpattu',
  tambaram: 'Chengalpattu',
  pallavaram: 'Chengalpattu',
  chromepet: 'Chengalpattu',
  vandalur: 'Chengalpattu',
  kelambakkam: 'Chengalpattu',
  thiruporur: 'Chengalpattu',
  tiruporur: 'Chengalpattu',
  maduranthakam: 'Chengalpattu',
  madurantakam: 'Chengalpattu',
  cheyyur: 'Chengalpattu',
  mamallapuram: 'Chengalpattu',
  mahabalipuram: 'Chengalpattu',

  // Chennai
  chennai: 'Chennai',
  madras: 'Chennai',
  guindy: 'Chennai',
  adyar: 'Chennai',
  mylapore: 'Chennai',
  velachery: 'Chennai',
  egmore: 'Chennai',
  tnagar: 'Chennai',
  annanagar: 'Chennai',
  royapettah: 'Chennai',
  perambur: 'Chennai',
  tondiarpet: 'Chennai',
  thiruvanmiyur: 'Chennai',

  // Coimbatore
  coimbatore: 'Coimbatore',
  kovai: 'Coimbatore',
  cbe: 'Coimbatore',
  pollachi: 'Coimbatore',
  mettupalayam: 'Coimbatore',
  sulur: 'Coimbatore',
  annur: 'Coimbatore',
  kinathukadavu: 'Coimbatore',
  valparai: 'Coimbatore',
  saravanampatti: 'Coimbatore',
  peelamedu: 'Coimbatore',
  singanallur: 'Coimbatore',
  gandhipuram: 'Coimbatore',

  // Cuddalore
  cuddalore: 'Cuddalore',
  chidambaram: 'Cuddalore',
  panruti: 'Cuddalore',
  vriddhachalam: 'Cuddalore',
  virudhachalam: 'Cuddalore',
  neyveli: 'Cuddalore',
  neiveli: 'Cuddalore',
  tittakudi: 'Cuddalore',
  kurinjipadi: 'Cuddalore',
  bhuvanagiri: 'Cuddalore',

  // Dharmapuri
  dharmapuri: 'Dharmapuri',
  harur: 'Dharmapuri',
  palacode: 'Dharmapuri',
  pennagaram: 'Dharmapuri',
  pappireddipatti: 'Dharmapuri',
  karimangalam: 'Dharmapuri',
  nallampalli: 'Dharmapuri',

  // Dindigul
  dindigul: 'Dindigul',
  dindugal: 'Dindigul',
  palani: 'Dindigul',
  kodaikanal: 'Dindigul',
  oddanchatram: 'Dindigul',
  natham: 'Dindigul',
  nilakkottai: 'Dindigul',
  vedasandur: 'Dindigul',

  // Erode
  erode: 'Erode',
  perundurai: 'Erode',
  bhavani: 'Erode',
  gobichettipalayam: 'Erode',
  gobi: 'Erode',
  sathyamangalam: 'Erode',
  sathy: 'Erode',
  modakkurichi: 'Erode',
  kodumudi: 'Erode',
  anthiyur: 'Erode',
  thalavadi: 'Erode',
  chithode: 'Erode',
  thindal: 'Erode',
  veerappanchatram: 'Erode',
  surampatti: 'Erode',
  solar: 'Erode',

  // Kallakurichi
  kallakurichi: 'Kallakurichi',
  kallakkurichi: 'Kallakurichi',
  sankarapuram: 'Kallakurichi',
  ulundurpet: 'Kallakurichi',
  thirukovilur: 'Kallakurichi',
  tirukkoyilur: 'Kallakurichi',
  chinnasalem: 'Kallakurichi',

  // Kanchipuram
  kanchipuram: 'Kanchipuram',
  kancheepuram: 'Kanchipuram',
  kanchi: 'Kanchipuram',
  conjeevaram: 'Kanchipuram',
  sriperumbudur: 'Kanchipuram',
  walajabad: 'Kanchipuram',
  kundrathur: 'Kanchipuram',
  uthiramerur: 'Kanchipuram',

  // Kanniyakumari
  kanniyakumari: 'Kanniyakumari',
  kanyakumari: 'Kanniyakumari',
  nagercoil: 'Kanniyakumari',
  thuckalay: 'Kanniyakumari',
  marthandam: 'Kanniyakumari',
  padmanabhapuram: 'Kanniyakumari',
  kuzhithurai: 'Kanniyakumari',
  colachel: 'Kanniyakumari',
  agastheeswaram: 'Kanniyakumari',

  // Karur
  karur: 'Karur',
  kulithalai: 'Karur',
  aravakurichi: 'Karur',
  pugalur: 'Karur',
  krishnarayapuram: 'Karur',
  kadavur: 'Karur',

  // Krishnagiri
  krishnagiri: 'Krishnagiri',
  hosur: 'Krishnagiri',
  denkanikottai: 'Krishnagiri',
  pochampalli: 'Krishnagiri',
  uthangarai: 'Krishnagiri',
  bargur: 'Krishnagiri',
  shoolagiri: 'Krishnagiri',

  // Madurai
  madurai: 'Madurai',
  melur: 'Madurai',
  thirumangalam: 'Madurai',
  tirumangalam: 'Madurai',
  usilampatti: 'Madurai',
  vadipatti: 'Madurai',
  peraiyur: 'Madurai',
  sholavandan: 'Madurai',
  thiruparankundram: 'Madurai',

  // Mayiladuthurai
  mayiladuthurai: 'Mayiladuthurai',
  mayiladuturai: 'Mayiladuthurai',
  mayuram: 'Mayiladuthurai',
  sirkazhi: 'Mayiladuthurai',
  sirkali: 'Mayiladuthurai',
  tarangambadi: 'Mayiladuthurai',
  tharangambadi: 'Mayiladuthurai',
  kuthalam: 'Mayiladuthurai',

  // Nagapattinam
  nagapattinam: 'Nagapattinam',
  nagai: 'Nagapattinam',
  velankanni: 'Nagapattinam',
  kilvelur: 'Nagapattinam',
  vedaranyam: 'Nagapattinam',

  // Namakkal
  namakkal: 'Namakkal',
  tiruchengode: 'Namakkal',
  rasipuram: 'Namakkal',
  paramathi: 'Namakkal',
  paramathivelur: 'Namakkal',
  kollihills: 'Namakkal',
  sendamangalam: 'Namakkal',
  kumarapalayam: 'Namakkal',
  komarapalayam: 'Namakkal',

  // Nilgiris
  nilgiris: 'Nilgiris',
  thenilgiris: 'Nilgiris',
  ooty: 'Nilgiris',
  udhagamandalam: 'Nilgiris',
  coonoor: 'Nilgiris',
  kotagiri: 'Nilgiris',
  gudalur: 'Nilgiris',

  // Perambalur
  perambalur: 'Perambalur',
  veppanthattai: 'Perambalur',
  kunnam: 'Perambalur',
  alathur: 'Perambalur',

  // Pudukkottai
  pudukkottai: 'Pudukkottai',
  pudukottai: 'Pudukkottai',
  aranthangi: 'Pudukkottai',
  illuppur: 'Pudukkottai',
  viralimalai: 'Pudukkottai',
  alangudi: 'Pudukkottai',
  thirumayam: 'Pudukkottai',

  // Ramanathapuram
  ramanathapuram: 'Ramanathapuram',
  ramnad: 'Ramanathapuram',
  rameswaram: 'Ramanathapuram',
  paramakudi: 'Ramanathapuram',
  kilakarai: 'Ramanathapuram',
  mudukulathur: 'Ramanathapuram',
  kamuthi: 'Ramanathapuram',

  // Ranipet
  ranipet: 'Ranipet',
  ranipettai: 'Ranipet',
  arakkonam: 'Ranipet',
  arrakonam: 'Ranipet',
  walajah: 'Ranipet',
  arcot: 'Ranipet',
  nemili: 'Ranipet',
  sholinghur: 'Ranipet',

  // Salem
  salem: 'Salem',
  attur: 'Salem',
  mettur: 'Salem',
  omalur: 'Salem',
  edappadi: 'Salem',
  sankari: 'Salem',
  gangavalli: 'Salem',
  valapady: 'Salem',
  yercaud: 'Salem',

  // Sivaganga
  sivaganga: 'Sivaganga',
  sivagangai: 'Sivaganga',
  karaikudi: 'Sivaganga',
  devakottai: 'Sivaganga',
  manamadurai: 'Sivaganga',
  thiruppuvanam: 'Sivaganga',

  // Tenkasi
  tenkasi: 'Tenkasi',
  sankarankovil: 'Tenkasi',
  courtallam: 'Tenkasi',
  kourtallam: 'Tenkasi',
  shenkottai: 'Tenkasi',
  kadayanallur: 'Tenkasi',
  alangulam: 'Tenkasi',

  // Thanjavur
  thanjavur: 'Thanjavur',
  tanjore: 'Thanjavur',
  kumbakonam: 'Thanjavur',
  papanasam: 'Thanjavur',
  pattukkottai: 'Thanjavur',
  peravurani: 'Thanjavur',
  thiruvaiyaru: 'Thanjavur',
  thiruvidaimarudur: 'Thanjavur',

  // Theni
  theni: 'Theni',
  periyakulam: 'Theni',
  bodinayakanur: 'Theni',
  bodi: 'Theni',
  uthamapalayam: 'Theni',
  cumbum: 'Theni',
  andipatti: 'Theni',

  // Thoothukudi
  thoothukudi: 'Thoothukudi',
  tuticorin: 'Thoothukudi',
  thoothukkudi: 'Thoothukudi',
  kovilpatti: 'Thoothukudi',
  tiruchendur: 'Thoothukudi',
  srivaikuntam: 'Thoothukudi',
  kayathar: 'Thoothukudi',

  // Tiruchirappalli (Trichy)
  tiruchirappalli: 'Tiruchirappalli (Trichy)',
  trichy: 'Tiruchirappalli (Trichy)',
  tiruchi: 'Tiruchirappalli (Trichy)',
  tiruchy: 'Tiruchirappalli (Trichy)',
  tiruchirapalli: 'Tiruchirappalli (Trichy)',
  thiruchirappalli: 'Tiruchirappalli (Trichy)',
  thiruchirapalli: 'Tiruchirappalli (Trichy)',
  srirangam: 'Tiruchirappalli (Trichy)',
  thiruverumbur: 'Tiruchirappalli (Trichy)',
  manapparai: 'Tiruchirappalli (Trichy)',
  lalgudi: 'Tiruchirappalli (Trichy)',
  musiri: 'Tiruchirappalli (Trichy)',
  thottiyam: 'Tiruchirappalli (Trichy)',
  thuraiyur: 'Tiruchirappalli (Trichy)',

  // Tirunelveli
  tirunelveli: 'Tirunelveli',
  thirunelveli: 'Tirunelveli',
  nellai: 'Tirunelveli',
  tinnevelly: 'Tirunelveli',
  palayamkottai: 'Tirunelveli',
  ambasamudram: 'Tirunelveli',
  cheranmahadevi: 'Tirunelveli',
  nanguneri: 'Tirunelveli',
  radhapuram: 'Tirunelveli',

  // Tirupathur
  tirupathur: 'Tirupathur',
  tirupattur: 'Tirupathur',
  thirupathur: 'Tirupathur',
  thirupattur: 'Tirupathur',
  vaniyambadi: 'Tirupathur',
  ambur: 'Tirupathur',
  natrampalli: 'Tirupathur',

  // Tiruppur
  tiruppur: 'Tiruppur',
  tirupur: 'Tiruppur',
  thiruppur: 'Tiruppur',
  thirupur: 'Tiruppur',
  avinashi: 'Tiruppur',
  dharapuram: 'Tiruppur',
  kangeyam: 'Tiruppur',
  udumalaipettai: 'Tiruppur',
  udumalpet: 'Tiruppur',
  palladam: 'Tiruppur',
  madathukulam: 'Tiruppur',
  uthukuli: 'Tiruppur',

  // Tiruvallur
  tiruvallur: 'Tiruvallur',
  thiruvallur: 'Tiruvallur',
  avadi: 'Tiruvallur',
  poonamallee: 'Tiruvallur',
  tiruttani: 'Tiruvallur',
  gummidipoondi: 'Tiruvallur',
  ponneri: 'Tiruvallur',
  uthukkottai: 'Tiruvallur',

  // Tiruvannamalai
  tiruvannamalai: 'Tiruvannamalai',
  thiruvannamalai: 'Tiruvannamalai',
  arani: 'Tiruvannamalai',
  polur: 'Tiruvannamalai',
  cheyyar: 'Tiruvannamalai',
  vandavasi: 'Tiruvannamalai',
  chengam: 'Tiruvannamalai',

  // Tiruvarur
  tiruvarur: 'Tiruvarur',
  thiruvarur: 'Tiruvarur',
  mannargudi: 'Tiruvarur',
  nannilam: 'Tiruvarur',
  thiruthuraipoondi: 'Tiruvarur',
  valangaiman: 'Tiruvarur',
  kudavasal: 'Tiruvarur',
  needamangalam: 'Tiruvarur',

  // Vellore
  vellore: 'Vellore',
  katpadi: 'Vellore',
  gudiyatham: 'Vellore',
  anaicut: 'Vellore',
  peranambut: 'Vellore',

  // Villupuram
  villupuram: 'Villupuram',
  viluppuram: 'Villupuram',
  tindivanam: 'Villupuram',
  gingee: 'Villupuram',
  vanur: 'Villupuram',
  marakkanam: 'Villupuram',
  vikravandi: 'Villupuram',

  // Virudhunagar
  virudhunagar: 'Virudhunagar',
  virudunagar: 'Virudhunagar',
  sivakasi: 'Virudhunagar',
  rajapalayam: 'Virudhunagar',
  srivilliputhur: 'Virudhunagar',
  arupukottai: 'Virudhunagar',
  sattur: 'Virudhunagar',
  kariapatti: 'Virudhunagar',
};

/**
 * Normalizes any district string or spelling variant to the exact canonical
 * district option string present in TAMIL_NADU_DISTRICTS dropdown.
 *
 * Example:
 *  "Ariyalur District" -> "Ariyalur"
 *  "Tiruchirappalli" -> "Tiruchirappalli (Trichy)"
 *  "Trichy" -> "Tiruchirappalli (Trichy)"
 *  "Chengalpet" -> "Chengalpattu"
 *  "UnknownPlace" -> null (never silently guesses)
 */
export function normalizeTamilNaduDistrict(rawInput: string | null | undefined): TamilNaduDistrict | null {
  if (!rawInput || typeof rawInput !== 'string') return null;

  const cleaned = cleanAdministrativeText(rawInput);
  if (!cleaned) return null;

  // 1. Direct alias dictionary lookup (without spaces)
  const noSpace = cleaned.replace(/\s+/g, '');
  if (DISTRICT_ALIAS_MAP[noSpace]) {
    return DISTRICT_ALIAS_MAP[noSpace];
  }
  if (DISTRICT_ALIAS_MAP[cleaned]) {
    return DISTRICT_ALIAS_MAP[cleaned];
  }

  // 2. Exact match against official TAMIL_NADU_DISTRICTS
  for (const d of TAMIL_NADU_DISTRICTS) {
    const canonicalClean = cleanAdministrativeText(d);
    if (cleaned === canonicalClean || noSpace === canonicalClean.replace(/\s+/g, '')) {
      return d;
    }
    // Also test without parentheses (e.g. "Tiruchirappalli (Trichy)" -> "tiruchirappalli")
    const baseName = d.replace(/\s*\(.*\)/, '').trim().toLowerCase();
    if (cleaned === baseName || noSpace === baseName.replace(/\s+/g, '')) {
      return d;
    }
  }

  // 3. Substring word boundary match
  for (const [alias, canonical] of Object.entries(DISTRICT_ALIAS_MAP)) {
    if (alias.length >= 4) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(cleaned)) {
        return canonical;
      }
    }
  }

  return null;
}

export interface AddressComponents {
  house_number?: string;
  building?: string;
  road?: string;
  street?: string;
  suburb?: string;
  neighbourhood?: string;
  residential?: string;
  locality?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface DistrictMatchResult {
  district: TamilNaduDistrict | null;
  isOutsideTamilNadu: boolean;
  detectedState?: string;
  detectedDistrictName?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Extracts the official Tamil Nadu district from reverse geocoding address components.
 * Prioritizes administrative boundary tags (state_district, county, district) over localities
 * to strictly prevent false matches (e.g. "Coimbatore Road" in Erode).
 */
export function matchDistrictFromAddress(addr: AddressComponents = {}): DistrictMatchResult {
  const stateRaw = addr.state || '';
  const countryCode = (addr.country_code || '').toLowerCase();

  // 1. Detect if location is explicitly outside Tamil Nadu
  if (stateRaw) {
    const cleanState = cleanAdministrativeText(stateRaw);
    const isTamilNadu =
      cleanState === 'tamil nadu' ||
      cleanState === 'tamilnadu' ||
      cleanState === 'tn';

    if (!isTamilNadu && (countryCode === 'in' || !countryCode)) {
      return {
        district: null,
        isOutsideTamilNadu: true,
        detectedState: stateRaw,
        detectedDistrictName: addr.state_district || addr.county || addr.city || stateRaw,
        confidence: 'none',
      };
    }
  }

  // 2. Priority 1: State District (official administrative level 2)
  if (addr.state_district) {
    const matched = normalizeTamilNaduDistrict(addr.state_district);
    if (matched) {
      return {
        district: matched,
        isOutsideTamilNadu: false,
        confidence: 'high',
      };
    }
  }

  // 3. Priority 2: District attribute
  if (addr.district) {
    const matched = normalizeTamilNaduDistrict(addr.district);
    if (matched) {
      return {
        district: matched,
        isOutsideTamilNadu: false,
        confidence: 'high',
      };
    }
  }

  // 4. Priority 3: County / Taluk
  if (addr.county) {
    const matched = normalizeTamilNaduDistrict(addr.county);
    if (matched) {
      return {
        district: matched,
        isOutsideTamilNadu: false,
        confidence: 'high',
      };
    }
  }

  // 5. Priority 4: City / Town / Village / Municipality
  const cityCandidates = [addr.city, addr.town, addr.municipality, addr.village].filter(Boolean) as string[];
  for (const candidate of cityCandidates) {
    const matched = normalizeTamilNaduDistrict(candidate);
    if (matched) {
      return {
        district: matched,
        isOutsideTamilNadu: false,
        confidence: 'medium',
      };
    }
  }

  // 6. Priority 5: Locality / Suburb (only check whole token match against known towns)
  const localityCandidates = [addr.locality, addr.suburb, addr.neighbourhood].filter(Boolean) as string[];
  for (const candidate of localityCandidates) {
    const matched = normalizeTamilNaduDistrict(candidate);
    if (matched) {
      return {
        district: matched,
        isOutsideTamilNadu: false,
        confidence: 'low',
      };
    }
  }

  return {
    district: null,
    isOutsideTamilNadu: false,
    confidence: 'none',
  };
}

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determines closest Tamil Nadu district by coordinate distance.
 * Serves as an ultra-reliable mathematical fallback if geocoding APIs fail or time out.
 */
export function findClosestTamilNaduDistrict(
  lat: number,
  lon: number
): {
  district: TamilNaduDistrict;
  distanceKm: number;
  isWithinTamilNadu: boolean;
} {
  // Tamil Nadu Bounding Box: Lat 8.0 to 13.6, Lon 76.2 to 80.4
  const isWithinBoundingBox = lat >= 7.9 && lat <= 13.7 && lon >= 76.1 && lon <= 80.5;

  let closestDistrict: TamilNaduDistrict = 'Erode';
  let minDistance = Infinity;

  for (const [name, coords] of Object.entries(TAMIL_NADU_DISTRICT_COORDINATES)) {
    const dist = calculateHaversineDistanceKm(lat, lon, coords.lat, coords.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closestDistrict = name as TamilNaduDistrict;
    }
  }

  // If closest district centroid is more than 85km away or outside bounding box, considered out of state
  const isWithinTamilNadu = isWithinBoundingBox && minDistance <= 85;

  return {
    district: closestDistrict,
    distanceKm: Number(minDistance.toFixed(1)),
    isWithinTamilNadu,
  };
}
