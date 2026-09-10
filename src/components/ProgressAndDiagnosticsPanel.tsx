import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Cpu, Activity, ChevronUp, ChevronDown, CheckCircle, ArrowDown } from 'lucide-react';

interface ProgressAndDiagnosticsPanelProps {
  theme: string;
  selectedGroup: string;
  progressChartData: any[];
  showDiagnosticsDetails: boolean;
  setShowDiagnosticsDetails: (show: boolean) => void;
  diagnostics: {
    reports: any[];
  };
  viewMode: string;
}

export const ProgressAndDiagnosticsPanel: React.FC<ProgressAndDiagnosticsPanelProps> = ({
  theme,
  selectedGroup,
  progressChartData,
  showDiagnosticsDetails,
  setShowDiagnosticsDetails,
  diagnostics,
  viewMode,
}) => {
  return (
    <section className={`p-6 rounded-2xl space-y-6 border transition-colors ${
      theme === 'dark' 
        ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      <div className={`border-b pb-4 transition-colors ${
        theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg border transition-colors ${
            theme === 'dark'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}>
            <Cpu className="h-4 w-4" />
          </span>
          <h2 className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
            Progres Parameter & Deteksi Masalah Produksi
          </h2>
        </div>
      </div>

      {/* Core trend visualizers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calibration Area Chart */}
        <div className={`border p-4 rounded-xl space-y-3 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900/40 border-slate-800/50 text-slate-100'
            : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className="flex justify-between items-center text-xs">
            <span className={`font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Rata-Rata Kalibrasi ({selectedGroup})</span>
            <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
              theme === 'dark' ? 'text-amber-400 bg-amber-500/10' : 'text-amber-700 bg-amber-50 border border-amber-100'
            }`}>Optimal: 44.5 cm</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressChartData}>
                <XAxis 
                  dataKey="name" 
                  fontSize={9} 
                  stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                  tickLine={false}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: '10px',
                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} cm`, 'Rata-Rata Kalibrasi']}
                />
                <Area type="monotone" dataKey="kalibrasi" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className={`border-b transition-colors text-[10px] font-mono uppercase tracking-wider ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    <th className="py-1.5 px-3 font-semibold">Periode</th>
                    <th className="py-1.5 px-3 font-semibold text-right">Nilai (cm)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-[11px] transition-colors ${
                  theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                }`}>
                  {progressChartData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-1.5 px-3 font-medium">{row.name}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {row.kalibrasi !== null ? `${row.kalibrasi.toFixed(2)} cm` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Harvesting Age Area Chart */}
        <div className={`border p-4 rounded-xl space-y-3 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900/40 border-slate-800/50 text-slate-100'
            : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className="flex justify-between items-center text-xs">
            <span className={`font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Umur Panen ({selectedGroup})</span>
            <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
              theme === 'dark' ? 'text-teal-400 bg-teal-500/10' : 'text-teal-700 bg-teal-50 border border-teal-100'
            }`}>Optimal: 10.0 mgg</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressChartData}>
                <XAxis 
                  dataKey="name" 
                  fontSize={9} 
                  stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                  tickLine={false}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: '10px',
                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} mgg`, 'Umur Panen']}
                />
                <Area type="monotone" dataKey="umur" stroke="#0d9488" fill="#0d9488" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className={`border-b transition-colors text-[10px] font-mono uppercase tracking-wider ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    <th className="py-1.5 px-3 font-semibold">Periode</th>
                    <th className="py-1.5 px-3 font-semibold text-right">Nilai (mgg)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-[11px] transition-colors ${
                  theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                }`}>
                  {progressChartData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-1.5 px-3 font-medium">{row.name}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-semibold text-teal-600 dark:text-teal-400">
                        {row.umur !== null ? `${row.umur.toFixed(2)} mgg` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Hand Class Area Chart */}
        <div className={`border p-4 rounded-xl space-y-3 transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900/40 border-slate-800/50 text-slate-100'
            : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className="flex justify-between items-center text-xs">
            <span className={`font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Hanclass Panen ({selectedGroup})</span>
            <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
              theme === 'dark' ? 'text-purple-400 bg-purple-500/10' : 'text-purple-700 bg-purple-50 border border-purple-100'
            }`}>Optimal: 8.0</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressChartData}>
                <XAxis 
                  dataKey="name" 
                  fontSize={9} 
                  stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                  tickLine={false}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: '10px',
                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                  }}
                  formatter={(val: any) => [Number(val).toFixed(2), 'Hanclass Panen']}
                />
                <Area type="monotone" dataKey="hanclass" stroke="#c084fc" fill="#a855f7" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className={`border-b transition-colors text-[10px] font-mono uppercase tracking-wider ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    <th className="py-1.5 px-3 font-semibold">Periode</th>
                    <th className="py-1.5 px-3 font-semibold text-right">Nilai (hand)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-[11px] transition-colors ${
                  theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                }`}>
                  {progressChartData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-1.5 px-3 font-medium">{row.name}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                        {row.hanclass !== null ? row.hanclass.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

      {/* AI / Automated Diagnostics Insights Card */}
      <div className={`border transition-all duration-300 ${
        showDiagnosticsDetails ? 'p-5 space-y-4' : 'py-1.5 px-5'
      } rounded-xl ${
        theme === 'dark'
          ? 'bg-slate-950/60 border-slate-800 text-slate-100'
          : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className={`flex items-center justify-between transition-colors ${
          showDiagnosticsDetails
            ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
            : ''
        }`}>
          <div className={`flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-colors ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Activity className="h-4 w-4 text-emerald-500" />
            <span>Diagnostic Engine Result (Analisis Penyebab Penurunan)</span>
          </div>
          <button
            onClick={() => setShowDiagnosticsDetails(!showDiagnosticsDetails)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
            }`}
            title={showDiagnosticsDetails ? "Sembunyikan Panel" : "Tampilkan Panel"}
          >
            {showDiagnosticsDetails ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-rose-500" />
                <span>Sembunyikan</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 text-emerald-500" />
                <span>Tampilkan</span>
              </>
            )}
          </button>
        </div>

        {showDiagnosticsDetails && (
          <>
            {diagnostics.reports.length === 0 ? (
              <div className={`flex items-center gap-2.5 text-sm p-4 rounded-xl border transition-colors ${
                theme === 'dark'
                  ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>
                  Tidak terdeteksi penurunan berat tandan (bunchweight) aktual {viewMode === 'weekly' || viewMode === 'daily' ? 'mingguan' : 'bulanan'} yang signifikan (&gt;0.5%) untuk Group <strong>{selectedGroup}</strong>. Performa berat tandan tergolong stabil dan konsisten.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <p className={`text-xs leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Berdasarkan pemindaian otomatis, ditemukan beberapa {viewMode === 'weekly' || viewMode === 'daily' ? 'minggu' : 'bulan'} di mana <strong>berat tandan (bunchweight) aktual jatuh</strong>. Hubungan korelasional dengan variabel kalibrasi, umur potong buah, dan handclass terindikasi di bawah ini:
                  </p>
                  {diagnostics.reports.length > 4 && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-800 text-slate-400'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      {diagnostics.reports.length} Temuan (Gulir ke bawah)
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="max-h-[6cm] overflow-y-auto pr-2 space-y-4 custom-scrollbar scroll-smooth">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                      {diagnostics.reports.map((report, idx) => (
                        <div key={idx} className={`border p-4 rounded-xl space-y-3 transition-colors ${
                          theme === 'dark'
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-bold text-sm transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{report.month}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                              theme === 'dark' ? 'text-rose-400 bg-rose-500/10' : 'text-rose-600 bg-rose-50 border border-rose-100'
                            }`}>
                              <ArrowDown className="h-3 w-3" />
                              Turun {report.percentDrop}% {viewMode === 'weekly' || viewMode === 'daily' ? 'WoW' : 'MoM'}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {report.causes.map((cause, cidx) => (
                              <div key={cidx} className={`flex items-start gap-2 text-xs leading-relaxed transition-colors ${
                                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                                <span>{cause}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
