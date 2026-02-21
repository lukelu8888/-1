// Freight rate data simulating API responses from services like Freightos, Xeneta, etc.

export interface FreightRate {
  carrier: string;
  carrierLogo?: string;
  service: 'Standard' | 'Express' | 'Economy';
  rate20GP: number;
  rate40GP: number;
  rate40HC: number;
  transitTime: string;
  validUntil: string;
  includes: string[];
  excludes: string[];
  reliability: number; // 0-100
  available: boolean;
}

export interface RouteRates {
  origin: string;
  destination: string;
  lastUpdated: string;
  rates: FreightRate[];
}

// Mock freight rates database
export const freightRatesDatabase: { [key: string]: RouteRates } = {
  'Shanghai-Los Angeles': {
    origin: 'Shanghai, China',
    destination: 'Los Angeles, USA',
    lastUpdated: new Date().toISOString(),
    rates: [
      {
        carrier: 'COSCO SHIPPING',
        service: 'Standard',
        rate20GP: 1850,
        rate40GP: 2650,
        rate40HC: 2850,
        transitTime: '15-18 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance', 'Inland delivery'],
        reliability: 95,
        available: true,
      },
      {
        carrier: 'MSC',
        service: 'Economy',
        rate20GP: 1650,
        rate40GP: 2350,
        rate40HC: 2550,
        transitTime: '18-22 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation'],
        excludes: ['Insurance', 'Destination port fees', 'Customs clearance'],
        reliability: 88,
        available: true,
      },
      {
        carrier: 'Maersk',
        service: 'Express',
        rate20GP: 2250,
        rate40GP: 3150,
        rate40HC: 3450,
        transitTime: '12-14 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Premium insurance', 'Priority loading'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 98,
        available: true,
      },
      {
        carrier: 'CMA CGM',
        service: 'Standard',
        rate20GP: 1900,
        rate40GP: 2700,
        rate40HC: 2900,
        transitTime: '16-19 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 92,
        available: true,
      },
      {
        carrier: 'Hapag-Lloyd',
        service: 'Standard',
        rate20GP: 1950,
        rate40GP: 2750,
        rate40HC: 2950,
        transitTime: '15-17 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 94,
        available: true,
      },
    ],
  },
  'Shanghai-New York': {
    origin: 'Shanghai, China',
    destination: 'New York, USA',
    lastUpdated: new Date().toISOString(),
    rates: [
      {
        carrier: 'COSCO SHIPPING',
        service: 'Standard',
        rate20GP: 2450,
        rate40GP: 3650,
        rate40HC: 3950,
        transitTime: '22-25 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 94,
        available: true,
      },
      {
        carrier: 'MSC',
        service: 'Economy',
        rate20GP: 2150,
        rate40GP: 3250,
        rate40HC: 3550,
        transitTime: '25-30 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation'],
        excludes: ['Insurance', 'Destination port fees', 'Customs clearance'],
        reliability: 86,
        available: true,
      },
      {
        carrier: 'Maersk',
        service: 'Express',
        rate20GP: 2950,
        rate40GP: 4350,
        rate40HC: 4750,
        transitTime: '18-21 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Premium insurance', 'Priority loading'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 97,
        available: true,
      },
    ],
  },
  'Shenzhen-Hamburg': {
    origin: 'Shenzhen, China',
    destination: 'Hamburg, Germany',
    lastUpdated: new Date().toISOString(),
    rates: [
      {
        carrier: 'MSC',
        service: 'Standard',
        rate20GP: 2200,
        rate40GP: 3400,
        rate40HC: 3700,
        transitTime: '28-32 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 90,
        available: true,
      },
      {
        carrier: 'Maersk',
        service: 'Standard',
        rate20GP: 2350,
        rate40GP: 3550,
        rate40HC: 3850,
        transitTime: '26-30 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 95,
        available: true,
      },
      {
        carrier: 'Hapag-Lloyd',
        service: 'Express',
        rate20GP: 2750,
        rate40GP: 4050,
        rate40HC: 4450,
        transitTime: '22-25 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Premium insurance', 'Priority loading'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 96,
        available: true,
      },
      {
        carrier: 'CMA CGM',
        service: 'Economy',
        rate20GP: 1950,
        rate40GP: 3050,
        rate40HC: 3350,
        transitTime: '32-36 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation'],
        excludes: ['Insurance', 'Destination port fees', 'Customs clearance'],
        reliability: 85,
        available: true,
      },
    ],
  },
  'Xiamen-Rotterdam': {
    origin: 'Xiamen, China',
    destination: 'Rotterdam, Netherlands',
    lastUpdated: new Date().toISOString(),
    rates: [
      {
        carrier: 'MSC',
        service: 'Standard',
        rate20GP: 2100,
        rate40GP: 3300,
        rate40HC: 3600,
        transitTime: '30-34 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 89,
        available: true,
      },
      {
        carrier: 'Maersk',
        service: 'Standard',
        rate20GP: 2250,
        rate40GP: 3450,
        rate40HC: 3750,
        transitTime: '28-32 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 94,
        available: true,
      },
    ],
  },
  'Shanghai-Santos': {
    origin: 'Shanghai, China',
    destination: 'Santos, Brazil',
    lastUpdated: new Date().toISOString(),
    rates: [
      {
        carrier: 'COSCO SHIPPING',
        service: 'Standard',
        rate20GP: 2850,
        rate40GP: 4250,
        rate40HC: 4650,
        transitTime: '35-40 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 91,
        available: true,
      },
      {
        carrier: 'MSC',
        service: 'Economy',
        rate20GP: 2550,
        rate40GP: 3850,
        rate40HC: 4250,
        transitTime: '40-45 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation'],
        excludes: ['Insurance', 'Destination port fees', 'Customs clearance'],
        reliability: 84,
        available: true,
      },
      {
        carrier: 'Hapag-Lloyd',
        service: 'Standard',
        rate20GP: 2950,
        rate40GP: 4350,
        rate40HC: 4750,
        transitTime: '32-38 days',
        validUntil: '2024-12-31',
        includes: ['Port charges', 'Documentation', 'Basic insurance'],
        excludes: ['Destination port fees', 'Customs clearance'],
        reliability: 93,
        available: true,
      },
    ],
  },
};

