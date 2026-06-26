/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ERPDatabase, addPurchaseInvoice, paySupplierInvoice, PurchaseInvoice, saveDatabase } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { DatePicker } from './DatePicker';
import { 
  FileText, Plus, Receipt, CircleDollarSign, Calendar, Eye, 
  Trash2, X, CheckCircle, AlertTriangle
} from 'lucide-react';

interface PurchaseTabProps {
  db: ERPDatabase;
  onUpdateDb: (db: ERPDatabase) => void;
}

export const PurchaseTab: React.FC<PurchaseTabProps> = ({ db, onUpdateDb }) => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(db.purchaseInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const executeDeleteInvoice = () => {
    if (!invoiceToDelete) return;
    const updatedInvoices = db.purchaseInvoices.filter(inv => inv.id !== invoiceToDelete);
    const updated = { ...db, purchaseInvoices: updatedInvoices };
    onUpdateDb(updated);
    saveDatabase(updated);
    setInvoiceToDelete(null);
    if (selectedInvoice?.id === invoiceToDelete) {
      setSelectedInvoice(null);
    }
  };

  // Modal controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);

  // Form states
  const [supplierId, setSupplierId] = useState(db.suppliers[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CREDIT');
  const [lineItems, setLineItems] = useState<{ productId: string; qty: number; price: number }[]>([
    { productId: db.products[0]?.id || '', qty: 1, price: db.products[0]?.costPrice || 0 }
  ]);
  const [taxRate, setTaxRate] = useState<number>(0); // Default to Non-PPN (0%) for CV. TB
  const [invoiceError, setInvoiceError] = useState('');

  // Repayment form states
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payBankCoa, setPayBankCoa] = useState('1200'); // Default Bank Kalbar / Mandiri
  const [payError, setPayError] = useState('');

  // Sync state
  React.useEffect(() => {
    setInvoices(db.purchaseInvoices);
  }, [db.purchaseInvoices]);

  const handleProductChange = (index: number, productId: string) => {
    const product = db.products.find(p => p.id === productId);
    const updated = [...lineItems];
    updated[index] = {
      productId,
      qty: 1,
      price: product ? product.costPrice : 0
    };
    setLineItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...lineItems];
    updated[index].qty = Math.max(1, qty);
    setLineItems(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...lineItems];
    updated[index].price = Math.max(0, price);
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: db.products[0]?.id || '', qty: 1, price: db.products[0]?.costPrice || 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Compute live drafts totals
  const draftSubtotal = lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const draftTax = Math.round(draftSubtotal * taxRate);
  const draftTotal = draftSubtotal + draftTax;

  const handlePostInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError('');

    if (!supplierId) {
      setInvoiceError('Silakan pilih supplier.');
      return;
    }

    const result = addPurchaseInvoice(db, supplierId, invoiceDate, lineItems, paymentMethod, taxRate);
    if (result.success && result.db) {
      onUpdateDb(result.db);
      setIsCreateOpen(false);
      // Reset
      setLineItems([{ productId: db.products[0]?.id || '', qty: 1, price: db.products[0]?.costPrice || 0 }]);
      setTaxRate(0); // reset to default 0%
    } else {
      setInvoiceError(result.error || 'Gagal membuat purchase invoice.');
    }
  };

  const handleOpenPayModal = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setPayAmount(invoice.total - invoice.amountPaid);
    setPayError('');
    const availableCoas = db.coa.filter(acc => acc.category === 'Asset' && (acc.code.startsWith('11') || acc.code.startsWith('12')));
    if (availableCoas.length > 0) {
      setPayBankCoa(availableCoas[0].id);
    } else {
      setPayBankCoa('1200');
    }
    setIsPayOpen(true);
  };

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    if (!selectedInvoice) return;

    const result = paySupplierInvoice(db, selectedInvoice.id, payAmount, payBankCoa, payDate);
    if (result.success && result.db) {
      onUpdateDb(result.db);
      setIsPayOpen(false);
      setSelectedInvoice(null);
    } else {
      setPayError(result.error || 'Gagal memproses pembayaran hutang.');
    }
  };

  const getSupplierName = (id: string) => {
    return db.suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';
  };

  const getProductName = (id: string) => {
    return db.products.find(p => p.id === id)?.name || 'Unknown Product';
  };

  // Get corresponding journal for selected invoice
  const selectedJournal = selectedInvoice 
    ? db.journals.find(j => j.sourceId === selectedInvoice.id)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-100">Modul Pembelian & Hutang</h2>
          <p className="text-xs text-zinc-500 font-medium font-semibold">Buat invoice pembelian, tambahkan stok, dan catat hutang supplier secara otomatis</p>
        </div>
        <button
          id="btn-new-purchase-invoice"
          onClick={() => {
            setInvoiceError('');
            setIsCreateOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-black/80 backdrop-blur-sm hover:bg-slate-900 rounded-lg shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Beli Barang</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* List Table */}
        <div className="lg:col-span-2 bg-white border border-white/[0.06] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.03]">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Daftar Purchase Invoice</h3>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/[0.06] text-xs font-bold text-zinc-500">
                  <th className="px-5 py-3">No. Invoice</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Pembayaran</th>
                  <th className="px-5 py-3 text-right">Total Tagihan</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs text-zinc-300 font-semibold">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-zinc-500 font-medium">Belum ada invoice pembelian.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr 
                      key={inv.id} 
                      className={`hover:bg-white/[0.01] cursor-pointer transition-all duration-200 ${
                        selectedInvoice?.id === inv.id ? 'bg-white/[0.03] border-l-4 border-l-slate-900' : ''
                      }`}
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="px-5 py-4 font-bold text-slate-950">{inv.invoiceNo}</td>
                      <td className="px-5 py-4 text-zinc-500">{inv.date}</td>
                      <td className="px-5 py-4 text-zinc-200">{getSupplierName(inv.supplierId)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${inv.paymentMethod === 'CASH' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'}`}>
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-extrabold text-zinc-100">
                        {formatCurrency(inv.total, db.activeCurrency)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1 hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-100 rounded-lg inline-flex items-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status === 'Unpaid' && (
                          <button
                            onClick={() => handleOpenPayModal(inv)}
                            className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md shadow-sm transition-all duration-200"
                          >
                            Bayar Hutang
                          </button>
                        )}
                        <button
                          onClick={() => setInvoiceToDelete(inv.id)}
                          className="p-1 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Audit Panel */}
        <div className="bg-white border border-white/[0.06] rounded-xl shadow-sm p-6 flex flex-col space-y-6">
          {selectedInvoice ? (
            <>
              {/* PDF Mock Receipt */}
              <div className="border border-white/[0.06] rounded-lg p-5 space-y-4 shadow-sm bg-white/[0.02]/20">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Faktur Pembelian</h4>
                    <p className="text-[10px] font-bold text-zinc-500 mt-0.5">{selectedInvoice.invoiceNo}</p>
                  </div>
                  <Receipt className="w-5 h-5 text-zinc-500" />
                </div>

                <div className="text-[11px] grid grid-cols-2 gap-y-1.5 text-zinc-400 font-semibold">
                  <span>Supplier:</span>
                  <span className="text-zinc-100 font-bold text-right">{getSupplierName(selectedInvoice.supplierId)}</span>
                  <span>Tanggal:</span>
                  <span className="text-zinc-100 text-right">{selectedInvoice.date}</span>
                  <span>Pembayaran:</span>
                  <span className="text-zinc-100 text-right font-bold">{selectedInvoice.paymentMethod}</span>
                  <span>Status:</span>
                  <span className="text-right">
                    <span className={`px-1.5 py-0.5 rounded font-extrabold ${selectedInvoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {selectedInvoice.status}
                    </span>
                  </span>
                </div>

                <div className="border-t border-b border-white/[0.04] py-2.5 my-1.5 space-y-2">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] font-medium text-zinc-300">
                      <div className="max-w-[140px] truncate">
                        <span className="font-bold text-zinc-100">{getProductName(item.productId)}</span>
                        <p className="text-[10px] text-zinc-500 font-semibold">{item.qty} Pcs @ {formatCurrency(item.price, db.activeCurrency)}</p>
                      </div>
                      <span className="font-bold text-zinc-100">{formatCurrency(item.subtotal, db.activeCurrency)}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] space-y-1 text-zinc-400 font-semibold">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-zinc-100">{formatCurrency(selectedInvoice.subtotal, db.activeCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPN Masukkan:</span>
                    <span className="text-zinc-100">{formatCurrency(selectedInvoice.tax, db.activeCurrency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.04] pt-1.5 text-xs font-bold text-zinc-100">
                    <span>Total Tagihan:</span>
                    <span className="text-slate-950 font-extrabold">{formatCurrency(selectedInvoice.total, db.activeCurrency)}</span>
                  </div>
                  {selectedInvoice.amountPaid > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Sudah Dibayar:</span>
                      <span>{formatCurrency(selectedInvoice.amountPaid, db.activeCurrency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Journal Display */}
              {selectedJournal && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center">
                    <CheckCircle className="w-4 h-4 text-indigo-600 mr-1.5" />
                    Double-Entry Journal Postings (Otomatis)
                  </h4>
                  <div className="border border-white/[0.04] rounded-lg overflow-hidden shadow-sm bg-white/[0.02]/10">
                    <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold">
                      <span>No Jurnal: {selectedJournal.journalNo}</span>
                      <span>{selectedJournal.date}</span>
                    </div>
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-white/[0.03] text-zinc-400 border-b border-white/[0.06] font-bold">
                          <th className="px-3 py-1.5">Kode / Akun</th>
                          <th className="px-3 py-1.5 text-right">Debit</th>
                          <th className="px-3 py-1.5 text-right">Kredit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-zinc-300 font-semibold">
                        {selectedJournal.details.map((detail, idx) => {
                          const acc = db.coa.find(a => a.id === detail.coaId);
                          return (
                            <tr key={idx}>
                              <td className={`px-3 py-2 ${detail.credit > 0 ? 'pl-6 text-zinc-500' : 'text-zinc-100 font-bold'}`}>
                                <span className="font-mono text-zinc-500 mr-1">[{acc?.code}]</span>
                                {acc?.name}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-zinc-200">
                                {detail.debit > 0 ? formatCurrency(detail.debit, db.activeCurrency) : '-'}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-zinc-200">
                                {detail.credit > 0 ? formatCurrency(detail.credit, db.activeCurrency) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
              <FileText className="w-8 h-8 text-zinc-600" />
              <p className="text-xs text-zinc-500 font-medium">Pilih invoice untuk melihat rincian serta posting jurnal ledger otomatis.</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Creator Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-white/[0.06] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">Faktur Pembelian Baru</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 hover:bg-white/[0.06]/60 rounded-lg">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handlePostInvoice} className="p-6 space-y-4 overflow-y-auto flex-1">
              {invoiceError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-bold">
                  {invoiceError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Supplier *</label>
                  <select
                    className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">Pilih Supplier</option>
                    {db.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tanggal Transaksi</label>
                  <DatePicker
                    value={invoiceDate}
                    onChange={(val) => setInvoiceDate(val)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Metode Pembayaran</label>
                  <select
                    className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  >
                    <option value="CREDIT">Kredit (Hutang 30 Hari)</option>
                    <option value="CASH">Tunai (Kas & Bank)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Pajak (PPN)</label>
                  <select
                    className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white font-bold"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                  >
                    <option value="0">Non-PPN (0%)</option>
                    <option value="0.12">PPN (12%)</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 border-t border-white/[0.04] pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Rincian Barang</h4>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-[10px] font-bold text-zinc-100 bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1.5 rounded"
                  >
                    + Tambah Baris
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center border border-white/[0.04] p-3 rounded-lg bg-white/[0.01]">
                      <div className="col-span-5">
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-0.5">Produk</label>
                        <select
                          className="w-full text-xs px-2.5 py-1.5 border border-white/[0.06] rounded focus:outline-none bg-white"
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                        >
                          {db.products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stok saat ini: {p.stock})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full text-xs px-2.5 py-1.5 border border-white/[0.06] rounded focus:outline-none text-center font-bold"
                          value={item.qty}
                          onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-0.5">Harga Beli Satuan (Rp)</label>
                        <input
                          type="number"
                          className="w-full text-xs px-2.5 py-1.5 border border-white/[0.06] rounded focus:outline-none font-bold text-right"
                          value={item.price}
                          onChange={(e) => handlePriceChange(index, Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end space-x-2 pt-4">
                        <span className="text-[11px] font-bold text-zinc-300">
                          {formatCurrency(item.qty * item.price, db.activeCurrency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                          className="p-1 hover:bg-rose-50 text-zinc-500 hover:text-rose-600 rounded disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-white/[0.04] pt-4 flex flex-col items-end text-xs font-semibold text-zinc-400 space-y-1">
                <div className="flex justify-between w-48">
                  <span>Subtotal:</span>
                  <span className="text-zinc-100">{formatCurrency(draftSubtotal, db.activeCurrency)}</span>
                </div>
                <div className="flex justify-between w-48">
                  <span>PPN Masukkan:</span>
                  <span className="text-zinc-100">{formatCurrency(draftTax, db.activeCurrency)}</span>
                </div>
                <div className="flex justify-between w-48 border-t border-white/[0.04] pt-1.5 font-bold text-slate-950 text-sm">
                  <span>Grand Total:</span>
                  <span className="font-extrabold">{formatCurrency(draftTotal, db.activeCurrency)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04] flex items-center justify-end space-x-3 bg-white/[0.02] -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-black/80 backdrop-blur-sm hover:bg-slate-900 rounded-lg shadow"
                >
                  Post Jurnal & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {isPayOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-white/[0.06] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">Pembayaran Hutang Supplier</h3>
              <button onClick={() => setIsPayOpen(false)} className="p-1 hover:bg-white/[0.06]/60 rounded-lg">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handlePostPayment} className="p-6 space-y-4">
              {payError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-bold">
                  {payError}
                </div>
              )}

              <div className="bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-lg text-xs space-y-1.5 text-zinc-400 font-semibold">
                <div className="flex justify-between">
                  <span>Invoice No:</span>
                  <span className="text-slate-950 font-bold">{selectedInvoice.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supplier:</span>
                  <span className="text-slate-950 font-bold">{getSupplierName(selectedInvoice.supplierId)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa Hutang:</span>
                  <span className="text-rose-600 font-extrabold">{formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid, db.activeCurrency)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Bayar Menggunakan (Kas/Bank) *</label>
                <select
                  className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                  value={payBankCoa}
                  onChange={(e) => setPayBankCoa(e.target.value)}
                >
                  {db.coa
                    .filter(acc => acc.category === 'Asset' && (acc.code.startsWith('11') || acc.code.startsWith('12')))
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tanggal Bayar</label>
                <DatePicker
                  value={payDate}
                  onChange={(val) => setPayDate(val)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Jumlah Bayar (Rp) *</label>
                <input
                  type="number"
                  className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-bold"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  max={selectedInvoice.total - selectedInvoice.amountPaid}
                />
              </div>

              <div className="pt-4 border-t border-white/[0.04] flex items-center justify-end space-x-3 bg-white/[0.02] -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsPayOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-black/80 backdrop-blur-sm hover:bg-slate-900 rounded-lg shadow"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {invoiceToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-white/[0.06] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Konfirmasi Hapus Invoice
              </h3>
              <button onClick={() => setInvoiceToDelete(null)} className="p-1 hover:bg-white/[0.06]/60 rounded-lg">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="p-6 text-xs text-zinc-400 space-y-3">
              <p>Apakah Anda yakin ingin menghapus invoice pembelian ini?</p>
              <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04] font-bold text-zinc-100">
                {invoices.find(inv => inv.id === invoiceToDelete)?.invoiceNo || 'Invoice'}
              </div>
              <p className="text-[10px] text-zinc-500">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-end space-x-3 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteInvoice}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-500/20 rounded-lg shadow"
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
