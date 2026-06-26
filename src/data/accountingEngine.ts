/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSeedJournals } from './seedData';

export interface Customer {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  balance: number; // Positive means customer owes us money
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  balance: number; // Positive means we owe supplier money
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number; // Average cost price
  sellingPrice: number;
  stock: number;
  warehouse: string;
}

export interface COAAccount {
  id: string;
  code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  type: 'Header' | 'Detail';
  normalBalance: 'Debit' | 'Credit';
  balance: number; // Current balance
}

export interface JournalDetail {
  id: string;
  coaId: string;
  debit: number;
  credit: number;
}

export interface Journal {
  id: string;
  journalNo: string;
  date: string;
  description: string;
  sourceType: 'Manual' | 'Sales' | 'Purchase' | 'CashIn' | 'CashOut' | 'Payment';
  sourceId?: string;
  details: JournalDetail[];
}

export interface InvoiceItem {
  productId: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number; // 12% PPN
  total: number;
  paymentMethod: 'CASH' | 'CREDIT';
  status: 'Unpaid' | 'Paid';
  amountPaid: number;
  branch: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  supplierId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number; // 12% PPN
  total: number;
  paymentMethod: 'CASH' | 'CREDIT';
  status: 'Unpaid' | 'Paid';
  amountPaid: number;
  branch: string;
}

export interface CashTransaction {
  id: string;
  transactionNo: string;
  date: string;
  type: 'In' | 'Out' | 'Transfer';
  fromCoaId: string;
  toCoaId: string;
  amount: number;
  description: string;
  branch: string;
}

// User role definition
export type UserRole = 'Fullstack Developer';

export interface UserSession {
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
}

