export interface EventData {
  id: string
  title: string
  date: string
  time: string
  location: string
  priceRange: string
  image: string
  distances: string[]
  description: string
  status: 'upcoming' | 'past'
  featured?: boolean
}

export interface RaceResultData {
  id: string
  eventId: string
  eventName: string
  eventDate: string
  distance: string
  finishers: {
    rank: number
    bib: string
    name: string
    time: string
    gender: 'male' | 'female'
  }[]
}

export interface MerchItem {
  id: string
  name: string
  price: number
  image: string
  category: 'shoes' | 'apparel' | 'accessories'
  description: string
  sizes?: string[]
  badge?: string
}

export const upcomingEvents: EventData[] = [
  {
    id: 'ue1',
    title: 'DAPA Midnight Run 2026',
    date: 'July 19, 2026',
    time: '4:00 AM - 9:00 AM',
    location: 'Quezon Memorial Circle, Quezon City',
    priceRange: '₱500.00 – ₱1,800.00',
    image: '/hero-banner.png',
    distances: ['3K', '5K', '10K', '21K'],
    description: 'Run under the stars in our signature midnight race! Experience the thrill of running through the illuminated streets of Quezon City with thousands of fellow runners.',
    status: 'upcoming',
    featured: true,
  },
  {
    id: 'ue2',
    title: 'DAPA Trail Challenge 2026',
    date: 'August 23, 2026',
    time: '5:00 AM - 11:00 AM',
    location: 'Mt. Makiling, Los Baños, Laguna',
    priceRange: '₱800.00 – ₱2,200.00',
    image: '/hero-banner.png',
    distances: ['5K', '10K', '25K', '50K'],
    description: 'Conquer the trails of Mt. Makiling in this ultimate trail running challenge. Navigate through lush forests, river crossings, and breathtaking mountain views.',
    status: 'upcoming',
  },
  {
    id: 'ue3',
    title: 'DAPA Color Fun Run 2026',
    date: 'September 14, 2026',
    time: '6:00 AM - 10:00 AM',
    location: 'Rizal Park, Manila',
    priceRange: '₱350.00 – ₱900.00',
    image: '/hero-banner.png',
    distances: ['1K', '3K', '5K'],
    description: 'A fun, colorful run for all ages! Get doused in vibrant colors at every kilometer marker. Perfect for families, friends, and first-time runners.',
    status: 'upcoming',
  },
  {
    id: 'ue4',
    title: 'DAPA Ultra Marathon 2026',
    date: 'October 11, 2026',
    time: '3:00 AM - 3:00 PM',
    location: 'Subic Bay Freeport Zone',
    priceRange: '₱1,200.00 – ₱3,500.00',
    image: '/hero-banner.png',
    distances: ['42K', '50K', '100K'],
    description: 'Push your limits in our ultra marathon event through the scenic routes of Subic Bay. Well-stocked aid stations and medical support throughout the course.',
    status: 'upcoming',
  },
  {
    id: 'ue5',
    title: 'DAPA Christmas Dash 2026',
    date: 'December 13, 2026',
    time: '5:00 AM - 9:00 AM',
    location: 'Bonifacio Global City, Taguig',
    priceRange: '₱450.00 – ₱1,200.00',
    image: '/hero-banner.png',
    distances: ['3K', '5K', '10K'],
    description: 'Celebrate the holiday season with a festive Christmas run! Santa hats, holiday-themed medals, and Christmas carols along the route.',
    status: 'upcoming',
  },
]

