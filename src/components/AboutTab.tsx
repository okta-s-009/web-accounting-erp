import React, { useRef } from 'react';
import { Mail, Phone, Code, Server, Database, ShieldCheck, Heart, Lightbulb, Layers, Code2, HardDrive, Monitor, Calculator, ShieldCheck as ShieldCheckIcon, Globe, DownloadCloud, UploadCloud, AlertCircle } from 'lucide-react';
import { ERPDatabase } from '../data/accountingEngine';

interface AboutTabProps {
  db?: ERPDatabase;
  onImportDatabase?: (db: ERPDatabase) => void;
}

const WORKFLOW_PHASES = [
  {
    phase: "0",
    icon: Code2,
    title: "Fondasi Proyek",
    desc: "Persiapan awal pengembangan sistem dengan penekanan pada stabilitas, kecepatan, dan konsistensi kode.",
    techs: [
      { name: "React & TypeScript", desc: "Arsitektur UI berbasis komponen dengan type safety penuh untuk mencegah bug." },
      { name: "Vite Build Engine", desc: "Dev server super cepat dengan Hot Module Replacement (HMR)." },
      { name: "Lucide React", desc: "Sistem ikon SVG modern yang ringan dan dapat dikustomisasi." },
      { name: "ESLint Configuration", desc: "Standarisasi kualitas kode (linter) sejak hari pertama." }
    ],
    tip: "Gunakan interface TypeScript yang ketat untuk skema transaksi (ERPDatabase) agar struktur data tidak pernah meleset."
  },
  {
    phase: "1",
    icon: HardDrive,
    title: "Database & State",
    desc: "Sistem persintensi data dan manajemen state yang beroperasi sepenuhnya di sisi klien (browser) tanpa server backend.",
    techs: [
      { name: "Client-Side Engine", desc: "Mesin pengolah transaksi dan jurnal yang berjalan mandiri tanpa butuh Node.js/PostgreSQL." },
      { name: "LocalStorage API", desc: "Penyimpanan data jangka panjang langsung di peramban pengguna secara instan." },
      { name: "React Hooks", desc: "Manajemen state aplikasi terpusat (useState, useEffect) tanpa overhead Redux." },
      { name: "JSON Serialization", desc: "Format penyimpanan ringan untuk data ledger kompleks." }
    ],
    tip: "Data finansial sangat kritikal. Gunakan fungsi tersentralisasi (saveDatabase) untuk memastikan data tidak terpotong saat disimpan."
  },
  {
    phase: "2",
    icon: Monitor,
    title: "Frontend & Desain UI",
    desc: "Merancang antarmuka pengguna yang cepat, elegan, responsif, dan menyajikan data keuangan secara intuitif.",
    techs: [
      { name: "Tailwind CSS", desc: "Sistem utility-class yang menjamin desain selalu konsisten dan bebas dari konflik gaya CSS." },
      { name: "Responsive Layout", desc: "Desain yang mampu menyesuaikan ukuran layar dari desktop hingga mobile (sidebar/drawer)." },
      { name: "Modern Aesthetics", desc: "Penerapan tema gelap (dark mode), efek blur, dan gradien untuk kesan sistem premium." },
      { name: "Print Media CSS", desc: "Konfigurasi stylesheet khusus pencetakan (@media print) agar laporan PDF presisi." }
    ],
    tip: "Berikan sentuhan warna (color coding) pada badge transaksi—misalnya Hijau untuk Kas Masuk dan Merah untuk Keluar—agar mudah dibaca."
  },
  {
    phase: "3",
    icon: Calculator,
    title: "Fitur ERP & Akuntansi",
    desc: "Inti dari seluruh aplikasi: dari kalkulasi pajak hingga penyusunan laporan keuangan otomatis.",
    techs: [
      { name: "Double-Entry Ledger", desc: "Engine otomatis yang menyelaraskan Penjualan dan Pembelian ke dalam jurnal Debit/Kredit." },
      { name: "Auto-Reporting", desc: "Penghasilan Laba Rugi dan Neraca yang terkomputasi secara real-time dari data mentah." },
      { name: "Tax Engine (PPN 12%)", desc: "Kalkulator PPN terbaru (12%) dan fasilitas PPh (Pasal 31E UU HPP) yang terintegrasi di dokumen." },
      { name: "Role-Based Access (RBAC)", desc: "Pembatasan hak akses modul berdasarkan profil login (Fullstack Developer, Admin, dsb)." }
    ],
    tip: "Pisahkan file khusus engine (accountingEngine.ts) dari komponen UI (React) agar logika perhitungan tidak tercampur."
  },
  {
    phase: "4",
    icon: ShieldCheckIcon,
    title: "Testing & Quality Assurance",
    desc: "Tahapan pengujian kestabilan fitur dan pencegahan anomali pada aplikasi akuntansi.",
    techs: [
      { name: "Static Analysis", desc: "Pengecekan tipe data (TypeScript Compiler) secara statis untuk mencegah data 'undefined'." },
      { name: "Manual E2E Flow", desc: "Pengujian simulasi hulu-hilir: Input Master Data → Transaksi → Cetak Laporan Keuangan." },
      { name: "Browser Compatibility", desc: "Memastikan konsistensi tampilan dan fungsionalitas di engine Chromium maupun WebKit." },
      { name: "Zero-Build Depoyment", desc: "Aplikasi HTML/JS/CSS statis yang bisa dihosting di mana saja tanpa konfigurasi server rumit." }
    ],
    tip: "Sediakan selalu tombol 'Reset/Hapus Semua' di masa testing agar mudah menguji database kosong secara cepat."
  },
  {
    phase: "5",
    icon: Globe,
    title: "Deployment & Pengiriman",
    desc: "Proses merilis aplikasi ke tangan pengguna (CV. Toras Benaunt) dengan mulus tanpa konfigurasi server.",
    techs: [
      { name: "Static Build Generation", desc: "Kompilasi kode sumber (Vite Build) menjadi HTML/JS/CSS murni berukuran kecil." },
      { name: "Browser-based Hosting", desc: "Menjalankan aplikasi langsung dari file lokal (file://) atau hosting statis manapun." },
      { name: "Local Persistence", desc: "Data transaksi 100% tersimpan aman di browser perangkat operasional harian perusahaan." },
      { name: "Zero-Downtime Update", desc: "Pembaruan fitur sistem hanya perlu menimpa file UI lama tanpa mematikan server database." }
    ],
    tip: "Karena sistem kita berjalan mandiri di browser, tidak ada biaya langganan bulanan untuk server (VPS) maupun database!"
  }
];