// Popular routes
export const popularRoutes = [
  { label: 'Shanghai → Los Angeles', value: 'Shanghai-Los Angeles' },
  { label: 'Shanghai → New York', value: 'Shanghai-New York' },
  { label: 'Shenzhen → Hamburg', value: 'Shenzhen-Hamburg' },
  { label: 'Xiamen → Rotterdam', value: 'Xiamen-Rotterdam' },
  { label: 'Shanghai → Santos', value: 'Shanghai-Santos' },
];

// Major ports - Comprehensive global port database
export const majorPorts = {
  china: [
    { name: 'Shanghai', country: 'China', code: 'CNSHA' },
    { name: 'Shenzhen', country: 'China', code: 'CNSZX' },
    { name: 'Ningbo', country: 'China', code: 'CNNGB' },
    { name: 'Guangzhou', country: 'China', code: 'CNGZH' },
    { name: 'Qingdao', country: 'China', code: 'CNTAO' },
    { name: 'Tianjin', country: 'China', code: 'CNTSN' },
    { name: 'Xiamen', country: 'China', code: 'CNXMN' },
    { name: 'Dalian', country: 'China', code: 'CNDLC' },
    { name: 'Yantian', country: 'China', code: 'CNYTN' },
    { name: 'Lianyungang', country: 'China', code: 'CNLYG' },
  ],
  northAmerica: [
    // USA - West Coast
    { name: 'Los Angeles', country: 'USA', code: 'USLAX' },
    { name: 'Long Beach', country: 'USA', code: 'USLGB' },
    { name: 'Oakland', country: 'USA', code: 'USOAK' },
    { name: 'Seattle', country: 'USA', code: 'USSEA' },
    { name: 'Tacoma', country: 'USA', code: 'USTIW' },
    { name: 'Portland', country: 'USA', code: 'USPDX' },
    // USA - East Coast
    { name: 'New York', country: 'USA', code: 'USNYC' },
    { name: 'Newark', country: 'USA', code: 'USEWR' },
    { name: 'Savannah', country: 'USA', code: 'USSAV' },
    { name: 'Charleston', country: 'USA', code: 'USCHS' },
    { name: 'Norfolk', country: 'USA', code: 'USORF' },
    { name: 'Baltimore', country: 'USA', code: 'USBAL' },
    { name: 'Boston', country: 'USA', code: 'USBOS' },
    { name: 'Philadelphia', country: 'USA', code: 'USPHL' },
    { name: 'Miami', country: 'USA', code: 'USMIA' },
    { name: 'Jacksonville', country: 'USA', code: 'USJAX' },
    // USA - Gulf Coast
    { name: 'Houston', country: 'USA', code: 'USHOU' },
    { name: 'New Orleans', country: 'USA', code: 'USMSY' },
    { name: 'Mobile', country: 'USA', code: 'USMOB' },
    // Canada
    { name: 'Vancouver', country: 'Canada', code: 'CAVAN' },
    { name: 'Montreal', country: 'Canada', code: 'CAMTR' },
    { name: 'Halifax', country: 'Canada', code: 'CAHAL' },
    { name: 'Prince Rupert', country: 'Canada', code: 'CAPRU' },
    // Mexico
    { name: 'Manzanillo', country: 'Mexico', code: 'MXZLO' },
    { name: 'Veracruz', country: 'Mexico', code: 'MXVER' },
    { name: 'Lazaro Cardenas', country: 'Mexico', code: 'MXLZC' },
    { name: 'Altamira', country: 'Mexico', code: 'MXATM' },
  ],
  europe: [
    // Netherlands
    { name: 'Rotterdam', country: 'Netherlands', code: 'NLRTM' },
    { name: 'Amsterdam', country: 'Netherlands', code: 'NLAMS' },
    // Germany
    { name: 'Hamburg', country: 'Germany', code: 'DEHAM' },
    { name: 'Bremerhaven', country: 'Germany', code: 'DEBRV' },
    // Belgium
    { name: 'Antwerp', country: 'Belgium', code: 'BEANR' },
    { name: 'Zeebrugge', country: 'Belgium', code: 'BEZEE' },
    // UK
    { name: 'Felixstowe', country: 'UK', code: 'GBFXT' },
    { name: 'Southampton', country: 'UK', code: 'GBSOU' },
    { name: 'London Gateway', country: 'UK', code: 'GBLGP' },
    { name: 'Liverpool', country: 'UK', code: 'GBLIV' },
    // France
    { name: 'Le Havre', country: 'France', code: 'FRLEH' },
    { name: 'Marseille', country: 'France', code: 'FRMRS' },
    { name: 'Dunkirk', country: 'France', code: 'FRDKK' },
    // Spain
    { name: 'Barcelona', country: 'Spain', code: 'ESBCN' },
    { name: 'Valencia', country: 'Spain', code: 'ESVLC' },
    { name: 'Algeciras', country: 'Spain', code: 'ESALG' },
    { name: 'Bilbao', country: 'Spain', code: 'ESBIO' },
    // Italy
    { name: 'Genoa', country: 'Italy', code: 'ITGOA' },
    { name: 'La Spezia', country: 'Italy', code: 'ITLSP' },
    { name: 'Naples', country: 'Italy', code: 'ITNAP' },
    { name: 'Gioia Tauro', country: 'Italy', code: 'ITGIT' },
    // Greece
    { name: 'Piraeus', country: 'Greece', code: 'GRPIR' },
    { name: 'Thessaloniki', country: 'Greece', code: 'GRTHE' },
    // Other Europe
    { name: 'Gdansk', country: 'Poland', code: 'PLGDN' },
    { name: 'Copenhagen', country: 'Denmark', code: 'DKCPH' },
    { name: 'Gothenburg', country: 'Sweden', code: 'SEGOT' },
    { name: 'Helsinki', country: 'Finland', code: 'FIHEL' },
    { name: 'Oslo', country: 'Norway', code: 'NOOSL' },
    { name: 'Dublin', country: 'Ireland', code: 'IEDUB' },
    { name: 'Lisbon', country: 'Portugal', code: 'PTLIS' },
  ],
  southAmerica: [
    // Brazil
    { name: 'Santos', country: 'Brazil', code: 'BRSSZ' },
    { name: 'Rio de Janeiro', country: 'Brazil', code: 'BRRIO' },
    { name: 'Paranagua', country: 'Brazil', code: 'BRPNG' },
    { name: 'Itajai', country: 'Brazil', code: 'BRITJ' },
    { name: 'Salvador', country: 'Brazil', code: 'BRSSA' },
    { name: 'Manaus', country: 'Brazil', code: 'BRMAO' },
    // Argentina
    { name: 'Buenos Aires', country: 'Argentina', code: 'ARBUE' },
    { name: 'Rosario', country: 'Argentina', code: 'ARROS' },
    // Chile
    { name: 'Valparaiso', country: 'Chile', code: 'CLVAP' },
    { name: 'San Antonio', country: 'Chile', code: 'CLSAI' },
    // Peru
    { name: 'Callao', country: 'Peru', code: 'PECLL' },
    // Colombia
    { name: 'Cartagena', country: 'Colombia', code: 'COCTG' },
    { name: 'Buenaventura', country: 'Colombia', code: 'COBUN' },
    { name: 'Barranquilla', country: 'Colombia', code: 'COBAQ' },
    // Ecuador
    { name: 'Guayaquil', country: 'Ecuador', code: 'ECGYE' },
    // Uruguay
    { name: 'Montevideo', country: 'Uruguay', code: 'UYMVD' },
    // Venezuela
    { name: 'Puerto Cabello', country: 'Venezuela', code: 'VEPCB' },
    { name: 'La Guaira', country: 'Venezuela', code: 'VELGU' },
  ],
  africa: [
    // South Africa
    { name: 'Durban', country: 'South Africa', code: 'ZADUR' },
    { name: 'Cape Town', country: 'South Africa', code: 'ZACPT' },
    { name: 'Port Elizabeth', country: 'South Africa', code: 'ZAPLZ' },
    // Nigeria
    { name: 'Lagos', country: 'Nigeria', code: 'NGLOS' },
    { name: 'Port Harcourt', country: 'Nigeria', code: 'NGPHC' },
    // Kenya
    { name: 'Mombasa', country: 'Kenya', code: 'KEMBA' },
    // Tanzania
    { name: 'Dar es Salaam', country: 'Tanzania', code: 'TZDAR' },
    // Egypt
    { name: 'Port Said', country: 'Egypt', code: 'EGPSD' },
    { name: 'Alexandria', country: 'Egypt', code: 'EGALY' },
    { name: 'Damietta', country: 'Egypt', code: 'EGDAM' },
    // Morocco
    { name: 'Casablanca', country: 'Morocco', code: 'MACAS' },
    { name: 'Tangier', country: 'Morocco', code: 'MATAN' },
    // Ghana
    { name: 'Tema', country: 'Ghana', code: 'GHTEM' },
    // Ivory Coast
    { name: 'Abidjan', country: 'Ivory Coast', code: 'CIABJ' },
    // Senegal
    { name: 'Dakar', country: 'Senegal', code: 'SNDKR' },
    // Angola
    { name: 'Luanda', country: 'Angola', code: 'AOLAD' },
    // Cameroon
    { name: 'Douala', country: 'Cameroon', code: 'CMDLA' },
    // Mozambique
    { name: 'Maputo', country: 'Mozambique', code: 'MZMPM' },
    // Liberia
    { name: 'Monrovia', country: 'Liberia', code: 'LRMLW' },
    { name: 'Freeport', country: 'Liberia', code: 'LRFPO' },
    // Algeria
    { name: 'Algiers', country: 'Algeria', code: 'DZALG' },
    { name: 'Oran', country: 'Algeria', code: 'DZORN' },
    // Tunisia
    { name: 'Tunis', country: 'Tunisia', code: 'TNTUN' },
    // Namibia
    { name: 'Walvis Bay', country: 'Namibia', code: 'NAWVB' },
  ],
  middleEast: [
    // UAE
    { name: 'Jebel Ali', country: 'UAE', code: 'AEJEA' },
    { name: 'Dubai', country: 'UAE', code: 'AEDXB' },
    { name: 'Abu Dhabi', country: 'UAE', code: 'AEAUH' },
    { name: 'Sharjah', country: 'UAE', code: 'AESHJ' },
    // Saudi Arabia
    { name: 'Jeddah', country: 'Saudi Arabia', code: 'SAJED' },
    { name: 'Dammam', country: 'Saudi Arabia', code: 'SADAM' },
    { name: 'Riyadh', country: 'Saudi Arabia', code: 'SARUH' },
    // Oman
    { name: 'Salalah', country: 'Oman', code: 'OMSLL' },
    { name: 'Mascat', country: 'Oman', code: 'OMMCT' },
    // Qatar
    { name: 'Doha', country: 'Qatar', code: 'QADOH' },
    { name: 'Hamad Port', country: 'Qatar', code: 'QAHAD' },
    // Kuwait
    { name: 'Kuwait', country: 'Kuwait', code: 'KWKWI' },
    // Bahrain
    { name: 'Manama', country: 'Bahrain', code: 'BHBAH' },
    // Israel
    { name: 'Haifa', country: 'Israel', code: 'ILHFA' },
    { name: 'Ashdod', country: 'Israel', code: 'ILASD' },
    // Jordan
    { name: 'Aqaba', country: 'Jordan', code: 'JOAQJ' },
    // Lebanon
    { name: 'Beirut', country: 'Lebanon', code: 'LBBEY' },
    // Turkey
    { name: 'Istanbul', country: 'Turkey', code: 'TRIST' },
    { name: 'Izmir', country: 'Turkey', code: 'TRAYT' },
    { name: 'Mersin', country: 'Turkey', code: 'TRMER' },
    // Iran
    { name: 'Bandar Abbas', country: 'Iran', code: 'IRBND' },
  ],
  asia: [
    // Singapore
    { name: 'Singapore', country: 'Singapore', code: 'SGSIN' },
    // Hong Kong
    { name: 'Hong Kong', country: 'Hong Kong', code: 'HKHKG' },
    // Japan
    { name: 'Tokyo', country: 'Japan', code: 'JPTYO' },
    { name: 'Yokohama', country: 'Japan', code: 'JPYOK' },
    { name: 'Kobe', country: 'Japan', code: 'JPUKB' },
    { name: 'Osaka', country: 'Japan', code: 'JPOSA' },
    { name: 'Nagoya', country: 'Japan', code: 'JPNGO' },
    // South Korea
    { name: 'Busan', country: 'South Korea', code: 'KRPUS' },
    { name: 'Incheon', country: 'South Korea', code: 'KRINC' },
    { name: 'Gwangyang', country: 'South Korea', code: 'KRKUV' },
    // Taiwan
    { name: 'Kaohsiung', country: 'Taiwan', code: 'TWKHH' },
    { name: 'Keelung', country: 'Taiwan', code: 'TWKEL' },
    { name: 'Taichung', country: 'Taiwan', code: 'TWTXG' },
    // Malaysia
    { name: 'Port Klang', country: 'Malaysia', code: 'MYPKG' },
    { name: 'Penang', country: 'Malaysia', code: 'MYPEN' },
    { name: 'Johor', country: 'Malaysia', code: 'MYJHB' },
    // Thailand
    { name: 'Bangkok', country: 'Thailand', code: 'THBKK' },
    { name: 'Laem Chabang', country: 'Thailand', code: 'THLCH' },
    // Vietnam
    { name: 'Ho Chi Minh', country: 'Vietnam', code: 'VNSGN' },
    { name: 'Haiphong', country: 'Vietnam', code: 'VNHPH' },
    { name: 'Da Nang', country: 'Vietnam', code: 'VNDAD' },
    // Indonesia
    { name: 'Jakarta', country: 'Indonesia', code: 'IDJKT' },
    { name: 'Surabaya', country: 'Indonesia', code: 'IDSUB' },
    { name: 'Belawan', country: 'Indonesia', code: 'IDBEW' },
    // Philippines
    { name: 'Manila', country: 'Philippines', code: 'PHMNL' },
    { name: 'Cebu', country: 'Philippines', code: 'PHCEB' },
    // Myanmar
    { name: 'Yangon', country: 'Myanmar', code: 'MMRGN' },
    // Cambodia
    { name: 'Phnom Penh', country: 'Cambodia', code: 'KHPNH' },
    { name: 'Sihanoukville', country: 'Cambodia', code: 'KHKOS' },
    // India
    { name: 'Nhava Sheva', country: 'India', code: 'INNSA' },
    { name: 'Mumbai', country: 'India', code: 'INBOM' },
    { name: 'Chennai', country: 'India', code: 'INMAA' },
    { name: 'Kolkata', country: 'India', code: 'INCCU' },
    { name: 'Mundra', country: 'India', code: 'INMUN' },
    { name: 'Cochin', country: 'India', code: 'INCOK' },
    // Pakistan
    { name: 'Karachi', country: 'Pakistan', code: 'PKKHI' },
    // Bangladesh
    { name: 'Chittagong', country: 'Bangladesh', code: 'BDCGP' },
    // Sri Lanka
    { name: 'Colombo', country: 'Sri Lanka', code: 'LKCMB' },
  ],
  oceania: [
    // Australia
    { name: 'Sydney', country: 'Australia', code: 'AUSYD' },
    { name: 'Melbourne', country: 'Australia', code: 'AUMEL' },
    { name: 'Brisbane', country: 'Australia', code: 'AUBNE' },
    { name: 'Adelaide', country: 'Australia', code: 'AUADL' },
    { name: 'Perth', country: 'Australia', code: 'AUPER' },
    { name: 'Fremantle', country: 'Australia', code: 'AUFRE' },
    // New Zealand
    { name: 'Auckland', country: 'New Zealand', code: 'NZAKL' },
    { name: 'Wellington', country: 'New Zealand', code: 'NZWLG' },
    { name: 'Christchurch', country: 'New Zealand', code: 'NZCHC' },
    // Pacific Islands
    { name: 'Suva', country: 'Fiji', code: 'FJSUV' },
    { name: 'Port Moresby', country: 'Papua New Guinea', code: 'PGPOM' },
  ],
  caribbean: [
    // Bahamas
    { name: 'Freeport', country: 'Bahamas', code: 'BSFPO' },
    { name: 'Nassau', country: 'Bahamas', code: 'BSNAS' },
    // Jamaica
    { name: 'Kingston', country: 'Jamaica', code: 'JMKIN' },
    // Dominican Republic
    { name: 'Santo Domingo', country: 'Dominican Republic', code: 'DOSDQ' },
    { name: 'Puerto Plata', country: 'Dominican Republic', code: 'DOPOP' },
    // Trinidad and Tobago
    { name: 'Port of Spain', country: 'Trinidad and Tobago', code: 'TTPOS' },
    // Puerto Rico
    { name: 'San Juan', country: 'Puerto Rico', code: 'PRSJU' },
    // Panama
    { name: 'Colon', country: 'Panama', code: 'PAONX' },
    { name: 'Balboa', country: 'Panama', code: 'PABLB' },
    { name: 'Panama City', country: 'Panama', code: 'PAPTY' },
    // Costa Rica
    { name: 'Puerto Limon', country: 'Costa Rica', code: 'CRLIM' },
    // Guatemala
    { name: 'Puerto Quetzal', country: 'Guatemala', code: 'GTPRQ' },
  ],
};