// Initial Preset Data
const INITIAL_COA: COAAccount[] = [
  // ASET LANCAR (1100 - 1600)
  { id: '1100', code: '1100', name: 'Kas Operasional CV. TB', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1101', code: '1101', name: 'Kas Kecil Ready Mix', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1102', code: '1102', name: 'Kas Kecil Stockpile', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1200', code: '1200', name: 'Bank Kalbar (3125200558)', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1201', code: '1201', name: 'Bank Kalbar - Giro', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1202', code: '1202', name: 'Bank Mandiri Escrow', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1300', code: '1300', name: 'Piutang Usaha', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 12500000 },
  { id: '1301', code: '1301', name: 'Piutang Karyawan', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1302', code: '1302', name: 'Cadangan Kerugian Piutang', category: 'Asset', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '1400', code: '1400', name: 'Persediaan Barang Dagang', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 35000000 },
  { id: '1401', code: '1401', name: 'Persediaan Bahan Baku', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1402', code: '1402', name: 'Persediaan Bahan Pembantu', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1403', code: '1403', name: 'Persediaan Barang Dalam Proses', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1404', code: '1404', name: 'Persediaan Barang Jadi', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1601', code: '1601', name: 'Uang Muka Pembelian', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1602', code: '1602', name: 'Biaya Sewa Dibayar di Muka', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1603', code: '1603', name: 'Biaya Asuransi Dibayar di Muka', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1604', code: '1604', name: 'Pajak Dibayar di Muka - PPh 23', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1605', code: '1605', name: 'Pajak Dibayar di Muka - PPN Masukan', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },

  // ASET TETAP (1700 - 1999)
  { id: '1701', code: '1701', name: 'Aset Tetap - Tanah', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1702', code: '1702', name: 'Aset Tetap - Bangunan & Gedung', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1703', code: '1703', name: 'Akumulasi Penyusutan Bangunan', category: 'Asset', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '1500', code: '1500', name: 'Aset Tetap - Kendaraan', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 150000000 },
  { id: '1599', code: '1599', name: 'Akumulasi Penyusutan Kendaraan', category: 'Asset', type: 'Detail', normalBalance: 'Credit', balance: 30000000 },
  { id: '1704', code: '1704', name: 'Aset Tetap - Peralatan Kantor', category: 'Asset', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '1705', code: '1705', name: 'Akumulasi Penyusutan Peralatan', category: 'Asset', type: 'Detail', normalBalance: 'Credit', balance: 0 },

  // KEWAJIBAN JANGKA PENDEK (2100 - 2199)
  { id: '2100', code: '2100', name: 'Hutang Usaha', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 18500000 },
  { id: '2101', code: '2101', name: 'Hutang Gaji & Upah', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '2102', code: '2102', name: 'Hutang Beban Akrual', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '2103', code: '2103', name: 'Hutang Pajak - PPh 21', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '2104', code: '2104', name: 'Hutang Pajak - PPh 23', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '2200', code: '2200', name: 'Hutang Pajak (PPN)', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 2400000 },
  { id: '2105', code: '2105', name: 'Hutang Pajak - PPN Keluaran', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '2106', code: '2106', name: 'Uang Muka Penjualan', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '2107', code: '2107', name: 'Pendapatan Diterima di Muka', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },

  // KEWAJIBAN JANGKA PANJANG (2200 - 2999)
  { id: '2501', code: '2501', name: 'Hutang Bank Jangka Panjang', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '2502', code: '2502', name: 'Hutang Obligasi', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '2503', code: '2503', name: 'Kewajiban Imbalan Pasca Kerja', category: 'Liability', type: 'Detail', normalBalance: 'Credit', balance: 0 },

  // EKUITAS (3000 - 3999)
  { id: '3100', code: '3100', name: 'Modal Disetor', category: 'Equity', type: 'Detail', normalBalance: 'Credit', balance: 300000000 },
  { id: '3101', code: '3101', name: 'Tambahan Modal Disetor (Agio)', category: 'Equity', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '3102', code: '3102', name: 'Prive / Penarikan Pemilik', category: 'Equity', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '3200', code: '3200', name: 'Laba Ditahan', category: 'Equity', type: 'Detail', normalBalance: 'Credit', balance: 21600000 },
  { id: '3300', code: '3300', name: 'Dividen', category: 'Equity', type: 'Detail', normalBalance: 'Debit', balance: 0 },

  // PENDAPATAN (4000 - 4999)
  { id: '4100', code: '4100', name: 'Pendapatan Penjualan', category: 'Revenue', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '4101', code: '4101', name: 'Pendapatan Penjualan Jasa', category: 'Revenue', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '4201', code: '4201', name: 'Retur Penjualan', category: 'Revenue', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '4202', code: '4202', name: 'Potongan Penjualan', category: 'Revenue', type: 'Detail', normalBalance: 'Debit', balance: 0 },

  // HARGA POKOK PENJUALAN (5000 - 5999)
  { id: '5100', code: '5100', name: 'Harga Pokok Penjualan (HPP)', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '5101', code: '5101', name: 'Beban Angkut Pembelian', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '5102', code: '5102', name: 'Potongan Pembelian', category: 'Expense', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '5103', code: '5103', name: 'Retur Pembelian', category: 'Expense', type: 'Detail', normalBalance: 'Credit', balance: 0 },

  // BEBAN OPERASIONAL (6000 - 6999)
  { id: '6100', code: '6100', name: 'Beban Gaji & Upah', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6101', code: '6101', name: 'Beban Tunjangan & THR', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6200', code: '6200', name: 'Beban Listrik, Air & Internet', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6300', code: '6300', name: 'Beban Sewa Kantor', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6401', code: '6401', name: 'Beban ATK & Perlengkapan Kantor', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6402', code: '6402', name: 'Beban Pemeliharaan & Perbaikan', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6403', code: '6403', name: 'Beban Transportasi & Perjalanan Dinas', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6404', code: '6404', name: 'Beban Promosi & Pemasaran', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6405', code: '6405', name: 'Beban Konsumsi & Representasi', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6406', code: '6406', name: 'Beban Legal & Perizinan', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6407', code: '6407', name: 'Beban Jasa Profesional / Konsultan', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6408', code: '6408', name: 'Beban Asuransi', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6501', code: '6501', name: 'Beban Penyusutan Bangunan', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6502', code: '6502', name: 'Beban Penyusutan Kendaraan', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6503', code: '6503', name: 'Beban Penyusutan Peralatan', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6601', code: '6601', name: 'Beban Pajak Penghasilan (PPh Badan)', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '6999', code: '6999', name: 'Beban Operasional Lainnya', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },

  // PENDAPATAN & BEBAN NON-OPERASIONAL (7000 - 7999)
  { id: '7101', code: '7101', name: 'Pendapatan Bunga Bank', category: 'Revenue', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '7102', code: '7102', name: 'Keuntungan Selisih Kurs', category: 'Revenue', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '7103', code: '7103', name: 'Pendapatan Lain-lain Non-Operasional', category: 'Revenue', type: 'Detail', normalBalance: 'Credit', balance: 0 },
  { id: '7201', code: '7201', name: 'Beban Bunga & Administrasi Bank', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '7202', code: '7202', name: 'Kerugian Selisih Kurs', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
  { id: '7203', code: '7203', name: 'Beban Non-Operasional Lain-lain', category: 'Expense', type: 'Detail', normalBalance: 'Debit', balance: 0 },
];

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_SUPPLIERS: Supplier[] = [];

const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_JOURNALS: Journal[] = [
  {
    id: 'j-init-1',
    journalNo: 'JR-00001',
    date: '2026-01-01',
    description: 'Saldo Awal - Kas & Bank Kalbar (Pembukaan Buku)',
    sourceType: 'Manual',
    details: [
      { id: 'jd1', coaId: '1200', debit: 204902847, credit: 0 },
      { id: 'jd2', coaId: '3200', debit: 0, credit: 204902847 },
    ]
  },
  // Sales Invoices Journal entries
  {
    id: 'js-1',
    journalNo: 'JR-S-202601001',
    date: '2026-01-13',
    description: 'Pendapatan Penjualan - PT. Gregah Sukses Mandiri',
    sourceType: 'Sales',
    sourceId: 'inv-s1',
    details: [
      { id: 'jsd1', coaId: '1200', debit: 154800000, credit: 0 },
      { id: 'jsd2', coaId: '4100', debit: 0, credit: 154800000 },
    ]
  },
  {
    id: 'js-2',
    journalNo: 'JR-S-202601002',
    date: '2026-01-14',
    description: 'Pendapatan Penjualan - PT. Gregah Sukses Mandiri',
    sourceType: 'Sales',
    sourceId: 'inv-s2',
    details: [
      { id: 'jsd3', coaId: '1200', debit: 160363750, credit: 0 },
      { id: 'jsd4', coaId: '4100', debit: 0, credit: 160363750 },
    ]
  },
  {
    id: 'js-3',
    journalNo: 'JR-S-202601003',
    date: '2026-01-20',
    description: 'Pendapatan Penjualan - PT. Jatim Propertindo Jaya',
    sourceType: 'Sales',
    sourceId: 'inv-s3',
    details: [
      { id: 'jsd5', coaId: '1200', debit: 593999999, credit: 0 },
      { id: 'jsd6', coaId: '4100', debit: 0, credit: 593999999 },
    ]
  },
  {
    id: 'js-4',
    journalNo: 'JR-S-202601004',
    date: '2026-01-20',
    description: 'Pendapatan Penjualan - PT. Jatim Propertindo Jaya (Stockpile)',
    sourceType: 'Sales',
    sourceId: 'inv-s4',
    details: [
      { id: 'jsd7', coaId: '1200', debit: 154800000, credit: 0 },
      { id: 'jsd8', coaId: '4100', debit: 0, credit: 154800000 },
    ]
  },
  {
    id: 'js-5',
    journalNo: 'JR-S-202601005',
    date: '2026-01-21',
    description: 'Pendapatan Penjualan - PT. Gregah Sukses Mandiri',
    sourceType: 'Sales',
    sourceId: 'inv-s5',
    details: [
      { id: 'jsd9', coaId: '1200', debit: 104058900, credit: 0 },
      { id: 'jsd10', coaId: '4100', debit: 0, credit: 104058900 },
    ]
  },
  {
    id: 'js-6',
    journalNo: 'JR-S-202601030',
    date: '2026-01-30',
    description: 'Pendapatan Penjualan - PT. Jatim Propertindo Jaya',
    sourceType: 'Sales',
    sourceId: 'inv-s6',
    details: [
      { id: 'jsd11', coaId: '1200', debit: 692999999, credit: 0 },
      { id: 'jsd12', coaId: '4100', debit: 0, credit: 692999999 },
    ]
  },
  {
    id: 'js-7',
    journalNo: 'JR-S-202602001',
    date: '2026-02-02',
    description: 'Pendapatan Penjualan - PT. Gregah Sukses Mandiri',
    sourceType: 'Sales',
    sourceId: 'inv-s7',
    details: [
      { id: 'jsd13', coaId: '1200', debit: 242804100, credit: 0 },
      { id: 'jsd14', coaId: '4100', debit: 0, credit: 242804100 },
    ]
  },
  {
    id: 'js-8',
    journalNo: 'JR-S-202602013',
    date: '2026-02-13',
    description: 'Pendapatan Penjualan - PT. Jatim Propertindo Jaya',
    sourceType: 'Sales',
    sourceId: 'inv-s8',
    details: [
      { id: 'jsd15', coaId: '1200', debit: 692999999, credit: 0 },
      { id: 'jsd16', coaId: '4100', debit: 0, credit: 692999999 },
    ]
  },
  {
    id: 'js-9',
    journalNo: 'JR-S-202602014',
    date: '2026-02-13',
    description: 'Pendapatan Penjualan - PT. Gregah Sukses Mandiri',
    sourceType: 'Sales',
    sourceId: 'inv-s9',
    details: [
      { id: 'jsd17', coaId: '1200', debit: 49950000, credit: 0 },
      { id: 'jsd18', coaId: '4100', debit: 0, credit: 49950000 },
    ]
  },
  {
    id: 'js-10',
    journalNo: 'JR-S-202602025',
    date: '2026-02-25',
    description: 'Pendapatan Penjualan - PT. Gregah Sukses Mandiri',
    sourceType: 'Sales',
    sourceId: 'inv-s10',
    details: [
      { id: 'jsd19', coaId: '1200', debit: 96266700, credit: 0 },
      { id: 'jsd20', coaId: '4100', debit: 0, credit: 96266700 },
    ]
  },
  {
    id: 'js-11',
    journalNo: 'JR-S-202603016',
    date: '2026-03-16',
    description: 'Pendapatan Penjualan - PT. Gregah Sukses Mandiri',
    sourceType: 'Sales',
    sourceId: 'inv-s11',
    details: [
      { id: 'jsd21', coaId: '1200', debit: 170071170, credit: 0 },
      { id: 'jsd22', coaId: '4100', debit: 0, credit: 170071170 },
    ]
  },
  {
    id: 'js-12',
    journalNo: 'JR-S-202604017',
    date: '2026-04-17',
    description: 'Pendapatan Penjualan - PT. Gregah Sukses Mandiri',
    sourceType: 'Sales',
    sourceId: 'inv-s12',
    details: [
      { id: 'jsd23', coaId: '1200', debit: 47487800, credit: 0 },
      { id: 'jsd24', coaId: '4100', debit: 0, credit: 47487800 },
    ]
  },

  // Material Purchases Journal entries (Paid via cash/bank Kalbar)
  {
    id: 'jp-1',
    journalNo: 'JR-P-202601001',
    date: '2026-01-16',
    description: 'Pembelian Semen Conch - PT. Semen Conch Indonesia',
    sourceType: 'Purchase',
    sourceId: 'inv-p1',
    details: [
      { id: 'jpd1', coaId: '1400', debit: 32700000, credit: 0 },
      { id: 'jpd2', coaId: '1200', debit: 0, credit: 32700000 },
    ]
  },
  {
    id: 'jp-2',
    journalNo: 'JR-P-202601002',
    date: '2026-01-18',
    description: 'Pembelian Semen Conch - PT. Semen Conch Indonesia',
    sourceType: 'Purchase',
    sourceId: 'inv-p2',
    details: [
      { id: 'jpd3', coaId: '1400', debit: 49050000, credit: 0 },
      { id: 'jpd4', coaId: '1200', debit: 0, credit: 49050000 },
    ]
  },
  {
    id: 'jp-3',
    journalNo: 'JR-P-202601003',
    date: '2026-01-18',
    description: 'Pembelian Obat Beton - PT. Semen Conch Indonesia',
    sourceType: 'Purchase',
    sourceId: 'inv-p3',
    details: [
      { id: 'jpd5', coaId: '1400', debit: 42624000, credit: 0 },
      { id: 'jpd6', coaId: '1200', debit: 0, credit: 42624000 },
    ]
  },
  {
    id: 'jp-4',
    journalNo: 'JR-P-202601004',
    date: '2026-01-18',
    description: 'Pembelian Pasir Cor - CV. Boma Batu Split',
    sourceType: 'Purchase',
    sourceId: 'inv-p4',
    details: [
      { id: 'jpd7', coaId: '1400', debit: 16120000, credit: 0 },
      { id: 'jpd8', coaId: '1200', debit: 0, credit: 16120000 },
    ]
  },
  {
    id: 'jp-5',
    journalNo: 'JR-P-202601005',
    date: '2026-01-18',
    description: 'Pembelian Batu Split 1x2 - CV. Boma Batu Split',
    sourceType: 'Purchase',
    sourceId: 'inv-p5',
    details: [
      { id: 'jpd9', coaId: '1400', debit: 28000000, credit: 0 },
      { id: 'jpd10', coaId: '1200', debit: 0, credit: 28000000 },
    ]
  },
  {
    id: 'jp-6',
    journalNo: 'JR-P-202601006',
    date: '2026-01-17',
    description: 'Pembelian Batu Split 1x2 - CV. Boma Batu Split',
    sourceType: 'Purchase',
    sourceId: 'inv-p6',
    details: [
      { id: 'jpd11', coaId: '1400', debit: 8400000, credit: 0 },
      { id: 'jpd12', coaId: '1200', debit: 0, credit: 8400000 },
    ]
  },
  {
    id: 'jp-7',
    journalNo: 'JR-P-202601091',
    date: '2026-01-09',
    description: 'Pembelian Batu Split 1x2 - CV. Boma',
    sourceType: 'Purchase',
    sourceId: 'inv-p7',
    details: [
      { id: 'jpd13', coaId: '1400', debit: 19600000, credit: 0 },
      { id: 'jpd14', coaId: '1200', debit: 0, credit: 19600000 },
    ]
  },
  {
    id: 'jp-8',
    journalNo: 'JR-P-202601092',
    date: '2026-01-09',
    description: 'Pembelian Semen Conch - PT. Semen Conch Indonesia',
    sourceType: 'Purchase',
    sourceId: 'inv-p8',
    details: [
      { id: 'jpd15', coaId: '1400', debit: 33000000, credit: 0 },
      { id: 'jpd16', coaId: '1200', debit: 0, credit: 33000000 },
    ]
  },
  {
    id: 'jp-9',
    journalNo: 'JR-P-202601141',
    date: '2026-01-14',
    description: 'Pembelian Semen Conch Jumbo - PT. Semen Conch',
    sourceType: 'Purchase',
    sourceId: 'inv-p9',
    details: [
      { id: 'jpd17', coaId: '1400', debit: 69000000, credit: 0 },
      { id: 'jpd18', coaId: '1200', debit: 0, credit: 69000000 },
    ]
  },
  {
    id: 'jp-10',
    journalNo: 'JR-P-202601311',
    date: '2026-01-31',
    description: 'Pembelian Semen Conch - PT. Semen Conch',
    sourceType: 'Purchase',
    sourceId: 'inv-p10',
    details: [
      { id: 'jpd19', coaId: '1400', debit: 32700000, credit: 0 },
      { id: 'jpd20', coaId: '1200', debit: 0, credit: 32700000 },
    ]
  },
  {
    id: 'jp-11',
    journalNo: 'JR-P-202602021',
    date: '2026-02-02',
    description: 'Pembelian Semen Conch Large - PT. Semen Conch',
    sourceType: 'Purchase',
    sourceId: 'inv-p11',
    details: [
      { id: 'jpd21', coaId: '1400', debit: 99664000, credit: 0 },
      { id: 'jpd22', coaId: '1200', debit: 0, credit: 99664000 },
    ]
  },
  {
    id: 'jp-12',
    journalNo: 'JR-P-202602022',
    date: '2026-02-02',
    description: 'Pembelian Pasir Cor - CV. Boma',
    sourceType: 'Purchase',
    sourceId: 'inv-p12',
    details: [
      { id: 'jpd23', coaId: '1400', debit: 16055000, credit: 0 },
      { id: 'jpd24', coaId: '1200', debit: 0, credit: 16055000 },
    ]
  },
  {
    id: 'jp-13',
    journalNo: 'JR-P-202602023',
    date: '2026-02-02',
    description: 'Pembelian Batu Split - CV. Boma',
    sourceType: 'Purchase',
    sourceId: 'inv-p13',
    details: [
      { id: 'jpd25', coaId: '1400', debit: 42000000, credit: 0 },
      { id: 'jpd26', coaId: '1200', debit: 0, credit: 42000000 },
    ]
  },
  {
    id: 'jp-14',
    journalNo: 'JR-P-202602041',
    date: '2026-02-04',
    description: 'Pembelian Semen Conch - PT. Semen Conch',
    sourceType: 'Purchase',
    sourceId: 'inv-p14',
    details: [
      { id: 'jpd27', coaId: '1400', debit: 15420000, credit: 0 },
      { id: 'jpd28', coaId: '1200', debit: 0, credit: 15420000 },
    ]
  },

  // Bank Transfers from Bank Kalbar to Kas Operasional (representing cash withdrawals)
  {
    id: 'jtx-1',
    journalNo: 'JR-TX-001',
    date: '2026-01-02',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd1', coaId: '1100', debit: 175000000, credit: 0 },
      { id: 'jtd2', coaId: '1200', debit: 0, credit: 175000000 },
    ]
  },
  {
    id: 'jtx-2',
    journalNo: 'JR-TX-002',
    date: '2026-01-13',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd3', coaId: '1100', debit: 22000000, credit: 0 },
      { id: 'jtd4', coaId: '1200', debit: 0, credit: 22000000 },
    ]
  },
  {
    id: 'jtx-3',
    journalNo: 'JR-TX-003',
    date: '2026-01-14',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd5', coaId: '1100', debit: 130000000, credit: 0 },
      { id: 'jtd6', coaId: '1200', debit: 0, credit: 130000000 },
    ]
  },
  {
    id: 'jtx-4',
    journalNo: 'JR-TX-004',
    date: '2026-01-19',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd7', coaId: '1100', debit: 159000000, credit: 0 },
      { id: 'jtd8', coaId: '1200', debit: 0, credit: 159000000 },
    ]
  },
  {
    id: 'jtx-5',
    journalNo: 'JR-TX-005',
    date: '2026-01-20',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd9', coaId: '1100', debit: 250000000, credit: 0 },
      { id: 'jtd10', coaId: '1200', debit: 0, credit: 250000000 },
    ]
  },
  {
    id: 'jtx-6',
    journalNo: 'JR-TX-006',
    date: '2026-01-21',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd11', coaId: '1100', debit: 250000000, credit: 0 },
      { id: 'jtd12', coaId: '1200', debit: 0, credit: 250000000 },
    ]
  },
  {
    id: 'jtx-7',
    journalNo: 'JR-TX-007',
    date: '2026-01-26',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd13', coaId: '1100', debit: 350000000, credit: 0 },
      { id: 'jtd14', coaId: '1200', debit: 0, credit: 350000000 },
    ]
  },
  {
    id: 'jtx-8',
    journalNo: 'JR-TX-008',
    date: '2026-01-30',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd15', coaId: '1100', debit: 30000000, credit: 0 },
      { id: 'jtd16', coaId: '1200', debit: 0, credit: 30000000 },
    ]
  },
  {
    id: 'jtx-9',
    journalNo: 'JR-TX-009',
    date: '2026-01-31',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd17', coaId: '1100', debit: 150000000, credit: 0 },
      { id: 'jtd18', coaId: '1200', debit: 0, credit: 150000000 },
    ]
  },
  {
    id: 'jtx-10',
    journalNo: 'JR-TX-010',
    date: '2026-02-02',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd19', coaId: '1100', debit: 390000000, credit: 0 },
      { id: 'jtd20', coaId: '1200', debit: 0, credit: 390000000 },
    ]
  },
  {
    id: 'jtx-11',
    journalNo: 'JR-TX-011',
    date: '2026-02-03',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd21', coaId: '1100', debit: 270000000, credit: 0 },
      { id: 'jtd22', coaId: '1200', debit: 0, credit: 270000000 },
    ]
  },
  {
    id: 'jtx-12',
    journalNo: 'JR-TX-012',
    date: '2026-02-13',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd23', coaId: '1100', debit: 49950000, credit: 0 },
      { id: 'jtd24', coaId: '1200', debit: 0, credit: 49950000 },
    ]
  },
  {
    id: 'jtx-13',
    journalNo: 'JR-TX-013',
    date: '2026-02-18',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd25', coaId: '1100', debit: 870000000, credit: 0 },
      { id: 'jtd26', coaId: '1200', debit: 0, credit: 870000000 },
    ]
  },
  {
    id: 'jtx-14',
    journalNo: 'JR-TX-014',
    date: '2026-02-26',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd27', coaId: '1100', debit: 76000000, credit: 0 },
      { id: 'jtd28', coaId: '1200', debit: 0, credit: 76000000 },
    ]
  },
  {
    id: 'jtx-15',
    journalNo: 'JR-TX-015',
    date: '2026-03-17',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd29', coaId: '1100', debit: 195000000, credit: 0 },
      { id: 'jtd30', coaId: '1200', debit: 0, credit: 195000000 },
    ]
  },
  {
    id: 'jtx-16',
    journalNo: 'JR-TX-016',
    date: '2026-04-20',
    description: 'Penarikan Tunai Mandiri/Kalbar - Kas Operasional (Oktavianus)',
    sourceType: 'Manual',
    details: [
      { id: 'jtd31', coaId: '1100', debit: 47400000, credit: 0 },
      { id: 'jtd32', coaId: '1200', debit: 0, credit: 47400000 },
    ]
  },

  // Operational cash expenditure Journals (Paid from 1100)
  {
    id: 'je-1',
    journalNo: 'JR-E-001',
    date: '2026-01-06',
    description: 'Beban Sewa Alat: Bayar Exsa 50 jam @ 650,000',
    sourceType: 'Manual',
    details: [
      { id: 'jed1', coaId: '6999', debit: 32500000, credit: 0 },
      { id: 'jed2', coaId: '1100', debit: 0, credit: 32500000 },
    ]
  },
  {
    id: 'je-2',
    journalNo: 'JR-E-002',
    date: '2026-01-06',
    description: 'Beban Transport: Mob Demob Exsa 1 Ret @ 3,500,000 & Biaya Penurunan',
    sourceType: 'Manual',
    details: [
      { id: 'jed3', coaId: '6403', debit: 4300000, credit: 0 },
      { id: 'jed4', coaId: '1100', debit: 0, credit: 4300000 },
    ]
  },
  {
    id: 'je-3',
    journalNo: 'JR-E-003',
    date: '2026-01-12',
    description: 'Beban Sewa: Sewa Mixer 2 Unit',
    sourceType: 'Manual',
    details: [
      { id: 'jed5', coaId: '6300', debit: 30000000, credit: 0 },
      { id: 'jed6', coaId: '1100', debit: 0, credit: 30000000 },
    ]
  },
  {
    id: 'je-4-1',
    journalNo: 'JR-E-004-1',
    date: '2026-01-15',
    description: 'Beban Konsumsi: Bayar Rokok Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed7-1', coaId: '6405', debit: 88000, credit: 0 },
      { id: 'jed8-1', coaId: '1100', debit: 0, credit: 88000 },
    ]
  },
  {
    id: 'je-4-2',
    journalNo: 'JR-E-004-2',
    date: '2026-01-15',
    description: 'Beban Konsumsi: Makan dan Minum Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed7-2', coaId: '6405', debit: 128000, credit: 0 },
      { id: 'jed8-2', coaId: '1100', debit: 0, credit: 128000 },
    ]
  },
  {
    id: 'je-4-3',
    journalNo: 'JR-E-004-3',
    date: '2026-01-15',
    description: 'Beban Konsumsi: Minum di Warkop Malado',
    sourceType: 'Manual',
    details: [
      { id: 'jed7-3', coaId: '6405', debit: 85000, credit: 0 },
      { id: 'jed8-3', coaId: '1100', debit: 0, credit: 85000 },
    ]
  },
  {
    id: 'je-5-1',
    journalNo: 'JR-E-005-1',
    date: '2026-01-16',
    description: 'Beban Operasional Lapangan: Pengeluaran TB Operasional',
    sourceType: 'Manual',
    details: [
      { id: 'jed9-1', coaId: '6999', debit: 15000000, credit: 0 },
      { id: 'jed10-1', coaId: '1100', debit: 0, credit: 15000000 },
    ]
  },
  {
    id: 'je-5-2',
    journalNo: 'JR-E-005-2',
    date: '2026-01-16',
    description: 'Beban Konsumsi: Biaya Minum Plural Coffe (PN)',
    sourceType: 'Manual',
    details: [
      { id: 'jed9-2', coaId: '6405', debit: 165000, credit: 0 },
      { id: 'jed10-2', coaId: '1100', debit: 0, credit: 165000 },
    ]
  },
  {
    id: 'je-5-3',
    journalNo: 'JR-E-005-3',
    date: '2026-01-16',
    description: 'Beban Transport: Bayar Solar Mobil Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed9-3', coaId: '6403', debit: 500000, credit: 0 },
      { id: 'jed10-3', coaId: '1100', debit: 0, credit: 500000 },
    ]
  },
  {
    id: 'je-7-1',
    journalNo: 'JR-E-007-1',
    date: '2026-01-17',
    description: 'Beban Pemeliharaan: Kabel Fiting Lampu',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-1', coaId: '6402', debit: 173000, credit: 0 },
      { id: 'jed14-1', coaId: '1100', debit: 0, credit: 173000 },
    ]
  },
  {
    id: 'je-7-2',
    journalNo: 'JR-E-007-2',
    date: '2026-01-17',
    description: 'Beban Pemeliharaan: Lampu Lalin Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-2', coaId: '6402', debit: 290000, credit: 0 },
      { id: 'jed14-2', coaId: '1100', debit: 0, credit: 290000 },
    ]
  },
  {
    id: 'je-7-3',
    journalNo: 'JR-E-007-3',
    date: '2026-01-17',
    description: 'Beban Konsumsi: Makan BTG Nareh (6 Bks)',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-3', coaId: '6405', debit: 175000, credit: 0 },
      { id: 'jed14-3', coaId: '1100', debit: 0, credit: 175000 },
    ]
  },
  {
    id: 'je-7-4',
    journalNo: 'JR-E-007-4',
    date: '2026-01-17',
    description: 'Beban Transport: Pertalite dan Rokok Surya',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-4', coaId: '6403', debit: 104000, credit: 0 },
      { id: 'jed14-4', coaId: '1100', debit: 0, credit: 104000 },
    ]
  },
  {
    id: 'je-7-5',
    journalNo: 'JR-E-007-5',
    date: '2026-01-17',
    description: 'Beban Konsumsi: Pembelian Rokok Pekerja',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-5', coaId: '6405', debit: 300000, credit: 0 },
      { id: 'jed14-5', coaId: '1100', debit: 0, credit: 300000 },
    ]
  },
  {
    id: 'je-7-6',
    journalNo: 'JR-E-007-6',
    date: '2026-01-17',
    description: 'Beban Perlengkapan: Plastik Cor (1 Roll)',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-6', coaId: '6401', debit: 95000, credit: 0 },
      { id: 'jed14-6', coaId: '1100', debit: 0, credit: 95000 },
    ]
  },
  {
    id: 'je-7-7',
    journalNo: 'JR-E-007-7',
    date: '2026-01-17',
    description: 'Beban Konsumsi: Kopi, Nestle, Energen',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-7', coaId: '6405', debit: 75000, credit: 0 },
      { id: 'jed14-7', coaId: '1100', debit: 0, credit: 75000 },
    ]
  },
  {
    id: 'je-7-8',
    journalNo: 'JR-E-007-8',
    date: '2026-01-17',
    description: 'Beban Konsumsi: Nesle Mineral Botol (1 Dus)',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-8', coaId: '6405', debit: 325000, credit: 0 },
      { id: 'jed14-8', coaId: '1100', debit: 0, credit: 325000 },
    ]
  },
  {
    id: 'je-7-9',
    journalNo: 'JR-E-007-9',
    date: '2026-01-17',
    description: 'Beban Konsumsi: Pembelian Botol',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-9', coaId: '6405', debit: 40000, credit: 0 },
      { id: 'jed14-9', coaId: '1100', debit: 0, credit: 40000 },
    ]
  },
  {
    id: 'je-7-10',
    journalNo: 'JR-E-007-10',
    date: '2026-01-17',
    description: 'Beban Perlengkapan: Pilok Warna',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-10', coaId: '6401', debit: 38000, credit: 0 },
      { id: 'jed14-10', coaId: '1100', debit: 0, credit: 38000 },
    ]
  },
  {
    id: 'je-7-11',
    journalNo: 'JR-E-007-11',
    date: '2026-01-17',
    description: 'Beban Perlengkapan: Rapia Hitam Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-11', coaId: '6401', debit: 42000, credit: 0 },
      { id: 'jed14-11', coaId: '1100', debit: 0, credit: 42000 },
    ]
  },
  {
    id: 'je-7-12',
    journalNo: 'JR-E-007-12',
    date: '2026-01-17',
    description: 'Beban Pemeliharaan: Lampu 30 Watt Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-12', coaId: '6402', debit: 50000, credit: 0 },
      { id: 'jed14-12', coaId: '1100', debit: 0, credit: 50000 },
    ]
  },
  {
    id: 'je-7-13',
    journalNo: 'JR-E-007-13',
    date: '2026-01-17',
    description: 'Beban Alat Tulis & Kantor: Nota Kontan (2 Pcs)',
    sourceType: 'Manual',
    details: [
      { id: 'jed13-13', coaId: '6401', debit: 10000, credit: 0 },
      { id: 'jed14-13', coaId: '1100', debit: 0, credit: 10000 },
    ]
  },
  {
    id: 'je-8',
    journalNo: 'JR-E-008',
    date: '2026-01-18',
    description: 'Beban Gaji & Upah: Bayar Tukang Harian 6 Orang',
    sourceType: 'Manual',
    details: [
      { id: 'jed15', coaId: '6100', debit: 3600000, credit: 0 },
      { id: 'jed16', coaId: '1100', debit: 0, credit: 3600000 },
    ]
  },
  {
    id: 'je-9-1',
    journalNo: 'JR-E-009-1',
    date: '2026-01-18',
    description: 'Beban Konsumsi: Bayar Nasi Catering Lapangan (125 Bks)',
    sourceType: 'Manual',
    details: [
      { id: 'jed17-1', coaId: '6405', debit: 2500000, credit: 0 },
      { id: 'jed18-1', coaId: '1100', debit: 0, credit: 2500000 },
    ]
  },
  {
    id: 'je-9-2',
    journalNo: 'JR-E-009-2',
    date: '2026-01-18',
    description: 'Beban Konsumsi: Pembelian Air Mineral (11 Botol)',
    sourceType: 'Manual',
    details: [
      { id: 'jed17-2', coaId: '6405', debit: 55000, credit: 0 },
      { id: 'jed18-2', coaId: '1100', debit: 0, credit: 55000 },
    ]
  },
  {
    id: 'je-10-1',
    journalNo: 'JR-E-010-1',
    date: '2026-01-18',
    description: 'Beban Perlengkapan: Bayar Warmes dan Plastik Cor Pelangi',
    sourceType: 'Manual',
    details: [
      { id: 'jed19-1', coaId: '6401', debit: 2540000, credit: 0 },
      { id: 'jed20-1', coaId: '1100', debit: 0, credit: 2540000 },
    ]
  },
  {
    id: 'je-10-2',
    journalNo: 'JR-E-010-2',
    date: '2026-01-18',
    description: 'Beban Perlengkapan: Bayar Koko Toko Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed19-2', coaId: '6401', debit: 2540000, credit: 0 },
      { id: 'jed20-2', coaId: '1100', debit: 0, credit: 2540000 },
    ]
  },
  {
    id: 'je-20-1',
    journalNo: 'JR-E-020-1',
    date: '2026-01-19',
    description: 'Beban Operasional Lapangan: Pegangan Mas Suhar',
    sourceType: 'Manual',
    details: [
      { id: 'jed20-1-1', coaId: '6999', debit: 500000, credit: 0 },
      { id: 'jed20-1-2', coaId: '1100', debit: 0, credit: 500000 },
    ]
  },
  {
    id: 'je-21-1',
    journalNo: 'JR-E-021-1',
    date: '2026-01-20',
    description: 'Beban Konsumsi: Biaya Minum Lapangan, Dll',
    sourceType: 'Manual',
    details: [
      { id: 'jed21-1-1', coaId: '6405', debit: 435000, credit: 0 },
      { id: 'jed21-1-2', coaId: '1100', debit: 0, credit: 435000 },
    ]
  },
  {
    id: 'je-21-2',
    journalNo: 'JR-E-021-2',
    date: '2026-01-20',
    description: 'Beban Perlengkapan: Pembelian Plastik Cor',
    sourceType: 'Manual',
    details: [
      { id: 'jed21-2-1', coaId: '6401', debit: 95000, credit: 0 },
      { id: 'jed21-2-2', coaId: '1100', debit: 0, credit: 95000 },
    ]
  },
  {
    id: 'je-21-3',
    journalNo: 'JR-E-021-3',
    date: '2026-01-20',
    description: 'Beban Konsumsi: Biaya Makan Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed21-3-1', coaId: '6405', debit: 285000, credit: 0 },
      { id: 'jed21-3-2', coaId: '1100', debit: 0, credit: 285000 },
    ]
  },

  // DATA KEUANGAN CV. TB READY MIX (1/6/2026)
  {
    id: 'je-ready-1',
    journalNo: 'JR-E-RD-001',
    date: '2026-01-06',
    description: 'Beban Gaji & Upah: Upah Jaga Malam (1 Malam)',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd1', coaId: '6100', debit: 200000, credit: 0 },
      { id: 'jedrd2', coaId: '1100', debit: 0, credit: 200000 },
    ]
  },
  {
    id: 'je-ready-2',
    journalNo: 'JR-E-RD-002',
    date: '2026-01-06',
    description: 'Beban Konsumsi: Makan Minum J Cofee Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd3', coaId: '6405', debit: 550000, credit: 0 },
      { id: 'jedrd4', coaId: '1100', debit: 0, credit: 550000 },
    ]
  },
  {
    id: 'je-ready-3',
    journalNo: 'JR-E-RD-003',
    date: '2026-01-06',
    description: 'Beban Gaji & Upah: Kasi Tukang Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd5', coaId: '6100', debit: 100000, credit: 0 },
      { id: 'jedrd6', coaId: '1100', debit: 0, credit: 100000 },
    ]
  },
  {
    id: 'je-ready-4',
    journalNo: 'JR-E-RD-004',
    date: '2026-01-06',
    description: 'Beban Operasional Lapangan: Pembelian Terucuk',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd7', coaId: '6999', debit: 200000, credit: 0 },
      { id: 'jedrd8', coaId: '1100', debit: 0, credit: 200000 },
    ]
  },
  {
    id: 'je-ready-5',
    journalNo: 'JR-E-RD-005',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Papan Mall 5/3 (100 Keping)',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd9', coaId: '6401', debit: 1400000, credit: 0 },
      { id: 'jedrd10', coaId: '1100', debit: 0, credit: 1400000 },
    ]
  },
  {
    id: 'je-ready-6',
    journalNo: 'JR-E-RD-006',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Pembelian Material Toko',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd11', coaId: '6401', debit: 572000, credit: 0 },
      { id: 'jedrd12', coaId: '1100', debit: 0, credit: 572000 },
    ]
  },
  {
    id: 'je-ready-7',
    journalNo: 'JR-E-RD-007',
    date: '2026-01-06',
    description: 'Beban Operasional Lapangan: Sopoi Jalan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd13', coaId: '6999', debit: 50000, credit: 0 },
      { id: 'jedrd14', coaId: '1100', debit: 0, credit: 50000 },
    ]
  },
  {
    id: 'je-ready-8',
    journalNo: 'JR-E-RD-008',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Pembelian Material Toko Tambahan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd15', coaId: '6401', debit: 572000, credit: 0 },
      { id: 'jedrd16', coaId: '1100', debit: 0, credit: 572000 },
    ]
  },
  {
    id: 'je-ready-9',
    journalNo: 'JR-E-RD-009',
    date: '2026-01-06',
    description: 'Beban Peralatan/Aset: TC 1 Unit (1 Pcs)',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd17', coaId: '1302', debit: 1251000, credit: 0 },
      { id: 'jedrd18', coaId: '1100', debit: 0, credit: 1251000 },
    ]
  },
  {
    id: 'je-ready-10',
    journalNo: 'JR-E-RD-010',
    date: '2026-01-06',
    description: 'Beban Konsumsi: Pembelian Buah Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd19', coaId: '6405', debit: 150000, credit: 0 },
      { id: 'jedrd20', coaId: '1100', debit: 0, credit: 150000 },
    ]
  },
  {
    id: 'je-ready-11',
    journalNo: 'JR-E-RD-011',
    date: '2026-01-06',
    description: 'Beban Konsumsi: Pembelian Minuman Pekerja',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd21', coaId: '6405', debit: 30000, credit: 0 },
      { id: 'jedrd22', coaId: '1100', debit: 0, credit: 30000 },
    ]
  },
  {
    id: 'je-ready-12',
    journalNo: 'JR-E-RD-012',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Pembelian Kawat Bendrat (2.5 Kg)',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd23', coaId: '6401', debit: 50000, credit: 0 },
      { id: 'jedrd24', coaId: '1100', debit: 0, credit: 50000 },
    ]
  },
  {
    id: 'je-ready-13',
    journalNo: 'JR-E-RD-013',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Pembelian Beton Mix 2 Liter (2 Liter)',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd25', coaId: '6401', debit: 86000, credit: 0 },
      { id: 'jedrd26', coaId: '1100', debit: 0, credit: 86000 },
    ]
  },
  {
    id: 'je-ready-14',
    journalNo: 'JR-E-RD-014',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Pembelian Papan Mall 5/3 Tambahan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd27', coaId: '6401', debit: 170000, credit: 0 },
      { id: 'jedrd28', coaId: '1100', debit: 0, credit: 170000 },
    ]
  },
  {
    id: 'je-ready-15',
    journalNo: 'JR-E-RD-015',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Pembelian Sapu & Sikat Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd29', coaId: '6401', debit: 50000, credit: 0 },
      { id: 'jedrd30', coaId: '1100', debit: 0, credit: 50000 },
    ]
  },
  {
    id: 'je-ready-16',
    journalNo: 'JR-E-RD-016',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Selang dan Sikat Baja Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd31', coaId: '6401', debit: 110000, credit: 0 },
      { id: 'jedrd32', coaId: '1100', debit: 0, credit: 110000 },
    ]
  },
  {
    id: 'je-ready-17',
    journalNo: 'JR-E-RD-017',
    date: '2026-01-06',
    description: 'Beban Konsumsi: Nasi Bungkus Lapangan (5 Bks)',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd33', coaId: '6405', debit: 110000, credit: 0 },
      { id: 'jedrd34', coaId: '1100', debit: 0, credit: 110000 },
    ]
  },
  {
    id: 'je-ready-18',
    journalNo: 'JR-E-RD-018',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Pembelian Material Listrik',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd35', coaId: '6401', debit: 403000, credit: 0 },
      { id: 'jedrd36', coaId: '1100', debit: 0, credit: 403000 },
    ]
  },
  {
    id: 'je-ready-19',
    journalNo: 'JR-E-RD-019',
    date: '2026-01-06',
    description: 'Beban Perlengkapan: Pembelian Meteran 50 M (1 Buah)',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd37', coaId: '6401', debit: 85000, credit: 0 },
      { id: 'jedrd38', coaId: '1100', debit: 0, credit: 85000 },
    ]
  },
  {
    id: 'je-ready-20',
    journalNo: 'JR-E-RD-020',
    date: '2026-01-06',
    description: 'Beban Konsumsi: Pembelian Nasi Pekerja Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd39', coaId: '6405', debit: 155000, credit: 0 },
      { id: 'jedrd40', coaId: '1100', debit: 0, credit: 155000 },
    ]
  },
  {
    id: 'je-ready-21',
    journalNo: 'JR-E-RD-021',
    date: '2026-01-06',
    description: 'Beban Pemeliharaan: Mesin Air dan Lampu Tembak Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jedrd41', coaId: '6402', debit: 3903000, credit: 0 },
      { id: 'jedrd42', coaId: '1100', debit: 0, credit: 3903000 },
    ]
  },
  {
    id: 'je-11',
    journalNo: 'JR-E-011',
    date: '2026-01-22',
    description: 'Beban Gaji & Upah: Upah Pekerja Cor Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed21', coaId: '6100', debit: 15869700, credit: 0 },
      { id: 'jed22', coaId: '1100', debit: 0, credit: 15869700 },
    ]
  },
  {
    id: 'je-12',
    journalNo: 'JR-E-012',
    date: '2026-01-23',
    description: 'Beban Transport: Angkutan Material Batu 58 Ret',
    sourceType: 'Manual',
    details: [
      { id: 'jed23', coaId: '6403', debit: 46400000, credit: 0 },
      { id: 'jed24', coaId: '1100', debit: 0, credit: 46400000 },
    ]
  },
  {
    id: 'je-13',
    journalNo: 'JR-E-013',
    date: '2026-01-24',
    description: 'Beban Sewa: Bayar HM Exsa & Transport',
    sourceType: 'Manual',
    details: [
      { id: 'jed25', coaId: '6999', debit: 32000000, credit: 0 },
      { id: 'jed26', coaId: '1100', debit: 0, credit: 32000000 },
    ]
  },
  {
    id: 'je-14',
    journalNo: 'JR-E-014',
    date: '2026-01-24',
    description: 'Beban Konsumsi: Bayar Catering Lapangan',
    sourceType: 'Manual',
    details: [
      { id: 'jed27', coaId: '6405', debit: 2629000, credit: 0 },
      { id: 'jed28', coaId: '1100', debit: 0, credit: 2629000 },
    ]
  },
  {
    id: 'je-15',
    journalNo: 'JR-E-015',
    date: '2026-01-30',
    description: 'Beban Transport: Angkutan Batu Ritase Asip & Asen',
    sourceType: 'Manual',
    details: [
      { id: 'jed29', coaId: '6403', debit: 58400000, credit: 0 },
      { id: 'jed30', coaId: '1100', debit: 0, credit: 58400000 },
    ]
  },
  {
    id: 'je-16',
    journalNo: 'JR-E-016',
    date: '2026-02-02',
    description: 'Beban Sewa Alat: Bayar HM Exsa 50 HM',
    sourceType: 'Manual',
    details: [
      { id: 'jed31', coaId: '6999', debit: 32000000, credit: 0 },
      { id: 'jed32', coaId: '1100', debit: 0, credit: 32000000 },
    ]
  },

  // Bank Interest and Admin Charges (Adjustments)
  {
    id: 'jb-1',
    journalNo: 'JR-ADJ-001',
    date: '2026-01-31',
    description: 'Pendapatan Bunga Bank Kalbar',
    sourceType: 'Manual',
    details: [
      { id: 'jbd1', coaId: '1200', debit: 1140500, credit: 0 },
      { id: 'jbd2', coaId: '7101', debit: 0, credit: 1140500 },
    ]
  },
  {
    id: 'jb-2',
    journalNo: 'JR-ADJ-002',
    date: '2026-01-31',
    description: 'Beban Administrasi Bank Kalbar',
    sourceType: 'Manual',
    details: [
      { id: 'jbd3', coaId: '7201', debit: 25000, credit: 0 },
      { id: 'jbd4', coaId: '1200', debit: 0, credit: 25000 },
    ]
  },
  {
    id: 'jb-3',
    journalNo: 'JR-ADJ-003',
    date: '2026-02-28',
    description: 'Pendapatan Bunga Bank Kalbar',
    sourceType: 'Manual',
    details: [
      { id: 'jbd5', coaId: '1200', debit: 1450200, credit: 0 },
      { id: 'jbd6', coaId: '7101', debit: 0, credit: 1450200 },
    ]
  },
  {
    id: 'jb-4',
    journalNo: 'JR-ADJ-004',
    date: '2026-02-28',
    description: 'Beban Administrasi Bank Kalbar',
    sourceType: 'Manual',
    details: [
      { id: 'jbd7', coaId: '7201', debit: 25000, credit: 0 },
      { id: 'jbd8', coaId: '1200', debit: 0, credit: 25000 },
    ]
  },
  {
    id: 'jb-5',
    journalNo: 'JR-ADJ-005',
    date: '2026-03-31',
    description: 'Pendapatan Bunga Bank Kalbar',
    sourceType: 'Manual',
    details: [
      { id: 'jbd9', coaId: '1200', debit: 1865113, credit: 0 },
      { id: 'jbd10', coaId: '7101', debit: 0, credit: 1865113 },
    ]
  },
  {
    id: 'jb-6',
    journalNo: 'JR-ADJ-006',
    date: '2026-03-31',
    description: 'Beban Administrasi Bank Kalbar',
    sourceType: 'Manual',
    details: [
      { id: 'jbd11', coaId: '7201', debit: 25000, credit: 0 },
      { id: 'jbd12', coaId: '1200', debit: 0, credit: 25000 },
    ]
  },
  ...getSeedJournals()
];

