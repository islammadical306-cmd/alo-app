export type UserRole = 'admin' | 'manager' | 'cashier' | 'pharmacy_staff' | 'e_center_operator';

export interface Branch {
  id?: string;
  name: string;
  address: string;
  phone: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  branchId?: string; // Phase 4: Branch support
  createdAt: string;
}

export interface Purchase {
  id?: string;
  supplierId: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    expiryDate?: string;
    batchNumber?: string;
  }[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  recordedBy: string;
}

export interface Product {
  id?: string;
  name: string;
  genericName?: string;
  brand?: string;
  category: string;
  sku?: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  unit: string;
  isMedicine: boolean;
  prescriptionRequired?: boolean;
  lowStockThreshold: number;
  expiryDate?: string;
}

export interface Batch {
  id?: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
}

export interface Customer {
  id?: string;
  name: string;
  phone?: string;
  dueBalance: number;
  address?: string;
}

export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id?: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  items: SaleItem[];
  totalAmount: number;
  tax?: number;
  discount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'card';
  status: 'completed' | 'held';
  prescriptionNote?: string;
  createdAt: string;
  cashierId: string;
}

export interface EService {
  id?: string;
  serviceType: string;
  description?: string;
  quantity: number;
  amount: number;
  customerName?: string;
  customerMobile?: string;
  createdAt: string;
  operatorId: string;
  remarks?: string;
}

export interface Expense {
  id?: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  recordedBy: string;
}
