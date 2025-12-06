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

