/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { loadDatabase, ERPDatabase, hasPermission, saveDatabase, UserRole, deleteTransaction, deleteAllTransactions } from './data/accountingEngine';
import { Header, BRANCHES, WAREHOUSES, CURRENCIES, ROLES } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { MasterDataTab } from './components/MasterDataTab';
import { TransaksiTab } from './components/TransaksiTab';
import { CashBankTab } from './components/CashBankTab';
import { AccountingTab } from './components/AccountingTab';
import { ReportsTab } from './components/ReportsTab';
import { TaxSimulatorTab } from './components/TaxSimulatorTab';
import { TaxPaymentTrackingTab } from './components/TaxPaymentTrackingTab';
import { AboutTab } from './components/AboutTab';
import { 
  LayoutDashboard, Database, ShoppingCart, 
  Coins, FileSpreadsheet, BarChart2, ShieldAlert, KeyRound,
  X, Building2, Warehouse, Shield, Percent, Receipt, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [db, setDb] = useState<ERPDatabase>(loadDatabase);
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'Dashboard' },
    { id: 'MasterData', label: 'Master Data', icon: Database, permissionKey: 'MasterData' },
    { id: 'Transaksi', label: 'Transaksi', icon: ShoppingCart, permissionKey: 'Transaksi' },
    { id: 'CashBank', label: 'Kas & Bank', icon: Coins, permissionKey: 'CashBank' },
    { id: 'Accounting', label: 'Akuntansi', icon: FileSpreadsheet, permissionKey: 'Accounting' },
    { id: 'Reports', label: 'Laporan Keuangan', icon: BarChart2, permissionKey: 'Reports' },
    { id: 'TaxSimulator', label: 'Pajak PPh Badan', icon: Percent, permissionKey: 'Reports' },
    { id: 'TaxPaymentTracking', label: 'Setoran Pajak', icon: Receipt, permissionKey: 'Reports' },
    { id: 'About', label: 'Tentang Sistem', icon: Info, permissionKey: 'About' },
  ];

  const currentRole = db.userSession.role;
  const isAuthorized = hasPermission(currentRole, activeTab);

  const handleBranchChange = (branch: string) => {
    const updated = { ...db, activeBranch: branch };
    setDb(updated);
    saveDatabase(updated);
  };

  const handleWarehouseChange = (warehouse: string) => {
    const updated = { ...db, activeWarehouse: warehouse };
    setDb(updated);
    saveDatabase(updated);
  };

  const handleCurrencyChange = (currency: 'IDR' | 'USD' | 'SGD') => {
    const updated = { ...db, activeCurrency: currency };
    setDb(updated);
    saveDatabase(updated);
  };

  const handleDeleteTransaction = (type: 'Sales' | 'Purchase' | 'Cash' | 'Journal', id: string) => {
    const newDb = deleteTransaction(db, type, id);
    setDb(newDb);
    saveDatabase(newDb);
    alert('Data berhasil dihapus.');
  };

  const handleDeleteAllTransactions = () => {
    const newDb = deleteAllTransactions(db);
    setDb(newDb);
    saveDatabase(newDb);
    alert('Seluruh data transaksi berhasil dihapus.');
  };

  const handleImportDatabase = (importedDb: ERPDatabase) => {
    setDb(importedDb);
    saveDatabase(importedDb);
    alert('Database berhasil dipulihkan (Restore)!');
  };

  const handleRoleChange = (role: UserRole) => {
    const selected = ROLES.find((r) => r.role === role);
    if (!selected) return;
    const updated = {
      ...db,
      userSession: {
        name: selected.name,
        role: selected.role,
        email: selected.email,
        avatar: selected.avatar,
      },
    };
    setDb(updated);
    saveDatabase(updated);
  };

  return (
    <div className="h-screen flex flex-col font-sans antialiased transition-colors duration-300 bg-[#09090b] text-zinc-100 overflow-hidden">
      {/* Navigation Top Header */}
      <Header 
        db={db} 
        onUpdateDb={setDb} 
        isMobileMenuOpen={isMobileMenuOpen} 
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        darkMode={true}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Persistent Desktop Sidebar (Visible only on Laptop/Desktop) */}
        <aside id="erp-sidebar" className="w-64 p-5 flex-col justify-between hidden lg:flex shadow-sm transition-colors duration-300 bg-zinc-950 border-r border-zinc-900 text-zinc-300 shadow-zinc-950/40 overflow-y-auto">
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider px-3 mb-2.5 text-zinc-500">Menu Navigasi</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const allowed = hasPermission(currentRole, item.permissionKey);

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${
                      active 
                        ? 'text-white' 
                        : 'text-zinc-500 group-hover:text-zinc-300' 
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {!allowed && (
                    <KeyRound className="w-3.5 h-3.5 text-rose-500 opacity-80" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="border rounded-xl p-3.5 text-center shadow-sm transition-all duration-300 bg-zinc-900/40 border-zinc-800/80 text-zinc-300">
            <p className="text-[10px] font-black uppercase tracking-wide">Web ERP Accounting</p>
            <p className="text-[9px] font-bold mt-0.5 text-zinc-500">Versi MVP v1.0.0 (Stable)</p>
          </div>
        </aside>

        {/* Dynamic Navigation Mobile Drawer (Visible on Smartphones and Tablets) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Dark Glass Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950 z-40 lg:hidden"
              />

              {/* Slide-out Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed top-0 left-0 bottom-0 w-80 bg-zinc-950 shadow-2xl z-50 p-5 overflow-y-auto flex flex-col justify-between lg:hidden border-r border-zinc-900 text-zinc-100"
              >
                <div className="space-y-6">
                  {/* Close button and branding */}
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                    <div>
                      <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wide">Web ERP Menu</h2>
                      <p className="text-[10px] text-zinc-500 font-bold">Aplikasi Mobile & Tablet</p>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation Links inside Mobile Drawer */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider px-3 mb-1.5">Daftar Modul</p>
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      const allowed = hasPermission(currentRole, item.permissionKey);

                      return (
                        <button
                          key={item.id}
                          id={`mob-nav-item-${item.id}`}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                            active
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/75'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-zinc-500'}`} />
                            <span>{item.label}</span>
                          </div>
                          {!allowed && (
                            <KeyRound className="w-3.5 h-3.5 text-rose-500 opacity-80" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Global Setup Selectors inside Mobile Drawer */}
                  <div className="space-y-4 pt-4 border-t border-zinc-900">
                    <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider px-3">Konfigurasi Sistem</p>
                    
                    {/* Currency */}
                    <div className="space-y-1 px-3">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase flex items-center space-x-1">
                        <Coins className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Mata Uang Acuan</span>
                      </label>
                      <select
                        id="mob-currency-selector"
                        className="w-full text-xs font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none"
                        value={db.activeCurrency}
                        onChange={(e) => handleCurrencyChange(e.target.value as any)}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c} className="bg-zinc-950 text-zinc-200">{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Active User Switcher */}
                    <div className="space-y-1 px-3">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase flex items-center space-x-1">
                        <Shield className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Ubah Peran / Hak Akses</span>
                      </label>
                      <select
                        id="mob-role-selector"
                        className="w-full text-xs font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none"
                        value={ROLES.findIndex((r) => r.role === db.userSession.role)}
                        onChange={(e) => handleRoleChange(ROLES[Number(e.target.value)].role)}
                      >
                        {ROLES.map((r, i) => (
                          <option key={r.role} value={i} className="bg-zinc-950 text-zinc-200">{r.role} ({r.name})</option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* Sidebar Mobile Footer */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center shadow-sm mt-6">
                  <p className="text-[9px] font-black text-zinc-300 uppercase tracking-wide">Web ERP Accounting</p>
                  <p className="text-[8px] text-zinc-500 font-bold mt-0.5">Mobile-Optimized Layout</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic Content Frame */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          
          {/* Permission check / lock layer */}
          {!isAuthorized ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl shadow-sm animate-bounce">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wide">Akses Modul Terkunci</h3>
                <p className="text-xs text-zinc-400 font-bold mt-1.5">
                  Sebagai <span className="text-rose-500 font-black uppercase">[{currentRole}]</span>, Anda tidak memiliki otoritas otentikasi untuk membuka halaman <span className="font-extrabold text-zinc-200">"{activeTab}"</span>.
                </p>
                <p className="text-[10px] text-zinc-500 font-medium mt-2">
                  Buka menu navigasi dan gunakan switcher peran jika Anda memiliki akses.
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {activeTab === 'Dashboard' && <DashboardTab db={db} />}
              {activeTab === 'MasterData' && <MasterDataTab db={db} onUpdateDb={setDb} />}
              {activeTab === 'Transaksi' && <TransaksiTab db={db} onUpdateDb={setDb} />}
              {activeTab === 'CashBank' && <CashBankTab db={db} onUpdateDb={setDb} />}
              {activeTab === 'Accounting' && <AccountingTab db={db} onUpdateDb={setDb} />}
              {activeTab === 'Reports' && <ReportsTab db={db} onDeleteTransaction={handleDeleteTransaction} onDeleteAllTransactions={handleDeleteAllTransactions} />}
              {activeTab === 'TaxSimulator' && <TaxSimulatorTab db={db} />}
              {activeTab === 'TaxPaymentTracking' && <TaxPaymentTrackingTab db={db} />}
              {activeTab === 'About' && <AboutTab db={db} onImportDatabase={handleImportDatabase} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
