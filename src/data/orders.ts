export interface Order {
  id: string;
  customer: string;
  phone: string;
  date: string;
  items: number;
  total: string;
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'partial';
}

export const orders: Order[] = [
  {
    id: "BB-2025-001",
    customer: "Priya Sharma",
    phone: "+91 98765 43210",
    date: "2025-01-05 10:30 AM",
    items: 2,
    total: "₹12,300",
    status: "delivered",
    paymentStatus: "paid"
  },
  {
    id: "BB-2025-002",
    customer: "Anjali Krishnan",
    phone: "+91 87654 32109",
    date: "2025-01-04 3:45 PM",
    items: 1,
    total: "₹8,500",
    status: "ready",
    paymentStatus: "paid"
  },
  {
    id: "BB-2025-003",
    customer: "Ravi Kumar",
    phone: "+91 76543 21098",
    date: "2025-01-04 11:20 AM",
    items: 3,
    total: "₹6,800",
    status: "processing",
    paymentStatus: "pending"
  },
  {
    id: "BB-2025-004",
    customer: "Meera Patel",
    phone: "+91 65432 10987",
    date: "2025-01-03 5:00 PM",
    items: 1,
    total: "₹4,200",
    status: "confirmed",
    paymentStatus: "paid"
  },
  {
    id: "BB-2025-005",
    customer: "Sneha Reddy",
    phone: "+91 54321 09876",
    date: "2025-01-03 9:15 AM",
    items: 2,
    total: "₹9,600",
    status: "pending",
    paymentStatus: "pending"
  },
  {
    id: "BB-2025-006",
    customer: "Arun Menon",
    phone: "+91 43210 98765",
    date: "2025-01-02 2:30 PM",
    items: 1,
    total: "₹3,500",
    status: "delivered",
    paymentStatus: "paid"
  },
  {
    id: "BB-2025-007",
    customer: "Lakshmi Iyer",
    phone: "+91 32109 87654",
    date: "2025-01-01 4:00 PM",
    items: 4,
    total: "₹18,200",
    status: "delivered",
    paymentStatus: "paid"
  }
];

export const orderStatuses = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'ready',
  'delivered',
  'cancelled'
] as const;
