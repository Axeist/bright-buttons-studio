export interface Product {
  id: number;
  name: string;
  category: 'Kurthas & Co-ords' | 'Sarees' | 'Shawls' | "Men's Shirts" | 'T-Shirts' | 'Kidswear';
  fabric: 'Silk' | 'Cotton' | 'Linen' | 'Grape' | 'Georgette' | 'Tussar';
  technique: 'Eco printing' | 'Tie & Dye' | 'Shibori' | 'Batik' | 'Kalamkari';
  image: string;
  tagline: string;
  price?: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Monsoon Leaf Silk Saree",
    category: "Sarees",
    fabric: "Silk",
    technique: "Eco printing",
    image: "/placeholder.svg",
    tagline: "Leaf-printed silk saree inspired by monsoon greens",
    price: "₹8,500"
  },
  {
    id: 2,
    name: "Forest Fern Kurtha Set",
    category: "Kurthas & Co-ords",
    fabric: "Cotton",
    technique: "Eco printing",
    image: "/placeholder.svg",
    tagline: "Botanical cotton co-ord with natural fern impressions",
    price: "₹4,200"
  },
  {
    id: 3,
    name: "Ocean Wave Shibori Shawl",
    category: "Shawls",
    fabric: "Linen",
    technique: "Shibori",
    image: "/placeholder.svg",
    tagline: "Hand-tied indigo shawl with flowing wave patterns",
    price: "₹2,800"
  },
  {
    id: 4,
    name: "Rustic Earth Men's Shirt",
    category: "Men's Shirts",
    fabric: "Cotton",
    technique: "Batik",
    image: "/placeholder.svg",
    tagline: "Hand-batik shirt in warm earth tones",
    price: "₹3,500"
  },
  {
    id: 5,
    name: "Wildflower Tee",
    category: "T-Shirts",
    fabric: "Cotton",
    technique: "Eco printing",
    image: "/placeholder.svg",
    tagline: "Casual tee with delicate wildflower prints",
    price: "₹1,800"
  },
  {
    id: 6,
    name: "Little Leaf Kids Dress",
    category: "Kidswear",
    fabric: "Cotton",
    technique: "Eco printing",
    image: "/placeholder.svg",
    tagline: "Playful eco-printed dress for little ones",
    price: "₹1,500"
  },
  {
    id: 7,
    name: "Sunset Kalamkari Saree",
    category: "Sarees",
    fabric: "Tussar",
    technique: "Kalamkari",
    image: "/placeholder.svg",
    tagline: "Hand-painted Kalamkari on luxurious Tussar silk",
    price: "₹12,000"
  },
  {
    id: 8,
    name: "Jade Garden Kurtha",
    category: "Kurthas & Co-ords",
    fabric: "Georgette",
    technique: "Tie & Dye",
    image: "/placeholder.svg",
    tagline: "Ethereal tie-dye kurtha in jade and emerald",
    price: "₹5,500"
  },
  {
    id: 9,
    name: "Autumn Maple Shawl",
    category: "Shawls",
    fabric: "Silk",
    technique: "Eco printing",
    image: "/placeholder.svg",
    tagline: "Rich maple leaf prints on pure silk",
    price: "₹4,800"
  },
  {
    id: 10,
    name: "Indigo Night Shirt",
    category: "Men's Shirts",
    fabric: "Linen",
    technique: "Shibori",
    image: "/placeholder.svg",
    tagline: "Deep indigo shibori on breathable linen",
    price: "₹4,200"
  },
  {
    id: 11,
    name: "Garden Party Tee",
    category: "T-Shirts",
    fabric: "Cotton",
    technique: "Batik",
    image: "/placeholder.svg",
    tagline: "Vibrant batik patterns for everyday style",
    price: "₹2,200"
  },
  {
    id: 12,
    name: "Rainbow Swirl Kids Set",
    category: "Kidswear",
    fabric: "Cotton",
    technique: "Tie & Dye",
    image: "/placeholder.svg",
    tagline: "Cheerful tie-dye set for active kids",
    price: "₹1,800"
  }
];

export const categories = [
  'All',
  'Kurthas & Co-ords',
  'Sarees',
  'Shawls',
  "Men's Shirts",
  'T-Shirts',
  'Kidswear'
] as const;

export const techniques = [
  'Eco printing',
  'Tie & Dye',
  'Shibori',
  'Batik',
  'Kalamkari'
] as const;
