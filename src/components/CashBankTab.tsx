/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ERPDatabase, addCashTransaction, CashTransaction, saveDatabase } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { DatePicker } from './DatePicker';
import { Landmark, ArrowUpRight, ArrowDownLeft, RefreshCw, Plus, X, Calendar, FileText, Trash2 } from 'lucide-react';

interface CashBankTabProps {
  db: ERPDatabase;
  onUpdateDb: (db: ERPDatabase) => void;
}

type ModalType = 'In' | 'Out' | 'Transfer' | null;

export const CashBankTab: React.FC<CashBankTabProps> = ({ db, onUpdateDb }) => {
  const [transactions, setTransactions] = useState<CashTransaction[]>(db.cashTransactions);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  const executeDeleteTransaction = () => {
    if (!txToDelete) return;
    const updatedTransactions = db.cashTransactions.filter(tx => tx.id !== txToDelete);
    const updated = { ...db, cashTransactions: updatedTransactions };
    onUpdateDb(updated);
    saveDatabase(updated);
    setTxToDelete(null);
  };

  // Form states
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [fromCoaId, setFromCoaId] = useState('1100');
  const [toCoaId, setToCoaId] = useState('1200');
  const [error, setError] = useState('');

  React.useEffect(() => {
    setTransactions(db.cashTransactions);
  }, [db.cashTransactions]);

  const handleOpenModal = (type: ModalType) => {
    setModalType(type);
    setError('');
    setAmount(0);
    setDescription('');
    setTxDate(new Date().toISOString().split('T')[0]);

    const cashBankAccounts = db.coa.filter(
      acc => acc.category === 'Asset' && (acc.code.startsWith('11') || acc.code.startsWith('12'))
    );
    const expenseAccounts = db.coa.filter(acc => acc.category === 'Expense');
    const cashInSources = db.coa.filter(
      acc => acc.category === 'Equity' || acc.category === 'Revenue' || acc.category === 'Liability'
    );

    if (type === 'In') {
      setFromCoaId(cashInSources[0]?.id || '3100');
      setToCoaId(cashBankAccounts[0]?.id || '1100');
    } else if (type === 'Out') {
      setFromCoaId(cashBankAccounts[0]?.id || '1100');
      setToCoaId(expenseAccounts[0]?.id || '6200');
    } else {
      setFromCoaId(cashBankAccounts[0]?.id || '1100');
      setToCoaId(cashBankAccounts[1]?.id || cashBankAccounts[0]?.id || '1200');
    }
  };

  const handlePostTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amount <= 0) {
      setError('Jumlah transaksi harus lebih besar dari 0.');
      return;
    }
    if (!description) {
      setError('Deskripsi transaksi harus diisi.');
      return;
    }
    if (fromCoaId === toCoaId) {
      setError('Rekening sumber dan tujuan tidak boleh sama.');
      return;
    }

    if (!modalType) return;

    const result = addCashTransaction(db, modalType, fromCoaId, toCoaId, amount, description, txDate);
    if (result.success && result.db) {
      onUpdateDb(result.db);
      setModalType(null);
    } else {
      setError(result.error || 'Gagal memproses transaksi kas.');
    }
  };

  const getCoaName = (id: string) => {
    return db.coa.find(c => c.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      {/* KPI & Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-100">Kas & Perbankan (Treasury)</h2>
          <p className="text-xs text-zinc-500 font-medium">Rekonsiliasi mutasi kas harian, transfer dana antar-bank, dan catat beban operasional langsung</p>
        </div>

        {/* Treasury Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-cash-in"
            onClick={() => handleOpenModal('In')}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-sm transition-all duration-200"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kas Masuk</span>
          </button>
          <button
            id="btn-cash-out"
            onClick={() => handleOpenModal('Out')}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm transition-all duration-200"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
            <span>Kas Keluar</span>
          </button>
          <button
            id="btn-cash-transfer"
            onClick={() => handleOpenModal('Transfer')}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-zinc-200 bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.06] rounded-lg shadow-sm transition-all duration-200"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Transfer Bank</span>
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white border border-white/[0.06] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.03]">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Buku Transaksi Kas & Bank</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/[0.06] text-xs font-bold text-zinc-500">
                <th className="px-6 py-3.5">No Transaksi</th>
                <th className="px-6 py-3.5">Tanggal</th>
                <th className="px-6 py-3.5">Tipe</th>
                <th className="px-6 py-3.5">Dari Rekening</th>
                <th className="px-6 py-3.5">Ke Rekening</th>
                <th className="px-6 py-3.5">Keterangan</th>
                <th className="px-6 py-3.5 text-right">Jumlah Uang</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs text-zinc-300 font-semibold">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500 font-medium">
                    Belum ada transaksi kas & bank tercatat.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.01] transition-all duration-200">
                    <td className="px-6 py-4 font-bold text-zinc-100">{tx.transactionNo}</td>
                    <td className="px-6 py-4 text-zinc-500">{tx.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        tx.type === 'In' ? 'bg-emerald-100 text-emerald-800' :
                        tx.type === 'Out' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.type === 'In' ? 'Masuk' : tx.type === 'Out' ? 'Keluar' : 'Transfer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{getCoaName(tx.fromCoaId)}</td>
                    <td className="px-6 py-4 text-zinc-400">{getCoaName(tx.toCoaId)}</td>
                    <td className="px-6 py-4 text-zinc-200 font-medium max-w-xs truncate">{tx.description}</td>
                    <td className="px-6 py-4 text-right font-extrabold text-zinc-100">
                      {formatCurrency(tx.amount, db.activeCurrency)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setTxToDelete(tx.id)}
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

      {/* Action Dialog / Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-white/[0.06] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                Catat {modalType === 'In' ? 'Kas Masuk' : modalType === 'Out' ? 'Kas Keluar' : 'Transfer Bank'} Baru
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-white/[0.06]/60 rounded-lg">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handlePostTransaction} className="p-6 space-y-4">
              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tanggal</label>
                  <DatePicker
                    value={txDate}
                    onChange={(val) => setTxDate(val)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Jumlah Uang (Rp)</label>
                  <input
                    type="number"
                    className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 font-bold"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Rp 0"
                  />
                </div>
              </div>

              {/* Account Dropdowns depending on Type */}
              {modalType === 'In' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Sumber Pendapatan / Modal</label>
                    <select
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none bg-white font-bold"
                      value={fromCoaId}
                      onChange={(e) => setFromCoaId(e.target.value)}
                    >
                      {db.coa
                        .filter(acc => acc.category === 'Equity' || acc.category === 'Revenue' || acc.category === 'Liability')
                        .map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.code})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Terima ke Rekening</label>
                    <select
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none bg-white font-bold"
                      value={toCoaId}
                      onChange={(e) => setToCoaId(e.target.value)}
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
                </div>
              )}

              {modalType === 'Out' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Keluarkan dari Rekening</label>
                    <select
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none bg-white font-bold"
                      value={fromCoaId}
                      onChange={(e) => setFromCoaId(e.target.value)}
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
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Pos Beban / Pengeluaran</label>
                    <select
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none bg-white font-bold"
                      value={toCoaId}
                      onChange={(e) => setToCoaId(e.target.value)}
                    >
                      {db.coa
                        .filter(acc => acc.category === 'Expense')
                        .map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.code})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {modalType === 'Transfer' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Kirim dari Rekening</label>
                    <select
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none bg-white font-bold"
                      value={fromCoaId}
                      onChange={(e) => setFromCoaId(e.target.value)}
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
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Terima ke Rekening</label>
                    <select
                      className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none bg-white font-bold"
                      value={toCoaId}
                      onChange={(e) => setToCoaId(e.target.value)}
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
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Keterangan / Memo *</label>
                <textarea
                  className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Pembayaran tagihan internet kantor bulan Juni"
                />
              </div>

              <div className="pt-4 border-t border-white/[0.04] flex items-center justify-end space-x-3 bg-white/[0.02] -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-black/80 backdrop-blur-sm hover:bg-slate-900 rounded-lg shadow"
                >
                  Post Jurnal Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {txToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-white/[0.06] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Konfirmasi Hapus Transaksi
              </h3>
              <button onClick={() => setTxToDelete(null)} className="p-1 hover:bg-white/[0.06]/60 rounded-lg">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="p-6 text-xs text-zinc-400 space-y-3">
              <p>Apakah Anda yakin ingin menghapus transaksi kas ini?</p>
              <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04] font-bold text-zinc-100">
                {transactions.find(tx => tx.id === txToDelete)?.description || 'Transaksi'}
              </div>
              <p className="text-[10px] text-zinc-500">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-end space-x-3 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 border border-white/[0.06] bg-white rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteTransaction}
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