const INITIAL_SALES: SalesInvoice[] = [];

const INITIAL_PURCHASES: PurchaseInvoice[] = [];

export interface ERPDatabase {
  coa: COAAccount[];
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  journals: Journal[];
  salesInvoices: SalesInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  cashTransactions: CashTransaction[];
  activeBranch: string;
  activeWarehouse: string;
  activeCurrency: 'IDR' | 'USD' | 'SGD';
  userSession: UserSession;
}

const STORAGE_KEY = 'web_accounting_erp_db_v3_cvtb';

// Load Database
export function loadDatabase(): ERPDatabase {
  if (typeof window === 'undefined') {
    return {
      coa: INITIAL_COA,
      customers: INITIAL_CUSTOMERS,
      suppliers: INITIAL_SUPPLIERS,
      products: INITIAL_PRODUCTS,
      journals: INITIAL_JOURNALS,
      salesInvoices: INITIAL_SALES,
      purchaseInvoices: INITIAL_PURCHASES,
      cashTransactions: [],
      activeBranch: 'Kantor Cabang Tayan',
      activeWarehouse: 'Stockpile Utama Tayan',
      activeCurrency: 'IDR',
      userSession: { name: 'Oktavianus Eko Haryanto', role: 'Fullstack Developer', email: 'oktavianus@torasbenaunt.com', avatar: 'OE' }
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ERPDatabase;

      // Force migration to Fullstack Developer role
      if (parsed.userSession.role !== 'Fullstack Developer') {
        parsed.userSession = { name: 'Oktavianus Eko Haryanto', role: 'Fullstack Developer', email: 'oktavianus@torasbenaunt.com', avatar: 'OE' };
        saveDatabase(parsed);
      }

      // Merge missing COA accounts so that the user gets all standard accounting accounts automatically without losing their transaction history!
      const existingIds = new Set(parsed.coa.map(c => c.id));
      const missingAccounts = INITIAL_COA.filter(c => !existingIds.has(c.id));
      if (missingAccounts.length > 0) {
        parsed.coa = [...parsed.coa, ...missingAccounts];
        // Sort COA by code
        parsed.coa.sort((a, b) => a.code.localeCompare(b.code));
        saveDatabase(parsed);
      }

      return parsed;
    } catch (e) {
      console.error('Failed to parse database, resetting to initial', e);
    }
  }

  const db: ERPDatabase = {
    coa: INITIAL_COA,
    customers: INITIAL_CUSTOMERS,
    suppliers: INITIAL_SUPPLIERS,
    products: INITIAL_PRODUCTS,
    journals: INITIAL_JOURNALS,
    salesInvoices: INITIAL_SALES,
    purchaseInvoices: INITIAL_PURCHASES,
    cashTransactions: [],
    activeBranch: 'Kantor Cabang Tayan',
    activeWarehouse: 'Stockpile Utama Tayan',
    activeCurrency: 'IDR',
    userSession: { name: 'Oktavianus Eko Haryanto', role: 'Fullstack Developer', email: 'oktavianus@torasbenaunt.com', avatar: 'OE' }
  };
  saveDatabase(db);
  return db;
}

