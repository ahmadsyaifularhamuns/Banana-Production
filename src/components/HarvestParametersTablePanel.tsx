import React, { useState, useMemo } from 'react';
import { DashboardData, ViewMode } from '../types';
import { FileSpreadsheet, ChevronUp, ChevronDown, Table } from 'lucide-react';

interface HarvestParametersTablePanelProps {
  theme: string;
  selectedGroup: string;
  viewMode: ViewMode;
  categoryA: string;
  chartData: any[];
  data: DashboardData;
}

export const HarvestParametersTablePanel: React.FC<HarvestParametersTablePanelProps> = ({
  theme,
  selectedGroup,
  viewMode,
  categoryA,
  chartData,
  data,
}) => {
  const [showTable, setShowTable] = useState<boolean>(true);
  const [activeGroup, setActiveGroup] = useState<string>(selectedGroup);

  // Sync activeGroup when main selectedGroup changes
  React.useEffect(() => {
    setActiveGroup(selectedGroup);
  }, [selectedGroup]);

  const groups = ['PG1', 'PG2', 'PG3', 'PG4', 'GGP', 'NSA CG', 'GGF TOTAL'];

  // Extract parameter rows for the selected group across active chartData columns
  const tableRows = useMemo(() => {
    const currentGroup = activeGroup || 'PG1';

    // 1. Ave Calibrasi
    const calRow = data.progressParameters?.find(
      p => p.group.toUpperCase() === currentGroup.toUpperCase() && p.parameter.toUpperCase() === 'KALIBRASI'
    );

    // 2. Ave Umur
    const ageRow = data.progressParameters?.find(
      p => p.group.toUpperCase() === currentGroup.toUpperCase() && p.parameter.toUpperCase() === 'UMUR'
    );

    // 3. Hand Class Harvest
    const handRow = data.progressParameters?.find(
      p => p.group.toUpperCase() === currentGroup.toUpperCase() && (
        p.parameter.toLowerCase().includes('hanclass') || p.parameter.toLowerCase().includes('hand class')
      )
    );

    // 4. %Cal <42
    const calUnder42Row = data.calibrationDistribution?.find(
      d => d.pg.toUpperCase() === currentGroup.toUpperCase() && d.calibrationClass === '<42'
    );

    // 5. %Cal 43 - 46
    const cal43_46Row = data.calibrationDistribution?.find(
      d => d.pg.toUpperCase() === currentGroup.toUpperCase() && d.calibrationClass === '43-46'
    );

    // 6. %Cal >47
    const calOver47Row = data.calibrationDistribution?.find(
      d => d.pg.toUpperCase() === currentGroup.toUpperCase() && d.calibrationClass === '>47'
    );

    // 7. NR
    const calNrRow = data.calibrationDistribution?.find(
      d => d.pg.toUpperCase() === currentGroup.toUpperCase() && d.calibrationClass === 'NR'
    );

    // 8. Bunchweight
    const bwRow = data.comparisonData?.find(
      d => d.group.toUpperCase() === currentGroup.toUpperCase() &&
        d.parameter === 'Bunchweight' &&
        (d.dataType === categoryA || d.dataType === 'Aktual')
    );

    // Helper to extract value per column point
    const getValueFromRow = (rowObj: any, point: any, isMonthlyFromYearly: boolean = false) => {
      if (!rowObj) return null;
      const idx = point.index;
      let valArray: (number | null)[] | undefined;

      if (viewMode === 'daily') {
        const wIdx = point.weekIndex !== undefined ? point.weekIndex : Math.floor(idx / 7);
        valArray = rowObj.weekly;
        if (valArray && wIdx < valArray.length) {
          const v = valArray[wIdx];
          return v !== null && v !== undefined ? v : null;
        }
      } else if (viewMode === 'weekly') {
        valArray = rowObj.weekly;
        if (valArray && idx < valArray.length) {
          const v = valArray[idx];
          return v !== null && v !== undefined ? v : null;
        }
      } else {
        // Monthly modes
        if (rowObj.monthlyCutDate || rowObj.monthlyCutWeek) {
          valArray = viewMode === 'monthlyCutDate' ? rowObj.monthlyCutDate : rowObj.monthlyCutWeek;
        } else if (rowObj.monthly) {
          valArray = rowObj.monthly;
        }
        if (valArray && idx < valArray.length) {
          const v = valArray[idx];
          return v !== null && v !== undefined ? v : null;
        }
      }
      return null;
    };

    const definitions = [
      { id: 'cal', label: 'Ave Cal', rowObj: calRow, unit: 'cm', format: (v: number) => v.toFixed(1) },
      { id: 'age', label: 'Ave Umur', rowObj: ageRow, unit: 'mgg', format: (v: number) => v.toFixed(1) },
      { id: 'hand', label: 'Hand Class', rowObj: handRow, unit: 'Hand', format: (v: number) => v.toFixed(1) },
      { id: 'u42', label: '%Cal <42', rowObj: calUnder42Row, unit: '%', format: (v: number) => v.toFixed(1) },
      { id: 'c43_46', label: '%Cal 43 - 46', rowObj: cal43_46Row, unit: '%', format: (v: number) => v.toFixed(1) },
      { id: 'o47', label: '%Cal >47', rowObj: calOver47Row, unit: '%', format: (v: number) => v.toFixed(1) },
      { id: 'bw', label: 'B.Weight', rowObj: bwRow, unit: 'Kg', format: (v: number) => v.toFixed(1), isHighlight: true },
    ];

    return definitions.map(def => {
      const values = chartData.map(point => {
        const raw = getValueFromRow(def.rowObj, point);
        if (raw === null || raw === undefined || isNaN(raw)) return '-';
        return def.format(raw);
      });

      return {
        id: def.id,
        label: def.label,
        unit: def.unit,
        isHighlight: !!def.isHighlight,
        values,
      };
    });
  }, [data, activeGroup, chartData, viewMode, categoryA]);

  return (
    <section className={`rounded-2xl border transition-all duration-300 ${
      showTable ? 'p-3 sm:p-4' : 'py-1.5 px-4 sm:px-6'
    } ${
      theme === 'dark'
        ? 'bg-slate-950/40 border-slate-800/80 text-slate-100'
        : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      <div className={`${showTable ? 'space-y-2.5' : ''}`}>
        {/* Header Bar */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
          showTable
            ? 'border-b pb-2 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
            : ''
        }`}>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className={`p-1 rounded-lg border transition-colors shrink-0 ${
              theme === 'dark'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <Table className="h-3.5 w-3.5" />
            </span>
            <h3 className={`font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors break-words flex-wrap ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
            }`}>
              Tabel Parameters of Bunchweigt
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {showTable && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Group:</span>
                <select
                  value={activeGroup}
                  onChange={(e) => setActiveGroup(e.target.value)}
                  className={`text-xs font-bold px-2 py-0.5 rounded-md border transition-all focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 text-emerald-400'
                      : 'bg-slate-50 border-slate-300 text-emerald-700 shadow-xs'
                  }`}
                >
                  {groups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowTable(!showTable)}
              className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
              }`}
              title={showTable ? "Sembunyikan Panel" : "Tampilkan Panel"}
            >
              {showTable ? (
                <ChevronUp className="h-4 w-4 text-rose-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-emerald-500" />
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Table */}
        {showTable && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                {/* Timeline Header Row */}
                <tr className={`border-b transition-colors text-[11px] font-mono font-bold ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  <th className="py-1 px-1 text-left sticky left-0 z-20 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-[70px] min-w-[70px] max-w-[70px] text-[10px]">
                    Parameter
                  </th>
                  {chartData.map((pt, idx) => (
                    <th key={idx} className="py-1 px-2 min-w-[48px] font-bold border-r border-slate-200/50 dark:border-slate-800/50">
                      {pt.name.replace(/^W0?/, 'W')}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className={`divide-y transition-colors font-mono text-[11px] ${
                theme === 'dark' ? 'divide-slate-800/70 text-slate-200' : 'divide-slate-100 text-slate-800'
              }`}>
                {tableRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:bg-slate-500/5 ${
                      row.isHighlight
                        ? theme === 'dark'
                          ? 'bg-emerald-950/20 font-bold text-emerald-300'
                          : 'bg-emerald-50/60 font-bold text-emerald-900'
                        : ''
                    }`}
                  >
                    {/* Sticky Parameter Name Column */}
                    <td className={`py-1 px-1 text-left font-sans font-semibold sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 w-[70px] min-w-[70px] max-w-[70px] text-[10px] ${
                      row.isHighlight
                        ? theme === 'dark' ? 'bg-slate-900 text-emerald-400' : 'bg-emerald-50 text-emerald-800'
                        : theme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-white text-slate-800'
                    }`}>
                      <div className="flex flex-col leading-tight overflow-hidden">
                        <span className="truncate font-bold" title={row.label}>{row.label}</span>
                        {row.unit && (
                          <span className="text-[8px] font-normal text-slate-400 dark:text-slate-500 font-mono">
                            ({row.unit})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Data Cells */}
                    {row.values.map((val, idx) => (
                      <td
                        key={idx}
                        className={`py-1 px-2 border-r border-slate-200/40 dark:border-slate-800/40 whitespace-nowrap ${
                          row.isHighlight ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
