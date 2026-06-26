import type { Journal, JournalDetail } from './accountingEngine';

let journalCounter = 1;

function generateId(prefix: string): string {
  return `${prefix}-${journalCounter}`;
}

function createJournal(
  date: string,
  description: string,
  debitCoa: string,
  creditCoa: string,
  amount: number
): Journal {
  const jId = generateId('seed-j');
  const d1Id = generateId('seed-jd');
  const d2Id = generateId('seed-jd');
  journalCounter++;
  
  return {
    id: jId,
    journalNo: `JR-SEED-${journalCounter.toString().padStart(4, '0')}`,
    date,
    description,
    sourceType: 'Manual',
    details: [
      { id: d1Id, coaId: debitCoa, debit: amount, credit: 0 },
      { id: d2Id, coaId: creditCoa, debit: 0, credit: amount }
    ]
  };
}

export function getSeedJournals(): Journal[] {
  const journals: Journal[] = [];

  // ==========================================
  // 1. REKENING KORAN BANK KALBAR (3125200558)
  // ==========================================
  const bankMutations = [
    { date: '2025-09-18', desc: 'SETORAN TUNAI', type: 'K', amount: 250000000 },
    { date: '2025-10-01', desc: 'BIAYA ADMINISTRASI SIMPEDA', type: 'D', amount: 5000 },
    { date: '2025-10-03', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 348567500 },
    { date: '2025-10-06', desc: 'PENARIKAN KLAUDIUS N SUHSRNO', type: 'D', amount: 136000000 },
    { date: '2025-10-06', desc: 'PENARIKAN SUHARNO N KLAUDIUS', type: 'D', amount: 90000000 },
    { date: '2025-10-21', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 45177000 },
    { date: '2025-10-21', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 19246000 },
    { date: '2025-10-28', desc: 'PENARIKAN KLAUDIUS N SUHARNO', type: 'D', amount: 58600000 },
    { date: '2025-10-31', desc: 'PEMBAYARAN BUNGA JAGIR/TAB.', type: 'K', amount: 31515.53 },
    { date: '2025-10-31', desc: 'PAJAK BUNGA', type: 'D', amount: 6303.11 },
    { date: '2025-11-03', desc: 'BIAYA ADMINISTRASI SIMPEDA', type: 'D', amount: 5000 },
    { date: '2025-11-04', desc: 'CV GIRLI', type: 'K', amount: 191475000 },
    { date: '2025-11-04', desc: 'TRK TUNAI KLAUDIUS S / SUHARNO', type: 'D', amount: 100000000 },
    { date: '2025-11-05', desc: 'TRK SUHARNO DAN K SUPENO', type: 'D', amount: 150000000 },
    { date: '2025-11-07', desc: 'STR AN CV GIRLI BYR KONTR NIKO', type: 'K', amount: 191475000 },
    { date: '2025-11-07', desc: 'KU- JATIM PROPERTINDO JAYA', type: 'K', amount: 58500008.10 },
    { date: '2025-11-07', desc: 'TRK TUNAI K SUPENO / SUHARNO', type: 'D', amount: 191500000 },
    { date: '2025-11-14', desc: 'TRK TUNAI SUHARNO DAN K SUPENO', type: 'D', amount: 53000000 },
    { date: '2025-11-19', desc: 'KU- JATIM PROPERTINDO JAYA', type: 'K', amount: 39000005.40 },
    { date: '2025-11-28', desc: 'TRK SUHARNO DAN KLADIUS S', type: 'D', amount: 73000000 },
    { date: '2025-11-30', desc: 'PEMBAYARAN BUNGA JAGIR/TAB.', type: 'K', amount: 18029.52 },
    { date: '2025-11-30', desc: 'PAJAK BUNGA', type: 'D', amount: 3605.90 },
    { date: '2025-12-01', desc: 'BIAYA ADMINISTRASI SIMPEDA', type: 'D', amount: 5000 },
    { date: '2025-12-22', desc: 'TRK TUNAI SUAHRNO . K SUPENO', type: 'D', amount: 11000000 },
    { date: '2025-12-31', desc: 'PEMBAYARAN BUNGA JAGIR/TAB.', type: 'K', amount: 4934.36 },
    { date: '2025-12-31', desc: 'PAJAK BUNGA', type: 'D', amount: 986.87 },
    { date: '2025-12-31', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 174283750 },
    { date: '2026-01-02', desc: 'BIAYA ADMINISTRASI SIMPEDA', type: 'D', amount: 5000 },
    { date: '2026-01-02', desc: 'TRK KALUDEIUS S/ SUHARNO', type: 'D', amount: 175000000 },
    { date: '2026-01-13', desc: 'TRK SUHARNO /K SUPENO', type: 'D', amount: 22000000 },
    { date: '2026-01-13', desc: 'KU- JATIM PROPERTINDO JAYA', type: 'K', amount: 154800000 },
    { date: '2026-01-14', desc: 'TRKTUNAI SUHARNO / KLAUDIUS', type: 'D', amount: 130000000 },
    { date: '2026-01-14', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 160363750 },
    { date: '2026-01-19', desc: 'TRK K SUPENO / SUHARNO', type: 'D', amount: 159000000 },
    { date: '2026-01-20', desc: 'KU- JATIM PROPERTINDO JAYA (1)', type: 'K', amount: 593999999 },
    { date: '2026-01-20', desc: 'KU- JATIM PROPERTINDO JAYA (2)', type: 'K', amount: 154800000 },
    { date: '2026-01-20', desc: 'TRK SUHARNO / K SUPENO', type: 'D', amount: 250000000 },
    { date: '2026-01-21', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 104058900 },
    { date: '2026-01-21', desc: 'TRK SUHARNO / K SUPENO', type: 'D', amount: 250000000 },
    { date: '2026-01-26', desc: 'TRK TUNAI SUHARNO K SUPENO', type: 'D', amount: 350000000 },
    { date: '2026-01-30', desc: 'TRK SUHARNO / K SUPEN', type: 'D', amount: 30000000 },
    { date: '2026-01-30', desc: 'KU- JATIM PROPERTINDO JAYA', type: 'K', amount: 692999999 },
    { date: '2026-01-30', desc: 'TRK SUHARNO / KLAUDIUS S', type: 'D', amount: 150000000 },
    { date: '2026-01-31', desc: 'PEMBAYARAN BUNGA JAGIR/TAB.', type: 'K', amount: 49044.67 },
    { date: '2026-01-31', desc: 'PAJAK BUNGA', type: 'D', amount: 9808.93 },
    { date: '2026-02-02', desc: 'BIAYA ADMINISTRASI SIMPEDA', type: 'D', amount: 5000 },
    { date: '2026-02-02', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 242804100 },
    { date: '2026-02-02', desc: 'TRK SUHARNO / K SUPENO', type: 'D', amount: 390000000 },
    { date: '2026-02-03', desc: 'SUHARNO / SUPENO (TRK)', type: 'D', amount: 270600000 },
    { date: '2026-02-13', desc: 'KU- JATIM PROPERTINDO JAYA', type: 'K', amount: 692999999 },
    { date: '2026-02-13', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 49950000 },
    { date: '2026-02-18', desc: 'TRK TUNAI KLAUDIUS /SUHARNO', type: 'D', amount: 870000000 },
    { date: '2026-02-25', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 96266700 },
    { date: '2026-02-26', desc: 'TRK SUHARNO', type: 'D', amount: 76000000 },
    { date: '2026-02-28', desc: 'PEMBAYARAN BUNGA JAGIR/TAB.', type: 'K', amount: 114302.75 },
    { date: '2026-02-28', desc: 'PAJAK BUNGA', type: 'D', amount: 22860.55 },
    { date: '2026-03-02', desc: 'BIAYA ADMINISTRASI SIMPEDA', type: 'D', amount: 5000 },
    { date: '2026-03-16', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 170071170 },
    { date: '2026-03-17', desc: 'TRK SUPENO / SUHARNO', type: 'D', amount: 195000000 },
    { date: '2026-03-31', desc: 'PEMBAYARAN BUNGA JAGIR/TAB.', type: 'K', amount: 2806.69 },
    { date: '2026-03-31', desc: 'PAJAK BUNGA', type: 'D', amount: 561.34 },
    { date: '2026-04-01', desc: 'BIAYA ADMINISTRASI SIMPEDA', type: 'D', amount: 5000 },
    { date: '2026-04-17', desc: 'KU- PT.GREGAH SUKSES MANDIRI E', type: 'K', amount: 47487800 },
    { date: '2026-04-20', desc: 'TRK SUAHRNO /KALUSIUS S', type: 'D', amount: 47400000 },
    { date: '2026-04-30', desc: 'PEMBAYARAN BUNGA JAGIR/TAB.', type: 'K', amount: 579.69 },
    { date: '2026-05-04', desc: 'BIAYA ADMINISTRASI SIMPEDA', type: 'D', amount: 5000 }
  ];

  bankMutations.forEach(m => {
    let debit = '';
    let credit = '';
    if (m.type === 'K') { 
      debit = '1200'; 
      if (m.desc.includes('BUNGA')) credit = '7101'; 
      else if (m.desc.includes('SETORAN')) credit = '1100'; 
      else credit = '4100'; 
    } else { 
      credit = '1200'; 
      if (m.desc.includes('BIAYA') || m.desc.includes('PAJAK')) debit = '7201'; 
      else debit = '1100'; 
    }
    journals.push(createJournal(m.date, `BANK KALBAR: ${m.desc}`, debit, credit, m.amount));
  });

  const exp = (date: string, desc: string, coa: string, amount: number) => {
    journals.push(createJournal(date, `PENGELUARAN: ${desc}`, coa, '1100', amount));
  };

  // ==========================================
  // 2. LAPORAN PENGELUARAN PENGECORAN JALAN
  // ==========================================
  exp('2026-01-15', 'Bayar Rokok', '6405', 88000);
  exp('2026-01-15', 'Makan dan Minum', '6405', 128000);
  exp('2026-01-15', 'Minum di Warkop Malado', '6405', 85000);
  exp('2026-01-16', 'PENGELUARAN TB', '6999', 15000000);
  exp('2026-01-16', 'Biaya Minum Plural coffe', '6405', 165000);
  exp('2026-01-16', 'Bayar Semen 22 Ton', '5100', 32700000);
  exp('2026-01-16', 'Bayar Solar Mobil', '6403', 500000);
  exp('2026-01-17', 'Kabel Fiting Lampu', '6402', 173000);
  exp('2026-01-17', 'Lampu Lalin', '6402', 290000);
  exp('2026-01-17', 'Makan BTG Nareh', '6405', 175000);
  exp('2026-01-17', 'Pertalite dan Rokok', '6405', 104000);
  exp('2026-01-17', 'Pembelian Rokok', '6405', 300000);
  exp('2026-01-17', 'Plastik Cor', '5100', 95000);
  exp('2026-01-17', 'Kopi, Nestle, Energen', '6405', 75000);
  exp('2026-01-17', 'Nesle mineral Botol', '6405', 325000);
  exp('2026-01-17', 'Botol, Pilok, Rapia', '6402', 120000);
  exp('2026-01-17', 'Lampu 30 watt & Nota Kontan', '6402', 60000);
  exp('2026-01-17', 'Bayar Batu 30 M3', '5100', 8400000);
  exp('2026-01-18', 'Bayar Pasir 248 M3', '5100', 16120000);
  exp('2026-01-18', 'Bayar Batu 100 M3', '5100', 28000000);
  exp('2026-01-18', 'Bayar Nasi Catring + Kopi', '6405', 2500000);
  exp('2026-01-18', 'Mineral 11 Botol', '6405', 55000);
  exp('2026-01-18', 'Bayar Warmes & Plastik Cor', '5100', 2540000);
  exp('2026-01-18', 'Bayar Tukang Harian 6 org', '6100', 3600000);
  exp('2026-01-18', 'Bayar Semen 20 Tonase', '5100', 49050000);
  exp('2026-01-18', 'Bayar Obat Beton 10 Drum', '5100', 42624000);
  exp('2026-01-18', 'Bayar Koko Toko', '5100', 2540000);
  exp('2026-01-19', 'Pegangan Mas Suhar', '1301', 500000);
  exp('2026-01-20', 'Biaya Minum & Makan', '6405', 720000); 
  exp('2026-01-20', 'Plastik Cor', '5100', 95000);
  exp('2026-01-21', 'Makan Minum & Plural Kopi', '6405', 738000);
  exp('2026-01-21', 'Perlengkapan & Nota', '6402', 954000);
  exp('2026-01-21', 'Mas Suhar & Pinjaman Adi', '1301', 800000);
  exp('2026-01-21', 'Solar 87 Liter', '6403', 1000500);
  exp('2026-01-22', 'Semen Conch 10 Zak', '5100', 770000);
  exp('2026-01-22', 'Print & Kertas', '6401', 40000);
  exp('2026-01-22', 'Solar 260 Liter', '6403', 29900000);
  exp('2026-01-22', 'Kerja Lapangan Bang Robet', '6100', 1450000);
  exp('2026-01-23', 'Batu Split 1x2 100 M3', '5100', 28000000);
  exp('2026-01-23', 'Upah Pekerja', '6100', 15869700);
  exp('2026-01-23', 'Angkutan Batu', '6403', 2400000);
  exp('2026-01-23', 'Printer Epson L3210', '1704', 5610000);
  exp('2026-01-24', 'Angkutan Batu 58 Ret', '6403', 46400000);
  exp('2026-01-24', 'Pinjaman Edo & Beni', '1301', 2100000);
  exp('2026-01-25', 'Bayar HM Exsa', '6403', 32000000);
  exp('2026-01-25', 'Baya Ketring & Minum', '6405', 2729000);
  exp('2026-01-26', 'Angkutan Batu Dan Pasir', '6403', 21500000);
  exp('2026-01-26', 'Batu Asen 200 M3', '5100', 56000000);
  exp('2026-01-26', 'Bayar Pasir 354 M3', '5100', 23510000);
  exp('2026-01-26', 'Semen & Ongkir', '5100', 170375000);
  exp('2026-01-27', 'Pembayaran Batu Boma', '5100', 9200000); 
  exp('2026-01-28', 'Jasa TDD Berkas & Sewa Mixer', '6403', 3800000);
  exp('2026-01-29', 'Pembyran Ritase Asen 58', '6403', 46400000);
  exp('2026-01-29', 'Pembayaran Batu 1x2 150 M3', '5100', 42000000);
  exp('2026-01-30', 'Semen Bag & Ongkir', '5100', 32700000);
  exp('2026-01-31', 'Sisa Gaji ADI & Lembur', '6100', 1260000);
  exp('2026-02-01', 'Biaya Transport PT WAY', '6403', 900000);
  exp('2026-02-01', 'Semen Bag & Ongkir', '5100', 99664000);
  exp('2026-02-02', 'Bayar HM Exsa 50 HM', '6403', 32000000);
  exp('2026-02-02', 'Bayar Pasir 247 M3', '5100', 16055000);
  exp('2026-02-02', 'Bayar batu 150 M3', '5100', 42000000);
  exp('2026-02-04', 'Semen 10 Bag & 5 Sag', '5100', 15420000);

  // ==========================================
  // 3. LAPORAN KEUANGAN READY MIX
  // ==========================================
  exp('2026-01-06', 'RM: Bayar Exsa & Penurunan', '6403', 33300000);
  exp('2026-01-06', 'RM: Bayar Mob The Mob Exsa', '6403', 3500000);
  exp('2026-01-06', 'RM: Makan Minum J Cofee', '6405', 550000);
  exp('2026-01-06', 'RM: Papan Mall, Terucuk, Material', '5100', 2172000);
  exp('2026-01-06', 'RM: Batu 1x1 5 M3', '5100', 1400000);
  exp('2026-01-06', 'RM: TC 1 Unit', '6402', 1251000);
  exp('2026-01-06', 'RM: Beton Mix & Kawat', '5100', 136000);
  exp('2026-01-06', 'RM: Material Listrik, Lampu Tembak', '6402', 4306000);
  exp('2026-01-07', 'RM: Uang jaga malam 6 mlm', '6100', 1300000);
  exp('2026-01-09', 'RM: Semen 20 Ton+40 Zag', '5100', 33000000);
  exp('2026-01-09', 'RM: Batu 1x1 70 M3', '5100', 19600000);
  exp('2026-01-09', 'RM: Pinjaman Batching Plong', '1301', 1000000);
  exp('2026-01-09', 'RM: Kasur, Bantal, Tikar (Mess)', '6402', 690000);
  exp('2026-01-12', 'RM: Sewa Mixer 2 Unit', '6403', 30000000);
  exp('2026-01-12', 'RM: Belanja Toko (Alat)', '6402', 1513500);
  exp('2026-01-13', 'RM: Bayar batu 70 M3 Via Asip', '5100', 19600000);
  exp('2026-01-13', 'RM: Obat Beton', '5100', 840000);
  exp('2026-01-14', 'RM: Semen 20 Ton+40 Zag', '5100', 69000000);
  exp('2026-01-14', 'RM: Bayar Catring', '6405', 2024000);

  return journals;
}