// Save Database
export function saveDatabase(db: ERPDatabase) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Re-calculate COA balances from Journal Entries
export function recalculateBalances(db: ERPDatabase): ERPDatabase {
  // Clear balances first
  const newCoa = db.coa.map(account => ({ ...account, balance: 0 }));

  // Post each journal detail
  db.journals.forEach(journal => {
    journal.details.forEach(detail => {
      const account = newCoa.find(a => a.id === detail.coaId);
      if (account) {
        if (account.normalBalance === 'Debit') {
          account.balance += (detail.debit - detail.credit);
        } else {
          account.balance += (detail.credit - detail.debit);
        }
      }
    });
  });

  // Calculate customer balances based on sales invoices and payments
  const newCustomers = db.customers.map(cust => {
    let balance = 0;
    // Unpaid/Partially paid invoice total adds to customer balance
    db.salesInvoices.forEach(inv => {
      if (inv.customerId === cust.id) {
        balance += (inv.total - inv.amountPaid);
      }
    });
    return { ...cust, balance };
  });

  // Calculate supplier balances based on purchase invoices and payments
  const newSuppliers = db.suppliers.map(sup => {
    let balance = 0;
    db.purchaseInvoices.forEach(inv => {
      if (inv.supplierId === sup.id) {
        balance += (inv.total - inv.amountPaid);
      }
    });
    return { ...sup, balance };
  });

  return {
    ...db,
    coa: newCoa,
    customers: newCustomers,
    suppliers: newSuppliers,
  };
}

