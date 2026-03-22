import React, { useState, useEffect, useContext } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../components/Auth';
import { useLanguage } from '../context/LanguageContext';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShoppingCart,
  ChevronRight
} from 'lucide-react';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';
import { Sale, Expense, Customer, Product } from '../types';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    dailySales: 0,
    dailyExpenses: 0,
    totalCustomers: 0,
    dueAmount: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<Product[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = startOfDay(new Date()).toISOString();
    const tomorrow = endOfDay(new Date()).toISOString();

    // 1. Daily Sales Real-time
    const salesQuery = query(
      collection(db, 'sales'),
      where('createdAt', '>=', today),
      where('createdAt', '<=', tomorrow)
    );
    const unsubscribeSales = onSnapshot(salesQuery, (snap) => {
      const total = snap.docs.reduce((sum, d) => sum + (d.data() as Sale).totalAmount, 0);
      setStats(prev => ({ ...prev, dailySales: total }));
    });

    // 2. Daily Expenses Real-time
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('date', '>=', today),
      where('date', '<=', tomorrow)
    );
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snap) => {
      const total = snap.docs.reduce((sum, d) => sum + (d.data() as Expense).amount, 0);
      setStats(prev => ({ ...prev, dailyExpenses: total }));
    });

    // 3. Customers & Due Real-time
    const customersQuery = query(collection(db, 'customers'));
    const unsubscribeCustomers = onSnapshot(customersQuery, (snap) => {
      const count = snap.size;
      const totalDue = snap.docs.reduce((sum, d) => sum + (d.data() as Customer).dueBalance, 0);
      setStats(prev => ({ ...prev, totalCustomers: count, dueAmount: totalDue }));
    });

    // 4. Recent Sales
    const recentSalesQuery = query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecentSales = onSnapshot(recentSalesQuery, (snap) => {
      setRecentSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
    });

    // 5. Inventory Alerts (Low Stock)
    const lowStockQuery = query(collection(db, 'products'));
    const unsubscribeLowStock = onSnapshot(lowStockQuery, (snap) => {
      const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setInventoryAlerts(products.filter(p => p.stock <= p.lowStockThreshold));
      
      // Expiry alerts (within 30 days)
      const thirtyDaysFromNow = addDays(new Date(), 30).toISOString();
      setExpiryAlerts(products.filter(p => p.expiryDate && p.expiryDate <= thirtyDaysFromNow));
      
      setLoading(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
      unsubscribeCustomers();
      unsubscribeRecentSales();
      unsubscribeLowStock();
    };
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-black ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}%
          </div>
        )}
      </div>
      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</h3>
      <p className="text-3xl font-black text-slate-900 mt-1">
        {typeof value === 'number' && (title.includes('Amount') || title.includes('Sales') || title.includes('Expenses') || title.includes('Due')) ? `৳${value.toLocaleString()}` : value}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dailySales')} value={stats.dailySales} icon={TrendingUp} color="emerald" trend="up" trendValue="12" />
        <StatCard title={t('dailyExpenses')} value={stats.dailyExpenses} icon={DollarSign} color="rose" trend="down" trendValue="5" />
        <StatCard title={t('totalCustomers')} value={stats.totalCustomers} icon={Users} color="blue" trend="up" trendValue="8" />
        <StatCard title={t('totalDue')} value={stats.dueAmount} icon={AlertTriangle} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              {t('recentSales')}
            </h3>
            <button className="text-emerald-600 text-xs font-black hover:underline flex items-center gap-1">
              {t('viewAll')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">{t('invoice')}</th>
                  <th className="px-6 py-4">{t('customer')}</th>
                  <th className="px-6 py-4">{t('amount')}</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">{t('time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">#{sale.id?.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{sale.customerName || t('walkInCustomer')}</p>
                      <p className="text-[10px] text-slate-400">{sale.customerMobile || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">৳{sale.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${sale.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {sale.status === 'completed' ? t('paid') : 'Held'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                      {format(new Date(sale.createdAt), 'hh:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t('inventoryAlerts')}
            </h3>
            <div className="space-y-3">
              {inventoryAlerts.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100 group hover:bg-amber-100 transition-colors">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-900">{p.name}</p>
                    <p className="text-[10px] font-bold text-amber-700">{t('stock')}: {p.stock} {p.unit}</p>
                  </div>
                </div>
              ))}
              
              {expiryAlerts.slice(0, 2).map(p => (
                <div key={p.id} className="flex items-start gap-3 p-3 bg-rose-50 rounded-2xl border border-rose-100 group hover:bg-rose-100 transition-colors">
                  <div className="p-2 bg-rose-100 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-rose-900">{p.name}</p>
                    <p className="text-[10px] font-bold text-rose-700">{t('expiry')}: {p.expiryDate ? format(new Date(p.expiryDate), 'dd MMM yyyy') : 'N/A'}</p>
                  </div>
                </div>
              ))}

              {inventoryAlerts.length === 0 && expiryAlerts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-xs font-bold">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-900 p-8 rounded-3xl shadow-xl shadow-emerald-100 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-2">{t('quickPosAccess')}</h3>
              <p className="text-emerald-200 text-xs mb-6 font-medium leading-relaxed">{t('startNewBilling')}</p>
              <button className="bg-white text-emerald-900 px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-950/20 active:scale-95">
                {t('openPosScreen')}
              </button>
            </div>
            <ShoppingCart className="absolute -bottom-6 -right-6 w-40 h-40 text-emerald-800 opacity-30 group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
