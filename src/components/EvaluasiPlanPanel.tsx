import React, { useState, useEffect, useMemo, useRef } from 'react';
import ExcelJS from 'exceljs';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Layers, 
  Calendar, 
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Download
} from 'lucide-react';
import { EvaluasiPlanResponse, EvaluasiPlanProduct, EvaluasiPlanWeek } from '../types';

interface EvaluasiPlanPanelProps {
  theme: 'light' | 'dark';
}

export const EvaluasiPlanPanel: React.FC<EvaluasiPlanPanelProps> = ({ theme }) => {
  const [data, setData] = useState<EvaluasiPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // User selections
  const [selectedGroup, setSelectedGroup] = useState<string>('GGF Total');
  const [selectedWeek, setSelectedWeek] = useState<number>(32);
  const [unitMode, setUnitMode] = useState<'13.5' | 'native'>('native');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'domestic' | 'subtotals_only'>('domestic');
  const [tableFontSize, setTableFontSize] = useState<number>(12);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = isRefresh ? '/api/evaluasi-plan?refresh=true' : '/api/evaluasi-plan';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Gagal memuat data evaluasi plan`);
      const json: EvaluasiPlanResponse = await res.json();
      if (json.error && (!json.groups || json.groups.length === 0)) throw new Error(json.error);
      
      setData(json);

      // Auto select group if default not present
      if (json.groups && json.groups.length > 0 && !json.groups.includes(selectedGroup)) {
        setSelectedGroup(json.groups[0]);
      }

      // Auto detect latest week with actuals if 32 is invalid
      if (json.weeks && json.weeks.length > 0) {
        const hasW32 = json.weeks.some(w => w.weekNum === 32);
        if (!hasW32) {
          setSelectedWeek(json.weeks[json.weeks.length - 1].weekNum);
        }
      }
    } catch (err: any) {
      console.error("EvaluasiPlanPanel error:", err);
      setError(err.message || 'Gagal memuat data dari spreadsheet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Fullscreen ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Helper to parse numeric string safely with correct separator handling
  const parseNum = (valStr?: string): number | null => {
    if (!valStr) return null;
    let clean = valStr.trim();
    if (!clean || clean === '-' || clean === '#N/A' || clean === '#VALUE!' || clean === '#REF!' || clean === '#DIV/0!') return null;

    // Handle leading '+' or whitespace
    clean = clean.replace(/^\+/, '').trim();

    // Handle separators
    if (clean.includes('.') && clean.includes(',')) {
      // Both separators exist e.g. "1,500.00" or "1.500,00"
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastDot > lastComma) {
        // comma is thousands separator, dot is decimal separator
        clean = clean.replace(/,/g, '');
      } else {
        // dot is thousands separator, comma is decimal separator
        clean = clean.replace(/\./g, '').replace(/,/g, '.');
      }
    } else if (clean.includes(',')) {
      // Contains comma but no dot
      // Check if comma is used as thousands separator e.g. "1,500", "22,922", "+1,406"
      if (/^\s*-?\d{1,3}(,\d{3})+\s*$/.test(clean) || /,\d{3}$/.test(clean)) {
        clean = clean.replace(/,/g, '');
      } else if (/^\s*-?\d+,\d{1,2}\s*$/.test(clean)) {
        // Decimal comma e.g. "1,5" -> "1.5"
        clean = clean.replace(/,/g, '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes('.')) {
      // Contains dot but no comma
      // Check if dot is used as thousands separator e.g. "1.500", "22.922"
      if (/^\s*-?\d{1,3}(\.\d{3})+\s*$/.test(clean)) {
        clean = clean.replace(/\./g, '');
      }
    }

    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  };

  // Helper to format numeric display
  const formatValue = (num: number | null, unit: string = '13.5 Kg'): string => {
    if (num === null) return '-';
    if (num === 0) return '0';
    if (Math.abs(num) < 0.0001) return '-';
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    });
  };

  // Helper to calculate Potensi for a week with term update hierarchy (Demand -> M-0)
  const getPotensi = (product: EvaluasiPlanProduct, weekNum: number): { val: number | null; source: 'Demand' | 'M-0' | 'M-1' | '-' } => {
    if (!product || !product.values) return { val: null, source: '-' };

    const hierarchy: ('Demand' | 'M-0')[] = ['Demand', 'M-0'];
    const nameClean = product.name.trim().toLowerCase();
    const isHarvestOrBw = nameClean === 'harvest' || nameClean.includes('bunchweight') || nameClean.includes('bunchweigt');

    for (const jd of hierarchy) {
      const rawVal = product.values[jd]?.[weekNum];
      if (rawVal !== undefined && rawVal !== null) {
        const trimmed = rawVal.trim();
        if (trimmed !== '-' && trimmed !== '' && trimmed !== '#N/A' && trimmed !== '#VALUE!' && trimmed !== '#REF!' && trimmed !== '#DIV/0!') {
          const num = parseNum(rawVal);
          if (num !== null) {
            // Assume demand 0 for Harvest and Bunchweight means no demand data yet, fallback to M-0
            if (jd === 'Demand' && isHarvestOrBw && num === 0) {
              continue;
            }
            return { val: num, source: jd };
          }
        }
      }
    }

    return { val: null, source: '-' };
  };

  // Helper to get native unit info for specific products
  const getNativeUnitInfo = (productName: string): { weight: number; unitLabel: string } | null => {
    const nameClean = productName.trim().toLowerCase();

    // Exclude Harvest, Bunchweight, REC, Sisa Curah, Subtotals, Totals
    if (
      nameClean === 'harvest' ||
      nameClean.includes('bunchweight') ||
      nameClean.includes('bunchweigt') ||
      nameClean.includes('rec total packable') ||
      nameClean.includes('sisa curah') ||
      nameClean.includes('sub total') ||
      nameClean.includes('subtotal') ||
      nameClean.includes('total') ||
      nameClean.includes('grand total')
    ) {
      return null;
    }

    if (nameClean.includes('cmm singapore')) return { weight: 15.5, unitLabel: '15.5 Kg' };
    if (nameClean.includes('ggfs singapore')) return { weight: 15.5, unitLabel: '15.5 Kg' };
    if (nameClean.includes('ntuc singapore')) return { weight: 14.5, unitLabel: '14.5 Kg' };
    if (nameClean.includes('c3/5')) return { weight: 5.5, unitLabel: '5.5 Kg' };
    if (nameClean === 'single' || nameClean.includes('single')) return { weight: 1.75, unitLabel: '1.75 Kg' };
    if (nameClean.includes('mini banana/5')) return { weight: 5.5, unitLabel: '5.5 Kg' };
    if (nameClean.includes('family banana')) return { weight: 10.5, unitLabel: '10.5 Kg' };
    if (nameClean.includes('banana couple')) return { weight: 3.5, unitLabel: '3.5 Kg' };
    if (nameClean.includes('fmcg') || nameClean.includes('fb generik')) return { weight: 1.0, unitLabel: '1 Kg' };
    if (nameClean.includes('ssn') || nameClean.includes('curah terjual')) return { weight: 1.0, unitLabel: '1 Kg' };
    if (nameClean === 'ggl' || nameClean.includes('ggl')) return { weight: 1.0, unitLabel: '1 Kg' };

    return null;
  };

  // Helper to calculate product row values depending on unitMode
  const getConvertedProductValues = (
    prod: EvaluasiPlanProduct,
    unitMode: '13.5' | 'native',
    selectedWeekNum: number,
    w1: number,
    w2: number,
    w3: number
  ) => {
    const planStr = prod.values['Demand']?.[selectedWeekNum];
    const actStr = prod.values['Aktual']?.[selectedWeekNum];

    let planVal = parseNum(planStr);
    let actVal = parseNum(actStr);

    let pot1 = getPotensi(prod, w1);
    let pot2 = getPotensi(prod, w2);
    let pot3 = getPotensi(prod, w3);

    let unitLabel = prod.unit || '13.5 Kg';

    const nameClean = prod.name.trim().toLowerCase();
    const isSisaCurah = nameClean.includes('sisa curah');

    if (isSisaCurah) {
      if (unitMode === '13.5') {
        unitLabel = '13.5 Kg';
        if (planVal !== null) planVal = Math.round(planVal / 13.5);
        if (actVal !== null) actVal = Math.round(actVal / 13.5);

        if (pot1.val !== null) pot1 = { ...pot1, val: Math.round(pot1.val / 13.5) };
        if (pot2.val !== null) pot2 = { ...pot2, val: Math.round(pot2.val / 13.5) };
        if (pot3.val !== null) pot3 = { ...pot3, val: Math.round(pot3.val / 13.5) };
      } else {
        unitLabel = prod.unit || 'Kg';
      }
    } else if (unitMode === 'native') {
      const nativeInfo = getNativeUnitInfo(prod.name);
      if (nativeInfo) {
        unitLabel = nativeInfo.unitLabel;
        const factor = 13.5 / nativeInfo.weight;

        if (planVal !== null) planVal = Math.round(planVal * factor);
        if (actVal !== null) actVal = Math.round(actVal * factor);

        if (pot1.val !== null) pot1 = { ...pot1, val: Math.round(pot1.val * factor) };
        if (pot2.val !== null) pot2 = { ...pot2, val: Math.round(pot2.val * factor) };
        if (pot3.val !== null) pot3 = { ...pot3, val: Math.round(pot3.val * factor) };
      }
    }

    const diff = (actVal !== null && planVal !== null) 
      ? actVal - planVal 
      : (actVal !== null ? actVal : (planVal !== null ? -planVal : null));

    const ach = (actVal !== null && planVal !== null && planVal > 0)
      ? (actVal / planVal) * 100
      : null;

    return {
      unitLabel,
      planVal,
      actVal,
      diff,
      ach,
      pot1,
      pot2,
      pot3
    };
  };

  // Current products list for selected group
  const groupProducts = useMemo(() => {
    if (!data || !data.dataByGroup || !selectedGroup) return [];
    if (data.dataByGroup[selectedGroup]) return data.dataByGroup[selectedGroup].products;
    // Fallback case-insensitive match (e.g., 'GGF Total' vs 'GGF TOTAL')
    const key = Object.keys(data.dataByGroup).find(k => k.toLowerCase() === selectedGroup.toLowerCase());
    return key ? data.dataByGroup[key].products || [] : [];
  }, [data, selectedGroup]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const domesticProductNames = [
      'sub total export',
      'subtotal export',
      'c3/13',
      'c3/5',
      'single',
      'highland',
      'mini banana/13',
      'mini banana/5',
      'family banana',
      'big hand',
      'small hand',
      'c3a mini',
      'banana couple',
      'sweety',
      'fb1',
      'fb2',
      'fs1',
      'fs2',
      'fk',
      'sub total domestic',
      'subtotal domestic',
      'total packable (export & domestic)',
      'total packable'
    ];

    const list = groupProducts.filter(p => {
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(query)) return false;
      }

      // Filter mode
      if (filterMode === 'domestic') {
        const nameClean = p.name.trim().toLowerCase();
        const isDomestic = domesticProductNames.includes(nameClean) || nameClean.startsWith('total packable');
        if (!isDomestic) return false;
      } else if (filterMode === 'subtotals_only') {
        const nameClean = p.name.trim().toLowerCase();
        const isSubtotalOrTotal = p.name.includes('Sub total') || 
                                  p.name.includes('Total') || 
                                  p.name.includes('Grand Total') || 
                                  p.name.includes('Sisa Curah') ||
                                  nameClean === 'harvest' ||
                                  nameClean.includes('bunchweight') ||
                                  nameClean.includes('bunchweigt') ||
                                  nameClean.includes('rec total packable');
        if (!isSubtotalOrTotal) return false;
      }

      return true;
    });

    const getTopPriority = (name: string): number => {
      const clean = name.trim().toLowerCase();
      if (clean === 'harvest') return 1;
      if (clean.includes('bunchweight') || clean.includes('bunchweigt')) return 2;
      if (clean.includes('rec total packable')) return 3;
      return 999;
    };

    return list.sort((a, b) => getTopPriority(a.name) - getTopPriority(b.name));
  }, [groupProducts, searchQuery, filterMode]);

  // Summary row calculation for Selected Week (Total Packable for all/subtotals, Sub total Domestic for domestic)
  const summaryRow = useMemo(() => {
    if (filterMode === 'domestic') {
      const domesticRow = groupProducts.find(p => {
        const clean = p.name.trim().toLowerCase();
        return clean.includes('sub total domestic') || clean.includes('subtotal domestic');
      });
      if (domesticRow) return { row: domesticRow, label: 'Total Domestic' };
    }

    // Default for 'all' or 'subtotals_only': Total Packable
    const packableRow = groupProducts.find(p => {
      const clean = p.name.trim().toLowerCase();
      return clean.includes('total packable');
    });
    if (packableRow) return { row: packableRow, label: 'Total Packable' };

    // Fallback to Grand Total if not found
    const fallbackRow = groupProducts.find(p => p.name === 'Grand Total') || groupProducts[groupProducts.length - 1];
    return { row: fallbackRow, label: fallbackRow?.name || 'Grand Total' };
  }, [groupProducts, filterMode]);

  const grandTotalStats = useMemo(() => {
    if (!summaryRow || !summaryRow.row) return null;

    const targetRow = summaryRow.row;
    const planStr = targetRow.values['Demand']?.[selectedWeek];
    const actStr = targetRow.values['Aktual']?.[selectedWeek];

    const planVal = parseNum(planStr) || 0;
    const actVal = parseNum(actStr) || 0;
    const diff = actVal - planVal;
    const achPct = planVal > 0 ? (actVal / planVal) * 100 : 0;

    const potW1 = getPotensi(targetRow, selectedWeek + 1);
    const potW2 = getPotensi(targetRow, selectedWeek + 2);
    const potW3 = getPotensi(targetRow, selectedWeek + 3);

    return {
      label: summaryRow.label,
      planVal,
      actVal,
      diff,
      ach: achPct,
      potW1,
      potW2,
      potW3
    };
  }, [summaryRow, selectedWeek]);

  // Calculate Waterfall Bridge box effects for Harvest, Bunchweight, and REC Total Packable for selected week
  const waterfallBoxEffects = useMemo(() => {
    if (!groupProducts || groupProducts.length === 0) return { hEff: null, wEff: null, rEff: null };

    const harvestRow = groupProducts.find(p => p.name.trim().toLowerCase() === 'harvest');
    const bwRow = groupProducts.find(p => {
      const name = p.name.trim().toLowerCase();
      return name.includes('bunchweight') || name.includes('bunchweigt');
    });
    const recRow = groupProducts.find(p => p.name.trim().toLowerCase().includes('rec total packable'));

    if (!harvestRow || !bwRow || !recRow) return { hEff: null, wEff: null, rEff: null };

    const hB = parseNum(harvestRow.values['Demand']?.[selectedWeek]);
    const hA = parseNum(harvestRow.values['Aktual']?.[selectedWeek]);

    const wB = parseNum(bwRow.values['Demand']?.[selectedWeek]);
    const wA = parseNum(bwRow.values['Aktual']?.[selectedWeek]);

    const rB = parseNum(recRow.values['Demand']?.[selectedWeek]);
    const rA = parseNum(recRow.values['Aktual']?.[selectedWeek]);

    if (hB === null || hA === null || wB === null || wA === null || rB === null || rA === null) {
      return { hEff: null, wEff: null, rEff: null };
    }

    // Sequential Substitution Decomposition (Waterfall Bridge logic)
    // 1. Harvest Effect: ((hA - hB) * wB * (rB / 100)) / 13.5
    const hEff = ((hA - hB) * wB * (rB / 100)) / 13.5;

    // 2. Bunchweight Effect: (hA * (wA - wB) * (rB / 100)) / 13.5
    const wEff = (hA * (wA - wB) * (rB / 100)) / 13.5;

    // 3. REC Effect: (hA * wA * ((rA - rB) / 100)) / 13.5
    const rEff = (hA * wA * ((rA - rB) / 100)) / 13.5;

    return { hEff, wEff, rEff };
  }, [groupProducts, selectedWeek]);

  // Helper to determine row style
  const getRowStyle = (name: string) => {
    if (name === 'Grand Total') {
      return theme === 'dark' 
        ? 'bg-emerald-950/80 text-emerald-300 font-bold border-y-2 border-emerald-500/50' 
        : 'bg-emerald-50/90 text-emerald-950 font-bold border-y-2 border-emerald-500/40 shadow-xs';
    }
    if (name.includes('Total Packable')) {
      return theme === 'dark' 
        ? 'bg-blue-950/70 text-blue-300 font-bold border-y border-blue-500/40' 
        : 'bg-blue-50/80 text-blue-950 font-bold border-y border-blue-200';
    }
    if (name.includes('Sub total') || name.includes('Total Non Packable')) {
      return theme === 'dark' 
        ? 'bg-slate-800/90 text-slate-100 font-semibold border-y border-slate-700/60' 
        : 'bg-slate-100/90 text-slate-800 font-semibold border-y border-slate-200';
    }
    if (name.includes('Sisa Curah')) {
      return theme === 'dark' 
        ? 'bg-amber-950/50 text-amber-300 font-semibold border-t border-amber-500/30' 
        : 'bg-amber-50/70 text-amber-900 font-semibold border-t border-amber-200';
    }
    return theme === 'dark' 
      ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-b border-slate-800/60' 
      : 'bg-white hover:bg-slate-50 text-slate-700 border-b border-slate-100';
  };

  // Helper for sticky left td background matching row background
  const getStickyTdBg = (name: string) => {
    if (name === 'Grand Total') {
      return theme === 'dark' ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-950';
    }
    if (name.includes('Total Packable')) {
      return theme === 'dark' ? 'bg-blue-950 text-blue-300' : 'bg-blue-50 text-blue-950';
    }
    if (name.includes('Sub total') || name.includes('Total Non Packable')) {
      return theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800';
    }
    if (name.includes('Sisa Curah')) {
      return theme === 'dark' ? 'bg-amber-950 text-amber-300' : 'bg-amber-50 text-amber-900';
    }
    return theme === 'dark' ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800';
  };

  // Source pill badge colors
  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'Aktual':
        return theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Demand':
        return theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-100 text-blue-800 border-blue-200';
      case 'M-0':
        return theme === 'dark' ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-violet-100 text-violet-800 border-violet-200';
      case 'M-1':
        return theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return theme === 'dark' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  // Export to Excel handler (7 Sheets: GGP, PG1, PG2, PG3, PG4, NSA CG, GGF Total)
  const handleExportExcel = async () => {
    if (!data || !data.dataByGroup || isExporting) return;
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'GGF Evaluasi Plan';
      workbook.created = new Date();

      const exportGroups = ['GGP', 'PG1', 'PG2', 'PG3', 'PG4', 'NSA CG', 'GGF Total'];
      const w1 = selectedWeek + 1;
      const w2 = selectedWeek + 2;
      const w3 = selectedWeek + 3;

      let filterLabel = 'Semua Produk';
      if (filterMode === 'domestic') filterLabel = 'Domestic';
      else if (filterMode === 'subtotals_only') filterLabel = 'Subtotal & Total';

      const domesticProductNames = [
        'sub total export', 'subtotal export', 'c3/13', 'c3/5', 'single', 'highland',
        'mini banana/13', 'mini banana/5', 'family banana', 'big hand', 'small hand',
        'c3a mini', 'banana couple', 'sweety', 'fb1', 'fb2', 'fs1', 'fs2', 'fk',
        'sub total domestic', 'subtotal domestic', 'total packable (export & domestic)', 'total packable'
      ];

      for (const groupName of exportGroups) {
        // 1. Get raw products for group
        let prods: EvaluasiPlanProduct[] = [];
        if (data.dataByGroup[groupName]) {
          prods = data.dataByGroup[groupName].products || [];
        } else {
          const key = Object.keys(data.dataByGroup).find(k => k.toLowerCase() === groupName.toLowerCase());
          prods = key ? data.dataByGroup[key].products || [] : [];
        }

        // 2. Filter products matching current UI state
        const list = prods.filter(p => {
          if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            if (!p.name.toLowerCase().includes(query)) return false;
          }

          if (filterMode === 'domestic') {
            const nameClean = p.name.trim().toLowerCase();
            const isDomestic = domesticProductNames.includes(nameClean) || nameClean.startsWith('total packable');
            if (!isDomestic) return false;
          } else if (filterMode === 'subtotals_only') {
            const nameClean = p.name.trim().toLowerCase();
            const isSubtotalOrTotal = p.name.includes('Sub total') || 
                                      p.name.includes('Total') || 
                                      p.name.includes('Grand Total') || 
                                      p.name.includes('Sisa Curah') ||
                                      nameClean === 'harvest' ||
                                      nameClean.includes('bunchweight') ||
                                      nameClean.includes('bunchweigt') ||
                                      nameClean.includes('rec total packable');
            if (!isSubtotalOrTotal) return false;
          }
          return true;
        });

        const getTopPriority = (name: string): number => {
          const clean = name.trim().toLowerCase();
          if (clean === 'harvest') return 1;
          if (clean.includes('bunchweight') || clean.includes('bunchweigt')) return 2;
          if (clean.includes('rec total packable')) return 3;
          return 999;
        };

        const filteredList = list.sort((a, b) => getTopPriority(a.name) - getTopPriority(b.name));

        // 3. Waterfall Box Effects for group
        const harvestRow = prods.find(p => p.name.trim().toLowerCase() === 'harvest');
        const bwRow = prods.find(p => {
          const name = p.name.trim().toLowerCase();
          return name.includes('bunchweight') || name.includes('bunchweigt');
        });
        const recRow = prods.find(p => p.name.trim().toLowerCase().includes('rec total packable'));

        let groupWaterfall = { hEff: null as number | null, wEff: null as number | null, rEff: null as number | null };
        if (harvestRow && bwRow && recRow) {
          const hB = parseNum(harvestRow.values['Demand']?.[selectedWeek]);
          const hA = parseNum(harvestRow.values['Aktual']?.[selectedWeek]);
          const wB = parseNum(bwRow.values['Demand']?.[selectedWeek]);
          const wA = parseNum(bwRow.values['Aktual']?.[selectedWeek]);
          const rB = parseNum(recRow.values['Demand']?.[selectedWeek]);
          const rA = parseNum(recRow.values['Aktual']?.[selectedWeek]);

          if (hB !== null && hA !== null && wB !== null && wA !== null && rB !== null && rA !== null) {
            groupWaterfall.hEff = ((hA - hB) * wB * (rB / 100)) / 13.5;
            groupWaterfall.wEff = (hA * (wA - wB) * (rB / 100)) / 13.5;
            groupWaterfall.rEff = (hA * wA * ((rA - rB) / 100)) / 13.5;
          }
        }

        // 4. Create Worksheet
        const sheet = workbook.addWorksheet(groupName);
        sheet.views = [{ showGridLines: true }];

        // Title row
        sheet.mergeCells('A1:I1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = `EVALUASI PLAN VS ACTUAL WEEK ${selectedWeek} & POTENSI WEEK ${w1}, ${w2} & ${w3}`;
        titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
        sheet.getRow(1).height = 24;

        // Subtitle row
        sheet.mergeCells('A2:I2');
        const subCell = sheet.getCell('A2');
        subCell.value = `Grup: ${groupName} | Filter: ${filterLabel}${searchQuery ? ` | Cari: "${searchQuery}"` : ''} | Diperbarui: ${data.lastUpdated || '-'}`;
        subCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
        sheet.getRow(2).height = 18;

        // 5. Summary KPI Cards (3 Excel Rows: 4, 5, 6)
        let summaryTargetRow: EvaluasiPlanProduct | undefined;
        let summaryLabel = 'Total Packable';

        if (filterMode === 'domestic') {
          summaryTargetRow = prods.find(p => {
            const clean = p.name.trim().toLowerCase();
            return clean.includes('sub total domestic') || clean.includes('subtotal domestic');
          });
          if (summaryTargetRow) summaryLabel = 'Total Domestic';
        }

        if (!summaryTargetRow) {
          summaryTargetRow = prods.find(p => {
            const clean = p.name.trim().toLowerCase();
            return clean.includes('total packable');
          });
          if (summaryTargetRow) summaryLabel = 'Total Packable';
        }

        if (!summaryTargetRow && prods.length > 0) {
          summaryTargetRow = prods.find(p => p.name === 'Grand Total') || prods[prods.length - 1];
          if (summaryTargetRow) summaryLabel = summaryTargetRow.name || 'Grand Total';
        }

        let grpPlanVal = 0;
        let grpActVal = 0;
        let grpPotW1 = { val: null as number | null, source: 'M-0' };
        let grpPotW2 = { val: null as number | null, source: 'M-0' };
        let grpPotW3 = { val: null as number | null, source: 'M-0' };

        if (summaryTargetRow) {
          grpPlanVal = parseNum(summaryTargetRow.values['Demand']?.[selectedWeek]) || 0;
          grpActVal = parseNum(summaryTargetRow.values['Aktual']?.[selectedWeek]) || 0;
          grpPotW1 = getPotensi(summaryTargetRow, w1);
          grpPotW2 = getPotensi(summaryTargetRow, w2);
          grpPotW3 = getPotensi(summaryTargetRow, w3);
        }

        const grpDiff = grpActVal - grpPlanVal;
        const grpAch = grpPlanVal > 0 ? (grpActVal / grpPlanVal) * 100 : 0;

        sheet.getRow(3).height = 8; // Small spacing row

        const cardSpecs = [
          {
            startCol: 1, endCol: 2, // Col A & B
            title: `Plan (Demand) W${selectedWeek}`,
            valueStr: formatValue(grpPlanVal),
            subLabel: summaryLabel,
            bgColorHex: 'FFEFF6FF', // Light blue tint
            borderColorHex: 'FFBFDBFE',
            titleColorHex: 'FF475569',
            valueColorHex: 'FF2563EB',
            subColorHex: 'FF64748B'
          },
          {
            startCol: 3, endCol: 3, // Col C
            title: `Actual (Aktual) W${selectedWeek}`,
            valueStr: formatValue(grpActVal),
            subLabel: 'Realisasi',
            bgColorHex: 'FFF8FAFC', // Light slate tint
            borderColorHex: 'FFE2E8F0',
            titleColorHex: 'FF475569',
            valueColorHex: 'FF0F172A',
            subColorHex: 'FF64748B'
          },
          {
            startCol: 4, endCol: 4, // Col D
            title: `Selisih (+/-)`,
            valueStr: (grpDiff > 0 ? '+' : '') + formatValue(grpDiff),
            subLabel: 'Actual - Demand',
            bgColorHex: grpDiff >= 0 ? 'FFECFDF5' : 'FFFDF2F2',
            borderColorHex: grpDiff >= 0 ? 'FFA7F3D0' : 'FFFECDD3',
            titleColorHex: 'FF475569',
            valueColorHex: grpDiff >= 0 ? 'FF059669' : 'FFDC2626',
            subColorHex: 'FF64748B'
          },
          {
            startCol: 5, endCol: 6, // Col E & F
            title: `% Achievement`,
            valueStr: `${grpAch.toFixed(1)}%`,
            subLabel: 'Pencapaian Target',
            bgColorHex: grpAch >= 100 ? 'FFECFDF5' : grpAch >= 80 ? 'FFFFFBEB' : 'FFFDF2F2',
            borderColorHex: grpAch >= 100 ? 'FFA7F3D0' : grpAch >= 80 ? 'FFFDE68A' : 'FFFECDD3',
            titleColorHex: 'FF475569',
            valueColorHex: grpAch >= 100 ? 'FF059669' : grpAch >= 80 ? 'FFD97706' : 'FFDC2626',
            subColorHex: 'FF64748B'
          },
          {
            startCol: 7, endCol: 7, // Col G
            title: `Potensi W${w1} [${grpPotW1.source}]`,
            valueStr: grpPotW1.val !== null ? formatValue(grpPotW1.val) : '-',
            subLabel: 'Minggu Depan',
            bgColorHex: 'FFF5F3FF', // Light violet tint
            borderColorHex: 'FFDDD6FE',
            titleColorHex: 'FF6D28D9',
            valueColorHex: 'FF6D28D9',
            subColorHex: 'FF8B5CF6'
          },
          {
            startCol: 8, endCol: 8, // Col H
            title: `Potensi W${w2} [${grpPotW2.source}]`,
            valueStr: grpPotW2.val !== null ? formatValue(grpPotW2.val) : '-',
            subLabel: '2 Mgg Kedepan',
            bgColorHex: 'FFF5F3FF',
            borderColorHex: 'FFDDD6FE',
            titleColorHex: 'FF6D28D9',
            valueColorHex: 'FF6D28D9',
            subColorHex: 'FF8B5CF6'
          },
          {
            startCol: 9, endCol: 9, // Col I
            title: `Potensi W${w3} [${grpPotW3.source}]`,
            valueStr: grpPotW3.val !== null ? formatValue(grpPotW3.val) : '-',
            subLabel: '3 Mgg Kedepan',
            bgColorHex: 'FFF5F3FF',
            borderColorHex: 'FFDDD6FE',
            titleColorHex: 'FF6D28D9',
            valueColorHex: 'FF6D28D9',
            subColorHex: 'FF8B5CF6'
          }
        ];

        sheet.getRow(4).height = 18;
        sheet.getRow(5).height = 24;
        sheet.getRow(6).height = 16;

        cardSpecs.forEach(card => {
          if (card.startCol !== card.endCol) {
            sheet.mergeCells(4, card.startCol, 4, card.endCol);
            sheet.mergeCells(5, card.startCol, 5, card.endCol);
            sheet.mergeCells(6, card.startCol, 6, card.endCol);
          }

          const tCell = sheet.getCell(4, card.startCol);
          tCell.value = card.title;

          const vCell = sheet.getCell(5, card.startCol);
          vCell.value = card.valueStr;

          const sCell = sheet.getCell(6, card.startCol);
          sCell.value = card.subLabel;

          for (let r = 4; r <= 6; r++) {
            for (let c = card.startCol; c <= card.endCol; c++) {
              const cell = sheet.getCell(r, c);
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: card.bgColorHex }
              };

              cell.border = {
                top: r === 4 ? { style: 'thin', color: { argb: card.borderColorHex } } : undefined,
                bottom: r === 6 ? { style: 'thin', color: { argb: card.borderColorHex } } : undefined,
                left: c === card.startCol ? { style: 'thin', color: { argb: card.borderColorHex } } : undefined,
                right: c === card.endCol ? { style: 'thin', color: { argb: card.borderColorHex } } : undefined
              };

              if (r === 4) {
                cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: card.titleColorHex } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
              } else if (r === 5) {
                cell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: card.valueColorHex } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
              } else if (r === 6) {
                cell.font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: card.subColorHex } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
              }
            }
          }
        });

        sheet.getRow(7).height = 12; // Spacing before main table

        // Table Header (Row 8)
        const headers = [
          `PRODUK (${groupName.toUpperCase()})`,
          'UNIT',
          `PLAN (DEMAND) W${selectedWeek}`,
          `ACTUAL W${selectedWeek}`,
          '+- (SELISIH)',
          '%ACH',
          `POTENSI W${w1}`,
          `POTENSI W${w2}`,
          `POTENSI W${w3}`
        ];

        const headerRow = sheet.getRow(8);
        headerRow.height = 26;
        headers.forEach((h, colIdx) => {
          const cell = headerRow.getCell(colIdx + 1);
          cell.value = h;
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colIdx === 0 ? 'left' : (colIdx === 1 || colIdx === 5 ? 'center' : 'right'),
            wrapText: true
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF334155' } },
            bottom: { style: 'medium', color: { argb: 'FF334155' } },
            left: { style: 'thin', color: { argb: 'FF334155' } },
            right: { style: 'thin', color: { argb: 'FF334155' } }
          };
        });

        // Data Rows (Starting at Row 9)
        filteredList.forEach((prod, pIdx) => {
          const rowNum = 9 + pIdx;
          const row = sheet.getRow(rowNum);
          row.height = 22;

          const {
            unitLabel,
            planVal,
            actVal,
            diff,
            ach,
            pot1,
            pot2,
            pot3
          } = getConvertedProductValues(prod, unitMode, selectedWeek, w1, w2, w3);

          const nameClean = prod.name.trim().toLowerCase();
          const isHarvestRow = nameClean === 'harvest';
          const isBwRow = nameClean.includes('bunchweight') || nameClean.includes('bunchweigt');
          const isRecRow = nameClean.includes('rec total packable');

          let boxImpactEffect: number | null = null;
          if (isHarvestRow) boxImpactEffect = groupWaterfall.hEff;
          else if (isBwRow) boxImpactEffect = groupWaterfall.wEff;
          else if (isRecRow) boxImpactEffect = groupWaterfall.rEff;

          let bgColorHex = 'FFFFFFFF';
          let textColorHex = 'FF1E293B';
          let isBold = false;
          let borderTopStyle: ExcelJS.BorderStyle = 'thin';
          let borderBottomStyle: ExcelJS.BorderStyle = 'thin';
          let borderColorHex = 'FFE2E8F0';

          if (prod.name === 'Grand Total') {
            bgColorHex = 'FFD1FAE5'; // Light Emerald
            textColorHex = 'FF065F46'; // Dark Emerald
            isBold = true;
            borderTopStyle = 'medium';
            borderBottomStyle = 'double';
            borderColorHex = 'FF10B981';
          } else if (prod.name.includes('Total Packable')) {
            bgColorHex = 'FFDBEAFE'; // Light Blue
            textColorHex = 'FF1E40AF'; // Dark Blue
            isBold = true;
            borderColorHex = 'FF93C5FD';
          } else if (prod.name.includes('Sub total') || prod.name.includes('Total Non Packable')) {
            bgColorHex = 'FFF1F5F9'; // Light Slate
            textColorHex = 'FF0F172A';
            isBold = true;
            borderColorHex = 'FFCBD5E1';
          } else if (prod.name.includes('Sisa Curah')) {
            bgColorHex = 'FFFEF3C7'; // Light Amber
            textColorHex = 'FF92400E';
            isBold = true;
            borderColorHex = 'FFFCD34D';
          }

          const c1 = row.getCell(1); c1.value = prod.name;
          const c2 = row.getCell(2); c2.value = unitLabel;
          const c3 = row.getCell(3); c3.value = planVal !== null ? planVal : '-';
          const c4 = row.getCell(4); c4.value = actVal !== null ? actVal : '-';

          const c5 = row.getCell(5);
          if (diff !== null) {
            let diffText = diff > 0 ? `+${formatValue(diff, unitLabel)}` : formatValue(diff, unitLabel);
            if (boxImpactEffect !== null) {
              const boxText = `${boxImpactEffect > 0 ? '+' : ''}${Math.round(boxImpactEffect).toLocaleString('id-ID')} Box`;
              diffText += ` (${boxText})`;
            }
            c5.value = diffText;
          } else {
            c5.value = '-';
          }

          const c6 = row.getCell(6);
          c6.value = ach !== null ? `${ach.toFixed(1)}%` : '-';

          const c7 = row.getCell(7);
          c7.value = pot1.val !== null ? `${formatValue(pot1.val, unitLabel)} (${pot1.source})` : '-';

          const c8 = row.getCell(8);
          c8.value = pot2.val !== null ? `${formatValue(pot2.val, unitLabel)} (${pot2.source})` : '-';

          const c9 = row.getCell(9);
          c9.value = pot3.val !== null ? `${formatValue(pot3.val, unitLabel)} (${pot3.source})` : '-';

          for (let col = 1; col <= 9; col++) {
            const cell = row.getCell(col);
            cell.font = {
              name: 'Calibri',
              size: 10,
              bold: isBold,
              color: { argb: textColorHex }
            };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColorHex }
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: col === 1 ? 'left' : (col === 2 || col === 6 ? 'center' : 'right')
            };
            cell.border = {
              top: { style: borderTopStyle, color: { argb: borderColorHex } },
              bottom: { style: borderBottomStyle, color: { argb: borderColorHex } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          }

          if (diff !== null) {
            c5.font = {
              name: 'Calibri',
              size: 10,
              bold: true,
              color: { argb: diff >= 0 ? 'FF059669' : 'FFDC2626' }
            };
          }
        });

        // Set Columns Width
        sheet.columns = [
          { width: 38 }, // Produk
          { width: 12 }, // Unit
          { width: 20 }, // Plan
          { width: 20 }, // Actual
          { width: 24 }, // Selisih
          { width: 12 }, // %Ach
          { width: 22 }, // Potensi W1
          { width: 22 }, // Potensi W2
          { width: 22 }  // Potensi W3
        ];
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Evaluasi Plan vs Actual Week ${selectedWeek} & Potensi Week ${w1}, ${w2} & ${w3}.xlsx`;
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Excel error:", err);
      alert("Gagal melakukan export Excel. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section 
      id="evaluasi-plan-section"
      ref={containerRef}
      className={`transition-all duration-300 ${
        isFullscreen 
          ? `fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`
          : `rounded-2xl border ${
              isCollapsed ? 'py-2 px-4 sm:px-6' : 'p-4 sm:p-6'
            } ${
              theme === 'dark' 
                ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`
      }`}
    >
      <div className="space-y-4">
        {/* Panel Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          !isCollapsed || isFullscreen ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200') : ''
        }`}>
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className={`p-2 rounded-xl border transition-colors shrink-0 ${
              theme === 'dark'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className={`font-bold text-sm sm:text-base transition-colors ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
              }`}>
                Evaluasi Plan vs Actual & Potensi 3 Minggu Kedepan
              </h3>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 shadow-xs'
              }`}
              title="Perbarui data dari Google Sheets"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{refreshing ? 'Memperbarui...' : 'Perbarui Data'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting || loading || !data}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-xs'
              }`}
              title="Export 7 Sheet (GGP, PG1, PG2, PG3, PG4, NSA CG, GGF Total) ke Excel"
            >
              <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce text-emerald-500' : 'text-emerald-500'}`} />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-violet-900/30 border-violet-800/50 text-violet-300 hover:bg-violet-800/40'
                  : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
              }`}
              title={isFullscreen ? "Keluar Layar Penuh" : "Buka Layar Penuh"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{isFullscreen ? 'Tutup Penuh' : 'Buka Penuh'}</span>
            </button>

            {!isFullscreen && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                }`}
                title={isCollapsed ? "Tampilkan Panel" : "Sembunyikan Panel"}
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4 text-emerald-500" /> : <ChevronUp className="h-4 w-4 text-rose-500" />}
              </button>
            )}
          </div>
        </div>

        {/* Panel Content */}
        {(!isCollapsed || isFullscreen) && (
          <div className="space-y-4">
            {/* Filter & Selector Controls */}
            <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              {/* Group Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Layers className="h-3.5 w-3.5 text-emerald-500" />
                  Grup:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {Array.from(new Set((data?.groups || ['NSA CG', 'GGP', 'PG1', 'PG2', 'PG3', 'PG4', 'GGF Total']).map(g => g.toUpperCase() === 'GGF TOTAL' ? 'GGF Total' : g))).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                        selectedGroup === g
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : theme === 'dark'
                            ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Week Selector & View Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Week:</span>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500 shadow-2xs'
                    }`}
                  >
                    {(data?.weeks || Array.from({ length: 53 }, (_, i) => ({ weekNum: i + 1, monthLabel: '' }))).map((w) => (
                      <option key={w.weekNum} value={w.weekNum}>
                        Week {w.weekNum} {w.monthLabel ? `(${w.monthLabel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit Selector */}
                <div className={`flex items-center gap-1.5 border-l pl-2.5 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}>
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Sat:</span>
                  <select
                    value={unitMode}
                    onChange={(e) => setUnitMode(e.target.value as '13.5' | 'native')}
                    className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500 shadow-2xs'
                    }`}
                  >
                    <option value="13.5">13.5 Kg</option>
                    <option value="native">Asli</option>
                  </select>
                </div>

                {/* Font Size Selector */}
                <div className={`flex items-center gap-1.5 border-l pl-2.5 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}>
                  <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Uk:</span>
                  <select
                    value={tableFontSize}
                    onChange={(e) => setTableFontSize(Number(e.target.value))}
                    className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500 shadow-2xs'
                    }`}
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 10).map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} px
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Mode */}
                <div className={`flex items-center gap-1 border-l pl-2.5 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}>
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      filterMode === 'all'
                        ? theme === 'dark' ? 'bg-slate-200 text-slate-900 font-bold' : 'bg-slate-700 text-white font-bold'
                        : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Semua Produk
                  </button>
                  <button
                    onClick={() => setFilterMode('domestic')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      filterMode === 'domestic'
                        ? theme === 'dark' ? 'bg-slate-200 text-slate-900 font-bold' : 'bg-slate-700 text-white font-bold'
                        : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Domestic
                  </button>
                  <button
                    onClick={() => setFilterMode('subtotals_only')}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      filterMode === 'subtotals_only'
                        ? theme === 'dark' ? 'bg-slate-200 text-slate-900 font-bold' : 'bg-slate-700 text-white font-bold'
                        : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Subtotal & Total
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-8 pr-2.5 py-1 text-xs rounded-lg border transition-colors w-32 sm:w-40 ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-2xs'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Memuat data Evaluasi Plan & Actual...</p>
              </div>
            ) : (
              <>
                {/* KPI Summary Cards for Selected Week */}
                {grandTotalStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                    {/* Plan (Demand) */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}>
                      <span className={`text-[11px] font-semibold block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Plan (Demand) W{selectedWeek}
                      </span>
                      <span className={`text-base font-extrabold mt-0.5 block ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {formatValue(grandTotalStats.planVal)}
                      </span>
                      <span className="text-[10px] text-slate-400">{grandTotalStats.label}</span>
                    </div>

                    {/* Actual (Aktual) */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}>
                      <span className={`text-[11px] font-semibold block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Actual (Aktual) W{selectedWeek}
                      </span>
                      <span className={`text-base font-extrabold mt-0.5 block ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                        {formatValue(grandTotalStats.actVal)}
                      </span>
                      <span className="text-[10px] text-slate-400">Realisasi</span>
                    </div>

                    {/* Variance (+/-) */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      grandTotalStats.diff >= 0
                        ? theme === 'dark' ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-emerald-50/70 border-emerald-200'
                        : theme === 'dark' ? 'bg-rose-950/30 border-rose-800/50' : 'bg-rose-50/70 border-rose-200'
                    }`}>
                      <span className={`text-[11px] font-semibold block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Selisih (+/-)
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {grandTotalStats.diff >= 0 ? (
                          <TrendingUp className={`h-4 w-4 shrink-0 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        ) : (
                          <TrendingDown className={`h-4 w-4 shrink-0 ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`} />
                        )}
                        <span className={`text-base font-extrabold ${
                          grandTotalStats.diff >= 0 
                            ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600' 
                            : theme === 'dark' ? 'text-rose-400' : 'text-rose-600'
                        }`}>
                          {grandTotalStats.diff > 0 ? '+' : ''}{formatValue(grandTotalStats.diff)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Actual - Demand</span>
                    </div>

                    {/* % Achievement */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      grandTotalStats.ach >= 100
                        ? theme === 'dark' ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-emerald-50/70 border-emerald-200'
                        : grandTotalStats.ach >= 80
                          ? theme === 'dark' ? 'bg-amber-950/30 border-amber-800/50' : 'bg-amber-50/70 border-amber-200'
                          : theme === 'dark' ? 'bg-rose-950/30 border-rose-800/50' : 'bg-rose-50/70 border-rose-200'
                    }`}>
                      <span className={`text-[11px] font-semibold block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        % Achievement
                      </span>
                      <span className={`text-base font-extrabold mt-0.5 block ${
                        grandTotalStats.ach >= 100
                          ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                          : grandTotalStats.ach >= 80
                            ? theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                            : theme === 'dark' ? 'text-rose-400' : 'text-rose-600'
                      }`}>
                        {grandTotalStats.ach.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400">Pencapaian Target</span>
                    </div>

                    {/* Potensi W+1 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      theme === 'dark' ? 'bg-violet-950/20 border-violet-800/40' : 'bg-violet-50/60 border-violet-200/80 shadow-2xs'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Potensi W{selectedWeek + 1}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getSourceBadgeClass(grandTotalStats.potW1.source)}`}>
                          {grandTotalStats.potW1.source}
                        </span>
                      </div>
                      <span className={`text-base font-extrabold mt-0.5 block ${theme === 'dark' ? 'text-violet-300' : 'text-violet-700'}`}>
                        {formatValue(grandTotalStats.potW1.val)}
                      </span>
                      <span className="text-[10px] text-slate-400">Minggu Depan</span>
                    </div>

                    {/* Potensi W+2 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      theme === 'dark' ? 'bg-violet-950/20 border-violet-800/40' : 'bg-violet-50/60 border-violet-200/80 shadow-2xs'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Potensi W{selectedWeek + 2}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getSourceBadgeClass(grandTotalStats.potW2.source)}`}>
                          {grandTotalStats.potW2.source}
                        </span>
                      </div>
                      <span className={`text-base font-extrabold mt-0.5 block ${theme === 'dark' ? 'text-violet-300' : 'text-violet-700'}`}>
                        {formatValue(grandTotalStats.potW2.val)}
                      </span>
                      <span className="text-[10px] text-slate-400">2 Mgg Kedepan</span>
                    </div>

                    {/* Potensi W+3 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      theme === 'dark' ? 'bg-violet-950/20 border-violet-800/40' : 'bg-violet-50/60 border-violet-200/80 shadow-2xs'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Potensi W{selectedWeek + 3}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getSourceBadgeClass(grandTotalStats.potW3.source)}`}>
                          {grandTotalStats.potW3.source}
                        </span>
                      </div>
                      <span className={`text-base font-extrabold mt-0.5 block ${theme === 'dark' ? 'text-violet-300' : 'text-violet-700'}`}>
                        {formatValue(grandTotalStats.potW3.val)}
                      </span>
                      <span className="text-[10px] text-slate-400">3 Mgg Kedepan</span>
                    </div>
                  </div>
                )}

                {/* Main Evaluation Table */}
                <div className={`rounded-xl border overflow-hidden shadow-sm ${
                  theme === 'dark' 
                    ? 'bg-slate-900/90 border-slate-800 text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="overflow-x-auto max-h-[630px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      {/* Table Header */}
                      <thead className={`sticky top-0 z-20 text-[11px] uppercase tracking-wider border-b font-bold ${
                        theme === 'dark' 
                          ? 'bg-slate-900 text-slate-200 border-slate-800' 
                          : 'bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                      }`}>
                        <tr>
                          <th className={`py-2 px-3.5 font-bold min-w-[200px] sticky left-0 z-30 border-r ${
                            theme === 'dark' ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            Produk ({selectedGroup})
                          </th>
                          <th className="py-2 px-2.5 font-bold text-center w-16">Unit</th>
                          <th className={`py-2 px-3 font-bold text-right ${
                            theme === 'dark' ? 'text-blue-400 bg-blue-950/40' : 'text-blue-600 bg-blue-50/50'
                          }`}>
                            Plan (Demand) W{selectedWeek}
                          </th>
                          <th className={`py-2 px-3 font-bold text-right ${
                            theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                          }`}>
                            Actual W{selectedWeek}
                          </th>
                          <th className="py-2 px-3 font-bold text-right">
                            +- (Selisih)
                          </th>
                          <th className="py-2 px-3 font-bold text-center w-20">
                            %Ach
                          </th>
                          <th className={`py-2 px-3 font-bold text-right border-l ${
                            theme === 'dark' ? 'text-violet-300 bg-violet-950/30 border-slate-800' : 'text-violet-700 bg-violet-50/40 border-slate-200'
                          }`}>
                            Potensi W{selectedWeek + 1}
                          </th>
                          <th className={`py-2 px-3 font-bold text-right ${
                            theme === 'dark' ? 'text-violet-300 bg-violet-950/30' : 'text-violet-700 bg-violet-50/40'
                          }`}>
                            Potensi W{selectedWeek + 2}
                          </th>
                          <th className={`py-2 px-3 font-bold text-right ${
                            theme === 'dark' ? 'text-violet-300 bg-violet-950/30' : 'text-violet-700 bg-violet-50/40'
                          }`}>
                            Potensi W{selectedWeek + 3}
                          </th>
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody className={`divide-y font-mono ${theme === 'dark' ? 'divide-slate-800/80 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400 font-sans italic">
                              Tidak ada data produk ditemukan untuk kriteria ini.
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((prod, idx) => {
                            const {
                              unitLabel,
                              planVal,
                              actVal,
                              diff,
                              ach,
                              pot1,
                              pot2,
                              pot3
                            } = getConvertedProductValues(
                              prod,
                              unitMode,
                              selectedWeek,
                              selectedWeek + 1,
                              selectedWeek + 2,
                              selectedWeek + 3
                            );

                            const isHighlightRow = prod.name.includes('Sub total') || 
                                                 prod.name.includes('Total') || 
                                                 prod.name.includes('Grand Total') || 
                                                 prod.name.includes('Sisa Curah');

                            const nameClean = prod.name.trim().toLowerCase();
                            const isHarvestRow = nameClean === 'harvest';
                            const isBwRow = nameClean.includes('bunchweight') || nameClean.includes('bunchweigt');
                            const isRecRow = nameClean.includes('rec total packable');

                            let boxImpactEffect: number | null = null;
                            if (isHarvestRow) boxImpactEffect = waterfallBoxEffects.hEff;
                            else if (isBwRow) boxImpactEffect = waterfallBoxEffects.wEff;
                            else if (isRecRow) boxImpactEffect = waterfallBoxEffects.rEff;

                            return (
                              <tr key={idx} className={`transition-colors ${getRowStyle(prod.name)}`}>
                                {/* Product Name - Sticky Column */}
                                <td className={`py-1.5 px-3.5 font-sans sticky left-0 z-10 border-r ${getStickyTdBg(prod.name)} ${
                                  theme === 'dark' ? 'border-slate-800' : 'border-slate-200/80'
                                } ${isHighlightRow ? 'font-bold' : 'font-medium'}`}>
                                  {prod.name}
                                </td>

                                {/* Unit */}
                                <td className="py-1.5 px-2.5 text-center font-sans text-[11px] opacity-75">
                                  {unitLabel}
                                </td>

                                {/* Plan (Demand) */}
                                <td style={{ fontSize: `${tableFontSize}px` }} className={`py-1.5 px-3 text-right font-semibold ${
                                  theme === 'dark' ? 'text-blue-400 bg-blue-950/20' : 'text-blue-600 bg-blue-50/20'
                                }`}>
                                  {formatValue(planVal, unitLabel)}
                                </td>

                                {/* Actual */}
                                <td style={{ fontSize: `${tableFontSize}px` }} className={`py-1.5 px-3 text-right font-semibold ${
                                  theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                                }`}>
                                  {formatValue(actVal, unitLabel)}
                                </td>

                                {/* Diff (+/-) */}
                                <td style={{ fontSize: `${tableFontSize}px` }} className={`py-1.5 px-3 text-right font-bold ${
                                  diff === null 
                                    ? 'text-slate-400' 
                                    : diff > 0 
                                      ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                                      : diff < 0 
                                        ? theme === 'dark' ? 'text-rose-400' : 'text-rose-600'
                                        : 'text-slate-500'
                                }`}>
                                  <div>
                                    {diff !== null ? (diff > 0 ? `+${formatValue(diff, unitLabel)}` : formatValue(diff, unitLabel)) : '-'}
                                  </div>
                                  {boxImpactEffect !== null && (
                                    <div className={`text-[10px] font-semibold font-mono mt-0.5 whitespace-nowrap ${
                                      boxImpactEffect > 0
                                        ? theme === 'dark' ? 'text-emerald-400/90' : 'text-emerald-700'
                                        : boxImpactEffect < 0
                                          ? theme === 'dark' ? 'text-rose-400/90' : 'text-rose-700'
                                          : 'text-slate-400'
                                    }`}>
                                      ({boxImpactEffect > 0 ? '+' : ''}{Math.round(boxImpactEffect).toLocaleString('id-ID')} Box)
                                    </div>
                                  )}
                                </td>

                                {/* %Ach */}
                                <td style={{ fontSize: `${tableFontSize}px` }} className="py-1.5 px-3 text-center">
                                  {ach !== null ? (
                                    <span style={{ fontSize: `${Math.max(9, tableFontSize - 2)}px` }} className={`inline-block px-1.5 py-0.2 rounded font-bold font-sans ${
                                      ach >= 100 
                                        ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                                        : ach >= 80 
                                          ? theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                                          : theme === 'dark' ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {ach.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs font-sans">-</span>
                                  )}
                                </td>

                                {/* Potensi W+1 */}
                                <td style={{ fontSize: `${tableFontSize}px` }} className={`py-1.5 px-3 text-right font-semibold border-l ${
                                  theme === 'dark' ? 'bg-violet-950/20 border-slate-800' : 'bg-violet-50/20 border-slate-200'
                                }`}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className={theme === 'dark' ? 'text-violet-300' : 'text-violet-700'}>
                                      {formatValue(pot1.val, unitLabel)}
                                    </span>
                                    {pot1.source !== '-' && (
                                      <span style={{ fontSize: '6px' }} className={`font-sans px-1 py-0.2 rounded border ${getSourceBadgeClass(pot1.source)}`}>
                                        {pot1.source}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Potensi W+2 */}
                                <td style={{ fontSize: `${tableFontSize}px` }} className={`py-1.5 px-3 text-right font-semibold ${
                                  theme === 'dark' ? 'bg-violet-950/20' : 'bg-violet-50/20'
                                }`}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className={theme === 'dark' ? 'text-violet-300' : 'text-violet-700'}>
                                      {formatValue(pot2.val, unitLabel)}
                                    </span>
                                    {pot2.source !== '-' && (
                                      <span style={{ fontSize: '6px' }} className={`font-sans px-1 py-0.2 rounded border ${getSourceBadgeClass(pot2.source)}`}>
                                        {pot2.source}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Potensi W+3 */}
                                <td style={{ fontSize: `${tableFontSize}px` }} className={`py-1.5 px-3 text-right font-semibold ${
                                  theme === 'dark' ? 'bg-violet-950/20' : 'bg-violet-50/20'
                                }`}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className={theme === 'dark' ? 'text-violet-300' : 'text-violet-700'}>
                                      {formatValue(pot3.val, unitLabel)}
                                    </span>
                                    {pot3.source !== '-' && (
                                      <span style={{ fontSize: '6px' }} className={`font-sans px-1 py-0.2 rounded border ${getSourceBadgeClass(pot3.source)}`}>
                                        {pot3.source}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
