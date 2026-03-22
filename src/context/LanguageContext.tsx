import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}

const translations: Translations = {
  dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  pos: { en: 'POS Billing', bn: 'পিওএস বিলিং' },
  inventory: { en: 'Inventory', bn: 'ইনভেন্টরি' },
  purchases: { en: 'Purchases', bn: 'ক্রয়' },
  suppliers: { en: 'Suppliers', bn: 'সরবরাহকারী' },
  eservices: { en: 'E-Services', bn: 'ই-সার্ভিস' },
  customers: { en: 'Customers', bn: 'কাস্টমার' },
  expenses: { en: 'Expenses', bn: 'খরচ' },
  reports: { en: 'Reports', bn: 'রিপোর্ট' },
  settings: { en: 'Settings', bn: 'সেটিংস' },
  logout: { en: 'Logout', bn: 'লগআউট' },
  dailySales: { en: 'Daily Sales', bn: 'দৈনিক বিক্রি' },
  dailyExpenses: { en: 'Daily Expenses', bn: 'দৈনিক খরচ' },
  totalCustomers: { en: 'Total Customers', bn: 'মোট কাস্টমার' },
  totalDue: { en: 'Total Due', bn: 'মোট বাকি' },
  lowStock: { en: 'Low Stock', bn: 'কম স্টক' },
  expiringSoon: { en: 'Expiring Soon', bn: 'মেয়াদ শেষ হচ্ছে' },
  serviceIncome: { en: 'Service Income', bn: 'সার্ভিস আয়' },
  add: { en: 'Add', bn: 'যোগ করুন' },
  save: { en: 'Save', bn: 'সংরক্ষণ' },
  cancel: { en: 'Cancel', bn: 'বাতিল' },
  search: { en: 'Search', bn: 'খুঁজুন' },
  invoice: { en: 'Invoice', bn: 'ইনভয়েস' },
  amount: { en: 'Amount', bn: 'পরিমাণ' },
  status: { en: 'Status', bn: 'অবস্থা' },
  paid: { en: 'Paid', bn: 'পরিশোধিত' },
  due: { en: 'Due', bn: 'বাকি' },
  total: { en: 'Total', bn: 'মোট' },
  discount: { en: 'Discount', bn: 'ডিসকাউন্ট' },
  payable: { en: 'Payable', bn: 'প্রদেয়' },
  paymentMethod: { en: 'Payment Method', bn: 'পেমেন্ট পদ্ধতি' },
  completeSale: { en: 'Complete Sale', bn: 'বিক্রি সম্পন্ন করুন' },
  medicine: { en: 'Medicine', bn: 'ওষুধ' },
  general: { en: 'General', bn: 'সাধারণ' },
  stock: { en: 'Stock', bn: 'স্টক' },
  price: { en: 'Price', bn: 'দাম' },
  holdSale: { en: 'Hold Sale', bn: 'হোল্ড করুন' },
  newSale: { en: 'New Sale', bn: 'নতুন মেমো' },
  heldSales: { en: 'Held Sales', bn: 'হোল্ড করা মেমো' },
  tax: { en: 'Tax', bn: 'ভ্যাট/ট্যাক্স' },
  prescriptionNote: { en: 'Prescription Note', bn: 'প্রেসক্রিপশন নোট' },
  customerMobile: { en: 'Customer Mobile', bn: 'কাস্টমার মোবাইল' },
  walkInCustomer: { en: 'Walk-in Customer', bn: 'সাধারণ কাস্টমার' },
  completeTransaction: { en: 'Complete Transaction', bn: 'লেনদেন সম্পন্ন করুন' },
  cartIsEmpty: { en: 'Cart is empty', bn: 'কার্ট খালি' },
  items: { en: 'Items', bn: 'আইটেম' },
  subtotal: { en: 'Subtotal', bn: 'উপ-মোট' },
  totalPayable: { en: 'Total Payable', bn: 'মোট প্রদেয়' },
  dueAmount: { en: 'Due Amount', bn: 'বাকি পরিমাণ' },
  searchMedicine: { en: 'Search medicine by name, barcode or SKU...', bn: 'নাম, বারকোড বা SKU দিয়ে ওষুধ খুঁজুন...' },
  userManagement: { en: 'User Management', bn: 'ইউজার ম্যানেজমেন্ট' },
  backupData: { en: 'Backup Data', bn: 'ব্যাকআপ ডাটা' },
  exportJson: { en: 'Export to JSON', bn: 'JSON এক্সপোর্ট' },
  role: { en: 'Role', bn: 'ভূমিকা' },
  actions: { en: 'Actions', bn: 'অ্যাকশন' },
  updateRole: { en: 'Update Role', bn: 'রোল আপডেট' },
  shopProfile: { en: 'Shop Profile', bn: 'দোকানের প্রোফাইল' },
  branchManagement: { en: 'Branch Management', bn: 'ব্রাঞ্চ ম্যানেজমেন্ট' },
  addNewBranch: { en: 'Add New Branch', bn: 'নতুন ব্রাঞ্চ যোগ করুন' },
  businessReports: { en: 'Business Reports', bn: 'ব্যবসা রিপোর্ট' },
  totalRevenue: { en: 'Total Revenue', bn: 'মোট রাজস্ব' },
  totalExpenses: { en: 'Total Expenses', bn: 'মোট খরচ' },
  netProfit: { en: 'Net Profit', bn: 'নিট লাভ' },
  lowStockInventory: { en: 'Low Stock Inventory', bn: 'কম স্টক ইনভেন্টরি' },
  recentServiceIncome: { en: 'Recent Service Income', bn: 'সাম্প্রতিক সার্ভিস ইনকাম' },
  exportPdf: { en: 'Export PDF', bn: 'PDF এক্সপোর্ট' },
  reorder: { en: 'REORDER', bn: 'রি-অর্ডার' },
  service: { en: 'Service', bn: 'সার্ভিস' },
  operationalCosts: { en: 'Operational Costs', bn: 'অপারেশনাল খরচ' },
  recentSales: { en: 'Recent Sales', bn: 'সাম্প্রতিক বিক্রি' },
  inventoryAlerts: { en: 'Inventory Alerts', bn: 'ইনভেন্টরি অ্যালার্ট' },
  quickPosAccess: { en: 'Quick POS Access', bn: 'কুইক POS অ্যাক্সেস' },
  startNewBilling: { en: 'Start a new billing session instantly.', bn: 'তাত্ক্ষণিকভাবে একটি নতুন বিলিং সেশন শুরু করুন।' },
  openPosScreen: { en: 'Open POS Screen', bn: 'POS স্ক্রিন খুলুন' },
  viewAll: { en: 'View All', bn: 'সব দেখুন' },
  time: { en: 'Time', bn: 'সময়' },
  expiry: { en: 'Expiry', bn: 'মেয়াদ শেষ' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved as Language) || 'bn';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
