/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ERPDatabase } from '../data/accountingEngine';
import { SalesTab } from './SalesTab';
import { PurchaseTab } from './PurchaseTab';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, ShoppingBag, ArrowLeftRight } from 'lucide-react';

interface TransaksiTabProps {
  db: ERPDatabase;
  onUpdateDb: (db: ERPDatabase) => void;
}

export const TransaksiTab: React.FC<TransaksiTabProps> = ({ db, onUpdateDb }) => {
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'purchase'>('sales');

  const subTabs = [
    { id: 'sales' as const, label: 'Penjualan', icon: ShoppingCart, color: 'emerald' },
    { id: 'purchase' as const, label: 'Pembelian', icon: ShoppingBag, color: 'blue' },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Sub-Tab Navigation */}
      <div className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl p-5 border border-white/[0.08] shadow-xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-500/5 rounded-full blur-3xl -ml-12 -mb-12"></div>

        <div className="relative z-10">
          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded border border-indigo-400/20 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3 h-3" /> MODUL TRANSAKSI
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-50">
                Manajemen Transaksi Bisnis
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium max-w-lg">
                Kelola seluruh transaksi penjualan dan pembelian CV. Toras Benaunt dalam satu modul terpadu.
              </p>
            </div>

            {/* Stats summary */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-2.5 bg-[#050510]/80 rounded-xl border border-white/[0.08]">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em]">Penjualan</p>
                <p className="text-sm font-black text-emerald-400">{db.salesInvoices.length}</p>
              </div>
              <div className="text-center px-4 py-2.5 bg-[#050510]/80 rounded-xl border border-white/[0.08]">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em]">Pembelian</p>
                <p className="text-sm font-black text-blue-400">{db.purchaseInvoices.length}</p>
              </div>
            </div>
          </div>

          {/* Sub-Tab Switcher */}
          <div className="flex bg-[#050510]/80 p-1 rounded-xl border border-white/[0.08] w-full sm:w-auto sm:inline-flex shadow-inner">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`transaksi-tab-${tab.id}`}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive
                      ? tab.id === 'sales'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#0a0a1a]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {activeSubTab === 'sales' && <SalesTab db={db} onUpdateDb={onUpdateDb} />}
          {activeSubTab === 'purchase' && <PurchaseTab db={db} onUpdateDb={onUpdateDb} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
