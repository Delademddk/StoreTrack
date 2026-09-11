export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  supplier: string;
  /**
   * When true, the product is supplied in boxes and inventory is tracked as
   * (boxes × itemsPerBox) + extraPieces. When false, only extraPieces is used
   * as the individual on-hand quantity and box-specific fields are ignored.
   *
   * Structured this way so a future "open box" workflow can decrement `boxes`
   * and add `itemsPerBox` to `extraPieces` without changing the schema.
   */
  isBoxed: boolean;
  boxes: number;
  itemsPerBox: number;
  extraPieces: number;
  pricePerBox: number;
  individualPrice: number;
  lowStockThreshold: number;
  description: string;
  barcode?: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export const totalQty = (
  p: Pick<Product, "boxes" | "itemsPerBox" | "extraPieces"> & { isBoxed?: boolean },
) => (p.isBoxed === false ? p.extraPieces : p.boxes * p.itemsPerBox + p.extraPieces);

export const statusFor = (p: Product): ProductStatus => {
  const q = totalQty(p);
  if (q === 0) return "out_of_stock";
  if (q <= p.lowStockThreshold) return "low_stock";
  return "in_stock";
};

const IMG = (seed: string, w = 200, h = 200) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const products: Product[] = [
  {
    id: "p_01",
    sku: "SKU-SPH-2024-BK",
    name: "Studio Pro Headphones",
    category: "Electronics",
    brand: "Sonora",
    supplier: "Northwind Traders",
    isBoxed: true,
    boxes: 42,
    itemsPerBox: 12,
    extraPieces: 3,
    pricePerBox: 1240.0,
    individualPrice: 129.99,
    lowStockThreshold: 20,
    description: "Studio-grade wireless headphones with active noise cancellation.",
    barcode: "8901234567890",
    image: IMG("1505740420928-5e560c06d30e"),
    createdAt: "2025-04-14T09:12:00Z",
    updatedAt: "2026-07-08T14:22:00Z",
  },
  {
    id: "p_02",
    sku: "SKU-KB-AIR75",
    name: "NuPhy Air75 V2 Mechanical",
    category: "Peripherals",
    brand: "NuPhy",
    supplier: "Keyboardery",
    isBoxed: true,
    boxes: 2,
    itemsPerBox: 5,
    extraPieces: 0,
    pricePerBox: 720.0,
    individualPrice: 175.0,
    lowStockThreshold: 15,
    description: "Low-profile 75% wireless mechanical keyboard.",
    image: IMG("1587829741301-dc798b83add3"),
    createdAt: "2025-11-03T09:12:00Z",
    updatedAt: "2026-07-09T11:02:00Z",
  },
  {
    id: "p_03",
    sku: "SKU-LOGI-992",
    name: "MX-Wireless Mouse G2",
    category: "Peripherals",
    brand: "Logitech",
    supplier: "Keyboardery",
    isBoxed: false,
    boxes: 0,
    itemsPerBox: 0,
    extraPieces: 24,
    pricePerBox: 0,
    individualPrice: 64.5,
    lowStockThreshold: 10,
    description: "Silent-click wireless productivity mouse.",
    image: IMG("1527864550417-7fd91fc51a46"),
    createdAt: "2025-02-19T09:12:00Z",
    updatedAt: "2026-07-10T09:12:00Z",
  },
  {
    id: "p_04",
    sku: "SKU-UB-14-2023",
    name: 'UltraBook Pro 14" M3',
    category: "Computers",
    brand: "Halcyon",
    supplier: "Halcyon Direct",
    isBoxed: false,
    boxes: 0,
    itemsPerBox: 0,
    extraPieces: 8,
    pricePerBox: 0,
    individualPrice: 2149.0,
    lowStockThreshold: 6,
    description: "14-inch M3 ultraportable with 18h battery.",
    image: IMG("1517336714731-489689fd1ca8"),
    createdAt: "2025-08-01T09:12:00Z",
    updatedAt: "2026-07-11T09:12:00Z",
  },
  {
    id: "p_05",
    sku: "SKU-SW-ANC-GRY",
    name: "SonicWave Elite ANC",
    category: "Audio",
    brand: "SonicWave",
    supplier: "Northwind Traders",
    isBoxed: true,
    boxes: 1,
    itemsPerBox: 10,
    extraPieces: 2,
    pricePerBox: 940.0,
    individualPrice: 99.0,
    lowStockThreshold: 15,
    description: "Compact over-ear noise cancelling headphones.",
    image: IMG("1590658268037-6bf12165a8df"),
    createdAt: "2025-09-11T09:12:00Z",
    updatedAt: "2026-07-10T09:12:00Z",
  },
  {
    id: "p_06",
    sku: "SKU-CER-ARTS",
    name: "Artisan Ceramic Mug Set",
    category: "Home & Living",
    brand: "Kiln & Co",
    supplier: "Kiln & Co",
    isBoxed: true,
    boxes: 18,
    itemsPerBox: 6,
    extraPieces: 2,
    pricePerBox: 84.0,
    individualPrice: 18.0,
    lowStockThreshold: 25,
    description: "Hand-thrown ceramic mug set, 6 pieces.",
    image: IMG("1514228742587-6b1558fcca3d"),
    createdAt: "2025-06-05T09:12:00Z",
    updatedAt: "2026-07-05T09:12:00Z",
  },
  {
    id: "p_07",
    sku: "SKU-KTL-MBK",
    name: "Matte Black Electric Kettle",
    category: "Home & Living",
    brand: "Muji Home",
    supplier: "Muji Wholesale",
    isBoxed: false,
    boxes: 0,
    itemsPerBox: 0,
    extraPieces: 8,
    pricePerBox: 0,
    individualPrice: 58.0,
    lowStockThreshold: 10,
    description: "1.7L variable-temp kettle with matte finish.",
    image: IMG("1585386959984-a4155224a1ad"),
    createdAt: "2025-03-14T09:12:00Z",
    updatedAt: "2026-07-09T09:12:00Z",
  },
  {
    id: "p_08",
    sku: "SKU-DSK-LMP",
    name: "Minimalist Desk Lamp",
    category: "Home & Living",
    brand: "Nord",
    supplier: "Nord Distributors",
    isBoxed: true,
    boxes: 6,
    itemsPerBox: 8,
    extraPieces: 3,
    pricePerBox: 480.0,
    individualPrice: 72.0,
    lowStockThreshold: 20,
    description: "Warm-white desk lamp with USB-C pass-through.",
    image: IMG("1507473885765-e6ed057f782c"),
    createdAt: "2025-01-22T09:12:00Z",
    updatedAt: "2026-07-10T09:12:00Z",
  },
];

