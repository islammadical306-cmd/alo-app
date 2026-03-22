import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Branch, UserProfile, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../components/Auth';
import { 
  Settings as SettingsIcon, 
  Store, 
  Shield, 
  Bell, 
  Database, 
  Globe, 
  User as UserIcon,
  Download,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';

const Settings: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = React.useContext(AuthContext);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [shopName, setShopName] = useState('Islam Medical and E-Center');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'branches' | 'system'>('profile');

  useEffect(() => {
    const fetchData = async () => {
      const branchSnap = await getDocs(query(collection(db, 'branches')));
      setBranches(branchSnap.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));

      if (profile?.role === 'admin') {
        const userSnap = await getDocs(query(collection(db, 'users')));
        setUsers(userSnap.docs.map(d => ({ ...d.data() } as unknown as UserProfile)));
      }
    };
    fetchData();
  }, [profile]);

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const collections = [
        'products', 'customers', 'suppliers', 'sales', 
        'purchases', 'eservices', 'expenses', 'branches', 'users'
      ];
      
      const backupData: any = {};
      
      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        backupData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `islam_medical_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup error:", error);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
          >
            <Store className="w-5 h-5" />
            {t('shopProfile')}
          </button>
          {profile?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
            >
              <Shield className="w-5 h-5" />
              {t('userManagement')}
            </button>
          )}
          <button 
            onClick={() => setActiveTab('branches')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'branches' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
          >
            <Globe className="w-5 h-5" />
            {t('branchManagement')}
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'system' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
          >
            <Database className="w-5 h-5" />
            {t('backupData')}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Store className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">{t('shopProfile')}</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Shop Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" 
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Currency Symbol</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-bold" value="৳ (BDT)" disabled />
                  </div>
                </div>
                <button className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                  {t('save')} Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">{t('userManagement')}</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-4 px-2">User</th>
                        <th className="pb-4 px-2">Role</th>
                        <th className="pb-4 px-2">Branch</th>
                        <th className="pb-4 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map(u => (
                        <tr key={u.uid} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                <UserIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{u.displayName || 'Unnamed User'}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <select 
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.uid, e.target.value as UserRole)}
                              className="bg-slate-100 border-none rounded-lg text-xs font-bold p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="cashier">Cashier</option>
                              <option value="pharmacy_staff">Pharmacy Staff</option>
                              <option value="e_center_operator">E-Center Operator</option>
                            </select>
                          </td>
                          <td className="py-4 px-2">
                            <span className="text-xs font-medium text-slate-600">Main Branch</span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <button className="text-rose-500 hover:text-rose-600 font-bold text-xs p-2">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branches' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Globe className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">{t('branchManagement')}</h3>
              </div>
              <div className="p-6 space-y-4">
                {branches.map(b => (
                  <div key={b.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{b.name}</p>
                        <p className="text-xs text-slate-500">{b.address}</p>
                      </div>
                    </div>
                    <button className="text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all px-4 py-2 hover:bg-blue-50 rounded-lg">Edit</button>
                  </div>
                ))}
                <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  {t('addNewBranch')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800">{t('backupData')}</h3>
                </div>
                <div className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-2">
                    <Download className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-800">{t('exportJson')}</h4>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                      Download a complete copy of your database including products, sales, customers, and more.
                    </p>
                  </div>
                  <button 
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 disabled:bg-slate-300"
                  >
                    {isBackingUp ? 'Preparing Backup...' : (
                      <>
                        <Download className="w-5 h-5" />
                        Download Backup
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-900">Security Note</h4>
                  <p className="text-sm text-rose-700 mt-1">
                    Backups contain sensitive business data. Store them in a secure location and never share them with unauthorized personnel.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
