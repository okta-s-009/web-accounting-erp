/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ERPDatabase, generateIncomeStatement, generateBalanceSheet } from '../data/accountingEngine';
import { formatCurrency } from '../utils/format';
import { BarChart3, Landmark, TrendingUp, ShieldAlert, CheckCircle } from 'lucide-react';

interface ReportsTabProps {
  db: ERPDatabase;
  onDeleteTransaction?: (type: 'Sales' | 'Purchase' | 'Cash' | 'Journal', id: string) => void;
  onDeleteAllTransactions?: () => void;
}

type Mode = 'income' | 'balance' | 'sales' | 'purchases' | 'cashbook' | 'general_ledger';

import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  Building2, 
  CreditCard, 
  Coins, 
  ArrowUpDown, 
  Wallet,
  Receipt,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  FileSpreadsheet,
  X,
  Trash2
} from 'lucide-react';

const highlightText = (text: string, search: string) => {
  if (!search.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-amber-100 text-amber-950 font-semibold px-0.5 rounded shadow-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

const Pagination: React.FC<{
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}> = ({ totalItems, currentPage, pageSize, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="px-5 py-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02]/50 no-print">
      <div className="flex items-center space-x-2 text-xs text-zinc-500 font-semibold">
        <span>Menampilkan</span>
        <span className="font-bold text-zinc-200">{totalItems > 0 ? startIdx : 0}</span>
        <span>-</span>
        <span className="font-bold text-zinc-200">{endIdx}</span>
        <span>dari</span>
        <span className="font-bold text-zinc-200">{totalItems}</span>
        <span>data</span>
        <span className="mx-2 text-zinc-600">|</span>
        <span>Baris per halaman:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-white border border-white/[0.06] rounded px-1.5 py-0.5 text-xs font-bold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1 px-2 text-xs font-bold rounded border border-white/[0.06] bg-white text-zinc-400 hover:bg-white/[0.02] disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-all"
        >
          &laquo;
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 px-2 text-xs font-bold rounded border border-white/[0.06] bg-white text-zinc-400 hover:bg-white/[0.02] disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-all"
        >
          &lsaquo;
        </button>

        {/* Generate page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum = currentPage;
          if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          if (pageNum < 1 || pageNum > totalPages) return null;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`p-1 px-3 text-xs font-extrabold rounded border transition-all ${
                currentPage === pageNum
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-zinc-400 border-white/[0.06] hover:bg-white/[0.02] cursor-pointer'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 px-2 text-xs font-bold rounded border border-white/[0.06] bg-white text-zinc-400 hover:bg-white/[0.02] disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-all"
        >
          &rsaquo;
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1 px-2 text-xs font-bold rounded border border-white/[0.06] bg-white text-zinc-400 hover:bg-white/[0.02] disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-all"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
};

export const ReportsTab: React.FC<ReportsTabProps> = ({ db, onDeleteTransaction, onDeleteAllTransactions }) => {
  const [reportMode, setReportMode] = useState<Mode>('income');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [salesPage, setSalesPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Interactive expanded invoice details
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Generate dynamic data with active date range filters
  const incomeStatement = generateIncomeStatement(db, startDate || undefined, endDate || undefined);
  const balanceSheet = generateBalanceSheet(db, endDate || undefined);

  // Reset filters on mode change
  const handleModeChange = (mode: Mode) => {
    setReportMode(mode);
    setSearchTerm('');
    setSelectedBranch('All');
    setSelectedStatus('All');
    setSelectedMethod('All');
    setStartDate('');
    setEndDate('');
    setExpandedInvoiceId(null);
    setSalesPage(1);
    setPurchasesPage(1);
    setLedgerPage(1);
  };

  // Get list of unique branches/sites for filters
  const branches = Array.from(new Set([
    ...db.salesInvoices.map(inv => inv.branch),
    ...db.purchaseInvoices.map(inv => inv.branch),
    ...db.cashTransactions.map(tx => tx.branch)
  ])).filter(Boolean);

  // Sort helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // ----------------------------------------
  // SALES INVOICES FILTERING & SORTING
  // ----------------------------------------
  const filteredSales = db.salesInvoices.filter(invoice => {
    const customer = db.customers.find(c => c.id === invoice.customerId);
    const customerName = customer ? customer.name : '';
    const customerCode = customer ? customer.code : '';
    
    const matchesSearch = 
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.items.some(item => {
        const prod = db.products.find(p => p.id === item.productId);
        return prod && (
          prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prod.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      
    const matchesBranch = selectedBranch === 'All' || invoice.branch === selectedBranch;
    const matchesStatus = selectedStatus === 'All' || invoice.status === selectedStatus;
    const matchesMethod = selectedMethod === 'All' || invoice.paymentMethod === selectedMethod;
    
    const matchesDate = 
      (!startDate || invoice.date >= startDate) && 
      (!endDate || invoice.date <= endDate);
      
    return matchesSearch && matchesBranch && matchesStatus && matchesMethod && matchesDate;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'date') comparison = a.date.localeCompare(b.date);
    else if (sortField === 'invoiceNo') comparison = a.invoiceNo.localeCompare(b.invoiceNo);
    else if (sortField === 'customer') {
      const custA = db.customers.find(c => c.id === a.customerId)?.name || '';
      const custB = db.customers.find(c => c.id === b.customerId)?.name || '';
      comparison = custA.localeCompare(custB);
    }
    else if (sortField === 'total') comparison = a.total - b.total;
    else if (sortField === 'amountPaid') comparison = a.amountPaid - b.amountPaid;
    else if (sortField === 'remaining') comparison = (a.total - a.amountPaid) - (b.total - b.amountPaid);
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Sales Totals
  const totalSalesVal = filteredSales.reduce((sum, inv) => sum + inv.total, 0);
  const totalSalesPaidVal = filteredSales.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalSalesRemainingVal = totalSalesVal - totalSalesPaidVal;
  const totalSalesTaxVal = filteredSales.reduce((sum, inv) => sum + inv.tax, 0);

  // ----------------------------------------
  // PURCHASE INVOICES FILTERING & SORTING
  // ----------------------------------------
  const filteredPurchases = db.purchaseInvoices.filter(invoice => {
    const supplier = db.suppliers.find(s => s.id === invoice.supplierId);
    const supplierName = supplier ? supplier.name : '';
    const supplierCode = supplier ? supplier.code : '';
    
    const matchesSearch = 
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.items.some(item => {
        const prod = db.products.find(p => p.id === item.productId);
        return prod && (
          prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prod.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      
    const matchesBranch = selectedBranch === 'All' || invoice.branch === selectedBranch;
    const matchesStatus = selectedStatus === 'All' || invoice.status === selectedStatus;
    const matchesMethod = selectedMethod === 'All' || invoice.paymentMethod === selectedMethod;
    
    const matchesDate = 
      (!startDate || invoice.date >= startDate) && 
      (!endDate || invoice.date <= endDate);
      
    return matchesSearch && matchesBranch && matchesStatus && matchesMethod && matchesDate;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'date') comparison = a.date.localeCompare(b.date);
    else if (sortField === 'invoiceNo') comparison = a.invoiceNo.localeCompare(b.invoiceNo);
    else if (sortField === 'supplier') {
      const suppA = db.suppliers.find(s => s.id === a.supplierId)?.name || '';
      const suppB = db.suppliers.find(s => s.id === b.supplierId)?.name || '';
      comparison = suppA.localeCompare(suppB);
    }
    else if (sortField === 'total') comparison = a.total - b.total;
    else if (sortField === 'amountPaid') comparison = a.amountPaid - b.amountPaid;
    else if (sortField === 'remaining') comparison = (a.total - a.amountPaid) - (b.total - b.amountPaid);
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Purchase Totals
  const totalPurchasesVal = filteredPurchases.reduce((sum, inv) => sum + inv.total, 0);
  const totalPurchasesPaidVal = filteredPurchases.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalPurchasesRemainingVal = totalPurchasesVal - totalPurchasesPaidVal;
  const totalPurchasesTaxVal = filteredPurchases.reduce((sum, inv) => sum + inv.tax, 0);


  // ----------------------------------------
  // CASH BOOK / GENERAL LEDGER FILTERING
  // ----------------------------------------
  // Build a beautiful chronological ledger from cashTransactions and manual journals
  const ledgerEntries = [
    // Add Cash Transactions
    ...db.cashTransactions.map(tx => {
      const fromAcc = db.coa.find(a => a.id === tx.fromCoaId);
      const toAcc = db.coa.find(a => a.id === tx.toCoaId);
      return {
        id: tx.id,
        date: tx.date,
        reference: tx.transactionNo,
        description: tx.description,
        branch: tx.branch || 'Kantor Pusat',
        type: tx.type === 'Transfer' ? 'Transfer' : (tx.type === 'In' ? 'Kas Masuk' : 'Kas Keluar'),
        details: [
          { coaCode: toAcc?.code || '', coaName: toAcc?.name || '', debit: tx.amount, credit: 0 },
          { coaCode: fromAcc?.code || '', coaName: fromAcc?.name || '', debit: 0, credit: tx.amount }
        ],
        amount: tx.amount
      };
    }),
    // Add Manual / Non-Invoice Journals (like the expenses, wages, etc.)
    ...db.journals.filter(j => j.sourceType === 'Manual').map(j => {
      const details = j.details.map(d => {
        const acc = db.coa.find(a => a.id === d.coaId);
        return {
          coaCode: acc?.code || '',
          coaName: acc?.name || '',
          debit: d.debit,
          credit: d.credit
        };
      });
      const amount = j.details.reduce((sum, d) => sum + d.debit, 0);
      return {
        id: j.id,
        date: j.date,
        reference: j.journalNo,
        description: j.description,
        branch: 'Kantor Cabang Tayan', // default branch context
        type: 'Jurnal Umum',
        details: details,
        amount: amount
      };
    })
  ].filter(entry => {
    const matchesSearch = 
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.some(d => d.coaName.toLowerCase().includes(searchTerm.toLowerCase()) || d.coaCode.includes(searchTerm));
      
    const matchesBranch = selectedBranch === 'All' || entry.branch === selectedBranch;
    const matchesDate = 
      (!startDate || entry.date >= startDate) && 
      (!endDate || entry.date <= endDate);
      
    return matchesSearch && matchesBranch && matchesDate;
  }).sort((a, b) => {
    // Sort chronologically
    return b.date.localeCompare(a.date) || b.reference.localeCompare(a.reference);
  });

  // Calculate sum of cash flow in / out in the filtered range
  const totalCashInflow = ledgerEntries
    .reduce((sum, e) => {
      if (e.type === 'Kas Masuk') return sum + e.amount;
      if (e.type === 'Jurnal Umum') {
        const isMutation = e.details.every(d => d.coaCode.startsWith('11') || d.coaCode.startsWith('12'));
        if (isMutation) return sum; // Abaikan mutasi internal antar bank/kas
        
        // If it's a general journal, check if a Cash/Bank account is Debited (Kas Bertambah)
        const cashIn = e.details.filter(d => (d.coaCode.startsWith('11') || d.coaCode.startsWith('12')) && d.debit > 0).reduce((acc, d) => acc + d.debit, 0);
        return sum + cashIn;
      }
      return sum;
    }, 0);

  const totalCashOutflow = ledgerEntries
    .reduce((sum, e) => {
      if (e.type === 'Kas Keluar') return sum + e.amount;
      if (e.type === 'Jurnal Umum') {
        const isMutation = e.details.every(d => d.coaCode.startsWith('11') || d.coaCode.startsWith('12'));
        if (isMutation) return sum; // Abaikan mutasi internal antar bank/kas

        // If it's a general journal, check if a Cash/Bank account is Credited (Kas Berkurang)
        const cashOut = e.details.filter(d => (d.coaCode.startsWith('11') || d.coaCode.startsWith('12')) && d.credit > 0).reduce((acc, d) => acc + d.credit, 0);
        return sum + cashOut;
      }
      return sum;
    }, 0);

  // Paginated subsets
  const paginatedSales = filteredSales.slice((salesPage - 1) * pageSize, salesPage * pageSize);
  const paginatedPurchases = filteredPurchases.slice((purchasesPage - 1) * pageSize, purchasesPage * pageSize);
  const paginatedLedger = ledgerEntries.slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize);

  // Dynamic HTML element printing simulation with Official Kop Surat CV Toras Benaunt
  const handlePrint = (title: string) => {
    const printContent = document.getElementById('printable-area');
    if (!printContent) return;
    
    // Professional styling for Indonesian corporate official documents (Kop Surat & Tables)
    const style = `
      <style>
        body { font-family: 'Inter', sans-serif; color: #0f172a; padding: 15px; line-height: 1.4; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 11px; }
        th { background-color: #f1f5f9; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #1e293b; }
        .no-print { display: none !important; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        
        /* Official Indonesian Kop Surat Layout */
        .kop-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 4px solid #0f172a; padding-bottom: 12px; margin-bottom: 2px; }
        .kop-logo { width: 75px; height: 75px; margin-right: 18px; flex-shrink: 0; }
        .kop-text { flex: 1; text-align: center; }
        .kop-title { font-size: 22px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: 1px; font-family: 'Inter', sans-serif; }
        .kop-subtitle { font-size: 11px; font-style: italic; font-weight: bold; margin: 3px 0; color: #475569; }
        .kop-contact { font-size: 9.5px; font-weight: 500; margin: 2px 0; color: #64748b; }
        .kop-divider-thin { height: 1.5px; background-color: #0f172a; margin-bottom: 25px; }
        
        /* Document title */
        .doc-title { text-align: center; font-size: 15px; font-weight: 900; text-transform: uppercase; margin: 20px 0 5px 0; color: #0f172a; letter-spacing: 0.5px; }
        .doc-meta { text-align: center; font-size: 10.5px; color: #475569; font-weight: bold; margin-bottom: 25px; text-transform: uppercase; }
        
        /* Badges styling for print */
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .badge-green { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .badge-red { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .badge-amber { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-indigo { background-color: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
        
        /* Totals grid */
        .totals-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; margin-top: 15px; }
        .total-card { border: 1px solid #cbd5e1; padding: 10px 12px; border-radius: 8px; background-color: #f8fafc; text-align: center; }
        .total-card-title { font-size: 8.5px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .total-card-val { font-size: 13px; font-weight: 900; margin-top: 4px; color: #0f172a; }
        
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .overflow-x-auto { overflow: visible !important; overflow-x: visible !important; }
          table { width: 100% !important; max-width: 100% !important; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    `;

    // High quality vector SVG representing the official CV. Toras Benaunt logo
    const svgLogo = `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 16,32 A 40,40 0 1,0 84,32" stroke="#008BE2" stroke-width="8" stroke-linecap="round" fill="none" />
        <path d="M 20,32 L 34,32 L 50,14 L 66,32 L 80,32 L 80,24 L 50,4 L 20,24 Z" fill="#008BE2" />
        <rect x="46" y="24" width="8" height="54" fill="#008BE2" />
        <path d="M 38,24 H 66 L 66,46 H 48 H 66 L 66,68 H 38 V 24" stroke="#E31E24" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter" fill="none" />
      </svg>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            ${style}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          </head>
          <body>
            <!-- KOP SURAT RESMI CV TORAS BENAUNT -->
            <div class="kop-container">
              <div class="kop-logo">${svgLogo}</div>
              <div class="kop-text">
                <h1 class="kop-title">CV. TORAS BENAUNT</h1>
                <p class="kop-subtitle">General Contractor &bull; Supplier &bull; Ready Mix</p>
                <p class="kop-contact">Kantor Pusat: Jl. Trans Kalimantan Km. 8, Desa Sungai Tekam, Kec. Sekayam, Sanggau, Kalimantan Barat</p>
                <p class="kop-contact">Telp: +62 812-5722-1111 &bull; Email: cv.torasbenaunt@gmail.com &bull; Website: www.torasbenaunt.co.id</p>
              </div>
              <div style="width: 75px;"></div>
            </div>
            <div style="height: 3px; background-color: #0f172a; margin-bottom: 2px;"></div>
            <div class="kop-divider-thin"></div>

            <div class="doc-title">${title}</div>
            <div class="doc-meta">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} | Petugas: ${db.userSession.name}</div>
            
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      // Delay printing slightly to ensure Tailwind processes the DOM and fonts load
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1500);
    }
  };

  // High quality spreadsheet export with full styled layout and official Kop Surat
  const handleExportExcel = (type: Mode) => {
    let title = '';
    let headers: string[] = [];
    let rowsHtml = '';
    let columnWidths: number[] = [];

    const numStyle = 'style="mso-number-format:\\"\\#\\,\\#\\#0\\"; text-align: right;"';
    const textStyle = 'style="text-align: left;"';
    const centerStyle = 'style="text-align: center;"';

    if (type === 'income') {
      title = 'LAPORAN LABA RUGI';
      headers = ['Kode Akun', 'Nama Akun', 'Jumlah (Rupiah)'];
      columnWidths = [120, 320, 160];

      let rows: string[] = [];

      // 1. Revenue
      rows.push(`
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="3" style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">1. PENDAPATAN OPERASIONAL</td>
        </tr>
      `);
      incomeStatement.revenue.forEach(item => {
        rows.push(`
          <tr>
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${item.code}</td>
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1;">${item.name}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${item.amount}</td>
          </tr>
        `);
      });
      rows.push(`
        <tr style="font-weight: bold;">
          <td colspan="2" style="text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8; font-weight: bold;">Total Pendapatan</td>
          <td ${numStyle} style="padding: 8px 10px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8; border-bottom: 2px double #000; font-weight: bold;">${incomeStatement.totalRevenue}</td>
        </tr>
      `);

      // 2. COGS
      rows.push(`
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="3" style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">2. HARGA POKOK PENJUALAN (HPP)</td>
        </tr>
      `);
      incomeStatement.cogs.forEach(item => {
        rows.push(`
          <tr>
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${item.code}</td>
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1;">${item.name}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; color: #b91c1c;">${-item.amount}</td>
          </tr>
        `);
      });
      rows.push(`
        <tr style="font-weight: bold;">
          <td colspan="2" style="text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8; font-weight: bold;">Total Harga Pokok Penjualan</td>
          <td ${numStyle} style="padding: 8px 10px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8; border-bottom: 2px double #000; font-weight: bold; color: #b91c1c;">${-incomeStatement.totalCogs}</td>
        </tr>
      `);

      // Gross Profit
      rows.push(`
        <tr style="background-color: #ecfdf5; font-weight: bold; font-size: 11pt;">
          <td colspan="2" style="text-align: left; padding: 10px; border: 2px solid #10b981; color: #065f46; font-weight: bold;">LABA KOTOR (GROSS PROFIT)</td>
          <td ${numStyle} style="padding: 10px; border: 2px solid #10b981; color: #065f46; font-weight: bold;">${incomeStatement.grossProfit}</td>
        </tr>
      `);

      // 3. Expenses
      rows.push(`
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="3" style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">3. BEBAN OPERASIONAL</td>
        </tr>
      `);
      if (incomeStatement.expenses.length === 0) {
        rows.push(`
          <tr>
            <td colspan="3" style="text-align: center; padding: 10px; border: 1px solid #cbd5e1; color: #94a3b8; font-style: italic;">Belum ada pengeluaran operasional</td>
          </tr>
        `);
      } else {
        incomeStatement.expenses.forEach(item => {
          rows.push(`
            <tr>
              <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${item.code}</td>
              <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1;">${item.name}</td>
              <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; color: #b91c1c;">${-item.amount}</td>
            </tr>
          `);
        });
      }
      rows.push(`
        <tr style="font-weight: bold;">
          <td colspan="2" style="text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8; font-weight: bold;">Total Beban Operasional</td>
          <td ${numStyle} style="padding: 8px 10px; border: 1px solid #cbd5e1; border-top: 2px solid #94a3b8; border-bottom: 2px double #000; font-weight: bold; color: #b91c1c;">${-incomeStatement.totalExpenses}</td>
        </tr>
      `);

      // Net Profit
      const profitBg = incomeStatement.netProfit >= 0 ? '#f0fdf4' : '#fef2f2';
      const profitText = incomeStatement.netProfit >= 0 ? '#15803d' : '#b91c1c';
      const profitBorder = incomeStatement.netProfit >= 0 ? '#166534' : '#991b1b';
      rows.push(`
        <tr style="background-color: ${profitBg}; font-weight: bold; font-size: 11pt;">
          <td colspan="2" style="text-align: left; padding: 12px 10px; border: 2px solid ${profitBorder}; color: ${profitText}; text-transform: uppercase; font-weight: bold;">LABA BERSIH SETELAH PAJAK (NET PROFIT)</td>
          <td ${numStyle} style="padding: 12px 10px; border: 2px solid ${profitBorder}; color: ${profitText}; font-size: 11pt; font-weight: bold;">${incomeStatement.netProfit}</td>
        </tr>
      `);

      rowsHtml = rows.join('');
    } else if (type === 'sales') {
      title = 'LAPORAN DETAIL PENJUALAN BARANG';
      headers = ['Tanggal', 'No. Invoice', 'Pelanggan', 'Metode', 'Total Invoice (Rp)', 'Terbayar (Rp)', 'Sisa Piutang (Rp)', 'Status'];
      columnWidths = [100, 130, 200, 100, 140, 140, 140, 100];

      let totalInv = 0;
      let totalPaid = 0;
      let totalRemaining = 0;

      const rows = filteredSales.map(invoice => {
        const customer = db.customers.find(c => c.id === invoice.customerId);
        const customerName = customer ? customer.name : 'Customer Umum';
        const remaining = invoice.total - invoice.amountPaid;

        totalInv += invoice.total;
        totalPaid += invoice.amountPaid;
        totalRemaining += remaining;

        return `
          <tr>
            <td ${centerStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${invoice.date}</td>
            <td ${textStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${invoice.invoiceNo}</td>
            <td ${textStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${customerName}</td>
            <td ${centerStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${invoice.paymentMethod}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${invoice.total}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${invoice.amountPaid}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${remaining}</td>
            <td ${centerStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: ${invoice.status === 'Paid' ? '#166534' : invoice.status === 'Partial' ? '#92400e' : '#991b1b'};">${invoice.status}</td>
          </tr>
        `;
      });

      rows.push(`
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td colspan="4" style="text-align: right; padding: 10px; border: 1px solid #cbd5e1; font-size: 10pt; text-transform: uppercase; font-weight: bold;">TOTAL</td>
          <td ${numStyle} style="padding: 10px; border: 1px solid #cbd5e1; border-bottom: 4px double #000; font-size: 10pt; font-weight: bold;">${totalInv}</td>
          <td ${numStyle} style="padding: 10px; border: 1px solid #cbd5e1; border-bottom: 4px double #000; font-size: 10pt; font-weight: bold;">${totalPaid}</td>
          <td ${numStyle} style="padding: 10px; border: 1px solid #cbd5e1; border-bottom: 4px double #000; font-size: 10pt; font-weight: bold;">${totalRemaining}</td>
          <td style="border: 1px solid #cbd5e1;"></td>
        </tr>
      `);

      rowsHtml = rows.join('');
    } else if (type === 'purchases') {
      title = 'LAPORAN DETAIL PEMBELIAN BARANG';
      headers = ['Tanggal', 'No. Invoice', 'Pemasok (Supplier)', 'Metode', 'Total Invoice (Rp)', 'Terbayar (Rp)', 'Sisa Hutang (Rp)', 'Status'];
      columnWidths = [100, 130, 200, 100, 140, 140, 140, 100];

      let totalInv = 0;
      let totalPaid = 0;
      let totalRemaining = 0;

      const rows = filteredPurchases.map(invoice => {
        const supplier = db.suppliers.find(s => s.id === invoice.supplierId);
        const supplierName = supplier ? supplier.name : 'Supplier Umum';
        const remaining = invoice.total - invoice.amountPaid;

        totalInv += invoice.total;
        totalPaid += invoice.amountPaid;
        totalRemaining += remaining;

        return `
          <tr>
            <td ${centerStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${invoice.date}</td>
            <td ${textStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${invoice.invoiceNo}</td>
            <td ${textStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${supplierName}</td>
            <td ${centerStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${invoice.paymentMethod}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${invoice.total}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${invoice.amountPaid}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${remaining}</td>
            <td ${centerStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: ${invoice.status === 'Paid' ? '#166534' : invoice.status === 'Partial' ? '#92400e' : '#991b1b'};">${invoice.status}</td>
          </tr>
        `;
      });

      rows.push(`
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td colspan="4" style="text-align: right; padding: 10px; border: 1px solid #cbd5e1; font-size: 10pt; text-transform: uppercase; font-weight: bold;">TOTAL</td>
          <td ${numStyle} style="padding: 10px; border: 1px solid #cbd5e1; border-bottom: 4px double #000; font-size: 10pt; font-weight: bold;">${totalInv}</td>
          <td ${numStyle} style="padding: 10px; border: 1px solid #cbd5e1; border-bottom: 4px double #000; font-size: 10pt; font-weight: bold;">${totalPaid}</td>
          <td ${numStyle} style="padding: 10px; border: 1px solid #cbd5e1; border-bottom: 4px double #000; font-size: 10pt; font-weight: bold;">${totalRemaining}</td>
          <td style="border: 1px solid #cbd5e1;"></td>
        </tr>
      `);

      rowsHtml = rows.join('');
    } else if (type === 'balance') {
      title = 'LAPORAN POSISI KEUANGAN (NERACA)';
      headers = ['Kode Aktiva', 'Pos Aktiva', 'Jumlah Aktiva (Rp)', 'Kode Pasiva', 'Pos Pasiva', 'Jumlah Pasiva (Rp)'];
      columnWidths = [100, 200, 140, 100, 200, 140];

      const maxRows = Math.max(balanceSheet.assets.length, balanceSheet.liabilities.length + balanceSheet.equity.length + 3);
      let rows: string[] = [];

      for (let i = 0; i < maxRows; i++) {
        let leftHtml = '';
        if (i < balanceSheet.assets.length) {
          const item = balanceSheet.assets[i];
          leftHtml = `
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${item.code}</td>
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1;">${item.name}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${item.amount}</td>
          `;
        } else if (i === balanceSheet.assets.length) {
          leftHtml = `
            <td colspan="2" style="text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9;">TOTAL AKTIVA</td>
            <td ${numStyle} style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9; border-bottom: 2px double #000;">${balanceSheet.totalAssets}</td>
          `;
        } else {
          leftHtml = `
            <td style="border: 1px solid #cbd5e1; background-color: #f8fafc;"></td>
            <td style="border: 1px solid #cbd5e1; background-color: #f8fafc;"></td>
            <td style="border: 1px solid #cbd5e1; background-color: #f8fafc;"></td>
          `;
        }

        let rightHtml = '';
        const liabilitiesCount = balanceSheet.liabilities.length;
        const equityCount = balanceSheet.equity.length;

        if (i === 0) {
          rightHtml = `
            <td colspan="3" style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9; font-weight: bold;">KEWAJIBAN (LIABILITIES)</td>
          `;
        } else if (i <= liabilitiesCount) {
          const item = balanceSheet.liabilities[i - 1];
          rightHtml = `
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${item.code}</td>
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1;">${item.name}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${item.amount}</td>
          `;
        } else if (i === liabilitiesCount + 1) {
          rightHtml = `
            <td colspan="2" style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">Total Kewajiban</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">${balanceSheet.totalLiabilities}</td>
          `;
        } else if (i === liabilitiesCount + 2) {
          rightHtml = `
            <td colspan="3" style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9; font-weight: bold;">EKUITAS (EQUITY)</td>
          `;
        } else if (i - liabilitiesCount - 3 < equityCount) {
          const item = balanceSheet.equity[i - liabilitiesCount - 3];
          rightHtml = `
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${item.code}</td>
            <td style="text-align: left; padding: 6px 10px; border: 1px solid #cbd5e1;">${item.name}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${item.amount}</td>
          `;
        } else if (i - liabilitiesCount - 3 === equityCount) {
          rightHtml = `
            <td colspan="2" style="text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9;">TOTAL PASIVA (KEWAJIBAN & EKUITAS)</td>
            <td ${numStyle} style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9; border-bottom: 2px double #000;">${balanceSheet.totalLiabilities + balanceSheet.totalEquity}</td>
          `;
        } else {
          rightHtml = `
            <td style="border: 1px solid #cbd5e1; background-color: #f8fafc;"></td>
            <td style="border: 1px solid #cbd5e1; background-color: #f8fafc;"></td>
            <td style="border: 1px solid #cbd5e1; background-color: #f8fafc;"></td>
          `;
        }

        rows.push(`
          <tr>
            ${leftHtml}
            ${rightHtml}
          </tr>
        `);
      }

      rowsHtml = rows.join('');
    } else if (type === 'cashbook' || type === 'general_ledger') {
      title = type === 'cashbook' ? 'LAPORAN BUKU KAS' : 'LAPORAN BUKU JURNAL UMUM';
      headers = ['Tanggal', 'Ref Jurnal', 'Jenis', 'Keterangan', 'Rincian Jurnal Akun (D/K)', 'Jumlah (Rp)'];
      columnWidths = [100, 120, 100, 220, 280, 130];

      let totalIn = 0;
      let totalOut = 0;

      const rows = ledgerEntries.map(entry => {
        if (entry.type === 'Kas Masuk') totalIn += entry.amount;
        if (entry.type === 'Kas Keluar') totalOut += entry.amount;

        const detailsText = entry.details.map(det => 
          `[${det.account}] ${det.name} (${det.type === 'DEBIT' ? 'D' : 'K'}: ${formatCurrency(det.amount, db.activeCurrency)})`
        ).join(' | ');

        return `
          <tr>
            <td ${centerStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${entry.date}</td>
            <td ${textStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${entry.refNo}</td>
            <td ${centerStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: ${entry.type === 'Kas Masuk' ? '#15803d' : entry.type === 'Kas Keluar' ? '#b91c1c' : '#475569'};">${entry.type}</td>
            <td ${textStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${entry.description}</td>
            <td ${textStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 8.5pt;">${detailsText}</td>
            <td ${numStyle} style="padding: 6px 10px; border: 1px solid #cbd5e1;">${entry.amount}</td>
          </tr>
        `;
      });

      rows.push(`
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td colspan="5" style="text-align: right; padding: 10px; border: 1px solid #cbd5e1; font-size: 10pt; text-transform: uppercase; font-weight: bold; color: #15803d;">TOTAL KAS MASUK</td>
          <td ${numStyle} style="padding: 10px; border: 1px solid #cbd5e1; border-bottom: 2px solid #000; font-size: 10pt; font-weight: bold; color: #15803d;">${totalIn}</td>
        </tr>
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td colspan="5" style="text-align: right; padding: 10px; border: 1px solid #cbd5e1; font-size: 10pt; text-transform: uppercase; font-weight: bold; color: #b91c1c;">TOTAL KAS KELUAR</td>
          <td ${numStyle} style="padding: 10px; border: 1px solid #cbd5e1; border-bottom: 4px double #000; font-size: 10pt; font-weight: bold; color: #b91c1c;">${totalOut}</td>
        </tr>
      `);

      rowsHtml = rows.join('');
    }

    const colspan = headers.length;
    const widthTags = columnWidths.map(w => `<col width="${w}" />`).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${title.substring(0, 31)}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; }
          td { mso-number-format:"\\@"; vertical-align: middle; }
          th { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        </style>
      </head>
      <body>
        <table>
          ${widthTags}
          <!-- KOP SURAT RESMI CV TORAS BENAUNT -->
          <tr>
            <td colspan="${colspan}" style="text-align: center; font-size: 16pt; font-weight: bold; color: #0f172a; padding: 4px; font-weight: 900;">CV. TORAS BENAUNT</td>
          </tr>
          <tr>
            <td colspan="${colspan}" style="text-align: center; font-size: 10pt; font-style: italic; font-weight: bold; color: #475569; padding: 2px;">General Contractor &bull; Supplier &bull; Ready Mix</td>
          </tr>
          <tr>
            <td colspan="${colspan}" style="text-align: center; font-size: 9pt; color: #64748b; padding: 2px;">Kantor Pusat: Jl. Trans Kalimantan Km. 8, Desa Sungai Tekam, Kec. Sekayam, Sanggau, Kalimantan Barat</td>
          </tr>
          <tr>
            <td colspan="${colspan}" style="text-align: center; font-size: 9pt; color: #64748b; padding: 2px; border-bottom: 3px double #000;">Telp: +62 812-5722-1111 | Email: cv.torasbenaunt@gmail.com | Website: www.torasbenaunt.co.id</td>
          </tr>
          <tr>
            <td colspan="${colspan}" style="height: 12px; border-top: 1px solid #000;"></td>
          </tr>
          
          <!-- JUDUL LAPORAN -->
          <tr>
            <td colspan="${colspan}" style="text-align: center; font-size: 13pt; font-weight: bold; color: #0f172a; padding: 6px; text-transform: uppercase; font-weight: 950; letter-spacing: 0.5px;">${title}</td>
          </tr>
          <tr>
            <td colspan="${colspan}" style="text-align: center; font-size: 9pt; color: #475569; padding: 4px; font-weight: bold;">
              Petugas Cetak: ${db.userSession.name} | Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}
              ${(startDate || endDate) ? ` | Periode Laporan: ${startDate || 'Awal'} s.d ${endDate || 'Akhir'}` : ''}
            </td>
          </tr>
          <tr>
            <td colspan="${colspan}" style="height: 15px;"></td>
          </tr>

          <!-- TABLE HEADER -->
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 10pt; height: 30px;">
            ${headers.map(h => `<th style="border: 1px solid #475569; padding: 8px 10px; text-align: center; font-weight: bold; background-color: #0f172a; color: #ffffff;">${h}</th>`).join('')}
          </tr>

          <!-- DATA ROWS -->
          ${rowsHtml}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_CV_Toras_Benaunt_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Tab selection */}
      <div className="flex justify-center flex-wrap gap-2">
        <div className="flex flex-wrap bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]/65 shadow-sm">
          <button
            id="report-mode-income"
            onClick={() => handleModeChange('income')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              reportMode === 'income'
                ? 'bg-white text-zinc-100 shadow'
                : 'text-zinc-500 hover:text-zinc-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Laba Rugi</span>
          </button>
          
          <button
            id="report-mode-balance"
            onClick={() => handleModeChange('balance')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              reportMode === 'balance'
                ? 'bg-white text-zinc-100 shadow'
                : 'text-zinc-500 hover:text-zinc-100'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-blue-600" />
            <span>Neraca</span>
          </button>

          <button
            id="report-mode-sales"
            onClick={() => handleModeChange('sales')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              reportMode === 'sales'
                ? 'bg-white text-zinc-100 shadow'
                : 'text-zinc-500 hover:text-zinc-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>Tabel Penjualan</span>
          </button>

          <button
            id="report-mode-purchases"
            onClick={() => handleModeChange('purchases')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              reportMode === 'purchases'
                ? 'bg-white text-zinc-100 shadow'
                : 'text-zinc-500 hover:text-zinc-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            <span>Tabel Pembelian</span>
          </button>

          <button
            id="report-mode-cashbook"
            onClick={() => handleModeChange('cashbook')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              reportMode === 'cashbook'
                ? 'bg-white text-zinc-100 shadow'
                : 'text-zinc-500 hover:text-zinc-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buku Kas</span>
          </button>

          <button
            id="report-mode-general-ledger"
            onClick={() => handleModeChange('general_ledger')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              reportMode === 'general_ledger'
                ? 'bg-white text-zinc-100 shadow'
                : 'text-zinc-500 hover:text-zinc-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Jurnal Umum</span>
          </button>
        </div>
      </div>

      {/* PANEL FILTER & KONTROL CETAK (Berlaku untuk Semua Laporan) */}
      <div className="bg-white border border-white/[0.06] rounded-xl p-5 shadow-sm space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.04] pb-3 gap-3">
          <div className="flex items-center space-x-2 text-zinc-200 font-extrabold text-xs uppercase tracking-[0.1em]">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter & Cetak Laporan - {
              reportMode === 'income' ? 'Laba Rugi' :
              reportMode === 'balance' ? 'Posisi Keuangan (Neraca)' :
              reportMode === 'sales' ? 'Detail Penjualan' :
              reportMode === 'purchases' ? 'Detail Pembelian' :
              'Buku Kas & Jurnal Umum'
            }</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH histori transaksi beserta SELURUH DATA MASTER (Pelanggan, Supplier, Produk)?\n\nDatabase akan kembali bersih (kosong) sepenuhnya!\nTindakan ini tidak bisa dibatalkan!')) {
                  onDeleteAllTransactions?.();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-500/20 text-white rounded-lg shadow-sm transition-all duration-200 text-xs font-bold mr-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus Semua Data</span>
            </button>
            <button
              onClick={() => {
                const titles = {
                  income: 'LAPORAN LABA RUGI PERIODE',
                  balance: 'LAPORAN NERACA / POSISI KEUANGAN',
                  sales: 'LAPORAN DETAIL PENJUALAN BARANG',
                  purchases: 'LAPORAN DETAIL PEMBELIAN BARANG',
                  cashbook: 'LAPORAN ALIRAN KAS',
                  general_ledger: 'LAPORAN BUKU JURNAL UMUM'
                };
                let title = titles[reportMode];
                if (reportMode === 'income' && (startDate || endDate)) {
                  title += ` (${startDate || 'Awal'} s.d ${endDate || 'Akhir'})`;
                } else if (reportMode === 'balance' && endDate) {
                  title += ` PER TANGGAL ${endDate}`;
                }
                handlePrint(title);
              }}
              className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-900 transition-all rounded-lg text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Ekspor PDF</span>
            </button>
            <button
              onClick={() => handleExportExcel(reportMode)}
              className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-all rounded-lg text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* SEARCH BAR (Hanya untuk Sales & Purchases & Cashbook & General Ledger) */}
          {(reportMode === 'sales' || reportMode === 'purchases' || reportMode === 'cashbook' || reportMode === 'general_ledger') && (
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Cari Kata Kunci</label>
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder={
                    reportMode === 'sales' ? "No. Invoice, Customer, Produk, SKU..." :
                    reportMode === 'purchases' ? "No. Invoice, Supplier, Produk, SKU..." :
                    "No. Referensi, Keterangan, Akun..."
                  }
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSalesPage(1);
                    setPurchasesPage(1);
                    setLedgerPage(1);
                  }}
                  className="w-full text-xs pl-8 pr-8 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white transition-all shadow-sm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSalesPage(1);
                      setPurchasesPage(1);
                      setLedgerPage(1);
                    }}
                    className="absolute right-2.5 text-zinc-500 hover:text-zinc-400 focus:outline-none cursor-pointer p-0.5 rounded-full hover:bg-white/[0.03] transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}



          {/* Status Pembayaran (Hanya untuk Sales & Purchases) */}
          {(reportMode === 'sales' || reportMode === 'purchases') && (
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Status Bayar</label>
              <select
                className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setSalesPage(1);
                  setPurchasesPage(1);
                  setLedgerPage(1);
                }}
              >
                <option value="All">Semua Status</option>
                <option value="Paid">Lunas (Paid)</option>
                <option value="Unpaid">Belum Lunas</option>
              </select>
            </div>
          )}

          {/* Tanggal Mulai / Filter Tanggal Kiri */}
          {reportMode !== 'balance' && (
            <div className={reportMode === 'income' ? 'md:col-span-6' : 'md:col-span-2'}>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSalesPage(1);
                  setPurchasesPage(1);
                  setLedgerPage(1);
                }}
                className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold"
              />
            </div>
          )}

          {/* Tanggal Selesai / Filter Tanggal Kanan */}
          <div className={reportMode === 'income' ? 'md:col-span-6' : reportMode === 'balance' ? 'md:col-span-12' : 'md:col-span-2'}>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">{
              reportMode === 'balance' ? 'Laporan Posisi Per Tanggal' : 'Tanggal Selesai'
            }</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSalesPage(1);
                setPurchasesPage(1);
                setLedgerPage(1);
              }}
              className="w-full text-xs px-3 py-2 border border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 text-[10px] text-zinc-500 font-bold border-t border-slate-50">
          <div>
            {reportMode === 'sales' && `Ditemukan ${filteredSales.length} invoice penjualan.`}
            {reportMode === 'purchases' && `Ditemukan ${filteredPurchases.length} invoice pembelian.`}
            {(reportMode === 'cashbook' || reportMode === 'general_ledger') && `Ditemukan ${ledgerEntries.length} aliran jurnal.`}
            {reportMode === 'income' && (startDate || endDate ? `Filter Tanggal Aktif: ${startDate || 'Awal'} s.d ${endDate || 'Akhir'}` : 'Menampilkan akumulasi seluruh periode.')}
            {reportMode === 'balance' && (endDate ? `Filter Tanggal Aktif: S.d ${endDate}` : 'Menampilkan akumulasi seluruh posisi.')}
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedBranch('All');
              setSelectedStatus('All');
              setSelectedMethod('All');
              setStartDate('');
              setEndDate('');
              setSalesPage(1);
              setPurchasesPage(1);
              setLedgerPage(1);
            }}
            className="text-zinc-500 hover:text-indigo-600 hover:font-bold underline transition-all cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* MAIN REPORT VIEW (PRINTABLE AREA) */}
      <div id="printable-area" className="w-full">
        {/* Mode 1: LABA RUGI */}
        {reportMode === 'income' && (
          <div className="max-w-2xl mx-auto bg-white border border-white/[0.06] rounded-xl shadow-md p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b border-white/[0.04] pb-5 gap-3">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-black text-zinc-100 tracking-tight uppercase">Laporan Laba Rugi</h3>
                <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-[0.1em]">
                  {db.activeBranch} | {startDate || endDate ? `Periode ${startDate || 'Awal'} s.d ${endDate || 'Akhir'}` : 'Seluruh Periode 2026'}
                </p>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => handlePrint('LAPORAN LABA RUGI')}
                  className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-black hover:bg-slate-900 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm uppercase tracking-[0.1em]"
                >
                  <Printer className="w-3 h-3" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleExportExcel('income')}
                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm uppercase tracking-[0.1em]"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

          <div className="space-y-5 text-xs text-zinc-200 font-semibold">
            {incomeStatement.totalRevenue === 0 && incomeStatement.totalCogs === 0 && incomeStatement.totalExpenses === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <FileSpreadsheet className="w-10 h-10 text-amber-500" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h4 className="text-sm font-black text-zinc-200 uppercase tracking-wide">Tidak Ada Data Pada Periode Ini</h4>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                    Tidak ditemukan transaksi jurnal yang tercatat pada periode <span className="font-black text-zinc-300">{startDate || 'Awal'} s.d {endDate || 'Akhir'}</span>. 
                    Pastikan filter tanggal sesuai dengan periode yang memiliki data transaksi.
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold mt-2">
                    💡 Data transaksi saat ini tersedia mulai <span className="text-indigo-400 font-black">September 2025</span> hingga <span className="text-indigo-400 font-black">Mei 2026</span>.
                  </p>
                </div>
              </div>
            ) : (
              <>
            {/* PENDAPATAN */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-zinc-100 uppercase text-[10px] tracking-[0.1em] text-zinc-500">1. Pendapatan Operasional</h4>
              {incomeStatement.revenue.map((item, idx) => (
                <div key={idx} className="flex justify-between pl-4 text-zinc-300 font-semibold">
                  <span>[{item.code}] {item.name}</span>
                  <span className="font-bold">{formatCurrency(item.amount, db.activeCurrency)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/[0.04] pt-2 font-bold text-zinc-100 text-xs">
                <span>Total Pendapatan:</span>
                <span>{formatCurrency(incomeStatement.totalRevenue, db.activeCurrency)}</span>
              </div>
            </div>

            {/* HARGA POKOK PENJUALAN */}
            <div className="space-y-2 pt-2">
              <h4 className="font-extrabold text-zinc-100 uppercase text-[10px] tracking-[0.1em] text-zinc-500">2. Harga Pokok Penjualan (HPP)</h4>
              {incomeStatement.cogs.map((item, idx) => (
                <div key={idx} className="flex justify-between pl-4 text-zinc-300 font-semibold">
                  <span>[{item.code}] {item.name}</span>
                  <span className="font-bold">({formatCurrency(item.amount, db.activeCurrency)})</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/[0.04] pt-2 font-bold text-zinc-100 text-xs">
                <span>Total Harga Pokok Penjualan:</span>
                <span>({formatCurrency(incomeStatement.totalCogs, db.activeCurrency)})</span>
              </div>
            </div>

            {/* LABA KOTOR */}
            <div className="flex justify-between border-t border-b border-white/[0.06] py-3 font-extrabold text-slate-950 text-xs uppercase bg-white/[0.02] -mx-8 px-8">
              <span>Laba Kotor (Gross Profit):</span>
              <span className="text-emerald-700">{formatCurrency(incomeStatement.grossProfit, db.activeCurrency)}</span>
            </div>

            {/* BEBAN OPERASIONAL */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-zinc-100 uppercase text-[10px] tracking-[0.1em] text-zinc-500">3. Beban Operasional</h4>
              {incomeStatement.expenses.length === 0 ? (
                <p className="text-[11px] text-zinc-500 pl-4 font-medium italic">Belum ada pengeluaran operasional.</p>
              ) : (
                incomeStatement.expenses.map((item, idx) => (
                  <div key={idx} className="flex justify-between pl-4 text-zinc-300 font-semibold">
                    <span>[{item.code}] {item.name}</span>
                    <span className="font-bold">({formatCurrency(item.amount, db.activeCurrency)})</span>
                  </div>
                ))
              )}
              <div className="flex justify-between border-t border-white/[0.04] pt-2 font-bold text-zinc-100 text-xs">
                <span>Total Beban Operasional:</span>
                <span>({formatCurrency(incomeStatement.totalExpenses, db.activeCurrency)})</span>
              </div>
            </div>

            {/* LABA BERSIH */}
            <div className={`flex justify-between border-t-2 border-b-4 border-double border-slate-950 py-4 font-black text-sm uppercase ${
              incomeStatement.netProfit >= 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
            } -mx-8 px-8`}>
              <span>Laba Bersih Setelah Pajak (Net Profit):</span>
              <span className="font-extrabold">{formatCurrency(incomeStatement.netProfit, db.activeCurrency)}</span>
            </div>
              </>
            )}
          </div>
        </div>
      )}

        {/* Mode 2: NERACA */}
        {reportMode === 'balance' && (
          <div className="max-w-4xl mx-auto bg-white border border-white/[0.06] rounded-xl shadow-md p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b border-white/[0.04] pb-5 gap-3">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-black text-zinc-100 tracking-tight uppercase">Laporan Posisi Keuangan (Neraca)</h3>
                <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-[0.1em]">
                  {db.activeBranch} | {endDate ? `Per Tanggal ${endDate}` : 'Seluruh Posisi Keuangan'}
                </p>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => handlePrint('LAPORAN NERACA / POSISI KEUANGAN')}
                  className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-black hover:bg-slate-900 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm uppercase tracking-[0.1em]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleExportExcel('balance')}
                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm uppercase tracking-[0.1em]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-zinc-200 font-semibold">
            {/* LEFT COLUMN: AKTIVA (ASSETS) */}
            <div className="space-y-4 border-r border-white/[0.04] pr-4">
              <h4 className="font-black text-slate-950 uppercase text-[11px] tracking-wide border-b border-slate-950 pb-1 flex items-center justify-between">
                <span>AKTIVA (ASSETS)</span>
                <span className="text-emerald-700">DEBET</span>
              </h4>

              <div className="space-y-2">
                {balanceSheet.assets.map((item, idx) => (
                  <div key={idx} className="flex justify-between pl-2 text-zinc-300 font-semibold">
                    <span>[{item.code}] {item.name}</span>
                    <span className="font-bold">{formatCurrency(item.amount, db.activeCurrency)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-white/[0.08] pt-3 font-extrabold text-slate-950 text-xs bg-white/[0.02] p-2.5 rounded">
                <span>TOTAL AKTIVA:</span>
                <span>{formatCurrency(balanceSheet.totalAssets, db.activeCurrency)}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: PASIVA (LIABILITIES & EQUITY) */}
            <div className="space-y-6">
              {/* LIABILITIES */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-950 uppercase text-[11px] tracking-wide border-b border-slate-950 pb-1 flex items-center justify-between">
                  <span>KEWAJIBAN (LIABILITIES)</span>
                  <span className="text-indigo-700">KREDIT</span>
                </h4>

                <div className="space-y-2">
                  {balanceSheet.liabilities.map((item, idx) => (
                    <div key={idx} className="flex justify-between pl-2 text-zinc-300 font-semibold">
                      <span>[{item.code}] {item.name}</span>
                      <span className="font-bold">{formatCurrency(item.amount, db.activeCurrency)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between border-t border-white/[0.06] pt-2 font-bold text-zinc-200">
                  <span>Total Kewajiban:</span>
                  <span>{formatCurrency(balanceSheet.totalLiabilities, db.activeCurrency)}</span>
                </div>
              </div>

              {/* EQUITY */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-950 uppercase text-[11px] tracking-wide border-b border-slate-950 pb-1 flex items-center justify-between">
                  <span>EKUITAS (EQUITY)</span>
                  <span className="text-purple-700">KREDIT</span>
                </h4>

                <div className="space-y-2">
                  {balanceSheet.equity.map((item, idx) => (
                    <div key={idx} className="flex justify-between pl-2 text-zinc-300 font-semibold">
                      <span>[{item.code}] {item.name}</span>
                      <span className={`font-bold ${item.code === '3299' ? 'text-emerald-700' : ''}`}>
                        {formatCurrency(item.amount, db.activeCurrency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between border-t border-white/[0.06] pt-2 font-bold text-zinc-200">
                  <span>Total Ekuitas:</span>
                  <span>{formatCurrency(balanceSheet.totalEquity, db.activeCurrency)}</span>
                </div>
              </div>

              {/* TOTAL PASIVA */}
              <div className="flex justify-between border-t border-white/[0.08] pt-3 font-extrabold text-slate-950 text-xs bg-white/[0.02] p-2.5 rounded">
                <span>TOTAL PASIVA (KEWAJIBAN + EKUITAS):</span>
                <span>{formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity, db.activeCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Balance sheet verification */}
          <div className="border-t border-white/[0.06] pt-5 flex items-center justify-between bg-white/[0.02] -mx-8 -mb-8 px-8 py-4 rounded-b-xl">
            {balanceSheet.isBalanced ? (
              <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-xs">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>NERACA SEIMBANG (BALANCED)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-rose-700 font-extrabold text-xs">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>NERACA TIDAK SEIMBANG (UNBALANCED)</span>
              </div>
            )}
            <p className="text-[10px] text-zinc-500 font-semibold">
              Persamaan akuntansi dasar: Aset ({formatCurrency(balanceSheet.totalAssets, db.activeCurrency)}) === Kewajiban + Ekuitas ({formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity, db.activeCurrency)})
            </p>
          </div>
        </div>
      )}


      {/* Mode 3: TABEL LAPORAN PENJUALAN SECARA LENGKAP */}
      {reportMode === 'sales' && (
        <div className="max-w-7xl mx-auto space-y-4">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Total Penjualan</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalSalesVal, db.activeCurrency)}</h4>
              </div>
            </div>

            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Total Pembayaran Diterima</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalSalesPaidVal, db.activeCurrency)}</h4>
              </div>
            </div>

            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Sisa Piutang Usaha</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalSalesRemainingVal, db.activeCurrency)}</h4>
              </div>
            </div>

            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-white/[0.02] rounded-lg text-zinc-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Total PPN Keluaran</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalSalesTaxVal, db.activeCurrency)}</h4>
              </div>
            </div>
          </div>

          {/* TABLE PANEL */}
          <div className="bg-white border border-white/[0.06] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-xs text-zinc-100 uppercase tracking-[0.1em]">Daftar Invoice Penjualan Lengkap</h3>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => handlePrint('LAPORAN DETAIL PENJUALAN BARANG')}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                </button>
                <button
                  onClick={() => handleExportExcel('sales')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-500 border-collapse">
                <thead className="text-[10px] text-zinc-500 uppercase bg-white/[0.02] border-b border-white/[0.04]">
                  <tr>
                    <th className="py-3 px-4 font-black cursor-pointer" onClick={() => handleSort('date')}>
                      <div className="flex items-center space-x-1">
                        <span>Tanggal</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black cursor-pointer" onClick={() => handleSort('invoiceNo')}>
                      <div className="flex items-center space-x-1">
                        <span>No. Invoice</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black cursor-pointer" onClick={() => handleSort('customer')}>
                      <div className="flex items-center space-x-1">
                        <span>Pelanggan</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black">Metode</th>
                    <th className="py-3 px-4 font-black text-right cursor-pointer" onClick={() => handleSort('total')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Total Invoice</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black text-right cursor-pointer" onClick={() => handleSort('amountPaid')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Terbayar</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black text-right cursor-pointer" onClick={() => handleSort('remaining')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Sisa Piutang</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black text-center">Status</th>
                    <th className="py-3 px-4 font-black text-center no-print">Item</th>
                    <th className="py-3 px-4 font-black text-center no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-semibold text-zinc-300">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-zinc-500 italic font-medium">
                        Tidak ada transaksi penjualan yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedSales.map((invoice) => {
                      const customer = db.customers.find(c => c.id === invoice.customerId);
                      const customerName = customer ? customer.name : 'Customer Umum';
                      const isExpanded = expandedInvoiceId === invoice.id;
                      const sisaPiutang = invoice.total - invoice.amountPaid;
                      
                      return (
                        <React.Fragment key={invoice.id}>
                          <tr className={`hover:bg-white/[0.02] transition-all duration-200 ${isExpanded ? 'bg-white/[0.02]/50' : ''}`}>
                            <td className="py-3.5 px-4 text-zinc-100 font-bold whitespace-nowrap">{invoice.date}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-100">{highlightText(invoice.invoiceNo, searchTerm)}</td>
                            <td className="py-3.5 px-4">{highlightText(customerName, searchTerm)}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                invoice.paymentMethod === 'CASH' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {invoice.paymentMethod === 'CASH' ? 'Cash' : 'Kredit'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-zinc-100">
                              {formatCurrency(invoice.total, db.activeCurrency)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                              {formatCurrency(invoice.amountPaid, db.activeCurrency)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                              {formatCurrency(sisaPiutang, db.activeCurrency)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                invoice.status === 'Paid' ? 'badge badge-green bg-emerald-50 text-emerald-700' : 'badge badge-red bg-rose-50 text-rose-700'
                              }`}>
                                {invoice.status === 'Paid' ? 'LUNAS' : 'PIUTANG'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center no-print">
                              <button
                                onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                                className="p-1 text-zinc-500 hover:text-zinc-200 transition-all"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-center no-print">
                              <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Yakin ingin menghapus tagihan ini secara permanen? Jurnal dan stok barang akan ikut ditarik.')) onDeleteTransaction?.('Sales', invoice.id); }} className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-md transition-all duration-200">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-white/[0.02]/75 no-print">
                              <td colSpan={10} className="p-4 border-t border-b border-white/[0.06]/50">
                                <div className="max-w-2xl bg-white border border-white/[0.06] rounded-lg p-4 shadow-sm space-y-3 mx-auto">
                                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                                    <h5 className="font-bold text-[11px] text-zinc-500 uppercase tracking-[0.1em]">Rincian Item Penjualan</h5>
                                    <span className="text-[10px] font-bold text-zinc-500 font-mono">ID: {invoice.id}</span>
                                  </div>
                                  <div className="space-y-2">
                                    {invoice.items.map((item, idx) => {
                                      const product = db.products.find(p => p.id === item.productId);
                                      return (
                                        <div key={idx} className="flex justify-between items-center text-xs text-zinc-300 py-1 border-b border-slate-50 last:border-0">
                                          <div>
                                            <p className="font-bold text-zinc-100">{highlightText(product?.name || 'Produk', searchTerm)}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium font-mono">SKU: {highlightText(product?.sku || '', searchTerm)} | {item.qty} {product?.unit} @ {formatCurrency(item.price, db.activeCurrency)}</p>
                                          </div>
                                          <span className="font-bold text-zinc-100">{formatCurrency(item.subtotal, db.activeCurrency)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="border-t border-white/[0.04] pt-2 flex flex-col items-end text-xs font-semibold space-y-1">
                                    <div className="flex justify-between w-48">
                                      <span className="text-zinc-500">Subtotal:</span>
                                      <span className="text-zinc-100">{formatCurrency(invoice.subtotal, db.activeCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between w-48">
                                      <span className="text-zinc-500">PPN (Pajak):</span>
                                      <span className="text-zinc-100">{formatCurrency(invoice.tax, db.activeCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between w-48 border-t border-white/[0.04] pt-1.5 font-bold text-slate-950">
                                      <span>Total Tagihan:</span>
                                      <span>{formatCurrency(invoice.total, db.activeCurrency)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredSales.length > 0 && (
              <Pagination
                totalItems={filteredSales.length}
                currentPage={salesPage}
                pageSize={pageSize}
                onPageChange={setSalesPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setSalesPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}


      {/* Mode 4: TABEL LAPORAN PEMBELIAN SECARA LENGKAP */}
      {reportMode === 'purchases' && (
        <div className="max-w-7xl mx-auto space-y-4">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Total Pembelian</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalPurchasesVal, db.activeCurrency)}</h4>
              </div>
            </div>

            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Total Pembayaran Dibayar</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalPurchasesPaidVal, db.activeCurrency)}</h4>
              </div>
            </div>

            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Sisa Hutang Usaha</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalPurchasesRemainingVal, db.activeCurrency)}</h4>
              </div>
            </div>

            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-white/[0.02] rounded-lg text-zinc-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Total PPN Masukan</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalPurchasesTaxVal, db.activeCurrency)}</h4>
              </div>
            </div>
          </div>

          {/* TABLE PANEL */}
          <div className="bg-white border border-white/[0.06] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-xs text-zinc-100 uppercase tracking-[0.1em]">Daftar Invoice Pembelian Lengkap</h3>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => handlePrint('LAPORAN DETAIL PEMBELIAN BARANG & SEMEN/BATU/OBAT')}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                </button>
                <button
                  onClick={() => handleExportExcel('purchases')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-500 border-collapse">
                <thead className="text-[10px] text-zinc-500 uppercase bg-white/[0.02] border-b border-white/[0.04]">
                  <tr>
                    <th className="py-3 px-4 font-black cursor-pointer" onClick={() => handleSort('date')}>
                      <div className="flex items-center space-x-1">
                        <span>Tanggal</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black cursor-pointer" onClick={() => handleSort('invoiceNo')}>
                      <div className="flex items-center space-x-1">
                        <span>No. Invoice</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black cursor-pointer" onClick={() => handleSort('supplier')}>
                      <div className="flex items-center space-x-1">
                        <span>Pemasok (Supplier)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black">Metode</th>
                    <th className="py-3 px-4 font-black text-right cursor-pointer" onClick={() => handleSort('total')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Total Invoice</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black text-right cursor-pointer" onClick={() => handleSort('amountPaid')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Terbayar</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black text-right cursor-pointer" onClick={() => handleSort('remaining')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Sisa Hutang</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-black text-center">Status</th>
                    <th className="py-3 px-4 font-black text-center no-print">Item</th>
                    <th className="py-3 px-4 font-black text-center no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-semibold text-zinc-300">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-zinc-500 italic font-medium">
                        Tidak ada transaksi pembelian yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedPurchases.map((invoice) => {
                      const supplier = db.suppliers.find(s => s.id === invoice.supplierId);
                      const supplierName = supplier ? supplier.name : 'Supplier Umum';
                      const isExpanded = expandedInvoiceId === invoice.id;
                      const sisaHutang = invoice.total - invoice.amountPaid;
                      
                      return (
                        <React.Fragment key={invoice.id}>
                          <tr className={`hover:bg-white/[0.02] transition-all duration-200 ${isExpanded ? 'bg-white/[0.02]/50' : ''}`}>
                            <td className="py-3.5 px-4 text-zinc-100 font-bold whitespace-nowrap">{invoice.date}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-100">{highlightText(invoice.invoiceNo, searchTerm)}</td>
                            <td className="py-3.5 px-4">{highlightText(supplierName, searchTerm)}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                invoice.paymentMethod === 'CASH' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {invoice.paymentMethod === 'CASH' ? 'Cash' : 'Kredit'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-zinc-100">
                              {formatCurrency(invoice.total, db.activeCurrency)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                              {formatCurrency(invoice.amountPaid, db.activeCurrency)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                              {formatCurrency(sisaHutang, db.activeCurrency)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                invoice.status === 'Paid' ? 'badge badge-green bg-emerald-50 text-emerald-700' : 'badge badge-red bg-rose-50 text-rose-700'
                              }`}>
                                {invoice.status === 'Paid' ? 'LUNAS' : 'HUTANG'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center no-print">
                              <button
                                onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                                className="p-1 text-zinc-500 hover:text-zinc-200 transition-all"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-center no-print">
                              <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Yakin ingin menghapus tagihan ini secara permanen? Jurnal dan stok barang akan ikut ditarik.')) onDeleteTransaction?.('Purchase', invoice.id); }} className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-md transition-all duration-200">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-white/[0.02]/75 no-print">
                              <td colSpan={10} className="p-4 border-t border-b border-white/[0.06]/50">
                                <div className="max-w-2xl bg-white border border-white/[0.06] rounded-lg p-4 shadow-sm space-y-3 mx-auto">
                                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                                    <h5 className="font-bold text-[11px] text-zinc-500 uppercase tracking-[0.1em]">Rincian Item Pembelian</h5>
                                    <span className="text-[10px] font-bold text-zinc-500 font-mono">ID: {invoice.id}</span>
                                  </div>
                                  <div className="space-y-2">
                                    {invoice.items.map((item, idx) => {
                                      const product = db.products.find(p => p.id === item.productId);
                                      return (
                                        <div key={idx} className="flex justify-between items-center text-xs text-zinc-300 py-1 border-b border-slate-50 last:border-0">
                                          <div>
                                            <p className="font-bold text-zinc-100">{highlightText(product?.name || 'Produk', searchTerm)}</p>
                                            <p className="text-[10px] text-zinc-500 font-medium font-mono">SKU: {highlightText(product?.sku || '', searchTerm)} | {item.qty} {product?.unit} @ {formatCurrency(item.price, db.activeCurrency)}</p>
                                          </div>
                                          <span className="font-bold text-zinc-100">{formatCurrency(item.subtotal, db.activeCurrency)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="border-t border-white/[0.04] pt-2 flex flex-col items-end text-xs font-semibold space-y-1">
                                    <div className="flex justify-between w-48">
                                      <span className="text-zinc-500">Subtotal:</span>
                                      <span className="text-zinc-100">{formatCurrency(invoice.subtotal, db.activeCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between w-48">
                                      <span className="text-zinc-500">PPN (Pajak):</span>
                                      <span className="text-zinc-100">{formatCurrency(invoice.tax, db.activeCurrency)}</span>
                                    </div>
                                    <div className="flex justify-between w-48 border-t border-white/[0.04] pt-1.5 font-bold text-slate-950">
                                      <span>Total Tagihan:</span>
                                      <span>{formatCurrency(invoice.total, db.activeCurrency)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredPurchases.length > 0 && (
              <Pagination
                totalItems={filteredPurchases.length}
                currentPage={purchasesPage}
                pageSize={pageSize}
                onPageChange={setPurchasesPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPurchasesPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}


      {/* Mode 5: BUKU KAS & JURNAL UMUM (Operational expenses such as wages, petty cash from PDF) */}
      {(reportMode === 'cashbook' || reportMode === 'general_ledger') && (
        <div className="max-w-7xl mx-auto space-y-4">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Total Kas Masuk (Inflow)</p>
                <h4 className="text-sm font-black text-zinc-100 mt-1">{formatCurrency(totalCashInflow, db.activeCurrency)}</h4>
              </div>
            </div>

            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Total Kas Keluar (Expense/Outflow)</p>
                <h4 className="text-sm font-black text-rose-900 mt-1">{formatCurrency(totalCashOutflow, db.activeCurrency)}</h4>
              </div>
            </div>

            <div className="bg-white border border-white/[0.06] rounded-xl p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Selisih Operasional Net</p>
                <h4 className={`text-sm font-black mt-1 ${totalCashInflow - totalCashOutflow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(totalCashInflow - totalCashOutflow, db.activeCurrency)}
                </h4>
              </div>
            </div>
          </div>

          {/* TABLE PANEL */}
          <div className="bg-white border border-white/[0.06] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-xs text-zinc-100 uppercase tracking-[0.1em]">{reportMode === 'cashbook' ? 'Buku Kas & Pengeluaran Operasional Detil' : 'Buku Jurnal Umum'}</h3>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => handlePrint(reportMode === 'cashbook' ? 'LAPORAN ALIRAN KAS' : 'LAPORAN BUKU JURNAL UMUM')}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                </button>
                <button
                  onClick={() => handleExportExcel(reportMode)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-500 border-collapse">
                <thead className="text-[10px] text-zinc-500 uppercase bg-white/[0.02] border-b border-white/[0.04]">
                  <tr>
                    <th className="py-3 px-4 font-black">Tanggal</th>
                    <th className="py-3 px-4 font-black">Ref Jurnal</th>
                    <th className="py-3 px-4 font-black">Jenis</th>
                    <th className="py-3 px-4 font-black">Keterangan / Transaksi (PDF Log)</th>
                    <th className="py-3 px-4 font-black">Rincian Akun (Debit/Kredit)</th>
                    <th className="py-3 px-4 font-black text-right">Jumlah (Rp)</th>
                    <th className="py-3 px-4 font-black text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-semibold text-zinc-300">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500 italic font-medium">
                        Tidak ada catatan pengeluaran kas atau jurnal yang cocok.
                      </td>
                    </tr>
                  ) : (
                    paginatedLedger.filter(e => reportMode === 'general_ledger' || (reportMode === 'cashbook' && (e.type !== 'Jurnal Umum' || e.details.some(d => d.coaCode.startsWith('11') || d.coaCode.startsWith('12'))))).map((entry) => {
                      return (
                        <tr key={entry.id} className="hover:bg-white/[0.02] transition-all duration-200">
                          <td className="py-3 px-4 text-slate-950 font-bold whitespace-nowrap align-top">{entry.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-100 whitespace-nowrap align-top">{highlightText(entry.reference, searchTerm)}</td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              entry.type === 'Kas Masuk' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              entry.type === 'Kas Keluar' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              'bg-purple-50 text-purple-700 border border-purple-100'
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-100 font-extrabold align-top max-w-xs">{highlightText(entry.description, searchTerm)}</td>
                          <td className="py-3 px-4 align-top">
                            <div className="space-y-1 text-[10px]">
                              {entry.details.map((det, dIdx) => (
                                <div key={dIdx} className="flex justify-between text-zinc-400 font-medium">
                                  <span className={det.credit > 0 ? 'pl-3' : 'font-semibold text-zinc-200'}>
                                    {highlightText(det.coaName, searchTerm)} ({highlightText(det.coaCode, searchTerm)})
                                  </span>
                                  <span className="font-mono font-bold text-zinc-500">
                                    {det.debit > 0 ? `D: ${formatCurrency(det.debit, db.activeCurrency)}` : `K: ${formatCurrency(det.credit, db.activeCurrency)}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-zinc-100 align-top">
                            {formatCurrency(entry.amount, db.activeCurrency)}
                          </td>
                          <td className="py-3 px-4 text-center align-top">
                            <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Yakin ingin menghapus jurnal ini secara permanen? Saldo otomatis menyesuaikan.')) onDeleteTransaction?.(entry.type === 'Jurnal Umum' ? 'Journal' : 'Cash', entry.id); }} className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-md transition-all duration-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {ledgerEntries.length > 0 && (
              <Pagination
                totalItems={ledgerEntries.length}
                currentPage={ledgerPage}
                pageSize={pageSize}
                onPageChange={setLedgerPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setLedgerPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

