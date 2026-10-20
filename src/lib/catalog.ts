// Server-authoritative demo catalog. IDs are stable; prices are in cents (SGD).
export type Product = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  summary: string;
  features: string[];
};

export const CATALOG: readonly Product[] = [
  {
    id: "quietform-headphones",
    name: "QuietForm Wireless Headphones",
    category: "Audio & everyday",
    priceCents: 8990,
    summary: "Over-ear wireless headphones for commutes, calls and focused work.",
    features: ["Wireless over-ear design", "Cushioned ear pads", "For commuting and focus"],
  },
  {
    id: "tideway-bottle",
    name: "Tideway Insulated Bottle",
    category: "Home & everyday",
    priceCents: 3250,
    summary: "Double-walled insulated bottle for keeping drinks cold through a humid day.",
    features: ["Insulated steel body", "Screw-top lid", "Desk, gym or outdoors"],
  },
  {
    id: "formfield-desk-lamp",
    name: "Form & Field Desk Lamp",
    category: "Home & desk essentials",
    priceCents: 6400,
    summary: "A compact desk lamp with an adjustable shade for reading and late work sessions.",
    features: ["Directional shade", "Small desk footprint", "Warm task lighting"],
  },
  // Illustrative prototype products — fictional brands, not real inventory or retailer offers.
  {
    id: "lumen-commute-backpack",
    name: "Lumen Commute Backpack",
    category: "Commuting & travel",
    priceCents: 7900,
    summary: "A slim canvas daypack sized for a laptop, lunch and an MRT commute.",
    features: ["Padded laptop sleeve", "Front zip pocket", "Water-resistant canvas"],
  },
  {
    id: "brightside-power-bank",
    name: "Brightside Pocket Power Bank",
    category: "Tech accessories",
    priceCents: 4590,
    summary: "A slim power bank for topping up a phone through long days out or on campus.",
    features: ["USB-C and USB-A ports", "Pocket-sized", "Short cable included"],
  },
  {
    id: "ledgerleaf-study-planner",
    name: "Ledgerleaf Study Planner",
    category: "Study & stationery",
    priceCents: 1850,
    summary: "An undated linen-bound planner with grid pages for coursework and weekly goals.",
    features: ["Undated grid pages", "Ribbon bookmark", "Linen hardcover"],
  },
  {
    id: "stillwater-desk-fan",
    name: "Stillwater Desk Fan",
    category: "Home & desk essentials",
    priceCents: 3900,
    summary: "A quiet compact desk fan for keeping cool at a home desk or dorm room.",
    features: ["Adjustable tilt", "Small footprint", "Simple dial control"],
  },
  {
    id: "kopi-pourover-set",
    name: "Kopi Pour-Over Set",
    category: "Home & kitchen",
    priceCents: 5400,
    summary: "A ceramic dripper and glass carafe for brewing coffee at home.",
    features: ["Ceramic dripper", "Glass carafe", "Brews 2–3 cups"],
  },
  {
    id: "driftline-compact-umbrella",
    name: "Driftline Compact Umbrella",
    category: "Commuting & travel",
    priceCents: 2490,
    summary: "A folding umbrella that fits in a bag for sudden afternoon showers.",
    features: ["Folds compact", "Wooden handle", "Wrist strap"],
  },
] as const;

export function getProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}

export function formatSGD(cents: number): string {
  return `S$${(cents / 100).toFixed(2)}`;
}
