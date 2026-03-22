import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, increment, where, getDocs } from 'firebase/firestore';
import { Product, Sale, SaleItem, Customer } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../components/Auth';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  CreditCard, 
  Printer,
  Barcode,
  X,
  ShoppingCart,
  ShoppingBag,
  PauseCircle,
  RotateCcw,
  History
} from 'lucide-react';

const POS: React.FC = () => {
  const { t } = useLanguage();
  const { user } = React.useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'card'>('cash');
  const [prescriptionNote, setPrescriptionNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [heldSales, setHeldSales] = useState<Sale[]>([]);
  const [showHeldSales, setShowHeldSales] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
    });

    const fetchHeldSales = async () => {
      const q = query(collection(db, 'sales'), where('status', '==', 'held'));
      const snap = await getDocs(q);
      setHeldSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
    };
    fetchHeldSales();

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm) ||
    p.sku?.includes(searchTerm) ||
    p.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id!,
        name: product.name,
        quantity: 1,
        price: product.salePrice,
        subtotal: product.salePrice
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    setCart(cart.map(item => {
      if (item.productId === productId) {
        let newQty = item.quantity + delta;
        if (newQty < 1) newQty = 1;
        if (product && newQty > product.stock) newQty = product.stock;
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const finalTotal = Math.max(0, subtotal + tax - discount);
  const dueAmount = Math.max(0, finalTotal - paidAmount);

  const resetPOS = () => {
    setCart([]);
    setDiscount(0);
    setTax(0);
    setPaidAmount(0);
    setSelectedCustomer(null);
    setPrescriptionNote('');
    setPaymentMethod('cash');
  };

  const handleCheckout = async (status: 'completed' | 'held' = 'completed') => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const saleData: Sale = {
        customerId: selectedCustomer?.id || 'walk-in',
        customerName: selectedCustomer?.name || t('walkInCustomer'),
        customerMobile: selectedCustomer?.phone || '',
        items: cart,
        totalAmount: finalTotal,
        tax,
        discount,
        paidAmount: status === 'held' ? 0 : paidAmount,
        dueAmount: status === 'held' ? finalTotal : dueAmount,
        paymentMethod,
        status,
        prescriptionNote,
        createdAt: new Date().toISOString(),
        cashierId: user?.uid || 'unknown'
      };

      const docRef = await addDoc(collection(db, 'sales'), saleData);
      
      if (status === 'completed') {
        // Update stock
        for (const item of cart) {
          const productRef = doc(db, 'products', item.productId);
          await updateDoc(productRef, {
            stock: increment(-item.quantity)
          });
        }

        // Update customer due if applicable
        if (selectedCustomer?.id && dueAmount > 0) {
          const customerRef = doc(db, 'customers', selectedCustomer.id);
          await updateDoc(customerRef, {
            dueBalance: increment(dueAmount)
          });
        }

        setLastSale({ ...saleData, id: docRef.id });
        setShowReceipt(true);
        resetPOS();
      } else {
        // If held, just alert and reset
        alert(t('saleHeldSuccessfully'));
        resetPOS();
        // Refresh held sales
        const q = query(collection(db, 'sales'), where('status', '==', 'held'));
        const snap = await getDocs(q);
        setHeldSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeHeldSale = (sale: Sale) => {
    setCart(sale.items);
    setDiscount(sale.discount);
    setTax(sale.tax || 0);
    setPrescriptionNote(sale.prescriptionNote || '');
    // Try to find customer
    if (sale.customerId !== 'walk-in') {
      // This is a bit simplified, ideally we'd fetch the customer object
      setSelectedCustomer({ id: sale.customerId, name: sale.customerName || '', dueBalance: 0 });
    }
    setShowHeldSales(false);
    // Optionally delete the held sale from DB or mark it as resumed
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Product Selection */}
      <div className="lg:col-span-7 flex flex-col space-y-4 overflow-hidden">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchMedicine')}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowHeldSales(true)}
            className="px-4 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl flex items-center gap-2 font-bold hover:bg-amber-100 transition-all"
          >
            <History className="w-5 h-5" />
            <span className="hidden sm:inline">{t('heldSales')}</span>
            <span className="bg-amber-200 px-2 py-0.5 rounded-full text-xs">{heldSales.length}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col group ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">{product.category}</span>
              <span className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{product.name}</span>
              {product.genericName && <span className="text-[10px] text-slate-400 mb-2 italic line-clamp-1">{product.genericName}</span>}
              <div className="mt-auto flex items-center justify-between">
                <span className="text-base font-black text-slate-900">৳{product.salePrice}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${product.stock > 10 ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-600'}`}>
                  {product.stock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">{t('items')} ({cart.length})</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={resetPOS}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              title={t('newSale')}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <ShoppingBag className="w-12 h-12 mb-3" />
              <p className="font-medium">{t('cartIsEmpty')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-xs truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500">৳{item.price}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-white rounded border border-slate-200">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-white rounded border border-slate-200">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="w-16 text-right">
                  <p className="font-bold text-slate-900 text-xs">৳{item.subtotal}</p>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{t('prescriptionNote')}</label>
              <input
                type="text"
                value={prescriptionNote}
                onChange={(e) => setPrescriptionNote(e.target.value)}
                placeholder="Doctor name, dosage info..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{t('tax')}</label>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{t('discount')}</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{t('paidAmount')}</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-200">
            <div className="flex justify-between text-slate-500 text-[10px] uppercase font-bold">
              <span>{t('subtotal')}</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 text-lg font-black pt-1">
              <span>{t('totalPayable')}</span>
              <span className="text-emerald-600">৳{finalTotal.toFixed(2)}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between text-amber-600 text-[10px] font-bold bg-amber-50 p-1.5 rounded-lg">
                <span>{t('dueAmount')}</span>
                <span>৳{dueAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(['cash', 'bkash', 'nagad', 'card'] as const).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                  paymentMethod === method 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleCheckout('held')}
              disabled={isProcessing || cart.length === 0}
              className="flex-1 bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <PauseCircle className="w-5 h-5" />
              {t('holdSale')}
            </button>
            <button
              onClick={() => handleCheckout('completed')}
              disabled={isProcessing || cart.length === 0}
              className="flex-[2] bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? '...' : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {t('completeTransaction')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Held Sales Modal */}
      {showHeldSales && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                {t('heldSales')}
              </h4>
              <button onClick={() => setShowHeldSales(false)} className="p-1 hover:bg-slate-200 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {heldSales.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No held sales found</p>
              ) : (
                heldSales.map(sale => (
                  <div key={sale.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 transition-all">
                    <div>
                      <p className="font-bold text-slate-800">{sale.customerName}</p>
                      <p className="text-xs text-slate-500">{new Date(sale.createdAt).toLocaleString()}</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1">৳{sale.totalAmount} ({sale.items.length} items)</p>
                    </div>
                    <button 
                      onClick={() => resumeHeldSale(sale)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all"
                    >
                      Resume
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-slate-800">{t('invoice')}</h4>
              <button onClick={() => setShowReceipt(false)} className="p-1 hover:bg-slate-200 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-white font-mono text-[10px]">
              <div className="text-center mb-4">
                <h2 className="font-bold text-base">ISLAM MEDICAL</h2>
                <p>Pharmacy & E-Center</p>
                <p>Chittagong, Bangladesh</p>
                <p className="mt-2 text-slate-400">--------------------------------</p>
                <p>Invoice: {lastSale.id?.slice(-8).toUpperCase()}</p>
                <p>Date: {new Date(lastSale.createdAt).toLocaleString()}</p>
                <p className="text-slate-400">--------------------------------</p>
              </div>
              <div className="space-y-1 mb-4">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="flex-1">{item.name} x {item.quantity}</span>
                    <span>৳{item.subtotal}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed pt-2 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>Total</span>
                  <span>৳{lastSale.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid ({lastSale.paymentMethod})</span>
                  <span>৳{lastSale.paidAmount}</span>
                </div>
                {lastSale.dueAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Due</span>
                    <span>৳{lastSale.dueAmount}</span>
                  </div>
                )}
              </div>
              {lastSale.prescriptionNote && (
                <div className="mt-4 p-2 bg-slate-50 rounded border border-dashed border-slate-200">
                  <p className="font-bold mb-1">Note:</p>
                  <p>{lastSale.prescriptionNote}</p>
                </div>
              )}
              <div className="text-center mt-6 text-[8px] text-slate-400">
                <p>Thank you for your business!</p>
                <p>Powered by Islam Medical POS</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
