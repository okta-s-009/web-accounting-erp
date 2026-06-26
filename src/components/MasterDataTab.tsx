/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ERPDatabase, Customer, Supplier, Product, COAAccount, generateId, saveDatabase } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { Users, Truck, Package, Calculator, Search, Plus, X } from 'lucide-react';

interface MasterDataTabProps {
  db: ERPDatabase;
  onUpdateDb: (db: ERPDatabase) => void;
}

type SubTab = 'customers' | 'suppliers' | 'products' | 'coa';

export const MasterDataTab: React.FC<MasterDataTabProps> = ({ db, onUpdateDb }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: SubTab; id: string } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: SubTab; id: string; name: string } | null>(null);

  // Form states
  const [custForm, setCustForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [suppForm, setSuppForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [prodForm, setProdForm] = useState({ sku: '', name: '', category: '', unit: 'Pcs', costPrice: 0, sellingPrice: 0, stock: 0, warehouse: db.activeWarehouse });
  const [coaForm, setCoaForm] = useState({ code: '', name: '', category: 'Asset' as any, normalBalance: 'Debit' as any });

  const [formError, setFormError] = useState('');

  // Reset all forms
  const resetForms = () => {
    setCustForm({ name: '', address: '', phone: '', email: '' });
    setSuppForm({ name: '', address: '', phone: '', email: '' });
    setProdForm({ sku: '', name: '', category: '', unit: 'Pcs', costPrice: 0, sellingPrice: 0, stock: 0, warehouse: db.activeWarehouse });
    setCoaForm({ code: '', name: '', category: 'Asset', normalBalance: 'Debit' });
    setFormError('');
    setEditingItem(null);
  };

  const handleOpenModal = () => {
    resetForms();
    setIsModalOpen(true);
  };

  const handleStartEdit = (type: SubTab, item: any) => {
    setEditingItem({ type, id: item.id });
    if (type === 'customers') {
      setCustForm({ name: item.name, address: item.address || '', phone: item.phone || '', email: item.email || '' });
    } else if (type === 'suppliers') {
      setSuppForm({ name: item.name, address: item.address || '', phone: item.phone || '', email: item.email || '' });
    } else if (type === 'products') {
      setProdForm({ sku: item.sku, name: item.name, category: item.category || '', unit: item.unit || 'Pcs', costPrice: item.costPrice || 0, sellingPrice: item.sellingPrice || 0, stock: item.stock || 0, warehouse: item.warehouse || db.activeWarehouse });
    } else if (type === 'coa') {
      setCoaForm({ code: item.code, name: item.name, category: item.category, normalBalance: item.normalBalance });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const executeDelete = () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    let updated = { ...db };

    if (type === 'customers') {
      updated.customers = db.customers.filter(c => c.id !== id);
    } else if (type === 'suppliers') {
      updated.suppliers = db.suppliers.filter(s => s.id !== id);
    } else if (type === 'products') {
      updated.products = db.products.filter(p => p.id !== id);
    } else if (type === 'coa') {
      updated.coa = db.coa.filter(c => c.id !== id);
    }

    onUpdateDb(updated);
    saveDatabase(updated);
    setItemToDelete(null);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name) {
      setFormError('Nama Customer harus diisi.');
      return;
    }

    if (editingItem && editingItem.type === 'customers') {
      const updatedCustomers = db.customers.map(c => 
        c.id === editingItem.id ? { ...c, name: custForm.name, address: custForm.address, phone: custForm.phone, email: custForm.email } : c
      );
      const updated = { ...db, customers: updatedCustomers };
      onUpdateDb(updated);
      saveDatabase(updated);
      setEditingItem(null);
      setIsModalOpen(false);
      return;
    }

    const code = `CUST-${String(db.customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      id: generateId(),
      code,
      name: custForm.name,
      address: custForm.address,
      phone: custForm.phone,
      email: custForm.email,
      balance: 0
    };

    const updated = { ...db, customers: [...db.customers, newCust] };
    onUpdateDb(updated);
    saveDatabase(updated);
    setIsModalOpen(false);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppForm.name) {
      setFormError('Nama Supplier harus diisi.');
      return;
    }

    if (editingItem && editingItem.type === 'suppliers') {
      const updatedSuppliers = db.suppliers.map(s => 
        s.id === editingItem.id ? { ...s, name: suppForm.name, address: suppForm.address, phone: suppForm.phone, email: suppForm.email } : s
      );
      const updated = { ...db, suppliers: updatedSuppliers };
      onUpdateDb(updated);
      saveDatabase(updated);
      setEditingItem(null);
      setIsModalOpen(false);
      return;
    }

    const code = `SPL-${String(db.suppliers.length + 1).padStart(3, '0')}`;
    const newSupp: Supplier = {
      id: generateId(),
      code,
      name: suppForm.name,
      address: suppForm.address,
      phone: suppForm.phone,
      email: suppForm.email,
      balance: 0
    };

    const updated = { ...db, suppliers: [...db.suppliers, newSupp] };
    onUpdateDb(updated);
    saveDatabase(updated);
    setIsModalOpen(false);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.sku) {
      setFormError('SKU dan Nama Produk harus diisi.');
      return;
    }

    if (editingItem && editingItem.type === 'products') {
      if (db.products.some(p => p.sku.toLowerCase() === prodForm.sku.toLowerCase() && p.id !== editingItem.id)) {
        setFormError('SKU produk sudah terdaftar.');
        return;
      }
      const updatedProducts = db.products.map(p => 
        p.id === editingItem.id ? { 
          ...p, 
          sku: prodForm.sku, 
          name: prodForm.name, 
          category: prodForm.category || 'Lain-lain', 
          unit: prodForm.unit, 
          costPrice: Number(prodForm.costPrice), 
          sellingPrice: Number(prodForm.sellingPrice), 
          stock: Number(prodForm.stock), 
          warehouse: prodForm.warehouse 
        } : p
      );
      const updated = { ...db, products: updatedProducts };
      onUpdateDb(updated);
      saveDatabase(updated);
      setEditingItem(null);
      setIsModalOpen(false);
      return;
    }

    // Check duplicate SKU
    if (db.products.some(p => p.sku.toLowerCase() === prodForm.sku.toLowerCase())) {
      setFormError('SKU produk sudah terdaftar.');
      return;
    }

    const newProduct: Product = {
      id: generateId(),
      sku: prodForm.sku,
      name: prodForm.name,
      category: prodForm.category || 'Lain-lain',
      unit: prodForm.unit,
      costPrice: Number(prodForm.costPrice),
      sellingPrice: Number(prodForm.sellingPrice),
      stock: Number(prodForm.stock),
      warehouse: prodForm.warehouse
    };

    const updated = { ...db, products: [...db.products, newProduct] };
    onUpdateDb(updated);
    saveDatabase(updated);
    setIsModalOpen(false);
  };

  const handleAddCOA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coaForm.code || !coaForm.name) {
      setFormError('Kode dan Nama Akun COA harus diisi.');
      return;
    }

    if (editingItem && editingItem.type === 'coa') {
      if (db.coa.some(c => c.code === coaForm.code && c.id !== editingItem.id)) {
        setFormError('Kode akun COA sudah terdaftar.');
        return;
      }
      const updatedCOA = db.coa.map(c => 
        c.id === editingItem.id ? { 
          ...c, 
          code: coaForm.code, 
          name: coaForm.name, 
          category: coaForm.category, 
          normalBalance: coaForm.normalBalance 
        } : c
      );
      const updated = { ...db, coa: updatedCOA.sort((a, b) => a.code.localeCompare(b.code)) };
      onUpdateDb(updated);
      saveDatabase(updated);
      setEditingItem(null);
      setIsModalOpen(false);
      return;
    }

    // Check duplicate Code
    if (db.coa.some(c => c.code === coaForm.code)) {
      setFormError('Kode akun COA sudah terdaftar.');
      return;
    }

    const newCOA: COAAccount = {
      id: coaForm.code,
      code: coaForm.code,
      name: coaForm.name,
      category: coaForm.category,
      type: 'Detail',
      normalBalance: coaForm.normalBalance,
      balance: 0
    };

    const updated = { ...db, coa: [...db.coa, newCOA].sort((a, b) => a.code.localeCompare(b.code)) };
    onUpdateDb(updated);
    saveDatabase(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/[0.06] pb-4 gap-4">
        <div className="flex space-x-2 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.06]/60 shadow-sm">
          {[
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'suppliers', label: 'Suppliers', icon: Truck },
            { id: 'products', label: 'Produk (Stok)', icon: Package },
            { id: 'coa', label: 'COA (Akun)', icon: Calculator },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                id={`sub-tab-${item.id}`}
                onClick={() => {
                  setActiveSubTab(item.id as any);
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-white text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.02]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search and Add Buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-master"
              type="text"
              placeholder={`Cari ${activeSubTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white shadow-sm w-full sm:w-48"
            />
          </div>
          <button
            id="btn-add-master"
            onClick={handleOpenModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 rounded-lg shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Tabular Content Renderers */}
      <div className="bg-white border border-white/[0.06] rounded-xl shadow-sm overflow-hidden">
        {activeSubTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.06] text-xs font-bold text-zinc-500">
                  <th className="px-6 py-3.5">Kode</th>
                  <th className="px-6 py-3.5">Nama Customer</th>
                  <th className="px-6 py-3.5">Telepon</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Alamat</th>
                  <th className="px-6 py-3.5 text-right">Saldo Piutang</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs text-zinc-300 font-medium">
                {db.customers
                  .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((cust) => (
                    <tr key={cust.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-100">{cust.code}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-200">{cust.name}</td>
                      <td className="px-6 py-4">{cust.phone || '-'}</td>
                      <td className="px-6 py-4 text-zinc-500">{cust.email || '-'}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{cust.address || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {formatCurrency(cust.balance, db.activeCurrency)}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit('customers', cust)}
                          className="px-2.5 py-1 text-[10px] font-bold text-zinc-300 bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.06] rounded-md shadow-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'customers', id: cust.id, name: cust.name })}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md shadow-sm transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.06] text-xs font-bold text-zinc-500">
                  <th className="px-6 py-3.5">Kode</th>
                  <th className="px-6 py-3.5">Nama Supplier</th>
                  <th className="px-6 py-3.5">Telepon</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Alamat</th>
                  <th className="px-6 py-3.5 text-right">Saldo Hutang</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs text-zinc-300 font-medium">
                {db.suppliers
                  .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((supp) => (
                    <tr key={supp.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-100">{supp.code}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-200">{supp.name}</td>
                      <td className="px-6 py-4">{supp.phone || '-'}</td>
                      <td className="px-6 py-4 text-zinc-500">{supp.email || '-'}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{supp.address || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">
                        {formatCurrency(supp.balance, db.activeCurrency)}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit('suppliers', supp)}
                          className="px-2.5 py-1 text-[10px] font-bold text-zinc-300 bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.06] rounded-md shadow-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'suppliers', id: supp.id, name: supp.name })}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md shadow-sm transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.06] text-xs font-bold text-zinc-500">
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Nama Produk</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5 text-right">Harga Pokok (Avg)</th>
                  <th className="px-6 py-3.5 text-right">Harga Jual</th>
                  <th className="px-6 py-3.5 text-center">Stok</th>
                  <th className="px-6 py-3.5">Gudang</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs text-zinc-300 font-medium">
                {db.products
                  .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-100">{p.sku}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-200">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-white/[0.03] text-zinc-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(p.costPrice, db.activeCurrency)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {formatCurrency(p.sellingPrice, db.activeCurrency)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.stock < 10 ? 'bg-rose-100 text-rose-800' : 'bg-white/[0.03] text-zinc-200'}`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-500">{p.warehouse}</td>
                      <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit('products', p)}
                          className="px-2.5 py-1 text-[10px] font-bold text-zinc-300 bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.06] rounded-md shadow-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'products', id: p.id, name: p.name })}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md shadow-sm transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'coa' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.06] text-xs font-bold text-zinc-500">
                  <th className="px-6 py-3.5">Kode Akun</th>
                  <th className="px-6 py-3.5">Nama Rekening COA</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Saldo Normal</th>
                  <th className="px-6 py-3.5 text-right">Saldo Saat Ini</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs text-zinc-300 font-medium">
                {db.coa
                  .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.includes(searchQuery))
                  .map((acc) => {
                    const isDebit = acc.normalBalance === 'Debit';
                    return (
                      <tr key={acc.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-bold text-zinc-100">{acc.code}</td>
                        <td className="px-6 py-4 font-semibold text-zinc-200 pl-4">{acc.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            acc.category === 'Asset' ? 'bg-blue-50 text-blue-800' :
                            acc.category === 'Liability' ? 'bg-rose-50 text-rose-800' :
                            acc.category === 'Equity' ? 'bg-purple-50 text-purple-800' :
                            acc.category === 'Revenue' ? 'bg-emerald-50 text-emerald-800' :
                            'bg-amber-50 text-amber-800'
                          }`}>
                            {acc.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 font-semibold">{acc.normalBalance}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-zinc-100">
                          {formatCurrency(acc.balance, db.activeCurrency)}
                        </td>
                        <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleStartEdit('coa', acc)}
                            className="px-2.5 py-1 text-[10px] font-bold text-zinc-300 bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.06] rounded-md shadow-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setItemToDelete({ type: 'coa', id: acc.id, name: acc.name })}
                            className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md shadow-sm transition-colors"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over / Modal for Adding Record */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-white/[0.06] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                {editingItem ? 'Edit' : 'Tambah'} {activeSubTab === 'coa' ? 'COA Account' : activeSubTab.slice(0, -1)} {editingItem ? '' : 'Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/[0.06]/60 rounded-lg">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={
              activeSubTab === 'customers' ? handleAddCustomer :
              activeSubTab === 'suppliers' ? handleAddSupplier :
              activeSubTab === 'products' ? handleAddProduct :
              handleAddCOA
            } className="p-6 space-y-4 flex-1">
              
              {formError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-bold">
                  {formError}
                </p>
              )}

              {/* Customer Form fields */}
              {activeSubTab === 'customers' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nama Customer *</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={custForm.name}
                      onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                      placeholder="e.g. PT Jaya Sentosa"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Telepon</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={custForm.phone}
                      onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                      placeholder="e.g. 021-555432"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={custForm.email}
                      onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                      placeholder="e.g. customer@domain.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Alamat</label>
                    <textarea
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={custForm.address}
                      onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                      rows={3}
                      placeholder="e.g. Jl. Raya Kemang No. 12"
                    />
                  </div>
                </div>
              )}

              {/* Supplier Form fields */}
              {activeSubTab === 'suppliers' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nama Supplier *</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={suppForm.name}
                      onChange={(e) => setSuppForm({ ...suppForm, name: e.target.value })}
                      placeholder="e.g. CV Makmur Distribusi"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Telepon</label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={suppForm.phone}
                      onChange={(e) => setSuppForm({ ...suppForm, phone: e.target.value })}
                      placeholder="e.g. 021-999888"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={suppForm.email}
                      onChange={(e) => setSuppForm({ ...suppForm, email: e.target.value })}
                      placeholder="e.g. supplier@domain.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Alamat</label>
                    <textarea
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={suppForm.address}
                      onChange={(e) => setSuppForm({ ...suppForm, address: e.target.value })}
                      rows={3}
                      placeholder="e.g. Komplek Industri Pulogadung Blok F"
                    />
                  </div>
                </div>
              )}

              {/* Product Form fields */}
              {activeSubTab === 'products' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">SKU Code *</label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-bold"
                        value={prodForm.sku}
                        onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                        placeholder="e.g. PRD-005"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nama Produk *</label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={prodForm.name}
                        onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                        placeholder="e.g. Macbook Air M3"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Kategori</label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={prodForm.category}
                        onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                        placeholder="e.g. Laptop"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Satuan</label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={prodForm.unit}
                        onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                        placeholder="Pcs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Harga Pokok (Rp)</label>
                      <input
                        type="number"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={prodForm.costPrice}
                        onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Harga Jual (Rp)</label>
                      <input
                        type="number"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={prodForm.sellingPrice}
                        onChange={(e) => setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Stok Awal</label>
                      <input
                        type="number"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={prodForm.stock}
                        onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Lokasi Gudang</label>
                    <select
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      value={prodForm.warehouse}
                      onChange={(e) => setProdForm({ ...prodForm, warehouse: e.target.value })}
                    >
                      <option value="Gudang Utama">Gudang Utama</option>
                      <option value="Gudang Transit">Gudang Transit</option>
                      <option value="Gudang Ritel">Gudang Ritel</option>
                    </select>
                  </div>
                </div>
              )}

              {/* COA Form fields */}
              {activeSubTab === 'coa' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Kode Rekening *</label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-bold"
                        value={coaForm.code}
                        onChange={(e) => setCoaForm({ ...coaForm, code: e.target.value })}
                        placeholder="e.g. 6500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nama Rekening COA *</label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={coaForm.name}
                        onChange={(e) => setCoaForm({ ...coaForm, name: e.target.value })}
                        placeholder="e.g. Beban Promosi & Iklan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Kategori Laporan</label>
                      <select
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={coaForm.category}
                        onChange={(e) => setCoaForm({ ...coaForm, category: e.target.value as any })}
                      >
                        <option value="Asset">Asset</option>
                        <option value="Liability">Liability</option>
                        <option value="Equity">Equity</option>
                        <option value="Revenue">Revenue</option>
                        <option value="Expense">Expense</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Saldo Normal</label>
                      <select
                        className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                        value={coaForm.normalBalance}
                        onChange={(e) => setCoaForm({ ...coaForm, normalBalance: e.target.value as any })}
                      >
                        <option value="Debit">Debit</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/[0.04] flex items-center justify-end space-x-3 bg-white/[0.02] -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 rounded-lg shadow"
                >
                  Simpan Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-white/[0.06] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Konfirmasi Hapus
              </h3>
              <button onClick={() => setItemToDelete(null)} className="p-1 hover:bg-white/[0.06]/60 rounded-lg">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="p-6 text-xs text-zinc-400 space-y-3">
              <p>Apakah Anda yakin ingin menghapus data berikut?</p>
              <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04] font-bold text-zinc-100">
                {itemToDelete.name}
              </div>
              <p className="text-[10px] text-zinc-500">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-end space-x-3 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
