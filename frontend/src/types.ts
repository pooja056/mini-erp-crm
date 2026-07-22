export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface FollowUpNote {
  id: string;
  customerId: string;
  note: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    role: Role;
  };
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  type: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    challans: number;
    followUps: number;
  };
  followUps?: FollowUpNote[];
}

export interface StockLog {
  id: string;
  productId: string;
  qtyChanged: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    role: Role;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
    location: string;
  };
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  isLowStock?: boolean;
  stockLogs?: StockLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ChallanItem {
  id?: string;
  productId: string;
  productName?: string;
  productSku?: string;
  unitPrice?: number;
  quantity: number;
  subtotal?: number;
}

export interface CustomerSnap {
  id: string;
  name: string;
  businessName: string;
  email: string;
  mobile: string;
  gstNumber?: string | null;
  address: string;
  type: CustomerType;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerSnap: CustomerSnap;
  totalQty: number;
  totalAmount: number;
  status: ChallanStatus;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    role: Role;
  };
  items: ChallanItem[];
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  kpis: {
    totalCustomers: number;
    totalRevenue: number;
    totalProducts: number;
    lowStockCount: number;
  };
  revenueData: { name: string; revenue: number }[];
  lowStockProducts: Product[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    date: string;
    user: string;
  }[];
}
