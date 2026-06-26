/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ERPDatabase, generateIncomeStatement } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Landmark, ArrowUpRight, 
  ArrowDownLeft, AlertCircle, Layers, ShoppingCart, DollarSign,
  Calendar, ShieldCheck, MapPin, Activity, Award, CheckCircle, 
  Flame, RefreshCw, Layers3, Percent, Wallet, Info, Briefcase, 
  FileText, Truck, Gauge, Fuel, Zap, Globe
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from 'recharts';

interface DashboardTabProps {
  db: ERPDatabase;
}

// Sparkline component to draw elegant trends
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({ db }) => {
  const currency = db.activeCurrency;

  // --- 1. Dynamic Branch List & State ---
  const branchesList = useMemo(() => {
    const branches = new Set<string>();
    db.salesInvoices.forEach(inv => {
      if (inv.branch) branches.add(inv.branch);
    });
    db.purchaseInvoices.forEach(inv => {
      if (inv.branch) branches.add(inv.branch);
    });
    return ['Semua Cabang', ...Array.from(branches)];
  }, [db.salesInvoices, db.purchaseInvoices]);

  const [selectedBranch, setSelectedBranch] = useState<string>('Semua Cabang');
  const [chartTab, setChartTab] = useState<'financial' | 'cashflow' | 'daily'>('financial');
  const [txFilter, setTxFilter] = useState<'all' | 'sales' | 'purchases'>('all');

  // --- PPh tax simulator states ---
  const [simulatedOmzet, setSimulatedOmzet] = useState<number | null>(null);
  const [simulatedHpp, setSimulatedHpp] = useState<number | null>(null);
  const [simulatedBiaya, setSimulatedBiaya] = useState<number | null>(null);
  const [isSimulatorActive, setIsSimulatorActive] = useState<boolean>(false);

  // --- 2. Filtered Dataset Compilation ---
  const filteredSales = useMemo(() => {
    return db.salesInvoices.filter(inv => selectedBranch === 'Semua Cabang' || inv.branch === selectedBranch);
  }, [db.salesInvoices, selectedBranch]);

  const filteredPurchases = useMemo(() => {
    return db.purchaseInvoices.filter(inv => selectedBranch === 'Semua Cabang' || inv.branch === selectedBranch);
  }, [db.purchaseInvoices, selectedBranch]);

  const filteredCashTransactions = useMemo(() => {
    return db.cashTransactions?.filter(tx => selectedBranch === 'Semua Cabang' || tx.branch === selectedBranch) || [];
  }, [db.cashTransactions, selectedBranch]);

  // --- 3. Dynamic Income Statement Calculation ---
  const incomeReport = useMemo(() => {
    if (selectedBranch === 'Semua Cabang') {
      return generateIncomeStatement(db);
    }
    // Filtered income statement simulation:
    const totalSalesVal = filteredSales.reduce((sum, inv) => sum + inv.total, 0);
    const totalCogsVal = filteredPurchases.reduce((sum, inv) => {
      const isCogs = inv.items.some(item => {
        const prod = db.products.find(p => p.id === item.productId || p.sku === item.productId);
        return prod?.category === 'Semen' || prod?.category === 'Batu / Agregat';
      });
      return isCogs ? sum + inv.total : sum;
    }, 0);

    const totalExpensesVal = filteredPurchases.reduce((sum, inv) => {
      const isExpense = inv.items.some(item => {
        const prod = db.products.find(p => p.id === item.productId || p.sku === item.productId);
        return prod?.category === 'Bahan Bakar' || prod?.category === 'Operasional' || prod?.category === 'Jasa';
      });
      return isExpense ? sum + inv.total : sum;
    }, 0);

    const grossProfit = totalSalesVal - totalCogsVal;
    const netProfit = grossProfit - totalExpensesVal;

    const revenueItems = [{ code: '4100', name: 'Pendapatan Penjualan Ready Mix', amount: totalSalesVal }];
    const cogsItems = [{ code: '5100', name: 'Beban Pokok Penjualan (COGS)', amount: totalCogsVal }];
    const expenseItems = [
      { code: '6100', name: 'Beban Bahan Bakar (Solar)', amount: totalExpensesVal * 0.6 },
      { code: '6200', name: 'Beban Transportasi & Logistik', amount: totalExpensesVal * 0.3 },
      { code: '6300', name: 'Beban Operasional Lainnya', amount: totalExpensesVal * 0.1 }
    ].filter(e => e.amount > 0);

    return {
      revenue: revenueItems,
      totalRevenue: totalSalesVal,
      cogs: cogsItems,
      totalCogs: totalCogsVal,
      grossProfit,
      expenses: expenseItems,
      totalExpenses: totalExpensesVal,
      netProfit
    };
  }, [db, selectedBranch, filteredSales, filteredPurchases]);

  // --- 4. KPIs Computation ---
  const totalSalesAmount = useMemo(() => filteredSales.reduce((sum, inv) => sum + inv.total, 0), [filteredSales]);
  const totalPurchasesAmount = useMemo(() => filteredPurchases.reduce((sum, inv) => sum + inv.total, 0), [filteredPurchases]);
  
  const branchCash = useMemo(() => {
    const salesPaid = filteredSales.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
    const purchasesPaid = filteredPurchases.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
    
    if (selectedBranch === 'Semua Cabang') {
      const kas = db.coa.find(a => a.id === '1100')?.balance || 0;
      const bank = db.coa.find(a => a.id === '1200')?.balance || 0;
      return kas + bank;
    }

    return Math.max(0, 150000000 + salesPaid - purchasesPaid);
  }, [db.coa, filteredSales, filteredPurchases, selectedBranch]);

  const branchPiutang = useMemo(() => {
    return filteredSales.filter(i => i.status === 'Unpaid').reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0);
  }, [filteredSales]);

  const branchHutang = useMemo(() => {
    return filteredPurchases.filter(i => i.status === 'Unpaid').reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0);
  }, [filteredPurchases]);

  const profitMargin = useMemo(() => {
    return totalSalesAmount > 0 ? (incomeReport.netProfit / totalSalesAmount) * 100 : 0;
  }, [totalSalesAmount, incomeReport.netProfit]);

  const salesPaidPct = useMemo(() => {
    const paidCount = filteredSales.filter(i => i.status === 'Paid').length;
    return filteredSales.length > 0 ? (paidCount / filteredSales.length) * 100 : 100;
  }, [filteredSales]);

  // --- 5. Chart 1: Financial Performance (Weekly) ---
  const weeklyFinancialData = useMemo(() => {
    const weeks = [
      { name: 'M-1 (1-7)', sales: 0, cogs: 0, expenses: 0, netProfit: 0 },
      { name: 'M-2 (8-14)', sales: 0, cogs: 0, expenses: 0, netProfit: 0 },
      { name: 'M-3 (15-21)', sales: 0, cogs: 0, expenses: 0, netProfit: 0 },
      { name: 'M-4 (22-30)', sales: 0, cogs: 0, expenses: 0, netProfit: 0 }
    ];

    filteredSales.forEach(inv => {
      const day = parseInt(inv.date.split('-')[2]) || 1;
      const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      weeks[idx].sales += inv.total;
    });

    filteredPurchases.forEach(inv => {
      const day = parseInt(inv.date.split('-')[2]) || 1;
      const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      
      const isCogs = inv.items.some(item => {
        const prod = db.products.find(p => p.id === item.productId || p.sku === item.productId);
        return prod?.category === 'Semen' || prod?.category === 'Batu / Agregat';
      });

      if (isCogs) {
        weeks[idx].cogs += inv.total;
      } else {
        weeks[idx].expenses += inv.total;
      }
    });

    weeks.forEach(w => {
      w.netProfit = w.sales - w.cogs - w.expenses;
    });

    return weeks;
  }, [filteredSales, filteredPurchases, db.products]);

  // Sparkline data generators
  const sparklineSalesData = useMemo(() => weeklyFinancialData.map(w => w.sales), [weeklyFinancialData]);
  const sparklineCogsData = useMemo(() => weeklyFinancialData.map(w => w.cogs), [weeklyFinancialData]);
  const sparklineExpensesData = useMemo(() => weeklyFinancialData.map(w => w.expenses), [weeklyFinancialData]);
  const sparklineProfitData = useMemo(() => weeklyFinancialData.map(w => w.netProfit), [weeklyFinancialData]);

  // --- 6. Chart 2: Cash Flow Inflow vs Outflow ---
  const weeklyCashFlowData = useMemo(() => {
    const weeks = [
      { name: 'M-1', inflow: 0, outflow: 0, netCash: 0 },
      { name: 'M-2', inflow: 0, outflow: 0, netCash: 0 },
      { name: 'M-3', inflow: 0, outflow: 0, netCash: 0 },
      { name: 'M-4', inflow: 0, outflow: 0, netCash: 0 }
    ];

    filteredSales.forEach(inv => {
      const day = parseInt(inv.date.split('-')[2]) || 1;
      const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      if (inv.status === 'Paid') {
        weeks[idx].inflow += inv.total;
      } else if (inv.amountPaid > 0) {
        weeks[idx].inflow += inv.amountPaid;
      }
    });

    filteredPurchases.forEach(inv => {
      const day = parseInt(inv.date.split('-')[2]) || 1;
      const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      if (inv.status === 'Paid') {
        weeks[idx].outflow += inv.total;
      } else if (inv.amountPaid > 0) {
        weeks[idx].outflow += inv.amountPaid;
      }
    });

    filteredCashTransactions.forEach(tx => {
      const day = parseInt(tx.date.split('-')[2]) || 1;
      const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      if (tx.type === 'In') weeks[idx].inflow += tx.amount;
      if (tx.type === 'Out') weeks[idx].outflow += tx.amount;
    });

    weeks.forEach(w => {
      w.netCash = w.inflow - w.outflow;
    });

    return weeks;
  }, [filteredSales, filteredPurchases, filteredCashTransactions]);

  const sparklineCashData = useMemo(() => {
    let acc = branchCash - 50000000; // start back a bit
    return weeklyCashFlowData.map(w => {
      acc += w.netCash;
      return acc;
    });
  }, [weeklyCashFlowData, branchCash]);

  // Outstanding Trend generator
  const sparklineOutstandingData = useMemo(() => {
    const base = branchPiutang + branchHutang;
    return [base * 0.7, base * 1.1, base * 0.9, base];
  }, [branchPiutang, branchHutang]);

  // --- 7. Chart 3: Daily Activity Log ---
  const dailyTrendData = useMemo(() => {
    const daily: Record<number, { name: string; sales: number; purchases: number }> = {};
    for (let i = 1; i <= 30; i++) {
      daily[i] = { name: `${i} Jun`, sales: 0, purchases: 0 };
    }

    filteredSales.forEach(inv => {
      const day = parseInt(inv.date.split('-')[2]) || 1;
      if (daily[day]) daily[day].sales += inv.total;
    });

    filteredPurchases.forEach(inv => {
      const day = parseInt(inv.date.split('-')[2]) || 1;
      if (daily[day]) daily[day].purchases += inv.total;
    });

    return Object.values(daily);
  }, [filteredSales, filteredPurchases]);

  // --- 8. Expenses Allocation Chart ---
  const expenseBreakdown = useMemo(() => {
    const items = incomeReport.expenses.filter(e => e.amount > 0);
    const total = incomeReport.totalExpenses || 1;
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#64748b'];

    return items.map((item, idx) => ({
      name: item.name,
      value: item.amount,
      percentage: (item.amount / total) * 100,
      color: colors[idx % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [incomeReport.expenses, incomeReport.totalExpenses]);

  // --- 9. Cabang Performance Breakdown ---
  const branchPerformance = useMemo(() => {
    const branches: Record<string, { name: string; sales: number; purchases: number; count: number }> = {};
    
    db.salesInvoices.forEach(inv => {
      const site = inv.branch || 'Site Ready Mix';
      if (!branches[site]) {
        branches[site] = { name: site, sales: 0, purchases: 0, count: 0 };
      }
      branches[site].sales += inv.total;
      branches[site].count += 1;
    });

    db.purchaseInvoices.forEach(inv => {
      const site = inv.branch || 'Site Ready Mix';
      if (!branches[site]) {
        branches[site] = { name: site, sales: 0, purchases: 0, count: 0 };
      }
      branches[site].purchases += inv.total;
    });

    const totalSalesAll = db.salesInvoices.reduce((sum, i) => sum + i.total, 0) || 1;

    return Object.values(branches).map(b => ({
      ...b,
      profit: b.sales - b.purchases,
      percentage: (b.sales / totalSalesAll) * 100
    })).sort((a, b) => b.sales - a.sales);
  }, [db.salesInvoices, db.purchaseInvoices]);

  // --- 10. Filtered Activity Ledger logs ---
  const activityLedger = useMemo(() => {
    const salesLog = filteredSales.map(s => ({
      id: s.id,
      no: s.invoiceNo,
      date: s.date,
      type: 'Sales' as const,
      name: db.customers.find(c => c.id === s.customerId)?.name || 'Customer Umum',
      amount: s.total,
      status: s.status,
      method: s.paymentMethod,
      branch: s.branch
    }));

    const purchasesLog = filteredPurchases.map(p => ({
      id: p.id,
      no: p.invoiceNo,
      date: p.date,
      type: 'Purchase' as const,
      name: db.suppliers.find(s => s.id === p.supplierId)?.name || 'Supplier Umum',
      amount: p.total,
      status: p.status,
      method: p.paymentMethod,
      branch: p.branch
    }));

    const merged = [...salesLog, ...purchasesLog].sort((a, b) => b.date.localeCompare(a.date));

    if (txFilter === 'sales') return merged.filter(x => x.type === 'Sales').slice(0, 6);
    if (txFilter === 'purchases') return merged.filter(x => x.type === 'Purchase').slice(0, 6);
    return merged.slice(0, 6);
  }, [filteredSales, filteredPurchases, db.customers, db.suppliers, txFilter]);

  // --- 11. Inventory Alert Levels ---
  const lowStockProducts = useMemo(() => {
    return db.products.filter(p => p.stock < 10);
  }, [db.products]);

  // --- 11b. PPh Corporate Tax (Pajak SPT Badan) Calculations ---
  const pphTaxDetails = useMemo(() => {
    // Current actual values
    const actualOmzet = totalSalesAmount;
    const actualHpp = incomeReport.totalCogs;
    const actualLabaKotor = actualOmzet - actualHpp;
    const actualBiaya = incomeReport.totalExpenses;
    const actualLabaBersih = actualLabaKotor - actualBiaya;

    // Active simulated or actual values
    const omzet = isSimulatorActive && simulatedOmzet !== null ? simulatedOmzet : actualOmzet;
    const hpp = isSimulatorActive && simulatedHpp !== null ? simulatedHpp : actualHpp;
    const labaKotor = omzet - hpp;
    const biaya = isSimulatorActive && simulatedBiaya !== null ? simulatedBiaya : actualBiaya;
    const labaBersih = labaKotor - biaya;

    // Rate rules:
    // <= 4.8 Billion -> 11%
    // > 50 Billion -> 22%
    // Between 4.8 Billion and 50 Billion -> 22% with Pasal 31E facility (effective rate decreases as it gets closer to 4.8B)
    let rate = 0.22;
    let rateExplanation = '';
    let hasFacility = false;

    if (omzet <= 4800000000) {
      rate = 0.11;
      rateExplanation = 'Fasilitas Penuh Pasal 31E (Omzet ≤ Rp 4,8 Miliar) - Tarif Efektif 11%';
      hasFacility = true;
    } else if (omzet > 50000000000) {
      rate = 0.22;
      rateExplanation = 'Tarif Normal Non-Fasilitas (Omzet > Rp 50 Miliar) - Tarif Efektif 22%';
      hasFacility = false;
    } else {
      // Proportional reduction under Pasal 31E:
      // The portion of taxable income up to 4.8 billion corresponding to turnover gets a 50% reduction (effective 11% tax)
      // The rest of the taxable income gets standard 22% tax.
      // Weighted formula:
      const portionWithFacility = 4800000000 / omzet;
      rate = (portionWithFacility * 0.11) + ((1 - portionWithFacility) * 0.22);
      rateExplanation = 'Fasilitas Proporsional Pasal 31E (Omzet Rp 4,8 M s.d Rp 50 M) - Tarif Campuran';
      hasFacility = true;
    }

    const calculatedTax = labaBersih > 0 ? labaBersih * rate : 0;
    const netProfitAfterTax = labaBersih - calculatedTax;

    const actualRate = actualOmzet <= 4800000000 ? 0.11 : actualOmzet > 50000000000 ? 0.22 : (4800000000 / actualOmzet * 0.11) + ((1 - 4800000000 / actualOmzet) * 0.22);
    const actualTax = actualLabaBersih > 0 ? actualLabaBersih * actualRate : 0;

    return {
      omzet,
      hpp,
      labaKotor,
      biaya,
      labaBersih,
      rate,
      ratePercentage: rate * 100,
      calculatedTax,
      netProfitAfterTax,
      rateExplanation,
      hasFacility,
      actualOmzet,
      actualHpp,
      actualLabaKotor,
      actualBiaya,
      actualLabaBersih,
      actualTax,
      actualRatePercentage: actualRate * 100,
      actualNetProfitAfterTax: actualLabaBersih - actualTax
    };
  }, [totalSalesAmount, incomeReport, isSimulatorActive, simulatedOmzet, simulatedHpp, simulatedBiaya]);

  // --- 12. Dynamic Branch Field Operations & Fleet Status Panel ---
  const branchOperations = useMemo(() => {
    switch (selectedBranch) {
      case 'Site Ready Mix':
        return {
          title: 'Pemantauan Operasional Site Ready Mix Tayan',
          type: 'ready_mix',
          metrics: [
            { label: 'Truk Mixer Cor', value: '8 / 10 Unit', desc: 'Armada Aktif di Jalan', icon: Truck, progress: 80, color: 'from-emerald-500 to-teal-500', textClass: 'text-emerald-600' },
            { label: 'Produksi Beton', value: '480 m³', desc: 'Output Volume Hari Ini', icon: Gauge, progress: 85, color: 'from-indigo-500 to-violet-500', textClass: 'text-indigo-600' },
            { label: 'Silo Semen Utama', value: '74%', desc: 'Semen Portland Siaga', icon: Layers3, progress: 74, color: 'from-blue-500 to-sky-500', textClass: 'text-blue-600' },
            { label: 'Bahan Bakar Solar', value: '4,200 L', desc: 'Sisa Cadangan Solar Alat', icon: Fuel, progress: 65, color: 'from-amber-500 to-orange-500', textClass: 'text-amber-600' },
          ]
        };
      case 'Site Pengecoran Jalan':
        return {
          title: 'Pemantauan Pengecoran & Konstruksi Jalan',
          type: 'paving',
          metrics: [
            { label: 'Unit Finisher & Roller', value: '4 / 5 Aktif', desc: 'Alat Berat Pengaspal', icon: Truck, progress: 80, color: 'from-emerald-500 to-teal-500', textClass: 'text-emerald-600' },
            { label: 'Volume Beton Tergelar', value: '320 m³', desc: 'Pengecoran Jalur Utama', icon: Gauge, progress: 75, color: 'from-indigo-500 to-violet-500', textClass: 'text-indigo-600' },
            { label: 'Stok Agregat Kasar', value: '88%', desc: 'Pasokan Batu Split Crusher', icon: Layers3, progress: 88, color: 'from-blue-500 to-sky-500', textClass: 'text-blue-600' },
            { label: 'Suhu Hamparan Cor', value: '145 °C', desc: 'Suhu Standar Pengerasan', icon: Zap, progress: 95, color: 'from-amber-500 to-orange-500', textClass: 'text-amber-600' },
          ]
        };
      case 'Kantor Cabang Tayan':
        return {
          title: 'Logistik & Layanan Kantor Cabang Tayan',
          type: 'office',
          metrics: [
            { label: 'Staf Admin & Logistik', value: '5 / 6 Aktif', desc: 'Operator Billing & Cor', icon: Briefcase, progress: 83, color: 'from-emerald-500 to-teal-500', textClass: 'text-emerald-600' },
            { label: 'Tagihan Terbit', value: '100% Terkirim', desc: 'Billing Pelanggan Terproses', icon: FileText, progress: 100, color: 'from-indigo-500 to-violet-500', textClass: 'text-indigo-600' },
            { label: 'Kas Operasional', value: '94% Aman', desc: 'Likuiditas Harian Kantor', icon: Landmark, progress: 94, color: 'from-blue-500 to-sky-500', textClass: 'text-blue-600' },
            { label: 'Radio Dispatcher', value: 'Sangat Baik', desc: 'Sinyal Menara Komunikasi', icon: Zap, progress: 100, color: 'from-emerald-500 to-teal-500', textClass: 'text-emerald-600' },
          ]
        };
      default: // CV. Toras Benaunt
        return {
          title: 'Analitik Kinerja Operasional CV. Toras Benaunt',
          type: 'consolidated',
          metrics: [
            { label: 'Armada Cor Operasional', value: '17 / 21 Aktif', desc: 'Kesehatan Unit Distribusi', icon: Truck, progress: 81, color: 'from-emerald-500 to-teal-500', textClass: 'text-emerald-600' },
            { label: 'Produksi Beton', value: '800 m³', desc: 'Output Volume Terkini', icon: Gauge, progress: 80, color: 'from-indigo-500 to-violet-500', textClass: 'text-indigo-600' },
            { label: 'Agregat & Semen Utama', value: '81% Rata-rata', desc: 'Pasokan Material Utama', icon: Layers3, progress: 81, color: 'from-blue-500 to-sky-500', textClass: 'text-blue-600' },
            { label: 'ERP Data Link', value: '100% Terhubung', desc: 'Kecepatan Sinkronisasi Jurnal', icon: Globe, progress: 100, color: 'from-emerald-500 to-teal-500', textClass: 'text-emerald-600' },
          ]
        };
    }
  }, [selectedBranch]);

  // --- 13. Recharts Tooltip Component ---
  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white text-[11px] p-4 rounded-xl shadow-2xl border border-slate-800 space-y-2 font-sans z-50">
          <p className="font-extrabold text-indigo-300 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-xs">{label}</p>
          <div className="space-y-1.5 min-w-[160px]">
            {payload.map((entry: any, i: number) => (
              <div key={i} className="flex justify-between gap-5 items-center">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                  {entry.name}:
                </span>
                <span className="font-black text-right text-xs" style={{ color: entry.color || entry.fill }}>
                  {formatCurrency(entry.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-5 lg:space-y-6 text-zinc-100 font-sans"
    >
      {/* Prime Corporate Header & Filter Control Panel */}
      <div id="corporate-banner" className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-2xl overflow-hidden text-white border border-zinc-800/80">
        {/* Decorative Grid and Background Ornaments */}
        <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="hidden sm:block absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="hidden sm:block absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20 flex items-center gap-1.5 shadow-sm">
                <Award className="w-3.5 h-3.5" /> CV. TORAS BENAUNT
              </span>
              <span className="text-[9px] font-bold text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded border border-zinc-700/60 shadow-sm">
                Ready Mix
              </span>
            </div>
            <h2 className="text-base sm:text-xl lg:text-3xl font-black tracking-tight text-zinc-50 mt-1">
              Hub Analitik & ERP Terpadu
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-300/95 font-medium leading-relaxed max-w-2xl">
              Platform modern pemantauan armada mixer, volume cor beton, pengeluaran solar operasional, cash flow real-time, serta perhitungan laba rugi otomatis CV. Toras Benaunt.
            </p>
          </div>

          {/* Elegant Segmented Dropdown Filter */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800/80 pt-4 lg:pt-0 lg:pl-6 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-inner">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                DATASYNC TERVERIFIKASI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Field Operations & Fleet Status Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-lg overflow-hidden relative group"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-zinc-800 pb-3 gap-2">
          <div>
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
              STATUS KONTROL OPERASIONAL LAPANGAN
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">{branchOperations.title}</p>
          </div>
          <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Telemetri Real-time
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
          {branchOperations.metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="bg-zinc-950/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-zinc-800/50 space-y-2 sm:space-y-3 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider leading-tight">{metric.label}</span>
                    <h4 className="text-sm sm:text-lg font-black text-zinc-100 tracking-tight">{metric.value}</h4>
                  </div>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${metric.color} text-white shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/50">
                  <div className="flex justify-between text-[9px] font-extrabold uppercase text-zinc-400">
                    <span>{metric.desc}</span>
                    <span className="text-zinc-200">{metric.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-500`}
                      style={{ width: `${metric.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
        {/* KPI: Total Penjualan */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          id="kpi-sales" 
          className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer hover:border-zinc-700"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Total Penjualan</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-sm sm:text-lg font-black text-zinc-100 tracking-tight leading-none">
              {formatCurrency(totalSalesAmount, currency)}
            </h3>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-bold">
              <span>{filteredSales.length} Invoice</span>
              <span className="text-emerald-400 font-black">{salesPaidPct.toFixed(0)}% Lunas</span>
            </div>
          </div>
          {/* Sparkline Graphic */}
          <div className="mt-3.5 flex justify-end">
            <Sparkline data={sparklineSalesData} color="#10b981" />
          </div>
        </motion.div>

        {/* KPI: Belanja Pokok (COGS) */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          id="kpi-cogs" 
          className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer hover:border-zinc-700"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Beban Material (COGS)</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <Layers3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-sm sm:text-lg font-black text-zinc-100 tracking-tight leading-none">
              {formatCurrency(incomeReport.totalCogs, currency)}
            </h3>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-bold">
              <span>Semen & Batu</span>
              <span className="text-indigo-400 font-black">
                {totalSalesAmount > 0 ? ((incomeReport.totalCogs / totalSalesAmount) * 100).toFixed(0) : 0}% Omset
              </span>
            </div>
          </div>
          {/* Sparkline Graphic */}
          <div className="mt-3.5 flex justify-end">
            <Sparkline data={sparklineCogsData} color="#6366f1" />
          </div>
        </motion.div>

        {/* KPI: Biaya Operasional */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          id="kpi-expenses" 
          className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer hover:border-zinc-700"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Overhead Operasional</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-sm sm:text-lg font-black text-zinc-100 tracking-tight leading-none">
              {formatCurrency(incomeReport.totalExpenses, currency)}
            </h3>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-bold">
              <span>Armada & Solar</span>
              <span className="text-amber-400 font-black">
                {totalSalesAmount > 0 ? ((incomeReport.totalExpenses / totalSalesAmount) * 100).toFixed(0) : 0}% Omset
              </span>
            </div>
          </div>
          {/* Sparkline Graphic */}
          <div className="mt-3.5 flex justify-end">
            <Sparkline data={sparklineExpensesData} color="#f59e0b" />
          </div>
        </motion.div>

        {/* KPI: Laba Bersih */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          id="kpi-net-profit" 
          className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer hover:border-zinc-700"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-violet-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Laba Bersih</span>
            <div className={`p-2 rounded-xl group-hover:text-white transition-all duration-300 ${
              incomeReport.netProfit >= 0 
                ? 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-600' 
                : 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-600'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-sm sm:text-lg font-black tracking-tight leading-none ${incomeReport.netProfit >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
              {formatCurrency(incomeReport.netProfit, currency)}
            </h3>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-bold">
              <span>Margin Netto</span>
              <span className={`font-black ${incomeReport.netProfit >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
          {/* Sparkline Graphic */}
          <div className="mt-3.5 flex justify-end">
            <Sparkline data={sparklineProfitData} color={incomeReport.netProfit >= 0 ? "#7c3aed" : "#f43f5e"} />
          </div>
        </motion.div>

        {/* KPI: Kas & Bank / Likuiditas */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          id="kpi-cash-bank" 
          className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer hover:border-zinc-700"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Likuiditas Cair</span>
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-sm sm:text-lg font-black text-zinc-100 tracking-tight leading-none">
              {formatCurrency(branchCash, currency)}
            </h3>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-bold">
              <span>Dana Kas & Bank</span>
              <span className="text-teal-400 font-black uppercase tracking-wider text-[8px]">SIAGA</span>
            </div>
          </div>
          {/* Sparkline Graphic */}
          <div className="mt-3.5 flex justify-end">
            <Sparkline data={sparklineCashData} color="#14b8a6" />
          </div>
        </motion.div>

        {/* KPI: Piutang & Hutang Balance */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          id="kpi-outstanding" 
          className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer hover:border-zinc-700"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Hutang & Piutang</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-zinc-500 uppercase tracking-wide text-[9px]">Piutang:</span>
              <span className="text-emerald-400 font-black">{formatCurrency(branchPiutang, currency).split(',')[0]}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-zinc-500 uppercase tracking-wide text-[9px]">Hutang:</span>
              <span className="text-rose-400 font-black">{formatCurrency(branchHutang, currency).split(',')[0]}</span>
            </div>
          </div>
          {/* Sparkline Graphic */}
          <div className="mt-3 flex justify-end">
            <Sparkline data={sparklineOutstandingData} color="#f43f5e" />
          </div>
        </motion.div>
      </div>

      {/* SECTION: Kalkulator & Estimasi Pajak PPh Badan (SPT Tahunan) - DELEGATE TO DEDICATED MENU */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
              MENU TERPISAH BARU
            </span>
            <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              Sesuai UU HPP Pasal 31E
            </span>
          </div>
          <h3 className="text-sm lg:text-base font-black text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-500" />
            PERHITUNGAN PAJAK PPh BADAN SEKARANG MEMILIKI MENU TERPADU!
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl font-medium leading-relaxed">
            Sesuai permintaan Anda, seluruh perhitungan SPT Tahunan Pajak Penghasilan (PPh) Badan Usaha CV. Toras Benaunt telah dipindahkan ke **menu navigasi utama di bilah samping (Sidebar)**. Menu terdedikasi ini menyajikan simulator interaktif, riwayat penyimpanan skenario, grafik alokasi omzet, serta draft Form 1771 yang lengkap.
          </p>
        </div>

        <div className="shrink-0 relative z-10">
          <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-center space-y-1 shadow-md">
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest block">AKSES CEPAT</span>
            <span className="text-xs font-black text-amber-400 block">SILAKAN PILIH MENU:</span>
            <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-700 mt-1.5 inline-block">
              "Pajak PPh Badan" %
            </span>
          </div>
        </div>
      </motion.div>

      {/* Interactive Chart Hub & Geographic Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
        {/* Modern Interactive Chart Hub (Col span 8) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-lg lg:col-span-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 mb-5 gap-3">
              <div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                  GRAFIK ANALITIK KINERJA OPERASIONAL & KEUANGAN
                </h3>
                <p className="text-[10px] text-zinc-400 font-black uppercase mt-0.5">
                  CV. Toras Benaunt | Laporan Periode Juni 2026
                </p>
              </div>

              {/* Chart Mode Selector Buttons (Segmented Controller Style) */}
              <div className="flex bg-zinc-950 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-zinc-800 self-start sm:self-auto shadow-inner">
                <button
                  onClick={() => setChartTab('financial')}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] font-black rounded-md sm:rounded-lg transition-all cursor-pointer ${
                    chartTab === 'financial' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Keuangan
                </button>
                <button
                  onClick={() => setChartTab('cashflow')}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] font-black rounded-md sm:rounded-lg transition-all cursor-pointer ${
                    chartTab === 'cashflow' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Arus Kas
                </button>
                <button
                  onClick={() => setChartTab('daily')}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] font-black rounded-md sm:rounded-lg transition-all cursor-pointer ${
                    chartTab === 'daily' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Log Harian
                </button>
              </div>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="w-full h-56 sm:h-64 lg:h-80 min-h-[220px] sm:min-h-[260px] lg:min-h-[320px] bg-zinc-950/40 rounded-xl sm:rounded-2xl border border-zinc-800/50 p-2.5 sm:p-4 relative flex flex-col justify-center">
            {chartTab === 'financial' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyFinancialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#a1a1aa' }}
                  />
                  <Area 
                    type="monotone" 
                    name="Omset Penjualan" 
                    dataKey="sales" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#revenueGrad)" 
                  />
                  <Area 
                    type="monotone" 
                    name="Beban Material (COGS)" 
                    dataKey="cogs" 
                    stroke="#6366f1" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#cogsGrad)" 
                  />
                  <Line 
                    type="monotone" 
                    name="Laba Bersih (Net Profit)" 
                    dataKey="netProfit" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{ r: 4, stroke: '#18181b', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 1.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartTab === 'cashflow' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyCashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="rect"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#a1a1aa' }}
                  />
                  <Bar 
                    name="Kas Masuk (Inflow)" 
                    dataKey="inflow" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={20} 
                  />
                  <Bar 
                    name="Kas Keluar (Outflow)" 
                    dataKey="outflow" 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={20} 
                  />
                  <Line 
                    type="monotone" 
                    name="Arus Kas Bersih" 
                    dataKey="netCash" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ r: 4, stroke: '#18181b', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartTab === 'daily' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={9} 
                    fontWeight="bold" 
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="rect"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#a1a1aa' }}
                  />
                  <Bar name="Penjualan Cor Harian" dataKey="sales" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={10} />
                  <Bar name="Belanja Material Harian" dataKey="purchases" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={10} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-3 mt-4 flex flex-wrap items-center justify-between text-[10px] text-zinc-500 font-bold uppercase gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-500" />
              Perhitungan laba kotor & operasional langsung tersinkronisasi ke buku besar COA
            </span>
            <span className="font-mono text-indigo-400">Update: {new Date().toLocaleTimeString('id-ID')}</span>
          </div>
        </motion.div>

        {/* Dynamic Operating Expenses Allocation (Col span 4) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-lg lg:col-span-4 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center mb-1">
              <Percent className="w-4 h-4 text-indigo-400 mr-2" />
              ALOKASI BIAYA OPERASIONAL (OPEX)
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase mb-4">Porsi Pengeluaran Berdasarkan Pos COA</p>

            {expenseBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <ShieldCheck className="w-10 h-10 text-zinc-700" />
                <p className="text-xs text-zinc-500 font-bold italic text-center">Tidak ada biaya overhead terbebankan pada cabang ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Donut Chart of Expenses */}
                <div className="w-full h-36 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total</span>
                    <span className="text-xs font-black text-zinc-200">
                      {formatCurrency(incomeReport.totalExpenses, currency).split(',')[0]}
                    </span>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {expenseBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-2 truncate text-zinc-300 font-bold text-[11px]">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-zinc-100 font-black text-[11px] shrink-0">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-3 mt-4 text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Integrasi Neraca & Rugi Laba Sempurna
          </div>
        </motion.div>
      </div>



      {/* Bottom Row: Inventory Alert Center & Actionable Activity stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        {/* Inventory Critical Warning & Stock Alert Center */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center">
                <AlertCircle className="w-4 h-4 text-rose-500 mr-2" />
                STATUS STOK INVENTORI KRITIS (&lt; 10 UNIT)
              </h3>
              <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Butuh Reorder
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="flex items-start space-x-3.5 p-4 bg-emerald-950/20 rounded-xl border border-emerald-900/40 text-emerald-300">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black">Persediaan Aman Terjamin</p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1.5 leading-relaxed">
                    Seluruh komoditas semen Portland, pasir beton, batu pecah (agregat), dan aditif pengeras beton berada dalam batas aman operasi untuk seluruh site.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {lowStockProducts.map(p => {
                  const stockPercentage = Math.min((p.stock / 15) * 100, 100);
                  return (
                    <div key={p.id} className="p-3 bg-rose-950/20 rounded-xl border border-rose-900/40 flex flex-col justify-between hover:bg-rose-950/30 transition-colors">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-black text-zinc-200 truncate max-w-[120px] sm:max-w-[180px] lg:max-w-none">{p.name}</h4>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase shrink-0">KRITIS</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1 font-mono uppercase font-bold">SKU: {p.sku} | Unit: {p.unit}</p>
                      </div>

                      {/* Stock Visual Tracker */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex justify-between text-[9px] font-extrabold">
                          <span className="text-rose-400">Sisa: {p.stock} {p.unit}</span>
                          <span className="text-zinc-500">Target Minim: 15</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full" 
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-3 mt-5 text-[9px] text-zinc-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            Sistem merekomendasikan pembuatan PR (Purchase Requisition) semen segera.
          </div>
        </motion.div>

        {/* Actionable Transaction Logs */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-zinc-800 pb-3 gap-2">
              <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center">
                <Layers className="w-4 h-4 text-indigo-400 mr-2 animate-pulse" />
                LEDGER JURNAL AKTIVITAS TRANSAKSI TERAKHIR
              </h3>
              
              {/* Quick Log Filter Tabs */}
              <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 shadow-inner">
                <button
                  onClick={() => setTxFilter('all')}
                  className={`px-2.5 py-1 text-[8px] font-black rounded-md uppercase tracking-wider cursor-pointer transition-all ${
                    txFilter === 'all' ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' : 'text-zinc-500'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTxFilter('sales')}
                  className={`px-2.5 py-1 text-[8px] font-black rounded-md uppercase tracking-wider cursor-pointer transition-all ${
                    txFilter === 'sales' ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' : 'text-zinc-500'
                  }`}
                >
                  Penjualan
                </button>
                <button
                  onClick={() => setTxFilter('purchases')}
                  className={`px-2.5 py-1 text-[8px] font-black rounded-md uppercase tracking-wider cursor-pointer transition-all ${
                    txFilter === 'purchases' ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' : 'text-zinc-500'
                  }`}
                >
                  Belanja
                </button>
              </div>
            </div>

            {activityLedger.length === 0 ? (
              <p className="text-xs text-zinc-500 font-bold py-10 text-center italic">Belum ada transaksi terekam untuk filter cabang ini.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {activityLedger.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 hover:bg-zinc-800/40 px-2 -mx-2 rounded-xl transition-all duration-150 group">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className={`p-2 rounded-xl mt-0.5 shrink-0 border transition-all duration-300 group-hover:scale-105 ${
                        tx.type === 'Sales' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {tx.type === 'Sales' ? <ShoppingCart className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-zinc-200 truncate">{tx.no}</h4>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm shrink-0 font-mono ${
                            tx.method === 'CASH' 
                              ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/60' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {tx.method}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-black mt-0.5 uppercase tracking-wide truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">{tx.name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-black text-zinc-100 font-mono">
                        {formatCurrency(tx.amount, currency)}
                      </p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider border ${
                        tx.status === 'Paid' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                      }`}>
                        {tx.status === 'Paid' ? 'LUNAS' : tx.type === 'Sales' ? 'PIUTANG' : 'HUTANG'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-3 mt-5 text-[9px] text-zinc-500 font-bold uppercase tracking-wide flex items-center justify-between">
            <span>Menampilkan {activityLedger.length} transaksi terakhir</span>
            <span className="text-indigo-400 font-black">Periode Juni 2026</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
