export type Language = 'en' | 'ta';

export interface TranslationDictionary {
  brandName: string;
  brandTagline: string;
  taglineSubtitle: string;
  languageName: string;
  switchLanguage: string;
  
  // Navigation
  navHome: string;
  navServices: string;
  navTrack: string;
  navBook: string;
  navHelpline: string;
  navWhatsApp: string;

  // Customer Form
  formTitle: string;
  formSubtitle: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  mobileLabel: string;
  mobilePlaceholder: string;
  mobileHint: string;
  serviceLabel: string;
  preferredDateLabel: string;
  districtLabel: string;
  addressLabel: string;
  addressPlaceholder: string;
  useGpsButton: string;
  gpsLocatingText: string;
  gpsSuccessText: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  customServiceLabel: string;
  customServicePlaceholder: string;
  submitButtonText: string;
  submittingText: string;
  privacyNotice: string;

  // Form Validation Errors
  errNameRequired: string;
  errPhoneInvalid: string;
  errServiceRequired: string;
  errDateRequired: string;
  errDistrictRequired: string;
  errCustomServiceRequired: string;
  errSubmitFailed: string;

  // Confirmation
  confirmTitle: string;
  confirmSubtitle: string;
  requestRefLabel: string;
  serviceBookedLabel: string;
  trackButtonText: string;
  homeButtonText: string;
  callCoordinatorText: string;

  // Services
  services: {
    [key: string]: {
      name: string;
      description: string;
    };
  };
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    brandName: 'VIKASA',
    brandTagline: 'Interior & Home Services',
    taglineSubtitle: 'Managed Service Dispatch across Tamil Nadu',
    languageName: 'English',
    switchLanguage: 'தமிழ்',

    navHome: 'Home',
    navServices: 'Services',
    navTrack: 'Track Status',
    navBook: 'Book Service',
    navHelpline: 'Call Helpline',
    navWhatsApp: 'WhatsApp',

    formTitle: 'Book Verified Doorstep Service',
    formSubtitle: 'Quick 30-second request. No upfront payment. Our coordinator will call to confirm.',
    fullNameLabel: 'Your Full Name',
    fullNamePlaceholder: 'e.g. Arun Kumar',
    mobileLabel: 'Mobile Number',
    mobilePlaceholder: '10-digit mobile number',
    mobileHint: 'Our operations coordinator will call this number to confirm requirement.',
    serviceLabel: 'Service Required',
    preferredDateLabel: 'Preferred Service Date',
    districtLabel: 'District in Tamil Nadu',
    addressLabel: 'Street Address or Area',
    addressPlaceholder: 'e.g. 5th Cross, Fairlands, Salem',
    useGpsButton: 'Use Current GPS Location',
    gpsLocatingText: 'Detecting your location...',
    gpsSuccessText: 'GPS Location detected successfully',
    descriptionLabel: 'Problem Description (Optional)',
    descriptionPlaceholder: 'Describe the issue briefly (e.g. Water leaking under sink since yesterday)',
    customServiceLabel: 'Describe the Service You Need',
    customServicePlaceholder: 'e.g. Solar water heater maintenance, Chimney repair',
    submitButtonText: 'Submit Service Request',
    submittingText: 'Submitting Request...',
    privacyNotice: 'Privacy Guaranteed: Your phone number is strictly used by our internal coordinator. It is never displayed publicly or shared with unverified parties.',

    errNameRequired: 'Please enter your full name (minimum 2 letters).',
    errPhoneInvalid: 'Please enter a valid 10-digit Indian mobile number (e.g. 98401 22334).',
    errServiceRequired: 'Please select a service category.',
    errDateRequired: 'Please select your preferred date.',
    errDistrictRequired: 'Please select your district.',
    errCustomServiceRequired: 'Please specify the service you need.',
    errSubmitFailed: 'Unable to submit request right now. Please call our helpline directly at 9865652420.',

