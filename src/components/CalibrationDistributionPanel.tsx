import React from 'react';
import { ResponsiveContainer, AreaChart, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';
import { BarChart2, FileSpreadsheet, ChevronUp, ChevronDown } from 'lucide-react';

interface CalibrationDistributionPanelProps {
  theme: string;
  calibrationChartType: 'stacked' | 'line';
  setCalibrationChartType: (type: 'stacked' | 'line') => void;
  selectedCalibrationPg: string;
  setSelectedCalibrationPg: (pg: string) => void;
  calibrationChartData: any[];
  showCalibrationTableDetails: boolean;
  setShowCalibrationTableDetails: (show: boolean) => void;
}

export const CalibrationDistributionPanel: React.FC<CalibrationDistributionPanelProps> = ({
  theme,
  calibrationChartType,
  setCalibrationChartType,
  selectedCalibrationPg,
  setSelectedCalibrationPg,
  calibrationChartData,
  showCalibrationTableDetails,
  setShowCalibrationTableDetails,
}) => {
  return (
    <section className={`p-6 rounded-2xl space-y-6 border transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <BarChart2 className="h-4 w-4 text-blue-500" />
            </span>
            <h2 className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
              Sebaran Kalibrasi
            </h2>
          </div>
        </div>

        {/* Panel Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chart Type Toggle */}
          <div className={`flex items-center p-0.5 rounded-lg border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setCalibrationChartType('stacked')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                calibrationChartType === 'stacked'
                  ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Akumulatif
            </button>
            <button
              onClick={() => setCalibrationChartType('line')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                calibrationChartType === 'line'
                  ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Garis Tren
            </button>
          </div>

          {/* Group Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Group:</span>
            <select
              value={selectedCalibrationPg}
              onChange={(e) => setSelectedCalibrationPg(e.target.value)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all focus:outline-hidden ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500 shadow-xs'
              }`}
            >
              <option value="GGP">GGP</option>
              <option value="PG1">PG1</option>
              <option value="PG2">PG2</option>
              <option value="PG3">PG3</option>
              <option value="PG4">PG4</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {calibrationChartType === 'stacked' ? (
              <AreaChart data={calibrationChartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
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
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                  }} 
                  formatter={(value: any) => [`${value}%`]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area 
                  type="monotone" 
                  name="<= 42" 
                  dataKey="under42" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.4} 
                />
                <Area 
                  type="monotone" 
                  name="43 - 46 (Premium)" 
                  dataKey="range43_46" 
                  stackId="1" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.4} 
                />
                <Area 
                  type="monotone" 
                  name=">= 47" 
                  dataKey="over47" 
                  stackId="1" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.4} 
                />
                <Area 
                  type="monotone" 
                  name="NR" 
                  dataKey="nr" 
                  stackId="1" 
                  stroke="#94a3b8" 
                  fill="#94a3b8" 
                  fillOpacity={0.4} 
                />
              </AreaChart>
            ) : (
              <ComposedChart data={calibrationChartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
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
                  unit="%"
                  domain={[0, 'auto']}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                  }} 
                  formatter={(value: any) => [`${value}%`]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line 
                  type="monotone" 
                  name="<= 42" 
                  dataKey="under42" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  name="43 - 46 (Premium)" 
                  dataKey="range43_46" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  name=">= 47" 
                  dataKey="over47" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  name="NR" 
                  dataKey="nr" 
                  stroke="#94a3b8" 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Calibration Details Table */}
        <div className={`rounded-2xl border transition-all duration-300 ${
          showCalibrationTableDetails ? 'p-6' : 'py-1.5 px-6'
        } ${
          theme === 'dark' ? 'bg-slate-900/10 border-slate-800/60 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`${showCalibrationTableDetails ? 'space-y-4' : ''}`}>
            <div className={`flex items-center justify-between transition-colors ${
              showCalibrationTableDetails 
                ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                : ''
            }`}>
              <h4 className={`text-[12px] font-bold flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
              }`}>
                <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                Tabel Rincian Sebaran Kalibrasi ({selectedCalibrationPg}) - %
              </h4>
              <button
                onClick={() => setShowCalibrationTableDetails(!showCalibrationTableDetails)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                }`}
                title={showCalibrationTableDetails ? "Sembunyikan Panel" : "Tampilkan Panel"}
              >
                {showCalibrationTableDetails ? (
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

            {showCalibrationTableDetails && (
              <div className="max-h-56 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className={`border-b transition-colors text-[10px] font-mono uppercase tracking-wider ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      <th className="py-2.5 px-3 font-semibold sticky top-0">Rentang Waktu</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">&lt;= 42 (%)</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">43 - 46 (%)</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">&gt;= 47 (%)</th>
                      <th className="py-2.5 px-3 font-semibold text-right sticky top-0">NR (%)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-[11px] transition-colors ${
                    theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {calibrationChartData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-2 px-3 font-medium">{row.name}</td>
                        <td className="py-2 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          {row.under42 !== null && row.under42 !== undefined ? `${row.under42}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {row.range43_46 !== null && row.range43_46 !== undefined ? `${row.range43_46}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-purple-600 dark:text-purple-400 font-semibold">
                          {row.over47 !== null && row.over47 !== undefined ? `${row.over47}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500 font-semibold">
                          {row.nr !== null && row.nr !== undefined ? `${row.nr}%` : '-'}
                        </td>
                      </tr>
                    ))}
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
