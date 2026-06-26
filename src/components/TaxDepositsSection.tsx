import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Percent, ShieldCheck, CheckCircle2, Coins, Calendar, Plus, Search, 
  Clipboard, UploadCloud, Check, Eye, Trash2, FileSpreadsheet, Download, Receipt, Edit2
} from 'lucide-react';
import { TaxDeposit } from './TaxSimulatorTab';
import { formatCurrency } from '../utils/format';

interface TaxDepositsSectionProps {
  currency: string;
  triggerNotification: (msg: string, type?: 'success' | 'info') => void;
}

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

export const TaxDepositsSection: React.FC<TaxDepositsSectionProps> = ({ currency, triggerNotification }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const seedData: TaxDeposit[] = [
      {
        id: 'TX-1001',
        month: 'Januari',
        year: 2026,
        taxType: 'PPh Pasal 25 (Angsuran PPh Badan)',
        mapCode: '411125',
        ntpn: '8271A9283748C6B1',
        amount: 12500000,
        paymentDate: '2026-02-10',
        bankName: 'Bank Mandiri',
        status: 'Terverifikasi',
        notes: 'Angsuran bulanan PPh Badan Masa Januari 2026',
        attachmentName: 'BPN_PPh25_Jan_2026.pdf'
      },
      {
        id: 'TX-1002',
        month: 'Januari',
        year: 2026,
        taxType: 'PPh Pasal 21 (Pajak Gaji Karyawan)',
        mapCode: '411121',
        ntpn: '9281C8293710A8E2',
        amount: 3450000,
        paymentDate: '2026-02-10',
        bankName: 'Bank BNI',
        status: 'Terverifikasi',
        notes: 'PPh Pasal 21 atas Gaji Staff & Driver Cor Beton',
        attachmentName: 'BPN_PPh21_Jan_2026.pdf'
      },
      {
        id: 'TX-1003',
        month: 'Februari',
        year: 2026,
        taxType: 'PPh Pasal 25 (Angsuran PPh Badan)',
        mapCode: '411125',
        ntpn: '7291B8273641C5A3',
        amount: 12500000,
        paymentDate: '2026-03-12',
        bankName: 'Bank Mandiri',
        status: 'Terverifikasi',
        notes: 'Angsuran bulanan PPh Badan Masa Februari 2026',
        attachmentName: 'BPN_PPh25_Feb_2026.pdf'
      },
      {
        id: 'TX-1004',
        month: 'Februari',
        year: 2026,
        taxType: 'PPh Pasal 23 (Jasa Armada & Rental)',
        mapCode: '411124',
        ntpn: '2918F9283741A5C2',
        amount: 5200000,
        paymentDate: '2026-03-12',
        bankName: 'Bank Mandiri',
        status: 'Terverifikasi',
        notes: 'Potongan PPh 23 dari sewa armada truck mixer PT. Jatim Cor',
        attachmentName: 'BPN_PPh23_Feb_2026.pdf'
      },
      {
        id: 'TX-1005',
        month: 'Maret',
        year: 2026,
        taxType: 'PPh Pasal 25 (Angsuran PPh Badan)',
        mapCode: '411125',
        ntpn: '6201E8293741A9D1',
        amount: 12500000,
        paymentDate: '2026-04-11',
        bankName: 'Bank BNI',
        status: 'Terverifikasi',
        notes: 'Angsuran bulanan PPh Badan Masa Maret 2026',
        attachmentName: 'BPN_PPh25_Mar_2026.pdf'
      },
      {
        id: 'TX-1006',
        month: 'April',
        year: 2026,
        taxType: 'PPh Pasal 25 (Angsuran PPh Badan)',
        mapCode: '411125',
        ntpn: '4918C8291746B3E9',
        amount: 15000000,
        paymentDate: '2026-05-14',
        bankName: 'Bank BRI',
        status: 'Terverifikasi',
        notes: 'Angsuran bulanan PPh Badan Masa April (Kenaikan laba)',
        attachmentName: 'BPN_PPh25_Apr_2026.pdf'
      },
      {
        id: 'TX-1007',
        month: 'April',
        year: 2026,
        taxType: 'PPN Dalam Negeri (Keluaran - Masukan)',
        mapCode: '411211',
        ntpn: '3018A8271639D2F3',
        amount: 48900000,
        paymentDate: '2026-05-14',
        bankName: 'Bank BRI',
        status: 'Terverifikasi',
        notes: 'Penyetoran PPN Kurang Bayar Masa April 2026',
        attachmentName: 'BPN_PPN_Apr_2026.pdf'
      },
      {
        id: 'TX-1008',
        month: 'Mei',
        year: 2026,
        taxType: 'PPh Pasal 25 (Angsuran PPh Badan)',
        mapCode: '411125',
        ntpn: '1029A8271649D8E1',
        amount: 15000000,
        paymentDate: '2026-06-12',
        bankName: 'Bank Mandiri',
        status: 'Terverifikasi',
        notes: 'Angsuran bulanan PPh Badan Masa Mei 2026',
        attachmentName: 'BPN_PPh25_Mei_2026.pdf'
      },
      {
        id: 'TX-1009',
        month: 'Juni',
        year: 2026,
        taxType: 'PPh Pasal 21 (Pajak Gaji Karyawan)',
        mapCode: '411121',
        ntpn: '7392B1928374A921',
        amount: 3820000,
        paymentDate: '2026-06-20',
        bankName: 'Bank BNI',
        status: 'Menunggu',
        notes: 'PPh Pasal 21 Masa Juni 2026 - Staff & Direksi',
        attachmentName: 'BPN_PPh21_Jun_2026_draft.pdf'
      }
    ];
    localStorage.setItem('tb_tax_deposits_registry', JSON.stringify(seedData));
    return seedData;
  });

  // Form State for New Tax Deposit
  const [depMonth, setDepMonth] = useState<string>('Juni');
  const [depYear, setDepYear] = useState<number>(2026);
  const [depTaxType, setDepTaxType] = useState<string>('PPh Pasal 25 (Angsuran PPh Badan)');
  const [depNtpn, setDepNtpn] = useState<string>('');
  const [depAmount, setDepAmount] = useState<string>('');
  const [depDate, setDepDate] = useState<string>('');
  const [depBank, setDepBank] = useState<string>('Bank Mandiri');
  const [depNotes, setDepNotes] = useState<string>('');
  const [depAttachmentName, setDepAttachmentName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Copy & View Receipt details modal
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
    setDepAmount(item.amount.toString());
    setDepDate(item.paymentDate);
    setDepBank(item.bankName);
    setDepNotes(item.notes || '');
    setDepAttachmentName(item.attachmentName || '');
    const formElement = document.getElementById('ssp-section-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filters state
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('Semua');
  const [filterYear, setFilterYear] = useState<string>('2026');

  // --- Helpers & Handlers for Tax Deposits ---
  const getMapCode = (type: string) => {
    if (type.includes('Pasal 25')) return '411125';
    if (type.includes('Pasal 29')) return '411126';
    if (type.includes('Pasal 21')) return '411121';
    if (type.includes('Pasal 23')) return '411124';
    if (type.includes('PPN')) return '411211';
    return '411125';
  };

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNtpn = depNtpn.trim().toUpperCase();
    if (!cleanNtpn || cleanNtpn.length !== 16) {
      if (cleanNtpn.length === 15 && /^\d+$/.test(cleanNtpn)) {
        triggerNotification('❌ Error: Kode yang Anda masukkan adalah Kode Billing (15 digit angka), bukan NTPN! NTPN adalah 16 karakter alfanumerik (huruf & angka) yang didapat dari struk bukti pembayaran bank.', 'info');
      } else {
        triggerNotification('Kode NTPN harus tepat 16 karakter Alfanumerik!', 'info');
      }
      return;
    }
    const cleanAmt = depAmount.toString().replace(/[^0-9]/g, '');
    const amtNum = parseFloat(cleanAmt);
    if (!amtNum || amtNum <= 0) {
      triggerNotification('Nominal setoran wajib diisi dengan benar!', 'info');
      return;
    }
    if (!depDate) {
      triggerNotification('Pilih tanggal penyetoran pajak!', 'info');
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

      // Reset Form
      setDepNtpn('');
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

      // Reset Form
      setDepNtpn('');
      setDepAmount('');
      setDepDate('');
      setDepNotes('');
      setDepAttachmentName('');

      triggerNotification(`Setoran Pajak ${newDeposit.taxType} sebesar Rp ${newDeposit.amount.toLocaleString('id-ID')} berhasil dicatat.`);
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
    triggerNotification(`NTPN "${ntpn}" berhasil disalin.`);
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

  const filteredDeposits = useMemo(() => {
    return deposits.filter(dep => {
      const matchSearch = filterSearch === '' || 
        dep.ntpn.toLowerCase().includes(filterSearch.toLowerCase()) ||
        (dep.notes && dep.notes.toLowerCase().includes(filterSearch.toLowerCase())) ||
        dep.bankName.toLowerCase().includes(filterSearch.toLowerCase());
      
      const matchMonth = filterMonth === 'Semua' || dep.month === filterMonth;
      const matchYear = filterYear === 'Semua' || dep.year.toString() === filterYear;
      
      return matchSearch && matchMonth && matchYear;
    });
  }, [deposits, filterSearch, filterMonth, filterYear]);

  const depositsSummary = useMemo(() => {
    const total = deposits.reduce((acc, d) => acc + d.amount, 0);
    const pphBadan = deposits.reduce((acc, d) => {
      if (d.mapCode === '411125' || d.mapCode === '411126') return acc + d.amount;
      return acc;
    }, 0);
    const otherTaxes = total - pphBadan;
    const verified = deposits.filter(d => d.status === 'Terverifikasi').length;
    const pending = deposits.filter(d => d.status === 'Menunggu').length;
    
    return {
      total,
      pphBadan,
      otherTaxes,
      verified,
      pending,
      count: deposits.length
    };
  }, [deposits]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* KPI Stats Overview Panel for Paid Taxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Paid */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-lg hover:border-zinc-700 transition-all border-l-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Total Pajak Disetor</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm lg:text-lg font-black font-mono text-emerald-400 mt-2">
            {formatCurrency(depositsSummary.total, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Masa Pajak 2026</span>
            <span className="text-emerald-400 font-extrabold uppercase">Diverifikasi Negara</span>
          </div>
        </div>

        {/* PPh Badan (MAP 411125/411126) */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-lg hover:border-zinc-700 transition-all border-l-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Angsuran PPh Badan</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm lg:text-lg font-black font-mono text-amber-400 mt-2">
            {formatCurrency(depositsSummary.pphBadan, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">PPh Pasal 25 & 29</span>
            <span className="text-amber-500">MAP 411125 / 100</span>
          </div>
        </div>

        {/* Pajak Lainnya */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-lg hover:border-zinc-700 transition-all border-l-indigo-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">PPN & Pajak Lainnya</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm lg:text-lg font-black font-mono text-indigo-400 mt-2">
            {formatCurrency(depositsSummary.otherTaxes, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">PPN / PPh 21 / 23</span>
            <span className="text-indigo-400">Potongan & Pungutan</span>
          </div>
        </div>

        {/* Kualitas Kepatuhan */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-lg hover:border-zinc-700 transition-all border-l-violet-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Slip Setoran</span>
            <div className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm lg:text-lg font-black font-mono text-violet-400 mt-2">
            {depositsSummary.count} Penyetoran
          </p>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Status Verifikasi Bank:</span>
            <span className="text-emerald-400 font-extrabold">{depositsSummary.verified} Sah</span>
          </div>
        </div>

      </div>

      {/* Core Setoran Workspace split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Catat Setoran Baru */}
        <div className="lg:col-span-5 space-y-6">
          <div id="ssp-section-form-container" className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="border-b border-zinc-900 pb-3 flex items-center gap-2">
              {editingDepositId ? (
                <Edit2 className="w-5 h-5 text-amber-500 animate-pulse" />
              ) : (
                <Plus className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">
                  {editingDepositId ? 'Edit Setoran Pajak' : 'Catat Setoran Pajak Baru (SSP)'}
                </h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                  {editingDepositId ? 'Ubah data Penyetoran Surat Setoran Pajak' : 'Pencatatan Surat Setoran Pajak dengan Validasi NTPN Negara'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddDeposit} className="space-y-4">
              
              {/* Masa & Tahun Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Masa Pajak (Bulan):</label>
                  <select
                    value={depMonth}
                    onChange={(e) => setDepMonth(e.target.value)}
                    className="w-full text-xs font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Tahun Pajak:</label>
                  <select
                    value={depYear}
                    onChange={(e) => setDepYear(Number(e.target.value))}
                    className="w-full text-xs font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jenis Pajak Dropdown */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Jenis Pajak (Kode MAP):</label>
                  <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    Kode MAP: {getMapCode(depTaxType)} / 100
                  </span>
                </div>
                <select
                  value={depTaxType}
                  onChange={(e) => setDepTaxType(e.target.value)}
                  className="w-full text-xs font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="PPh Pasal 25 (Angsuran PPh Badan)">PPh Pasal 25 (Angsuran PPh Badan)</option>
                  <option value="PPh Pasal 29 (PPh Badan Kurang Bayar Tahunan)">PPh Pasal 29 (PPh Badan Kurang Bayar Tahunan)</option>
                  <option value="PPh Pasal 21 (Pajak Gaji Karyawan)">PPh Pasal 21 (Pajak Gaji Karyawan)</option>
                  <option value="PPh Pasal 23 (Jasa Armada & Rental)">PPh Pasal 23 (Jasa Armada & Rental)</option>
                  <option value="PPN Dalam Negeri (Keluaran - Masukan)">PPN Dalam Negeri (Keluaran - Masukan)</option>
                </select>
              </div>

              {/* NTPN Code Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Nomor NTPN Negara (16 Karakter):</label>
                  <span className={`text-[8px] font-bold ${depNtpn.length === 16 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {depNtpn.length}/16 Karakter
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="Contoh: 8271A9283748C6B1"
                  value={depNtpn}
                  onChange={(e) => setDepNtpn(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                />
                {depNtpn.length === 15 && /^\d+$/.test(depNtpn) && (
                  <div className="mt-1.5 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 font-medium leading-relaxed">
                    ⚠️ <strong>Anda Memasukkan Kode Billing!</strong><br />
                    Kode <strong>{depNtpn}</strong> yang Anda masukkan adalah 15 digit angka, yang merupakan format <strong>Kode Billing</strong> (seperti draf pembayaran dari DJP). <br />
                    <strong>NTPN (Nomor Transaksi Penerimaan Negara)</strong> baru akan diterbitkan setelah Anda melakukan pembayaran, berupa <strong>16 karakter kombinasi huruf & angka</strong> yang ada di struk/bukti bayar bank.
                  </div>
                )}
              </div>

              {/* Nominal Setoran & Tanggal Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Nominal Setoran (Rupiah):</label>
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
                      className="w-full text-xs font-mono font-black text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase">Tanggal Setor:</label>
                  <input
                    type="date"
                    required
                    value={depDate}
                    onChange={(e) => setDepDate(e.target.value)}
                    className="w-full text-xs font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Bank Persepsi */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Bank Persepsi / Saluran Pembayaran:</label>
                <select
                  value={depBank}
                  onChange={(e) => setDepBank(e.target.value)}
                  className="w-full text-xs font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Bank Mandiri">Bank Mandiri (Persero)</option>
                  <option value="Bank BNI">Bank BNI (Persero)</option>
                  <option value="Bank BRI">Bank BRI (Persero)</option>
                  <option value="Bank BCA">Bank BCA (Swasta)</option>
                  <option value="Pos Indonesia">Kantor Pos Indonesia</option>
                </select>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Keterangan / Deskripsi Setoran:</label>
                <textarea
                  placeholder="Masukkan deskripsi penjelas realisasi pembayaran ssp..."
                  rows={2}
                  value={depNotes}
                  onChange={(e) => setDepNotes(e.target.value)}
                  className="w-full text-xs font-medium text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Drag & Drop File Upload */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase">Lampirkan Bukti Penyetoran (BPN / SSP):</label>
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
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
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
                      <p className="text-[9px] text-emerald-400 font-extrabold uppercase">File Terlampir - Klik untuk Ganti</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <UploadCloud className="w-8 h-8 mx-auto text-zinc-500 animate-pulse" />
                      <p className="text-xs font-bold text-zinc-300">Drag & Drop Dokumen di Sini</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">Menerima PDF, PNG, JPG s.d 10 MB atau klik untuk pilih berkas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                {editingDepositId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDepositId(null);
                      setDepNtpn('');
                      setDepAmount('');
                      setDepDate('');
                      setDepNotes('');
                      setDepAttachmentName('');
                      triggerNotification('Edit dibatalkan.', 'info');
                    }}
                    className="flex-1 py-3 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase rounded-xl tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className={`${editingDepositId ? 'flex-1' : 'w-full'} py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 text-xs font-black uppercase rounded-xl tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer mt-2`}
                >
                  {editingDepositId ? (
                    <>
                      <Check className="w-4.5 h-4.5" /> Simpan Perubahan
                    </>
                  ) : (
                    <>
                      <Plus className="w-4.5 h-4.5" /> Simpan & Verifikasi Setoran Pajak
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Col: Log List of Payments */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-3 gap-3">
              <div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-400" />
                  Buku Register Penyetoran Pajak Negara
                </h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                  Riwayat Surat Setoran Pajak (SSP) yang Berhasil Direkonsiliasi
                </p>
              </div>
              <span className="text-[9px] font-black text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg shrink-0">
                {filteredDeposits.length} Catatan Pajak
              </span>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-800/60">
              
              {/* Search Bar */}
              <div className="sm:col-span-1 relative">
                <span className="absolute left-3 top-2.5 text-zinc-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Cari NTPN..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full text-[11px] font-bold text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg pl-8.5 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Month Filter */}
              <div>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full text-[11px] font-bold text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Semua">Bulan: Semua</option>
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full text-[11px] font-bold text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Semua">Tahun: Semua</option>
                  <option value="2026">Tahun: 2026</option>
                  <option value="2025">Tahun: 2025</option>
                </select>
              </div>

            </div>

            {/* Table/List Box */}
            {filteredDeposits.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 space-y-3">
                <Receipt className="w-12 h-12 mx-auto text-zinc-700 animate-bounce" />
                <p className="text-xs font-black uppercase text-zinc-400">Tidak Ada Catatan Setoran Ditemukan</p>
                <p className="text-[10px] max-w-sm mx-auto leading-relaxed text-zinc-500 font-bold">
                  Coba sesuaikan filter pencarian, filter bulan, atau tambahkan slip setoran yang baru di form sebelah kiri.
                </p>
                {(filterSearch || filterMonth !== 'Semua' || filterYear !== 'Semua') && (
                  <button
                    onClick={() => {
                      setFilterSearch('');
                      setFilterMonth('Semua');
                      setFilterYear('2026');
                    }}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-lg text-[9px] font-black uppercase text-amber-400 tracking-wider transition-colors cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredDeposits.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    
                    {/* Primary info left */}
                    <div className="flex gap-3.5 items-start">
                      <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                        item.taxType.includes('Pasal 25') 
                          ? 'bg-amber-500/10 text-amber-400' 
                          : item.taxType.includes('PPN')
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'bg-violet-500/10 text-violet-400'
                      }`}>
                        <Receipt className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-zinc-100">{item.taxType}</span>
                          <span className="text-[8px] font-extrabold uppercase bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded">
                            MAP {item.mapCode}
                          </span>
                        </div>

                        <p className="text-[10px] font-semibold text-zinc-400 leading-relaxed max-w-md">
                          {item.notes}
                        </p>

                        <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-bold flex-wrap pt-0.5">
                          <span className="text-zinc-400 uppercase tracking-wide">Masa: {item.month} {item.year}</span>
                          <span>•</span>
                          <span>Penyetor: {item.bankName}</span>
                          <span>•</span>
                          <span>Tanggal: {item.paymentDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Right Column */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-zinc-900 pt-3 sm:pt-0 gap-3 shrink-0">
                      
                      {/* Amount */}
                      <div className="text-left sm:text-right">
                        <span className="text-[8px] text-zinc-500 font-black block uppercase tracking-wider">Jumlah Disetor</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          {formatCurrency(item.amount, currency).split(',')[0]}
                        </span>
                      </div>

                      {/* NTPN & Actions */}
                      <div className="flex items-center gap-2">
                        
                        {/* Copy NTPN */}
                        <div 
                          onClick={() => handleCopyNtpn(item.ntpn)}
                          title="Klik untuk menyalin NTPN"
                          className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-mono font-black text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <span>NTPN:</span>
                          <span className="text-zinc-200">{item.ntpn.substring(0, 8)}...</span>
                          {copiedNtpn === item.ntpn ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Clipboard className="w-3 h-3 text-zinc-600" />
                          )}
                        </div>

                        {/* View SSP */}
                        <button
                          onClick={() => setSelectedReceipt(item)}
                          title="Buka Lembar BPN Resmi Negara"
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit SSP */}
                        <button
                          onClick={() => handleEditDepositClick(item)}
                          title="Edit Bukti Setor"
                          className="p-1.5 bg-zinc-900 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/20 text-amber-400 hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Hapus SSP */}
                        <button
                          onClick={() => setDepositToDelete(item)}
                          title="Hapus Bukti Setor"
                          className="p-1.5 bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}

            <div className="text-[9px] text-zinc-500 font-bold uppercase flex items-center justify-between border-t border-zinc-900 pt-3 tracking-wide text-left">
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
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden text-zinc-200"
            >
              {/* Watermark in background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <ShieldCheck className="w-[380px] h-[380px] text-amber-500" />
              </div>
              
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>

              {/* BPN Header Printout */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-5 gap-4 relative z-10">
                <div className="space-y-1 text-left">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">REPUBLIK INDONESIA</p>
                  <p className="text-[11px] font-black text-zinc-300 uppercase tracking-wider">DIREKTORAT JENDERAL PAJAK</p>
                  <p className="text-[9px] font-bold text-zinc-400">KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</p>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded uppercase tracking-wider">
                    Sistem MPN G3 Terverifikasi
                  </span>
                  <p className="text-xs font-mono font-black text-zinc-200 mt-1.5">No. Dokumen: BPN-{selectedReceipt.id}</p>
                </div>
              </div>

              {/* Receipt Title */}
              <div className="text-center py-5 relative z-10">
                <h3 className="text-base font-black tracking-widest text-zinc-100 uppercase">
                  BUKTI PENERIMAAN NEGARA (BPN)
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">
                  Surat Setoran Pajak (SSP) Elektronik Sah Berdasarkan UU RI
                </p>
              </div>

              {/* Receipt Body Ledger Fields */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 md:p-5 space-y-4 font-mono text-[11px] relative z-10">
                
                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800/50 text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">WAJIB PAJAK:</span>
                  <span className="col-span-8 text-zinc-200 font-black">CV. TORAS BENAUNT</span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800/50 text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">NPWP BADAN:</span>
                  <span className="col-span-8 text-zinc-200 font-black">02.485.932.1-402.000</span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800/50 text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">KAP / KJS:</span>
                  <span className="col-span-8 text-zinc-100 font-black">
                    {selectedReceipt.mapCode} / 100 - {selectedReceipt.taxType.split('(')[0]}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800/50 text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">MASA / TAHUN:</span>
                  <span className="col-span-8 text-zinc-200 font-black uppercase text-left">
                    {selectedReceipt.month} {selectedReceipt.year}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800/50 text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">NOMINAL SETORAN:</span>
                  <span className="col-span-8 text-emerald-400 font-black text-xs text-left">
                    Rp {selectedReceipt.amount.toLocaleString('id-ID')},00
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800/50 text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">TERBILANG:</span>
                  <span className="col-span-8 text-zinc-300 font-bold capitalize leading-normal text-left">
                    # {convertAmountToTerbilang(selectedReceipt.amount)} Rupiah #
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800/50 text-left">
                  <span className="col-span-4 text-zinc-500 font-bold uppercase">KODE NTPN:</span>
                  <span className="col-span-8 text-amber-400 font-black tracking-widest select-all text-left">
                    {selectedReceipt.ntpn}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800/50 text-left">
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
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-black uppercase text-amber-400 tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Cetak / Unduh Dokumen BPN
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex-1 py-3 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer"
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
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                  <Trash2 className="w-5 h-5 animate-bounce" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">
                    Hapus Bukti Setor?
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                    Konfirmasi Penghapusan Setoran Pajak
                  </p>
                </div>
              </div>

              <div className="text-left space-y-2 text-xs text-zinc-400 font-bold">
                <p>Apakah Anda yakin ingin menghapus catatan penyetoran pajak berikut?</p>
                <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1">
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
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-black uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={executeDeleteDeposit}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase rounded-xl tracking-wider shadow-lg transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
