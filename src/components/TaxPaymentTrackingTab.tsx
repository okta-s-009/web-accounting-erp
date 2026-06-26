/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { ERPDatabase } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { DatePicker } from './DatePicker';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Percent, ShieldCheck, CheckCircle2, Coins, Calendar, Plus, Search, 
  Clipboard, UploadCloud, Check, Eye, Trash2, FileSpreadsheet, Download, 
  Receipt, Filter, BarChart3, LineChart as LineIcon, Info, HelpCircle, 
  AlertCircle, RefreshCw, Sparkles, Building2, Layers, Edit2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  PieChart,
  Pie
} from 'recharts';

interface TaxPaymentTrackingTabProps {
  db: ERPDatabase;
}

export interface TaxDeposit {
  id: string;
  month: string;
  year: number;
  taxType: string;
  mapCode: string;
  ntpn: string;
  billingCode?: string;
  amount: number;
  paymentDate: string;
  bankName: string;
  status: 'Terverifikasi' | 'Menunggu';
  notes?: string;
  attachmentName?: string;
}

const MONTHS_ORDER = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const convertAmountToTerbilang = (amount: number): string => {
  const words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  
  function terbilangHelper(num: number): string {
    if (num < 12) return words[num];
    if (num < 20) return terbilangHelper(num - 10) + " Belas";
    if (num < 100) return terbilangHelper(Math.floor(num / 10)) + " Puluh " + terbilangHelper(num % 10);
    if (num < 200) return "Seratus " + terbilangHelper(num - 100);
    if (num < 1000) return terbilangHelper(Math.floor(num / 100)) + " Ratus " + terbilangHelper(num % 100);
    if (num < 2000) return "Seribu " + terbilangHelper(num - 1000);
    if (num < 1000000) return terbilangHelper(Math.floor(num / 1000)) + " Ribu " + terbilangHelper(num % 1000);
    if (num < 1000000000) return terbilangHelper(Math.floor(num / 1000000)) + " Juta " + terbilangHelper(num % 1000000);
    if (num < 1000000000000) return terbilangHelper(Math.floor(num / 1000000000)) + " Miliar " + terbilangHelper(num % 1000000000);
    return "Miliar";
  }
  
  const result = terbilangHelper(amount).trim().replace(/\s+/g, ' ');
  return result ? result : "Nol";
};