export const previousEvents: EventData[] = [
  {
    id: 'pe1',
    title: 'DAPA Sunrise Sprint 2025',
    date: 'January 18, 2025',
    time: '5:30 AM - 9:30 AM',
    location: 'SM by the Bay, Pasay City',
    priceRange: '₱400.00 – ₱1,200.00',
    image: '/hero-banner.png',
    distances: ['3K', '5K', '10K'],
    description: 'Started the year right with an energizing sunrise run along Manila Bay. Over 3,000 runners joined this invigorating morning race.',
    status: 'past',
  },
  {
    id: 'pe2',
    title: 'DAPA Mountain Rush 2025',
    date: 'March 8, 2025',
    time: '4:00 AM - 12:00 PM',
    location: 'Mt. Pulag, Benguet',
    priceRange: '₱1,000.00 – ₱2,800.00',
    image: '/hero-banner.png',
    distances: ['10K', '21K', '42K'],
    description: 'An epic mountain running experience at the highest peak in Luzon. Runners were treated to sea of clouds and stunning mountain vistas.',
    status: 'past',
  },
  {
    id: 'pe3',
    title: 'DAPA Independence Run 2025',
    date: 'June 12, 2025',
    time: '5:00 AM - 10:00 AM',
    location: 'Luneta Park, Manila',
    priceRange: '₱500.00 – ₱1,500.00',
    image: '/hero-banner.png',
    distances: ['5K', '10K', '21K'],
    description: 'Celebrated Philippine Independence Day with a patriotic run through historic Manila. Over 5,000 runners participated in this memorable event.',
    status: 'past',
  },
  {
    id: 'pe4',
    title: 'DAPA Heritage Run 2024',
    date: 'November 16, 2024',
    time: '4:30 AM - 10:00 AM',
    location: 'Intramuros, Manila',
    priceRange: '₱450.00 – ₱1,300.00',
    image: '/hero-banner.png',
    distances: ['5K', '10K', '21K'],
    description: 'Ran through the historic walled city of Intramuros. A unique running experience combining fitness with Philippine heritage and culture.',
    status: 'past',
  },
  {
    id: 'pe5',
    title: 'DAPA Coastal Run 2024',
    date: 'September 21, 2024',
    time: '5:00 AM - 10:00 AM',
    location: 'Cavite Coastal Road, Cavite',
    priceRange: '₱400.00 – ₱1,100.00',
    image: '/hero-banner.png',
    distances: ['3K', '5K', '10K', '21K'],
    description: 'A scenic coastal run with ocean views and refreshing sea breeze. One of our most popular events with over 4,000 finishers.',
    status: 'past',
  },
]

export const raceResults: RaceResultData[] = [
  {
    id: 'rr1',
    eventId: 'pe1',
    eventName: 'DAPA Sunrise Sprint 2025',
    eventDate: 'January 18, 2025',
    distance: '10K',
    finishers: [
      { rank: 1, bib: '1023', name: 'Marco Dela Cruz', time: '00:34:12', gender: 'male' },
      { rank: 2, bib: '1045', name: 'Rafael Santos', time: '00:35:48', gender: 'male' },
      { rank: 3, bib: '1078', name: 'Angelo Reyes', time: '00:36:21', gender: 'male' },
      { rank: 4, bib: '1092', name: 'Paolo Garcia', time: '00:37:05', gender: 'male' },
      { rank: 5, bib: '1105', name: 'Jose Villanueva', time: '00:37:44', gender: 'male' },
      { rank: 1, bib: '2001', name: 'Maria Santos', time: '00:39:55', gender: 'female' },
      { rank: 2, bib: '2015', name: 'Ana Rodriguez', time: '00:41:23', gender: 'female' },
      { rank: 3, bib: '2034', name: 'Cristina Reyes', time: '00:42:07', gender: 'female' },
      { rank: 4, bib: '2056', name: 'Patricia Lim', time: '00:43:15', gender: 'female' },
      { rank: 5, bib: '2078', name: 'Jennifer Cruz', time: '00:44:02', gender: 'female' },
    ],
  },
  {
    id: 'rr2',
    eventId: 'pe1',
    eventName: 'DAPA Sunrise Sprint 2025',
    eventDate: 'January 18, 2025',
    distance: '5K',
    finishers: [
      { rank: 1, bib: '5001', name: 'Kevin Mendoza', time: '00:17:34', gender: 'male' },
      { rank: 2, bib: '5012', name: 'Daniel Tan', time: '00:18:12', gender: 'male' },
      { rank: 3, bib: '5028', name: 'Ryan Navarro', time: '00:18:55', gender: 'male' },
      { rank: 1, bib: '6001', name: 'Sarah Domingo', time: '00:20:45', gender: 'female' },
      { rank: 2, bib: '6015', name: 'Michelle Aquino', time: '00:21:33', gender: 'female' },
      { rank: 3, bib: '6032', name: 'Grace Bautista', time: '00:22:18', gender: 'female' },
    ],
  },
  {
    id: 'rr3',
    eventId: 'pe2',
    eventName: 'DAPA Mountain Rush 2025',
    eventDate: 'March 8, 2025',
    distance: '21K',
    finishers: [
      { rank: 1, bib: '3001', name: 'Eduard Rivera', time: '01:28:45', gender: 'male' },
      { rank: 2, bib: '3015', name: 'Christian Flores', time: '01:30:22', gender: 'male' },
      { rank: 3, bib: '3028', name: 'Mark Andres', time: '01:31:17', gender: 'male' },
      { rank: 1, bib: '4001', name: 'Elena Corpuz', time: '01:42:15', gender: 'female' },
      { rank: 2, bib: '4018', name: 'Rosa Magbanua', time: '01:44:33', gender: 'female' },
      { rank: 3, bib: '4035', name: 'Lina Dizon', time: '01:46:08', gender: 'female' },
    ],
  },
  {
    id: 'rr4',
    eventId: 'pe3',
    eventName: 'DAPA Independence Run 2025',
    eventDate: 'June 12, 2025',
    distance: '21K',
    finishers: [
      { rank: 1, bib: '7001', name: 'Nico Fernandez', time: '01:25:33', gender: 'male' },
      { rank: 2, bib: '7022', name: 'Luis Ramos', time: '01:26:48', gender: 'male' },
      { rank: 3, bib: '7045', name: 'Antonio Cruz', time: '01:27:55', gender: 'male' },
      { rank: 1, bib: '8001', name: 'Camille Villareal', time: '01:38:22', gender: 'female' },
      { rank: 2, bib: '8019', name: 'Diana Ong', time: '01:40:15', gender: 'female' },
      { rank: 3, bib: '8042', name: 'Isabella Torres', time: '01:41:47', gender: 'female' },
    ],
  },
  {
    id: 'rr5',
    eventId: 'pe4',
    eventName: 'DAPA Heritage Run 2024',
    eventDate: 'November 16, 2024',
    distance: '10K',
    finishers: [
      { rank: 1, bib: '9001', name: 'Arnel Bautista', time: '00:33:58', gender: 'male' },
      { rank: 2, bib: '9020', name: 'James Chua', time: '00:35:12', gender: 'male' },
      { rank: 3, bib: '9045', name: 'Roberto Lacson', time: '00:36:01', gender: 'male' },
      { rank: 1, bib: '9101', name: 'Theresa Gomez', time: '00:38:44', gender: 'female' },
      { rank: 2, bib: '9118', name: 'Karen Sy', time: '00:40:11', gender: 'female' },
      { rank: 3, bib: '9135', name: 'Maricar Ponce', time: '00:41:08', gender: 'female' },
    ],
  },
]