export const AboutTab: React.FC<AboutTabProps> = ({ db, onImportDatabase }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!db) return;
    const dataStr = JSON.stringify(db, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup-erp-torasbenaunt-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.userSession && json.chartOfAccounts) {
          if (window.confirm('Peringatan: Mengimpor database akan menimpa seluruh data yang ada saat ini. Anda yakin?')) {
            onImportDatabase?.(json);
          }
        } else {
          alert('Format file tidak valid. Pastikan file backup berasal dari sistem ini.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON. File mungkin rusak.');
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-zinc-900 rounded-2xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500 opacity-10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-3xl backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
            <Code className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-300" />
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
              Web Accounting ERP
            </h1>
            <p className="text-indigo-100/80 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
              Sistem Perencanaan Sumber Daya Perusahaan (ERP) khusus yang dibangun untuk mencatat operasional harian, akuntansi, dan rekam jejak finansial perusahaan secara efisien, aman, dan modern.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wide border border-white/10">v3.0.0-production</span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold tracking-wide border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure Local Database
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-white/[0.06] shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-black text-zinc-200 mb-6 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" /> Profil Pengembang
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 shrink-0 shadow-sm">
                <span className="text-indigo-700 font-black text-xl">OE</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Oktavianus Eko Haryanto</h3>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-0.5">Full Stack Developer</p>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed font-medium">
                  Arsitek dan pengembang utama di balik sistem ERP ini. Mengkhususkan diri dalam pengembangan antarmuka web modern, manajemen state aplikasi yang kompleks, dan sistem basis data lokal berbasis peramban (browser-based persistence).
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="mailto:oktavianus.eko11@gmail.com" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.06] transition-all group shadow-sm">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors shrink-0">
                  <Mail className="w-4 h-4 text-rose-600" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Email</p>
                  <p className="text-xs font-bold text-zinc-300 truncate">oktavianus.eko11@gmail.com</p>
                </div>
              </a>
              
              <a href="https://wa.me/6289665120396" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.06] transition-all group shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors shrink-0">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">WhatsApp</p>
                  <p className="text-xs font-bold text-zinc-300">0896-6512-0396</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-white/[0.06] shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-black text-zinc-200 mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" /> Teknologi & Infrastruktur
          </h2>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-300">React 18 & TypeScript</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Dibangun dengan arsitektur komponen modern berbasis hooks dan pengetikan statis ketat (strict typing) untuk meminimalisasi error.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-300">Vite Build Engine</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Memanfaatkan Vite sebagai bundler super cepat untuk HMR (Hot Module Replacement) dan optimasi build produksi yang ringan.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-300">Tailwind CSS & Lucide</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Sistem desain utilitas dipadukan dengan ikon SVG dinamis untuk UI yang estetis, rapi, dan responsif di seluruh perangkat.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-300">Client-Side Storage Engine</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Mesin database khusus berbasis LocalStorage yang memproses jurnal double-entry, kalkulasi HPP, dan pajak 100% di peramban tanpa delay server.</p>
              </div>
            </li>
          </ul>
          
          <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium">
            Sistem dirancang secara khusus untuk kelancaran bisnis Anda
          </div>
        </div>
      </div>

      {/* Database Management Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">Manajemen Database (LocalStorage)</h2>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">Cadangkan atau pulihkan data finansial Anda dengan aman.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50">
          <div className="bg-[#131a2b] border border-slate-800/80 rounded-xl p-5 hover:border-emerald-500/50 transition-colors">
            <h3 className="text-slate-200 font-bold text-sm mb-2 flex items-center gap-2">
              <DownloadCloud className="w-4 h-4 text-emerald-400" /> Ekspor (Backup)
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              Unduh seluruh data transaksi, master data, dan pengaturan Anda ke dalam file <code className="text-zinc-600">.json</code>. Simpan file ini di tempat yang aman.
            </p>
            <button 
              onClick={handleExport}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              Unduh Backup Sekarang
            </button>
          </div>

          <div className="bg-[#131a2b] border border-slate-800/80 rounded-xl p-5 hover:border-rose-500/50 transition-colors relative">
            <h3 className="text-slate-200 font-bold text-sm mb-2 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-rose-400" /> Impor (Restore)
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              Pulihkan data dari file <code className="text-zinc-600">.json</code> yang pernah Anda unduh. <span className="text-rose-400 font-bold">Aksi ini akan menimpa seluruh data saat ini!</span>
            </p>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white font-bold rounded-lg text-sm transition-colors border border-slate-700 hover:border-rose-500"
            >
              Pilih File Backup (.json)
            </button>
          </div>
        </div>
        
        <div className="bg-amber-500/10 border-t border-amber-500/20 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-amber-200/80 text-xs font-medium leading-relaxed">
            Sistem ini menggunakan arsitektur <strong className="text-amber-400">100% Client-Side Engine</strong>. Seluruh data keuangan tersimpan secara eksklusif di memori <em>browser</em> perangkat ini. Pastikan Anda melakukan <strong>Ekspor Backup</strong> secara berkala untuk menghindari kehilangan data jika Anda menghapus riwayat/cache peramban.
          </p>
        </div>
      </div>

      {/* Developer Workflow Section */}
      <div className="bg-[#0b0f19] rounded-2xl border border-slate-800/60 shadow-2xl overflow-hidden mt-10">
        <div className="p-8 sm:p-10 border-b border-slate-800/60 bg-[#0d1321] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">Standard Operating Procedure</h2>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Software Engineering Workflow & Tech Stack</p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {WORKFLOW_PHASES.map((w) => (
            <div key={w.phase} className="p-8 sm:p-10 hover:bg-[#0f1525] transition-colors group relative">
              <div className="absolute top-8 right-10 text-zinc-200 font-black text-6xl opacity-30 select-none group-hover:text-indigo-900/40 transition-colors">
                0{w.phase}
              </div>
              
              <div className="relative z-10 max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Fase {w.phase}
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-black text-slate-100 mb-3 tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                    <w.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  {w.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl font-medium mb-8">
                  {w.desc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {w.techs.map((tech, idx) => (
                    <div key={idx} className="bg-[#131a2b] border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-colors">
                      <h4 className="text-slate-200 font-bold text-sm mb-1">{tech.name}</h4>
                      <p className="text-zinc-500 text-xs leading-relaxed">{tech.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#131a2b]/80 border-l-2 border-emerald-500 rounded-r-xl p-4 flex gap-4 items-start relative overflow-hidden group-hover:bg-[#131a2b] transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Lightbulb className="w-24 h-24" />
                  </div>
                  <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase mb-1 block">Pro Tip</span>
                    <p className="text-zinc-600 text-xs leading-relaxed font-medium">{w.tip}</p>
                  </div>
                  <div className="ml-auto shrink-0 self-end opacity-20 text-[10px] font-mono text-zinc-500 group-hover:opacity-100 transition-opacity">
                    @okta's
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
