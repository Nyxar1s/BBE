export const PROCESS_STEPS = [
  { title: "Browse", text: "Explore our services and previous events." },
  { title: "Inquire", text: "Tell us about your event and what you need." },
  { title: "Meet", text: "Schedule a meeting to discuss your plans." },
  { title: "Book", text: "Finalize the details and book our service." },
];

/** Short highlights shown in the strip under the hero (taken from the service packages). */
const WEDDING_DAY = [
  "Head coordinator with 5–7 assistants",
  "Full support for bride, groom & entourage, from prep to reception",
  "Efficient supplier communication and on-time arrival",
  "Checking of the church and reception area",
  "Preparation of wedding details and essentials before the shoot",
];

export const SERVICES = [
  {
    name: "Full Service" as const,
    icon: "ring",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    summary: "Complete planning and coordination from your first meeting to the last dance.",
    subtitle: "Full Planning & Coordination",
    price: "60,000",
    lead: "A dedicated Lead Planner is assigned to your event, under the overall supervision of head coordinator",
    leadStrong: "Aike Amora",
    planning: [
      "Timeline built around your event date",
      "Financial handling and budget tracking",
      "Curated suppliers to fit your budget and taste",
      "Supervision of all supplier contracts",
      "Rehearsal scheduling for the ceremony's processional march",
      "One-on-one planning consultations and supplier follow-ups",
      "Complete checklist for the whole planning process",
    ],
    weddingDay: WEDDING_DAY,
  },
  {
    name: "Half Service" as const,
    icon: "sparkles",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80",
    summary: "Help finishing your plans, plus full coordination on the day itself.",
    subtitle: "Half Planning / On-the-Day Coordination",
    price: "40,000",
    lead: "For couples who have already booked at least 50% of their suppliers and need an extra hand finishing the rest.",
    leadStrong: "",
    planning: [
      "Guidance on which remaining suppliers to book",
      "Help making sure all needed purchases are made",
      "Supplier contracts submitted 1 week before the event",
    ],
    weddingDay: WEDDING_DAY,
  },
];

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

/** Shown until the admin publishes their own photos. */
export const SAMPLE_PHOTOS = [
  { image_url: u("photo-1519741497674-611481863552"), caption: "Wedding Celebration", description: null },
  { image_url: u("photo-1464366400600-7168b8af9bc3"), caption: "Garden Wedding", description: null },
  { image_url: u("photo-1511285560929-80b456fea0bc"), caption: "Reception Event", description: null },
  { image_url: u("photo-1507504031003-b417219a0fde"), caption: "Wedding Ceremony", description: null },
  { image_url: u("photo-1544078751-58fee2d8a03b"), caption: "Celebration Details", description: null },
  { image_url: u("photo-1509927083803-4bd519298ac4"), caption: "Elegant Reception", description: null },
  { image_url: u("photo-1511795409834-ef04bbd61622"), caption: "Reception Celebration", description: null },
  { image_url: u("photo-1532712938310-34cb3982ef74"), caption: "Outdoor Ceremony", description: null },
  { image_url: u("photo-1519167758481-83f550bb49b3"), caption: "Reception Details", description: null },
  { image_url: u("photo-1519225421980-715cb0215aed"), caption: "Wedding Celebration", description: null },
];

export const HERO_IMAGE = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=80";
