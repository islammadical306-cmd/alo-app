import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc } from 'firebase/firestore';
import { Expense } from '../types';
import { Plus, Search, DollarSign, Calendar, Tag } from 'lucide-react';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Rent',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Rent', 'Electricity', 'Internet', 'Salary', 'Cleaning', 'Maintenance', 'Other'];

  const fetchExpenses = async () => {
    setLoading(true);
    const q = query(collection(db, 'expenses'));
    const querySnapshot = await getDocs(q);
    setExpenses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'expenses'), {
        ...newExpense,
        recordedBy: 'current-user-id'
      });
      setShowModal(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Expense Management</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-rose-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id}>
                  <td className="px-6 py-4 text-slate-600 text-sm">{e.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold uppercase">{e.category}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{e.description || '-'}</td>
                  <td className="px-6 py-4 font-bold text-rose-600">৳{e.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4">Expense Summary</h4>
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs font-bold text-rose-600 uppercase">Total Expenses</p>
              <p className="text-2xl font-black text-rose-900">৳{expenses.reduce((sum, e) => sum + e.amount, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Add Expense</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-200 rounded">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Date</label>
                <input
                  required
                  type="date"
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                  value={newExpense.date}
                  onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Amount</label>
                <input
                  required
                  type="number"
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                <textarea
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold">Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
