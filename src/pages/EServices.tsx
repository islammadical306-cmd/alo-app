import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { EService } from '../types';
import { Monitor, Plus, Search, DollarSign, Clock } from 'lucide-react';

const EServices: React.FC = () => {
  const [services, setServices] = useState<EService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newService, setNewService] = useState<Partial<EService>>({
    serviceType: 'Print',
    amount: 0,
    description: ''
  });

  const serviceTypes = ['Print', 'Scan', 'Photocopy', 'Online Application', 'Typing', 'Recharge', 'Other'];

  const fetchServices = async () => {
    setLoading(true);
    const q = query(collection(db, 'eservices'));
    const querySnapshot = await getDocs(q);
    setServices(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EService)));
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'eservices'), {
        ...newService,
        createdAt: new Date().toISOString(),
        operatorId: 'current-user-id'
      });
      setShowModal(false);
      fetchServices();
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">E-Service Billing</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Service Bill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : services.map(s => (
                <tr key={s.id}>
                  <td className="px-6 py-4 font-bold text-slate-800">{s.serviceType}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{s.description || '-'}</td>
                  <td className="px-6 py-4 font-bold text-blue-600">৳{s.amount}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{new Date(s.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg">
            <h4 className="font-bold mb-4">Daily E-Service Income</h4>
            <p className="text-3xl font-black">৳{services.reduce((sum, s) => sum + s.amount, 0)}</p>
            <p className="text-blue-100 text-xs mt-2">Total {services.length} services today</p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">New Service Bill</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-200 rounded">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Service Type</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={newService.serviceType}
                  onChange={e => setNewService({...newService, serviceType: e.target.value})}
                >
                  {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Amount</label>
                <input
                  required
                  type="number"
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  value={newService.amount}
                  onChange={e => setNewService({...newService, amount: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description (Optional)</label>
                <textarea
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={newService.description}
                  onChange={e => setNewService({...newService, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Create Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EServices;