export const TaxPaymentTrackingTab: React.FC<TaxPaymentTrackingTabProps> = ({ db }) => {
  const currency = db.activeCurrency;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notifications State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Load/Manage local deposits
  const [deposits, setDeposits] = useState<TaxDeposit[]>(() => {
    const stored = localStorage.getItem('tb_tax_deposits_registry');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Gagal load data setoran pajak", e);
      }
    }
    
    // Default professional seed data for CV. Toras Benaunt
    const seedData: TaxDeposit[] = [];
    localStorage.setItem('tb_tax_deposits_registry', JSON.stringify(seedData));
    return seedData;
  });

  // Form States for New Payment
  const [depMonth, setDepMonth] = useState<string>('Juni');
  const [depYear, setDepYear] = useState<number>(2026);
  const [depTaxType, setDepTaxType] = useState<string>('PPh Pasal 25 (Angsuran PPh Badan)');
  const [depNtpn, setDepNtpn] = useState<string>('');
  const [depBillingCode, setDepBillingCode] = useState<string>('');
  const [depAmount, setDepAmount] = useState<string>('');
  const [depDate, setDepDate] = useState<string>('');
  const [depBank, setDepBank] = useState<string>('Bank Mandiri');
  const [depNotes, setDepNotes] = useState<string>('');
  const [depAttachmentName, setDepAttachmentName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Copy & View Receipt states
  const [copiedNtpn, setCopiedNtpn] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<TaxDeposit | null>(null);
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
  const [depositToDelete, setDepositToDelete] = useState<TaxDeposit | null>(null);

  const handleEditDepositClick = (item: TaxDeposit) => {
    setEditingDepositId(item.id);
    setDepMonth(item.month);
    setDepYear(item.year);
    setDepTaxType(item.taxType);
    setDepNtpn(item.ntpn);
    setDepBillingCode(item.billingCode || '');
    setDepAmount(item.amount.toString());
    setDepDate(item.paymentDate);
    setDepBank(item.bankName);
    setDepNotes(item.notes || '');
    setDepAttachmentName(item.attachmentName || '');
    const formElement = document.getElementById('ssp-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter States
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('Semua');
  const [filterType, setFilterType] = useState<string>('Semua');
  const [filterYear, setFilterYear] = useState<string>('2026');

  // Interactive View Controls
  const [activeVisualView, setActiveVisualView] = useState<'chart' | 'pie' | 'line'>('chart');

  // --- Handlers & Helpers ---
  const getMapCode = (type: string) => {
    if (type.includes('Pasal 25')) return '411125';
    if (type.includes('Pasal 29')) return '411126';
    if (type.includes('Pasal 21')) return '411121';
    if (type.includes('Pasal 23')) return '411124';
    if (type.includes('PPN')) return '411211';
    return '411125';
  };

  const handleGenerateMockNtpn = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDepNtpn(result);
    // Auto generate mock billing code too
    let billing = '109';
    for (let i = 0; i < 12; i++) {
      billing += Math.floor(Math.random() * 10).toString();
    }
    setDepBillingCode(billing);
    triggerNotification('Kode NTPN & Kode Billing otomatis berhasil dibuat!', 'info');
  };

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // NTPN validation
    const cleanNtpn = depNtpn.trim().toUpperCase();
    if (!cleanNtpn || cleanNtpn.length !== 16) {
      if (cleanNtpn.length === 15 && /^\d+$/.test(cleanNtpn)) {
        triggerNotification('❌ Error: Kode yang Anda masukkan adalah Kode Billing (15 digit angka), bukan NTPN! NTPN adalah 16 karakter alfanumerik (huruf & angka) yang didapat dari struk bukti pembayaran bank.', 'error');
      } else {
        triggerNotification('Kode NTPN harus tepat 16 karakter Alfanumerik!', 'error');
      }
      return;
    }

    // Amount validation
    const cleanAmt = depAmount.toString().replace(/[^0-9]/g, '');
    const amtNum = parseFloat(cleanAmt);
    if (!amtNum || amtNum <= 0) {
      triggerNotification('Nominal setoran wajib diisi dengan benar!', 'error');
      return;
    }

    if (!depDate) {
      triggerNotification('Pilih tanggal penyetoran pajak!', 'error');
      return;
    }

    if (editingDepositId) {
      const updated = deposits.map(d => {
        if (d.id === editingDepositId) {
          return {
            ...d,
            month: depMonth,
            year: depYear,
            taxType: depTaxType,
            mapCode: getMapCode(depTaxType),
            ntpn: cleanNtpn,
            billingCode: depBillingCode.trim() || undefined,
            amount: amtNum,
            paymentDate: depDate,
            bankName: depBank,
            notes: depNotes || `Penyetoran ${depTaxType} Masa ${depMonth} ${depYear}`,
            attachmentName: depAttachmentName || `SSP_BPN_${cleanNtpn.substring(0, 6)}.pdf`
          };
        }
        return d;
      });
      setDeposits(updated);
      localStorage.setItem('tb_tax_deposits_registry', JSON.stringify(updated));
      setEditingDepositId(null);
      
      // Reset Form fields
      setDepNtpn('');
      setDepBillingCode('');
      setDepAmount('');
      setDepDate('');
      setDepNotes('');
      setDepAttachmentName('');
      triggerNotification(`Setoran Pajak ${depTaxType} sebesar Rp ${amtNum.toLocaleString('id-ID')} berhasil diperbarui.`, 'success');
    } else {
      const newDeposit: TaxDeposit = {
        id: 'TX-' + Date.now().toString().substring(8),
        month: depMonth,
        year: depYear,
        taxType: depTaxType,
        mapCode: getMapCode(depTaxType),
        ntpn: cleanNtpn,
        billingCode: depBillingCode.trim() || undefined,
        amount: amtNum,
        paymentDate: depDate,
        bankName: depBank,
        status: 'Terverifikasi',
        notes: depNotes || `Penyetoran ${depTaxType} Masa ${depMonth} ${depYear}`,
        attachmentName: depAttachmentName || `SSP_BPN_${cleanNtpn.substring(0, 6)}.pdf`
      };

      const updated = [newDeposit, ...deposits];
      setDeposits(updated);
      localStorage.setItem('tb_tax_deposits_registry', JSON.stringify(updated));

      // Reset Form fields
      setDepNtpn('');
      setDepBillingCode('');
      setDepAmount('');
      setDepDate('');
      setDepNotes('');
      setDepAttachmentName('');

      triggerNotification(`Setoran Pajak ${newDeposit.taxType} sebesar Rp ${newDeposit.amount.toLocaleString('id-ID')} berhasil disimpan.`);
    }
  };

  const executeDeleteDeposit = () => {
    if (!depositToDelete) return;
    const { id, taxType, amount } = depositToDelete;
    const updated = deposits.filter(d => d.id !== id);
    setDeposits(updated);
    localStorage.setItem('tb_tax_deposits_registry', JSON.stringify(updated));
    triggerNotification(`Catatan setoran ${taxType} senilai Rp ${amount.toLocaleString('id-ID')} berhasil dihapus.`, 'info');
    setDepositToDelete(null);
  };

  const handleCopyNtpn = (ntpn: string) => {
    navigator.clipboard.writeText(ntpn);
    setCopiedNtpn(ntpn);
    triggerNotification(`NTPN "${ntpn}" disalin ke clipboard.`, 'success');
    setTimeout(() => setCopiedNtpn(''), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setDepAttachmentName(file.name);
      triggerNotification(`File "${file.name}" berhasil dilampirkan via Drag & Drop.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setDepAttachmentName(file.name);
      triggerNotification(`File "${file.name}" berhasil dilampirkan.`);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['ID Setoran', 'Masa', 'Tahun', 'Jenis Pajak', 'Kode MAP', 'Kode Billing', 'NTPN Negara', 'Jumlah Setoran', 'Tanggal Setor', 'Saluran Pembayaran', 'Status', 'Catatan'];
      const rows = filteredDeposits.map(d => [
        d.id,
        d.month,
        d.year,
        d.taxType,
        d.mapCode,
        d.billingCode || '-',
        d.ntpn,
        d.amount,
        d.paymentDate,
        d.bankName,
        d.status,
        d.notes || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ERP_Register_Setoran_Pajak_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerNotification('Daftar Register Setoran Pajak berhasil diekspor ke CSV.', 'success');
    } catch (err) {
      console.error(err);
      triggerNotification('Gagal mengekspor data ke CSV', 'error');
    }
  };

  // --- Filtering & Queries ---
  const filteredDeposits = useMemo(() => {
    return deposits.filter(dep => {
      const matchSearch = filterSearch === '' || 
        dep.ntpn.toLowerCase().includes(filterSearch.toLowerCase()) ||
        (dep.notes && dep.notes.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (dep.billingCode && dep.billingCode.includes(filterSearch)) ||
        dep.bankName.toLowerCase().includes(filterSearch.toLowerCase());
      
      const matchMonth = filterMonth === 'Semua' || dep.month === filterMonth;
      const matchType = filterType === 'Semua' || dep.taxType.includes(filterType);
      const matchYear = filterYear === 'Semua' || dep.year.toString() === filterYear;
      
      return matchSearch && matchMonth && matchType && matchYear;
    });
  }, [deposits, filterSearch, filterMonth, filterType, filterYear]);

  // Sort filtered payments by payment date descending for the list
  const sortedFilteredDeposits = useMemo(() => {
    return [...filteredDeposits].sort((a, b) => {
      return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    });
  }, [filteredDeposits]);

  // --- Summary Statistics ---
  const depositsSummary = useMemo(() => {
    const total = deposits.reduce((acc, d) => acc + d.amount, 0);
    const pphBadan = deposits.reduce((acc, d) => {
      if (d.mapCode === '411125' || d.mapCode === '411126') return acc + d.amount;
      return acc;
    }, 0);
    const pphKaryawan = deposits.reduce((acc, d) => {
      if (d.mapCode === '411121') return acc + d.amount;
      return acc;
    }, 0);
    const ppn = deposits.reduce((acc, d) => {
      if (d.mapCode === '411211') return acc + d.amount;
      return acc;
    }, 0);
    const otherTaxes = total - (pphBadan + pphKaryawan + ppn);
    const verified = deposits.filter(d => d.status === 'Terverifikasi').length;
    const pending = deposits.filter(d => d.status === 'Menunggu').length;
    
    return {
      total,
      pphBadan,
      pphKaryawan,
      ppn,
      otherTaxes,
      verified,
      pending,
      count: deposits.length
    };
  }, [deposits]);

  // --- Recharts Chart Preparations ---
  const chartDataByTaxType = useMemo(() => {
    const map: { [key: string]: number } = {};
    deposits.forEach(d => {
      const shortName = d.taxType.split('(')[0].trim();
      map[shortName] = (map[shortName] || 0) + d.amount;
    });

    return Object.keys(map).map(key => ({
      name: key,
      value: map[key]
    }));
  }, [deposits]);

  const chartDataByMonthTrend = useMemo(() => {
    // Collect data for years that are active
    const years = Array.from(new Set(deposits.map(d => d.year)));
    const activeYear = years.includes(2026) ? 2026 : (years[0] || 2026);

    const monthlyMap: { [key: string]: number } = {};
    MONTHS_ORDER.forEach(m => {
      monthlyMap[m] = 0;
    });

    deposits.forEach(d => {
      if (d.year === activeYear) {
        monthlyMap[d.month] = (monthlyMap[d.month] || 0) + d.amount;
      }
    });

    return MONTHS_ORDER.map(m => ({
      month: m.substring(0, 3),
      amount: monthlyMap[m],
      amountInMillion: Math.round(monthlyMap[m] / 100000) / 10 // scale to Millions
    }));
  }, [deposits]);

  const PIE_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#a855f7', '#ec4899', '#3b82f6'];

  return (
    <div className="space-y-6">
      
      {/* Dynamic Overlay Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-50 max-w-sm"
          >
            <div className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 text-left ${
              notification.type === 'success' 
                ? 'bg-[#050510] border-emerald-500/30 text-emerald-300' 
                : notification.type === 'error'
                  ? 'bg-[#050510] border-rose-500/30 text-rose-300'
                  : 'bg-[#050510] border-indigo-500/30 text-indigo-300'
            }`}>
              <div className="mt-0.5">
                {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {notification.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-400" />}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em]">Notifikasi Sistem</p>
                <p className="text-xs font-semibold text-zinc-300 mt-1 leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-zinc-950 to-zinc-900 border border-white/[0.08] rounded-2xl p-5 gap-4 shadow-lg">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-black text-zinc-100 uppercase tracking-[0.15em]">
                Pelacakan & Register Setoran Pajak Bulanan
              </h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em] mt-0.5">
                Daftar & Penyetoran Pajak Sah Surat Setoran Pajak (SSP) - CV. Toras Benaunt
              </p>
            </div>
          </div>
        </div>

        {/* Action export registry */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-white/[0.08] rounded-xl text-xs font-black uppercase text-amber-400 tracking-[0.1em] flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Ekspor ke Excel (CSV)
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Panel for Paid Taxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Paid */}
        <div className="bg-[#050510]/70 border border-white/[0.08] rounded-xl p-4 shadow-lg hover:border-white/[0.1] transition-all border-l-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em]">Total Pajak Disetor</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-black font-mono text-emerald-400 mt-2">
            {formatCurrency(depositsSummary.total, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Masa Pajak 2026</span>
            <span className="text-emerald-400 font-extrabold uppercase">Terverifikasi DJP</span>
          </div>
        </div>

        {/* PPh Badan */}
        <div className="bg-[#050510]/70 border border-white/[0.08] rounded-xl p-4 shadow-lg hover:border-white/[0.1] transition-all border-l-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em]">Angsuran PPh Badan</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-black font-mono text-amber-400 mt-2">
            {formatCurrency(depositsSummary.pphBadan, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">PPh Pasal 25 & 29</span>
            <span className="text-amber-500 font-extrabold uppercase">MAP 411125</span>
          </div>
        </div>

        {/* PPN Masukan/Keluaran */}
        <div className="bg-[#050510]/70 border border-white/[0.08] rounded-xl p-4 shadow-lg hover:border-white/[0.1] transition-all border-l-indigo-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em]">PPN Dalam Negeri</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-black font-mono text-indigo-400 mt-2">
            {formatCurrency(depositsSummary.ppn, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Setoran Kurang Bayar</span>
            <span className="text-indigo-400 font-extrabold uppercase">MAP 411211</span>
          </div>
        </div>

        {/* Verified Status */}
        <div className="bg-[#050510]/70 border border-white/[0.08] rounded-xl p-4 shadow-lg hover:border-white/[0.1] transition-all border-l-violet-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em]">Kualitas Kepatuhan</span>
            <div className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-black font-mono text-violet-400 mt-2">
            {depositsSummary.verified} / {depositsSummary.count} Slip Sah
          </p>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Menunggu: {depositsSummary.pending} draft</span>
            <span className="text-violet-400 font-extrabold uppercase">100% Valid</span>
          </div>
        </div>

      </div>

      {/* Analytics Visualization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual Charts (8 cols) */}
        <div className="lg:col-span-8 bg-[#050510] border border-white/[0.08]/90 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-3 gap-3">
            <div className="text-left">
              <h3 className="text-xs font-black text-zinc-100 uppercase tracking-[0.15em] flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-amber-500" />
                Grafik Analitis Penyetoran Pajak Negara
              </h3>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide mt-0.5">
                Statistik Kontribusi Pajak CV. Toras Benaunt Berdasarkan Kategori dan Tren Bulanan
              </p>
            </div>

            {/* Toggle visual charts style */}
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-white/[0.08] shrink-0">
              <button
                onClick={() => setActiveVisualView('chart')}
                className={`py-1 px-2.5 text-[9px] font-black uppercase rounded-md transition-all duration-200 cursor-pointer ${
                  activeVisualView === 'chart' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Komparasi Kategori
              </button>
              <button
                onClick={() => setActiveVisualView('line')}
                className={`py-1 px-2.5 text-[9px] font-black uppercase rounded-md transition-all duration-200 cursor-pointer ${
                  activeVisualView === 'line' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Tren Bulanan
              </button>
            </div>
          </div>

          {/* Chart Canvas Area */}
          <div className="h-64 flex items-center justify-center relative">
            {deposits.length === 0 ? (
              <p className="text-xs text-zinc-500 font-bold">Isi setoran pajak untuk melihat visualisasi data</p>
            ) : activeVisualView === 'chart' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataByTaxType} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#71717a', fontSize: 8, fontWeight: 700 }} 
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={{ stroke: '#27272a' }}
                  />
                  <YAxis 
                    tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }} 
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={{ stroke: '#27272a' }}
                    tickFormatter={(v) => `Rp${v / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', textAlign: 'left' }}
                    labelClassName="text-zinc-400 font-bold"
                    formatter={(value: number) => [formatCurrency(value, currency), 'Total Disetor']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartDataByTaxType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataByMonthTrend} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }} 
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={{ stroke: '#27272a' }}
                  />
                  <YAxis 
                    tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }} 
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={{ stroke: '#27272a' }}
                    tickFormatter={(v) => `Rp${v}jt`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', textAlign: 'left' }}
                    formatter={(value: number, name: string) => [
                      name === 'amount' ? formatCurrency(value, currency) : `${value} Juta`, 
                      name === 'amount' ? 'Total Pajak' : 'Skala Juta'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    name="Penyetoran 2026" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Help Guide Panel (4 cols) */}
        <div className="lg:col-span-4 bg-[#050510] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-[0.15em] flex items-center gap-1.5 border-b border-white/[0.06] pb-2.5">
              <Info className="w-4 h-4 text-amber-500" />
              Panduan Rekonsiliasi Pajak
            </h3>

            <div className="space-y-3.5 text-left">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-[10px] font-black text-zinc-200 uppercase">Buat ID Billing Pajak</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed font-bold">
                    Gunakan website DJP Online untuk membuat kode billing 15 digit sesuai dengan jenis MAP setoran Anda.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-[10px] font-black text-zinc-200 uppercase">Bayar Melalui Bank Persepsi</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed font-bold">
                    Bayar billing melalui ATM, Teller, internet banking, atau Kantor Pos terdekat untuk mendapatkan NTPN (16 digit).
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-[10px] font-black text-zinc-200 uppercase">Catat NTPN di Register ERP</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed font-bold">
                    Masukkan NTPN valid dan unggah bukti transfer/BPN agar terintegrasi ke modul SPT PPh Badan CV. Toras Benaunt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06]/80">
            <div className="p-3 bg-[#0a0a1a] rounded-xl border border-white/[0.06] flex items-start gap-2.5 text-left">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-black text-zinc-200 uppercase leading-none">Otentikasi Aman MPN G3</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 leading-normal">
                  Sistem beroperasi di jaringan tertutup perbendaharaan negara. Seluruh slip pembayaran dijamin sah.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Core Setoran Form & Grid Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div id="ssp-form-container" className="bg-[#050510] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editingDepositId ? (
                  <Edit2 className="w-5 h-5 text-amber-500 animate-pulse" />
                ) : (
                  <Plus className="w-5 h-5 text-amber-500" />
                )}
                <div className="text-left">
                  <h3 className="text-xs font-black text-zinc-100 uppercase tracking-[0.15em]">
                    {editingDepositId ? 'Edit Setoran Pajak' : 'Form Setoran Pajak (SSP)'}
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                    {editingDepositId ? 'Ubah data Penyetoran Surat Setoran Pajak' : 'Catat Penyetoran Surat Setoran Pajak Baru'}
                  </p>
                </div>
              </div>

              {/* Mock NTPN trigger */}
              <button
                type="button"
                onClick={handleGenerateMockNtpn}
                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-[8px] font-black text-amber-400 uppercase tracking-[0.1em] flex items-center gap-1 transition-all duration-200 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Auto NTPN
              </button>
            </div>

            <form onSubmit={handleAddDeposit} className="space-y-4">
              
              {/* Masa & Tahun Row */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Masa Pajak (Bulan):</label>
                  <select
                    value={depMonth}
                    onChange={(e) => setDepMonth(e.target.value)}
                    className="w-full text-xs font-bold text-zinc-100 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {MONTHS_ORDER.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Tahun Pajak:</label>
                  <select
                    value={depYear}
                    onChange={(e) => setDepYear(Number(e.target.value))}
                    className="w-full text-xs font-bold text-zinc-100 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jenis Pajak dropdown */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Jenis Pajak (Kode MAP):</label>
                  <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    MAP: {getMapCode(depTaxType)} / 100
                  </span>
                </div>
                <select
                  value={depTaxType}
                  onChange={(e) => setDepTaxType(e.target.value)}
                  className="w-full text-xs font-bold text-zinc-100 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="PPh Pasal 25 (Angsuran PPh Badan)">PPh Pasal 25 (Angsuran PPh Badan)</option>
                  <option value="PPh Pasal 29 (PPh Badan Kurang Bayar Tahunan)">PPh Pasal 29 (PPh Badan Kurang Bayar Tahunan)</option>
                  <option value="PPh Pasal 21 (Pajak Gaji Karyawan)">PPh Pasal 21 (Pajak Gaji Karyawan)</option>
                  <option value="PPh Pasal 23 (Jasa Armada & Rental)">PPh Pasal 23 (Jasa Armada & Rental)</option>
                  <option value="PPN Dalam Negeri (Keluaran - Masukan)">PPN Dalam Negeri (Keluaran - Masukan)</option>
                </select>
              </div>

              {/* Kode Billing Optional */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-zinc-400 uppercase">ID Billing Negara (15 Digit - Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: 109283748291038"
                  maxLength={15}
                  value={depBillingCode}
                  onChange={(e) => setDepBillingCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-xs font-mono font-bold text-zinc-100 bg-black/40 border border-white/[0.08] rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* NTPN Reference Number */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Kode Referensi / NTPN Negara (16 Karakter):</label>
                  <span className={`text-[8px] font-bold ${depNtpn.length === 16 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {depNtpn.length}/16 Karakter
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="Masukkan 16 Kode NTPN, Contoh: 8271A9283748C6B1"
                  value={depNtpn}
                  onChange={(e) => setDepNtpn(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold text-zinc-100 bg-black/40 border border-white/[0.08] rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                />
                {depNtpn.length === 15 && /^\d+$/.test(depNtpn) && (
                  <div className="mt-1.5 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 font-medium leading-relaxed">
                    ⚠️ <strong>Anda Memasukkan Kode Billing!</strong><br />
                    Kode <strong>{depNtpn}</strong> yang Anda masukkan adalah 15 digit angka, yang merupakan format <strong>Kode Billing</strong> (seperti draf pembayaran dari DJP). <br />
                    <strong>NTPN (Nomor Transaksi Penerimaan Negara)</strong> baru akan diterbitkan setelah Anda melakukan pembayaran, berupa <strong>16 karakter kombinasi huruf & angka</strong> yang ada di struk/bukti bayar bank.
                  </div>
                )}
              </div>

              {/* Nominal Setoran & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Jumlah Setor (Rupiah):</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                    <input
                      type="text"
                      required
                      placeholder="12.500.000"
                      value={depAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val) {
                          setDepAmount(Number(val).toLocaleString('id-ID'));
                        } else {
                          setDepAmount('');
                        }
                      }}
                      className="w-full text-xs font-mono font-black text-zinc-100 bg-black/40 border border-white/[0.08] rounded-lg pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Tanggal Setor:</label>
                  <DatePicker
                    value={depDate}
                    onChange={(val) => setDepDate(val)}
                  />
                </div>
              </div>

              {/* Bank Persepsi / Pembayaran */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Saluran Bayar (Bank Persepsi):</label>
                <select
                  value={depBank}
                  onChange={(e) => setDepBank(e.target.value)}
                  className="w-full text-xs font-bold text-zinc-100 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Bank Mandiri">Bank Mandiri (Persero)</option>
                  <option value="Bank BNI">Bank BNI (Persero)</option>
                  <option value="Bank BRI">Bank BRI (Persero)</option>
                  <option value="Bank BCA">Bank BCA (Swasta)</option>
                  <option value="Pos Indonesia">Kantor Pos Indonesia</option>
                </select>
              </div>

              {/* Keterangan */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Catatan / Deskripsi Tambahan:</label>
                <textarea
                  placeholder="Contoh: Pembayaran masa Mei via M-Banking Mandiri..."
                  rows={2}
                  value={depNotes}
                  onChange={(e) => setDepNotes(e.target.value)}
                  className="w-full text-xs font-medium text-zinc-100 bg-black/40 border border-white/[0.08] rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Upload SSP File */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Unggah SSP / Lembar Bukti BPN:</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-amber-500 bg-amber-500/5' 
                      : depAttachmentName 
                        ? 'border-emerald-500/50 bg-emerald-500/5' 
                        : 'border-white/[0.08] bg-[#0a0a1a]/80 hover:border-white/[0.1] hover:bg-[#0a0a1a]'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                  {depAttachmentName ? (
                    <div className="space-y-1.5">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                      <p className="text-xs font-bold text-zinc-200 truncate max-w-xs mx-auto">{depAttachmentName}</p>
                      <p className="text-[9px] text-emerald-400 font-extrabold uppercase">File Berhasil Terlampir</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <UploadCloud className="w-8 h-8 mx-auto text-zinc-500 animate-pulse" />
                      <p className="text-xs font-bold text-zinc-300">Drag & Drop Slip Bukti Pembayaran</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">Menerima PDF, PNG, JPG s.d 10 MB atau klik untuk pilih berkas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Submission Button */}
              <div className="flex gap-2">
                {editingDepositId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDepositId(null);
                      setDepNtpn('');
                      setDepBillingCode('');
                      setDepAmount('');
                      setDepDate('');
                      setDepNotes('');
                      setDepAttachmentName('');
                      triggerNotification('Edit dibatalkan.', 'info');
                    }}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-black uppercase rounded-xl tracking-[0.1em] shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className={`${editingDepositId ? 'flex-1' : 'w-full'} py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 text-xs font-black uppercase rounded-xl tracking-[0.1em] shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer mt-2`}
                >
                  {editingDepositId ? (
                    <>
                      <Check className="w-4.5 h-4.5" /> Simpan Perubahan
                    </>
                  ) : (
                    <>
                      <Plus className="w-4.5 h-4.5" /> Rekonsiliasi & Catat Setoran
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* History Ledger Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#050510] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-3 gap-3">
              <div className="text-left">
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-[0.15em] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-400" />
                  Buku Register Penyetoran Pajak Negara
                </h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                  Catatan Transaksi Penyetoran yang Tercatat di Database ERP
                </p>
              </div>
              <span className="text-[9px] font-black text-zinc-400 bg-black/40 border border-white/[0.08] px-2.5 py-1 rounded-lg shrink-0">
                {filteredDeposits.length} Catatan Pajak
              </span>
            </div>

            {/* Filtering Tools Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-900/30 p-3.5 rounded-xl border border-white/[0.06]">
              
              {/* Search input (2 cols on sm) */}
              <div className="sm:col-span-2 relative">
                <span className="absolute left-3 top-2.5 text-zinc-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Cari NTPN, bank, atau keterangan..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full text-[11px] font-bold text-zinc-200 bg-[#050510] border border-white/[0.08] rounded-lg pl-8.5 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Month Filter */}
              <div>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full text-[11px] font-bold text-zinc-200 bg-[#050510] border border-white/[0.08] rounded-lg px-2.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Semua">Masa: Semua</option>
                  {MONTHS_ORDER.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Tax Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full text-[11px] font-bold text-zinc-200 bg-[#050510] border border-white/[0.08] rounded-lg px-2.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Semua">Jenis: Semua</option>
                  <option value="Pasal 25">PPh Pasal 25</option>
                  <option value="Pasal 29">PPh Pasal 29</option>
                  <option value="Pasal 21">PPh Pasal 21</option>
                  <option value="Pasal 23">PPh Pasal 23</option>
                  <option value="PPN">PPN Dalam Negeri</option>
                </select>
              </div>

            </div>

            {/* List Data Grid */}
            {sortedFilteredDeposits.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 space-y-3">
                <Receipt className="w-12 h-12 mx-auto text-zinc-700 animate-bounce" />
                <p className="text-xs font-black uppercase text-zinc-400">Tidak Ada Setoran Pajak Ditemukan</p>
                <p className="text-[10px] max-w-sm mx-auto leading-relaxed text-zinc-500 font-bold">
                  Gunakan filter di atas, hapus pencarian, atau klik Auto-generate NTPN di form sebelah kiri untuk memulai pencatatan.
                </p>
                {(filterSearch || filterMonth !== 'Semua' || filterType !== 'Semua') && (
                  <button
                    onClick={() => {
                      setFilterSearch('');
                      setFilterMonth('Semua');
                      setFilterType('Semua');
                    }}
                    className="px-3.5 py-2 bg-black/40 border border-white/[0.08] hover:bg-zinc-850 rounded-xl text-[9px] font-black uppercase text-amber-400 tracking-[0.1em] transition-all duration-200 cursor-pointer"
                  >
                    Atur Ulang Pencarian
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
                {sortedFilteredDeposits.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-[#0a0a1a]/80 border border-white/[0.08] hover:border-zinc-750/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    
                    {/* Primary Info Block left */}
                    <div className="flex gap-3.5 items-start">
                      <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                        item.taxType.includes('Pasal 25') 
                          ? 'bg-amber-500/10 text-amber-400' 
                          : item.taxType.includes('PPN')
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        <Receipt className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-zinc-100">{item.taxType}</span>
                          <span className="text-[8px] font-extrabold uppercase bg-zinc-800 border border-white/[0.1] text-zinc-300 px-2 py-0.5 rounded">
                            MAP {item.mapCode}
                          </span>
                        </div>

                        <p className="text-[10px] font-semibold text-zinc-400 leading-relaxed max-w-md">
                          {item.notes}
                        </p>

                        <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-bold flex-wrap pt-0.5">
                          <span className="text-zinc-400 uppercase tracking-wide">Masa: {item.month} {item.year}</span>
                          <span>•</span>
                          <span>Saluran: {item.bankName}</span>
                          <span>•</span>
                          <span>Tanggal: {item.paymentDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Block Right */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/[0.06] pt-3 sm:pt-0 gap-3 shrink-0">
                      
                      {/* Amount */}
                      <div className="text-left sm:text-right">
                        <span className="text-[8px] text-zinc-500 font-black block uppercase tracking-[0.1em]">Jumlah Disetor</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          {formatCurrency(item.amount, currency).split(',')[0]}
                        </span>
                      </div>

                      {/* NTPN & Action Panel */}
                      <div className="flex items-center gap-1.5">
                        
                        {/* Copy NTPN badge */}
                        <div 
                          onClick={() => handleCopyNtpn(item.ntpn)}
                          title="Klik untuk menyalin kode NTPN"
                          className="px-2 py-1 bg-[#050510] hover:bg-white/[0.04] border border-white/[0.08] rounded-lg text-[9px] font-mono font-black text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <span>NTPN:</span>
                          <span className="text-zinc-200 font-bold">{item.ntpn.substring(0, 8)}...</span>
                          {copiedNtpn === item.ntpn ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Clipboard className="w-3 h-3 text-zinc-600" />
                          )}
                        </div>

                        {/* View official BPN */}
                        <button
                          onClick={() => setSelectedReceipt(item)}
                          title="Buka Lembar BPN Resmi Negara"
                          className="p-1.5 bg-zinc-900 hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.1] text-zinc-400 hover:text-zinc-100 rounded-lg transition-all duration-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit SSP */}
                        <button
                          onClick={() => handleEditDepositClick(item)}
                          title="Edit Bukti Setor"
                          className="p-1.5 bg-zinc-900 hover:bg-amber-500/10 border border-white/[0.08] hover:border-amber-500/20 text-amber-400 hover:text-amber-300 rounded-lg transition-all duration-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete SSP from database */}
                        <button
                          onClick={() => setDepositToDelete(item)}
                          title="Hapus Bukti Setor"
                          className="p-1.5 bg-zinc-900 hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}

            <div className="text-[9px] text-zinc-500 font-bold uppercase flex items-center justify-between border-t border-white/[0.06] pt-3 tracking-wide text-left">
              <span>Seluruh data Penyetoran di atas telah dipasangkan ke rekonsiliasi kas negara</span>
              <span>Kementerian Keuangan RI Ditjen Pajak</span>
            </div>

          </div>
        </div>

      </div>

      {/* DETAILED SSP / BPN STATE WATERMARKED RECEIPT MODAL */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#050510] border border-white/[0.08] rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden text-zinc-200"
            >
              {/* State Seal Watermark in background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <ShieldCheck className="w-[380px] h-[380px] text-amber-500" />
              </div>
              
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>

              {/* BPN Header Printout */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/[0.08] pb-5 gap-4 relative z-10">
                <div className="space-y-1 text-left">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] leading-none">REPUBLIK INDONESIA</p>
                  <p className="text-[11px] font-black text-zinc-300 uppercase tracking-[0.1em]">DIREKTORAT JENDERAL PAJAK</p>
                  <p className="text-[9px] font-bold text-zinc-400">KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</p>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded uppercase tracking-[0.1em]">
                    Sistem MPN G3 Terverifikasi
                  </span>
                  <p className="text-xs font-mono font-black text-zinc-200 mt-1.5">No. Dokumen: BPN-{selectedReceipt.id}</p>
                </div>
              </div>

              {/* Receipt Title */}
              <div className="text-center py-5 relative z-10">
                <h3 className="text-sm md:text-base font-black tracking-[0.15em] text-zinc-100 uppercase">
                  BUKTI PENERIMAAN NEGARA (BPN)
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">
                  Surat Setoran Pajak (SSP) Elektronik Sah Berdasarkan UU RI
                </p>
              </div>

              {/* Receipt Body Ledger Fields */}
              <div className="bg-[#0a0a1a]/80 border border-white/[0.08] rounded-2xl p-4 md:p-5 space-y-4 font-mono text-[11px] relative z-10">
                
                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">WAJIB PAJAK:</span>
                  <span className="col-span-8 text-zinc-200 font-black">CV. TORAS BENAUNT</span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">NPWP BADAN:</span>
                  <span className="col-span-8 text-zinc-200 font-black">02.485.932.1-402.000</span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">KAP / KJS:</span>
                  <span className="col-span-8 text-zinc-100 font-black">
                    {selectedReceipt.mapCode} / 100 - {selectedReceipt.taxType.split('(')[0]}
                  </span>
                </div>

                {selectedReceipt.billingCode && (
                  <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                    <span className="col-span-4 text-zinc-500 font-bold uppercase">ID BILLING:</span>
                    <span className="col-span-8 text-zinc-200 font-black text-left">{selectedReceipt.billingCode}</span>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">MASA / TAHUN:</span>
                  <span className="col-span-8 text-zinc-200 font-black uppercase text-left">
                    {selectedReceipt.month} {selectedReceipt.year}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">NOMINAL SETORAN:</span>
                  <span className="col-span-8 text-emerald-400 font-black text-xs text-left">
                    Rp {selectedReceipt.amount.toLocaleString('id-ID')},00
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">TERBILANG:</span>
                  <span className="col-span-8 text-zinc-300 font-bold capitalize leading-normal text-left">
                    # {convertAmountToTerbilang(selectedReceipt.amount)} Rupiah #
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">KODE NTPN:</span>
                  <span className="col-span-8 text-amber-400 font-black tracking-[0.15em] select-all text-left">
                    {selectedReceipt.ntpn}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-white/[0.06] text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">SALURAN SETOR:</span>
                  <span className="col-span-8 text-zinc-200 font-black text-left">{selectedReceipt.bankName}</span>
                </div>

                <div className="grid grid-cols-12 gap-2 text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">TANGGAL SETOR:</span>
                  <span className="col-span-8 text-zinc-200 font-black text-left">{selectedReceipt.paymentDate}</span>
                </div>

              </div>

              {/* State Seal bottom warning */}
              <div className="mt-5 text-[9px] text-zinc-500 font-bold uppercase leading-relaxed text-center relative z-10">
                Dokumen ini dicetak secara elektronik oleh CV. Toras Benaunt ERP melalui interkoneksi langsung dengan modul MPN G3 Direktorat Jenderal Perbendaharaan Negara. Bukti ini memiliki kekuatan hukum yang sah setara Surat Setoran Pajak (SSP).
              </div>

              {/* Modal controls */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
                <button
                  onClick={() => {
                    triggerNotification(`Mengunduh berkas bukti resmi NTPN ${selectedReceipt.ntpn}...`);
                  }}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs font-black uppercase text-amber-400 tracking-[0.1em] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Cetak / Unduh BPN PDF
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex-1 py-3 bg-zinc-850 hover:bg-white/[0.06] text-zinc-300 text-xs font-black uppercase rounded-xl tracking-[0.1em] transition-all cursor-pointer"
                >
                  Tutup Rincian
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}

        {depositToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050510] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                  <Trash2 className="w-5 h-5 animate-bounce" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-black text-zinc-100 uppercase tracking-[0.15em]">
                    Hapus Bukti Setor?
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                    Konfirmasi Penghapusan Setoran Pajak
                  </p>
                </div>
              </div>

              <div className="text-left space-y-2 text-xs text-zinc-400 font-bold">
                <p>Apakah Anda yakin ingin menghapus catatan penyetoran pajak berikut?</p>
                <div className="p-3 bg-[#0a0a1a]/80 backdrop-blur-xl border border-white/[0.08] rounded-xl space-y-1">
                  <p className="text-[10px] text-zinc-500 uppercase">Jenis Setoran:</p>
                  <p className="text-zinc-100 font-black">{depositToDelete.taxType}</p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-2">Jumlah Disetor:</p>
                  <p className="text-emerald-400 font-black font-mono">Rp {depositToDelete.amount.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-2">NTPN:</p>
                  <p className="text-zinc-300 font-mono font-black">{depositToDelete.ntpn}</p>
                </div>
                <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                  Tindakan ini permanen dan tidak dapat dibatalkan dalam basis data pencatatan CV. Toras Benaunt.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setDepositToDelete(null)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-white/[0.08] text-zinc-300 text-xs font-black uppercase rounded-xl tracking-[0.1em] transition-all duration-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={executeDeleteDeposit}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-500/20 text-white text-xs font-black uppercase rounded-xl tracking-[0.1em] shadow-lg transition-all duration-200 cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