export const merchandise: MerchItem[] = [
  {
    id: 'm1',
    name: 'DAPA Run Pro X1',
    price: 4500,
    image: '/shoe1.png',
    category: 'shoes',
    description: 'Lightweight racing shoes with responsive cushioning and breathable mesh upper. Built for speed and long-distance comfort.',
    sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'],
    badge: 'Best Seller',
  },
  {
    id: 'm2',
    name: 'DAPA TrailBlazer GTX',
    price: 5200,
    image: '/shoe1.png',
    category: 'shoes',
    description: 'Trail running shoes with Gore-Tex waterproof membrane. Superior grip on any terrain with rock plate protection.',
    sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'],
    badge: 'New',
  },
  {
    id: 'm3',
    name: 'DAPA Sprint Elite',
    price: 3800,
    image: '/shoe1.png',
    category: 'shoes',
    description: 'Minimalist racing flats for speed workouts and race day. Carbon fiber plate for maximum energy return.',
    sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'],
  },
  {
    id: 'm4',
    name: 'DAPA Tech Tee',
    price: 650,
    image: '/merch-banner.png',
    category: 'apparel',
    description: 'Moisture-wicking performance tee with DAPA RUN branding. Lightweight and quick-dry fabric for maximum comfort.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'm5',
    name: 'DAPA Race Shorts',
    price: 850,
    image: '/merch-banner.png',
    category: 'apparel',
    description: 'Lightweight running shorts with built-in liner and secure zip pocket. Reflective details for visibility.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'm6',
    name: 'DAPA Compression Tights',
    price: 1200,
    image: '/merch-banner.png',
    category: 'apparel',
    description: 'Graduated compression tights for improved circulation and muscle support. Flatlock seams prevent chafing.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'm7',
    name: 'DAPA Race Cap',
    price: 450,
    image: '/merch-banner.png',
    category: 'accessories',
    description: 'Lightweight running cap with moisture-wicking sweatband and reflective logo. Adjustable back closure.',
  },
  {
    id: 'm8',
    name: 'DAPA Hydration Belt',
    price: 980,
    image: '/merch-banner.png',
    category: 'accessories',
    description: 'Bounce-free hydration belt with two 10oz flasks. Multiple pockets for gels, phone, and keys.',
  },
  {
    id: 'm9',
    name: 'DAPA Running Socks (3-Pack)',
    price: 520,
    image: '/merch-banner.png',
    category: 'accessories',
    description: 'Anti-blister running socks with arch compression and moisture management. Cushioned sole for impact protection.',
    sizes: ['S/M', 'L/XL'],
  },
]

export const stats = [
  { label: 'Events Organized', value: 45, suffix: '+' },
  { label: 'Runners Served', value: 50000, suffix: '+' },
  { label: 'Kilometers Covered', value: 120000, suffix: '+' },
  { label: 'Cities Visited', value: 25, suffix: '+' },
]
