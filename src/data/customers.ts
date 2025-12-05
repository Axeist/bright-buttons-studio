export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  ordersCount: number;
  totalSpent: string;
  lastPurchase: string;
  type: 'new' | 'returning';
}

export const customers: Customer[] = [
  {
    id: 1,
    name: "Priya Sharma",
    phone: "+91 98765 43210",
    email: "priya.sharma@email.com",
    ordersCount: 8,
    totalSpent: "₹62,400",
    lastPurchase: "2025-01-05",
    type: "returning"
  },
  {
    id: 2,
    name: "Anjali Krishnan",
    phone: "+91 87654 32109",
    email: "anjali.k@email.com",
    ordersCount: 5,
    totalSpent: "₹38,500",
    lastPurchase: "2025-01-04",
    type: "returning"
  },
  {
    id: 3,
    name: "Ravi Kumar",
    phone: "+91 76543 21098",
    ordersCount: 2,
    totalSpent: "₹10,300",
    lastPurchase: "2025-01-04",
    type: "returning"
  },
  {
    id: 4,
    name: "Meera Patel",
    phone: "+91 65432 10987",
    email: "meera.patel@email.com",
    ordersCount: 12,
    totalSpent: "₹89,200",
    lastPurchase: "2025-01-03",
    type: "returning"
  },
  {
    id: 5,
    name: "Sneha Reddy",
    phone: "+91 54321 09876",
    ordersCount: 1,
    totalSpent: "₹9,600",
    lastPurchase: "2025-01-03",
    type: "new"
  },
  {
    id: 6,
    name: "Arun Menon",
    phone: "+91 43210 98765",
    email: "arun.menon@email.com",
    ordersCount: 3,
    totalSpent: "₹15,800",
    lastPurchase: "2025-01-02",
    type: "returning"
  },
  {
    id: 7,
    name: "Lakshmi Iyer",
    phone: "+91 32109 87654",
    email: "lakshmi.iyer@email.com",
    ordersCount: 6,
    totalSpent: "₹52,100",
    lastPurchase: "2025-01-01",
    type: "returning"
  },
  {
    id: 8,
    name: "Deepa Nair",
    phone: "+91 21098 76543",
    ordersCount: 1,
    totalSpent: "₹4,200",
    lastPurchase: "2024-12-28",
    type: "new"
  }
];