// Function to get freight rates
export function getFreightRates(origin: string, destination: string): RouteRates | null {
  const key = `${origin}-${destination}`;
  return freightRatesDatabase[key] || null;
}

// Function to calculate total cost
export function calculateTotalCost(
  baseRate: number,
  quantity: number = 1,
  insurancePercent: number = 0.5,
  additionalFees: number = 0
): {
  baseTotal: number;
  insurance: number;
  additional: number;
  grandTotal: number;
} {
  const baseTotal = baseRate * quantity;
  const insurance = baseTotal * (insurancePercent / 100);
  const additional = additionalFees;
  const grandTotal = baseTotal + insurance + additional;

  return {
    baseTotal,
    insurance,
    additional,
    grandTotal,
  };
}

// Helper function to get all ports in a flat array
export function getAllPorts() {
  const allPorts: Array<{ name: string; country: string; code: string; region: string }> = [];
  
  Object.entries(majorPorts).forEach(([region, ports]) => {
    ports.forEach(port => {
      allPorts.push({
        ...port,
        region: region.charAt(0).toUpperCase() + region.slice(1).replace(/([A-Z])/g, ' $1'),
      });
    });
  });
  
  return allPorts;
}

// Helper function to search ports
export function searchPorts(query: string) {
  if (!query || query.trim().length === 0) {
    return getAllPorts();
  }
  
  const searchTerm = query.toLowerCase();
  const allPorts = getAllPorts();
  
  return allPorts.filter(port => 
    port.name.toLowerCase().includes(searchTerm) ||
    port.country.toLowerCase().includes(searchTerm) ||
    port.code.toLowerCase().includes(searchTerm)
  );
}