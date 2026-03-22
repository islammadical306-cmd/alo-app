import React, { useContext } from 'react';
import { AuthContext } from './Auth';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Monitor,
  TrendingUp,
  TrendingDown,
  User,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { profile, logout } = useContext(AuthContext);
  const { t, language, setLanguage } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'pharmacy_staff', 'e_center_operator'] },
    { id: 'pos', label: t('pos'), icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { id: 'inventory', label: t('inventory'), icon: Package, roles: ['admin', 'manager', 'pharmacy_staff'] },
    { id: 'purchases', label: t('purchases'), icon: TrendingUp, roles: ['admin', 'manager'] },
    { id: 'suppliers', label: t('suppliers'), icon: User, roles: ['admin', 'manager'] },
    { id: 'eservices', label: t('eservices'), icon: Monitor, roles: ['admin', 'manager', 'e_center_operator'] },
    { id: 'customers', label: t('customers'), icon: Users, roles: ['admin', 'manager', 'cashier'] },
    { id: 'expenses', label: t('expenses'), icon: TrendingDown, roles: ['admin', 'manager'] },
    { id: 'reports', label: t('reports'), icon: FileText, roles: ['admin', 'manager'] },
    { id: 'settings', label: t('settings'), icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col fixed h-full z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && (
            <span className="font-bold text-white text-lg truncate">Islam Medical</span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-white")} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={cn("flex items-center gap-3 mb-4", !isSidebarOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{profile?.displayName}</p>
                <p className="text-xs text-slate-500 capitalize">{profile?.role.replace('_', ' ')}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {t(activeTab)}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
            >
              {language === 'en' ? 'বাংলা' : 'English'}
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
              <AlertCircle className="w-3 h-3" />
              <span>3 {t('lowStock')}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <span className="text-sm text-slate-500 font-medium">
              {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