// Add custom Manual Journal entry
export function addManualJournal(
  db: ERPDatabase,
  date: string,
  description: string,
  details: { coaId: string; debit: number; credit: number }[]
): { success: boolean; error?: string; db?: ERPDatabase } {
  // Verify Debit & Credit totals match
  const totalDebit = details.reduce((sum, d) => sum + d.debit, 0);
  const totalCredit = details.reduce((sum, d) => sum + d.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return { success: false, error: `Jumlah Debit (Rp ${totalDebit.toLocaleString()}) harus sama dengan Credit (Rp ${totalCredit.toLocaleString()})` };
  }

  const journalNo = `JR-${String(db.journals.length + 1).padStart(5, '0')}`;
  const newJournal: Journal = {
    id: generateId(),
    journalNo,
    date,
    description,
    sourceType: 'Manual',
    details: details.map(d => ({
      id: generateId(),
      coaId: d.coaId,
      debit: d.debit,
      credit: d.credit
    }))
  };

  const updatedDb = {
    ...db,
    journals: [...db.journals, newJournal]
  };

  const finalDb = recalculateBalances(updatedDb);
  saveDatabase(finalDb);

  return { success: true, db: finalDb };
}

// Create a Sales Invoice and post double-entry bookkeeping journals
export function addSalesInvoice(
  db: ERPDatabase,
  customerId: string,
  date: string,
  items: { productId: string; qty: number; price: number }[],
  paymentMethod: 'CASH' | 'CREDIT',
  taxRate: number = 0.12
): { success: boolean; error?: string; db?: ERPDatabase } {
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return { success: false, error: 'Customer tidak ditemukan.' };

  // Calculate Subtotals
  let subtotal = 0;
  const invoiceItems: InvoiceItem[] = [];
  let totalCogs = 0;

  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) return { success: false, error: `Produk dengan ID ${item.productId} tidak ditemukan.` };
    if (product.stock < item.qty) {
      return { success: false, error: `Stok produk "${product.name}" tidak mencukupi. Tersedia: ${product.stock} pcs, Diminta: ${item.qty} pcs.` };
    }

    const itemSubtotal = item.qty * item.price;
    subtotal += itemSubtotal;
    invoiceItems.push({
      productId: item.productId,
      qty: item.qty,
      price: item.price,
      subtotal: itemSubtotal
    });

    totalCogs += item.qty * product.costPrice;
  }

  const tax = Math.round(subtotal * taxRate); // Use provided taxRate (e.g. 0.12 or 0)
  const total = subtotal + tax;

  const invoiceNo = `INV-S-${date.replace(/-/g, '')}-${String(db.salesInvoices.length + 1).padStart(3, '0')}`;
  const invoiceId = generateId();

  const isPaid = paymentMethod === 'CASH';
  const amountPaid = isPaid ? total : 0;

  const newInvoice: SalesInvoice = {
    id: invoiceId,
    invoiceNo,
    date,
    customerId,
    items: invoiceItems,
    subtotal,
    tax,
    total,
    paymentMethod,
    status: isPaid ? 'Paid' : 'Unpaid',
    amountPaid,
    branch: db.activeBranch
  };

  // Reduce product stocks
  const updatedProducts = db.products.map(p => {
    const soldItem = items.find(item => item.productId === p.id);
    if (soldItem) {
      return { ...p, stock: p.stock - soldItem.qty };
    }
    return p;
  });

  // Generate Accounting Journal Entry
  // --- Penjualan Kredit ---
  // Debit Piutang Usaha (1300) = total
  //   Credit Pendapatan Penjualan (4100) = subtotal
  //   Credit Hutang Pajak PPN (2200) = tax
  // Debit HPP (5100) = totalCogs
  //   Credit Persediaan Barang Dagang (1400) = totalCogs
  //
  // --- Penjualan Tunai ---
  // Debit Kas & Setara Kas (1100) = total
  //   Credit Pendapatan Penjualan (4100) = subtotal
  //   Credit Hutang Pajak PPN (2200) = tax
  // Debit HPP (5100) = totalCogs
  //   Credit Persediaan Barang Dagang (1400) = totalCogs

  const journalDetails: JournalDetail[] = [];

  // Account mappings
  const debitAccount = isPaid ? '1100' : '1300'; // Kas or Piutang
  const revenueAccount = '4100'; // Pendapatan Penjualan
  const taxAccount = '2200'; // Hutang Pajak PPN
  const cogsAccount = '5100'; // HPP
  const inventoryAccount = '1400'; // Persediaan

  // Sales and Tax Details
  journalDetails.push({ id: generateId(), coaId: debitAccount, debit: total, credit: 0 });
  journalDetails.push({ id: generateId(), coaId: revenueAccount, debit: 0, credit: subtotal });
  if (tax > 0) {
    journalDetails.push({ id: generateId(), coaId: taxAccount, debit: 0, credit: tax });
  }

  // COGS Details
  if (totalCogs > 0) {
    journalDetails.push({ id: generateId(), coaId: cogsAccount, debit: totalCogs, credit: 0 });
    journalDetails.push({ id: generateId(), coaId: inventoryAccount, debit: 0, credit: totalCogs });
  }

  const newJournal: Journal = {
    id: generateId(),
    journalNo: `JR-S-${invoiceNo.substring(6)}`,
    date,
    description: `Penjualan ${isPaid ? 'Tunai' : 'Kredit'} - ${invoiceNo} (${customer.name})`,
    sourceType: 'Sales',
    sourceId: invoiceId,
    details: journalDetails
  };

  const updatedDb: ERPDatabase = {
    ...db,
    products: updatedProducts,
    salesInvoices: [...db.salesInvoices, newInvoice],
    journals: [...db.journals, newJournal]
  };

  const finalDb = recalculateBalances(updatedDb);
  saveDatabase(finalDb);

  return { success: true, db: finalDb };
}

