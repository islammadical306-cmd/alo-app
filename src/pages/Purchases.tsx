import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { Purchase, Product, Supplier } from '../types';
import { Plus, Search, Trash2, ShoppingCart, Calendar, User } from 'lucide-react';

const Purchases: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const pSnap = await getDocs(query(collection(db, 'products')));
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      const sSnap = await getDocs(query(collection(db, 'suppliers')));
      setSuppliers(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));
    };
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) return;
    setCart([...cart, {
      productId: product.id,
      name: product.name,
      quantity: 1,
      purchasePrice: product.purchasePrice,
      expiryDate: '',
      batchNumber: ''
    }]);
  };

  const updateItem = (productId: string, field: string, value: any) => {
    setCart(cart.map(item => item.productId === productId ? { ...item, [field]: value } : item));
  };

  const total = cart.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

  const handlePurchase = async () => {
    if (!selectedSupplier || cart.length === 0) return;
    setIsProcessing(true);
    try {
      const purchaseData: Purchase = {
        supplierId: selectedSupplier,
        items: cart,
        totalAmount: total,
        paidAmount: paidAmount,
        dueAmount: total - paidAmount,
        date: new Date().toISOString().split('T')[0],
        recordedBy: 'current-user-id'
      };

      await addDoc(collection(db, 'purchases'), purchaseData);

      // Update stock and add batches
      for (const item of cart) {
        const productRef = doc(db, 'products', item.productId);
        await updateDoc(productRef, {
          stock: increment(item.quantity),
          purchasePrice: item.purchasePrice
        });

        if (item.batchNumber && item.expiryDate) {
          await addDoc(collection(db, 'batches'), {
            productId: item.productId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantity: item.quantity
          });
        }
      }

      setCart([]);
      setPaidAmount(0);
      setSelectedSupplier('');
      alert("Purchase recorded and stock updated!");
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Select Products to Purchase</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map(p => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)}
                className="p-3 border border-slate-100 rounded-xl hover:border-emerald-500 transition-all text-left"
              >
                <p className="font-bold text-sm text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">Current Stock: {p.stock}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Batch/Expiry</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cart.map(item => (
                <tr key={item.productId}>
                  <td className="px-4 py-3 font-bold text-sm">{item.name}</td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      className="w-16 p-1 border rounded" 
                      value={item.quantity} 
                      onChange={e => updateItem(item.productId, 'quantity', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      className="w-20 p-1 border rounded" 
                      value={item.purchasePrice} 
                      onChange={e => updateItem(item.productId, 'purchasePrice', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <input 
                      type="text" 
                      placeholder="Batch" 
                      className="w-full p-1 text-xs border rounded" 
                      value={item.batchNumber} 
                      onChange={e => updateItem(item.productId, 'batchNumber', e.target.value)}
                    />
                    <input 
                      type="date" 
                      className="w-full p-1 text-xs border rounded" 
                      value={item.expiryDate} 
                      onChange={e => updateItem(item.productId, 'expiryDate', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setCart(cart.filter(i => i.productId !== item.productId))} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800">Purchase Summary</h3>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Supplier</label>
            <select 
              className="w-full p-2 border rounded-lg"
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount</span>
              <span>৳{total}</span>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Paid Amount</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-lg font-bold text-emerald-600" 
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Due Amount</span>
              <span>৳{total - paidAmount}</span>
            </div>
          </div>
          <button 
            onClick={handlePurchase}
            disabled={isProcessing || !selectedSupplier || cart.length === 0}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold disabled:bg-slate-300"
          >
            {isProcessing ? 'Recording...' : 'Record Purchase & Update Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