export const categories = ["Electronics", "Peripherals", "Computers", "Audio", "Home & Living"];

export const suppliers = [
  "Northwind Traders",
  "Keyboardery",
  "Halcyon Direct",
  "Kiln & Co",
  "Muji Wholesale",
  "Nord Distributors",
];

export interface Sale {
  id: string;
  invoice: string;
  customer: string;
  items: { productId: string; name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  method: "Cash" | "Card" | "Mobile Money";
  cashier: string;
  at: string;
}

export const sales: Sale[] = [
  {
    id: "s_01",
    invoice: "INV-9204",
    customer: "Walk-in Customer",
    items: [{ productId: "p_01", name: "Studio Pro Headphones", qty: 3, unitPrice: 129.99 }],
    subtotal: 389.97,
    discount: 10,
    tax: 32,
    total: 411.97,
    method: "Card",
    cashier: "Alex R.",
    at: "2026-07-11T14:22:00Z",
  },
  {
    id: "s_02",
    invoice: "INV-9205",
    customer: "Priya Menon",
    items: [{ productId: "p_08", name: "Minimalist Desk Lamp", qty: 2, unitPrice: 72.0 }],
    subtotal: 144.0,
    discount: 0,
    tax: 12.6,
    total: 156.6,
    method: "Mobile Money",
    cashier: "Sam K.",
    at: "2026-07-11T13:14:00Z",
  },
  {
    id: "s_03",
    invoice: "INV-9206",
    customer: "Ken Miles",
    items: [{ productId: "p_06", name: "Artisan Ceramic Mug Set", qty: 4, unitPrice: 18.0 }],
    subtotal: 72.0,
    discount: 0,
    tax: 6.3,
    total: 78.3,
    method: "Cash",
    cashier: "Alex R.",
    at: "2026-07-11T11:04:00Z",
  },
  {
    id: "s_04",
    invoice: "INV-9198",
    customer: "Bloom Interiors Ltd",
    items: [
      { productId: "p_07", name: "Matte Black Electric Kettle", qty: 6, unitPrice: 58.0 },
      { productId: "p_08", name: "Minimalist Desk Lamp", qty: 4, unitPrice: 72.0 },
    ],
    subtotal: 636.0,
    discount: 25,
    tax: 53.4,
    total: 664.4,
    method: "Card",
    cashier: "Alex R.",
    at: "2026-07-10T18:41:00Z",
  },
];

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Disabled";
  lastActive: string;
}

export const users: AppUser[] = [
  {
    id: "u_01",
    name: "Admin User",
    username: "admin",
    email: "admin@storetrack.com",
    phone: "+1 555 0101",
    role: "Admin",
    status: "Active",
    lastActive: "2 hours ago",
  },
  {
    id: "u_02",
    name: "Cashier User",
    username: "cashier",
    email: "cashier@storetrack.com",
    phone: "+1 555 0102",
    role: "Cashier",
    status: "Active",
    lastActive: "3 hours ago",
  },
];

export const permissions = [
  "View Dashboard",
  "View Products",
  "Add Products",
  "Edit Products",
  "Delete Products",
  "Manage Categories",
  "View Sales",
  "Create Sales",
  "View Reports",
  "Export Reports",
  "Manage Users",
  "Manage Settings",
  "Backup Database",
  "Restore Database",
];