// Create a Purchase Invoice and post double-entry bookkeeping journals
export function addPurchaseInvoice(
  db: ERPDatabase,
  supplierId: string,
  date: string,
  items: { productId: string; qty: number; price: number }[],
  paymentMethod: 'CASH' | 'CREDIT',
  taxRate: number = 0.12
): { success: boolean; error?: string; db?: ERPDatabase } {
  const supplier = db.suppliers.find(s => s.id === supplierId);
  if (!supplier) return { success: false, error: 'Supplier tidak ditemukan.' };

  // Calculate Subtotals
  let subtotal = 0;
  const invoiceItems: InvoiceItem[] = [];

  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) return { success: false, error: `Produk dengan ID ${item.productId} tidak ditemukan.` };

    const itemSubtotal = item.qty * item.price;
    subtotal += itemSubtotal;
    invoiceItems.push({
      productId: item.productId,
      qty: item.qty,
      price: item.price,
      subtotal: itemSubtotal
    });
  }

  const tax = Math.round(subtotal * taxRate); // Use provided taxRate (e.g. 0.12 or 0)
  const total = subtotal + tax;

  const invoiceNo = `INV-P-${date.replace(/-/g, '')}-${String(db.purchaseInvoices.length + 1).padStart(3, '0')}`;
  const invoiceId = generateId();

  const isPaid = paymentMethod === 'CASH';
  const amountPaid = isPaid ? total : 0;

  const newInvoice: PurchaseInvoice = {
    id: invoiceId,
    invoiceNo,
    date,
    supplierId,
    items: invoiceItems,
    subtotal,
    tax,
    total,
    paymentMethod,
    status: isPaid ? 'Paid' : 'Unpaid',
    amountPaid,
    branch: db.activeBranch
  };

  // Increase product stock & update average cost price (Cost Price)
  const updatedProducts = db.products.map(p => {
    const purchasedItem = items.find(item => item.productId === p.id);
    if (purchasedItem) {
      const currentStockVal = p.stock * p.costPrice;
      const newPurchaseVal = purchasedItem.qty * purchasedItem.price;
      const newTotalStock = p.stock + purchasedItem.qty;
      const newAvgCost = newTotalStock > 0 ? Math.round((currentStockVal + newPurchaseVal) / newTotalStock) : purchasedItem.price;

      return {
        ...p,
        stock: newTotalStock,
        costPrice: newAvgCost
      };
    }
    return p;
  });

  // Generate Accounting Journal Entry
  // Debit Persediaan Barang Dagang (1400) = subtotal
  // Debit Hutang Pajak PPN (Masukkan) - kita sederhanakan ke COA PPN Hutang 2200 (sebagai pengurang hutang pajak/debit) = tax
  //   Credit Kas & Setara Kas (1100) or Hutang Usaha (2100) = total

  const journalDetails: JournalDetail[] = [];
  const creditAccount = isPaid ? '1100' : '2100'; // Kas or Hutang Usaha
  const inventoryAccount = '1400';
  const taxAccount = '2200'; // We debit this as input VAT

  journalDetails.push({ id: generateId(), coaId: inventoryAccount, debit: subtotal, credit: 0 });
  if (tax > 0) {
    // Debit Hutang Pajak (increases as debit, effectively reducing net tax payable)
    journalDetails.push({ id: generateId(), coaId: taxAccount, debit: tax, credit: 0 });
  }
  journalDetails.push({ id: generateId(), coaId: creditAccount, debit: 0, credit: total });

  const newJournal: Journal = {
    id: generateId(),
    journalNo: `JR-P-${invoiceNo.substring(6)}`,
    date,
    description: `Pembelian ${isPaid ? 'Tunai' : 'Kredit'} - ${invoiceNo} (${supplier.name})`,
    sourceType: 'Purchase',
    sourceId: invoiceId,
    details: journalDetails
  };

  const updatedDb: ERPDatabase = {
    ...db,
    products: updatedProducts,
    purchaseInvoices: [...db.purchaseInvoices, newInvoice],
    journals: [...db.journals, newJournal]
  };

  const finalDb = recalculateBalances(updatedDb);
  saveDatabase(finalDb);

  return { success: true, db: finalDb };
}

