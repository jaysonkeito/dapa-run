import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@daparun.com" },
    update: {},
    create: {
      email: "admin@daparun.com",
      name: "Admin",
      password: hashedPassword,
      role: "admin",
    },
  })
  console.log("Admin user created:", admin.email)

  // Create a test user
  const userPassword = await bcrypt.hash("user123", 12)
  const testUser = await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: {
      email: "user@test.com",
      name: "Test User",
      password: userPassword,
      role: "user",
      phone: "+63 917 000 0000",
    },
  })
  console.log("Test user created:", testUser.email)

  // Create a staff user
  const staffPassword = await bcrypt.hash("staff123", 12)
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@daparun.com" },
    update: {},
    create: {
      email: "staff@daparun.com",
      name: "Staff Member",
      password: staffPassword,
      role: "staff",
    },
  })
  console.log("Staff user created:", staffUser.email)

  // Create upcoming events
  const upcomingEventsData = [
    {
      title: "DAPA Midnight Run 2026",
      date: "July 19, 2026",
      time: "4:00 AM - 9:00 AM",
      location: "Quezon Memorial Circle, Quezon City",
      priceRange: "₱500.00 – ₱1,800.00",
      image: "/hero-banner.png",
      distances: "3K,5K,10K,21K",
      description: "Run under the stars in our signature midnight race! Experience the thrill of running through the illuminated streets of Quezon City with thousands of fellow runners.",
      status: "upcoming",
      featured: true,
      regCloseDate: "July 15, 2026",
      regCloseTime: "11:59 PM",
      basePrice: 500,
      finisherShirtPrice: 350,
      singletPrice: 250,
      finisherShirtSizes: "XS,S,M,L,XL,XXL",
      singletSizes: "XS,S,M,L,XL,XXL",
    },
    {
      title: "DAPA Trail Challenge 2026",
      date: "August 23, 2026",
      time: "5:00 AM - 11:00 AM",
      location: "Mt. Makiling, Los Baños, Laguna",
      priceRange: "₱800.00 – ₱2,200.00",
      image: "/hero-banner.png",
      distances: "5K,10K,25K,50K",
      description: "Conquer the trails of Mt. Makiling in this ultimate trail running challenge. Navigate through lush forests, river crossings, and breathtaking mountain views.",
      status: "upcoming",
      featured: false,
      regCloseDate: "August 19, 2026",
      regCloseTime: "11:59 PM",
      basePrice: 800,
      finisherShirtPrice: 400,
      singletPrice: 300,
      finisherShirtSizes: "S,M,L,XL,XXL",
      singletSizes: "S,M,L,XL,XXL",
    },
    {
      title: "DAPA Color Fun Run 2026",
      date: "September 14, 2026",
      time: "6:00 AM - 10:00 AM",
      location: "Rizal Park, Manila",
      priceRange: "₱350.00 – ₱900.00",
      image: "/hero-banner.png",
      distances: "1K,3K,5K",
      description: "A fun, colorful run for all ages! Get doused in vibrant colors at every kilometer marker. Perfect for families, friends, and first-time runners.",
      status: "upcoming",
      featured: false,
      regCloseDate: "September 10, 2026",
      regCloseTime: "11:59 PM",
      basePrice: 350,
      finisherShirtPrice: 250,
      singletPrice: 200,
      finisherShirtSizes: "XS,S,M,L,XL",
      singletSizes: "XS,S,M,L,XL",
    },
    {
      title: "DAPA Ultra Marathon 2026",
      date: "October 11, 2026",
      time: "3:00 AM - 3:00 PM",
      location: "Subic Bay Freeport Zone",
      priceRange: "₱1,200.00 – ₱3,500.00",
      image: "/hero-banner.png",
      distances: "42K,50K,100K",
      description: "Push your limits in our ultra marathon event through the scenic routes of Subic Bay. Well-stocked aid stations and medical support throughout the course.",
      status: "upcoming",
      featured: false,
      regCloseDate: "October 7, 2026",
      regCloseTime: "11:59 PM",
      basePrice: 1200,
      finisherShirtPrice: 500,
      singletPrice: 350,
      finisherShirtSizes: "S,M,L,XL,XXL",
      singletSizes: "S,M,L,XL,XXL",
    },
    {
      title: "DAPA Christmas Dash 2026",
      date: "December 13, 2026",
      time: "5:00 AM - 9:00 AM",
      location: "Bonifacio Global City, Taguig",
      priceRange: "₱450.00 – ₱1,200.00",
      image: "/hero-banner.png",
      distances: "3K,5K,10K",
      description: "Celebrate the holiday season with a festive Christmas run! Santa hats, holiday-themed medals, and Christmas carols along the route.",
      status: "upcoming",
      featured: false,
      regCloseDate: "December 9, 2026",
      regCloseTime: "11:59 PM",
      basePrice: 450,
      finisherShirtPrice: 300,
      singletPrice: 200,
      finisherShirtSizes: "XS,S,M,L,XL,XXL",
      singletSizes: "XS,S,M,L,XL,XXL",
    },
  ]

  const createdUpcoming: Awaited<ReturnType<typeof prisma.event.create>>[] = []
  for (const eventData of upcomingEventsData) {
    const event = await prisma.event.create({ data: eventData })
    createdUpcoming.push(event)
    console.log("Event created:", event.title)
  }

  // Create past events
  const pastEventsData = [
    {
      title: "DAPA Sunrise Sprint 2025",
      date: "January 18, 2025",
      time: "5:30 AM - 9:30 AM",
      location: "SM by the Bay, Pasay City",
      priceRange: "₱400.00 – ₱1,200.00",
      image: "/hero-banner.png",
      distances: "3K,5K,10K",
      description: "Started the year right with an energizing sunrise run along Manila Bay. Over 3,000 runners joined this invigorating morning race.",
      status: "past",
      featured: false,
    },
    {
      title: "DAPA Mountain Rush 2025",
      date: "March 8, 2025",
      time: "4:00 AM - 12:00 PM",
      location: "Mt. Pulag, Benguet",
      priceRange: "₱1,000.00 – ₱2,800.00",
      image: "/hero-banner.png",
      distances: "10K,21K,42K",
      description: "An epic mountain running experience at the highest peak in Luzon. Runners were treated to sea of clouds and stunning mountain vistas.",
      status: "past",
      featured: false,
    },
    {
      title: "DAPA Independence Run 2025",
      date: "June 12, 2025",
      time: "5:00 AM - 10:00 AM",
      location: "Luneta Park, Manila",
      priceRange: "₱500.00 – ₱1,500.00",
      image: "/hero-banner.png",
      distances: "5K,10K,21K",
      description: "Celebrated Philippine Independence Day with a patriotic run through historic Manila. Over 5,000 runners participated in this memorable event.",
      status: "past",
      featured: false,
    },
    {
      title: "DAPA Heritage Run 2024",
      date: "November 16, 2024",
      time: "4:30 AM - 10:00 AM",
      location: "Intramuros, Manila",
      priceRange: "₱450.00 – ₱1,300.00",
      image: "/hero-banner.png",
      distances: "5K,10K,21K",
      description: "Ran through the historic walled city of Intramuros. A unique running experience combining fitness with Philippine heritage and culture.",
      status: "past",
      featured: false,
    },
    {
      title: "DAPA Coastal Run 2024",
      date: "September 21, 2024",
      time: "5:00 AM - 10:00 AM",
      location: "Cavite Coastal Road, Cavite",
      priceRange: "₱400.00 – ₱1,100.00",
      image: "/hero-banner.png",
      distances: "3K,5K,10K,21K",
      description: "A scenic coastal run with ocean views and refreshing sea breeze. One of our most popular events with over 4,000 finishers.",
      status: "past",
      featured: false,
    },
  ]

  const createdPast: Awaited<ReturnType<typeof prisma.event.create>>[] = []
  for (const eventData of pastEventsData) {
    const event = await prisma.event.create({ data: eventData })
    createdPast.push(event)
    console.log("Event created:", event.title)
  }

  // Create race results
  const raceResultsData = [
    {
      eventId: createdPast[0].id, // Sunrise Sprint
      distance: "10K",
      finishers: JSON.stringify([
        { rank: 1, bib: "1023", name: "Marco Dela Cruz", time: "00:34:12", gender: "male" },
        { rank: 2, bib: "1045", name: "Rafael Santos", time: "00:35:48", gender: "male" },
        { rank: 3, bib: "1078", name: "Angelo Reyes", time: "00:36:21", gender: "male" },
        { rank: 4, bib: "1092", name: "Paolo Garcia", time: "00:37:05", gender: "male" },
        { rank: 5, bib: "1105", name: "Jose Villanueva", time: "00:37:44", gender: "male" },
        { rank: 1, bib: "2001", name: "Maria Santos", time: "00:39:55", gender: "female" },
        { rank: 2, bib: "2015", name: "Ana Rodriguez", time: "00:41:23", gender: "female" },
        { rank: 3, bib: "2034", name: "Cristina Reyes", time: "00:42:07", gender: "female" },
        { rank: 4, bib: "2056", name: "Patricia Lim", time: "00:43:15", gender: "female" },
        { rank: 5, bib: "2078", name: "Jennifer Cruz", time: "00:44:02", gender: "female" },
      ]),
    },
    {
      eventId: createdPast[0].id, // Sunrise Sprint
      distance: "5K",
      finishers: JSON.stringify([
        { rank: 1, bib: "5001", name: "Kevin Mendoza", time: "00:17:34", gender: "male" },
        { rank: 2, bib: "5012", name: "Daniel Tan", time: "00:18:12", gender: "male" },
        { rank: 3, bib: "5028", name: "Ryan Navarro", time: "00:18:55", gender: "male" },
        { rank: 1, bib: "6001", name: "Sarah Domingo", time: "00:20:45", gender: "female" },
        { rank: 2, bib: "6015", name: "Michelle Aquino", time: "00:21:33", gender: "female" },
        { rank: 3, bib: "6032", name: "Grace Bautista", time: "00:22:18", gender: "female" },
      ]),
    },
    {
      eventId: createdPast[1].id, // Mountain Rush
      distance: "21K",
      finishers: JSON.stringify([
        { rank: 1, bib: "3001", name: "Eduard Rivera", time: "01:28:45", gender: "male" },
        { rank: 2, bib: "3015", name: "Christian Flores", time: "01:30:22", gender: "male" },
        { rank: 3, bib: "3028", name: "Mark Andres", time: "01:31:17", gender: "male" },
        { rank: 1, bib: "4001", name: "Elena Corpuz", time: "01:42:15", gender: "female" },
        { rank: 2, bib: "4018", name: "Rosa Magbanua", time: "01:44:33", gender: "female" },
        { rank: 3, bib: "4035", name: "Lina Dizon", time: "01:46:08", gender: "female" },
      ]),
    },
    {
      eventId: createdPast[2].id, // Independence Run
      distance: "21K",
      finishers: JSON.stringify([
        { rank: 1, bib: "7001", name: "Nico Fernandez", time: "01:25:33", gender: "male" },
        { rank: 2, bib: "7022", name: "Luis Ramos", time: "01:26:48", gender: "male" },
        { rank: 3, bib: "7045", name: "Antonio Cruz", time: "01:27:55", gender: "male" },
        { rank: 1, bib: "8001", name: "Camille Villareal", time: "01:38:22", gender: "female" },
        { rank: 2, bib: "8019", name: "Diana Ong", time: "01:40:15", gender: "female" },
        { rank: 3, bib: "8042", name: "Isabella Torres", time: "01:41:47", gender: "female" },
      ]),
    },
    {
      eventId: createdPast[3].id, // Heritage Run
      distance: "10K",
      finishers: JSON.stringify([
        { rank: 1, bib: "9001", name: "Arnel Bautista", time: "00:33:58", gender: "male" },
        { rank: 2, bib: "9020", name: "James Chua", time: "00:35:12", gender: "male" },
        { rank: 3, bib: "9045", name: "Roberto Lacson", time: "00:36:01", gender: "male" },
        { rank: 1, bib: "9101", name: "Theresa Gomez", time: "00:38:44", gender: "female" },
        { rank: 2, bib: "9118", name: "Karen Sy", time: "00:40:11", gender: "female" },
        { rank: 3, bib: "9135", name: "Maricar Ponce", time: "00:41:08", gender: "female" },
      ]),
    },
  ]

  for (const resultData of raceResultsData) {
    const result = await prisma.raceResult.create({ data: resultData })
    console.log("Race result created for:", resultData.distance)
  }

  // Create merchandise
  const merchandiseData = [
    {
      name: "DAPA Run Pro X1",
      price: 4500,
      image: "/shoe1.png",
      category: "shoes",
      description: "Lightweight racing shoes with responsive cushioning and breathable mesh upper. Built for speed and long-distance comfort.",
      sizes: "US 7,US 8,US 9,US 10,US 11",
      badge: "Best Seller",
    },
    {
      name: "DAPA TrailBlazer GTX",
      price: 5200,
      image: "/shoe1.png",
      category: "shoes",
      description: "Trail running shoes with Gore-Tex waterproof membrane. Superior grip on any terrain with rock plate protection.",
      sizes: "US 7,US 8,US 9,US 10,US 11",
      badge: "New",
    },
    {
      name: "DAPA Sprint Elite",
      price: 3800,
      image: "/shoe1.png",
      category: "shoes",
      description: "Minimalist racing flats for speed workouts and race day. Carbon fiber plate for maximum energy return.",
      sizes: "US 7,US 8,US 9,US 10,US 11",
      badge: null,
    },
    {
      name: "DAPA Tech Tee",
      price: 650,
      image: "/merch-banner.png",
      category: "apparel",
      description: "Moisture-wicking performance tee with DAPA RUN branding. Lightweight and quick-dry fabric for maximum comfort.",
      sizes: "XS,S,M,L,XL,XXL",
      badge: null,
    },
    {
      name: "DAPA Race Shorts",
      price: 850,
      image: "/merch-banner.png",
      category: "apparel",
      description: "Lightweight running shorts with built-in liner and secure zip pocket. Reflective details for visibility.",
      sizes: "XS,S,M,L,XL",
      badge: null,
    },
    {
      name: "DAPA Compression Tights",
      price: 1200,
      image: "/merch-banner.png",
      category: "apparel",
      description: "Graduated compression tights for improved circulation and muscle support. Flatlock seams prevent chafing.",
      sizes: "XS,S,M,L,XL,XXL",
      badge: null,
    },
    {
      name: "DAPA Race Cap",
      price: 450,
      image: "/merch-banner.png",
      category: "accessories",
      description: "Lightweight running cap with moisture-wicking sweatband and reflective logo. Adjustable back closure.",
      sizes: null,
      badge: null,
    },
    {
      name: "DAPA Hydration Belt",
      price: 980,
      image: "/merch-banner.png",
      category: "accessories",
      description: "Bounce-free hydration belt with two 10oz flasks. Multiple pockets for gels, phone, and keys.",
      sizes: null,
      badge: null,
    },
    {
      name: "DAPA Running Socks (3-Pack)",
      price: 520,
      image: "/merch-banner.png",
      category: "accessories",
      description: "Anti-blister running socks with arch compression and moisture management. Cushioned sole for impact protection.",
      sizes: "S/M,L/XL",
      badge: null,
    },
  ]

  for (const merchData of merchandiseData) {
    const merch = await prisma.merchItem.create({ data: merchData })
    console.log("Merchandise created:", merch.name)
  }

  // Create a test registration
  await prisma.registration.create({
    data: {
      userId: testUser.id,
      eventId: createdUpcoming[0].id,
      distance: "10K",
    },
  })
  console.log("Test registration created")

  // Create System Settings
  const defaultSettings = [
    { key: "site_title", value: "DAPA RUN" },
    { key: "site_tagline", value: "Run With Purpose" },
    { key: "site_phone", value: "0975 180 8990" },
    { key: "site_email", value: "hello@daparun.com" },
    { key: "site_address", value: "Banilad near Hermenegilda Elementary School, Banilad, Dumaguete City, 6200 Negros Oriental" },
    { key: "site_facebook", value: "https://web.facebook.com/blackandblues.eshop" },
    { key: "site_maps_embed", value: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3937.6232526055946!2d123.28512887478401!3d9.277915190793685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33ab69e8768b6da1%3A0xe1685f0a9af77fe2!2sDapa%20Dumaguete!5e0!3m2!1sen!2sph!4v1779392361642!5m2!1sen!2sph" },
    { key: "hero_image", value: "/hero-banner.png" },
    { key: "logo_image", value: "/dapa-run-logo.png" },
    { key: "site_description", value: "Philippines' premier running event organizer. From fun runs to ultra marathons, we create unforgettable race experiences that challenge and inspire runners of all levels." },
  ]

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    })
    console.log("Setting created:", setting.key)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
