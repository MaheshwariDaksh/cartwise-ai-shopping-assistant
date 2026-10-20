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
] as const;

export function getProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}

export function formatSGD(cents: number): string {
  return `S$${(cents / 100).toFixed(2)}`;
}
