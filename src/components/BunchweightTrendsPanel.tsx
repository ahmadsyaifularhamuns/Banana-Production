import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import { Activity, FileSpreadsheet, ChevronUp, ChevronDown } from 'lucide-react';

interface BunchweightTrendsPanelProps {
  theme: string;
  bunchweightChartData: any[];
  showBunchweightTableDetails: boolean;
  setShowBunchweightTableDetails: (show: boolean) => void;
}

export const BunchweightTrendsPanel: React.FC<BunchweightTrendsPanelProps> = ({
  theme,
  bunchweightChartData,
  showBunchweightTableDetails,
  setShowBunchweightTableDetails,
}) => {
  const [viewType, setViewType] = React.useState<'all' | 'single'>('all');
  const [selectedSingle, setSelectedSingle] = React.useState<'GGP' | 'PG1' | 'PG2' | 'PG3' | 'PG4'>('GGP');

  return (
    <section className={`p-6 rounded-2xl flex flex-col justify-between border transition-colors ${
      theme === 'dark' 
        ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      <div className="space-y-4">
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 transition-colors ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-purple-50 text-purple-600 border-purple-200'
              }`}>
                <Activity className="h-4 w-4" />
              </span>
              <h3 className={`font-bold text-sm flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              }`}>
                Grafik Tren Bunchweight (GGP, PG1, PG2, PG3, PG4)
              </h3>
            </div>
          </div>

          {/* Panel Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Type Toggle */}
            <div className={`flex items-center p-0.5 rounded-lg border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setViewType('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  viewType === 'all'
                    ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Semua Grup
              </button>
              <button
                onClick={() => setViewType('single')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  viewType === 'single'
                    ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Grup Tunggal
              </button>
            </div>

            {/* Individual Group Selector */}
            {viewType === 'single' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Pilih Grup:</span>
                <select
                  value={selectedSingle}
                  onChange={(e) => setSelectedSingle(e.target.value as any)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all focus:outline-hidden ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-purple-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-purple-500 shadow-xs'
                  }`}
                >
                  <option value="GGP">GGP</option>
                  <option value="PG1">PG1</option>
                  <option value="PG2">PG2</option>
                  <option value="PG3">PG3</option>
                  <option value="PG4">PG4</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={bunchweightChartData} margin={{ top: 25, right: 20, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
              <XAxis 
                dataKey="name" 
                stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                fontSize={10} 
                tickLine={false} 
                tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569' }}
              />
              <YAxis 
                stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                  borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                  borderRadius: '12px',
                  color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              {viewType === 'all' ? (
                <>
                  <Bar 
                    name="GGP" 
                    dataKey="GGP" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32} 
                    opacity={0.35} 
                  />
                  <Line 
                    name="PG1" 
                    type="monotone" 
                    dataKey="PG1" 
                    stroke="#0d9488" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, strokeWidth: 1, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                  />
                  <Line 
                    name="PG2" 
                    type="monotone" 
                    dataKey="PG2" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, strokeWidth: 1, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                  />
                  <Line 
                    name="PG3" 
                    type="monotone" 
                    dataKey="PG3" 
                    stroke="#ef4444" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, strokeWidth: 1, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                  />
                  <Line 
                    name="PG4" 
                    type="monotone" 
                    dataKey="PG4" 
                    stroke="#a855f7" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, strokeWidth: 1, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                  />
                </>
              ) : (
                <>
                  {selectedSingle === 'GGP' && (
                    <Bar 
                      name="GGP" 
                      dataKey="GGP" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={36} 
                      opacity={0.85} 
                    />
                  )}
                  {selectedSingle === 'PG1' && (
                    <Line 
                      name="PG1" 
                      type="monotone" 
                      dataKey="PG1" 
                      stroke="#0d9488" 
                      strokeWidth={3} 
                      dot={{ r: 5, strokeWidth: 2, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                    />
                  )}
                  {selectedSingle === 'PG2' && (
                    <Line 
                      name="PG2" 
                      type="monotone" 
                      dataKey="PG2" 
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      dot={{ r: 5, strokeWidth: 2, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                    />
                  )}
                  {selectedSingle === 'PG3' && (
                    <Line 
                      name="PG3" 
                      type="monotone" 
                      dataKey="PG3" 
                      stroke="#ef4444" 
                      strokeWidth={3} 
                      dot={{ r: 5, strokeWidth: 2, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                    />
                  )}
                  {selectedSingle === 'PG4' && (
                    <Line 
                      name="PG4" 
                      type="monotone" 
                      dataKey="PG4" 
                      stroke="#a855f7" 
                      strokeWidth={3} 
                      dot={{ r: 5, strokeWidth: 2, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                    />
                  )}
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Data Table */}
        <div className={`rounded-2xl border transition-all duration-300 mt-4 ${
          showBunchweightTableDetails ? 'p-6' : 'py-1.5 px-6'
        } ${
          theme === 'dark' ? 'bg-slate-900/10 border-slate-800/60 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`${showBunchweightTableDetails ? 'space-y-4' : ''}`}>
            <div className={`flex items-center justify-between transition-colors ${
              showBunchweightTableDetails 
                ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                : ''
            }`}>
              <h4 className={`text-[12px] font-bold flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
              }`}>
                <FileSpreadsheet className="h-4 w-4 text-purple-500" />
                Tabel Rincian Berat Tandan Rata-rata (Bunchweight - Kg)
              </h4>
              <button
                onClick={() => setShowBunchweightTableDetails(!showBunchweightTableDetails)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                }`}
                title={showBunchweightTableDetails ? "Sembunyikan Panel" : "Tampilkan Panel"}
              >
                {showBunchweightTableDetails ? (
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

            {showBunchweightTableDetails && (
              <div className="max-h-56 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className={`border-b transition-colors text-[10px] font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      <th className="py-2.5 px-3 font-semibold sticky top-0">Rentang Waktu</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">GGP</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">PG1</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">PG2</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">PG3</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">PG4</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-[11px] transition-colors ${
                    theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {bunchweightChartData.map((row, idx) => {
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors`}>
                          <td className="py-2 px-3 font-medium">{row.name}</td>
                          <td className="py-2 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            {row.GGP !== null && row.GGP !== undefined ? `${row.GGP.toFixed(2)} Kg` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-teal-600 dark:text-teal-400 font-semibold">
                            {row.PG1 !== null && row.PG1 !== undefined ? `${row.PG1.toFixed(2)} Kg` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            {row.PG2 !== null && row.PG2 !== undefined ? `${row.PG2.toFixed(2)} Kg` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                            {row.PG3 !== null && row.PG3 !== undefined ? `${row.PG3.toFixed(2)} Kg` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-purple-600 dark:text-purple-400 font-semibold">
                            {row.PG4 !== null && row.PG4 !== undefined ? `${row.PG4.toFixed(2)} Kg` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