// Record Customer Payment (Pelunasan Piutang)
export function payCustomerInvoice(
  db: ERPDatabase,
  invoiceId: string,
  amount: number,
  coaBankId: string, // Account receiving money (e.g. Bank Mandiri 1200 / Kas 1100)
  date: string
): { success: boolean; error?: string; db?: ERPDatabase } {
  const invoice = db.salesInvoices.find(inv => inv.id === invoiceId);
  if (!invoice) return { success: false, error: 'Invoice Penjualan tidak ditemukan.' };

  const outstanding = invoice.total - invoice.amountPaid;
  if (amount <= 0 || amount > outstanding) {
    return { success: false, error: `Jumlah pelunasan tidak valid. Sisa tagihan: Rp ${outstanding.toLocaleString()}` };
  }

  const customer = db.customers.find(c => c.id === invoice.customerId);
  const updatedInvoices = db.salesInvoices.map(inv => {
    if (inv.id === invoiceId) {
      const newPaid = inv.amountPaid + amount;
      return {
        ...inv,
        amountPaid: newPaid,
        status: newPaid >= inv.total ? 'Paid' : 'Unpaid' as any
      };
    }
    return inv;
  });

  // Accounting Journal Entry:
  // Debit Kas/Bank (coaBankId) = amount
  //   Credit Piutang Usaha (1300) = amount
  const journalDetails: JournalDetail[] = [
    { id: generateId(), coaId: coaBankId, debit: amount, credit: 0 },
    { id: generateId(), coaId: '1300', debit: 0, credit: amount }
  ];

  const paymentNo = `PAY-RCV-${date.replace(/-/g, '')}-${String(db.journals.length + 1).padStart(3, '0')}`;

  const newJournal: Journal = {
    id: generateId(),
    journalNo: `JR-PAY-${paymentNo.substring(8)}`,
    date,
    description: `Pelunasan Piutang ${invoice.invoiceNo} (${customer?.name || 'Customer'})`,
    sourceType: 'Payment',
    sourceId: invoiceId,
    details: journalDetails
  };

  const updatedDb: ERPDatabase = {
    ...db,
    salesInvoices: updatedInvoices,
    journals: [...db.journals, newJournal]
  };

  const finalDb = recalculateBalances(updatedDb);
  saveDatabase(finalDb);

  return { success: true, db: finalDb };
}

// Record Supplier Payment (Pelunasan Hutang)
export function paySupplierInvoice(
  db: ERPDatabase,
  invoiceId: string,
  amount: number,
  coaBankId: string, // Account releasing money (e.g. Bank Mandiri 1200 / Kas 1100)
  date: string
): { success: boolean; error?: string; db?: ERPDatabase } {
  const invoice = db.purchaseInvoices.find(inv => inv.id === invoiceId);
  if (!invoice) return { success: false, error: 'Invoice Pembelian tidak ditemukan.' };

  const outstanding = invoice.total - invoice.amountPaid;
  if (amount <= 0 || amount > outstanding) {
    return { success: false, error: `Jumlah pembayaran tidak valid. Sisa hutang: Rp ${outstanding.toLocaleString()}` };
  }

  const supplier = db.suppliers.find(s => s.id === invoice.supplierId);
  const updatedInvoices = db.purchaseInvoices.map(inv => {
    if (inv.id === invoiceId) {
      const newPaid = inv.amountPaid + amount;
      return {
        ...inv,
        amountPaid: newPaid,
        status: newPaid >= inv.total ? 'Paid' : 'Unpaid' as any
      };
    }
    return inv;
  });

  // Accounting Journal Entry:
  // Debit Hutang Usaha (2100) = amount
  //   Credit Kas/Bank (coaBankId) = amount
  const journalDetails: JournalDetail[] = [
    { id: generateId(), coaId: '2100', debit: amount, credit: 0 },
    { id: generateId(), coaId: coaBankId, debit: 0, credit: amount }
  ];

  const paymentNo = `PAY-OUT-${date.replace(/-/g, '')}-${String(db.journals.length + 1).padStart(3, '0')}`;

  const newJournal: Journal = {
    id: generateId(),
    journalNo: `JR-PAY-${paymentNo.substring(8)}`,
    date,
    description: `Pembayaran Hutang ${invoice.invoiceNo} (${supplier?.name || 'Supplier'})`,
    sourceType: 'Payment',
    sourceId: invoiceId,
    details: journalDetails
  };

  const updatedDb: ERPDatabase = {
    ...db,
    purchaseInvoices: updatedInvoices,
    journals: [...db.journals, newJournal]
  };

  const finalDb = recalculateBalances(updatedDb);
  saveDatabase(finalDb);

  return { success: true, db: finalDb };
}