    confirmTitle: 'Service Request Confirmed!',
    confirmSubtitle: 'Our central coordinator is reviewing your requirement and will call you shortly to confirm timing and dispatch.',
    requestRefLabel: 'Request Reference Number',
    serviceBookedLabel: 'Booked Service',
    trackButtonText: 'Track Live Status',
    homeButtonText: 'Back to Home',
    callCoordinatorText: 'Need urgent dispatch? Call our coordinator directly',

    services: {
      'Plumbing': { name: 'Plumbing', description: 'Taps, pipe leaks, flush tanks, water tank fittings' },
      'Electrical': { name: 'Electrical', description: 'Switchboards, MCB, ceiling fans, lighting, wiring' },
      'Carpentry': { name: 'Carpentry', description: 'Door locks, hinges, wood furniture repairs, custom fittings' },
      'AC Service': { name: 'AC Service', description: 'AC jet cleaning, gas charging, cooling faults, repair' },
      'Cleaning': { name: 'Deep Cleaning', description: 'Bathroom deep clean, water tank cleaning, sanitization' },
      'Painting': { name: 'Painting', description: 'Interior touch-up, wall crack repair, full house repaint' },
      'Interior Design': { name: 'Interior Design', description: 'Modular kitchens, false ceiling, wardrobes, woodwork' },
      'Other': { name: 'Other / New Service', description: 'Request any custom or specialized home requirement' },
    },
  },

  ta: {
    brandName: 'விகாசா',
    brandTagline: 'உள் அலங்காரம் & வீட்டுப் பராமரிப்பு சேவைகள்',
    taglineSubtitle: 'தமிழ்நாடு முழுதும் நம்பகமான நேரடி சேவை',
    languageName: 'தமிழ்',
    switchLanguage: 'English',

    navHome: 'முகப்பு',
    navServices: 'சேவைகள்',
    navTrack: 'கோரிக்கை நிலை',
    navBook: 'சேவை பதிவு',
    navHelpline: 'உதவி எண்',
    navWhatsApp: 'வாட்ஸ்அப்',

    formTitle: 'நம்பகமான வீட்டு சேவை பதிவு செய்யுங்கள்',
    formSubtitle: '30 நொடிகளில் எளிய பதிவு. முன்கட்டணம் தேவையில்லை. எங்கள் ஒருங்கிணைப்பாளர் உங்களை அழைப்பார்.',
    fullNameLabel: 'உங்கள் பெயர்',
    fullNamePlaceholder: 'எ.கா: அருண் குமார்',
    mobileLabel: 'கைபேசி எண் (Mobile Number)',
    mobilePlaceholder: '10 இலக்க மொபைல் எண்',
    mobileHint: 'எங்கள் அலுவலக ஒருங்கிணைப்பாளர் இந்த எண்ணிற்கு அழைத்து உறுதி செய்வார்.',
    serviceLabel: 'தேவையான சேவை',
    preferredDateLabel: 'விருப்பமான தேதி',
    districtLabel: 'மாவட்டம் (District)',
    addressLabel: 'முகவரி / தெரு / பகுதி',
    addressPlaceholder: 'எ.கா: 5வது குறுக்குத் தெரு, ஃபேர்லான்ட்ஸ், சேலம்',
    useGpsButton: 'தற்போதைய GPS இருப்பிடத்தைப் பயன்படுத்து',
    gpsLocatingText: 'இருப்பிடம் கண்டறியப்படுகிறது...',
    gpsSuccessText: 'GPS இருப்பிடம் வெற்றிகரமாக பெறப்பட்டது',
    descriptionLabel: 'வேலை பற்றிய குறிப்பு (விருப்பம்)',
    descriptionPlaceholder: 'பிரச்சினையை சுருக்கமாக குறிப்பிடவும் (எ.கா: சிங்க் அடியில் குழாய் கசிகிறது)',
    customServiceLabel: 'உங்களுக்கு தேவையான புதிய சேவையை விவரிக்கவும்',
    customServicePlaceholder: 'எ.கா: சோலார் வாட்டர் ஹீட்டர் பழுது, சிம்னி சர்வீஸ்',
    submitButtonText: 'சேவை கோரிக்கையை சமர்ப்பிக்கவும்',
    submittingText: 'சமர்ப்பிக்கப்படுகிறது...',
    privacyNotice: 'பாதுகாப்பு உறுதி: உங்கள் மொபைல் எண் எங்கள் விகாசா அலுவலக பயன்பாட்டிற்கு மட்டுமே. பொதுவெளியிலோ அனுமதியற்றவர்களுக்கோ ஒருபோதும் பகிரப்படாது.',

    errNameRequired: 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும் (குறைந்தது 2 எழுத்துகள்).',
    errPhoneInvalid: 'சரியான 10 இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும் (எ.கா: 98401 22334).',
    errServiceRequired: 'தயவுசெய்து ஒரு சேவையை தேர்ந்தெடுக்கவும்.',
    errDateRequired: 'விருப்பமான தேதியை தேர்ந்தெடுக்கவும்.',
    errDistrictRequired: 'உங்கள் மாவட்டத்தை தேர்ந்தெடுக்கவும்.',
    errCustomServiceRequired: 'உங்களுக்கு தேவையான சேவையை குறிப்பிடவும்.',
    errSubmitFailed: 'கோரிக்கையை அனுப்ப இயலவில்லை. தயவுசெய்து எங்களின் உதவி எண்ணை (9865652420) நேரடியாக அழைக்கவும்.',

    confirmTitle: 'சேவை கோரிக்கை பதிவு செய்யப்பட்டது!',
    confirmSubtitle: 'எங்கள் விகாசா ஒருங்கிணைப்பாளர் உங்கள் கோரிக்கையை பரிசீலித்து, சிறிது நேரத்தில் உங்களை தொலைபேசியில் தொடர்பு கொள்வார்.',
    requestRefLabel: 'கோரிக்கை குறிப்பு எண்',
    serviceBookedLabel: 'பதிவு செய்யப்பட்ட சேவை',
    trackButtonText: 'நேரலை நிலையை கண்காணிக்க',
    homeButtonText: 'முகப்புக்குச் செல்ல',
    callCoordinatorText: 'அவசர உதவி தேவையா? நேரடியாக ஒருங்கிணைப்பாளரை அழைக்கவும்',

    services: {
      'Plumbing': { name: 'குழாய் பழுது (Plumbing)', description: 'குழாய் மாற்றுதல், நீர் கசிவு சரிசெய்தல், டேங்க் வேலைகள்' },
      'Electrical': { name: 'மின்சார வேலை (Electrical)', description: 'சுவிட்ச்போர்டு, ஃபேன் மாட்டுதல், MCB ட்ரிப் சரிசெய்தல், வயரிங்' },
      'Carpentry': { name: 'மர வேலை (Carpentry)', description: 'கதவு பூட்டு சரிசெய்தல், மர அலமாரி, பர்னிச்சர் பழுது' },
      'AC Service': { name: 'ஏசி சர்வீஸ் (AC Service)', description: 'ஏசி ஜெட் வாஷ், கேஸ் நிரப்புதல், கூலிங் பிரச்சனை சரிசெய்தல்' },
      'Cleaning': { name: 'சுத்தம் செய்தல் (Cleaning)', description: 'குளியலறை ஆழமான சுத்தம், வாட்டர் டேங்க் சுத்தம் செய்தல்' },
      'Painting': { name: 'பெயிண்டிங் (Painting)', description: 'உள் சுவர் பெயிண்ட், சுவர் விரிசல் சரிசெய்தல்' },
      'Interior Design': { name: 'உள் அலங்காரம் (Interior)', description: 'மாடுலர் கிச்சன், பால்ஸ் சீலிங், வார்ட்ரோப் மரவேலை' },
      'Other': { name: 'பிற / புதிய சேவை (Other)', description: 'பட்டியலில் இல்லாத பிற வீட்டுப் பராமரிப்பு வேலைகள்' },
    },
  },
};
