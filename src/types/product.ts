export interface Product {
  id: number | string;
  name: string;
  category: 'Kurthas & Co-ords' | 'Sarees' | 'Shawls' | "Men's Shirts" | 'T-Shirts' | 'Kidswear';
  fabric: 'Silk' | 'Cotton' | 'Linen' | 'Grape' | 'Georgette' | 'Tussar' | string | null;
  technique: 'Eco printing' | 'Tie & Dye' | 'Shibori' | 'Batik' | 'Kalamkari' | string | null;
  image: string;
  tagline: string;
  price?: string;
}

