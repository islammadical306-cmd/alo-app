import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { Sale, Product, Expense, EService } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Clock, 
  Download,
  Calendar,
  Filter
} from 'lucide-react';

const Reports: React.FC = () => {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [services, setServices] = useState<EService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sSnap = await getDocs(query(collection(db, 'sales'), orderBy('createdAt', 'desc')));
        setSales(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
        
        const pSnap = await getDocs(query(collection(db, 'products')));
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        
        const eSnap = await getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc')));
        setExpenses(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
        
        const svSnap = await getDocs(query(collection(db, 'eservices'), orderBy('createdAt', 'desc')));
        setServices(svSnap.docs.map(d => ({ id: d.id, ...d.data() } as EService)));
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSales = sales.filter(s => {
    const date = new Date(s.createdAt).toISOString().split('T')[0];
    return date >= dateRange.start && date <= dateRange.end;
  });

  const filteredExpenses = expenses.filter(e => {
    const date = new Date(e.date).toISOString().split('T')[0];
    return date >= dateRange.start && date <= dateRange.end;
  });

  const filteredServices = services.filter(s => {
    const date = new Date(s.createdAt).toISOString().split('T')[0];
    return date >= dateRange.start && date <= dateRange.end;
  });

  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalServiceIncome = filteredServices.reduce((sum, s) => sum + s.amount, 0);
  const netProfit = (totalSales + totalServiceIncome) - totalExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800">{t('businessReports')}</h3>
          <p className="text-slate-500 text-sm">Analyze your business performance</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent text-xs font-bold text-slate-600 outline-none"
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          <span className="text-slate-300 font-bold">to</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent text-xs font-bold text-slate-600 outline-none"
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <button className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('totalRevenue')}</span>
              <p className="text-2xl font-black text-slate-900 leading-none">৳{totalSales + totalServiceIncome}</p>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-3/4"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-bold">Sales + E-Services</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('totalExpenses')}</span>
              <p className="text-2xl font-black text-slate-900 leading-none">৳{totalExpenses}</p>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 w-1/4"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-bold">{t('operationalCosts')}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 text-white hover:scale-[1.02] transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl group-hover:rotate-12 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-300/50 uppercase tracking-widest">{t('netProfit')}</span>
              <p className="text-2xl font-black text-white leading-none">৳{netProfit}</p>
            </div>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 w-1/2"></div>
          </div>
          <p className="text-[10px] text-emerald-400/70 mt-3 font-bold">After all deductions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-500" />
              {t('lowStockInventory')}
            </h4>
            <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black">
              {products.filter(p => p.stock <= p.lowStockThreshold).length} ITEMS
            </span>
          </div>
          <div className="p-2">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Stock</th>
                  <th className="px-4 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.filter(p => p.stock <= p.lowStockThreshold).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.genericName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-black ${p.stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black">
                        {t('reorder')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              {t('recentServiceIncome')}
            </h4>
            <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
          </div>
          <div className="p-2">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-4">{t('service')}</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredServices.slice(0, 8).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800">{s.serviceType}</p>
                      <p className="text-[10px] text-slate-400">{s.customerName}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 font-black text-right text-emerald-600">
                      ৳{s.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
          <Download className="w-5 h-5" />
          {t('exportPdf')}
        </button>
      </div>
    </div>
  );
};

export default Reports;
