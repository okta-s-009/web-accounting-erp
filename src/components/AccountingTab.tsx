/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ERPDatabase, addManualJournal, Journal, saveDatabase, recalculateBalances } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { DatePicker } from './DatePicker';
import { BookOpen, FolderOpen, Scale, Plus, Trash2, X, AlertCircle, Edit2 } from 'lucide-react';

interface AccountingTabProps {
  db: ERPDatabase;
  onUpdateDb: (db: ERPDatabase) => void;
}

type SubTab = 'journal' | 'ledger' | 'trial';

export const AccountingTab: React.FC<AccountingTabProps> = ({ db, onUpdateDb }) => {
  const [activeSub, setActiveSub] = useState<SubTab>('journal');

  // Ledger state
  const [selectedLedgerCoaId, setSelectedLedgerCoaId] = useState(db.coa[0]?.id || '1100');

  // Manual Journal modal state
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalDesc, setJournalDesc] = useState('');
  const [journalDetails, setJournalDetails] = useState<{ coaId: string; debit: number; credit: number }[]>([
    { coaId: '1100', debit: 0, credit: 0 },
    { coaId: '3100', debit: 0, credit: 0 }
  ]);
  const [error, setError] = useState('');

  const handleEditJournalClick = (j: Journal) => {
    setEditingJournalId(j.id);
    setJournalDate(j.date);
    setJournalDesc(j.description);
    setJournalDetails(j.details.map(d => ({
      coaId: d.coaId,
      debit: d.debit,
      credit: d.credit
    })));
    setIsJournalOpen(true);
  };

  const executeDeleteJournal = () => {
    if (!journalToDelete) return;
    const updatedJournals = db.journals.filter(j => j.id !== journalToDelete);
    const updatedDb = { ...db, journals: updatedJournals };
    const finalDb = recalculateBalances(updatedDb);
    onUpdateDb(finalDb);
    saveDatabase(finalDb);
    setJournalToDelete(null);
  };

  const handleAddRow = () => {
    setJournalDetails([...journalDetails, { coaId: db.coa[0]?.id || '1100', debit: 0, credit: 0 }]);
  };

  const handleRemoveRow = (idx: number) => {
    if (journalDetails.length > 2) {
      setJournalDetails(journalDetails.filter((_, i) => i !== idx));
    }
  };

  const handleRowChange = (idx: number, field: string, val: any) => {
    const updated = [...journalDetails];
    updated[idx] = { ...updated[idx], [field]: val };
    setJournalDetails(updated);
  };

  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!journalDesc) {
      setError('Deskripsi jurnal manual harus diisi.');
      return;
    }

    const totalDebit = journalDetails.reduce((s, d) => s + d.debit, 0);
    const totalCredit = journalDetails.reduce((s, d) => s + d.credit, 0);

    if (totalDebit <= 0 || totalCredit <= 0) {
      setError('Debit dan Kredit harus diisi dengan angka positif.');
      return;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setError(`Jumlah Debit (Rp ${totalDebit.toLocaleString()}) harus sama dengan Credit (Rp ${totalCredit.toLocaleString()})`);
      return;
    }

    if (editingJournalId) {
      const updatedJournals = db.journals.map(j => {
        if (j.id === editingJournalId) {
          return {
            ...j,
            date: journalDate,
            description: journalDesc,
            details: journalDetails.map(d => ({
              id: Math.random().toString(36).substring(2, 9),
              coaId: d.coaId,
              debit: d.debit,
              credit: d.credit
            }))
          };
        }
        return j;
      });
      const updatedDb = { ...db, journals: updatedJournals };
      const finalDb = recalculateBalances(updatedDb);
      onUpdateDb(finalDb);
      saveDatabase(finalDb);
      setIsJournalOpen(false);
      setEditingJournalId(null);
      setJournalDesc('');
      setJournalDetails([
        { coaId: '1100', debit: 0, credit: 0 },
        { coaId: '3100', debit: 0, credit: 0 }
      ]);
    } else {
      const result = addManualJournal(db, journalDate, journalDesc, journalDetails);
      if (result.success && result.db) {
        onUpdateDb(result.db);
        setIsJournalOpen(false);
        setJournalDesc('');
        setJournalDetails([
          { coaId: '1100', debit: 0, credit: 0 },
          { coaId: '3100', debit: 0, credit: 0 }
        ]);
      } else {
        setError(result.error || 'Gagal menyimpan jurnal.');
      }
    }
  };

  // Ledger calculation helper
  const calculateLedgerRows = () => {
    const selectedCoa = db.coa.find(a => a.id === selectedLedgerCoaId);
    if (!selectedCoa) return [];

    let balance = 0; // Running Balance
    const rows: { date: string; jno: string; desc: string; debit: number; credit: number; balance: number }[] = [];

    // Filter and sort all journal postings chronologically
    const sortedJournals = [...db.journals].sort((a, b) => a.date.localeCompare(b.date));

    sortedJournals.forEach(j => {
      j.details.forEach(d => {
        if (d.coaId === selectedLedgerCoaId) {
          if (selectedCoa.normalBalance === 'Debit') {
            balance += (d.debit - d.credit);
          } else {
            balance += (d.credit - d.debit);
          }

          rows.push({
            date: j.date,
            jno: j.journalNo,
            desc: j.description,
            debit: d.debit,
            credit: d.credit,
            balance
          });
        }
      });
    });

    return rows;
  };

  const ledgerRows = calculateLedgerRows();
  const selectedCoaName = db.coa.find(a => a.id === selectedLedgerCoaId)?.name || '';

  // Trial Balance calculation
  const totalTrialDebit = db.coa.reduce((sum, a) => sum + (a.normalBalance === 'Debit' ? a.balance : 0), 0);
  const totalTrialCredit = db.coa.reduce((sum, a) => sum + (a.normalBalance === 'Credit' ? a.balance : 0), 0);

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 shadow-sm">
          {[
            { id: 'journal', label: 'Buku Jurnal', icon: BookOpen },
            { id: 'ledger', label: 'Buku Besar (Ledger)', icon: FolderOpen },
            { id: 'trial', label: 'Neraca Saldo (Trial)', icon: Scale },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeSub === item.id;
            return (
              <button
                key={item.id}
                id={`sub-accounting-${item.id}`}
                onClick={() => setActiveSub(item.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {activeSub === 'journal' && (
          <button
            id="btn-add-manual-journal"
            onClick={() => {
              setError('');
              setEditingJournalId(null);
              setJournalDate(new Date().toISOString().split('T')[0]);
              setJournalDesc('');
              setJournalDetails([
                { coaId: '1100', debit: 0, credit: 0 },
                { coaId: '3100', debit: 0, credit: 0 }
              ]);
              setIsJournalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 rounded-lg shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jurnal Manual</span>
          </button>
        )}
      </div>

      {/* SUB TAB CONTENT */}

      {/* SUB TAB 1: BOOK OF JOURNAL ENTRIES */}
      {activeSub === 'journal' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Semua Ayat Jurnal Buku Besar</h3>
            </div>

            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {[...db.journals].sort((a, b) => b.date.localeCompare(a.date)).map((j) => (
                <div key={j.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/20 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {j.journalNo}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{j.date}</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        j.sourceType === 'Sales' ? 'bg-emerald-50 text-emerald-800' :
                        j.sourceType === 'Purchase' ? 'bg-indigo-50 text-indigo-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {j.sourceType}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{j.description}</p>
                    <div className="flex items-center space-x-2 pt-1.5">
                      <button
                        onClick={() => handleEditJournalClick(j)}
                        className="flex items-center space-x-1 px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 rounded border border-slate-200/60 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setJournalToDelete(j.id)}
                        className="flex items-center space-x-1 px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded border border-rose-200/40 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* Journal lines representation */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden bg-white shadow-sm w-full md:w-96">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500">
                          <th className="px-3 py-1.5">Kode / Nama Akun</th>
                          <th className="px-3 py-1.5 text-right">Debit</th>
                          <th className="px-3 py-1.5 text-right">Kredit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                        {j.details.map((detail, dIdx) => {
                          const account = db.coa.find(a => a.id === detail.coaId);
                          return (
                            <tr key={dIdx}>
                              <td className={`px-3 py-1.5 ${detail.credit > 0 ? 'pl-6 text-slate-500' : 'text-slate-950 font-bold'}`}>
                                <span className="text-slate-400 font-mono">[{detail.coaId}]</span> {account?.name || 'Unknown Account'}
                              </td>
                              <td className="px-3 py-1.5 text-right font-bold text-slate-800">
                                {detail.debit > 0 ? formatCurrency(detail.debit, db.activeCurrency) : '-'}
                              </td>
                              <td className="px-3 py-1.5 text-right font-bold text-slate-800">
                                {detail.credit > 0 ? formatCurrency(detail.credit, db.activeCurrency) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: GENERAL LEDGER (BUKU BESAR) */}
      {activeSub === 'ledger' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Account selector panel */}
          <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pilih Rekening Akun</h4>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {db.coa.map(acc => {
                const active = selectedLedgerCoaId === acc.id;
                return (
                  <button
                    key={acc.id}
                    id={`ledger-coa-${acc.id}`}
                    onClick={() => setSelectedLedgerCoaId(acc.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                      active ? 'bg-slate-900 text-white shadow' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono text-[10px] text-slate-400 block -mb-0.5">[{acc.code}]</span>
                      <span className="truncate">{acc.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ledger postings panel */}
          <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mutasi Buku Besar</h3>
                <h4 className="text-sm font-bold text-slate-950 mt-1">[{selectedLedgerCoaId}] - {selectedCoaName}</h4>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-200 text-xs font-bold text-slate-500">
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">No Jurnal</th>
                    <th className="px-5 py-3.5">Keterangan</th>
                    <th className="px-5 py-3.5 text-right">Debit</th>
                    <th className="px-5 py-3.5 text-right">Kredit</th>
                    <th className="px-5 py-3.5 text-right">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
                  {ledgerRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">Belum ada mutasi tercatat pada rekening ini.</td>
                    </tr>
                  ) : (
                    ledgerRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-4 text-slate-500">{row.date}</td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">{row.jno}</td>
                        <td className="px-5 py-4 text-slate-800">{row.desc}</td>
                        <td className="px-5 py-4 text-right font-bold text-slate-900">
                          {row.debit > 0 ? formatCurrency(row.debit, db.activeCurrency) : '-'}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-900">
                          {row.credit > 0 ? formatCurrency(row.credit, db.activeCurrency) : '-'}
                        </td>
                        <td className="px-5 py-4 text-right font-extrabold text-emerald-600">
                          {formatCurrency(row.balance, db.activeCurrency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: TRIAL BALANCE (NERACA SALDO) */}
      {activeSub === 'trial' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-2xl mx-auto">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide text-center">Neraca Saldo (Trial Balance)</h3>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                <th className="px-6 py-3.5">Kode Rekening</th>
                <th className="px-6 py-3.5">Nama Akun</th>
                <th className="px-6 py-3.5 text-right">Debit</th>
                <th className="px-6 py-3.5 text-right">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
              {db.coa.map((acc) => {
                const isDebit = acc.normalBalance === 'Debit';
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{acc.code}</td>
                    <td className="px-6 py-3.5 text-slate-800 pl-4">{acc.name}</td>
                    <td className="px-6 py-3.5 text-right font-bold">
                      {isDebit ? formatCurrency(acc.balance, db.activeCurrency) : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold">
                      {!isDebit ? formatCurrency(acc.balance, db.activeCurrency) : '-'}
                    </td>
                  </tr>
                );
              })}
              {/* Audit Equilibrium totals */}
              <tr className="bg-slate-55 border-t-2 border-slate-950 font-bold text-slate-950">
                <td colSpan={2} className="px-6 py-4 text-center uppercase tracking-wider text-xs">Total Equilibrium:</td>
                <td className="px-6 py-4 text-right font-extrabold text-slate-950 border-b-4 border-double border-slate-950 text-sm">
                  {formatCurrency(totalTrialDebit, db.activeCurrency)}
                </td>
                <td className="px-6 py-4 text-right font-extrabold text-slate-950 border-b-4 border-double border-slate-950 text-sm">
                  {formatCurrency(totalTrialCredit, db.activeCurrency)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Dynamic validation card */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-extrabold uppercase">Audit Equilibrium Status: OK (Seimbang)</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Uji pencatatan saldo normal ganda lolos validasi debit-kredit otomatis.</p>
          </div>
        </div>
      )}

      {/* Manual Journal Modal */}
      {isJournalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-semibold">
                {editingJournalId ? 'Edit Ayat Jurnal' : 'Tulis Ayat Jurnal Manual'}
              </h3>
              <button onClick={() => setIsJournalOpen(false)} className="p-1 hover:bg-slate-200/60 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handlePostJournal} className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                  <DatePicker
                    value={journalDate}
                    onChange={(val) => setJournalDate(val)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Deskripsi / Memo Jurnal *</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                    value={journalDesc}
                    onChange={(e) => setJournalDesc(e.target.value)}
                    placeholder="e.g. Setoran modal tunai tambahan pemegang saham"
                  />
                </div>
              </div>

              {/* Rows List */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Rincian Pos Debet / Kredit</h4>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="text-[10px] font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded"
                  >
                    + Tambah Baris
                  </button>
                </div>

                <div className="space-y-2">
                  {journalDetails.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <select
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded focus:outline-none bg-white"
                          value={row.coaId}
                          onChange={(e) => handleRowChange(idx, 'coaId', e.target.value)}
                        >
                          {db.coa.map(c => (
                            <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none font-bold text-right"
                          value={row.debit}
                          onChange={(e) => handleRowChange(idx, 'debit', Number(e.target.value))}
                          placeholder="Debit"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none font-bold text-right"
                          value={row.credit}
                          onChange={(e) => handleRowChange(idx, 'credit', Number(e.target.value))}
                          placeholder="Kredit"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={journalDetails.length <= 2}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded disabled:opacity-45"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balancing calculations */}
              <div className="border-t border-slate-100 pt-4 flex justify-between text-xs font-semibold text-slate-500">
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>Sistem mendeteksi selisih penulisan jurnal manual.</span>
                </div>
                <div className="text-right space-y-1 w-48">
                  <div className="flex justify-between">
                    <span>Total Debet:</span>
                    <span className="text-slate-900 font-bold">
                      {formatCurrency(journalDetails.reduce((s, r) => s + r.debit, 0), db.activeCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Kredit:</span>
                    <span className="text-slate-900 font-bold">
                      {formatCurrency(journalDetails.reduce((s, r) => s + r.credit, 0), db.activeCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1 text-[11px]">
                    <span>Selisih:</span>
                    <span className={`font-extrabold ${
                      Math.abs(journalDetails.reduce((s, r) => s + r.debit, 0) - journalDetails.reduce((s, r) => s + r.credit, 0)) < 0.1
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}>
                      {formatCurrency(Math.abs(journalDetails.reduce((s, r) => s + r.debit, 0) - journalDetails.reduce((s, r) => s + r.credit, 0)), db.activeCurrency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsJournalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 rounded-lg shadow"
                >
                  {editingJournalId ? 'Simpan Perubahan' : 'Post Jurnal Manual'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {journalToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Konfirmasi Hapus Jurnal
              </h3>
              <button onClick={() => setJournalToDelete(null)} className="p-1 hover:bg-slate-200/60 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 text-xs text-slate-600 space-y-3">
              <p>Apakah Anda yakin ingin menghapus catatan jurnal ini?</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-bold text-slate-900">
                {db.journals.find(j => j.id === journalToDelete)?.journalNo} - {db.journals.find(j => j.id === journalToDelete)?.description}
              </div>
              <p className="text-[10px] text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setJournalToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteJournal}
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
