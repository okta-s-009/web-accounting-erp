/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ERPDatabase, generateIncomeStatement } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Landmark, ArrowUpRight, 
  ArrowDownLeft, AlertCircle, Layers, ShoppingCart, DollarSign,
  Calendar, ShieldCheck, MapPin, Activity, Award, CheckCircle, 
  Flame, RefreshCw, Layers3, Percent, Wallet, Info, Briefcase, 
  FileText, Truck, Gauge, Fuel, Zap, Globe, BarChart3, 
  ArrowRight, Sparkles, CircleDot, Target, Eye, Clock,
  Package, CreditCard, Receipt, PieChart as PieChartIcon
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
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface DashboardTabProps {
  db: ERPDatabase;
}

// Animated counter hook for futuristic number animation
const useAnimatedCounter = (target: number, duration: number = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

// Glowing Pulse Ring for KPI cards
const PulseRing: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute -top-1 -right-1">
    <span className={`flex h-3 w-3`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ backgroundColor: color }}></span>
      <span className={`relative inline-flex rounded-full h-3 w-3`} style={{ backgroundColor: color }}></span>
    </span>
  </div>
);

// Futuristic Mini Sparkline
const FuturisticSparkline: React.FC<{ data: number[]; color: string; glowColor: string }> = ({ data, color, glowColor }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 40;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible shrink-0">
      <defs>
        <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`glow-${color.replace('#','')}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon
        fill={`url(#spark-${color.replace('#','')})`}
        points={areaPoints}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        filter={`url(#glow-${color.replace('#','')})`}
      />
      {data.length > 0 && (() => {
        const lastX = width;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 8) - 4;
        return <circle cx={lastX} cy={lastY} r="3.5" fill={color} stroke="#09090b" strokeWidth="2" />;
      })()}
    </svg>
  );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({ db }) => {
  const currency = db.activeCurrency;
  const [liveTime, setLiveTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    let acc = branchCash - 50000000;
    return weeklyCashFlowData.map(w => {
      acc += w.netCash;
      return acc;
    });
  }, [weeklyCashFlowData, branchCash]);

  const sparklineOutstandingData = useMemo(() => {
    const base = branchPiutang + branchHutang;
    return [base * 0.7, base * 1.1, base * 0.9, base];
  }, [branchPiutang, branchHutang]);

  // --- 7. Chart 3: Daily Activity Log ---
  const dailyTrendData = useMemo(() => {
    const daily: Record<number, { name: string; sales: number; purchases: number }> = {};
    const now = new Date();
    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    for (let i = 1; i <= 30; i++) {
      daily[i] = { name: `${i} ${monthNames[now.getMonth()]}`, sales: 0, purchases: 0 };
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
    const colors = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#94a3b8'];

    return items.map((item, idx) => ({
      name: item.name,
      value: item.amount,
      percentage: (item.amount / total) * 100,
      color: colors[idx % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [incomeReport.expenses, incomeReport.totalExpenses]);

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

    if (txFilter === 'sales') return merged.filter(x => x.type === 'Sales').slice(0, 8);
    if (txFilter === 'purchases') return merged.filter(x => x.type === 'Purchase').slice(0, 8);
    return merged.slice(0, 8);
  }, [filteredSales, filteredPurchases, db.customers, db.suppliers, txFilter]);

  // --- 11. Inventory Alert Levels ---
  const lowStockProducts = useMemo(() => {
    return db.products.filter(p => p.stock < 10);
  }, [db.products]);

  // --- Recharts Tooltip Component ---
  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 backdrop-blur-xl text-white text-[11px] p-4 rounded-2xl shadow-2xl border border-white/10 space-y-2 font-sans z-50">
          <p className="font-extrabold text-cyan-300 border-b border-white/10 pb-1.5 uppercase tracking-wider text-xs">{label}</p>
          <div className="space-y-1.5 min-w-[180px]">
            {payload.map((entry: any, i: number) => (
              <div key={i} className="flex justify-between gap-5 items-center">
                <span className="flex items-center gap-2 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10" style={{ backgroundColor: entry.color || entry.fill }} />
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

  // Quick summary stats
  const totalInvoices = filteredSales.length + filteredPurchases.length;
  const totalProducts = db.products.length;
  const totalCustomers = db.customers.length;
  const totalSuppliers = db.suppliers.length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-5 text-zinc-100 font-sans"
    >
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: FUTURISTIC HERO BANNER 
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#0a0a1a] p-5 sm:p-6 lg:p-8">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/[0.07] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.05] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-emerald-500/[0.04] rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s' }}></div>
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
          {/* Scan line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent animate-pulse" style={{ animationDuration: '3s' }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                LIVE SYSTEM
              </span>
              <span className="text-[9px] font-bold text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                CV. TORAS BENAUNT
              </span>
              <span className="text-[9px] font-bold text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20 backdrop-blur-sm">
                Ready Mix & Beton
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Command Center
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent text-xl sm:text-2xl lg:text-3xl">
                Financial Intelligence
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed font-medium">
              Pemantauan real-time arus keuangan, analitik performa cabang, dan proyeksi laba rugi otomatis untuk operasional harian.
            </p>
          </div>

          {/* Right side: Live Clock & Quick Stats */}
          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            {/* Live Clock */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                WAKTU SISTEM
              </div>
              <p className="text-2xl font-black font-mono text-cyan-300 tracking-wider tabular-nums">
                {liveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-[10px] font-bold text-zinc-500">
                {liveTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            {/* Quick entity summary */}
            <div className="flex gap-2">
              {[
                { label: 'Produk', value: totalProducts, icon: Package },
                { label: 'Customer', value: totalCustomers, icon: CreditCard },
                { label: 'Supplier', value: totalSuppliers, icon: Receipt },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl px-3 py-2 text-center">
                  <item.icon className="w-3.5 h-3.5 text-zinc-500 mx-auto mb-1" />
                  <p className="text-sm font-black text-white tabular-nums">{item.value}</p>
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: KPI NEON CARD GRID 
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* KPI: Total Penjualan */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-[#0a0a1a] to-[#0a0a1a] p-4 sm:p-5 cursor-pointer group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"></div>
          <PulseRing color="#34d399" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-[0.15em]">Total Penjualan</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none mb-1">
              {formatCurrency(totalSalesAmount, currency)}
            </h3>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[10px] font-bold">
              <span className="text-zinc-500">{filteredSales.length} Invoice</span>
              <span className="text-emerald-400 font-black">{salesPaidPct.toFixed(0)}% Lunas</span>
            </div>
            <div className="mt-3 flex justify-end">
              <FuturisticSparkline data={sparklineSalesData} color="#34d399" glowColor="#34d39940" />
            </div>
          </div>
        </motion.div>

        {/* KPI: COGS */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-[#0a0a1a] to-[#0a0a1a] p-4 sm:p-5 cursor-pointer group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-blue-400/80 uppercase tracking-[0.15em]">Beban Material</span>
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                <Layers3 className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none mb-1">
              {formatCurrency(incomeReport.totalCogs, currency)}
            </h3>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[10px] font-bold">
              <span className="text-zinc-500">Semen & Batu</span>
              <span className="text-blue-400 font-black">
                {totalSalesAmount > 0 ? ((incomeReport.totalCogs / totalSalesAmount) * 100).toFixed(0) : 0}% Omset
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <FuturisticSparkline data={sparklineCogsData} color="#60a5fa" glowColor="#60a5fa40" />
            </div>
          </div>
        </motion.div>

        {/* KPI: Overhead */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-[#0a0a1a] to-[#0a0a1a] p-4 sm:p-5 cursor-pointer group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-[0.15em]">Overhead Operasional</span>
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">
                <TrendingDown className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none mb-1">
              {formatCurrency(incomeReport.totalExpenses, currency)}
            </h3>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[10px] font-bold">
              <span className="text-zinc-500">Armada & Solar</span>
              <span className="text-amber-400 font-black">
                {totalSalesAmount > 0 ? ((incomeReport.totalExpenses / totalSalesAmount) * 100).toFixed(0) : 0}% Omset
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <FuturisticSparkline data={sparklineExpensesData} color="#fbbf24" glowColor="#fbbf2440" />
            </div>
          </div>
        </motion.div>

        {/* KPI: Net Profit */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-[#0a0a1a] to-[#0a0a1a] p-4 sm:p-5 cursor-pointer group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-violet-400/80 uppercase tracking-[0.15em]">Laba Bersih</span>
              <div className={`p-2 rounded-xl border transition-all ${
                incomeReport.netProfit >= 0 
                  ? 'bg-violet-500/10 border-violet-500/20 group-hover:bg-violet-500/20' 
                  : 'bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500/20'
              }`}>
                <DollarSign className={`w-4 h-4 ${incomeReport.netProfit >= 0 ? 'text-violet-400' : 'text-rose-400'}`} />
              </div>
            </div>
            <h3 className={`text-lg sm:text-2xl font-black tracking-tight leading-none mb-1 ${incomeReport.netProfit >= 0 ? 'text-violet-300' : 'text-rose-300'}`}>
              {formatCurrency(incomeReport.netProfit, currency)}
            </h3>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[10px] font-bold">
              <span className="text-zinc-500">Margin Netto</span>
              <span className={`font-black ${incomeReport.netProfit >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <FuturisticSparkline data={sparklineProfitData} color={incomeReport.netProfit >= 0 ? "#a78bfa" : "#fb7185"} glowColor={incomeReport.netProfit >= 0 ? "#a78bfa40" : "#fb718540"} />
            </div>
          </div>
        </motion.div>

        {/* KPI: Kas & Bank */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-[#0a0a1a] to-[#0a0a1a] p-4 sm:p-5 cursor-pointer group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-cyan-400/80 uppercase tracking-[0.15em]">Likuiditas Cair</span>
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                <Landmark className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none mb-1">
              {formatCurrency(branchCash, currency)}
            </h3>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[10px] font-bold">
              <span className="text-zinc-500">Dana Kas & Bank</span>
              <span className="text-cyan-400 font-black uppercase tracking-wider text-[8px]">SIAGA</span>
            </div>
            <div className="mt-3 flex justify-end">
              <FuturisticSparkline data={sparklineCashData} color="#22d3ee" glowColor="#22d3ee40" />
            </div>
          </div>
        </motion.div>

        {/* KPI: Piutang & Hutang */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/40 via-[#0a0a1a] to-[#0a0a1a] p-4 sm:p-5 cursor-pointer group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-rose-400/80 uppercase tracking-[0.15em]">Hutang & Piutang</span>
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 group-hover:bg-rose-500/20 transition-all">
                <Wallet className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 uppercase tracking-wide text-[9px] font-bold">Piutang:</span>
                <span className="text-emerald-400 font-black">{formatCurrency(branchPiutang, currency).split(',')[0]}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 uppercase tracking-wide text-[9px] font-bold">Hutang:</span>
                <span className="text-rose-400 font-black">{formatCurrency(branchHutang, currency).split(',')[0]}</span>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <FuturisticSparkline data={sparklineOutstandingData} color="#fb7185" glowColor="#fb718540" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: CHART HUB + EXPENSE DONUT
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Chart Hub */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-8 relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a1a] p-4 sm:p-5"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                GRAFIK ANALITIK KEUANGAN
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Performa Operasional Periode Aktif</p>
            </div>
            
            {/* Chart Tabs */}
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/[0.06] backdrop-blur-sm">
              {[
                { id: 'financial', label: 'Keuangan' },
                { id: 'cashflow', label: 'Arus Kas' },
                { id: 'daily', label: 'Harian' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setChartTab(tab.id as any)}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    chartTab === tab.id 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="w-full h-64 sm:h-72 lg:h-80 bg-black/40 rounded-2xl border border-white/[0.04] p-3 sm:p-4">
            {chartTab === 'financial' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyFinancialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGradNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="cogsGradNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#a1a1aa' }} />
                  <Area type="monotone" name="Omset Penjualan" dataKey="sales" stroke="#34d399" strokeWidth={2.5} fillOpacity={1} fill="url(#revGradNew)" />
                  <Area type="monotone" name="Beban Material (COGS)" dataKey="cogs" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#cogsGradNew)" />
                  <Line type="monotone" name="Laba Bersih" dataKey="netProfit" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, stroke: '#09090b', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 1.5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartTab === 'cashflow' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyCashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="rect" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#a1a1aa' }} />
                  <Bar name="Kas Masuk" dataKey="inflow" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={24} />
                  <Bar name="Kas Keluar" dataKey="outflow" fill="#fb7185" radius={[6, 6, 0, 0]} maxBarSize={24} />
                  <Line type="monotone" name="Arus Bersih" dataKey="netCash" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, stroke: '#09090b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartTab === 'daily' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={9} fontWeight="bold" tickLine={false} interval={3} />
                  <YAxis stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="rect" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#a1a1aa' }} />
                  <Bar name="Penjualan Harian" dataKey="sales" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={12} />
                  <Bar name="Belanja Harian" dataKey="purchases" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="border-t border-white/[0.06] pt-3 mt-4 flex flex-wrap items-center justify-between text-[10px] text-zinc-600 font-bold uppercase gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Sinkronisasi otomatis ke buku besar COA
            </span>
            <span className="font-mono text-cyan-500 tabular-nums">Update: {new Date().toLocaleTimeString('id-ID')}</span>
          </div>
        </motion.div>

        {/* Expense Allocation Donut */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-4 relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a1a] p-4 sm:p-5 flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>

          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.15em] flex items-center mb-1">
              <PieChartIcon className="w-4 h-4 text-violet-400 mr-2" />
              ALOKASI BIAYA (OPEX)
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold mb-4">Porsi Pengeluaran Per Pos COA</p>

            {expenseBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                  <ShieldCheck className="w-8 h-8 text-zinc-700" />
                </div>
                <p className="text-xs text-zinc-600 font-bold italic text-center">Belum ada biaya overhead terekam.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-40 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Total</span>
                    <span className="text-sm font-black text-white">
                      {formatCurrency(incomeReport.totalExpenses, currency).split(',')[0]}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {expenseBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 truncate text-zinc-400 font-bold text-[10px]">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-white font-black text-[11px] shrink-0">{item.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] pt-3 mt-4 text-[9px] text-zinc-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Integrasi Neraca & Laba Rugi
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: INVENTORY ALERTS + ACTIVITY LEDGER
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Inventory Alerts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a1a] p-4 sm:p-5 flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>

          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.15em] flex items-center">
                <AlertCircle className="w-4 h-4 text-rose-400 mr-2" />
                STATUS INVENTORI KRITIS
              </h3>
              <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full animate-pulse">
                {lowStockProducts.length > 0 ? 'Reorder' : 'Aman'}
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="flex items-start space-x-3.5 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-emerald-300">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black">Persediaan Aman</p>
                  <p className="text-[10px] text-emerald-400/70 font-medium mt-1 leading-relaxed">
                    Seluruh komoditas beton berada dalam batas aman operasi.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lowStockProducts.map(p => {
                  const stockPercentage = Math.min((p.stock / 15) * 100, 100);
                  return (
                    <div key={p.id} className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 hover:bg-rose-500/10 transition-colors">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-black text-zinc-200 truncate">{p.name}</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase shrink-0">KRITIS</span>
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-1 font-mono uppercase font-bold">SKU: {p.sku} | Unit: {p.unit}</p>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-[9px] font-extrabold">
                          <span className="text-rose-400">Sisa: {p.stock} {p.unit}</span>
                          <span className="text-zinc-600">Min: 15</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full" style={{ width: `${stockPercentage}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] pt-3 mt-4 text-[9px] text-zinc-600 font-bold uppercase tracking-wide flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            Monitor stok otomatis — Batas kritis &lt; 10 unit
          </div>
        </motion.div>

        {/* Transaction Activity Ledger */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a1a] p-4 sm:p-5 flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-white/[0.06] gap-2">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.15em] flex items-center">
                <Activity className="w-4 h-4 text-cyan-400 mr-2" />
                AKTIVITAS TRANSAKSI
              </h3>
              
              <div className="flex bg-black/60 p-0.5 rounded-lg border border-white/[0.06]">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'sales', label: 'Penjualan' },
                  { id: 'purchases', label: 'Belanja' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTxFilter(tab.id as any)}
                    className={`px-2.5 py-1 text-[8px] font-black rounded-md uppercase tracking-wider cursor-pointer transition-all ${
                      txFilter === tab.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activityLedger.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Eye className="w-6 h-6 text-zinc-700" />
                <p className="text-xs text-zinc-600 font-bold italic">Belum ada transaksi terekam.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] space-y-0">
                {activityLedger.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 hover:bg-white/[0.02] px-2 -mx-2 rounded-xl transition-all duration-150 group">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className={`p-2 rounded-xl mt-0.5 shrink-0 border transition-all duration-300 ${
                        tx.type === 'Sales' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {tx.type === 'Sales' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-zinc-200 truncate">{tx.no}</h4>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm shrink-0 font-mono ${
                            tx.method === 'CASH' 
                              ? 'bg-white/[0.04] text-zinc-400 border border-white/[0.06]' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {tx.method}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5 uppercase tracking-wide truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">{tx.name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-black text-zinc-100 font-mono tabular-nums">
                        {formatCurrency(tx.amount, currency)}
                      </p>
                      <span className={`text-[7px] font-black px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider border ${
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

          <div className="border-t border-white/[0.06] pt-3 mt-4 text-[9px] text-zinc-600 font-bold uppercase tracking-wide flex items-center justify-between">
            <span>{activityLedger.length} transaksi terakhir</span>
            <span className="text-cyan-500 font-black tabular-nums">
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
