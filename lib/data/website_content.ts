import { WebsiteContent } from '@/types';
import { VIKASA_CONFIG } from '@/lib/constants';

export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  hero: {
    badge: "Erode's Trusted Interior & Plywood Specialists",
    heading: 'Bespoke Interior Design & Master Plywood Craftsmanship',
    headingHighlight: 'in Erode & Tamil Nadu',
    description:
      'Elevate your residential and commercial spaces with turnkey modular kitchens, floor-to-ceiling wardrobes, and acoustic TV units. Built with 100% calibrated boiling-waterproof marine plywood and factory-grade precision.',
    callout: 'Direct Factory Plywood & Turnkey Interiors • Serving Erode & All Tamil Nadu Districts',
    trustBadge1Number: 'IS:710',
    trustBadge1Label: 'BWP Marine Ply',
    trustBadge2Number: 'Factory',
    trustBadge2Label: 'Machine Finish',
    trustBadge3Number: 'Turnkey',
    trustBadge3Label: 'Erode & Beyond',
  },
  contact: {
    phone: VIKASA_CONFIG.phone,
    phoneDisplay: VIKASA_CONFIG.phoneDisplay,
    whatsappNumber: VIKASA_CONFIG.whatsappNumber,
    whatsappDisplay: '+91 98656 52420',
    email: 'contact@vikasaservices.in',
    addressStreet: 'Perundurai Road',
    addressCity: 'Erode',
    addressState: 'Tamil Nadu',
    addressPostalCode: '638001',
    officeHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
  },
  about: {
    title: 'About Vikasa Services & Interiors',
    description:
      'Vikasa Services & Interiors is Tamil Nadu’s dedicated home-service coordination and turnkey interior execution platform headquartered on Perundurai Road, Erode. We connect homeowners with background-verified trade specialists and execute custom plywood carpentry with strict material transparency.',
    highlights: [
      '100% IS:710 Grade Boiling Waterproof Marine Plywood',
      'Factory CNC edge-banding & precision hardware installation',
      'Direct human operations coordinator for every home service',
      'Prompt transparent estimates with zero hidden contractor margins',
    ],
  },
  faqs: [
    {
      id: 'faq-1',
      question: 'What grade of plywood and hardware does Vikasa Interiors use for modular kitchens and wardrobes in Erode?',
      answer:
        'We strictly utilize 100% IS:710 certified Boiling Waterproof (BWP) marine-grade plywood with calibrated cores for all kitchen and wardrobe frameworks. Surfaces are finished with scratch-resistant acrylic or high-pressure laminates with factory CNC edge-banding. For hardware, we integrate premium soft-close tandem boxes, concealed hydraulic hinges, and anti-warp aluminum profiles from trusted brands like Hafele, Hettich, and Ebco.',
      order: 1,
    },
    {
      id: 'faq-2',
      question: 'What is the difference between turnkey interior design and on-demand home trade repairs?',
      answer:
        'Turnkey interior design is an end-to-end service where our team manages the complete space transformation—from initial 3D design and space planning to factory woodwork, false ceiling, lighting, painting, and handover in Erode and across Tamil Nadu. In contrast, on-demand home services dispatch verified individual technicians (carpenters, electricians, plumbers, painters, or AC mechanics) for specific repair or installation tasks via our coordinator-managed dispatch pool.',
      order: 2,
    },
    {
      id: 'faq-3',
      question: 'Which areas in Erode and Tamil Nadu does Vikasa Services cover?',
      answer:
        'Our primary operational base covers all areas in Erode, including Perundurai Road, Thindal, Bhavani, Gobichettipalayam, Chithode, Modakkurichi, Veerappanchatram, Surampatti, Solar, and Komarapalayam. We also execute complete residential turnkey interior projects across western and central Tamil Nadu, including Coimbatore, Salem, Tiruppur, and Namakkal upon prior consultation.',
      order: 3,
    },
    {
      id: 'faq-4',
      question: 'How does Vikasa protect customer privacy and ensure technician quality?',
      answer:
        'Unlike open contractor listing portals that broadcast your phone number to multiple random vendors, Vikasa operates on a 100% human-coordinated dispatch model. A dedicated operations coordinator verifies your requirement over the phone and assigns a background-verified specialist from our internal pool. Your contact details remain confidential with our coordination desk.',
      order: 4,
    },
    {
      id: 'faq-5',
      question: 'How can I get a 3D design consultation and cost estimate for my home in Erode?',
      answer:
        'You can request a free consultation either online through our Book a Service form or by contacting our helpline directly via Phone or WhatsApp at +91 98656 52420. Our coordinator will schedule a convenient site measurement visit in Erode, after which we deliver a detailed 3D layout, material specifications, and transparent itemized pricing.',
      order: 5,
    },
    {
      id: 'faq-6',
      question: 'What warranties are provided on interior woodwork and installations?',
      answer:
        'Our BWP 710 marine plywood carries up to a 10-year warranty against borer infestation and delamination under standard residential usage. All functional hardware components (hydraulic hinges, drawer runners) carry respective manufacturer warranties, and our installation workmanship is backed by post-handover support.',
      order: 6,
    },
  ],
  showcase: [
    {
      id: 'showcase-1',
      title: 'Modern Modular Kitchen',
      subtitle: 'Perundurai Road, Erode',
      image: '/showcase/modular_kitchen_erode.webp',
      alt: 'Luxury modular kitchen interior design in Erode with quartz countertop and fluted cabinets',
      tags: ['BWP Marine Ply', 'Soft-Close Hardware', 'Quartz Countertop', 'Built-in Pantry'],
      description:
        'Engineered for Indian cooking styles with 710-grade boiling waterproof plywood, scratch-resistant acrylic shutters, and ergonomic pull-out tandem boxes.',
      categorySlug: 'interior-design',
    },
    {
      id: 'showcase-2',
      title: 'Custom Floor-to-Ceiling Wardrobe',
      subtitle: 'Thindal, Erode',
      image: '/showcase/custom_wardrobe_erode.webp',
      alt: 'Bespoke floor to ceiling wardrobe with fluted oak panels and concealed LED lighting in Erode',
      tags: ['Fluted Oak Panels', 'Concealed Warm LEDs', 'Vanity Integration', 'Anti-Warp Frame'],
      description:
        'Seamless master bedroom storage featuring calibrated plywood core, anti-warp profile handles, smoked glass display cabinets, and motion-sensing LED wardrobe lighting.',
      categorySlug: 'interior-design',
    },
    {
      id: 'showcase-3',
      title: 'Luxury Living & TV Entertainment Unit',
      subtitle: 'Bhavani Road, Erode',
      image: '/showcase/living_room_erode.webp',
      alt: 'Contemporary living room TV entertainment unit with acoustic fluted paneling in Erode',
      tags: ['Acoustic Wall Paneling', 'Floating Console', 'Marble Texture', 'Cable Management'],
      description:
        'Statement living room focal point with floating wooden media console, concealed ambient cove lighting, Italian marble accents, and hidden wire management.',
      categorySlug: 'interior-design',
    },
  ],
};

