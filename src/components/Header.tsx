/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ERPDatabase, UserRole, saveDatabase } from '../data/accountingEngine';
import { Building2, Warehouse, Coins, Shield, Briefcase, Menu, X } from 'lucide-react';
import { CVLogo } from './CVLogo';

export const BRANCHES = ['Kantor Cabang Tayan', 'Site Ready Mix'];
export const WAREHOUSES = ['Stockpile Utama Tayan', 'Stockpile Transit', 'Stockpile Batu & Pasir'];
export const CURRENCIES: ('IDR' | 'USD' | 'SGD')[] = ['IDR', 'USD', 'SGD'];

export const ROLES: { role: UserRole; name: string; email: string; avatar: string }[] = [
  { role: 'Fullstack Developer', name: 'Oktavianus Eko Haryanto', email: 'oktavianus@torasbenaunt.com', avatar: 'OE' },
];

interface HeaderProps {
  db: ERPDatabase;
  onUpdateDb: (db: ERPDatabase) => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  darkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  db, 
  onUpdateDb, 
  isMobileMenuOpen, 
  onToggleMobileMenu,
  darkMode = false
}) => {

  const handleBranchChange = (branch: string) => {
    const updated = { ...db, activeBranch: branch };
    onUpdateDb(updated);
    saveDatabase(updated);
  };

  const handleWarehouseChange = (warehouse: string) => {
    const updated = { ...db, activeWarehouse: warehouse };
    onUpdateDb(updated);
    saveDatabase(updated);
  };

  const handleCurrencyChange = (currency: 'IDR' | 'USD' | 'SGD') => {
    const updated = { ...db, activeCurrency: currency };
    onUpdateDb(updated);
    saveDatabase(updated);
  };

  const handleRoleChange = (roleIndex: number) => {
    const selected = ROLES[roleIndex];
    const updated = {
      ...db,
      userSession: {
        name: selected.name,
        role: selected.role,
        email: selected.email,
        avatar: selected.avatar,
      },
    };
    onUpdateDb(updated);
    saveDatabase(updated);
  };

  return (
    <header id="erp-header" className={`sticky top-0 z-50 px-4 md:px-6 py-3 shadow-sm flex items-center justify-between transition-colors duration-300 ${
      darkMode 
        ? 'bg-zinc-950 border-b border-zinc-900 text-zinc-100 shadow-zinc-950/20' 
        : 'bg-white border-b border-slate-200 text-slate-800'
    }`}>
      {/* Left side: Hamburger menu & Brand */}
      <div className="flex items-center space-x-3">
        {/* Mobile Navigation Toggle Button */}
        <button
          id="btn-mobile-menu"
          onClick={onToggleMobileMenu}
          aria-label="Toggle mobile menu"
          className={`p-2 rounded-lg transition-colors lg:hidden focus:outline-none ${
            darkMode 
              ? 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100' 
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          {isMobileMenuOpen ? (
            <X className="w-5.5 h-5.5" />
          ) : (
            <Menu className="w-5.5 h-5.5" />
          )}
        </button>

        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5">
          <div className={`p-0.5 rounded-lg flex items-center justify-center shadow-sm border transition-colors ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <CVLogo className="w-9 h-9" />
          </div>
          <div>
            <h1 className={`text-sm md:text-base font-extrabold tracking-tight leading-tight ${
              darkMode ? 'text-zinc-100' : 'text-slate-900'
            }`}>CV. Toras Benaunt</h1>
            <p className={`text-[10px] font-bold hidden sm:block ${
              darkMode ? 'text-zinc-400' : 'text-slate-500'
            }`}>CV. TB — Ready Mix</p>
          </div>
        </div>
      </div>

      {/* Selectors Panel (Visible only on Desktop/Laptop view, hidden on Tablet/Mobile) */}
      <div className="hidden lg:flex items-center space-x-3.5">
        {/* Currency Selector */}
        <div className={`flex items-center space-x-1.5 border rounded-lg px-2.5 py-1.5 shadow-sm transition-colors duration-300 ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <Coins className={`w-3.5 h-3.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
          <select
            id="currency-selector"
            className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1 ${
              darkMode ? 'text-zinc-200' : 'text-slate-700'
            }`}
            value={db.activeCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value as any)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c} className={darkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-white text-slate-800'}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* User Role Matrix Switcher */}
        <div className={`flex items-center space-x-2 border-l pl-3.5 ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
          <div className={`flex items-center space-x-2.5 border rounded-lg px-3 py-1.5 shadow-sm transition-colors duration-300 ${
            darkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}>
            <div className={`w-6.5 h-6.5 rounded-full font-extrabold text-xs flex items-center justify-center shadow-sm ${
              darkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-slate-950 text-white'
            }`}>
              {db.userSession.avatar}
            </div>
            <div className="text-left">
              <p className={`text-xs font-bold leading-none ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>{db.userSession.name}</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
                  {db.userSession.role}
                </span>
              </div>
            </div>
            <select
              id="role-matrix-switcher"
              className={`bg-transparent text-[11px] font-bold focus:outline-none cursor-pointer border-l pl-2 ml-1 ${
                darkMode ? 'text-zinc-400 hover:text-zinc-200 border-zinc-800' : 'text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
              value={ROLES.findIndex((r) => r.role === db.userSession.role)}
              onChange={(e) => handleRoleChange(Number(e.target.value))}
            >
              {ROLES.map((r, i) => (
                <option key={r.role} value={i} className={darkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-white text-slate-800'}>
                  Ubah Peran ({r.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mini Profile Indicator on Tablet/Mobile to show current user */}
      <div className={`flex lg:hidden items-center space-x-2 border rounded-lg px-2.5 py-1.5 shadow-sm transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
          darkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-slate-900 text-white'
        }`}>
          {db.userSession.avatar}
        </div>
        <span className="text-[10px] font-extrabold uppercase">{db.userSession.role}</span>
      </div>
    </header>
  );
};
