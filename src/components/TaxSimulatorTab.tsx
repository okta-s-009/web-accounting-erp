/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ERPDatabase, generateIncomeStatement } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { motion, AnimatePresence } from 'motion/react';
import { TaxDepositsSection } from './TaxDepositsSection';
import { 
  Percent, TrendingUp, TrendingDown, Layers, ShieldCheck, 
  FileText, Calculator, Download, Save, Trash2, HelpCircle, 
  Info, Coins, FileSpreadsheet, RefreshCw, ChevronRight, CheckCircle2,
  AlertTriangle, Eye, ArrowUpRight, Award, Receipt,
  Calendar, Plus, Search, Clipboard, UploadCloud, Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface TaxSimulatorTabProps {
  db: ERPDatabase;
}

interface SavedSimulation {
  id: string;
  name: string;
  date: string;
  omzet: number;
  hpp: number;
  biaya: number;
  tax: number;
  rate: number;
}

export interface TaxDeposit {
  id: string;
  month: string;
  year: number;
  taxType: string;
  mapCode: string;
  ntpn: string;
  amount: number;
  paymentDate: string;
  bankName: string;
  status: 'Terverifikasi' | 'Menunggu';
  notes?: string;
  attachmentName?: string;
}

export const TaxSimulatorTab: React.FC<TaxSimulatorTabProps> = ({ db }) => {
  const currency = db.activeCurrency;

  // --- 1. Load Actual Financial Data from Database ---
  const incomeReport = useMemo(() => {
    // Generates overall income statement based on sales, purchases, journals
    return generateIncomeStatement(db, 'Semua Cabang');
  }, [db]);

  const totalSalesAmount = useMemo(() => {
    return db.salesInvoices.reduce((acc, inv) => acc + inv.subtotal, 0);
  }, [db.salesInvoices]);

  // Actual Values
  const actualOmzet = totalSalesAmount;
  const actualHpp = incomeReport.totalCogs;
  const actualLabaKotor = actualOmzet - actualHpp;
  const actualBiaya = incomeReport.totalExpenses;
  const actualLabaBersih = actualLabaKotor - actualBiaya;

  // --- 2. State management for Simulator ---
  const [isSimulatorActive, setIsSimulatorActive] = useState<boolean>(false);
  const [simulatedOmzet, setSimulatedOmzet] = useState<number>(actualOmzet || 5000000000); // Default to actual or 5B
  const [simulatedHpp, setSimulatedHpp] = useState<number>(actualHpp || 3500000000);
  const [simulatedBiaya, setSimulatedBiaya] = useState<number>(actualBiaya || 800000000);
  
  const [simName, setSimName] = useState<string>('');
  const [savedSims, setSavedSims] = useState<SavedSimulation[]>([]);
  const [activeExplainTab, setActiveExplainTab] = useState<'pasal31e' | 'tarifnormal' | 'spt1771'>('pasal31e');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // --- Sub-Tab & Paid Taxes (SSP) State Management ---
  const [activeSubTab, setActiveSubTab] = useState<'kalkulator' | 'setoran'>('kalkulator');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed initial tax deposits to localStorage if not exists
  const [deposits, setDeposits] = useState<TaxDeposit[]>(() => {
    const stored = localStorage.getItem('tb_tax_deposits_registry');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Gagal load data setoran pajak", e);
      }
    }
    
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
  const [depAttachment, setDepAttachment] = useState<File | null>(null);
  const [depAttachmentName, setDepAttachmentName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Copy & View Receipt details modal
  const [copiedNtpn, setCopiedNtpn] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<TaxDeposit | null>(null);

  // Filters state
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('Semua');
  const [filterType, setFilterType] = useState<string>('Semua');
  const [filterYear, setFilterYear] = useState<string>('2026');

  // Initialize inputs if actual database changes
  useEffect(() => {
    if (actualOmzet > 0) {
      setSimulatedOmzet(actualOmzet);
      setSimulatedHpp(actualHpp);
      setSimulatedBiaya(actualBiaya);
    }
  }, [actualOmzet, actualHpp, actualBiaya]);

  // Load Saved Simulations from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('tb_saved_tax_simulations');
    if (stored) {
      try {
        setSavedSims(JSON.parse(stored));
      } catch (e) {
        console.error("Gagal load simulasi pajak", e);
      }
    }
  }, []);

  // Show notification helpers
  const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

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
    if (!depNtpn.trim() || depNtpn.trim().length !== 16) {
      triggerNotification('Kode NTPN harus tepat 16 karakter Alfanumerik!', 'info');
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

    const newDeposit: TaxDeposit = {
      id: 'TX-' + Date.now().toString().substring(8),
      month: depMonth,
      year: depYear,
      taxType: depTaxType,
      mapCode: getMapCode(depTaxType),
      ntpn: depNtpn.trim().toUpperCase(),
      amount: amtNum,
      paymentDate: depDate,
      bankName: depBank,
      status: 'Terverifikasi',
      notes: depNotes || `Penyetoran ${depTaxType} Masa ${depMonth} ${depYear}`,
      attachmentName: depAttachmentName || `SSP_BPN_${depNtpn.trim().substring(0, 6).toUpperCase()}.pdf`
    };

    const updated = [newDeposit, ...deposits];
    setDeposits(updated);
    localStorage.setItem('tb_tax_deposits_registry', JSON.stringify(updated));

    // Reset Form
    setDepNtpn('');
    setDepAmount('');
    setDepDate('');
    setDepNotes('');
    setDepAttachment(null);
    setDepAttachmentName('');

    triggerNotification(`Setoran Pajak ${newDeposit.taxType} sebesar Rp ${newDeposit.amount.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  const handleDeleteDeposit = (id: string, taxType: string, amount: number) => {
    const updated = deposits.filter(d => d.id !== id);
    setDeposits(updated);
    localStorage.setItem('tb_tax_deposits_registry', JSON.stringify(updated));
    triggerNotification(`Catatan setoran ${taxType} senilai Rp ${amount.toLocaleString('id-ID')} dihapus.`);
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
      setDepAttachment(file);
      setDepAttachmentName(file.name);
      triggerNotification(`File "${file.name}" berhasil dilampirkan via Drag & Drop.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setDepAttachment(file);
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
      const matchType = filterType === 'Semua' || dep.taxType.includes(filterType);
      const matchYear = filterYear === 'Semua' || dep.year.toString() === filterYear;
      
      return matchSearch && matchMonth && matchType && matchYear;
    });
  }, [deposits, filterSearch, filterMonth, filterType, filterYear]);

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

  // Tax calculation formula function
  const calculateTaxDetails = (omzetVal: number, hppVal: number, opexVal: number) => {
    const labaKotor = omzetVal - hppVal;
    const labaBersih = labaKotor - opexVal;

    // Rate rules under Indonesia's Income Tax Law (UU PPh / UU HPP):
    // 1. Omzet <= 4.8 Billion -> 50% discount on standard 22% rate = 11% effective tax
    // 2. Omzet > 50 Billion -> No discount = 22% rate
    // 3. Omzet between 4.8 Billion and 50 Billion -> Proportional facility (Pasal 31E)
    //    The portion of taxable income corresponding to turnover up to 4.8B gets a 50% discount (11%)
    //    The remaining taxable income portion gets standard rate (22%)
    let rate = 0.22;
    let rateExplanation = '';
    let formulaType = '';
    let facilityPortion = 0;
    let nonFacilityPortion = 0;

    if (omzetVal <= 4800000000) {
      rate = 0.11;
      rateExplanation = 'Fasilitas Penuh Pasal 31E UU HPP (Omzet ≤ Rp 4,8 Miliar) - Tarif Efektif 11%';
      formulaType = 'FASILITAS_PENUH';
      facilityPortion = labaBersih > 0 ? labaBersih : 0;
      nonFacilityPortion = 0;
    } else if (omzetVal > 50000000000) {
      rate = 0.22;
      rateExplanation = 'Tarif Normal Non-Fasilitas (Omzet > Rp 50 Miliar) - Tarif Efektif 22%';
      formulaType = 'NON_FASILITAS';
      facilityPortion = 0;
      nonFacilityPortion = labaBersih > 0 ? labaBersih : 0;
    } else {
      // Proportional under Pasal 31E:
      // portionWithFacility = 4.8 Billion / Total Omzet
      // Laba Bersih Kena Fasilitas = portionWithFacility * Laba Bersih
      // Laba Bersih Non-Fasilitas = Sisa Laba Bersih
      const portionWithFacility = 4800000000 / omzetVal;
      facilityPortion = labaBersih > 0 ? portionWithFacility * labaBersih : 0;
      nonFacilityPortion = labaBersih > 0 ? (1 - portionWithFacility) * labaBersih : 0;
      
      // Effective rate = (facilityPortion * 11% + nonFacilityPortion * 22%) / labaBersih
      rate = (portionWithFacility * 0.11) + ((1 - portionWithFacility) * 0.22);
      rateExplanation = 'Fasilitas Proporsional Pasal 31E (Omzet Rp 4,8 M s.d Rp 50 M) - Tarif Campuran';
      formulaType = 'PROPORSI_31E';
    }

    const calculatedTax = labaBersih > 0 ? (facilityPortion * 0.11) + (nonFacilityPortion * 0.22) : 0;
    const netProfitAfterTax = labaBersih - calculatedTax;

    return {
      omzet: omzetVal,
      hpp: hppVal,
      labaKotor,
      biaya: opexVal,
      labaBersih,
      rate,
      ratePercentage: rate * 100,
      calculatedTax,
      netProfitAfterTax,
      rateExplanation,
      formulaType,
      facilityPortion,
      nonFacilityPortion,
    };
  };

  // Current active calculation based on simulator status
  const currentCalc = useMemo(() => {
    const omzet = isSimulatorActive ? simulatedOmzet : actualOmzet;
    const hpp = isSimulatorActive ? simulatedHpp : actualHpp;
    const opex = isSimulatorActive ? simulatedBiaya : actualBiaya;
    return calculateTaxDetails(omzet, hpp, opex);
  }, [isSimulatorActive, simulatedOmzet, simulatedHpp, simulatedBiaya, actualOmzet, actualHpp, actualBiaya]);

  // Actual tax details for visual comparison
  const actualCalc = useMemo(() => {
    return calculateTaxDetails(actualOmzet, actualHpp, actualBiaya);
  }, [actualOmzet, actualHpp, actualBiaya]);

  // Handle saving the current simulation
  const handleSaveSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) {
      triggerNotification('Nama simulasi harus diisi', 'info');
      return;
    }

    const newSim: SavedSimulation = {
      id: 'SIM-' + Date.now(),
      name: simName,
      date: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      omzet: currentCalc.omzet,
      hpp: currentCalc.hpp,
      biaya: currentCalc.biaya,
      tax: currentCalc.calculatedTax,
      rate: currentCalc.ratePercentage,
    };

    const updatedList = [newSim, ...savedSims];
    setSavedSims(updatedList);
    localStorage.setItem('tb_saved_tax_simulations', JSON.stringify(updatedList));
    setSimName('');
    triggerNotification(`Simulasi "${newSim.name}" berhasil disimpan ke sistem local.`);
  };

  // Load a saved simulation configuration
  const handleLoadSim = (sim: SavedSimulation) => {
    setIsSimulatorActive(true);
    setSimulatedOmzet(sim.omzet);
    setSimulatedHpp(sim.hpp);
    setSimulatedBiaya(sim.biaya);
    triggerNotification(`Konfigurasi "${sim.name}" berhasil dimuat.`);
  };

  // Delete a saved simulation
  const handleDeleteSim = (id: string, name: string) => {
    const updated = savedSims.filter(s => s.id !== id);
    setSavedSims(updated);
    localStorage.setItem('tb_saved_tax_simulations', JSON.stringify(updated));
    triggerNotification(`Simulasi "${name}" berhasil dihapus.`);
  };

  // Reset simulator values to actual ERP bookkeeping values
  const handleResetToActual = () => {
    setSimulatedOmzet(actualOmzet);
    setSimulatedHpp(actualHpp);
    setSimulatedBiaya(actualBiaya);
    triggerNotification('Parameter simulasi di-reset ke data laporan keuangan riil.', 'info');
  };

  // Formatted data for chart comparisons
  const chartComparisonData = useMemo(() => {
    return [
      {
        name: 'Omzet Pendapatan',
        Buku_Riil: actualCalc.omzet,
        Simulasi: currentCalc.omzet,
      },
      {
        name: 'Laba Bersih (EBT)',
        Buku_Riil: actualCalc.labaBersih,
        Simulasi: currentCalc.labaBersih,
      },
      {
        name: 'Beban PPh Terutang',
        Buku_Riil: actualCalc.calculatedTax,
        Simulasi: currentCalc.calculatedTax,
      }
    ];
  }, [actualCalc, currentCalc]);

  // Data for circular distribution chart (HPP vs Biaya vs Pajak vs Laba Sisa)
  const circularDistributionData = useMemo(() => {
    const { hpp, biaya, calculatedTax, netProfitAfterTax, omzet } = currentCalc;
    const normalizer = omzet > 0 ? omzet : 1;
    return [
      { name: 'HPP / Material', value: Math.max(0, hpp), percentage: (hpp / normalizer) * 100, color: '#6366f1' },
      { name: 'OPEX / Overhead', value: Math.max(0, biaya), percentage: (biaya / normalizer) * 100, color: '#f59e0b' },
      { name: 'PPh Badan Terutang', value: Math.max(0, calculatedTax), percentage: (calculatedTax / normalizer) * 100, color: '#f43f5e' },
      { name: 'Laba Sisa Bersih (EAT)', value: Math.max(0, netProfitAfterTax), percentage: (netProfitAfterTax / normalizer) * 100, color: '#10b981' },
    ];
  }, [currentCalc]);

  // Export Draft SPT as formatted text file
  const handleExportTxt = () => {
    const c = currentCalc;
    const txtContent = `======================================================================
DRAFT FORMULIR SPT 1771 - ESTIMASI PAJAK PPh BADAN
CV. TORAS BENAUNT - GROUP READY MIX & STOCKPILE
======================================================================
Tanggal Cetak   : ${new Date().toLocaleDateString('id-ID')}
Status Laporan  : ${isSimulatorActive ? 'SIMULASI PROYEKSI' : 'BUKU RIIL LAPORAN KEUANGAN'}
Mata Uang       : ${currency}
----------------------------------------------------------------------
1. PENDAPATAN / PEREDARAN BRUTO
   - Realisasi Omzet Penjualan      : Rp ${c.omzet.toLocaleString('id-ID')}
   
2. HARGA POKOK PENJUALAN (HPP)
   - Pembelian Bahan Baku Cor      : Rp ${c.hpp.toLocaleString('id-ID')}
   -----------------------------------------------------------------
   LABA KOTOR (GROSS PROFIT)        : Rp ${c.labaKotor.toLocaleString('id-ID')} (Margin: ${c.omzet > 0 ? ((c.labaKotor / c.omzet) * 100).toFixed(2) : 0}%)

3. BIAYA OPERASIONAL & OVERHEAD (OPEX)
   - Pengeluaran Solar & Armada     : Rp ${c.biaya.toLocaleString('id-ID')}
   -----------------------------------------------------------------
   LABA BERSIH FISKAL (EBT)         : Rp ${c.labaBersih.toLocaleString('id-ID')} (Margin: ${c.omzet > 0 ? ((c.labaBersih / c.omzet) * 100).toFixed(2) : 0}%)

4. PERHITUNGAN FASILITAS PASAL 31E
   - Ketentuan Aturan               : ${c.rateExplanation}
   - Porsi Laba Kena Fasilitas (11%) : Rp ${c.facilityPortion.toLocaleString('id-ID')}
   - Porsi Laba Non-Fasilitas (22%) : Rp ${c.nonFacilityPortion.toLocaleString('id-ID')}
   - Tarif Efektif yang Berlaku     : ${c.ratePercentage.toFixed(4)}%
   -----------------------------------------------------------------
   ESTIMASI PAJAK PPh BADAN TERUTANG: Rp ${c.calculatedTax.toLocaleString('id-ID')}

5. HASIL AKHIR REKONSILIASI
   - Estimasi Laba Setelah Pajak    : Rp ${c.netProfitAfterTax.toLocaleString('id-ID')}
======================================================================
Dokumen ini merupakan estimasi otomatis berbasis database ERP internal.
======================================================================`;

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Estimasi_SPT_1771_CV_TB_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('Draft SPT 1771 berhasil diexport ke format teks (.txt)');
  };

  return (
    <div className="space-y-6 text-zinc-100 font-sans pb-10">
      
      {/* Toast Notification Popups */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-amber-500/30 px-4 py-3 rounded-xl shadow-2xl max-w-sm text-xs"
          >
            <div className="p-1 bg-amber-500/10 text-amber-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-zinc-100 uppercase tracking-wide">Notifikasi Sistem</p>
              <p className="text-zinc-400 font-medium mt-0.5">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Card with Modern Black theme visual aesthetics */}
      <div id="tax-header-banner" className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl p-6 shadow-2xl overflow-hidden border border-zinc-800/80">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20 flex items-center gap-1.5 shadow-sm">
                <Receipt className="w-3.5 h-3.5" /> MODUL PERHITUNGAN PAJAK BADAN
              </span>
              <span className="text-[9px] font-bold text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded border border-zinc-700/60 shadow-sm">
                Formulir 1771 SPT Tahunan PPh Badan
              </span>
            </div>
            <h2 className="text-xl lg:text-3xl font-black tracking-tight text-zinc-50 mt-1">
              Hub Pajak Penghasilan (PPh) Badan Terpadu
            </h2>
            <p className="text-xs text-zinc-300/95 font-medium leading-relaxed max-w-2xl">
              Simulasi & kepatuhan pelaporan SPT Pajak Badan berdasarkan omzet, HPP, serta pengeluaran operasional real-time CV. Toras Benaunt. Memenuhi perhitungan proporsional fasilitas tarif Pasal 31E.
            </p>
          </div>

          {/* Quick Real-Time Sync Indicator */}
          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl shadow-md shrink-0">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 animate-pulse">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">STATUS KONEKSI ERP</span>
              <span className="text-xs font-black text-zinc-100 block">SINKRONISASI REAL-TIME</span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wide block">● DATABASE SIAP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher - Premium Sleek Segmented Switch */}
      <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 max-w-md shadow-inner">
        <button
          onClick={() => setActiveSubTab('kalkulator')}
          className={`flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'kalkulator'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          Kalkulator & Proyeksi SPT
        </button>
        <button
          onClick={() => setActiveSubTab('setoran')}
          className={`flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'setoran'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Setoran Pajak Bulanan
        </button>
      </div>

      {activeSubTab === 'setoran' ? (
        <TaxDepositsSection currency={currency} triggerNotification={triggerNotification} />
      ) : (
        <>
          {/* KPI Stats Overview Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Omzet Card */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-lg hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Perjalanan Omzet</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm lg:text-lg font-black font-mono text-zinc-100 mt-2">
            {formatCurrency(currentCalc.omzet, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Omzet {isSimulatorActive ? 'Simulasi' : 'Buku Riil'}</span>
            <span className="text-indigo-400">Target 100%</span>
          </div>
        </div>

        {/* Laba Bersih Fiskal Card */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-lg hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Laba Bersih Fiskal</span>
            <div className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-sm lg:text-lg font-black font-mono mt-2 ${currentCalc.labaBersih >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
            {formatCurrency(currentCalc.labaBersih, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Margin Laba:</span>
            <span className="text-violet-400">{currentCalc.omzet > 0 ? ((currentCalc.labaBersih / currentCalc.omzet) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>

        {/* Tarif Pajak Efektif Card */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-lg hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Tarif PPh Efektif</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm lg:text-lg font-black font-mono text-amber-400 mt-2">
            {currentCalc.ratePercentage.toFixed(2)}%
          </p>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Sesuai UU HPP</span>
            <span className="text-amber-400 font-black">{currentCalc.omzet <= 4800000000 ? 'Fasilitas Penuh' : currentCalc.omzet > 50000000000 ? 'Normal 22%' : 'Campuran'}</span>
          </div>
        </div>

        {/* PPh Badan Terutang Card */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-lg hover:border-zinc-700 transition-all border-l-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">PPh Badan Terutang</span>
            <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm lg:text-lg font-black font-mono text-rose-400 mt-2 animate-pulse">
            {formatCurrency(currentCalc.calculatedTax, currency)}
          </p>
          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-2 text-[9px] font-bold">
            <span className="text-zinc-500">Estimasi Terutang</span>
            <span className="text-rose-400 font-extrabold uppercase">DRAFT SPT 1771</span>
          </div>
        </div>

      </div>

      {/* CORE WORKSPACE: Left column (Controls, Sliders) & Right column (Report & Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Interactive Sliders & Simulator Configurations (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Simulator Toggle & Setup Box */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">MODE KONTROL PAJAK</span>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                  {isSimulatorActive ? 'SIMULATOR PAJAK PROYEKSI' : 'REKONSILIASI DATA BUKU RIIL'}
                </h3>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => {
                  if (!isSimulatorActive) {
                    setSimulatedOmzet(actualOmzet || 5000000000);
                    setSimulatedHpp(actualHpp || 3500000000);
                    setSimulatedBiaya(actualBiaya || 800000000);
                  }
                  setIsSimulatorActive(!isSimulatorActive);
                }}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isSimulatorActive ? 'bg-amber-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isSimulatorActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Explainer note */}
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
              {isSimulatorActive 
                ? 'Mode simulasi aktif! Anda bebas merancang target omzet usaha, menekan HPP, atau mengatur overhead untuk memprediksi besaran PPh Badan CV. Toras Benaunt.' 
                : 'Menampilkan kalkulasi PPh Badan aktual berdasarkan data pembukuan riil yang tercatat di database ERP saat ini. Aktifkan Mode Simulator di atas untuk melakukan perencanaan pajak (Tax Planning).'}
            </p>

            {/* Sliders Container (Conditional styling based on active state) */}
            <div className={`space-y-4 p-4 rounded-xl border transition-all ${
              isSimulatorActive ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-zinc-950 border-zinc-900 opacity-60 pointer-events-none'
            }`}>
              
              {/* Slider 1: Omzet */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-zinc-300 uppercase text-[9px] flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-indigo-400" /> 1. Proyeksi Omzet Pendapatan
                  </span>
                  <span className="font-mono font-black text-indigo-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {formatCurrency(simulatedOmzet, currency).split(',')[0]}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000000"
                  max="65000000000"
                  step="250000000"
                  value={simulatedOmzet}
                  onChange={(e) => setSimulatedOmzet(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[8px] text-zinc-500 font-bold uppercase">
                  <span>Min: 500 Jt</span>
                  <span>UMKM Limit: 4.8 Miliar</span>
                  <span>Max: 65 Miliar</span>
                </div>
              </div>

              {/* Slider 2: HPP */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-zinc-300 uppercase text-[9px] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" /> 2. Harga Pokok Penjualan (HPP)
                  </span>
                  <span className="font-mono font-black text-amber-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {formatCurrency(simulatedHpp, currency).split(',')[0]}
                  </span>
                </div>
                <input
                  type="range"
                  min="300000000"
                  max={Math.max(300000000, simulatedOmzet * 0.95)}
                  step="200000000"
                  value={simulatedHpp}
                  onChange={(e) => setSimulatedHpp(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[8px] text-zinc-500 font-bold uppercase">
                  <span>Min: 300 Jt</span>
                  <span className="text-zinc-400">Rasio HPP: {simulatedOmzet > 0 ? ((simulatedHpp / simulatedOmzet) * 100).toFixed(0) : 0}%</span>
                  <span>Max: 95% Omzet</span>
                </div>
              </div>

              {/* Slider 3: OPEX */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-zinc-300 uppercase text-[9px] flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> 3. Biaya Operasional / OPEX
                  </span>
                  <span className="font-mono font-black text-rose-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {formatCurrency(simulatedBiaya, currency).split(',')[0]}
                  </span>
                </div>
                <input
                  type="range"
                  min="50000000"
                  max={Math.max(50000000, (simulatedOmzet - simulatedHpp) * 0.95)}
                  step="50000000"
                  value={simulatedBiaya}
                  onChange={(e) => setSimulatedBiaya(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[8px] text-zinc-500 font-bold uppercase">
                  <span>Min: 50 Jt</span>
                  <span className="text-zinc-400">Rasio OPEX: {simulatedOmzet > 0 ? ((simulatedBiaya / simulatedOmzet) * 100).toFixed(0) : 0}%</span>
                  <span>Max: 95% Laba Kotor</span>
                </div>
              </div>

              {/* Reset Controller */}
              <button
                onClick={handleResetToActual}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Nilai Buku Aktual
              </button>

            </div>

          </div>

          {/* Save & Log Projections Form */}
          {isSimulatorActive && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4.5"
            >
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                <Save className="w-4.5 h-4.5 text-amber-400" />
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">
                  SIMPAN SKENARIO SIMULASI
                </h3>
              </div>

              <form onSubmit={handleSaveSimulation} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Nama Skenario Perencanaan:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Skenario Optimis 2026, HPP Naik 5%"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full text-xs font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-[9px] text-zinc-400 font-medium">
                  <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
                    <span>Proyeksi Laba Bersih:</span>
                    <p className="font-bold text-zinc-200 mt-0.5">{formatCurrency(currentCalc.labaBersih, currency).split(',')[0]}</p>
                  </div>
                  <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
                    <span>Estimasi PPh Terutang:</span>
                    <p className="font-bold text-rose-400 mt-0.5">{formatCurrency(currentCalc.calculatedTax, currency).split(',')[0]}</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 text-[10px] font-black uppercase rounded-xl tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan Skenario Ke Local History
                </button>
              </form>
            </motion.div>
          )}

          {/* Simulation History Log Book */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">
                  RIWAYAT PERENCANAAN PAJAK
                </h3>
              </div>
              <span className="text-[9px] font-black text-zinc-500 uppercase">{savedSims.length} Skenario</span>
            </div>

            {savedSims.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 space-y-2">
                <Info className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-[10px] font-bold uppercase">Belum Ada Skenario Disimpan</p>
                <p className="text-[9px] leading-relaxed max-w-xs mx-auto text-zinc-500">
                  Aktifkan simulator pajak, sesuaikan parameter pendapatan dan biaya, lalu simpan skenario di atas.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {savedSims.map((sim) => (
                  <div 
                    key={sim.id} 
                    className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-zinc-200 truncate">{sim.name}</p>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold">
                        <span>{sim.date}</span>
                        <span>•</span>
                        <span className="text-amber-400">Tarif {sim.rate.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[8px] text-zinc-500 font-bold block uppercase">Pajak Terutang</span>
                        <span className="text-xs font-black font-mono text-rose-400">{formatCurrency(sim.tax, currency).split(',')[0]}</span>
                      </div>
                      
                      <button
                        onClick={() => handleLoadSim(sim)}
                        title="Terapkan Skenario"
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSim(sim.id, sim.name)}
                        title="Hapus Skenario"
                        className="p-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-lg border border-zinc-800 hover:border-rose-500/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT PANEL: Professional Tax Ledger (Form 1771 Format) & Analytical Charts (Col span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Visual Interactive Charts comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Chart A: Distribution Circular Pie Chart of Omzet Allocation */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">ALOKASI OMZET PROYEKSI</span>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Distribusi Nilai Omzet ke Komponen Biaya & Laba</p>
              </div>

              <div className="w-full h-44 flex items-center justify-center my-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={circularDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {circularDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value), currency).split(',')[0]}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#f4f4f5', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Embedded percentage details in core of Donut */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-zinc-500 font-black uppercase leading-none">Porsi Laba</span>
                  <span className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                    {currentCalc.omzet > 0 ? ((currentCalc.netProfitAfterTax / currentCalc.omzet) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[8px] font-bold uppercase mt-1">
                {circularDistributionData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-zinc-400 truncate">{item.name} ({item.percentage.toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart B: Comparison Bar Chart actual vs simulated */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">BANDINGKAN HASIL PAJAK</span>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Realisasi Buku Riil vs Simulasi Perencanaan</p>
              </div>

              <div className="w-full h-44 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartComparisonData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={8} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={8} fontWeight="bold" tickFormatter={(v) => `${(v/1000000).toFixed(0)}Jt`} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value), currency).split(',')[0]}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#a1a1aa', fontWeight: 'black', fontSize: '10px' }}
                    />
                    <Bar name="Buku Riil" dataKey="Buku_Riil" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                    <Bar name="Simulasi" dataKey="Simulasi" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[9px] font-bold uppercase border-t border-zinc-900 pt-2">
                <span className="text-zinc-500">Kenaikan PPh Terutang:</span>
                <span className={`font-black font-mono ${currentCalc.calculatedTax > actualCalc.calculatedTax ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {currentCalc.calculatedTax >= actualCalc.calculatedTax ? '+' : ''}
                  {formatCurrency(currentCalc.calculatedTax - actualCalc.calculatedTax, currency).split(',')[0]}
                </span>
              </div>
            </div>

          </div>

          {/* Form 1771 SPT Ledger Sheet Structure */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-indigo-500"></div>
            
            {/* Ledger Header */}
            <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500 animate-pulse" />
                  LEMBAR PERHITUNGAN SPT TAHUNAN PAJAK BADAN (DRAFT 1771)
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                  Format Laporan Rekonsiliasi Fiskal & Perhitungan PPh Terutang
                </p>
              </div>

              {/* Action: Export to Txt */}
              <button
                onClick={handleExportTxt}
                className="px-3.5 py-1.8 text-[10px] font-black text-zinc-950 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-md transition-all flex items-center gap-1.5 uppercase tracking-wider self-start sm:self-auto cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export SPT Draft
              </button>
            </div>

            {/* Ledger Content Sheet Table */}
            <div className="p-5 space-y-5">
              
              {/* Company Profile in Sheet */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-800/60 text-[9px] text-zinc-400 font-bold">
                <div className="space-y-0.5">
                  <span className="text-zinc-500 block uppercase">NAMA WAJIB PAJAK:</span>
                  <span className="text-zinc-200 block">CV. TORAS BENAUNT</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-zinc-500 block uppercase">NPWP BADAN USAHA:</span>
                  <span className="text-zinc-200 block">02.485.932.1-402.000</span>
                </div>
                <div className="space-y-0.5 col-span-2 md:col-span-1">
                  <span className="text-zinc-500 block uppercase">TAHUN PAJAK / PERIODE:</span>
                  <span className="text-amber-400 block font-black uppercase">2026 / JUNI (DRAFT AKTIF)</span>
                </div>
              </div>

              {/* Ledger Entries Section */}
              <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
                
                {/* Entry 1 */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-zinc-950 border-b border-zinc-900 text-xs items-center">
                  <div className="col-span-1 text-zinc-500 font-black">A.1</div>
                  <div className="col-span-7 font-bold text-zinc-300">Peredaran Bruto (Omzet Penjualan Cor Beton)</div>
                  <div className="col-span-4 text-right font-black font-mono text-zinc-100">
                    {formatCurrency(currentCalc.omzet, currency)}
                  </div>
                </div>

                {/* Entry 2 */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-zinc-950 border-b border-zinc-900 text-xs items-center">
                  <div className="col-span-1 text-zinc-500 font-black">A.2</div>
                  <div className="col-span-7 font-bold text-zinc-300">Harga Pokok Penjualan (HPP / Biaya Material Cor)</div>
                  <div className="col-span-4 text-right font-black font-mono text-zinc-400">
                    ({formatCurrency(currentCalc.hpp, currency)})
                  </div>
                </div>

                {/* Gross Margin Row */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-zinc-900/20 border-b border-zinc-900 text-xs items-center font-bold">
                  <div className="col-span-1 text-zinc-500"></div>
                  <div className="col-span-7 text-indigo-400 uppercase tracking-wider font-extrabold text-[10px]">Laba Kotor Usaha (Gross Profit)</div>
                  <div className="col-span-4 text-right font-black font-mono text-indigo-400">
                    {formatCurrency(currentCalc.labaKotor, currency)}
                  </div>
                </div>

                {/* Entry 3 */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-zinc-950 border-b border-zinc-900 text-xs items-center">
                  <div className="col-span-1 text-zinc-500 font-black">A.3</div>
                  <div className="col-span-7 font-bold text-zinc-300">Biaya Operasional & Overhead Kantor (OPEX)</div>
                  <div className="col-span-4 text-right font-black font-mono text-zinc-400">
                    ({formatCurrency(currentCalc.biaya, currency)})
                  </div>
                </div>

                {/* EBT / Net Profit Fiskal */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-zinc-900/30 border-b border-zinc-900 text-xs items-center font-bold">
                  <div className="col-span-1 text-zinc-500"></div>
                  <div className="col-span-7 text-violet-400 uppercase tracking-wider font-extrabold text-[10px]">Penghasilan Netto Fiskal (Laba Bersih Kena Pajak)</div>
                  <div className="col-span-4 text-right font-black font-mono text-violet-400">
                    {formatCurrency(currentCalc.labaBersih, currency)}
                  </div>
                </div>

                {/* Entry 4: Facility classification */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3.5 bg-zinc-950 border-b border-zinc-900 text-xs items-start">
                  <div className="col-span-1 text-zinc-500 font-black">B.1</div>
                  <div className="col-span-7 space-y-1">
                    <span className="font-bold text-zinc-300 block">Kategori Aturan Tarif Kepatuhan Pajak</span>
                    <span className="text-[9px] text-amber-500 font-black block uppercase tracking-wide">
                      {currentCalc.rateExplanation}
                    </span>
                    {currentCalc.formulaType === 'PROPORSI_31E' && (
                      <div className="text-[9px] text-zinc-400 leading-relaxed font-bold space-y-0.5 pt-1">
                        <p>• Porsi Omzet s.d Rp 4,8 Miliar Kena Fasilitas: 11%</p>
                        <p>• Sisa Omzet di atas Rp 4,8 Miliar Kena Tarif Normal: 22%</p>
                      </div>
                    )}
                  </div>
                  <div className="col-span-4 text-right font-black font-mono text-amber-400 pt-0.5">
                    Tarif Efektif: {currentCalc.ratePercentage.toFixed(3)}%
                  </div>
                </div>

                {/* Tax Owed result */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-zinc-900/40 border-b border-zinc-900 text-xs items-center font-bold">
                  <div className="col-span-1 text-zinc-500">C.1</div>
                  <div className="col-span-7 text-rose-400 uppercase tracking-wider font-extrabold text-[10px]">Taksiran PPh Badan Terutang (Form 1771-I)</div>
                  <div className="col-span-4 text-right font-black font-mono text-rose-400 text-sm animate-pulse">
                    {formatCurrency(currentCalc.calculatedTax, currency)}
                  </div>
                </div>

                {/* EAT Net profit after tax */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3.5 bg-zinc-900/60 text-xs items-center font-bold">
                  <div className="col-span-1 text-zinc-500">D.1</div>
                  <div className="col-span-7 text-emerald-400 uppercase tracking-wider font-extrabold text-[10px]">Laba Bersih Setelah Pajak (Earnings After Tax)</div>
                  <div className="col-span-4 text-right font-black font-mono text-emerald-400 text-sm">
                    {formatCurrency(currentCalc.netProfitAfterTax, currency)}
                  </div>
                </div>

              </div>

              {/* Legal Note footer */}
              <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 text-[9px] text-zinc-400 leading-relaxed space-y-1">
                <span className="font-extrabold text-zinc-300 uppercase block">CATATAN ATURAN (REKONSILIASI FISKAL):</span>
                <p>
                  1. Perhitungan ini disusun berdasarkan aturan **UU No. 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (UU HPP)** untuk Wajib Pajak Badan berbentuk CV/PT dengan insentif fasilitas Pasal 31E.
                </p>
                <p>
                  2. Nilai Buku Riil diperoleh secara otomatis dari neraca lajur dan log transaksi pembelian material ready mix, solar, dan invoice penjualan CV. Toras Benaunt.
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* SECTION: visual rules cards explaining brackets (Pasal 31E UU HPP) */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="border-b border-zinc-900 pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">
              PANDUAN & ATURAN HUKUM PPh BADAN INDONESIA
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
            Dasar Hukum Perhitungan Pajak Penghasilan Badan Usaha (CV / PT)
          </p>
        </div>

        {/* Explain subtabs selectors */}
        <div className="flex border-b border-zinc-900 gap-1 pb-2">
          <button
            onClick={() => setActiveExplainTab('pasal31e')}
            className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
              activeExplainTab === 'pasal31e' ? 'bg-zinc-800 text-amber-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Fasilitas Pasal 31E (Sektor UMKM)
          </button>
          <button
            onClick={() => setActiveExplainTab('tarifnormal')}
            className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
              activeExplainTab === 'tarifnormal' ? 'bg-zinc-800 text-indigo-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Tarif Normal Non-Fasilitas
          </button>
          <button
            onClick={() => setActiveExplainTab('spt1771')}
            className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
              activeExplainTab === 'spt1771' ? 'bg-zinc-800 text-violet-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Formulir 1771 SPT Badan
          </button>
        </div>

        <div className="pt-4 text-xs font-medium leading-relaxed">
          {activeExplainTab === 'pasal31e' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-200">Keringanan Tarif PPh Badan Berdasarkan Pasal 31E UU HPP</h4>
              <p className="text-zinc-400 text-xs">
                Sesuai dengan **Pasal 31E Undang-Undang Nomor 36 Tahun 2008** (diperbarui dalam UU HPP), Wajib Pajak Badan dalam negeri dengan peredaran bruto (omzet) sampai dengan **Rp 50.000.000.000 (lima puluh miliar rupiah)** mendapatkan fasilitas berupa pengurangan tarif sebesar **50% (lima puluh persen)** dari tarif normal 22% (sehingga tarif efektifnya menjadi **11%**) yang dikenakan atas Penghasilan Kena Pajak dari bagian peredaran bruto sampai dengan **Rp 4.800.000.000**.
              </p>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1.5 text-[11px] text-zinc-300">
                <span className="font-extrabold text-amber-400 uppercase tracking-wider block text-[9px]">CONTOH FORMULA KEUANGAN:</span>
                <p>• Jika omzet di bawah Rp 4,8 Miliar: Seluruh Laba Bersih dikalikan tarif **11%**.</p>
                <p>• Jika omzet di antara Rp 4,8 Miliar dan Rp 50 Miliar: Dilakukan pembagian proporsional laba kena fasilitas (11%) dan laba non-fasilitas (22%).</p>
              </div>
            </motion.div>
          )}

          {activeExplainTab === 'tarifnormal' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-200">Pemberlakuan Tarif Normal PPh Badan 22%</h4>
              <p className="text-zinc-400 text-xs">
                Wajib Pajak Badan yang memiliki total peredaran bruto di atas **Rp 50.000.000.000 (lima puluh miliar rupiah)** dalam satu tahun buku dikategorikan sebagai Badan Usaha Skala Besar (Non-UMKM) dan **tidak mendapatkan fasilitas pengurangan tarif**. Seluruh penghasilan kena pajak (Laba Bersih Fiskal) langsung dikenakan tarif normal sebesar **22%**.
              </p>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-[11px] text-zinc-300">
                  Perusahaan dengan skala omzet di atas Rp 50 Miliar wajib melakukan pembukuan penuh yang sangat detail dan diaudit akuntan publik sebelum menyertakan draft SPT 1771 ke kantor pajak.
                </span>
              </div>
            </motion.div>
          )}

          {activeExplainTab === 'spt1771' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-200">Struktur Pengisian SPT Tahunan Wajib Pajak Badan (Formulir 1771)</h4>
              <p className="text-zinc-400 text-xs">
                Pelaporan pajak badan tahunan di Indonesia wajib menggunakan **Formulir SPT 1771**, yang terdiri atas Lampiran I sampai Lampiran VI, serta Lembaran Induk SPT:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-300">
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
                  <span className="font-extrabold text-indigo-400 block mb-1">LAMPIRAN UTAMA SPT:</span>
                  <p>• **Lampiran I**: Perhitungan Penghasilan Netto Fiskal & Rekonsiliasi Fiskal.</p>
                  <p>• **Lampiran II**: Rincian Harga Pokok Penjualan (HPP) & Biaya OPEX.</p>
                  <p>• **Lampiran III**: Kredit Pajak Dalam Negeri (Potongan PPh 22/23).</p>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
                  <span className="font-extrabold text-indigo-400 block mb-1">LAMPIRAN KEPEMILIKAN:</span>
                  <p>• **Lampiran IV**: PPh Final & Penghasilan Non-Objek Pajak.</p>
                  <p>• **Lampiran V**: Daftar Pemegang Saham & Pembagian Dividen.</p>
                  <p>• **Lampiran VI**: Daftar Hutang/Piutang Afiliasi / Cabang Grup.</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      </>
      )}

    </div>
  );
};