// Add general Cash In/Out or bank transfer transaction
export function addCashTransaction(
  db: ERPDatabase,
  type: 'In' | 'Out' | 'Transfer',
  fromCoaId: string,
  toCoaId: string,
  amount: number,
  description: string,
  date: string
): { success: boolean; error?: string; db?: ERPDatabase } {
  if (amount <= 0) return { success: false, error: 'Jumlah uang harus lebih besar dari 0' };

  const transactionNo = `TRX-${type.toUpperCase()}-${date.replace(/-/g, '')}-${String(db.cashTransactions.length + 1).padStart(3, '0')}`;
  const newTx: CashTransaction = {
    id: generateId(),
    transactionNo,
    date,
    type,
    fromCoaId,
    toCoaId,
    amount,
    description,
    branch: db.activeBranch
  };

  // Create corresponding double-entry journal details
  // For standard cash transaction, the entry structure is:
  // Debit: toCoaId (where money goes)
  // Credit: fromCoaId (where money comes from)
  const journalDetails: JournalDetail[] = [
    { id: generateId(), coaId: toCoaId, debit: amount, credit: 0 },
    { id: generateId(), coaId: fromCoaId, debit: 0, credit: amount }
  ];

  const newJournal: Journal = {
    id: generateId(),
    journalNo: `JR-TX-${transactionNo.substring(7)}`,
    date,
    description: `${type === 'Transfer' ? 'Transfer Bank' : type === 'In' ? 'Kas Masuk' : 'Kas Keluar'}: ${description}`,
    sourceType: type === 'In' ? 'CashIn' : type === 'Out' ? 'CashOut' : 'Manual',
    details: journalDetails
  };

  const updatedDb: ERPDatabase = {
    ...db,
    cashTransactions: [...db.cashTransactions, newTx],
    journals: [...db.journals, newJournal]
  };

  const finalDb = recalculateBalances(updatedDb);
  saveDatabase(finalDb);

  return { success: true, db: finalDb };
}

// Financial Report Generators
export interface FinancialItem {
  code: string;
  name: string;
  amount: number;
}

export interface IncomeStatement {
  revenue: FinancialItem[];
  totalRevenue: number;
  cogs: FinancialItem[];
  totalCogs: number;
  grossProfit: number;
  expenses: FinancialItem[];
  totalExpenses: number;
  netProfit: number;
}

export function generateIncomeStatement(db: ERPDatabase, startDate?: string, endDate?: string): IncomeStatement {
  const revenue: FinancialItem[] = [];
  const cogs: FinancialItem[] = [];
  const expenses: FinancialItem[] = [];

  // Calculate dynamic balances if date filters are specified
  const hasFilter = !!startDate || !!endDate;
  const balances: Record<string, number> = {};

  if (hasFilter) {
    db.coa.forEach(acc => {
      balances[acc.id] = 0;
    });

    db.journals.forEach(journal => {
      const matchesDate = (!startDate || journal.date >= startDate) && (!endDate || journal.date <= endDate);
      if (matchesDate) {
        journal.details.forEach(detail => {
          if (balances[detail.coaId] !== undefined) {
            const acc = db.coa.find(a => a.id === detail.coaId);
            if (acc) {
              if (acc.normalBalance === 'Debit') {
                balances[detail.coaId] += (detail.debit - detail.credit);
              } else {
                balances[detail.coaId] += (detail.credit - detail.debit);
              }
            }
          }
        });
      }
    });
  }

  db.coa.forEach(acc => {
    const val = hasFilter ? (balances[acc.id] || 0) : acc.balance;
    if (acc.category === 'Revenue') {
      revenue.push({ code: acc.code, name: acc.name, amount: val });
    } else if (acc.code.startsWith('5')) {
      cogs.push({ code: acc.code, name: acc.name, amount: val });
    } else if (acc.category === 'Expense') {
      expenses.push({ code: acc.code, name: acc.name, amount: val });
    }
  });

  const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalCogs = cogs.reduce((sum, item) => sum + item.amount, 0);
  const grossProfit = totalRevenue - totalCogs;
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  return {
    revenue,
    totalRevenue,
    cogs,
    totalCogs,
    grossProfit,
    expenses,
    totalExpenses,
    netProfit
  };
}

export interface BalanceSheet {
  assets: FinancialItem[];
  totalAssets: number;
  liabilities: FinancialItem[];
  totalLiabilities: number;
  equity: FinancialItem[];
  retainedEarnings: number; // calculated field (retained + current net profit)
  totalEquity: number;
  isBalanced: boolean;
}

export function generateBalanceSheet(db: ERPDatabase, endDate?: string): BalanceSheet {
  const assets: FinancialItem[] = [];
  const liabilities: FinancialItem[] = [];
  const equity: FinancialItem[] = [];

  // Calculate dynamic balances up to endDate if specified
  const hasFilter = !!endDate;
  const balances: Record<string, number> = {};

  if (hasFilter) {
    db.coa.forEach(acc => {
      balances[acc.id] = 0;
    });

    db.journals.forEach(journal => {
      const matchesDate = !endDate || journal.date <= endDate;
      if (matchesDate) {
        journal.details.forEach(detail => {
          if (balances[detail.coaId] !== undefined) {
            const acc = db.coa.find(a => a.id === detail.coaId);
            if (acc) {
              if (acc.normalBalance === 'Debit') {
                balances[detail.coaId] += (detail.debit - detail.credit);
              } else {
                balances[detail.coaId] += (detail.credit - detail.debit);
              }
            }
          }
        });
      }
    });
  }

  const incomeStatement = generateIncomeStatement(db, undefined, endDate);
  const currentNetProfit = incomeStatement.netProfit;

  db.coa.forEach(acc => {
    const val = hasFilter ? (balances[acc.id] || 0) : acc.balance;
    if (acc.category === 'Asset') {
      let amount = val;
      if (acc.normalBalance === 'Credit') {
        // Contra-asset like accumulation reduces total asset
        amount = -val;
      }
      assets.push({ code: acc.code, name: acc.name, amount });
    } else if (acc.category === 'Liability') {
      liabilities.push({ code: acc.code, name: acc.name, amount: val });
    } else if (acc.category === 'Equity') {
      equity.push({ code: acc.code, name: acc.name, amount: val });
    }
  });

  // Let's add dynamic "Laba Tahun Berjalan" to the equity section
  equity.push({ code: '3299', name: 'Laba Bersih Tahun Berjalan', amount: currentNetProfit });

  const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

  const diff = Math.abs(totalAssets - (totalLiabilities + totalEquity));
  const isBalanced = diff < 0.1;

  return {
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity,
    retainedEarnings: currentNetProfit,
    totalEquity,
    isBalanced
  };
}

// Check role permissions based on matrix
export function hasPermission(role: UserRole, feature: string): boolean {
  const matrix: Record<string, Record<UserRole, boolean>> = {
    Dashboard: { 'Fullstack Developer': true },
    Transaksi: { 'Fullstack Developer': true },
    Sales: { 'Fullstack Developer': true },
    Purchase: { 'Fullstack Developer': true },
    Accounting: { 'Fullstack Developer': true },
    CashBank: { 'Fullstack Developer': true },
    Reports: { 'Fullstack Developer': true },
    TaxSimulator: { 'Fullstack Developer': true },
    TaxPaymentTracking: { 'Fullstack Developer': true },
    MasterData: { 'Fullstack Developer': true },
    About: { 'Fullstack Developer': true },
  };

  return matrix[feature]?.[role] ?? false;
}

// Function to delete all transactions and reset balances
export function deleteAllTransactions(db: ERPDatabase): ERPDatabase {
  let newDb = { ...db };
  
  newDb.salesInvoices = [];
  newDb.purchaseInvoices = [];
  newDb.cashTransactions = [];
  newDb.journals = [];
  
  newDb.customers = [];
  newDb.suppliers = [];
  newDb.products = [];
  
  newDb = recalculateBalances(newDb);
  saveDatabase(newDb);
  return newDb;
}

// Function to delete transactions safely
export function deleteTransaction(db: ERPDatabase, type: 'Sales' | 'Purchase' | 'Cash' | 'Journal', id: string): ERPDatabase {
  let newDb = { ...db }; 
  
  if (type === 'Sales') {
    const invoice = db.salesInvoices.find(s => s.id === id);
    if (!invoice) return db;
    
    // Kembalikan stok (restore stock)
    const newProducts = [...db.products];
    invoice.items.forEach(item => {
      const pIndex = newProducts.findIndex(p => p.id === item.productId);
      if (pIndex >= 0) {
        newProducts[pIndex] = { ...newProducts[pIndex], stock: newProducts[pIndex].stock + item.qty };
      }
    });
    newDb.products = newProducts;
    
    // Hapus jurnal terkait (sourceId = invoice.id)
    newDb.journals = db.journals.filter(j => j.sourceId !== invoice.id);
    newDb.salesInvoices = db.salesInvoices.filter(s => s.id !== id);
  } 
  else if (type === 'Purchase') {
    const invoice = db.purchaseInvoices.find(p => p.id === id);
    if (!invoice) return db;
    
    // Tarik kembali stok (reduce stock)
    const newProducts = [...db.products];
    invoice.items.forEach(item => {
      const pIndex = newProducts.findIndex(p => p.id === item.productId);
      if (pIndex >= 0) {
        newProducts[pIndex] = { ...newProducts[pIndex], stock: newProducts[pIndex].stock - item.qty };
      }
    });
    newDb.products = newProducts;
    
    newDb.journals = db.journals.filter(j => j.sourceId !== invoice.id);
    newDb.purchaseInvoices = db.purchaseInvoices.filter(p => p.id !== id);
  }
  else if (type === 'Cash') {
    newDb.cashTransactions = db.cashTransactions.filter(c => c.id !== id);
    newDb.journals = db.journals.filter(j => j.sourceId !== id);
  }
  else if (type === 'Journal') {
    newDb.journals = db.journals.filter(j => j.id !== id);
  }
  
  // Recalculate balances from scratch
  return recalculateBalances(newDb);
}