export interface ActivityEntry {
  id: string;
  kind: "sale" | "restock" | "low_stock" | "user" | "edit" | "settings";
  title: string;
  description: string;
  actor: string;
  at: string;
}

export const activity: ActivityEntry[] = [
  {
    id: "a_01",
    kind: "sale",
    title: "Sale completed · INV-9204",
    description: "3× Studio Pro Headphones — $411.97",
    actor: "Alex R.",
    at: "2 min ago",
  },
  {
    id: "a_02",
    kind: "low_stock",
    title: "Low stock warning",
    description: "Matte Black Kettle — 4 units remaining",
    actor: "System",
    at: "14 min ago",
  },
  {
    id: "a_03",
    kind: "restock",
    title: "Stock adjusted",
    description: "+50 units of Artisan Ceramic Mug Set",
    actor: "Sam K.",
    at: "1 h ago",
  },
  {
    id: "a_04",
    kind: "edit",
    title: "Price updated",
    description: "MX-Wireless Mouse G2 — $59 → $64.50",
    actor: "Alex R.",
    at: "3 h ago",
  },
  {
    id: "a_05",
    kind: "user",
    title: "New user added",
    description: "amara@storetrack.io granted Manager role",
    actor: "Alex R.",
    at: "yesterday",
  },
  {
    id: "a_06",
    kind: "settings",
    title: "Backup created",
    description: "Full database backup — 42 MB",
    actor: "System",
    at: "yesterday",
  },
];

// 30-day revenue series for the dashboard chart
export const revenueSeries: { day: string; revenue: number; orders: number }[] = Array.from(
  { length: 30 },
  (_, i) => {
    const base = 3200 + Math.sin(i / 3) * 900 + i * 40;
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 400;
    return {
      day: `Day ${i + 1}`,
      revenue: Math.round(base + noise),
      orders: Math.round(20 + Math.sin(i / 2) * 6 + i * 0.3),
    };
  },
);

export const bestSellers = [
  { name: "Studio Pro Headphones", units: 142, revenue: 18452 },
  { name: "Minimalist Desk Lamp", units: 118, revenue: 8496 },
  { name: "Artisan Ceramic Mug Set", units: 96, revenue: 1728 },
  { name: "NuPhy Air75 V2", units: 62, revenue: 10850 },
  { name: "SonicWave Elite ANC", units: 58, revenue: 5742 },
];

export const categoryBreakdown = [
  { name: "Electronics", value: 42 },
  { name: "Peripherals", value: 24 },
  { name: "Home & Living", value: 18 },
  { name: "Audio", value: 10 },
  { name: "Computers", value: 6 },
];

export interface AuditEntry {
  id: string;
  at: string;
  user: string;
  action: string;
  target: string;
  description: string;
}

export const auditLog: AuditEntry[] = [
  {
    id: "l_01",
    at: "2026-07-11 14:22",
    user: "Alex R.",
    action: "Sale Completed",
    target: "INV-9204",
    description: "3× Studio Pro Headphones — $411.97",
  },
  {
    id: "l_02",
    at: "2026-07-11 13:45",
    user: "Alex R.",
    action: "Stock Adjusted",
    target: "SKU-CER-ARTS",
    description: "+50 units, reason: restock delivery",
  },
  {
    id: "l_03",
    at: "2026-07-11 11:30",
    user: "System",
    action: "Low Stock Alert",
    target: "SKU-KTL-MBK",
    description: "4/10 threshold breached",
  },
  {
    id: "l_04",
    at: "2026-07-10 18:41",
    user: "Alex R.",
    action: "Sale Completed",
    target: "INV-9198",
    description: "$664.40, Bloom Interiors Ltd",
  },
  {
    id: "l_05",
    at: "2026-07-10 09:02",
    user: "Alex R.",
    action: "User Created",
    target: "amara@storetrack.io",
    description: "Role: Manager",
  },
  {
    id: "l_06",
    at: "2026-07-09 21:00",
    user: "System",
    action: "Backup Created",
    target: "backup-2026-07-09.zip",
    description: "Full DB backup — 42 MB",
  },
  {
    id: "l_07",
    at: "2026-07-09 14:10",
    user: "Sam K.",
    action: "Product Edited",
    target: "SKU-LOGI-992",
    description: "Price changed $59 → $64.50",
  },
];

export const kpi = {
  totalProducts: products.length,
  itemsInStock: products.reduce((s, p) => s + totalQty(p), 0),
  todaySales: 4290.45,
  todayOrders: 32,
  weeklyRevenue: 28492.9,
  inventoryValue: products.reduce((s, p) => s + totalQty(p) * p.individualPrice, 0),
  lowStock: products.filter((p) => statusFor(p) === "low_stock").length,
  outOfStock: products.filter((p) => statusFor(p) === "out_of_stock").length,
};
