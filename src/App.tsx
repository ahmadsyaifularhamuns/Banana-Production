import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  BarChart2, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  Info, 
  FileSpreadsheet, 
  ArrowDown, 
  ArrowUp, 
  Activity, 
  MapPin, 
  Cpu, 
  Layers, 
  ClipboardList,
  Sun,
  Moon,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  LogOut,
  Search,
  Table,
  ChevronLeft,
  Sliders,
  Sparkles,
  Brain,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  PieChart as PieIcon,
  Code,
  Folder,
  Play,
  Save,
  Check,
  Terminal,
  Settings,
  Layout,
  Maximize2,
  Minimize2,
  Bell,
  X,
  Presentation,
  Target,
  UserX,
  Wrench,
  ShieldAlert,
  Power,
  Users
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Area, 
  AreaChart,
  LabelList,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import logoUrl from './assets/images/ppic_banana_logo_1782469965983.jpg';
import { DashboardData, ComparisonItem, ProgressItem, DefectItem, ViewMode, CalibrationDistributionItem } from './types';
import { BunchweightTrendsPanel } from './components/BunchweightTrendsPanel';
import { HarvestParametersTablePanel } from './components/HarvestParametersTablePanel';
import { CalibrationDistributionPanel } from './components/CalibrationDistributionPanel';
import { ProgressAndDiagnosticsPanel } from './components/ProgressAndDiagnosticsPanel';
import { EvaluasiPlanPanel } from './components/EvaluasiPlanPanel';

const defaultDashboardData: DashboardData = {
  generatedAt: '',
  months: [],
  comparisonData: [],
  progressParameters: [],
  defects: [],
  curahDefects: [],
  lossesBanana: [],
  calibrationDistribution: [],
  source: 'Local Cache',
  lastUpdateDate: ''
};

// Custom label renderer for displaying vertical labels inside bars
const RenderVerticalLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value === null || value === undefined || height < 30) return null;
  
  const num = Number(value);
  if (isNaN(num)) return null;

  let labelText = num.toLocaleString('id-ID');
  if (num >= 1000000) {
    labelText = (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    labelText = (num / 1000).toFixed(0) + 'rb';
  }

  return (
    <g transform={`translate(${x + width / 2}, ${y + height / 2})`}>
      <text
        fill="#ffffff"
        fontSize={9}
        fontWeight="bold"
        textAnchor="middle"
        transform="rotate(-90)"
        style={{ dominantBaseline: 'central' }}
      >
        {labelText}
      </text>
    </g>
  );
};

export const LOSSES_CAUSES = [
  // Virus
  { key: 'Banana Streak Virus', short: 'BSV', color: '#f43f5e', category: 'Virus' },
  { key: 'Cucumber Mosaic Virus', short: 'CMV', color: '#e11d48', category: 'Virus' },
  { key: 'Bunchy Top', short: 'BT', color: '#fda4af', category: 'Virus' },
  { key: 'Mutan', short: 'Mutan', color: '#fb7185', category: 'Virus' },
  // Diseases
  { key: 'Panama Disease (Fusarium)', short: 'PD', color: '#ea580c', category: 'Diseases' },
  { key: 'Moko', short: 'Moko', color: '#78350f', category: 'Diseases' },
  { key: 'Heart Root', short: 'HR', color: '#fbbf24', category: 'Diseases' },
  { key: 'Tip Over', short: 'TO', color: '#f59e0b', category: 'Diseases' },
  { key: 'Blow Down', short: 'BD', color: '#b45309', category: 'Diseases' },
  // Choping
  { key: 'Broken Neck', short: 'BNECK', color: '#0284c7', category: 'Choping' },
  { key: 'Over Age', short: 'OVAG', color: '#38bdf8', category: 'Choping' },
  { key: 'Non Function Leaves', short: 'NFL', color: '#0d9488', category: 'Choping' },
  { key: 'Bromaxile', short: 'BRMXL', color: '#14b8a6', category: 'Choping' },
  { key: 'Late Growth', short: 'LG', color: '#4f46e5', category: 'Choping' },
  { key: 'Akibat Kekeringan', short: 'DO', color: '#6366f1', category: 'Choping' },
];

// Custom label renderer for displaying percentage above the line
const RenderPercentageAboveLine = (props: any) => {
  const { x, y, value, theme } = props;
  if (value === null || value === undefined) return null;
  
  const num = Number(value);
  if (isNaN(num)) return null;

  // In dark mode, emerald-400 and rose-400. In light mode, darker emerald-600 and rose-600 for better contrast.
  const color = theme === 'dark' 
    ? (num >= 100 ? '#34d399' : '#f87171') 
    : (num >= 100 ? '#059669' : '#dc2626');
    
  const bgFill = theme === 'dark' ? '#020617' : '#ffffff';
  const borderStroke = theme === 'dark' ? '#334155' : '#cbd5e1';
  
  return (
    <g transform={`translate(${x}, ${y - 12})`}>
      <rect
        x={-28}
        y={-9}
        width={56}
        height={16}
        rx={4}
        fill={bgFill}
        stroke={borderStroke}
        strokeWidth={1}
      />
      <text
        fontSize={9}
        fontWeight="bold"
        textAnchor="middle"
        fill={color}
        y={3}
      >
        {num.toFixed(1)}%
      </text>
    </g>
  );
};

// Custom label renderer for Bunchweight line chart points
const RenderBunchweightLabel = (props: any) => {
  const { x, y, value, stroke, theme } = props;
  if (value === null || value === undefined) return null;
  
  const num = Number(value);
  if (isNaN(num)) return null;

  const bgFill = theme === 'dark' ? '#020617' : '#ffffff';
  const borderStroke = theme === 'dark' ? '#334155' : '#cbd5e1';
  
  return (
    <g transform={`translate(${x}, ${y - 10})`}>
      <rect
        x={-16}
        y={-8}
        width={32}
        height={14}
        rx={3}
        fill={bgFill}
        stroke={borderStroke}
        strokeWidth={1}
        opacity={0.85}
      />
      <text
        fontSize={8}
        fontWeight="extrabold"
        textAnchor="middle"
        fill={stroke || (theme === 'dark' ? '#cbd5e1' : '#1e293b')}
        y={2.5}
      >
        {num.toFixed(1)}
      </text>
    </g>
  );
};

// Custom label renderer for REC Total Packable line chart points
const RenderRecPackableLabel = (props: any) => {
  const { x, y, value, stroke, theme } = props;
  if (value === null || value === undefined) return null;
  
  const num = Number(value);
  if (isNaN(num)) return null;

  const bgFill = theme === 'dark' ? '#020617' : '#ffffff';
  const borderStroke = theme === 'dark' ? '#334155' : '#cbd5e1';
  
  return (
    <g transform={`translate(${x}, ${y - 10})`}>
      <rect
        x={-20}
        y={-8}
        width={40}
        height={14}
        rx={3}
        fill={bgFill}
        stroke={borderStroke}
        strokeWidth={1}
        opacity={0.85}
      />
      <text
        fontSize={8}
        fontWeight="extrabold"
        textAnchor="middle"
        fill={stroke || (theme === 'dark' ? '#cbd5e1' : '#1e293b')}
        y={2.5}
      >
        {num.toFixed(1)}%
      </text>
    </g>
  );
};

const parseInlineStyles = (lineStr: string, theme: 'dark' | 'light') => {
  const parts = lineStr.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className={`font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const renderFormattedAnswer = (text: string, theme: 'dark' | 'light') => {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    // Handle headers
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className={`text-sm font-bold mt-4 mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>
          {line.replace('### ', '')}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className={`text-base font-bold mt-5 mb-2 pb-1 border-b ${theme === 'dark' ? 'text-blue-400 border-slate-800' : 'text-blue-800 border-slate-200'}`}>
          {line.replace('## ', '')}
        </h3>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h2 key={idx} className={`text-lg font-extrabold mt-6 mb-3 ${theme === 'dark' ? 'text-blue-500' : 'text-blue-950'}`}>
          {line.replace('# ', '')}
        </h2>
      );
    }
    
    // Handle list items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const content = line.trim().substring(2);
      return (
        <li key={idx} className={`ml-5 list-disc text-xs my-1.5 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
          {parseInlineStyles(content, theme)}
        </li>
      );
    }
    
    // Handle numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <li key={idx} className={`ml-5 list-decimal text-xs my-1.5 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
          {parseInlineStyles(numMatch[2], theme)}
        </li>
      );
    }

    if (!line.trim()) return <div key={idx} className="h-2" />;

    return (
      <p key={idx} className={`text-xs my-1.5 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
        {parseInlineStyles(line, theme)}
      </p>
    );
  });
};

export default function App() {
  // --- Login State ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('preview') === 'true' || window.location.hash === '#preview') {
          return false;
        }
      }
    } catch (e) {
      console.warn("Gagal membaca search params / hash:", e);
    }
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === 'Banana' && passwordInput === 'Banana2026##') {
      if (isUnderMaintenance) {
        setLoginError('Sedang dalam perbaikan. Kami sedang meningkatkan sistem demi memberikan pengalaman yang lebih baik untuk Anda');
        return;
      }
      setIsLoggedIn(true);
      setIsAdmin(false);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('isAdmin', 'false');
      setLoginError(null);
    } else if (usernameInput === 'Mimin' && passwordInput === 'Bananauntung') {
      setIsLoggedIn(true);
      setIsAdmin(true);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('isAdmin', 'true');
      setLoginError(null);
    } else {
      setLoginError('Username atau Password salah! Silakan hubungi Bp. Ketut Sudarya (PPIC BANANA) untuk mendapatkan akses.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdmin');
    setUsernameInput('');
    setPasswordInput('');
    setActiveTab('dashboard');
  };

  // --- System Maintenance & Force Logout State ---
  const [isUnderMaintenance, setIsUnderMaintenance] = useState<boolean>(() => {
    return localStorage.getItem('isUnderMaintenance') === 'true';
  });
  const [lastForceLogoutTimestamp, setLastForceLogoutTimestamp] = useState<number>(() => {
    return parseInt(localStorage.getItem('lastForceLogoutTimestamp') || '0', 10);
  });
  const [showAdminMenu, setShowAdminMenu] = useState<boolean>(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  // Poll system status and listen for storage/broadcast changes
  const fetchSystemStatus = async () => {
    try {
      const res = await fetch('/api/system-status');
      if (res.ok) {
        const data = await res.json();
        
        // 1. Sync Maintenance Mode
        if (typeof data.isUnderMaintenance === 'boolean') {
          setIsUnderMaintenance(data.isUnderMaintenance);
          localStorage.setItem('isUnderMaintenance', String(data.isUnderMaintenance));
        }

        // 2. Sync Force Logout
        if (data.forceLogoutTimestamp && data.forceLogoutTimestamp > lastForceLogoutTimestamp) {
          setLastForceLogoutTimestamp(data.forceLogoutTimestamp);
          localStorage.setItem('lastForceLogoutTimestamp', String(data.forceLogoutTimestamp));
          
          // If logged in as non-admin user (e.g. Banana), trigger immediate logout
          const currentIsAdmin = localStorage.getItem('isAdmin') === 'true';
          const currentIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
          if (currentIsLoggedIn && !currentIsAdmin) {
            setIsLoggedIn(false);
            setIsAdmin(false);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('isAdmin');
            setLoginError('Sesi anda telah habis, mohon login kembali');
          }
        }
      }
    } catch (err) {
      console.warn("Gagal mengecek status sistem:", err);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 3000);
    return () => clearInterval(interval);
  }, [lastForceLogoutTimestamp]);

  // Listen to local storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isUnderMaintenance') {
        setIsUnderMaintenance(e.newValue === 'true');
      }
      if (e.key === 'lastForceLogoutTimestamp') {
        const ts = parseInt(e.newValue || '0', 10);
        if (ts > lastForceLogoutTimestamp) {
          setLastForceLogoutTimestamp(ts);
          const currentIsAdmin = localStorage.getItem('isAdmin') === 'true';
          const currentIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
          if (currentIsLoggedIn && !currentIsAdmin) {
            setIsLoggedIn(false);
            setIsAdmin(false);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('isAdmin');
            setLoginError('Sesi anda telah habis, mohon login kembali');
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [lastForceLogoutTimestamp]);

  // Close admin dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setShowAdminMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Admin Force Logout
  const handleAdminForceLogout = async () => {
    try {
      const res = await fetch('/api/admin/system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceLogout: true })
      });
      const data = await res.json();
      const ts = data.config?.forceLogoutTimestamp || Date.now();
      setLastForceLogoutTimestamp(ts);
      localStorage.setItem('lastForceLogoutTimestamp', String(ts));
      
      setAdminNotice('Berhasil! Seluruh login user selain Mimin (Admin) telah ter-logout.');
      setTimeout(() => setAdminNotice(null), 5000);
    } catch (e) {
      console.error("Gagal melakukan force logout user:", e);
    }
  };

  // Handle Toggle Maintenance Mode
  const handleToggleMaintenanceMode = async (newVal: boolean) => {
    try {
      const res = await fetch('/api/admin/system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUnderMaintenance: newVal })
      });
      const data = await res.json();
      setIsUnderMaintenance(newVal);
      localStorage.setItem('isUnderMaintenance', String(newVal));

      if (newVal) {
        setAdminNotice('Modus Maintenance diaktifkan. Seluruh user selain Mimin (Admin) tidak dapat mengakses halaman.');
      } else {
        setAdminNotice('Modus Maintenance dinonaktifkan. Sistem dapat diakses kembali oleh seluruh user.');
      }
      setTimeout(() => setAdminNotice(null), 5000);
    } catch (e) {
      console.error("Gagal mengubah status maintenance:", e);
    }
  };

  // --- Admin Code Workspace States ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workspace'>('dashboard');
  const [selectedFile, setSelectedFile] = useState<string>('src/App.tsx');
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorLoading, setEditorLoading] = useState<boolean>(false);
  const [editorSaving, setEditorSaving] = useState<boolean>(false);
  const [editorSuccess, setEditorSuccess] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Compiling Workspace...',
    '[system] Admin Code Workspace initialized.',
    '[system] Ready to edit and preview code files.'
  ]);

  const addTerminalLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  };

  const loadWorkspaceFile = async (filePath: string) => {
    setEditorLoading(true);
    setEditorError(null);
    setEditorSuccess(null);
    try {
      const res = await fetch(`/api/admin/file?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) {
        throw new Error(await res.text() || `Failed to fetch file: ${filePath}`);
      }
      const fileData = await res.json();
      setEditorContent(fileData.content);
      addTerminalLog(`[system] File loaded successfully: ${filePath}`);
    } catch (err: any) {
      setEditorError(`Gagal memuat file: ${err.message}`);
      addTerminalLog(`[error] Failed to load ${filePath}: ${err.message}`);
    } finally {
      setEditorLoading(false);
    }
  };

  const saveWorkspaceFile = async () => {
    if (!selectedFile) return;
    setEditorSaving(true);
    setEditorError(null);
    setEditorSuccess(null);
    addTerminalLog(`[system] Saving changes to ${selectedFile}...`);
    try {
      const res = await fetch('/api/admin/file/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content: editorContent })
      });
      if (!res.ok) {
        throw new Error(await res.text() || `Failed to save file: ${selectedFile}`);
      }
      const responseData = await res.json();
      setEditorSuccess(responseData.message || `File ${selectedFile} berhasil disimpan!`);
      addTerminalLog(`[success] File ${selectedFile} successfully saved and updated on the server!`);
      
      // Simulate dev server recompilation
      addTerminalLog(`[vite] hmr update in progress...`);
      addTerminalLog(`[vite] client refreshed.`);
      
      // If data.json is edited, reload local state
      if (selectedFile === 'src/data.json') {
        try {
          const parsed = JSON.parse(editorContent);
          setData(parsed);
          try {
            localStorage.setItem('banana_dashboard_cached_data_v2', JSON.stringify(parsed));
          } catch (e) {
            console.warn("Gagal menyimpan cache data.json:", e);
          }
          addTerminalLog(`[system] Local dashboard state synchronized with new data.json`);
        } catch (e: any) {
          addTerminalLog(`[warn] Modified data.json has formatting issues: ${e.message}`);
        }
      }
    } catch (err: any) {
      setEditorError(`Gagal menyimpan file: ${err.message}`);
      addTerminalLog(`[error] Failed to save ${selectedFile}: ${err.message}`);
    } finally {
      setEditorSaving(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'workspace' && selectedFile) {
      loadWorkspaceFile(selectedFile);
    }
  }, [isAdmin, activeTab, selectedFile]);

  // --- States ---
  const [data, setData] = useState<DashboardData>(() => {
    try {
      const cached = localStorage.getItem('banana_dashboard_cached_data_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && parsed.comparisonData && Array.isArray(parsed.comparisonData)) {
          console.log("App initialized with persistent client-side cached data.");
          return parsed as DashboardData;
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached data from localStorage:", e);
    }
    return defaultDashboardData;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setSource] = useState<string>(() => {
    try {
      const cached = localStorage.getItem('banana_dashboard_cached_data_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.source) {
          return parsed.source === 'live_google_sheets' ? 'Google Sheets (Live Cache)' : 'Local Cache';
        }
      }
    } catch (e) {}
    return 'Local Cache';
  });

  // --- Theme State ---
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Keep dark as default
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleAiSubmit = async (questionText?: string) => {
    const q = (questionText || aiQuestion).trim();
    if (!q) return;

    setAiLoading(true);
    setAiError(null);
    setAiAnswer(null);
    
    // Only clear the text area if the user clicked the Send button for their typed question
    if (!questionText) {
      setAiQuestion('');
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: q })
      });

      let resData;
      try {
        resData = await response.json();
      } catch (e) {
        // Response is not JSON
      }

      if (!response.ok) {
        throw new Error(resData?.error || `Gagal menghubungi server analisis AI (Status: ${response.status}).`);
      }

      if (resData?.error) {
        throw new Error(resData.error);
      }
      setAiAnswer(resData?.answer || 'Tidak ada tanggapan dari asisten AI.');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Terjadi kesalahan saat menghubungkan ke asisten AI.');
    } finally {
      setAiLoading(false);
    }
  };

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>('GGP');
  const [categoryA, setCategoryA] = useState<'Aktual' | 'Demand' | 'Rolling Forcast' | 'Budget'>('Aktual');
  const [categoryB, setCategoryB] = useState<'Aktual' | 'Demand' | 'Rolling Forcast' | 'Budget'>('Demand');
  
  // Shooting Comparison Panel Modes & Filters
  const [shootingCompareMode, setShootingCompareMode] = useState<'shooting_vs_shooting' | 'shooting_vs_harvest'>('shooting_vs_harvest');
  const [shootingSourceType, setShootingSourceType] = useState<'Aktual' | 'Demand' | 'Rolling Forcast' | 'Budget'>('Aktual');
  const [shootingTargetType, setShootingTargetType] = useState<'Aktual' | 'Demand' | 'Rolling Forcast' | 'Budget'>('Demand');

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedParam, setSelectedParam] = useState<string>('Box Packable');
  const [showSideBySideDetails, setShowSideBySideDetails] = useState<boolean>(false);
  const [showWaterfallBridge, setShowWaterfallBridge] = useState<boolean>(false);
  const [showBunchesPanen, setShowBunchesPanen] = useState<boolean>(true);
  const [showShooting, setShowShooting] = useState<boolean>(true);
  const [showSsnPresentation, setShowSsnPresentation] = useState<boolean>(false);
  const [currentSsnSlide, setCurrentSsnSlide] = useState<number>(1);
  const [ssnCacheBuster, setSsnCacheBuster] = useState<number>(Date.now());
  const [isRefreshingSsn, setIsRefreshingSsn] = useState<boolean>(false);
  const [showSsnNavHint, setShowSsnNavHint] = useState<boolean>(true);
  const [showLossesBanana, setShowLossesBanana] = useState<boolean>(false);
  const [lossesViewMode, setLossesViewMode] = useState<'category' | 'cause'>('cause');
  const [showRecTableDetails, setShowRecTableDetails] = useState<boolean>(false);
  const [recTotalPackableChartType, setRecTotalPackableChartType] = useState<'line' | 'bar'>('line');
  const [recViewGroupType, setRecViewGroupType] = useState<'all' | 'single'>('single');
  const [recSelectedSingle, setRecSelectedSingle] = useState<string>('GGP');
  const [qualityRatioChartType, setQualityRatioChartType] = useState<'todate' | 'trend'>('todate');
  const [showBunchweightTableDetails, setShowBunchweightTableDetails] = useState<boolean>(false);
  const [showDiagnosticsDetails, setShowDiagnosticsDetails] = useState<boolean>(false);
  const [showBunchweightAnalysis, setShowBunchweightAnalysis] = useState<boolean>(false);
  const [showRawDataPanel, setShowRawDataPanel] = useState<boolean>(false);
  const [curahBasisMode, setCurahBasisMode] = useState<'100_curah' | 'curah_pct'>('curah_pct');

  // Scroll Navigation State
  const [lastViewedPanel, setLastViewedPanel] = useState<{ id: string; name: string } | null>({
    id: 'ssn-presentation-section',
    name: 'Display 5 (PPT)'
  });
  const [showPanelSelector, setShowPanelSelector] = useState<boolean>(false);

  // Fullscreen state and effect
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Gagal mengaktifkan mode layar penuh: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // --- Sebaran Kalibrasi Panel States ---
  const [selectedCalibrationPg, setSelectedCalibrationPg] = useState<string>('GGP');
  const [showCalibrationTableDetails, setShowCalibrationTableDetails] = useState<boolean>(false);
  const [calibrationChartType, setCalibrationChartType] = useState<'stacked' | 'line'>('stacked');

  useEffect(() => {
    if (['GGP', 'PG1', 'PG2', 'PG3', 'PG4'].includes(selectedGroup.toUpperCase())) {
      setSelectedCalibrationPg(selectedGroup.toUpperCase());
    }
  }, [selectedGroup]);

  // --- Bunchweight Simulation Interactive States ---
  const [simCalib, setSimCalib] = useState<number>(44.0);
  const [simAge, setSimAge] = useState<number>(9.8);
  const [simHand, setSimHand] = useState<number>(7.8);
  const [simSisa, setSimSisa] = useState<number>(4.5);

  // --- Timeline Range Filter States ---
  const [rangeMode, setRangeMode] = useState<string>('last3m'); // 'all', 'last3m', '3m', '6m', 'custom', 'single'
  const [startMonth, setStartMonth] = useState<number>(0); // 0 (Jan) to 11 (Dec)
  const [endMonth, setEndMonth] = useState<number>(5);     // 5 (Jun) - Default Jan-Jun as requested
  const [startWeek, setStartWeek] = useState<number>(0);   // 0 (W1) to 52 (W53)
  const [endWeek, setEndWeek] = useState<number>(25);     // 25 (W26) - Default first half of the year
  const [singleMonth, setSingleMonth] = useState<number>(0); // Default Jan
  const [singleWeek, setSingleWeek] = useState<number>(0);   // Default W1
  const [customDateMode, setCustomDateMode] = useState<'period' | 'calendar'>('period');
  const [startDate, setStartDate] = useState<string>('2025-12-29');
  const [endDate, setEndDate] = useState<string>('2026-06-30');

  // --- Raw Parameter Table States ---
  const [rawTablePage, setRawTablePage] = useState<number>(1);
  const [rawTableRowsPerPage, setRawTableRowsPerPage] = useState<number>(25);
  const [rawTableSearch, setRawTableSearch] = useState<string>('Box Pac');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [rawTableGroup, setRawTableGroup] = useState<string>('GGP');
  const [rawTableDataType, setRawTableDataType] = useState<string>('Semua Jenis');
  const [rawTableViewMode, setRawTableViewMode] = useState<ViewMode>('monthlyCutDate');

  // --- AI Assistant States ---
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const autocompleteCandidates = useMemo(() => {
    if (!data || !data.comparisonData) return [];
    const candidates = new Set<string>();
    data.comparisonData.forEach(item => {
      if (item.parameter) candidates.add(item.parameter);
      if (item.group) candidates.add(item.group);
      if (item.unit) candidates.add(item.unit);
      if (item.dataType) candidates.add(item.dataType);
    });
    return Array.from(candidates).filter(Boolean).sort();
  }, [data]);

  const rawTableSuggestions = useMemo(() => {
    const query = rawTableSearch.trim().toLowerCase();
    if (!query) return [];
    
    const startsWithMatch: string[] = [];
    const includesMatch: string[] = [];
    
    autocompleteCandidates.forEach(cand => {
      const lowerCand = cand.toLowerCase();
      if (lowerCand === query) return; // exact match
      if (lowerCand.startsWith(query)) {
        startsWithMatch.push(cand);
      } else if (lowerCand.includes(query)) {
        includesMatch.push(cand);
      }
    });
    
    return [...startsWithMatch, ...includesMatch].slice(0, 8);
  }, [rawTableSearch, autocompleteCandidates]);

  const uniqueGroups = useMemo(() => {
    if (!data || !data.comparisonData) return [];
    const groupsSet = new Set<string>();
    data.comparisonData.forEach(item => {
      if (item.group) groupsSet.add(item.group);
    });
    return Array.from(groupsSet).sort();
  }, [data]);

  const uniqueDataTypes = useMemo(() => {
    if (!data || !data.comparisonData) return [];
    const typesSet = new Set<string>();
    data.comparisonData.forEach(item => {
      if (item.dataType) typesSet.add(item.dataType);
    });
    return Array.from(typesSet).sort();
  }, [data]);

  const filteredRawRows = useMemo(() => {
    if (!data || !data.comparisonData) return [];
    
    return data.comparisonData.filter(item => {
      // Group Filter
      if (rawTableGroup !== 'Semua Group' && item.group !== rawTableGroup) return false;
      
      // DataType Filter
      if (rawTableDataType !== 'Semua Jenis' && item.dataType !== rawTableDataType) return false;
      
      // Search Filter (checks group, parameter, unit, dataType)
      if (rawTableSearch.trim() !== '') {
        const query = rawTableSearch.toLowerCase();
        const groupMatch = (item.group || '').toLowerCase().includes(query);
        const paramMatch = (item.parameter || '').toLowerCase().includes(query);
        const unitMatch = (item.unit || '').toLowerCase().includes(query);
        const typeMatch = (item.dataType || '').toLowerCase().includes(query);
        if (!groupMatch && !paramMatch && !unitMatch && !typeMatch) return false;
      }
      
      return true;
    });
  }, [data, rawTableGroup, rawTableDataType, rawTableSearch]);

  const paginatedRawRows = useMemo(() => {
    const startIndex = (rawTablePage - 1) * rawTableRowsPerPage;
    return filteredRawRows.slice(startIndex, startIndex + rawTableRowsPerPage);
  }, [filteredRawRows, rawTablePage, rawTableRowsPerPage]);

  const totalRawPages = useMemo(() => {
    return Math.ceil(filteredRawRows.length / rawTableRowsPerPage) || 1;
  }, [filteredRawRows, rawTableRowsPerPage]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setRawTablePage(1);
  }, [rawTableGroup, rawTableDataType, rawTableSearch, rawTableViewMode]);

  // Sync Sebaran Kalibrasi PG selection with global selectedGroup
  useEffect(() => {
    if (['PG1', 'PG2', 'PG3', 'PG4'].includes(selectedGroup)) {
      setSelectedCalibrationPg(selectedGroup);
    }
  }, [selectedGroup]);

  const rawColumns = useMemo(() => {
    const cols: { key: string; label: string; textRight?: boolean }[] = [];
    
    if (rawTableViewMode === 'monthlyCutDate') {
      if (data && data.months) {
        data.months.forEach((m, i) => {
          cols.push({ key: `monthlyCutDate_${i}`, label: m, textRight: true });
        });
      }
      cols.push({ key: 'monthlyCutDateTotal', label: 'Total Cut Date', textRight: true });
    } else if (rawTableViewMode === 'monthlyCutWeek') {
      if (data && data.months) {
        data.months.forEach((m, i) => {
          cols.push({ key: `monthlyCutWeek_${i}`, label: m, textRight: true });
        });
      }
      cols.push({ key: 'monthlyCutWeekTotal', label: 'Total Cut Week', textRight: true });
    } else if (rawTableViewMode === 'weekly') {
      for (let i = 0; i < 53; i++) {
        cols.push({ key: `weekly_${i}`, label: `W${i + 1}`, textRight: true });
      }
      cols.push({ key: 'weeklyTotal', label: 'Total Weekly', textRight: true });
    } else if (rawTableViewMode === 'daily') {
      const getDailyDateLabel = (index: number): string => {
        const startDate = new Date(2025, 11, 29, 12, 0, 0);
        const targetDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
        const day = targetDate.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${months[targetDate.getMonth()]}`;
      };
      for (let i = 0; i < 371; i++) {
        cols.push({ key: `daily_${i}`, label: getDailyDateLabel(i), textRight: true });
      }
    }
    
    return cols;
  }, [rawTableViewMode, data]);

  const formatRawValue = (val: number | null | undefined, unit: string) => {
    if (val === null || val === undefined) return '-';
    const isInteger = Number.isInteger(val);
    const formattedNum = isInteger ? val.toLocaleString('id-ID') : val.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    
    if (unit === '%') {
      return `${formattedNum}%`;
    }
    if (unit === 'Kg') {
      return `${formattedNum} Kg`;
    }
    return `${formattedNum} ${unit || ''}`;
  };

  // --- Notifications State ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const presentationContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreenPresentation = () => {
    if (!presentationContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      if (presentationContainerRef.current.requestFullscreen) {
        presentationContainerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else if ((presentationContainerRef.current as any).webkitRequestFullscreen) {
        (presentationContainerRef.current as any).webkitRequestFullscreen();
      } else if ((presentationContainerRef.current as any).msRequestFullscreen) {
        (presentationContainerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  const handleRefreshSsn = () => {
    setIsRefreshingSsn(true);
    setSsnCacheBuster(Date.now());
    setTimeout(() => {
      setIsRefreshingSsn(false);
    }, 800);
  };

  // Listen to keyboard arrow keys to navigate slides when the presentation is shown
  useEffect(() => {
    if (!showSsnPresentation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // If the user is typing in an input, textarea, or contenteditable element, ignore
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.hasAttribute('contenteditable'))
      ) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentSsnSlide(prev => Math.max(1, prev - 1));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentSsnSlide(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSsnPresentation]);

  // Track currently/last viewed panel for scroll navigation
  useEffect(() => {
    const PANEL_SECTIONS = [
      { id: 'top-filter-panel', name: 'Filter Control Panel' },
      { id: 'kpi-summary-panel', name: 'Ringkasan KPI Utama' },
      { id: 'side-by-side-panel', name: 'Grafik Trend Analisis Utama' },
      { id: 'waterfall-bridge-panel', name: 'Jembatan Box (Waterfall)' },
      { id: 'bunches-panen-panel', name: 'Grafik Bunches Panen' },
      { id: 'loss-analysis-panel', name: 'Analisis Losses Banana' },
      { id: 'bunchweight-trends-panel', name: 'Trend Bunchweight' },
      { id: 'calibration-distribution-panel', name: 'Sebaran Kalibrasi' },
      { id: 'progress-diagnostics-panel', name: 'Progress & Diagnostik' },
      { id: 'rec-packable-panel', name: 'REC Total Packable' },
      { id: 'ssn-presentation-section', name: 'Display 5 (PPT)' },
      { id: 'evaluasi-plan-section', name: 'Evaluasi Plan vs Actual' },
      { id: 'raw-parameters-section', name: 'Sumber Data' },
      { id: 'ai-analyst-section', name: 'Asisten AI PPIC' }
    ];

    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -40% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const found = PANEL_SECTIONS.find(p => p.id === entry.target.id);
          if (found) {
            setLastViewedPanel(found);
          }
        }
      });
    }, observerOptions);

    PANEL_SECTIONS.forEach((panel) => {
      const el = document.getElementById(panel.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [showSsnPresentation, showLossesBanana, showBunchesPanen, showSideBySideDetails]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('banana_push_enabled');
      return stored === null ? true : stored === 'true';
    } catch (e) {
      return true;
    }
  });

  // Base64 helper for VAPID key to Uint8Array required by pushManager
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const registerAndSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn("Service Worker or Push Notifications are not supported in this browser.");
      return;
    }
    
    try {
      // Register service worker pointing to sw.js
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', reg);

      // Fetch VAPID public key from backend
      const res = await fetch('/api/notifications/vapid-public-key');
      if (!res.ok) throw new Error("Failed to fetch VAPID key");
      const { publicKey } = await res.json();

      // Subscribe to Push Service
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      console.log("Subscribed to push service:", subscription);

      // Send subscription object to backend to register for offline push
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      console.log("Subscription successfully synchronized with backend.");
    } catch (err) {
      console.error("Failed to register Service Worker or subscribe to push notifications:", err);
    }
  };

  // Register push notifications on mount or toggle if permission is already granted
  useEffect(() => {
    if (pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      registerAndSubscribePush();
    }
  }, [pushEnabled]);

  const togglePushEnabled = () => {
    const nextVal = !pushEnabled;
    setPushEnabled(nextVal);
    try {
      localStorage.setItem('banana_push_enabled', String(nextVal));
    } catch (e) {
      console.error("Gagal menyimpan opsi push notification:", e);
    }
    
    // If turning on, ask for browser permission and subscribe if granted
    if (nextVal && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            registerAndSubscribePush();
          }
        });
      } else if (Notification.permission === 'granted') {
        registerAndSubscribePush();
      }
    }
  };

  // Load initial notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('banana_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Gagal memuat notifikasi:", e);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  const saveNotifications = (newNotifs: any[]) => {
    setNotifications(newNotifs);
    try {
      localStorage.setItem('banana_notifications', JSON.stringify(newNotifs));
    } catch (e) {
      console.error("Gagal menyimpan notifikasi:", e);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 10000);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n: any) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const requestPushPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        // Force re-render
        setNotifications(prev => [...prev]);
        if (permission === 'granted' && pushEnabled) {
          registerAndSubscribePush();
        }
      });
    }
  };


  // --- Live Data Sync ---
  const fetchLiveData = async (force: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force ? '/api/data?refresh=true' : '/api/data';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      try {
        localStorage.setItem('banana_dashboard_cached_data_v2', JSON.stringify(json));
      } catch (e) {
        console.warn("Gagal menyimpan cache data ke localStorage:", e);
      }
      setSource(json.source === 'live_google_sheets' ? 'Google Sheets (Live)' : 'Memory Cache');

      // Check for notifications on data update
      if (json.lastUpdateDate) {
        const storedLastDate = localStorage.getItem('banana_last_update_date');
        
        if (!storedLastDate || storedLastDate !== json.lastUpdateDate) {
          const notifMsg = `Terdapat update aktual todate ${json.lastUpdateDate}`;
          
          const newNotif = {
            id: Date.now().toString(),
            message: notifMsg,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            read: false,
            dateKey: json.lastUpdateDate
          };
          
          // Prevent duplicates in state
          setNotifications(prev => {
            const isDup = prev.some((n: any) => n.dateKey === json.lastUpdateDate);
            if (isDup) return prev;
            
            const updatedNotifs = [newNotif, ...prev].slice(0, 20);
            try {
              localStorage.setItem('banana_notifications', JSON.stringify(updatedNotifs));
            } catch (e) {
              console.error(e);
            }
            return updatedNotifs;
          });
          
          // Only trigger toast and push notification if storedLastDate is actually different
          // (i.e. not empty, indicating a real update occurred rather than first app boot)
          if (storedLastDate) {
            triggerToast(notifMsg);
            
            if (pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('Pembaruan Data PPIC BANANA', {
                  body: notifMsg
                });
              } catch (err) {
                console.warn("Browser notification error:", err);
              }
            }
          }
        }
        
        localStorage.setItem('banana_last_update_date', json.lastUpdateDate);
      }
    } catch (err: any) {
      console.error("Live fetch error, utilizing static data:", err.message);
      setError(`Failed to sync live data: ${err.message}. Using cached data.`);
      setSource('Cached Fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Periodic polling to check for live Google Sheets updates every 5 minutes (300000 ms) using standard cache
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Background polling Google Sheet updates...");
      fetchLiveData(false); // fetch standard cached data from backend
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // --- Dynamic Option Extraction ---
  const groups = ['GGP', 'PG1', 'PG2', 'PG3', 'PG4', 'NSA CG', 'GGF TOTAL'];
  
  const popularParams = [
    { value: 'Box Packable', label: 'Box Packable (Utama)' },
    { value: 'REC Export', label: 'REC Export' },
    { value: 'REC Domestic', label: 'REC Domestic' },
    { value: 'REC Total Packable (Export & Domestic)', label: 'REC Total Packable' },
    { value: 'REC CLASS A', label: 'REC Class A' },
    { value: 'Harvest', label: 'Harvest (Bcs)' },
    { value: 'Bunchweight', label: 'Bunchweight (Kg)' },
    { value: 'TONASE', label: 'Tonase' },
    { value: 'CURAH PROSES', label: 'Curah Proses' },
    { value: 'BSR', label: 'BSR' }
  ];

  // Combine popular and any other parameters found in the dataset
  const allParams = useMemo(() => {
    const fromData = Array.from(new Set(data.comparisonData.map(d => d.parameter)));
    // Filter out standard ones to avoid duplication
    const otherParams = fromData.filter(p => !popularParams.some(pop => pop.value === p) && p !== 'Unit');
    return [
      ...popularParams,
      ...otherParams.map(p => ({ value: p, label: p }))
    ].slice(0, 22);
  }, [data.comparisonData]);

  // --- Data Calculations & Formatting ---
  const comparedRows = useMemo(() => {
    const rowA = data.comparisonData.find(d => 
      d.group.toUpperCase() === selectedGroup.toUpperCase() &&
      d.parameter === selectedParam &&
      d.dataType === categoryA
    );
    const rowB = data.comparisonData.find(d => 
      d.group.toUpperCase() === selectedGroup.toUpperCase() &&
      d.parameter === selectedParam &&
      d.dataType === categoryB
    );
    return { rowA, rowB };
  }, [data.comparisonData, selectedGroup, selectedParam, categoryA, categoryB]);

  // Base unfiltered chart data
  const unfilteredChartData = useMemo(() => {
    const { rowA, rowB } = comparedRows;
    
    if (viewMode === 'weekly') {
      // 53 weeks
      return Array.from({ length: 53 }).map((_, i) => {
        const valA = rowA && rowA.weekly ? rowA.weekly[i] : null;
        const valB = rowB && rowB.weekly ? rowB.weekly[i] : null;
        const pct = (valA !== null && valB !== null && valB !== 0) ? (valA / valB) * 100 : null;
        return {
          name: `W${i + 1}`,
          index: i,
          [categoryA]: valA !== null ? Number(valA.toFixed(2)) : null,
          [categoryB]: valB !== null ? Number(valB.toFixed(2)) : null,
          pct: pct !== null ? Number(pct.toFixed(1)) : null,
        };
      });
    } else if (viewMode === 'daily') {
      // 53 weeks * 7 days = 371 days
      const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      const dailyData: any[] = [];
      let dayIdx = 0;
      
      const isPercentage = rowA?.unit === '%' || selectedParam.toLowerCase().includes('rec');
      const isAverageParam = isPercentage || 
                             selectedParam.toLowerCase().includes('bunchweight') || 
                             selectedParam.toLowerCase().includes('bsr') ||
                             selectedParam.toUpperCase().includes('KALIBRASI') ||
                             selectedParam.toUpperCase().includes('UMUR') ||
                             selectedParam.toUpperCase().includes('HANCLASS');

      for (let i = 0; i < 53; i++) {
        const valA = rowA && rowA.weekly ? rowA.weekly[i] : null;
        const valB = rowB && rowB.weekly ? rowB.weekly[i] : null;
        
        // Pseudo-random factor stable across renders
        const factors = Array.from({ length: 7 }).map((_, d) => 1 + 0.15 * Math.sin(i * 10 + d));
        const sumFactors = factors.reduce((sum, f) => sum + f, 0);
        const normalizedFactors = factors.map(f => (f / sumFactors) * 7);

        for (let d = 0; d < 7; d++) {
          let dValA: number | null = null;
          if (rowA?.daily && dayIdx < rowA.daily.length) {
            dValA = rowA.daily[dayIdx];
          } else {
            dValA = valA !== null ? (isAverageParam ? valA : (valA / 7) * normalizedFactors[d]) : null;
          }

          let dValB: number | null = null;
          if (rowB?.daily && dayIdx < rowB.daily.length) {
            dValB = rowB.daily[dayIdx];
          } else {
            dValB = valB !== null ? (isAverageParam ? valB : (valB / 7) * normalizedFactors[d]) : null;
          }

          const pct = (dValA !== null && dValB !== null && dValB !== 0) ? (dValA / dValB) * 100 : null;
          
          const dObj = new Date(2025, 11, 29 + dayIdx);
          const dayNum = dObj.getDate();
          const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const monthStr = monthNamesShort[dObj.getMonth()];
          const dateLabel = `${dayNum}-${monthStr}`;

          dailyData.push({
            name: dateLabel,
            index: dayIdx,
            weekIndex: i,
            dayIndex: d,
            [categoryA]: dValA !== null ? Number(dValA.toFixed(2)) : null,
            [categoryB]: dValB !== null ? Number(dValB.toFixed(2)) : null,
            pct: pct !== null ? Number(pct.toFixed(1)) : null,
          });
          dayIdx++;
        }
      }
      return dailyData;
    } else {
      // 12 months
      return data.months.map((m, idx) => {
        const valA = rowA 
          ? (viewMode === 'monthlyCutDate' ? rowA.monthlyCutDate[idx] : rowA.monthlyCutWeek[idx]) 
          : null;
        const valB = rowB 
          ? (viewMode === 'monthlyCutDate' ? rowB.monthlyCutDate[idx] : rowB.monthlyCutWeek[idx]) 
          : null;
        const pct = (valA !== null && valB !== null && valB !== 0) ? (valA / valB) * 100 : null;
        return {
          name: m,
          index: idx,
          [categoryA]: valA !== null ? Number(valA.toFixed(2)) : null,
          [categoryB]: valB !== null ? Number(valB.toFixed(2)) : null,
          pct: pct !== null ? Number(pct.toFixed(1)) : null,
        };
      });
    }
  }, [comparedRows, viewMode, categoryA, categoryB, data.months]);

  // Find the last index where Actual (Aktual) data exists for the selected group and parameter
  const lastActualIndex = useMemo(() => {
    let maxIndex = -1;

    if (viewMode === 'weekly' || viewMode === 'daily') {
      // 1. Check selectedParam for selectedGroup
      const rowAktual = data.comparisonData.find(d => 
        d.group.toUpperCase() === selectedGroup.toUpperCase() &&
        d.parameter === selectedParam &&
        d.dataType === 'Aktual'
      );

      if (rowAktual?.weekly) {
        for (let i = rowAktual.weekly.length - 1; i >= 0; i--) {
          if (rowAktual.weekly[i] !== null && rowAktual.weekly[i] !== undefined) {
            maxIndex = i;
            break;
          }
        }
      }

      // 2. Also check core harvest metrics for the selected group or overall GGP/GGF TOTAL to ensure latest week is included
      const primaryRows = data.comparisonData.filter(d => 
        ['Box Packable', 'Harvest', 'Bunchweight'].includes(d.parameter) &&
        d.dataType === 'Aktual'
      );

      for (const row of primaryRows) {
        if (row.weekly) {
          for (let i = row.weekly.length - 1; i >= 0; i--) {
            if (row.weekly[i] !== null && row.weekly[i] !== undefined) {
              if (i > maxIndex) maxIndex = i;
              break;
            }
          }
        }
      }

      return maxIndex !== -1 ? maxIndex : 52;
    } else {
      // Monthly views
      const rowAktual = data.comparisonData.find(d => 
        d.group.toUpperCase() === selectedGroup.toUpperCase() &&
        d.parameter === selectedParam &&
        d.dataType === 'Aktual'
      );

      const prop = viewMode === 'monthlyCutDate' ? 'monthlyCutDate' : 'monthlyCutWeek';
      if (rowAktual && (rowAktual as any)[prop]) {
        const arr = (rowAktual as any)[prop];
        for (let i = arr.length - 1; i >= 0; i--) {
          if (arr[i] !== null && arr[i] !== undefined) {
            maxIndex = i;
            break;
          }
        }
      }

      const primaryRows = data.comparisonData.filter(d => 
        ['Box Packable', 'Harvest', 'Bunchweight'].includes(d.parameter) &&
        d.dataType === 'Aktual'
      );

      for (const row of primaryRows) {
        const arr = (row as any)[prop];
        if (arr) {
          for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i] !== null && arr[i] !== undefined) {
              if (i > maxIndex) maxIndex = i;
              break;
            }
          }
        }
      }

      return maxIndex !== -1 ? maxIndex : 11;
    }
  }, [data.comparisonData, selectedGroup, selectedParam, viewMode]);

  // Human readable string representation of the computed 3-month range
  const last3MonthsDisplay = useMemo(() => {
    if (viewMode === 'weekly' || viewMode === 'daily') {
      const endW = lastActualIndex + 1;
      const startW = Math.max(1, lastActualIndex - 11);
      return `Minggu ${startW} s/d Minggu ${endW} (W${startW} - W${endW})${viewMode === 'daily' ? ' - Harian' : ''}`;
    } else {
      const endM = data.months[lastActualIndex] || '';
      const startMIdx = Math.max(0, lastActualIndex - 2);
      const startM = data.months[startMIdx] || '';
      return `${startM} s/d ${endM}`;
    }
  }, [viewMode, lastActualIndex, data.months]);

  // Filtered chart data based on range selections
  const chartData = useMemo(() => {
    if (rangeMode === 'custom' && customDateMode === 'calendar') {
      const [sYr, sMn, sDy] = startDate.split('-').map(Number);
      const [eYr, eMn, eDy] = endDate.split('-').map(Number);
      const startD = new Date(sYr, sMn - 1, sDy);
      const endD = new Date(eYr, eMn - 1, eDy);
      
      return unfilteredChartData.filter(point => {
        let pointStart: Date;
        let pointEnd: Date;
        
        if (viewMode === 'daily') {
          pointStart = new Date(2025, 11, 29 + point.index);
          pointEnd = new Date(2025, 11, 29 + point.index);
        } else if (viewMode === 'weekly') {
          pointStart = new Date(2025, 11, 29 + point.index * 7);
          pointEnd = new Date(2025, 11, 29 + point.index * 7 + 6);
        } else {
          pointStart = new Date(2026, point.index, 1);
          pointEnd = new Date(2026, point.index + 1, 0);
        }
        
        return pointStart <= endD && pointEnd >= startD;
      });
    }

    if (viewMode === 'weekly' || viewMode === 'daily') {
      const mult = viewMode === 'daily' ? 7 : 1;
      if (rangeMode === '3m') {
        // approx 13 weeks
        return unfilteredChartData.slice(0, 13 * mult);
      } else if (rangeMode === 'last3m') {
        // last 13 weeks ending at last actual data index
        if (viewMode === 'daily') {
          const endDay = (lastActualIndex + 1) * 7;
          const startDay = Math.max(0, endDay - 13 * 7);
          return unfilteredChartData.slice(startDay, endDay);
        } else {
          const start = Math.max(0, lastActualIndex - 12);
          return unfilteredChartData.slice(start, lastActualIndex + 1);
        }
      } else if (rangeMode === '6m') {
        // approx 26 weeks
        return unfilteredChartData.slice(0, 26 * mult);
      } else if (rangeMode === 'custom') {
        const start = Math.min(startWeek, endWeek);
        const end = Math.max(startWeek, endWeek);
        if (viewMode === 'daily') {
          return unfilteredChartData.slice(start * 7, (end + 1) * 7);
        } else {
          return unfilteredChartData.slice(start, end + 1);
        }
      } else if (rangeMode === 'single') {
        if (viewMode === 'daily') {
          return unfilteredChartData.slice(singleWeek * 7, (singleWeek + 1) * 7);
        } else {
          return unfilteredChartData.slice(singleWeek, singleWeek + 1);
        }
      }
      return unfilteredChartData;
    } else {
      // Monthly
      if (rangeMode === '3m') {
        // first 3 months (Jan - Mar)
        return unfilteredChartData.slice(0, 3);
      } else if (rangeMode === 'last3m') {
        // last 3 months ending at last actual data index
        const start = Math.max(0, lastActualIndex - 2);
        return unfilteredChartData.slice(start, lastActualIndex + 1);
      } else if (rangeMode === '6m') {
        // first 6 months (Jan - Jun)
        return unfilteredChartData.slice(0, 6);
      } else if (rangeMode === 'custom') {
        const start = Math.min(startMonth, endMonth);
        const end = Math.max(startMonth, endMonth);
        return unfilteredChartData.slice(start, end + 1);
      } else if (rangeMode === 'single') {
        return unfilteredChartData.slice(singleMonth, singleMonth + 1);
      }
      return unfilteredChartData;
    }
  }, [unfilteredChartData, viewMode, rangeMode, startMonth, endMonth, startWeek, endWeek, singleMonth, singleWeek, lastActualIndex, customDateMode, startDate, endDate]);

  // Active 0-indexed week indices mapped from selected timeline interval
  const activeWeekIndices = useMemo(() => {
    if (viewMode === 'weekly') {
      return chartData.map(d => d.index);
    } else if (viewMode === 'daily') {
      const set = new Set<number>();
      chartData.forEach(d => {
        if (d.weekIndex !== undefined) set.add(d.weekIndex);
      });
      return Array.from(set).sort((a, b) => a - b);
    } else {
      // Monthly views: map selected month indices to approximate weeks
      const monthIndices = new Set(chartData.map(d => d.index));
      const monthToWeeksMap: Record<number, number[]> = {
        0: [0, 1, 2, 3],       // Jan
        1: [4, 5, 6, 7],       // Feb
        2: [8, 9, 10, 11],     // Mar
        3: [12, 13, 14, 15, 16], // Apr
        4: [17, 18, 19, 20],   // Mei
        5: [21, 22, 23, 24, 25], // Jun
        6: [26, 27, 28, 29],   // Jul
        7: [30, 31, 32, 33],   // Agu
        8: [34, 35, 36, 37, 38], // Sep
        9: [39, 40, 41, 42],   // Okt
        10: [43, 44, 45, 46, 47], // Nov
        11: [48, 49, 50, 51, 52]  // Des
      };
      const weeks: number[] = [];
      monthIndices.forEach((m: any) => {
        const mNum = m as number;
        if (monthToWeeksMap[mNum]) {
          weeks.push(...monthToWeeksMap[mNum]);
        }
      });
      return Array.from(new Set(weeks)).sort((a, b) => a - b);
    }
  }, [chartData, viewMode]);

  // Decomposition Analysis of Box Packable factors: Harvest, Bunchweight, REC Total Packable
  const packableAnalysisData = useMemo(() => {
    const searchGroup = selectedGroup;
    
    const rowHarvestA = data.comparisonData.find(r => r.group.toUpperCase() === searchGroup.toUpperCase() && r.parameter === 'Harvest' && r.dataType === categoryA);
    const rowHarvestB = data.comparisonData.find(r => r.group.toUpperCase() === searchGroup.toUpperCase() && r.parameter === 'Harvest' && r.dataType === categoryB);

    const rowWeightA = data.comparisonData.find(r => r.group.toUpperCase() === searchGroup.toUpperCase() && r.parameter === 'Bunchweight' && r.dataType === categoryA);
    const rowWeightB = data.comparisonData.find(r => r.group.toUpperCase() === searchGroup.toUpperCase() && r.parameter === 'Bunchweight' && r.dataType === categoryB);

    const rowRecA = data.comparisonData.find(r => r.group.toUpperCase() === searchGroup.toUpperCase() && r.parameter === 'REC Total Packable (Export & Domestic)' && r.dataType === categoryA);
    const rowRecB = data.comparisonData.find(r => r.group.toUpperCase() === searchGroup.toUpperCase() && r.parameter === 'REC Total Packable (Export & Domestic)' && r.dataType === categoryB);

    const rowBoxA = data.comparisonData.find(r => r.group.toUpperCase() === searchGroup.toUpperCase() && r.parameter === 'Box Packable' && r.dataType === categoryA);
    const rowBoxB = data.comparisonData.find(r => r.group.toUpperCase() === searchGroup.toUpperCase() && r.parameter === 'Box Packable' && r.dataType === categoryB);

    let totalBoxesA = 0;
    let totalBoxesB = 0;
    let totalHarvestA = 0;
    let totalHarvestB = 0;
    let weightedBunchweightA_sum = 0;
    let weightedBunchweightB_sum = 0;
    let weightedRecA_sum = 0;
    let weightedRecB_sum = 0;

    let totalHarvestEffect = 0;
    let totalWeightEffect = 0;
    let totalRecEffect = 0;

    chartData.forEach(point => {
      const tIdx = point.index;
      let hA = 0, hB = 0;
      let wA = 0, wB = 0;
      let rA = 0, rB = 0;
      let bA = 0, bB = 0;

      if (viewMode === 'weekly') {
        hA = rowHarvestA?.weekly?.[tIdx] ?? 0;
        hB = rowHarvestB?.weekly?.[tIdx] ?? 0;
        wA = rowWeightA?.weekly?.[tIdx] ?? 0;
        wB = rowWeightB?.weekly?.[tIdx] ?? 0;
        rA = rowRecA?.weekly?.[tIdx] ?? 0;
        rB = rowRecB?.weekly?.[tIdx] ?? 0;
        bA = rowBoxA?.weekly?.[tIdx] ?? 0;
        bB = rowBoxB?.weekly?.[tIdx] ?? 0;
      } else if (viewMode === 'daily') {
        const i = point.weekIndex ?? 0;
        const d = point.dayIndex ?? 0;
        const dayIdx = tIdx;

        const factors = Array.from({ length: 7 }).map((_, idx) => 1 + 0.15 * Math.sin(i * 10 + idx));
        const sumFactors = factors.reduce((sum, f) => sum + f, 0);
        const normalizedFactors = factors.map(f => (f / sumFactors) * 7);

        if (rowHarvestA?.daily && dayIdx < rowHarvestA.daily.length) {
          hA = rowHarvestA.daily[dayIdx] ?? 0;
        } else {
          const valA = rowHarvestA?.weekly?.[i] ?? 0;
          hA = (valA / 7) * normalizedFactors[d];
        }

        if (rowHarvestB?.daily && dayIdx < rowHarvestB.daily.length) {
          hB = rowHarvestB.daily[dayIdx] ?? 0;
        } else {
          const valB = rowHarvestB?.weekly?.[i] ?? 0;
          hB = (valB / 7) * normalizedFactors[d];
        }

        if (rowWeightA?.daily && dayIdx < rowWeightA.daily.length) {
          wA = rowWeightA.daily[dayIdx] ?? 0;
        } else {
          wA = rowWeightA?.weekly?.[i] ?? 0;
        }

        if (rowWeightB?.daily && dayIdx < rowWeightB.daily.length) {
          wB = rowWeightB.daily[dayIdx] ?? 0;
        } else {
          wB = rowWeightB?.weekly?.[i] ?? 0;
        }

        if (rowRecA?.daily && dayIdx < rowRecA.daily.length) {
          rA = rowRecA.daily[dayIdx] ?? 0;
        } else {
          rA = rowRecA?.weekly?.[i] ?? 0;
        }

        if (rowRecB?.daily && dayIdx < rowRecB.daily.length) {
          rB = rowRecB.daily[dayIdx] ?? 0;
        } else {
          rB = rowRecB?.weekly?.[i] ?? 0;
        }

        if (rowBoxA?.daily && dayIdx < rowBoxA.daily.length) {
          bA = rowBoxA.daily[dayIdx] ?? 0;
        } else {
          const valA = rowBoxA?.weekly?.[i] ?? 0;
          bA = (valA / 7) * normalizedFactors[d];
        }

        if (rowBoxB?.daily && dayIdx < rowBoxB.daily.length) {
          bB = rowBoxB.daily[dayIdx] ?? 0;
        } else {
          const valB = rowBoxB?.weekly?.[i] ?? 0;
          bB = (valB / 7) * normalizedFactors[d];
        }
      } else {
        hA = (viewMode === 'monthlyCutDate' ? rowHarvestA?.monthlyCutDate?.[tIdx] : rowHarvestA?.monthlyCutWeek?.[tIdx]) ?? 0;
        hB = (viewMode === 'monthlyCutDate' ? rowHarvestB?.monthlyCutDate?.[tIdx] : rowHarvestB?.monthlyCutWeek?.[tIdx]) ?? 0;
        
        wA = (viewMode === 'monthlyCutDate' ? rowWeightA?.monthlyCutDate?.[tIdx] : rowWeightA?.monthlyCutWeek?.[tIdx]) ?? 0;
        wB = (viewMode === 'monthlyCutDate' ? rowWeightB?.monthlyCutDate?.[tIdx] : rowWeightB?.monthlyCutWeek?.[tIdx]) ?? 0;

        rA = (viewMode === 'monthlyCutDate' ? rowRecA?.monthlyCutDate?.[tIdx] : rowRecA?.monthlyCutWeek?.[tIdx]) ?? 0;
        rB = (viewMode === 'monthlyCutDate' ? rowRecB?.monthlyCutDate?.[tIdx] : rowRecB?.monthlyCutWeek?.[tIdx]) ?? 0;

        bA = (viewMode === 'monthlyCutDate' ? rowBoxA?.monthlyCutDate?.[tIdx] : rowBoxA?.monthlyCutWeek?.[tIdx]) ?? 0;
        bB = (viewMode === 'monthlyCutDate' ? rowBoxB?.monthlyCutDate?.[tIdx] : rowBoxB?.monthlyCutWeek?.[tIdx]) ?? 0;
      }

      totalBoxesA += bA;
      totalBoxesB += bB;
      totalHarvestA += hA;
      totalHarvestB += hB;

      weightedBunchweightA_sum += hA * wA;
      weightedBunchweightB_sum += hB * wB;

      weightedRecA_sum += hA * wA * rA;
      weightedRecB_sum += hB * wB * rB;

      // Sequential Substitution Decomposition
      const hEff = ((hA - hB) * wB * (rB / 100)) / 13.5;
      totalHarvestEffect += hEff;

      const wEff = (hA * (wA - wB) * (rB / 100)) / 13.5;
      totalWeightEffect += wEff;

      const rEff = (hA * wA * ((rA - rB) / 100)) / 13.5;
      totalRecEffect += rEff;
    });

    const avgBunchweightA = totalHarvestA > 0 ? weightedBunchweightA_sum / totalHarvestA : 0;
    const avgBunchweightB = totalHarvestB > 0 ? weightedBunchweightB_sum / totalHarvestB : 0;

    const avgRecA = weightedBunchweightA_sum > 0 ? weightedRecA_sum / weightedBunchweightA_sum : 0;
    const avgRecB = weightedBunchweightB_sum > 0 ? weightedRecB_sum / weightedBunchweightB_sum : 0;

    const totalDelta = totalBoxesA - totalBoxesB;
    const accountedDelta = totalHarvestEffect + totalWeightEffect + totalRecEffect;

    return {
      totalBoxesA,
      totalBoxesB,
      totalHarvestA,
      totalHarvestB,
      avgBunchweightA,
      avgBunchweightB,
      avgRecA,
      avgRecB,
      totalHarvestEffect,
      totalWeightEffect,
      totalRecEffect,
      totalDelta,
      accountedDelta
    };
  }, [chartData, viewMode, categoryA, categoryB, selectedGroup, data]);

  // Bunchweight trends for GGP, PG1, PG2, PG3, PG4 synced to active range
  const bunchweightChartData = useMemo(() => {
    return chartData.map(point => {
      const idx = point.index;
      
      const getVal = (groupName: string) => {
        const row = data.comparisonData.find(d => 
          d.group.toUpperCase() === groupName.toUpperCase() &&
          d.parameter === 'Bunchweight' &&
          d.dataType === categoryA
        ) || data.comparisonData.find(d => 
          d.group.toUpperCase() === groupName.toUpperCase() &&
          d.parameter === 'Bunchweight' &&
          d.dataType === 'Aktual'
        );
        
        if (!row) return null;
        
        if (viewMode === 'daily') {
          const weekIdx = point.weekIndex;
          return row.weekly && row.weekly[weekIdx] !== null && row.weekly[weekIdx] !== undefined ? Number(row.weekly[weekIdx].toFixed(2)) : null;
        } else if (viewMode === 'weekly') {
          return row.weekly && row.weekly[idx] !== null && row.weekly[idx] !== undefined ? Number(row.weekly[idx].toFixed(2)) : null;
        } else if (viewMode === 'monthlyCutDate') {
          return row.monthlyCutDate && row.monthlyCutDate[idx] !== null && row.monthlyCutDate[idx] !== undefined ? Number(row.monthlyCutDate[idx].toFixed(2)) : null;
        } else {
          return row.monthlyCutWeek && row.monthlyCutWeek[idx] !== null && row.monthlyCutWeek[idx] !== undefined ? Number(row.monthlyCutWeek[idx].toFixed(2)) : null;
        }
      };

      return {
        name: point.name,
        index: idx,
        GGP: getVal('GGP'),
        PG1: getVal('PG1'),
        PG2: getVal('PG2'),
        PG3: getVal('PG3'),
        PG4: getVal('PG4'),
      };
    });
  }, [chartData, data.comparisonData, viewMode, categoryA]);

  // Calibration Distribution trends synced to active range and selected PG
  const calibrationChartData = useMemo(() => {
    return chartData.map(point => {
      const idx = point.index;
      
      const getVal = (className: string) => {
        if (!data.calibrationDistribution) return null;
        const row = data.calibrationDistribution.find(d => 
          d.pg.toUpperCase() === selectedCalibrationPg.toUpperCase() &&
          d.calibrationClass === className
        );
        
        if (!row) return null;
        
        if (viewMode === 'daily') {
          const weekIdx = point.weekIndex;
          return row.weekly && row.weekly[weekIdx] !== null && row.weekly[weekIdx] !== undefined ? Number(row.weekly[weekIdx].toFixed(1)) : null;
        } else if (viewMode === 'weekly') {
          return row.weekly && row.weekly[idx] !== null && row.weekly[idx] !== undefined ? Number(row.weekly[idx].toFixed(1)) : null;
        } else if (viewMode === 'monthlyCutDate' || viewMode === 'monthlyCutWeek') {
          return row.monthly && row.monthly[idx] !== null && row.monthly[idx] !== undefined ? Number(row.monthly[idx].toFixed(1)) : null;
        }
        return null;
      };

      return {
        name: point.name,
        index: idx,
        under42: getVal('<42'),
        range43_46: getVal('43-46'),
        over47: getVal('>47'),
        nr: getVal('NR')
      };
    });
  }, [chartData, data.calibrationDistribution, viewMode, selectedCalibrationPg]);

  // Harvest Bunches comparison (Aktual vs Budget & Pencapaian %) synced to active range
  const harvestChartData = useMemo(() => {
    return chartData.map(point => {
      const idx = point.index;
      
      const getVal = (dataType: string) => {
        const row = data.comparisonData.find(d => 
          d.group.toUpperCase() === selectedGroup.toUpperCase() &&
          d.parameter === 'Harvest' &&
          d.dataType === dataType
        );
        
        if (!row) return null;
        
        if (viewMode === 'daily') {
          if (row.daily && point.index < row.daily.length) {
            return row.daily[point.index];
          }
          const weekIdx = point.weekIndex;
          const dayIdx = point.dayIndex;
          const weeklyVal = row.weekly && row.weekly[weekIdx];
          if (weeklyVal === null || weeklyVal === undefined) return null;
          
          const factors = Array.from({ length: 7 }).map((_, d) => 1 + 0.15 * Math.sin(weekIdx * 10 + d));
          const sumFactors = factors.reduce((sum, f) => sum + f, 0);
          const normalizedFactors = factors.map(f => (f / sumFactors) * 7);
          return (weeklyVal / 7) * normalizedFactors[dayIdx];
        } else if (viewMode === 'weekly') {
          return row.weekly && row.weekly[idx] !== null && row.weekly[idx] !== undefined ? row.weekly[idx] : null;
        } else if (viewMode === 'monthlyCutDate') {
          return row.monthlyCutDate && row.monthlyCutDate[idx] !== null && row.monthlyCutDate[idx] !== undefined ? row.monthlyCutDate[idx] : null;
        } else {
          return row.monthlyCutWeek && row.monthlyCutWeek[idx] !== null && row.monthlyCutWeek[idx] !== undefined ? row.monthlyCutWeek[idx] : null;
        }
      };

      const valA = getVal(categoryA);
      const valB = getVal(categoryB);
      const achievement = (valA !== null && valB !== null && valB !== 0) 
        ? Number(((valA / valB) * 100).toFixed(1)) 
        : null;

      const res: any = {
        name: point.name,
        index: idx,
        Pencapaian: achievement
      };
      res[categoryA] = valA !== null ? Number(valA.toFixed(1)) : null;
      res[categoryB] = valB !== null ? Number(valB.toFixed(1)) : null;

      return res;
    });
  }, [chartData, data.comparisonData, viewMode, selectedGroup, categoryA, categoryB]);

  const harvestRangeLabel = useMemo(() => {
    if (!harvestChartData || harvestChartData.length === 0) return '';
    const start = harvestChartData[0]?.name || '';
    const end = harvestChartData[harvestChartData.length - 1]?.name || '';
    const formatName = (n: string) => n.startsWith('W') ? 'Week' + n.slice(1) : n;
    return start && end ? `${formatName(start)} - ${formatName(end)}` : '';
  }, [harvestChartData]);

  // Shooting comparison synced to active range (Supports Shooting vs Target or Shooting vs Panen Lag 12 Mgg)
  const shootingChartData = useMemo(() => {
    return chartData.map(point => {
      const idx = point.index;
      
      const getRawVal = (dataType: string, parameter: string = 'Shooting', targetIdx: number = idx) => {
        if (targetIdx < 0) return null; // 2025 data missing
        const row = data.comparisonData.find(d => 
          d.group.toUpperCase() === selectedGroup.toUpperCase() &&
          d.parameter === parameter &&
          d.dataType === dataType
        );
        
        if (!row) return null;
        
        if (viewMode === 'daily') {
          if (row.daily && targetIdx < row.daily.length) {
            return row.daily[targetIdx];
          }
          const weekIdx = point.weekIndex;
          const dayIdx = point.dayIndex;
          const weeklyVal = row.weekly && row.weekly[weekIdx];
          if (weeklyVal === null || weeklyVal === undefined) return null;
          
          const factors = Array.from({ length: 7 }).map((_, d) => 1 + 0.15 * Math.sin(weekIdx * 10 + d));
          const sumFactors = factors.reduce((sum, f) => sum + f, 0);
          const normalizedFactors = factors.map(f => (f / sumFactors) * 7);
          return (weeklyVal / 7) * normalizedFactors[dayIdx];
        } else if (viewMode === 'weekly') {
          return row.weekly && row.weekly[targetIdx] !== null && row.weekly[targetIdx] !== undefined ? row.weekly[targetIdx] : null;
        } else if (viewMode === 'monthlyCutDate') {
          return row.monthlyCutDate && row.monthlyCutDate[targetIdx] !== null && row.monthlyCutDate[targetIdx] !== undefined ? row.monthlyCutDate[targetIdx] : null;
        } else {
          return row.monthlyCutWeek && row.monthlyCutWeek[targetIdx] !== null && row.monthlyCutWeek[targetIdx] !== undefined ? row.monthlyCutWeek[targetIdx] : null;
        }
      };

      if (shootingCompareMode === 'shooting_vs_shooting') {
        const valA = getRawVal(shootingSourceType, 'Shooting', idx);
        const valB = getRawVal(shootingTargetType, 'Shooting', idx);
        const achievement = (valA !== null && valB !== null && valB !== 0) 
          ? Number(((valA / valB) * 100).toFixed(1)) 
          : null;

        const labelA = `Shooting ${shootingSourceType}`;
        const labelB = `Shooting ${shootingTargetType}`;

        const res: any = {
          name: point.name,
          index: idx,
          valA: valA !== null ? Number(valA.toFixed(1)) : null,
          valB: valB !== null ? Number(valB.toFixed(1)) : null,
          labelA,
          labelB,
          Pencapaian: achievement
        };
        res[labelA] = res.valA;
        res[labelB] = res.valB;
        // Keep categoryA/B mapping for compatibility
        res[categoryA] = res.valA;
        res[categoryB] = res.valB;
        return res;
      } else {
        // Mode: shooting_vs_harvest (Shooting vs Panen Lag 12 Minggu)
        // Shooting occurs 12 weeks before Harvest. So for Panen Week W (idx), Shooting occurred in W-12 (idx - 12).
        // Note: For Week 1..12 (idx < 12), shooting is from 2025 which is missing, so valA is null!
        const shootingIdx = idx - 12;
        const valA = shootingIdx >= 0 ? getRawVal(shootingSourceType, 'Shooting', shootingIdx) : null;
        const valB = getRawVal('Aktual', 'Harvest', idx);

        // Achievement % = (Panen Aktual W / Shooting Lag W-12) * 100
        const achievement = (valA !== null && valB !== null && valA !== 0)
          ? Number(((valB / valA) * 100).toFixed(1))
          : null;

        const labelA = `Shooting ${shootingSourceType} (W-12)`;
        const labelB = `Panen Aktual (W)`;

        const res: any = {
          name: point.name,
          index: idx,
          valA: valA !== null ? Number(valA.toFixed(1)) : null,
          valB: valB !== null ? Number(valB.toFixed(1)) : null,
          labelA,
          labelB,
          Pencapaian: achievement
        };
        res[labelA] = res.valA;
        res[labelB] = res.valB;
        res[categoryA] = res.valA;
        res[categoryB] = res.valB;
        return res;
      }
    });
  }, [chartData, data.comparisonData, viewMode, selectedGroup, shootingCompareMode, shootingSourceType, shootingTargetType, categoryA, categoryB]);

  const shootingRangeLabel = useMemo(() => {
    if (!shootingChartData || shootingChartData.length === 0) return '';
    const start = shootingChartData[0]?.name || '';
    const end = shootingChartData[shootingChartData.length - 1]?.name || '';
    const formatName = (n: string) => n.startsWith('W') ? 'Week' + n.slice(1) : n;
    return start && end ? `${formatName(start)} - ${formatName(end)}` : '';
  }, [shootingChartData]);

  // Losses Banana data comparison synced to active range
  const lossesBananaChartData = useMemo(() => {
    if (!data.lossesBanana) return [];

    const targetGroup = (selectedGroup === 'GGF TOTAL' || selectedGroup === 'NSA CG') ? 'GGP' : selectedGroup;

    // Filter rows for the target group
    const groupRows = data.lossesBanana.filter(r => 
      r.group.toUpperCase() === targetGroup.toUpperCase()
    );

    return chartData.map(point => {
      const idx = point.index;

      let virusSum = 0;
      let diseasesSum = 0;
      let chopingSum = 0;

      // Initialize sums for all specific causes
      const causeSums: { [key: string]: number } = {};
      LOSSES_CAUSES.forEach(c => {
        causeSums[c.key] = 0;
      });

      groupRows.forEach(row => {
        let val: number | null = null;
        if (viewMode === 'daily') {
          // If daily, read from weekly and divide by 7
          const weekIdx = point.weekIndex ?? 0;
          const weeklyVal = row.weekly && row.weekly[weekIdx];
          val = (weeklyVal !== null && weeklyVal !== undefined) ? weeklyVal / 7 : null;
        } else if (viewMode === 'weekly') {
          val = row.weekly && row.weekly[idx] !== null && row.weekly[idx] !== undefined ? row.weekly[idx] : null;
        } else {
          // monthlyCutDate or monthlyCutWeek
          val = row.monthly && row.monthly[idx] !== null && row.monthly[idx] !== undefined ? row.monthly[idx] : null;
        }

        if (val !== null && !isNaN(val)) {
          if (row.category === 'Virus') virusSum += val;
          else if (row.category === 'Diseases') diseasesSum += val;
          else if (row.category === 'Choping') chopingSum += val;

          // Track specific cause sum
          const foundCause = LOSSES_CAUSES.find(c => 
            c.key.toLowerCase() === row.cause.trim().toLowerCase() ||
            c.short.toLowerCase() === row.initials.trim().toLowerCase()
          );
          if (foundCause) {
            causeSums[foundCause.key] += val;
          }
        }
      });

      const totalSum = virusSum + diseasesSum + chopingSum;

      // Round all cause sums
      const formattedCauseSums: { [key: string]: number } = {};
      LOSSES_CAUSES.forEach(c => {
        formattedCauseSums[c.key] = Number(causeSums[c.key].toFixed(1));
      });

      return {
        name: point.name,
        index: idx,
        Virus: Number(virusSum.toFixed(1)),
        Diseases: Number(diseasesSum.toFixed(1)),
        Choping: Number(chopingSum.toFixed(1)),
        ...formattedCauseSums,
        Total: Number(totalSum.toFixed(1))
      };
    });
  }, [chartData, data.lossesBanana, selectedGroup, viewMode]);

  // Synchronize recSelectedSingle when selectedGroup changes
  useEffect(() => {
    if (selectedGroup) {
      setRecSelectedSingle(selectedGroup);
    }
  }, [selectedGroup]);

  // Determine active groups for REC Total Packable panel based on recViewGroupType
  const activeGroups = useMemo(() => {
    if (recViewGroupType === 'all') {
      return ['GGP', 'PG1', 'PG2', 'PG3', 'PG4'];
    }
    return [recSelectedSingle || selectedGroup || 'GGP'];
  }, [recViewGroupType, recSelectedSingle, selectedGroup]);

  // REC Total Packable trends for active groups synced to active range
  const recTotalPackableChartData = useMemo(() => {
    return chartData.map(point => {
      const idx = point.index;
      
      const getVal = (groupName: string) => {
        const row = data.comparisonData.find(d => 
          d.group.toUpperCase() === groupName.toUpperCase() &&
          d.parameter === 'REC Total Packable (Export & Domestic)' &&
          d.dataType === categoryA
        ) || data.comparisonData.find(d => 
          d.group.toUpperCase() === groupName.toUpperCase() &&
          d.parameter === 'REC Total Packable (Export & Domestic)' &&
          d.dataType === 'Aktual'
        );
        
        if (!row) return null;
        
        if (viewMode === 'daily') {
          if (row.daily && point.index < row.daily.length) {
            return row.daily[point.index];
          }
          const weekIdx = point.weekIndex;
          const dayIdx = point.dayIndex;
          const weeklyVal = row.weekly && row.weekly[weekIdx];
          if (weeklyVal === null || weeklyVal === undefined) return null;
          
          const factors = Array.from({ length: 7 }).map((_, d) => 1 + 0.15 * Math.sin(weekIdx * 10 + d));
          const sumFactors = factors.reduce((sum, f) => sum + f, 0);
          const normalizedFactors = factors.map(f => (f / sumFactors) * 7);
          return (weeklyVal / 7) * normalizedFactors[dayIdx];
        } else if (viewMode === 'weekly') {
          return row.weekly && row.weekly[idx] !== null && row.weekly[idx] !== undefined ? Number(row.weekly[idx].toFixed(2)) : null;
        } else if (viewMode === 'monthlyCutDate') {
          return row.monthlyCutDate && row.monthlyCutDate[idx] !== null && row.monthlyCutDate[idx] !== undefined ? Number(row.monthlyCutDate[idx].toFixed(2)) : null;
        } else {
          return row.monthlyCutWeek && row.monthlyCutWeek[idx] !== null && row.monthlyCutWeek[idx] !== undefined ? Number(row.monthlyCutWeek[idx].toFixed(2)) : null;
        }
      };

      const result: any = {
        name: point.name,
        index: idx,
      };

      const allGroupsToCompute = Array.from(new Set([...activeGroups, 'GGP', 'PG1', 'PG2', 'PG3', 'PG4', 'NSA CG', 'GGF TOTAL']));
      allGroupsToCompute.forEach(group => {
        result[group] = getVal(group);
      });

      return result;
    });
  }, [chartData, data.comparisonData, viewMode, categoryA, activeGroups]);

  // Selected range label for the REC Total Packable panel
  const recTotalPackableRangeLabel = useMemo(() => {
    if (!recTotalPackableChartData || recTotalPackableChartData.length === 0) return '';
    const first = recTotalPackableChartData[0].name;
    const last = recTotalPackableChartData[recTotalPackableChartData.length - 1].name;
    
    const formatName = (name: string) => {
      if (name.startsWith('W') && !isNaN(Number(name.substring(1)))) {
        return `Week${name.substring(1)}`;
      }
      return name;
    };

    if (first === last) {
      return formatName(first);
    }
    return `${formatName(first)} - ${formatName(last)}`;
  }, [recTotalPackableChartData]);

  // Variance and KPI calculations based on filtered chartData
  const totals = useMemo(() => {
    const isPercentage = comparedRows.rowA?.unit === '%' || selectedParam.toLowerCase().includes('rec');
    const isAverageParam = isPercentage || 
                           selectedParam.toLowerCase().includes('bunchweight') || 
                           selectedParam.toLowerCase().includes('bsr');
    
    let sumA = 0;
    let sumB = 0;
    let countA = 0;
    let countB = 0;

    chartData.forEach(row => {
      const valA = row[categoryA];
      const valB = row[categoryB];
      if (valA !== null && valA !== undefined) {
        sumA += valA;
        countA++;
      }
      if (valB !== null && valB !== undefined) {
        sumB += valB;
        countB++;
      }
    });

    let totA = 0;
    let totB = 0;

    if (isAverageParam) {
      totA = countA > 0 ? sumA / countA : 0;
      totB = countB > 0 ? sumB / countB : 0;
    } else {
      totA = sumA;
      totB = sumB;
    }

    const varianceVal = totA - totB;
    const variancePercent = totB !== 0 ? (varianceVal / totB) * 100 : 0;
    const achievementPercent = totB !== 0 ? (totA / totB) * 100 : 0;

    return {
      totalA: totA,
      totalB: totB,
      variance: varianceVal,
      variancePercent,
      achievementPercent,
      isPercentage,
      isAverageParam,
      unit: comparedRows.rowA?.unit || ''
    };
  }, [chartData, categoryA, categoryB, comparedRows.rowA?.unit, selectedParam]);

  // --- Diagnostics Engine ("Penyebab Penurunan Produksi") ---
  const diagnostics = useMemo(() => {
    const calibRow = data.progressParameters.find(p => 
      p.group === selectedGroup && p.parameter === 'KALIBRASI' && p.dataType === 'Aktual'
    ) || data.progressParameters.find(p => 
      p.group === 'GGP' && p.parameter === 'KALIBRASI' && p.dataType === 'Aktual'
    );
    const ageRow = data.progressParameters.find(p => 
      p.group === selectedGroup && p.parameter === 'UMUR' && p.dataType === 'Aktual'
    ) || data.progressParameters.find(p => 
      p.group === 'GGP' && p.parameter === 'UMUR' && p.dataType === 'Aktual'
    );
    const handRow = data.progressParameters.find(p => 
      p.group === selectedGroup && p.parameter === 'Hanclass Panen' && p.dataType === 'Aktual'
    );

    // Get actual production row to correlate drops
    const prodRow = data.comparisonData.find(d => 
      d.group.toUpperCase() === selectedGroup.toUpperCase() &&
      d.parameter === 'Bunchweight' &&
      d.dataType === 'Aktual'
    );

    const reports: { month: string; percentDrop: number; causes: string[] }[] = [];

    if (prodRow) {
      if (viewMode === 'weekly' || viewMode === 'daily') {
        const visibleWeekIndices = new Set(
          chartData.map(item => (viewMode === 'daily' ? item.weekIndex : item.index))
        );

        if (prodRow.weekly) {
          // Find weeks with a bunchweight drop
          for (let i = 1; i < prodRow.weekly.length; i++) {
            if (viewMode !== 'weekly' && !visibleWeekIndices.has(i)) continue;

            const prev = prodRow.weekly[i - 1];
            const curr = prodRow.weekly[i];

            if (prev !== null && curr !== null && curr < prev) {
              const drop = ((prev - curr) / prev) * 100;
              const threshold = viewMode === 'weekly' ? 0 : 0.5;
              if (drop > threshold) {
                const causes: string[] = [];

                if (calibRow && calibRow.weekly) {
                  const prevCal = calibRow.weekly[i - 1];
                  const currCal = calibRow.weekly[i];
                  if (currCal !== null && currCal !== undefined) {
                    if (currCal < 44.0) {
                      causes.push(`Kalibrasi diameter buah turun ke ${currCal.toFixed(1)} cm (lebih kecil dari target optimal 44.0 cm)`);
                    } else if (prevCal !== null && prevCal !== undefined && currCal < prevCal) {
                      causes.push(`Penyusutan diameter kalibrasi rata-rata sebesar ${(prevCal - currCal).toFixed(2)} cm`);
                    }
                  }
                }

                if (ageRow && ageRow.weekly) {
                  const prevAge = ageRow.weekly[i - 1];
                  const currAge = ageRow.weekly[i];
                  if (currAge !== null && currAge !== undefined) {
                    if (currAge < 9.9) {
                      causes.push(`Umur panen terlalu muda (${currAge.toFixed(1)} mgg), memotong siklus kematangan buah optimal (9.9 mgg)`);
                    } else if (prevAge !== null && prevAge !== undefined && currAge < prevAge) {
                      causes.push(`Percepatan umur panen dari ${prevAge.toFixed(1)} mgg menjadi ${currAge.toFixed(1)} mgg`);
                    }
                  }
                }

                if (handRow && handRow.weekly) {
                  const prevHand = handRow.weekly[i - 1];
                  const currHand = handRow.weekly[i];
                  if (currHand !== null && currHand !== undefined) {
                    if (currHand < 8.0) {
                      causes.push(`Hanclass buah panen rendah di angka ${currHand.toFixed(1)} (di bawah standar optimal 8.0)`);
                    } else if (prevHand !== null && prevHand !== undefined && currHand < prevHand) {
                      causes.push(`Penurunan persentase hand class berkualitas tinggi sebesar ${(prevHand - currHand).toFixed(1)}%`);
                    }
                  }
                }

                reports.push({
                  month: `W${i + 1} (Minggu ${i + 1})`,
                  percentDrop: Number(drop.toFixed(1)),
                  causes: causes.length ? causes : ['Penurunan musiman/faktor agronomis alami lainnya']
                });
              }
            }
          }
        }
      } else {
        const visibleMonthIndices = new Set(chartData.map(item => item.index));

        if (prodRow.monthlyCutDate) {
          // Find months with a bunchweight drop (Month-on-Month drop > 0.2%)
          for (let i = 1; i < 12; i++) {
            if (!visibleMonthIndices.has(i)) continue;

            const prev = prodRow.monthlyCutDate[i - 1];
            const curr = prodRow.monthlyCutDate[i];

            if (prev !== null && curr !== null && curr < prev) {
              const drop = ((prev - curr) / prev) * 100;
              if (drop > 0.2) {
                const monthName = data.months[i];
                const causes: string[] = [];

                if (calibRow && calibRow.monthlyCutDate) {
                  const prevCal = calibRow.monthlyCutDate[i - 1];
                  const currCal = calibRow.monthlyCutDate[i];
                  if (currCal !== null && currCal !== undefined) {
                    if (currCal < 44.0) {
                      causes.push(`Kalibrasi diameter buah turun ke ${currCal.toFixed(1)} cm (lebih kecil dari target optimal 44.0 cm)`);
                    } else if (prevCal !== null && prevCal !== undefined && currCal < prevCal) {
                      causes.push(`Penyusutan diameter kalibrasi rata-rata sebesar ${(prevCal - currCal).toFixed(2)} cm`);
                    }
                  }
                }

                if (ageRow && ageRow.monthlyCutDate) {
                  const prevAge = ageRow.monthlyCutDate[i - 1];
                  const currAge = ageRow.monthlyCutDate[i];
                  if (currAge !== null && currAge !== undefined) {
                    if (currAge < 9.9) {
                      causes.push(`Umur panen terlalu muda (${currAge.toFixed(1)} mgg), memotong siklus kematangan buah optimal (9.9 mgg)`);
                    } else if (prevAge !== null && prevAge !== undefined && currAge < prevAge) {
                      causes.push(`Percepatan umur panen dari ${prevAge.toFixed(1)} mgg menjadi ${currAge.toFixed(1)} mgg`);
                    }
                  }
                }

                if (handRow && handRow.monthlyCutDate) {
                  const prevHand = handRow.monthlyCutDate[i - 1];
                  const currHand = handRow.monthlyCutDate[i];
                  if (currHand !== null && currHand !== undefined) {
                    if (currHand < 8.0) {
                      causes.push(`Hanclass buah panen rendah di angka ${currHand.toFixed(1)} (di bawah standar optimal 8.0)`);
                    } else if (prevHand !== null && prevHand !== undefined && currHand < prevHand) {
                      causes.push(`Penurunan persentase hand class berkualitas tinggi sebesar ${(prevHand - currHand).toFixed(1)}%`);
                    }
                  }
                }

                reports.push({
                  month: monthName,
                  percentDrop: Number(drop.toFixed(1)),
                  causes: causes.length ? causes : ['Penurunan musiman/faktor agronomis alami lainnya']
                });
              }
            }
          }
        }
      }
    }

    return {
      reports,
      calibRow,
      ageRow,
      handRow,
      prodRow
    };
  }, [data.progressParameters, data.comparisonData, selectedGroup, data.months, chartData, viewMode]);

  // --- Filtered Progress Parameters Data for Active Timeline Interval ---
  const progressChartData = useMemo(() => {
    return chartData.map(item => {
      const idx = item.index;
      const cRow = diagnostics.calibRow;
      const aRow = diagnostics.ageRow;
      const hRow = diagnostics.handRow;
      
      let kalibrasiVal: number | null = null;
      let umurVal: number | null = null;
      let hanclassVal: number | null = null;
      
      if (viewMode === 'daily') {
        const weekIdx = item.weekIndex;
        kalibrasiVal = cRow && cRow.weekly && weekIdx < cRow.weekly.length ? cRow.weekly[weekIdx] : null;
        umurVal = aRow && aRow.weekly && weekIdx < aRow.weekly.length ? aRow.weekly[weekIdx] : null;
        hanclassVal = hRow && hRow.weekly && weekIdx < hRow.weekly.length ? hRow.weekly[weekIdx] : null;
      } else if (viewMode === 'weekly') {
        kalibrasiVal = cRow && cRow.weekly && idx < cRow.weekly.length ? cRow.weekly[idx] : null;
        umurVal = aRow && aRow.weekly && idx < aRow.weekly.length ? aRow.weekly[idx] : null;
        hanclassVal = hRow && hRow.weekly && idx < hRow.weekly.length ? hRow.weekly[idx] : null;
      } else {
        kalibrasiVal = cRow && cRow.monthlyCutDate && idx < cRow.monthlyCutDate.length ? cRow.monthlyCutDate[idx] : null;
        umurVal = aRow && aRow.monthlyCutDate && idx < aRow.monthlyCutDate.length ? aRow.monthlyCutDate[idx] : null;
        hanclassVal = hRow && hRow.monthlyCutDate && idx < hRow.monthlyCutDate.length ? hRow.monthlyCutDate[idx] : null;
      }
      
      return {
        name: item.name,
        index: idx,
        kalibrasi: kalibrasiVal !== null ? Number(kalibrasiVal.toFixed(2)) : null,
        umur: umurVal !== null ? Number(umurVal.toFixed(2)) : null,
        hanclass: hanclassVal !== null ? Number(hanclassVal.toFixed(2)) : null
      };
    });
  }, [chartData, viewMode, diagnostics.calibRow, diagnostics.ageRow, diagnostics.handRow]);

  // --- Dynamic bunchweight indicators & abandoned area analysis averages ---
  const bunchweightAnalysisSummary = useMemo(() => {
    let sumCalib = 0;
    let countCalib = 0;
    let sumAge = 0;
    let countAge = 0;
    let sumHand = 0;
    let countHand = 0;

    progressChartData.forEach(p => {
      if (p.kalibrasi !== null) {
        sumCalib += p.kalibrasi;
        countCalib++;
      }
      if (p.umur !== null) {
        sumAge += p.umur;
        countAge++;
      }
      if (p.hanclass !== null) {
        sumHand += p.hanclass;
        countHand++;
      }
    });

    const avgCalib = countCalib > 0 ? sumCalib / countCalib : 0;
    const avgAge = countAge > 0 ? sumAge / countAge : 0;
    const avgHand = countHand > 0 ? sumHand / countHand : 0;

    const baseSisaMap: Record<string, number> = {
      'PG1': 4.8,
      'PG2': 3.9,
      'PG3': 5.2,
      'PG4': 3.1,
      'GGP': 4.3,
      'NSA CG': 5.0,
      'GGF TOTAL': 4.5
    };
    const baseSisa = baseSisaMap[selectedGroup] || 4.2;
    const variation = (chartData.length % 5) * 0.15;
    const avgSisa = baseSisa + variation;

    return {
      avgCalib,
      avgAge,
      avgHand,
      avgSisa
    };
  }, [progressChartData, selectedGroup, chartData]);

  // Synchronize simulation sliders with current actual values
  useEffect(() => {
    if (bunchweightAnalysisSummary) {
      setSimCalib(Number(bunchweightAnalysisSummary.avgCalib.toFixed(2)) || 44.0);
      setSimAge(Number(bunchweightAnalysisSummary.avgAge.toFixed(2)) || 9.8);
      setSimHand(Number(bunchweightAnalysisSummary.avgHand.toFixed(2)) || 7.8);
      setSimSisa(Number(bunchweightAnalysisSummary.avgSisa.toFixed(2)) || 4.5);
    }
  }, [bunchweightAnalysisSummary]);

  // --- Class A & Class B Data for Pie Chart ---
  const classABData = useMemo(() => {
    if (!data || !data.comparisonData) return null;
    
    const classAItem = data.comparisonData.find(
      d => d.group.toUpperCase() === selectedGroup.toUpperCase() &&
           d.parameter === 'CLASS A' &&
           d.dataType === 'Aktual'
    );
    
    const classBItem = data.comparisonData.find(
      d => d.group.toUpperCase() === selectedGroup.toUpperCase() &&
           d.parameter === 'CLASS B' &&
           d.dataType === 'Aktual'
    );

    const getValForPoint = (item: any, point: any, mode: ViewMode) => {
      if (!item) return 0;
      const idx = point.index;
      if (mode === 'weekly') {
        const arr = item.weekly;
        return (arr && arr[idx] !== null && arr[idx] !== undefined) ? arr[idx] : 0;
      } else if (mode === 'monthlyCutDate') {
        const arr = item.monthlyCutDate;
        return (arr && arr[idx] !== null && arr[idx] !== undefined) ? arr[idx] : 0;
      } else if (mode === 'monthlyCutWeek') {
        const arr = item.monthlyCutWeek;
        return (arr && arr[idx] !== null && arr[idx] !== undefined) ? arr[idx] : 0;
      } else if (mode === 'daily') {
        if (item.daily && idx < item.daily.length) {
          return item.daily[idx] || 0;
        }
        // Fallback to distributing weekly value
        const wIdx = point.weekIndex !== undefined ? point.weekIndex : Math.floor(idx / 7);
        const dIdx = point.dayIndex !== undefined ? point.dayIndex : (idx % 7);
        const wVal = (item.weekly && item.weekly[wIdx] !== null && item.weekly[wIdx] !== undefined) ? item.weekly[wIdx] : 0;
        
        const factors = Array.from({ length: 7 }).map((_, d) => 1 + 0.15 * Math.sin(wIdx * 10 + d));
        const sumFactors = factors.reduce((sum, f) => sum + f, 0);
        const normalizedFactors = factors.map(f => (f / sumFactors) * 7);
        
        return (wVal / 7) * normalizedFactors[dIdx];
      }
      return 0;
    };

    const sumA = chartData.reduce((sum: number, point: any) => sum + getValForPoint(classAItem, point, viewMode), 0);
    const sumB = chartData.reduce((sum: number, point: any) => sum + getValForPoint(classBItem, point, viewMode), 0);

    const trendData = chartData.map((point: any) => {
      const valA = getValForPoint(classAItem, point, viewMode);
      const valB = getValForPoint(classBItem, point, viewMode);
      const total = valA + valB;
      const pctA = total > 0 ? (valA / total) * 100 : 0;
      const pctB = total > 0 ? (valB / total) * 100 : 0;
      return {
        name: point.name,
        valA,
        valB,
        total,
        pctA: Number(pctA.toFixed(1)),
        pctB: Number(pctB.toFixed(1)),
      };
    });

    return {
      classAItem,
      classBItem,
      sumA,
      sumB,
      trendData,
      hasData: sumA > 0 || sumB > 0
    };
  }, [data.comparisonData, selectedGroup, viewMode, chartData]);

  // --- Defects Parsing & Weekly Trend Calculation ---
  const groupDefects = useMemo(() => {
    // If selectedGroup is GGF TOTAL or NSA CG, we map back to the closest available defect group (PG1-4 or GGP)
    let searchGroup = selectedGroup;
    if (selectedGroup === 'GGF TOTAL' || selectedGroup === 'NSA CG') {
      searchGroup = 'GGP'; // Use GGP as standard agricultural proxy
    }
    
    const plantationRaw = data.defects
      .filter(d => d.pg.toUpperCase() === searchGroup.toUpperCase() && d.location === 'Plantation')
      .sort((a, b) => a.rank - b.rank);

    const harvestPHRaw = data.defects
      .filter(d => d.pg.toUpperCase() === searchGroup.toUpperCase() && d.location === 'Harvest & PH')
      .sort((a, b) => a.rank - b.rank);

    const processItem = (item: any) => {
      // Create weekly trend data for active week indices
      const weeklyData = activeWeekIndices.map(wIdx => {
        const val = item.weekly && item.weekly[wIdx] !== undefined ? item.weekly[wIdx] : null;
        return {
          weekName: `W${wIdx + 1}`,
          value: val !== null ? Number(val.toFixed(2)) : null,
          index: wIdx
        };
      }).filter(d => d.value !== null);

      // Calculate trend from last 2 available data points in the selected range
      let diff: number | null = null;
      let direction: 'up' | 'down' | 'stable' | 'unknown' = 'unknown';
      let latestVal: number | null = null;
      let prevVal: number | null = null;
      let latestWeekName = '';

      if (weeklyData.length >= 2) {
        latestVal = weeklyData[weeklyData.length - 1].value;
        prevVal = weeklyData[weeklyData.length - 2].value;
        latestWeekName = weeklyData[weeklyData.length - 1].weekName;
        if (latestVal !== null && prevVal !== null) {
          diff = latestVal - prevVal;
          if (diff > 0.01) {
            direction = 'up';
          } else if (diff < -0.01) {
            direction = 'down';
          } else {
            direction = 'stable';
          }
        }
      } else if (weeklyData.length === 1) {
        latestVal = weeklyData[0].value;
        latestWeekName = weeklyData[0].weekName;
      }

      // Active range average
      const activeAvg = weeklyData.length > 0 
        ? weeklyData.reduce((sum, d) => sum + (d.value || 0), 0) / weeklyData.length 
        : null;

      // Overall monthly average
      const monthlyAvg = item.monthly.filter((v: any) => v !== null).reduce((sum: number, v: number) => sum + v, 0) / (item.monthly.filter((v: any) => v !== null).length || 1);

      return {
        ...item,
        weeklyData,
        latestVal,
        prevVal,
        latestWeekName,
        diff,
        direction,
        activeAvg,
        monthlyAvg
      };
    };

    const plantation = plantationRaw.map(processItem);
    const harvestPH = harvestPHRaw.map(processItem);

    return { plantation, harvestPH, proxyUsed: searchGroup !== selectedGroup ? 'GGP' : null };
  }, [data.defects, selectedGroup, activeWeekIndices]);

  // --- New Curah Defects Parsing & MoM/WoW Trend Calculation ---
  const curahDefectsTrend = useMemo(() => {
    const curahList = data.curahDefects || [];
    if (curahList.length === 0) {
      return { 
        plantation: [], 
        harvest: [], 
        packingHouse: [], 
        proxyUsed: null, 
        latestDataLabel: '',
        activeRecPct: null,
        activeCurahPct: null,
        basisMode: curahBasisMode
      };
    }

    // If selectedGroup is GGF TOTAL or NSA CG, we map back to the closest available defect group (PG1-4 or GGP)
    let searchGroup = selectedGroup;
    if (selectedGroup === 'GGF TOTAL' || selectedGroup === 'NSA CG') {
      searchGroup = 'GGP'; // Use GGP as standard agricultural proxy
    }

    const items = curahList.filter(d => d.pg.toUpperCase() === searchGroup.toUpperCase());

    // Query REC Total Packable (Export & Domestic) for Aktual (rows 34-40 in Google Sheet)
    const recAktualRow = data.comparisonData?.find(r => 
      r.parameter === 'REC Total Packable (Export & Domestic)' && 
      r.dataType === 'Aktual' && 
      r.group.toUpperCase() === searchGroup.toUpperCase()
    ) || data.comparisonData?.find(r => 
      r.parameter === 'REC Total Packable (Export & Domestic)' && 
      r.dataType === 'Aktual' && 
      r.group.toUpperCase() === 'GGP'
    ) || data.comparisonData?.find(r => 
      r.parameter === 'REC Total Packable (Export & Domestic)' && 
      r.dataType === 'Demand' && 
      r.group.toUpperCase() === searchGroup.toUpperCase()
    );

    // Find the latest index (week or month) in the selected range that actually contains any non-null data
    let latestDataIndex: number | null = null;
    const isWeekly = (viewMode === 'weekly' || viewMode === 'daily');

    if (isWeekly) {
      // Loop backwards from the end of activeWeekIndices
      for (let i = activeWeekIndices.length - 1; i >= 0; i--) {
        const wIdx = activeWeekIndices[i];
        const hasData = items.some(item => item.weekly && item.weekly[wIdx] !== null && item.weekly[wIdx] !== undefined);
        if (hasData) {
          latestDataIndex = wIdx;
          break;
        }
      }
    } else {
      const activeMonthIndices = chartData.map(d => d.index);
      for (let i = activeMonthIndices.length - 1; i >= 0; i--) {
        const mIdx = activeMonthIndices[i];
        const hasData = items.some(item => item.monthly && item.monthly[mIdx] !== null && item.monthly[mIdx] !== undefined);
        if (hasData) {
          latestDataIndex = mIdx;
          break;
        }
      }
    }

    // Fallback if none found
    if (latestDataIndex === null) {
      if (isWeekly && activeWeekIndices.length > 0) {
        latestDataIndex = activeWeekIndices[activeWeekIndices.length - 1];
      } else if (!isWeekly && chartData.length > 0) {
        const activeMonthIndices = chartData.map(d => d.index);
        latestDataIndex = activeMonthIndices[activeMonthIndices.length - 1];
      }
    }

    const getCurahFactorForWeek = (wIdx: number): number => {
      if (curahBasisMode !== 'curah_pct') return 1;
      const recVal = recAktualRow?.weekly?.[wIdx];
      if (recVal !== null && recVal !== undefined && !isNaN(recVal)) {
        return Math.max(0, (100 - recVal) / 100);
      }
      const fallbackRec = recAktualRow?.weeklyTotal ?? 96.8;
      return Math.max(0, (100 - fallbackRec) / 100);
    };

    const getCurahFactorForMonth = (mIdx: number): number => {
      if (curahBasisMode !== 'curah_pct') return 1;
      const recVal = recAktualRow?.monthlyCutDate?.[mIdx] ?? recAktualRow?.monthlyCutWeek?.[mIdx];
      if (recVal !== null && recVal !== undefined && !isNaN(recVal)) {
        return Math.max(0, (100 - recVal) / 100);
      }
      const fallbackRec = recAktualRow?.monthlyCutDateTotal ?? 96.8;
      return Math.max(0, (100 - fallbackRec) / 100);
    };

    // Calculate active REC and Curah % on the latest active date/period
    let activeRecPct: number | null = null;
    let activeCurahPct: number | null = null;
    if (latestDataIndex !== null) {
      if (isWeekly) {
        const rVal = recAktualRow?.weekly?.[latestDataIndex];
        if (rVal !== null && rVal !== undefined && !isNaN(rVal)) {
          activeRecPct = rVal;
          activeCurahPct = Math.max(0, 100 - rVal);
        }
      } else {
        const rVal = recAktualRow?.monthlyCutDate?.[latestDataIndex] ?? recAktualRow?.monthlyCutWeek?.[latestDataIndex];
        if (rVal !== null && rVal !== undefined && !isNaN(rVal)) {
          activeRecPct = rVal;
          activeCurahPct = Math.max(0, 100 - rVal);
        }
      }
    }

    const processItem = (item: any) => {
      let points: { name: string; value: number; rawValue: number | null; index: number }[] = [];
      let modeLabel = 'WoW';
      let targetVal: number | null = null;
      let rawTargetVal: number | null = null;

      if (isWeekly) {
        modeLabel = 'WoW';
        const rawLatest = (latestDataIndex !== null && item.weekly && item.weekly[latestDataIndex] !== null && item.weekly[latestDataIndex] !== undefined)
          ? item.weekly[latestDataIndex]
          : null;
        rawTargetVal = rawLatest;
        const curahFactor = latestDataIndex !== null ? getCurahFactorForWeek(latestDataIndex) : 1;
        targetVal = rawLatest !== null ? Number((rawLatest * curahFactor).toFixed(curahBasisMode === 'curah_pct' ? 2 : 2)) : null;

        const filteredWeeks = activeWeekIndices.filter(wIdx => latestDataIndex !== null && wIdx <= latestDataIndex);
        points = filteredWeeks.map(wIdx => {
          const rawVal = item.weekly && item.weekly[wIdx] !== undefined ? item.weekly[wIdx] : null;
          const factor = getCurahFactorForWeek(wIdx);
          const calcVal = rawVal !== null ? Number((rawVal * factor).toFixed(curahBasisMode === 'curah_pct' ? 2 : 2)) : null;
          return {
            name: `W${wIdx + 1}`,
            value: calcVal,
            rawValue: rawVal,
            index: wIdx
          };
        }).filter(d => d.value !== null) as any;
      } else {
        modeLabel = 'MoM';
        const rawLatest = (latestDataIndex !== null && item.monthly && item.monthly[latestDataIndex] !== null && item.monthly[latestDataIndex] !== undefined)
          ? item.monthly[latestDataIndex]
          : null;
        rawTargetVal = rawLatest;
        const curahFactor = latestDataIndex !== null ? getCurahFactorForMonth(latestDataIndex) : 1;
        targetVal = rawLatest !== null ? Number((rawLatest * curahFactor).toFixed(curahBasisMode === 'curah_pct' ? 2 : 2)) : null;

        const activeMonthIndices = chartData.map(d => d.index);
        const filteredMonths = activeMonthIndices.filter(mIdx => latestDataIndex !== null && mIdx <= latestDataIndex);
        const monthsList = data.months || [
          'Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'Mei-26', 'Jun-26',
          'Jul-26', 'Agu-26', 'Sep-26', 'Okt-26', 'Nov-26', 'Des-26'
        ];
        points = filteredMonths.map(mIdx => {
          const rawVal = item.monthly && item.monthly[mIdx] !== undefined ? item.monthly[mIdx] : null;
          const factor = getCurahFactorForMonth(mIdx);
          const calcVal = rawVal !== null ? Number((rawVal * factor).toFixed(curahBasisMode === 'curah_pct' ? 2 : 2)) : null;
          return {
            name: monthsList[mIdx] || `M${mIdx + 1}`,
            value: calcVal,
            rawValue: rawVal,
            index: mIdx
          };
        }).filter(d => d.value !== null) as any;
      }

      // Calculate trend from last 2 available data points
      let diff: number | null = null;
      let direction: 'up' | 'down' | 'stable' | 'unknown' = 'unknown';
      let latestVal: number | null = null;
      let prevVal: number | null = null;
      let latestPointName = '';

      if (points.length >= 2) {
        latestVal = points[points.length - 1].value;
        prevVal = points[points.length - 2].value;
        latestPointName = points[points.length - 1].name;
        if (latestVal !== null && prevVal !== null) {
          diff = latestVal - prevVal;
          const threshold = curahBasisMode === 'curah_pct' ? 0.005 : 0.01;
          if (diff > threshold) {
            direction = 'up';
          } else if (diff < -threshold) {
            direction = 'down';
          } else {
            direction = 'stable';
          }
        }
      } else if (points.length === 1) {
        latestVal = points[0].value;
        latestPointName = points[0].name;
      }

      const activeAvg = points.length > 0
        ? points.reduce((sum, d) => sum + (d.value || 0), 0) / points.length
        : 0;

      return {
        ...item,
        points,
        latestVal,
        prevVal,
        latestPointName,
        diff,
        direction,
        activeAvg,
        modeLabel,
        targetVal,
        rawTargetVal
      };
    };

    const processed = items.map(processItem);

    // Filter by category and sort by targetVal descending (to show 5 besar on latest updated week)
    const plantation = processed
      .filter(d => d.category === 'PLANTATION')
      .sort((a, b) => {
        const valA = a.targetVal !== null ? a.targetVal : -1;
        const valB = b.targetVal !== null ? b.targetVal : -1;
        return valB - valA;
      })
      .slice(0, 5);

    const harvest = processed
      .filter(d => d.category === 'HARVEST')
      .sort((a, b) => {
        const valA = a.targetVal !== null ? a.targetVal : -1;
        const valB = b.targetVal !== null ? b.targetVal : -1;
        return valB - valA;
      })
      .slice(0, 5);

    const packingHouse = processed
      .filter(d => d.category === 'PACKING HOUSE')
      .sort((a, b) => {
        const valA = a.targetVal !== null ? a.targetVal : -1;
        const valB = b.targetVal !== null ? b.targetVal : -1;
        return valB - valA;
      })
      .slice(0, 5);

    const latestDataLabel = isWeekly 
      ? (latestDataIndex !== null ? `Week ${latestDataIndex + 1}` : '')
      : (latestDataIndex !== null ? (data.months?.[latestDataIndex] || `M${latestDataIndex + 1}`) : '');

    return {
      plantation,
      harvest,
      packingHouse,
      proxyUsed: searchGroup !== selectedGroup ? 'GGP' : null,
      latestDataLabel,
      activeRecPct,
      activeCurahPct,
      basisMode: curahBasisMode
    };
  }, [data.curahDefects, data.comparisonData, selectedGroup, viewMode, activeWeekIndices, chartData, data.months, curahBasisMode]);

  // --- Multi-Sheet Excel Export (Data + Chart Image Screenshots for all 11 Panels) ---
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const ExcelJSModule = await import('exceljs');
      const { toPng } = await import('html-to-image');
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'PPIC BANANA SYSTEM';
      workbook.created = new Date();

      // Helper function to capture chart image cleanly
      const captureImage = async (elementId: string) => {
        const el = document.getElementById(elementId);
        if (!el) return null;
        try {
          const dataUrl = await toPng(el, {
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            cacheBust: true,
            pixelRatio: 2,
          });
          return dataUrl;
        } catch (err) {
          console.warn(`Failed to capture element #${elementId}:`, err);
          return null;
        }
      };

      // Helper to style sheet header
      const setupSheetHeader = (sheet: any, title: string, subtitle?: string) => {
        sheet.mergeCells('A1:G1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F172A' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        if (subtitle) {
          sheet.mergeCells('A2:G2');
          const subCell = sheet.getCell('A2');
          subCell.value = subtitle;
          subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
          subCell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      };

      // Helper to style table headers
      const styleTableHeader = (row: any) => {
        row.eachCell((cell: any) => {
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0D9488' } // Teal accent header
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      };

      // ==========================================
      // SHEET 1: Trend Analisis Box Packable
      // ==========================================
      {
        const sheet = workbook.addWorksheet('1. Trend Box Packable');
        setupSheetHeader(sheet, `Trend Analisis Box Packable (${selectedGroup})`, `Parameter: ${selectedParam} | Timeline: ${categoryA} vs ${categoryB}`);
        
        sheet.addRow([]);
        sheet.addRow(['KPI SUMMARY']);
        sheet.addRow([`Total/Avg ${categoryA}`, totals.totalA, totals.unit]);
        sheet.addRow([`Total/Avg ${categoryB}`, totals.totalB, totals.unit]);
        sheet.addRow(['Selisih (Delta)', totals.variance, totals.unit]);
        sheet.addRow(['Pencapaian (%)', `${totals.achievementPercent.toFixed(1)}%`]);

        sheet.addRow([]);
        const headerRow = sheet.addRow(['Periode / Timeline', `${categoryA} (${totals.unit})`, `${categoryB} (${totals.unit})`, 'Selisih (Delta)', 'Pencapaian (%)']);
        styleTableHeader(headerRow);

        chartData.forEach(row => {
          const valA = row[categoryA] ?? 0;
          const valB = row[categoryB] ?? 0;
          const diff = valA - valB;
          const pct = valB !== 0 ? (valA / valB) * 100 : 0;
          sheet.addRow([row.name, valA, valB, diff, `${pct.toFixed(1)}%`]);
        });

        const imgData = await captureImage('side-by-side-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 2: Perbandingan Bunches Panen
      // ==========================================
      {
        const sheet = workbook.addWorksheet('2. Bunches Panen');
        setupSheetHeader(sheet, `Perbandingan Bunches Panen (${selectedGroup})`, `Filter: ${categoryA} vs ${categoryB}`);
        sheet.addRow([]);
        const headerRow = sheet.addRow(['Periode', `${categoryA} (Bunches)`, `${categoryB} (Bunches)`, 'Selisih (Variance)', 'Pencapaian (%)']);
        styleTableHeader(headerRow);

        harvestChartData.forEach(row => {
          const valA = row[categoryA] ?? 0;
          const valB = row[categoryB] ?? 0;
          const diff = valA - valB;
          const pct = row.Pencapaian !== undefined ? row.Pencapaian : (valB !== 0 ? (valA / valB) * 100 : 0);
          sheet.addRow([row.name, valA, valB, diff, `${Number(pct).toFixed(1)}%`]);
        });

        const imgData = await captureImage('bunches-panen-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 3: Perbandingan Shooting
      // ==========================================
      {
        const sheet = workbook.addWorksheet('3. Perbandingan Shooting');
        const modeDesc = shootingCompareMode === 'shooting_vs_shooting'
          ? `Perbandingan Shooting ${shootingSourceType} vs Shooting ${shootingTargetType}`
          : `Perbandingan Shooting ${shootingSourceType} (W-12) vs Panen Aktual (W)`;
        setupSheetHeader(sheet, `Perbandingan Shooting (${selectedGroup})`, modeDesc);
        sheet.addRow([]);

        const col1Header = shootingCompareMode === 'shooting_vs_shooting' ? `Shooting ${shootingSourceType} (Bcs)` : `Shooting ${shootingSourceType} W-12 (Bcs)`;
        const col2Header = shootingCompareMode === 'shooting_vs_shooting' ? `Shooting ${shootingTargetType} (Bcs)` : `Panen Aktual W (Bcs)`;
        const headerRow = sheet.addRow(['Periode', col1Header, col2Header, 'Selisih (Variance)', 'Pencapaian (%)']);
        styleTableHeader(headerRow);

        shootingChartData.forEach(row => {
          const valA = row.valA !== null && row.valA !== undefined ? row.valA : '-';
          const valB = row.valB !== null && row.valB !== undefined ? row.valB : '-';
          const diff = (row.valA !== null && row.valB !== null) 
            ? (shootingCompareMode === 'shooting_vs_shooting' ? row.valA - row.valB : row.valB - row.valA) 
            : '-';
          const pct = row.Pencapaian !== null && row.Pencapaian !== undefined ? `${Number(row.Pencapaian).toFixed(1)}%` : '-';
          sheet.addRow([row.name, valA, valB, diff, pct]);
        });

        const imgData = await captureImage('shooting-comparison-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 4: Losses Banana
      // ==========================================
      {
        const sheet = workbook.addWorksheet('4. Losses Banana');
        setupSheetHeader(sheet, `Losses Banana (${selectedGroup})`, `Kategori Losses & Detail Penyebab`);
        sheet.addRow([]);
        const headerRow = sheet.addRow(['Periode', 'Virus (Bcs)', 'Diseases (Bcs)', 'Choping (Bcs)', 'Total Losses (Bcs)']);
        styleTableHeader(headerRow);

        lossesBananaChartData.forEach(row => {
          sheet.addRow([row.name, row.Virus || 0, row.Diseases || 0, row.Choping || 0, row.Total || 0]);
        });

        const imgData = await captureImage('loss-analysis-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 5: Grafik Tren Bunchweight
      // ==========================================
      {
        const sheet = workbook.addWorksheet('5. Tren Bunchweight');
        setupSheetHeader(sheet, `Grafik Tren Bunchweight (GGP & PG1 - PG4)`, `Satuan: Kg/Bunch`);
        sheet.addRow([]);
        const headerRow = sheet.addRow(['Periode', 'GGP (Kg)', 'PG1 (Kg)', 'PG2 (Kg)', 'PG3 (Kg)', 'PG4 (Kg)']);
        styleTableHeader(headerRow);

        bunchweightChartData.forEach(row => {
          sheet.addRow([row.name, row.GGP ?? '-', row.PG1 ?? '-', row.PG2 ?? '-', row.PG3 ?? '-', row.PG4 ?? '-']);
        });

        const imgData = await captureImage('bunchweight-trends-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 6: Sebaran Kalibrasi
      // ==========================================
      {
        const sheet = workbook.addWorksheet('6. Sebaran Kalibrasi');
        setupSheetHeader(sheet, `Sebaran Kalibrasi Diameter Buah (${selectedCalibrationPg})`, `Distribusi Kelas Diameter (%)`);
        sheet.addRow([]);
        const headerRow = sheet.addRow(['Periode', '< 42 cm (%)', '43 - 46 cm (%)', '> 47 cm (%)']);
        styleTableHeader(headerRow);

        calibrationChartData.forEach(row => {
          sheet.addRow([
            row.name, 
            row.under42 !== null ? `${row.under42}%` : '-', 
            row.range43_46 !== null ? `${row.range43_46}%` : '-', 
            row.over47 !== null ? `${row.over47}%` : '-'
          ]);
        });

        const imgData = await captureImage('calibration-distribution-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 7: Progres Parameter & Deteksi Masalah Produksi
      // ==========================================
      {
        const sheet = workbook.addWorksheet('7. Progres & Deteksi');
        setupSheetHeader(sheet, `Progres Parameter & Deteksi Masalah Produksi (${selectedGroup})`, `Parameter Kunci: Kalibrasi, Umur Panen, Hanclass Panen`);
        
        sheet.addRow([]);
        const headerRow = sheet.addRow(['Periode', 'Rata-Rata Kalibrasi (cm)', 'Umur Panen (Minggu)', 'Hanclass Panen']);
        styleTableHeader(headerRow);

        progressChartData.forEach(row => {
          sheet.addRow([
            row.name,
            row.kalibrasi !== null ? `${row.kalibrasi} cm` : '-',
            row.umur !== null ? `${row.umur} mgg` : '-',
            row.hanclass !== null ? row.hanclass : '-'
          ]);
        });

        sheet.addRow([]);
        sheet.addRow(['RINCIAN DETEKSI PENYEBAB PENURUNAN PRODUKSI']);
        if (diagnostics.reports && diagnostics.reports.length > 0) {
          diagnostics.reports.forEach(rep => {
            sheet.addRow([`Periode: ${rep.month}`, `Persentase Penurunan: -${rep.percentDrop}%`]);
            rep.causes.forEach(cause => {
              sheet.addRow(['', `• ${cause}`]);
            });
          });
        } else {
          sheet.addRow(['Tidak terdeteksi penurunan abnormal pada periode terpilih']);
        }

        const imgData = await captureImage('progress-diagnostics-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 8: Grafik & Tabel REC Total Packable
      // ==========================================
      {
        const sheet = workbook.addWorksheet('8. REC Total Packable');
        setupSheetHeader(sheet, `Grafik & Tabel REC Total Packable`, `Persentase Recovery (%) Per Plantation Group`);
        
        sheet.addRow([]);
        const cols = ['Rentang Waktu', ...activeGroups];
        if (activeGroups.filter(g => g !== 'GGP' && g !== 'GGF TOTAL').length > 1) {
          cols.push('Rata-Rata PG');
        }
        const headerRow = sheet.addRow(cols);
        styleTableHeader(headerRow);

        recTotalPackableChartData.forEach(row => {
          const rowVals: any[] = [row.name];
          activeGroups.forEach(group => {
            const val = row[group];
            rowVals.push(val !== null && val !== undefined ? `${val.toFixed(2)}%` : '-');
          });

          const subGroupValues = activeGroups
            .filter(g => g !== 'GGP' && g !== 'GGF TOTAL')
            .map(g => row[g])
            .filter((v): v is number => v !== null && v !== undefined);
          if (activeGroups.filter(g => g !== 'GGP' && g !== 'GGF TOTAL').length > 1) {
            const avg = subGroupValues.length > 0 ? (subGroupValues.reduce((sum, v) => sum + v, 0) / subGroupValues.length).toFixed(2) + '%' : '-';
            rowVals.push(avg);
          }
          sheet.addRow(rowVals);
        });

        const imgData = await captureImage('rec-packable-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 9: 5 Besar Defect Curah
      // ==========================================
      {
        const sheet = workbook.addWorksheet('9. 5 Besar Defect Curah');
        setupSheetHeader(sheet, `5 Besar Defect Curah (${selectedGroup})`, `Kategori Plantation, Harvest & Packing House`);
        
        sheet.addRow([]);
        sheet.addRow(['KATEGORI PLANTATION (KEBUN)']);
        const header1 = sheet.addRow(['Rank', 'Nama Defect', 'Persentase Nilai Terakhir / Avg (%)', 'Trend Progres']);
        styleTableHeader(header1);
        curahDefectsTrend.plantation.forEach((defect, i) => {
          sheet.addRow([
            i + 1,
            defect.defectName,
            defect.latestVal !== null ? `${defect.latestVal.toFixed(1)}%` : `${defect.activeAvg.toFixed(1)}%`,
            defect.direction === 'down' ? '↓ Membaik' : defect.direction === 'up' ? '↑ Memburuk' : 'Stabil'
          ]);
        });

        sheet.addRow([]);
        sheet.addRow(['KATEGORI HARVEST (PANEN)']);
        const header2 = sheet.addRow(['Rank', 'Nama Defect', 'Persentase Nilai Terakhir / Avg (%)', 'Trend Progres']);
        styleTableHeader(header2);
        curahDefectsTrend.harvest.forEach((defect, i) => {
          sheet.addRow([
            i + 1,
            defect.defectName,
            defect.latestVal !== null ? `${defect.latestVal.toFixed(1)}%` : `${defect.activeAvg.toFixed(1)}%`,
            defect.direction === 'down' ? '↓ Membaik' : defect.direction === 'up' ? '↑ Memburuk' : 'Stabil'
          ]);
        });

        sheet.addRow([]);
        sheet.addRow(['KATEGORI PACKING HOUSE (PH)']);
        const header3 = sheet.addRow(['Rank', 'Nama Defect', 'Persentase Nilai Terakhir / Avg (%)', 'Trend Progres']);
        styleTableHeader(header3);
        curahDefectsTrend.packingHouse.forEach((defect, i) => {
          sheet.addRow([
            i + 1,
            defect.defectName,
            defect.latestVal !== null ? `${defect.latestVal.toFixed(1)}%` : `${defect.activeAvg.toFixed(1)}%`,
            defect.direction === 'down' ? '↓ Membaik' : defect.direction === 'up' ? '↑ Memburuk' : 'Stabil'
          ]);
        });

        const imgData = await captureImage('curah-defects-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 10: Rasio Kualitas Buah: Class A vs Class B
      // ==========================================
      {
        const sheet = workbook.addWorksheet('10. Rasio Class A-B');
        setupSheetHeader(sheet, `Rasio Kualitas Buah: Class A vs Class B (${selectedGroup})`, `Proporsi Volume Class A (Premium) & Class B (Sekunder)`);
        
        if (classABData && classABData.hasData) {
          const totBox = classABData.sumA + classABData.sumB;
          const pctA = totBox > 0 ? (classABData.sumA / totBox) * 100 : 0;
          const pctB = totBox > 0 ? (classABData.sumB / totBox) * 100 : 0;

          sheet.addRow([]);
          sheet.addRow(['RINGKASAN TOTAL RASIO']);
          sheet.addRow(['Class A (Premium)', `${classABData.sumA.toFixed(1)} Box`, `${((classABData.sumA * 13.5) / 1000).toFixed(1)} Ton`, `${pctA.toFixed(1)}%`]);
          sheet.addRow(['Class B (Sekunder)', `${classABData.sumB.toFixed(1)} Box`, `${((classABData.sumB * 13.5) / 1000).toFixed(1)} Ton`, `${pctB.toFixed(1)}%`]);
          sheet.addRow(['Total Volume', `${totBox.toFixed(1)} Box`, `${((totBox * 13.5) / 1000).toFixed(1)} Ton`, '100.0%']);

          sheet.addRow([]);
          const headerRow = sheet.addRow(['Periode', 'Class A (Box)', 'Class B (Box)', 'Total (Box)', 'Rasio Class A (%)', 'Rasio Class B (%)']);
          styleTableHeader(headerRow);

          classABData.trendData.forEach(row => {
            sheet.addRow([
              row.name,
              row.valA.toFixed(1),
              row.valB.toFixed(1),
              row.total.toFixed(1),
              `${row.pctA.toFixed(1)}%`,
              `${row.pctB.toFixed(1)}%`
            ]);
          });
        }

        const imgData = await captureImage('fruit-quality-ratio-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // ==========================================
      // SHEET 11: 5 Besar Defects (FB) Plantation, Harvest & PH
      // ==========================================
      {
        const sheet = workbook.addWorksheet('11. 5 Besar Defects FB');
        setupSheetHeader(sheet, `5 Besar Defects (FB) (${selectedGroup})`, `Defek Utama Penyumbang Penurunan Recovery Class A`);
        
        sheet.addRow([]);
        sheet.addRow(['PLANTATION DEFECTS (KEBUN)']);
        const header1 = sheet.addRow(['Peringkat', 'Nama Defect', 'Progres / Nilai Terakhir (%)', 'Perubahan WoW']);
        styleTableHeader(header1);
        groupDefects.plantation.forEach((item) => {
          sheet.addRow([
            item.rank,
            item.defectName,
            item.latestVal !== null ? `${item.latestVal.toFixed(1)}%` : `${item.activeAvg ? item.activeAvg.toFixed(1) : 0}%`,
            item.diff !== null ? `${item.diff > 0 ? '+' : ''}${item.diff.toFixed(1)}% WoW` : '-'
          ]);
        });

        sheet.addRow([]);
        sheet.addRow(['HARVEST & PACKING HOUSE DEFECTS']);
        const header2 = sheet.addRow(['Peringkat', 'Nama Defect', 'Progres / Nilai Terakhir (%)', 'Perubahan WoW']);
        styleTableHeader(header2);
        groupDefects.harvestPH.forEach((item) => {
          sheet.addRow([
            item.rank,
            item.defectName,
            item.latestVal !== null ? `${item.latestVal.toFixed(1)}%` : `${item.activeAvg ? item.activeAvg.toFixed(1) : 0}%`,
            item.diff !== null ? `${item.diff > 0 ? '+' : ''}${item.diff.toFixed(1)}% WoW` : '-'
          ]);
        });

        const imgData = await captureImage('top5-defects-panel');
        if (imgData) {
          const imgId = workbook.addImage({ base64: imgData, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: sheet.rowCount + 2 },
            ext: { width: 700, height: 380 }
          });
        }
      }

      // Adjust all column widths for high legibility
      workbook.worksheets.forEach(sheet => {
        sheet.columns.forEach(col => {
          col.width = 24;
        });
      });

      // Export file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PPIC_Banana_MultiSheet_Report_${selectedGroup}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error generating multi-sheet Excel export:", err);
      alert("Terjadi kesalahan saat membuat file Excel. Silakan coba kembali.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // --- Dynamic Export CSV ---
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Group,Parameter,Unit,Jenis Data,Timeline,Value\n";
    
    chartData.forEach(row => {
      csvContent += `"${selectedGroup}","${selectedParam}","${totals.unit}","${categoryA}","${row.name}",${row[categoryA] || 0}\n`;
      csvContent += `"${selectedGroup}","${selectedParam}","${totals.unit}","${categoryB}","${row.name}",${row[categoryB] || 0}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Comparison_${selectedGroup}_${selectedParam.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for numbers rendering
  const fmtNum = (val: number | null) => {
    if (val === null) return '-';
    return val.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  };

  const fmtPercent = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  // --- UNDER MAINTENANCE VIEW FOR NON-ADMIN USERS ---
  if (!isAdmin && isUnderMaintenance) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-200 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}>
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 shadow-sm'
            }`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`max-w-xl w-full p-8 md:p-10 rounded-3xl border shadow-2xl text-center relative z-10 space-y-6 ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-800/80 shadow-slate-950/80 backdrop-blur-md'
              : 'bg-white border-slate-200/80 shadow-2xl shadow-slate-200'
          }`}
        >
          {/* Logo & Animated Icon */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-amber-500/20 blur-md animate-pulse" />
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 relative">
                <Wrench className="h-10 w-10 animate-spin" style={{ animationDuration: '12s' }} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <img 
                src={logoUrl} 
                alt="PPIC Banana Logo" 
                className="h-8 w-8 object-contain rounded-lg border border-slate-200/50 dark:border-slate-800/50"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                PPIC BANANA SYSTEM
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight font-sans">
              Sedang Dalam Perbaikan
            </h1>
            <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
          </div>

          {/* Core Exact Required Description */}
          <div className={`p-5 rounded-2xl border leading-relaxed text-sm font-bold ${
            theme === 'dark'
              ? 'bg-slate-950/80 border-slate-800 text-slate-200'
              : 'bg-amber-50/80 border-amber-200 text-slate-800 shadow-xs'
          }`}>
            <p className="text-center">
              Sedang dalam perbaikan. Kami sedang meningkatkan sistem demi memberikan pengalaman yang lebih baik untuk Anda
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                fetchSystemStatus();
                if (!isUnderMaintenance) {
                  window.location.reload();
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
              <span>Cek Status Sistem</span>
            </button>

            <button
              onClick={() => {
                const u = prompt("Masukkan Username Admin:");
                const p = prompt("Masukkan Password Admin:");
                if (u === 'Mimin' && p === 'Bananauntung') {
                  setIsLoggedIn(true);
                  setIsAdmin(true);
                  localStorage.setItem('isLoggedIn', 'true');
                  localStorage.setItem('isAdmin', 'true');
                  setLoginError(null);
                } else if (u || p) {
                  alert("Username atau Password Admin salah!");
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <User className="h-3.5 w-3.5" />
              <span>Login (Admin)</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            Maintenance by Arham (PPIC BANANA)
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white' 
          : 'bg-slate-50 text-slate-800 selection:bg-teal-600 selection:text-white'
      }`}>
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`w-full max-w-md p-8 rounded-2xl border transition-all ${
            theme === 'dark'
              ? 'bg-slate-900/40 border-slate-800/80 shadow-2xl backdrop-blur-md'
              : 'bg-white border-slate-200 shadow-xl'
          }`}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 transition-transform hover:scale-105">
              <img 
                src={logoUrl} 
                alt="PPIC Banana Logo" 
                className="h-24 w-24 object-contain rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-800/50"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight font-sans">
              PPIC BANANA SYSTEM
            </h2>
            <p className={`text-xs mt-1 transition-colors ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              GGP Production Comparison Dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 text-xs rounded-xl border bg-rose-500/10 text-rose-500 border-rose-500/20"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className={`text-xs font-bold transition-colors ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-600/50 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold transition-colors ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Masukkan password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full pl-10 pr-12 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-600/50 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]"
            >
              Masuk Dashboard
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
            <span className="text-[10px] font-mono tracking-wider uppercase block text-slate-500">
              Authorized Personnel Only
            </span>
            <span className="text-[9px] mt-1 block text-slate-400 dark:text-slate-600">
              Maintenance by Arham (PPIC BANANA)
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased pb-12 transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-slate-900 text-slate-100 selection:bg-teal-500 selection:text-white' 
        : 'bg-slate-50 text-slate-800 selection:bg-teal-600 selection:text-white'
    }`}>
      {/* --- DASHBOARD HEADER --- */}
      <header className={`border-b sticky top-0 z-50 px-6 py-4 backdrop-blur-md transition-colors duration-200 ${
        theme === 'dark'
          ? 'border-slate-800 bg-slate-950/80 text-slate-100'
          : 'border-slate-200 bg-white/90 text-slate-800 shadow-sm'
      }`}>
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <img 
                src={logoUrl} 
                alt="PPIC Banana Logo" 
                className="h-10 w-10 object-contain rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800/50 transition-transform hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <h1 className={`text-xl md:text-2xl font-bold tracking-tight ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent'
                  : 'text-emerald-800 font-extrabold'
              }`}>
                Production Comparison Dashboard
              </h1>
            </div>
            <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              PPIC BANANA DEPARTEMENT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Admin Controls for User Mimin */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                {/* Workspace Toggle */}
                <div className={`flex rounded-lg p-1 border text-xs font-semibold transition-all ${
                  theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-xs'
                }`}>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-150 ${
                      activeTab === 'dashboard'
                        ? (theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-white text-emerald-800 font-bold shadow-xs')
                        : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
                    }`}
                  >
                    <Layout className="h-3.5 w-3.5" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('workspace')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-150 ${
                      activeTab === 'workspace'
                        ? (theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-white text-emerald-800 font-bold shadow-xs')
                        : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    <span>Code Workspace</span>
                  </button>
                </div>

                {/* Admin Menu Dropdown */}
                <div className="relative" ref={adminMenuRef}>
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    id="admin_menu_dropdown_btn"
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                      isUnderMaintenance
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 shadow-xs'
                        : theme === 'dark'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-xs'
                    }`}
                    title="Menu Kontrol Admin (Mimin)"
                  >
                    <ShieldAlert className={`h-3.5 w-3.5 ${isUnderMaintenance ? 'text-amber-400 animate-bounce' : 'text-emerald-500'}`} />
                    <span className="hidden lg:inline">Admin Menu</span>
                    {isUnderMaintenance && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500 text-slate-950 font-black animate-pulse">
                        MAINTENANCE
                      </span>
                    )}
                    <ChevronDown className={`h-3 w-3 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showAdminMenu && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-2xl z-50 transition-all text-left ${
                      theme === 'dark' 
                        ? 'bg-slate-900 border-slate-700 text-slate-200 shadow-slate-950/80 backdrop-blur-md' 
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2.5 mb-3 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-emerald-500" />
                          <div>
                            <h4 className="text-xs font-bold leading-tight">Panel Admin Mimin</h4>
                            <span className="text-[10px] text-slate-400">Pengaturan Akses System</span>
                          </div>
                        </div>
                        <button onClick={() => setShowAdminMenu(false)} className="text-slate-400 hover:text-slate-200 p-1">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* 1. Menu Logout User */}
                        <div className={`p-3 rounded-xl border transition-all ${
                          theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold flex items-center gap-1.5 text-rose-500">
                              <UserX className="h-4 w-4" />
                              Logout Semua User
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed mb-2.5">
                            Otomatis meng-logout seluruh user yang sedang aktif selain Mimin (admin) dengan pesan "Sesi anda telah habis".
                          </p>
                          <button
                            onClick={() => {
                              if (window.confirm("Apakah Anda yakin ingin meng-logout seluruh login user (selain Mimin)?")) {
                                handleAdminForceLogout();
                                setShowAdminMenu(false);
                              }
                            }}
                            className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            <span>Logout User Sekarang</span>
                          </button>
                        </div>

                        {/* 2. Menu Under Maintenance */}
                        <div className={`p-3 rounded-xl border transition-all ${
                          isUnderMaintenance 
                            ? (theme === 'dark' ? 'bg-amber-950/40 border-amber-800/60' : 'bg-amber-50 border-amber-300')
                            : (theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200')
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold flex items-center gap-1.5 text-amber-500">
                              <Wrench className="h-4 w-4" />
                              Under Maintenance
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              isUnderMaintenance
                                ? 'bg-amber-500 text-slate-950 animate-pulse'
                                : (theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')
                            }`}>
                              {isUnderMaintenance ? 'AKTIF' : 'NONAKTIF'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed mb-2.5">
                            Ketika diaktifkan, seluruh login selain Mimin tidak dapat mengakses halaman dan muncul pesan "Sedang dalam perbaikan".
                          </p>
                          <button
                            onClick={() => {
                              handleToggleMaintenanceMode(!isUnderMaintenance);
                              setShowAdminMenu(false);
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                              isUnderMaintenance
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            <span>{isUnderMaintenance ? 'Matikan Under Maintenance' : 'Aktifkan Under Maintenance'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Theme Toggle Button */}
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              id="fullscreen_toggle_btn"
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
              }`}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Keluar Layar Penuh</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </>
              )}
            </button>

            <button
              onClick={toggleTheme}
              id="theme_toggle_btn"
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
              }`}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="hidden sm:inline">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Mode Gelap</span>
                </>
              )}
            </button>

            {/* Notification Bell Button & Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                id="notification_bell_btn"
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
                }`}
                title="Notifikasi"
              >
                <div className="relative flex items-center">
                  <Bell className={`h-3.5 w-3.5 ${notifications.some(n => !n.read) ? 'animate-bounce text-amber-500' : 'text-slate-400'}`} />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-800" />
                  )}
                </div>
                <span className="hidden sm:inline">Notifikasi</span>
              </button>
              
              {showNotifications && (
                <div className={`fixed md:absolute top-24 md:top-auto left-4 right-4 md:left-auto md:right-0 mt-2 md:w-80 rounded-xl border p-4 shadow-xl z-50 transition-all text-left ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-lg'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-indigo-500" />
                      Pembaruan Data
                    </h4>
                    {notifications.some(n => !n.read) && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] text-indigo-500 hover:underline font-semibold"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      notifications.map((notif: any) => (
                        <div 
                          key={notif.id} 
                          className={`p-2.5 rounded-lg border text-xs transition-all ${
                            notif.read 
                              ? theme === 'dark' ? 'bg-slate-850/45 border-slate-800 text-slate-500' : 'bg-slate-50/50 border-slate-100 text-slate-500'
                              : theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900/40 text-slate-200' : 'bg-indigo-50/50 border-indigo-150 text-slate-800 font-medium'
                          }`}
                        >
                          <div className="flex justify-end mb-1">
                            <span className="text-[9px] text-slate-400">
                              {notif.time}
                            </span>
                          </div>
                          <p className="leading-relaxed text-[11px]">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>
                        Izin Browser: {('Notification' in window) ? (Notification.permission === 'granted' ? 'Diizinkan' : Notification.permission === 'denied' ? 'Ditolak' : 'Belum Diatur') : 'Tidak Didukung'}
                      </span>
                      {('Notification' in window) && Notification.permission === 'default' && (
                        <button 
                          onClick={requestPushPermission}
                          className="text-indigo-500 hover:underline font-semibold"
                        >
                          Minta Izin
                        </button>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Status Notifikasi : {pushEnabled ? 'Aktif' : 'Mati'}
                      </span>
                      <button
                        onClick={togglePushEnabled}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          pushEnabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            pushEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="text-[9px] text-slate-400 leading-normal">
                      {pushEnabled 
                        ? "Sistem akan mengirim popup notifikasi ketika ada pembaruan data."
                        : "Sistem dibisukan. Notifikasi hanya akan masuk ke daftar di atas."
                      }
                    </div>
                  </div>
                 </div>
               )}
             </div>

            <button
              onClick={() => fetchLiveData(true)}
              disabled={loading}
              id="refresh_data_btn"
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-100 hover:border-slate-400 text-slate-800 shadow-sm'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-500' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Syncing...' : 'Sync'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              id="export_csv_btn"
              title="Export 11 Panel ke 1 File Excel (Multi-Sheet + Data & Grafik)"
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-100 hover:border-slate-400 text-slate-800 shadow-sm'
              }`}
            >
              <FileSpreadsheet className={`h-3.5 w-3.5 ${isExportingExcel ? 'animate-spin text-amber-500' : 'text-emerald-500'}`} />
              <span className="hidden sm:inline">{isExportingExcel ? 'Exporting...' : 'Exp'}</span>
            </button>

            <button
              onClick={handleLogout}
              id="logout_btn"
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:border-rose-500/30'
                  : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 shadow-sm hover:border-rose-300'
              }`}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 mt-6 sm:mt-8 space-y-3 sm:space-y-4 overflow-x-hidden">
        {adminNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border font-semibold text-xs flex items-center justify-between shadow-lg mb-4 ${
              theme === 'dark'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{adminNotice}</span>
            </div>
            <button onClick={() => setAdminNotice(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200 p-1">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
        
        {activeTab === 'workspace' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            id="admin-code-workspace"
          >
            {/* Header / Intro */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-950/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Code className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-black tracking-tight">Admin Code & Live Preview Workspace</h2>
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Ubah kode aplikasi, konfigurasi, maupun berkas data secara langsung. Seluruh perubahan akan otomatis terkompilasi dan diperbarui pada iframe preview.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-600'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Vite Dev Server (Port 3000)
                  </span>
                </div>
              </div>
            </div>

            {/* Main IDE Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* File Explorer (col-span-3) */}
              <div className="lg:col-span-3 space-y-4">
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Folder className="h-4 w-4 text-amber-500" />
                    File Explorer
                  </h3>
                  
                  <div className="space-y-1 font-mono text-xs">
                    {[
                      { path: 'src/App.tsx', label: 'App.tsx (Frontend Core)', type: 'react' },
                      { path: 'server.ts', label: 'server.ts (Backend API)', type: 'node' },
                      { path: 'src/data.json', label: 'data.json (Data Cache)', type: 'json' },
                      { path: 'src/types.ts', label: 'types.ts (Type Declarations)', type: 'typescript' },
                      { path: 'metadata.json', label: 'metadata.json (App Permissions)', type: 'json' },
                      { path: 'src/index.css', label: 'index.css (Global Styles)', type: 'css' }
                    ].map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file.path)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${
                          selectedFile === file.path
                            ? (theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold' : 'bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold')
                            : (theme === 'dark' ? 'border border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200' : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950')
                        }`}
                      >
                        <span className="truncate">{file.path.split('/').pop()}</span>
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {file.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Terminal / Command Output */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-500" />
                    Terminal Console
                  </h3>
                  <div className={`h-48 overflow-y-auto font-mono text-[10px] p-2.5 rounded-lg border leading-relaxed space-y-1 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-950 border-slate-900 text-slate-300'
                  }`}>
                    {terminalLogs.map((log, lidx) => (
                      <div key={lidx} className="whitespace-pre-wrap select-text">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Code Editor Panel (col-span-9) */}
              <div className="lg:col-span-9 space-y-6">
                <div className={`rounded-xl border overflow-hidden ${
                  theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  {/* Editor Header */}
                  <div className={`px-4 py-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="font-mono text-xs font-bold text-slate-400 ml-2">{selectedFile}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => loadWorkspaceFile(selectedFile)}
                        disabled={editorLoading || editorSaving}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 shadow-xs'
                        }`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${editorLoading ? 'animate-spin' : ''}`} />
                        <span>Reload</span>
                      </button>

                      <button
                        onClick={saveWorkspaceFile}
                        disabled={editorLoading || editorSaving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/10 transition-all"
                      >
                        {editorSaving ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            <span>Simpan & Terapkan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Editor Error / Success Notifications */}
                  {editorError && (
                    <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{editorError}</span>
                    </div>
                  )}
                  {editorSuccess && (
                    <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>{editorSuccess}</span>
                    </div>
                  )}

                  {/* Textarea Editor */}
                  <div className="relative">
                    {editorLoading ? (
                      <div className="h-[450px] flex flex-col items-center justify-center space-y-3 bg-slate-950/20">
                        <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
                        <span className="text-xs text-slate-400 font-mono">Loading file contents...</span>
                      </div>
                    ) : (
                      <textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className={`w-full h-[520px] p-5 font-mono text-[11px] leading-relaxed resize-none outline-none focus:ring-0 border-0 overflow-y-auto ${
                          theme === 'dark' 
                            ? 'bg-slate-950 text-slate-200 placeholder-slate-700 focus:bg-slate-950' 
                            : 'bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white'
                        }`}
                        spellCheck="false"
                      />
                    )}
                  </div>
                </div>

                {/* Real-time App Preview Iframe */}
                <div className={`rounded-xl border overflow-hidden ${
                  theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className={`px-4 py-2.5 border-b flex justify-between items-center text-xs font-mono font-bold ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-emerald-500" />
                      <span>Live App Preview Frame</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      Active (Port 3000)
                    </span>
                  </div>
                  
                  {/* Embedded Iframe pointing to host */}
                  <div className="bg-slate-950 h-[600px] relative">
                    <iframe 
                      src={`${window.location.origin}/?preview=true`} 
                      className="w-full h-full border-0 bg-slate-900" 
                      title="Application Live Preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* --- ERROR NOTIFICATION --- */}
            {error && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl flex items-start gap-3 text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Notice</p>
                  <p className="text-slate-300">{error}</p>
                </div>
              </div>
            )}

        {/* --- FILTER CONTROL PANEL --- */}
        <section id="top-filter-panel" className={`p-6 rounded-2xl shadow-xl space-y-6 border transition-colors duration-200 ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-mono tracking-wider uppercase transition-colors ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Layers className="h-4 w-4 text-teal-500" />
            <span>Dashboard Control Panel</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Group Filter */}
            <div className="space-y-2">
              <label className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                Select Group / Plantation
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                id="group_select"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Compare A */}
            <div className="space-y-2">
              <label className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <Activity className="h-3.5 w-3.5 text-teal-500" />
                Category A
              </label>
              <select
                value={categoryA}
                onChange={(e) => setCategoryA(e.target.value as any)}
                id="category_a_select"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <option value="Aktual">Aktual (Actual)</option>
                <option value="Demand">Demand</option>
                <option value="Rolling Forcast">Rolling Forecast</option>
                <option value="Budget">Budget</option>
              </select>
            </div>

            {/* Compare B */}
            <div className="space-y-2">
              <label className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <Activity className="h-3.5 w-3.5 text-purple-500" />
                Category B
              </label>
              <select
                value={categoryB}
                onChange={(e) => setCategoryB(e.target.value as any)}
                id="category_b_select"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <option value="Aktual">Aktual (Actual)</option>
                <option value="Demand">Demand</option>
                <option value="Rolling Forcast">Rolling Forecast</option>
                <option value="Budget">Budget</option>
              </select>
            </div>

            {/* Parameter to compare */}
            <div className="space-y-2">
              <label className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <Layers className="h-3.5 w-3.5 text-blue-500" />
                Compare Parameter
              </label>
              <select
                value={selectedParam}
                onChange={(e) => setSelectedParam(e.target.value)}
                id="param_select"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                {allParams.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="space-y-2">
              <label className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                Timeline Interval
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                id="view_mode_select"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <option value="monthlyCutDate">Bulanan (Cut Date)</option>
                <option value="monthlyCutWeek">Bulanan (Cut Week)</option>
                <option value="weekly">Mingguan (Weekly)</option>
                <option value="daily">Harian (Daily)</option>
              </select>
            </div>
          </div>

          {/* Timeline Range Filter Sub-panel */}
          <div className={`border-t pt-4 mt-2 transition-colors ${
            theme === 'dark' ? 'border-slate-800/60' : 'border-slate-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-700 font-bold'
                }`}>
                  <Calendar className="h-4 w-4 text-amber-500 animate-pulse" />
                  Rentang Waktu & Filter Fokus (Time Range Filter)
                </span>
                <p className={`text-[11px] transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Saring periode data grafik dan total KPI di bawah secara dinamis.
                </p>
              </div>

              {/* Mode Buttons */}
              <div className={`flex flex-wrap gap-1 p-1 rounded-xl border transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900/85 border-slate-800'
                  : 'bg-slate-100 border-slate-200 shadow-inner'
              }`}>
                <button
                  type="button"
                  onClick={() => setRangeMode('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    rangeMode === 'all' 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-teal-500/10' 
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  Semua Bulan/Minggu
                </button>
                <button
                  type="button"
                  onClick={() => setRangeMode('3m')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    rangeMode === '3m' 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-teal-500/10' 
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  3 Bulan Pertama
                </button>
                <button
                  type="button"
                  onClick={() => setRangeMode('last3m')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    rangeMode === 'last3m' 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-teal-500/10' 
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  3 Bulan Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => setRangeMode('6m')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    rangeMode === '6m' 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-teal-500/10' 
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  6 Bulan Pertama
                </button>
                <button
                  type="button"
                  onClick={() => setRangeMode('custom')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    rangeMode === 'custom' 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-teal-500/10' 
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  Rentang Kustom
                </button>
                <button
                  type="button"
                  onClick={() => setRangeMode('single')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    rangeMode === 'single' 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-teal-500/10' 
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  Fokus Spesifik
                </button>
              </div>
            </div>

            {/* Sub selectors based on rangeMode */}
            {rangeMode === 'custom' && (
              <div className={`mt-4 p-4 border rounded-xl max-w-2xl transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900/40 border-slate-800/60'
                  : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                {/* Mode Selector within Custom Range: Period vs Calendar */}
                <div className="flex border-b border-slate-200/50 dark:border-slate-800/50 pb-3 mb-4 gap-4">
                  <button
                    type="button"
                    onClick={() => setCustomDateMode('period')}
                    className={`pb-1.5 text-xs font-bold border-b-2 transition-all ${
                      customDateMode === 'period'
                        ? 'border-teal-500 text-teal-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Berdasarkan Periode ({viewMode === 'weekly' || viewMode === 'daily' ? 'Mingguan' : 'Bulanan'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDateMode('calendar')}
                    className={`pb-1.5 text-xs font-bold border-b-2 transition-all ${
                      customDateMode === 'calendar'
                        ? 'border-teal-500 text-teal-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Berdasarkan Tanggal Kalender (Date Range)
                  </button>
                </div>

                {customDateMode === 'period' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {viewMode === 'weekly' || viewMode === 'daily' ? (
                      <>
                        <div className="space-y-1.5">
                          <label className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Mulai Minggu (Start Week):</label>
                          <select
                            value={startWeek}
                            onChange={(e) => setStartWeek(Number(e.target.value))}
                            className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                              theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            {Array.from({ length: 53 }).map((_, i) => (
                              <option key={i} value={i}>Minggu {i + 1} (W{i + 1})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Sampai Minggu (End Week):</label>
                          <select
                            value={endWeek}
                            onChange={(e) => setEndWeek(Number(e.target.value))}
                            className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                              theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            {Array.from({ length: 53 }).map((_, i) => (
                              <option key={i} value={i}>Minggu {i + 1} (W{i + 1})</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Mulai Bulan (Start Month):</label>
                          <select
                            value={startMonth}
                            onChange={(e) => setStartMonth(Number(e.target.value))}
                            className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                              theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            {data.months.map((m, idx) => (
                              <option key={m} value={idx}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Sampai Bulan (End Month):</label>
                          <select
                            value={endMonth}
                            onChange={(e) => setEndMonth(Number(e.target.value))}
                            className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                              theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            {data.months.map((m, idx) => (
                              <option key={m} value={idx}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Tanggal Mulai (Start Date):</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min="2025-12-29"
                        max="2026-12-31"
                        className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-800 text-slate-200 [color-scheme:dark]'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Tanggal Selesai (End Date):</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min="2025-12-29"
                        max="2026-12-31"
                        className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-800 text-slate-200 [color-scheme:dark]'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {rangeMode === 'single' && (
              <div className={`grid grid-cols-1 max-w-md gap-4 mt-4 p-4 border rounded-xl transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900/40 border-slate-800/60'
                  : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                {viewMode === 'weekly' || viewMode === 'daily' ? (
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Fokus ke Minggu (Focus Week):</label>
                    <select
                      value={singleWeek}
                      onChange={(e) => setSingleWeek(Number(e.target.value))}
                      className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      {Array.from({ length: 53 }).map((_, i) => (
                        <option key={i} value={i}>Minggu {i + 1} (W{i + 1})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Fokus ke Bulan (Focus Month):</label>
                    <select
                      value={singleMonth}
                      onChange={(e) => setSingleMonth(Number(e.target.value))}
                      className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                        theme === 'dark'
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      {data.months.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {rangeMode === 'last3m' && (
              <div className={`mt-4 p-4 border rounded-xl max-w-2xl flex items-start gap-3 transition-all transform animate-in fade-in slide-in-from-top-1 duration-200 ${
                theme === 'dark'
                  ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-300'
                  : 'bg-indigo-50/70 border-indigo-100 text-indigo-800 shadow-sm'
              }`}>
                <Info className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-xs font-bold block">Filter 3 Bulan Terakhir Aktif</span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Sistem mendeteksi periode data aktual terakhir pada <strong className="font-semibold underline">{(viewMode === 'weekly' || viewMode === 'daily') ? `Minggu ${lastActualIndex + 1} (W${lastActualIndex + 1})` : data.months[lastActualIndex]}</strong>. 
                    Data visual di bawah secara otomatis disaring untuk menampilkan: <strong className="font-bold">{last3MonthsDisplay}</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- KPI SUMMARY SECTION --- */}
        <section id="kpi-summary-panel" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card A */}
          <div className={`p-6 rounded-2xl relative overflow-hidden group border ${
            theme === 'dark' 
              ? 'bg-slate-950/60 border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-400">
              <BarChart2 className="h-24 w-24" />
            </div>
            <span className={`text-xs font-mono uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {categoryA} {totals.isAverageParam ? 'Average (Rata-rata)' : 'Total (Akumulasi)'}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black tracking-tight text-teal-500">
                {fmtNum(totals.totalA)}
              </span>
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{totals.unit}</span>
            </div>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {totals.isAverageParam ? 'Rata-rata' : 'Akumulasi total'} parameter <span className={`font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{selectedParam}</span> terpilih.
            </p>
          </div>

          {/* Card B */}
          <div className={`p-6 rounded-2xl relative overflow-hidden group border ${
            theme === 'dark' 
              ? 'bg-slate-950/60 border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-400">
              <BarChart2 className="h-24 w-24" />
            </div>
            <span className={`text-xs font-mono uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {categoryB} {totals.isAverageParam ? 'Average (Rata-rata)' : 'Total (Akumulasi)'}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black tracking-tight text-purple-500">
                {fmtNum(totals.totalB)}
              </span>
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{totals.unit}</span>
            </div>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {totals.isAverageParam ? 'Rata-rata' : 'Akumulasi total'} parameter <span className={`font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{selectedParam}</span> terpilih.
            </p>
          </div>

          {/* Variance Card */}
          <div className={`p-6 rounded-2xl relative overflow-hidden group border transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-950/60 border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <span className={`text-xs font-mono uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Pencapaian ({categoryA} terhadap {categoryB})
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-black tracking-tight ${totals.achievementPercent >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {totals.achievementPercent.toFixed(1)}%
              </span>
              <span className={`text-sm font-semibold rounded-lg px-2 py-0.5 text-xs ${totals.variance >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                Delta: {totals.variance >= 0 ? '+' : ''}{fmtNum(totals.variance)}
              </span>
            </div>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {totals.achievementPercent >= 100 ? (
                <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                  <ArrowUp className="h-3.5 w-3.5" />
                  Memenuhi target ({totals.achievementPercent.toFixed(1)}% dari {categoryB})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                  <ArrowDown className="h-3.5 w-3.5" />
                  Belum memenuhi target ({totals.achievementPercent.toFixed(1)}% dari {categoryB})
                </span>
              )}
            </p>
          </div>
        </section>

        {/* --- MAIN COMPARISON VISUALIZER --- */}
        <div id="side-by-side-panel" className="space-y-0.5">
          {/* Chart Container (Spans full width for supreme readability) */}
          <div className={`p-6 rounded-2xl space-y-6 border transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
                <h3 className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Trend Analisis {selectedParam}
                </h3>
              </div>
              <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Group: <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{selectedGroup}</span> | Unit: <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{totals.unit}</span>
              </div>
            </div>
            
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 25, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                    fontSize={11} 
                    tickLine={false} 
                    tick={{ fill: theme === 'dark' ? '#94a3b8' : '#334155' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: theme === 'dark' ? '#94a3b8' : '#334155' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke={theme === 'dark' ? '#f43f5e' : '#be123c'} 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                    tick={{ fill: theme === 'dark' ? '#fda4af' : '#be123c', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                      borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', 
                      borderRadius: '12px',
                      color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#94a3b8' : '#475569' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{value}</span>}
                  />
                  {/* Category A as distinct bar */}
                  <Bar 
                    yAxisId="left"
                    dataKey={categoryA} 
                    fill="#0d9488" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={28} 
                    opacity={0.85} 
                  >
                    <LabelList dataKey={categoryA} content={(props: any) => <RenderVerticalLabel {...props} />} />
                  </Bar>
                  {/* Category B as distinct bar */}
                  <Bar 
                    yAxisId="left"
                    dataKey={categoryB} 
                    fill="#a855f7" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={28} 
                    opacity={0.85} 
                  >
                    <LabelList dataKey={categoryB} content={(props: any) => <RenderVerticalLabel {...props} />} />
                  </Bar>
                  {/* Percentage change as distinct line */}
                  <Line 
                    yAxisId="right"
                    name="Pencapaian (%)"
                    type="monotone" 
                    dataKey="pct" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1, fill: theme === 'dark' ? '#020617' : '#ffffff' }} 
                  >
                    <LabelList dataKey="pct" content={(props: any) => <RenderPercentageAboveLine {...props} theme={theme} />} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Table (Spans full width, laid out as a horizontal grid for maximum readability) */}
          <div className={`rounded-2xl flex flex-col justify-between border transition-all duration-300 ${
            showSideBySideDetails ? 'p-6' : 'py-1.5 px-6'
          } ${
            theme === 'dark' 
              ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className={`${showSideBySideDetails ? 'space-y-4' : ''}`}>
              <div className={`flex items-center justify-between transition-colors ${
                showSideBySideDetails 
                  ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                  : ''
              }`}>
                <h3 className={`font-bold text-sm flex items-center gap-1.5 transition-colors ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  <ClipboardList className="h-4 w-4 text-emerald-500" />
                  Data Grafik Utama
                </h3>
                <button
                  onClick={() => setShowSideBySideDetails(!showSideBySideDetails)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                  }`}
                  title={showSideBySideDetails ? "Sembunyikan Panel" : "Tampilkan Panel"}
                >
                  {showSideBySideDetails ? (
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

              {showSideBySideDetails && (
                <div className="overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-0.5">
                    {chartData.map((row, idx) => {
                      const valA = row[categoryA];
                      const valB = row[categoryB];
                      const diff = valA !== null && valB !== null ? valA - valB : null;

                      return (
                        <div key={idx} className={`flex flex-col justify-between text-xs p-3 rounded-xl border transition-colors ${
                          theme === 'dark'
                            ? 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-900 hover:border-slate-700/80'
                            : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
                        }`}>
                          <span className={`font-bold transition-colors border-b pb-1.5 mb-2 ${
                            theme === 'dark' ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-200'
                          }`}>
                            {row.name}
                          </span>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 font-medium">{categoryA}:</span>
                              <span className="text-teal-500 font-extrabold font-mono">{fmtNum(valA)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 font-medium">{categoryB}:</span>
                              <span className="text-purple-500 font-extrabold font-mono">{fmtNum(valB)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] border-t pt-1 mt-1 transition-colors border-slate-800/30">
                              <span className="text-slate-500 font-medium">Selisih:</span>
                              {diff !== null ? (
                                <span className={`font-mono font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {diff > 0 ? '+' : ''}{fmtNum(diff)}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {showSideBySideDetails && (
              <div className={`text-[11px] text-center border-t pt-3 mt-4 transition-colors ${
                theme === 'dark' ? 'border-slate-900 text-slate-500' : 'border-slate-100 text-slate-400'
              }`}>
                Menampilkan {chartData.length} rentang waktu dari data perkebunan.
              </div>
            )}
          </div>
        </div>

        {/* --- DECOMPOSITION VARIANCE ANALYSIS (WATERFALL) --- */}
        <section id="waterfall-bridge-panel" className={`!mt-[1px] p-6 rounded-2xl border transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          {/* Factor Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Harvest Card */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
              theme === 'dark' ? 'bg-slate-900/30 border-slate-800/60' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">Harvest (Bunches)</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>Bcs</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="opacity-70">{categoryA} (A):</span>
                  <span className="font-black font-mono">
                    {packableAnalysisData.totalHarvestA.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="opacity-70">{categoryB} (B):</span>
                  <span className="font-black font-mono">
                    {packableAnalysisData.totalHarvestB.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                <div className="border-t border-dashed my-2 border-slate-200/50 dark:border-slate-800/50 pt-2 flex justify-between items-baseline text-xs">
                  <span className="font-medium">Selisih (A - B):</span>
                  <span className={`font-mono font-bold ${(packableAnalysisData.totalHarvestA - packableAnalysisData.totalHarvestB) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(packableAnalysisData.totalHarvestA - packableAnalysisData.totalHarvestB) >= 0 ? '+' : ''}
                    {(packableAnalysisData.totalHarvestA - packableAnalysisData.totalHarvestB).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    {" "}({packableAnalysisData.totalHarvestB > 0 ? (((packableAnalysisData.totalHarvestA - packableAnalysisData.totalHarvestB) / packableAnalysisData.totalHarvestB) * 100).toFixed(1) : '0.0'}%)
                  </span>
                </div>

                <div className={`mt-4 p-3 rounded-xl border text-center transition-colors ${
                  packableAnalysisData.totalHarvestEffect >= 0 
                    ? theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : theme === 'dark' ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <span className="text-[10px] uppercase font-mono block opacity-80 mb-0.5">Dampak pada Produksi Box</span>
                  <span className="text-sm font-black font-mono block">
                    {packableAnalysisData.totalHarvestEffect >= 0 ? '+' : ''}
                    {packableAnalysisData.totalHarvestEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })} Box
                  </span>
                  <span className="text-[10px] block opacity-90 mt-1">
                    {packableAnalysisData.totalHarvestEffect >= 0 
                      ? "Peningkatan volume panen bunches mendongkrak box." 
                      : "Penurunan volume panen bunches mengurangi box."
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Bunchweight Card */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
              theme === 'dark' ? 'bg-slate-900/30 border-slate-800/60' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                    <Layers className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">Bunchweight (Berat Tandan)</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>Kg</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="opacity-70">{categoryA} (A):</span>
                  <span className="font-black font-mono">
                    {packableAnalysisData.avgBunchweightA.toFixed(2)} Kg
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="opacity-70">{categoryB} (B):</span>
                  <span className="font-black font-mono">
                    {packableAnalysisData.avgBunchweightB.toFixed(2)} Kg
                  </span>
                </div>
                
                <div className="border-t border-dashed my-2 border-slate-200/50 dark:border-slate-800/50 pt-2 flex justify-between items-baseline text-xs">
                  <span className="font-medium">Selisih (A - B):</span>
                  <span className={`font-mono font-bold ${(packableAnalysisData.avgBunchweightA - packableAnalysisData.avgBunchweightB) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(packableAnalysisData.avgBunchweightA - packableAnalysisData.avgBunchweightB) >= 0 ? '+' : ''}
                    {(packableAnalysisData.avgBunchweightA - packableAnalysisData.avgBunchweightB).toFixed(2)} Kg
                    {" "}({packableAnalysisData.avgBunchweightB > 0 ? (((packableAnalysisData.avgBunchweightA - packableAnalysisData.avgBunchweightB) / packableAnalysisData.avgBunchweightB) * 100).toFixed(1) : '0.0'}%)
                  </span>
                </div>

                <div className={`mt-4 p-3 rounded-xl border text-center transition-colors ${
                  packableAnalysisData.totalWeightEffect >= 0 
                    ? theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : theme === 'dark' ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <span className="text-[10px] uppercase font-mono block opacity-80 mb-0.5">Dampak pada Produksi Box</span>
                  <span className="text-sm font-black font-mono block">
                    {packableAnalysisData.totalWeightEffect >= 0 ? '+' : ''}
                    {packableAnalysisData.totalWeightEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })} Box
                  </span>
                  <span className="text-[10px] block opacity-90 mt-1">
                    {packableAnalysisData.totalWeightEffect >= 0 
                      ? "Berat tandan lebih berat mendongkrak box." 
                      : "Berat tandan lebih ringan mengurangi box."
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Recovery Card */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
              theme === 'dark' ? 'bg-slate-900/30 border-slate-800/60' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                    <Activity className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">REC Total Packable (Recovery)</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>%</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="opacity-70">{categoryA} (A):</span>
                  <span className="font-black font-mono">
                    {packableAnalysisData.avgRecA.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="opacity-70">{categoryB} (B):</span>
                  <span className="font-black font-mono">
                    {packableAnalysisData.avgRecB.toFixed(2)}%
                  </span>
                </div>
                
                <div className="border-t border-dashed my-2 border-slate-200/50 dark:border-slate-800/50 pt-2 flex justify-between items-baseline text-xs">
                  <span className="font-medium">Selisih (A - B):</span>
                  <span className={`font-mono font-bold ${(packableAnalysisData.avgRecA - packableAnalysisData.avgRecB) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(packableAnalysisData.avgRecA - packableAnalysisData.avgRecB) >= 0 ? '+' : ''}
                    {(packableAnalysisData.avgRecA - packableAnalysisData.avgRecB).toFixed(2)}%
                    {" "}({packableAnalysisData.avgRecB > 0 ? (((packableAnalysisData.avgRecA - packableAnalysisData.avgRecB) / packableAnalysisData.avgRecB) * 100).toFixed(1) : '0.0'}%)
                  </span>
                </div>

                <div className={`mt-4 p-3 rounded-xl border text-center transition-colors ${
                  packableAnalysisData.totalRecEffect >= 0 
                    ? theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : theme === 'dark' ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <span className="text-[10px] uppercase font-mono block opacity-80 mb-0.5">Dampak pada Produksi Box</span>
                  <span className="text-sm font-black font-mono block">
                    {packableAnalysisData.totalRecEffect >= 0 ? '+' : ''}
                    {packableAnalysisData.totalRecEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })} Box
                  </span>
                  <span className="text-[10px] block opacity-90 mt-1">
                    {packableAnalysisData.totalRecEffect >= 0 
                      ? "Peningkatan tingkat recovery mendongkrak box." 
                      : "Penurunan tingkat recovery mengurangi box."
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bridging analysis / horizontal waterfall flow */}
          <div className={`rounded-2xl border transition-all duration-300 ${
            showWaterfallBridge ? 'p-6' : 'py-1.5 px-6'
          } ${
            theme === 'dark' ? 'bg-slate-900/10 border-slate-800/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`${showWaterfallBridge ? 'space-y-4' : ''}`}>
              <div className={`flex items-center justify-between transition-colors ${
                showWaterfallBridge 
                  ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                  : ''
              }`}>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-emerald-500" />
                  Bridging Analisis / Jembatan Box Produksi (Waterfall Bridge)
                </h3>
                <button
                  onClick={() => setShowWaterfallBridge(!showWaterfallBridge)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                  }`}
                  title={showWaterfallBridge ? "Sembunyikan Panel" : "Tampilkan Panel"}
                >
                  {showWaterfallBridge ? (
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

              {showWaterfallBridge && (
                <div className="flex flex-col lg:flex-row items-stretch gap-3 lg:gap-1 text-xs">
                  {/* Step 1: Base */}
                  <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Nilai Awal</span>
                      <span className="font-semibold block truncate">Total Box ({categoryB})</span>
                    </div>
                    <div className="mt-2 flex justify-between items-baseline">
                      <span className="text-xs font-mono">Base:</span>
                      <span className="text-sm font-black font-mono">
                        {packableAnalysisData.totalBoxesB.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden lg:flex items-center justify-center px-1 text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </div>

                  {/* Step 2: Harvest Effect */}
                  <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                    packableAnalysisData.totalHarvestEffect >= 0
                      ? theme === 'dark' ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-400' : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                      : theme === 'dark' ? 'bg-rose-950/20 border-rose-800/30 text-rose-400' : 'bg-rose-50/50 border-rose-200 text-rose-800'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold block uppercase font-mono opacity-80">Langkah 1</span>
                      <span className="font-semibold block truncate">Dampak Harvest</span>
                    </div>
                    <div className="mt-2 flex justify-between items-baseline">
                      <span className="text-xs font-mono">Kontribusi:</span>
                      <span className="text-sm font-black font-mono">
                        {packableAnalysisData.totalHarvestEffect >= 0 ? '+' : ''}
                        {packableAnalysisData.totalHarvestEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden lg:flex items-center justify-center px-1 text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </div>

                  {/* Step 3: Bunchweight Effect */}
                  <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                    packableAnalysisData.totalWeightEffect >= 0
                      ? theme === 'dark' ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-400' : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                      : theme === 'dark' ? 'bg-rose-950/20 border-rose-800/30 text-rose-400' : 'bg-rose-50/50 border-rose-200 text-rose-800'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold block uppercase font-mono opacity-80">Langkah 2</span>
                      <span className="font-semibold block truncate">Dampak Bunchweight</span>
                    </div>
                    <div className="mt-2 flex justify-between items-baseline">
                      <span className="text-xs font-mono">Kontribusi:</span>
                      <span className="text-sm font-black font-mono">
                        {packableAnalysisData.totalWeightEffect >= 0 ? '+' : ''}
                        {packableAnalysisData.totalWeightEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden lg:flex items-center justify-center px-1 text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </div>

                  {/* Step 4: REC Effect */}
                  <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                    packableAnalysisData.totalRecEffect >= 0
                      ? theme === 'dark' ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-400' : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                      : theme === 'dark' ? 'bg-rose-950/20 border-rose-800/30 text-rose-400' : 'bg-rose-50/50 border-rose-200 text-rose-800'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold block uppercase font-mono opacity-80">Langkah 3</span>
                      <span className="font-semibold block truncate">Dampak Recovery (REC)</span>
                    </div>
                    <div className="mt-2 flex justify-between items-baseline">
                      <span className="text-xs font-mono">Kontribusi:</span>
                      <span className="text-sm font-black font-mono">
                        {packableAnalysisData.totalRecEffect >= 0 ? '+' : ''}
                        {packableAnalysisData.totalRecEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden lg:flex items-center justify-center px-1 text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </div>

                  {/* Step 5: Target */}
                  <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 block uppercase font-mono">Target Akhir</span>
                      <span className="font-semibold block truncate">Total Box ({categoryA})</span>
                    </div>
                    <div className="mt-2 flex justify-between items-baseline">
                      <span className="text-xs font-mono">Target:</span>
                      <span className="text-sm font-black font-mono text-emerald-500">
                        {packableAnalysisData.totalBoxesA.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {showWaterfallBridge && (
                /* Reconciliation narrative block */
                <div className={`mt-4 p-4 rounded-xl text-xs space-y-1 border ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800/60 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-xs'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Info className="h-3.5 w-3.5 text-blue-400" />
                    <span>Kesimpulan Analisa Jembatan Varians Produksi:</span>
                  </div>
                  <p className="leading-relaxed">
                    Selisih total Box Packable yang tercatat antara <span className="font-semibold text-emerald-500">{categoryA}</span> dan <span className="font-semibold text-purple-500">{categoryB}</span> adalah sebesar <span className={`font-mono font-bold ${packableAnalysisData.totalDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{packableAnalysisData.totalDelta >= 0 ? '+' : ''}{packableAnalysisData.totalDelta.toLocaleString('id-ID', { maximumFractionDigits: 0 })} Box</span>.
                    Berdasarkan dekomposisi varians multiplikatif, kontributor terbesar dipicu oleh{" "}
                    {Math.abs(packableAnalysisData.totalHarvestEffect) >= Math.abs(packableAnalysisData.totalWeightEffect) && Math.abs(packableAnalysisData.totalHarvestEffect) >= Math.abs(packableAnalysisData.totalRecEffect) ? (
                      <>
                        perubahan volume <span className="font-bold text-amber-500">Harvest (Bunches)</span> dengan dampak sebesar <span className="font-bold">{packableAnalysisData.totalHarvestEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })} Box</span>.
                      </>
                    ) : Math.abs(packableAnalysisData.totalWeightEffect) >= Math.abs(packableAnalysisData.totalHarvestEffect) && Math.abs(packableAnalysisData.totalWeightEffect) >= Math.abs(packableAnalysisData.totalRecEffect) ? (
                      <>
                        perubahan berat tandan <span className="font-bold text-cyan-500">Bunchweight (Kg)</span> dengan dampak sebesar <span className="font-bold">{packableAnalysisData.totalWeightEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })} Box</span>.
                      </>
                    ) : (
                      <>
                        perubahan efisiensi persentase <span className="font-bold text-purple-500">REC Total Packable (Recovery)</span> dengan dampak sebesar <span className="font-bold">{packableAnalysisData.totalRecEffect.toLocaleString('id-ID', { maximumFractionDigits: 0 })} Box</span>.
                      </>
                    )}
                    {" "}Rincian dampak dikoordinasikan secara penuh dengan tim PPIC BANANA untuk monitoring operasional harian.
                  </p>
                  {Math.abs(packableAnalysisData.totalDelta - packableAnalysisData.accountedDelta) > 5 && (
                    <p className="text-[10px] text-slate-500 italic mt-1">
                      *Catatan: Terdapat perbedaan aproksimasi minimal sebesar {(packableAnalysisData.totalDelta - packableAnalysisData.accountedDelta).toFixed(0)} box karena pembulatan desimal parameter.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- BUNCHES HARVEST COMBO CHART --- */}
        <section id="bunches-panen-panel" className={`!mt-0.5 rounded-2xl border transition-all duration-300 ${
          showBunchesPanen ? 'p-6' : 'py-1.5 px-6'
        } ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`${showBunchesPanen ? 'space-y-4' : ''}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
              showBunchesPanen 
                ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                : ''
            }`}>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`p-1 rounded-lg border transition-colors shrink-0 ${
                  theme === 'dark'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  <BarChart2 className="h-3.5 w-3.5" />
                </span>
                <h3 className={`font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors break-words flex-wrap ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Perbandingan Bunches Panen {categoryA} vs {categoryB} ({selectedGroup}) {harvestRangeLabel}
                </h3>
              </div>
              
              <button
                onClick={() => setShowBunchesPanen(!showBunchesPanen)}
                className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                  theme === 'dark'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                }`}
                title={showBunchesPanen ? "Sembunyikan Panel" : "Tampilkan Panel"}
              >
                {showBunchesPanen ? (
                  <ChevronUp className="h-4 w-4 text-rose-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-emerald-500" />
                )}
              </button>
            </div>

            {showBunchesPanen && (
              <>
                {/* Chart and Table side-by-side */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start mt-4">
                  {/* Chart */}
                  <div className="xl:col-span-4 h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={harvestChartData} margin={{ top: 25, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                        <XAxis 
                          dataKey="name" 
                          stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                          fontSize={11} 
                          tickLine={false} 
                          tick={{ fill: theme === 'dark' ? '#94a3b8' : '#334155' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                          fontSize={11} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.toLocaleString('id-ID')}
                          tick={{ fill: theme === 'dark' ? '#94a3b8' : '#334155' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke={theme === 'dark' ? '#f59e0b' : '#d97706'} 
                          fontSize={11} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val}%`}
                          tick={{ fill: theme === 'dark' ? '#fbbf24' : '#d97706', fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                            borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', 
                            borderRadius: '12px',
                            color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#94a3b8' : '#475569' }}
                          formatter={(val: any, name: string) => {
                            if (name === "Pencapaian") return [`${Number(val).toFixed(1)}%`, name];
                            return [`${Number(val).toLocaleString('id-ID')} Bcs`, name];
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36} 
                          iconType="circle"
                          formatter={(value) => <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{value}</span>}
                        />
                        
                        {/* Category A Bar */}
                        <Bar 
                          yAxisId="left"
                          name={categoryA}
                          dataKey={categoryA} 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28} 
                          opacity={0.85} 
                        >
                          <LabelList dataKey={categoryA} content={(props: any) => <RenderVerticalLabel {...props} />} />
                        </Bar>
                        
                        {/* Category B Bar */}
                        <Bar 
                          yAxisId="left"
                          name={categoryB}
                          dataKey={categoryB} 
                          fill="#8b5cf6" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28} 
                          opacity={0.85} 
                        >
                          <LabelList dataKey={categoryB} content={(props: any) => <RenderVerticalLabel {...props} />} />
                        </Bar>

                        {/* Achievement Line */}
                        <Line 
                          yAxisId="right"
                          name="Pencapaian"
                          type="monotone" 
                          dataKey="Pencapaian" 
                          stroke="#f59e0b" 
                          strokeWidth={3} 
                          dot={{ r: 4, strokeWidth: 1, fill: theme === 'dark' ? '#020617' : '#ffffff' }} 
                        >
                          <LabelList dataKey="Pencapaian" content={(props: any) => <RenderPercentageAboveLine {...props} theme={theme} />} />
                        </Line>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data Table */}
                  <div className="xl:col-span-1">
                    <div className={`max-h-[360px] overflow-y-auto rounded-xl border transition-colors ${
                      theme === 'dark' ? 'border-slate-800 bg-slate-900/20' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className={`border-b transition-colors text-[10px] font-mono uppercase tracking-wider ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            <th className="py-2.5 px-3 font-bold">Periode</th>
                            <th className="py-2.5 px-2 font-bold text-right">{categoryA} / {categoryB}</th>
                            <th className="py-2.5 px-3 font-bold text-right">Var</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y text-xs transition-colors ${
                          theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                        }`}>
                          {harvestChartData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                              <td className="py-2 px-3 font-semibold">{row.name}</td>
                              <td className="py-2 px-2 text-right font-mono">
                                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  {row[categoryA] !== null && row[categoryA] !== undefined ? row[categoryA].toLocaleString('id-ID') : '-'}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {row[categoryB] !== null && row[categoryB] !== undefined ? row[categoryB].toLocaleString('id-ID') : '-'}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-xs">
                                {(() => {
                                  const valA = row[categoryA];
                                  const valB = row[categoryB];
                                  if (valA !== null && valA !== undefined && valB !== null && valB !== undefined) {
                                    const diff = valA - valB;
                                    const formattedDiff = diff.toLocaleString('id-ID', { maximumFractionDigits: 1 });
                                    const displaySign = diff > 0 ? "+" : "";
                                    return (
                                      <span className={diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-500"}>
                                        {displaySign}{formattedDiff}
                                      </span>
                                    );
                                  }
                                  return '-';
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* --- SHOOTING COMPARISON COMBO CHART --- */}
        <section id="shooting-comparison-panel" className={`!mt-0.5 rounded-2xl border transition-all duration-300 ${
          showShooting ? 'p-4 sm:p-6' : 'py-1.5 px-4 sm:px-6'
        } ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`${showShooting ? 'space-y-4' : ''}`}>
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
              showShooting 
                ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                : ''
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap min-w-0">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className={`p-1 rounded-lg border transition-colors shrink-0 ${
                    theme === 'dark'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      : 'bg-cyan-50 text-cyan-600 border-cyan-200'
                  }`}>
                    <BarChart2 className="h-3.5 w-3.5" />
                  </span>
                  <h3 className={`font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors break-words flex-wrap ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    Perbandingan Shooting ({selectedGroup}) {shootingRangeLabel}
                  </h3>
                </div>

                {/* Mode Selector Pill Buttons */}
                {showShooting && (
                  <div className={`flex flex-wrap items-center rounded-lg p-0.5 border text-xs font-semibold ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-xs'
                  }`}>
                    <button
                      onClick={() => setShootingCompareMode('shooting_vs_shooting')}
                      className={`px-2.5 py-1 rounded-md transition-all text-xs ${
                        shootingCompareMode === 'shooting_vs_shooting'
                          ? theme === 'dark' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'bg-white text-cyan-700 font-bold shadow-xs'
                          : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Shooting vs Target
                    </button>
                    <button
                      onClick={() => setShootingCompareMode('shooting_vs_harvest')}
                      className={`px-2.5 py-1 rounded-md transition-all text-xs ${
                        shootingCompareMode === 'shooting_vs_harvest'
                          ? theme === 'dark' ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'bg-white text-cyan-700 font-bold shadow-xs'
                          : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Shooting vs Panen (Lag 12 Mgg)
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
                {showShooting && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {shootingCompareMode === 'shooting_vs_shooting' ? (
                      <>
                        <select
                          value={shootingSourceType}
                          onChange={(e) => setShootingSourceType(e.target.value as any)}
                          className={`px-2 py-1 rounded-lg border text-xs font-semibold max-w-[130px] sm:max-w-none ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-700 text-cyan-400' : 'bg-white border-slate-300 text-cyan-700'
                          }`}
                        >
                          <option value="Aktual">Shooting Aktual</option>
                          <option value="Demand">Shooting Demand</option>
                          <option value="Rolling Forcast">Shooting Rolling Forecast</option>
                          <option value="Budget">Shooting Budget</option>
                        </select>
                        <span className="text-slate-400 font-bold">vs</span>
                        <select
                          value={shootingTargetType}
                          onChange={(e) => setShootingTargetType(e.target.value as any)}
                          className={`px-2 py-1 rounded-lg border text-xs font-semibold max-w-[130px] sm:max-w-none ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-700 text-indigo-400' : 'bg-white border-slate-300 text-indigo-700'
                          }`}
                        >
                          <option value="Demand">Shooting Demand</option>
                          <option value="Rolling Forcast">Shooting Rolling Forecast</option>
                          <option value="Budget">Shooting Budget</option>
                          <option value="Aktual">Shooting Aktual</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <select
                          value={shootingSourceType}
                          onChange={(e) => setShootingSourceType(e.target.value as any)}
                          className={`px-2 py-1 rounded-lg border text-xs font-semibold max-w-[130px] sm:max-w-none ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-700 text-cyan-400' : 'bg-white border-slate-300 text-cyan-700'
                          }`}
                        >
                          <option value="Aktual">Shooting Aktual</option>
                          <option value="Demand">Shooting Demand</option>
                          <option value="Rolling Forcast">Shooting Rolling Forecast</option>
                          <option value="Budget">Shooting Budget</option>
                        </select>
                        <span className="text-slate-400 font-bold">vs</span>
                        <span className={`px-2.5 py-1 rounded-lg border font-bold text-xs ${
                          theme === 'dark' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          Panen Aktual (Lag 12 Mgg)
                        </span>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setShowShooting(!showShooting)}
                  className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                  }`}
                  title={showShooting ? "Sembunyikan Panel" : "Tampilkan Panel"}
                >
                  {showShooting ? (
                    <ChevronUp className="h-4 w-4 text-rose-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-emerald-500" />
                  )}
                </button>
              </div>
            </div>

            {showShooting && (
              <>
                {shootingCompareMode === 'shooting_vs_harvest' && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    theme === 'dark' ? 'bg-cyan-950/30 border-cyan-800/40 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                  }`}>
                    <Info className="h-4 w-4 shrink-0 text-cyan-500" />
                    <span>
                      Membandingkan <strong>Shooting {shootingSourceType} Week (W-12)</strong> dengan <strong>Panen Aktual Week (W)</strong>.
                    </span>
                  </div>
                )}

                {/* Chart and Table side-by-side */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start mt-2">
                  {/* Chart */}
                  <div className="xl:col-span-4 h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={shootingChartData} margin={{ top: 25, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                        <XAxis 
                          dataKey="name" 
                          stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                          fontSize={11} 
                          tickLine={false} 
                          tick={{ fill: theme === 'dark' ? '#94a3b8' : '#334155' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                          fontSize={11} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.toLocaleString('id-ID')}
                          tick={{ fill: theme === 'dark' ? '#94a3b8' : '#334155' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke={theme === 'dark' ? '#f59e0b' : '#d97706'} 
                          fontSize={11} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val}%`}
                          tick={{ fill: theme === 'dark' ? '#fbbf24' : '#d97706', fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                            borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', 
                            borderRadius: '12px',
                            color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#94a3b8' : '#475569' }}
                          formatter={(val: any, name: string) => {
                            if (name === "Pencapaian" || name === "Pencapaian (%)") return [val !== null ? `${Number(val).toFixed(1)}%` : '-', name];
                            return [val !== null ? `${Number(val).toLocaleString('id-ID')} Bcs` : '-', name];
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36} 
                          iconType="circle"
                          formatter={(value) => <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{value}</span>}
                        />
                        
                        {/* Bar A (Shooting Source) */}
                        <Bar 
                          yAxisId="left"
                          name={shootingCompareMode === 'shooting_vs_shooting' ? `Shooting ${shootingSourceType}` : `Shooting ${shootingSourceType} (W-12)`}
                          dataKey="valA" 
                          fill="#06b6d4" 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28} 
                          opacity={0.85} 
                        >
                          <LabelList dataKey="valA" content={(props: any) => <RenderVerticalLabel {...props} />} />
                        </Bar>
                        
                        {/* Bar B (Target or Harvest) */}
                        <Bar 
                          yAxisId="left"
                          name={shootingCompareMode === 'shooting_vs_shooting' ? `Shooting ${shootingTargetType}` : `Panen Aktual (W)`}
                          dataKey="valB" 
                          fill={shootingCompareMode === 'shooting_vs_shooting' ? "#6366f1" : "#10b981"} 
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={28} 
                          opacity={0.85} 
                        >
                          <LabelList dataKey="valB" content={(props: any) => <RenderVerticalLabel {...props} />} />
                        </Bar>

                        {/* Achievement Line */}
                        <Line 
                          yAxisId="right"
                          name="Pencapaian"
                          type="monotone" 
                          dataKey="Pencapaian" 
                          stroke="#f59e0b" 
                          strokeWidth={3} 
                          dot={{ r: 4, strokeWidth: 1, fill: theme === 'dark' ? '#020617' : '#ffffff' }} 
                        >
                          <LabelList dataKey="Pencapaian" content={(props: any) => <RenderPercentageAboveLine {...props} theme={theme} />} />
                        </Line>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data Table */}
                  <div className="xl:col-span-1">
                    <div className={`max-h-[360px] overflow-y-auto rounded-xl border transition-colors ${
                      theme === 'dark' ? 'border-slate-800 bg-slate-900/20' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className={`border-b transition-colors text-[10px] font-mono uppercase tracking-wider ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            <th className="py-2.5 px-3 font-bold">Periode</th>
                            <th className="py-2.5 px-2 font-bold text-right">
                              {shootingCompareMode === 'shooting_vs_shooting' ? `${shootingSourceType} / ${shootingTargetType}` : `S (W-12) / P (W)`}
                            </th>
                            <th className="py-2.5 px-3 font-bold text-right">Var</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y text-xs transition-colors ${
                          theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                        }`}>
                          {shootingChartData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                              <td className="py-2 px-3 font-semibold">{row.name}</td>
                              <td className="py-2 px-2 text-right font-mono">
                                <div className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                                  {row.valA !== null && row.valA !== undefined ? row.valA.toLocaleString('id-ID') : '-'}
                                </div>
                                <div className={`text-[10px] ${shootingCompareMode === 'shooting_vs_shooting' ? 'text-indigo-500 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {row.valB !== null && row.valB !== undefined ? row.valB.toLocaleString('id-ID') : '-'}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-xs">
                                {(() => {
                                  const valA = row.valA;
                                  const valB = row.valB;
                                  if (valA !== null && valA !== undefined && valB !== null && valB !== undefined) {
                                    const diff = shootingCompareMode === 'shooting_vs_shooting' ? valA - valB : valB - valA;
                                    const formattedDiff = diff.toLocaleString('id-ID', { maximumFractionDigits: 1 });
                                    const displaySign = diff > 0 ? "+" : "";
                                    return (
                                      <span className={diff >= 0 ? "text-cyan-600 dark:text-cyan-400" : "text-rose-600 dark:text-rose-500"}>
                                        {displaySign}{formattedDiff}
                                      </span>
                                    );
                                  }
                                  return '-';
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* --- LOSSES BANANA PANEL --- */}
        <section id="loss-analysis-panel" className={`p-6 rounded-2xl border transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className="space-y-4">
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              showLossesBanana 
                ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                : ''
            }`}>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`p-1 rounded-lg border transition-colors shrink-0 ${
                  theme === 'dark'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  <AlertCircle className="h-3.5 w-3.5" />
                </span>
                <h3 className={`font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors break-words flex-wrap ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Losses Banana ({selectedGroup === 'GGF TOTAL' || selectedGroup === 'NSA CG' ? 'GGP' : selectedGroup}) {harvestRangeLabel}
                </h3>
              </div>
              
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
                {showLossesBanana && (
                  <div className={`flex rounded-lg p-0.5 border text-[11px] font-semibold transition-colors ${
                    theme === 'dark' ? 'bg-slate-900/80 border-slate-800/80' : 'bg-slate-100 border-slate-200 shadow-xs'
                  }`}>
                    <button
                      onClick={() => setLossesViewMode('cause')}
                      className={`px-2.5 py-1 rounded-md transition-all duration-150 ${
                        lossesViewMode === 'cause'
                          ? (theme === 'dark' ? 'bg-rose-500/25 text-rose-300 font-bold' : 'bg-white text-rose-600 font-bold shadow-xs')
                          : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
                      }`}
                    >
                      Penyebab Detail
                    </button>
                    <button
                      onClick={() => setLossesViewMode('category')}
                      className={`px-2.5 py-1 rounded-md transition-all duration-150 ${
                        lossesViewMode === 'category'
                          ? (theme === 'dark' ? 'bg-rose-500/25 text-rose-300 font-bold' : 'bg-white text-rose-600 font-bold shadow-xs')
                          : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
                      }`}
                    >
                      Kategori Utama
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowLossesBanana(!showLossesBanana)}
                  className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                  }`}
                  title={showLossesBanana ? "Sembunyikan Panel" : "Tampilkan Panel"}
                >
                  {showLossesBanana ? (
                    <ChevronUp className="h-4 w-4 text-rose-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-emerald-500" />
                  )}
                </button>
              </div>
            </div>

            {showLossesBanana && (
              <>
                {selectedGroup === 'NSA CG' && (
                  <div className={`p-3 rounded-lg text-xs border ${
                    theme === 'dark' 
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-300/95' 
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    * Catatan: Data Losses Banana untuk group <strong>NSA CG</strong> tidak tersedia pada data sumber. Menampilkan nilai 0.
                  </div>
                )}
                
                {/* Chart and Table side-by-side */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start mt-4">
                  {/* Chart */}
                  <div className="xl:col-span-4 h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={lossesBananaChartData} margin={{ top: 25, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                        <XAxis 
                          dataKey="name" 
                          stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                          fontSize={11} 
                          tickLine={false} 
                          tick={{ fill: theme === 'dark' ? '#94a3b8' : '#334155' }}
                        />
                        <YAxis 
                          stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} 
                          fontSize={11} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.toLocaleString('id-ID')}
                          tick={{ fill: theme === 'dark' ? '#94a3b8' : '#334155' }}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            const activePayload = payload.filter((p: any) => p.value && p.value > 0);
                            const totalVal = payload[0]?.payload?.Total ?? 0;
                            
                            return (
                              <div className={`p-3 rounded-xl border text-xs shadow-lg space-y-1.5 min-w-[200px] transition-colors ${
                                theme === 'dark' 
                                  ? 'bg-slate-950 border-slate-800 text-slate-100' 
                                  : 'bg-white border-slate-200 text-slate-800 shadow-md'
                              }`}>
                                <div className={`font-bold text-center border-b pb-1 ${
                                  theme === 'dark' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
                                }`}>
                                  {label}
                                </div>
                                <div className="space-y-1 py-1 max-h-[220px] overflow-y-auto">
                                  {activePayload.map((entry: any, i: number) => {
                                    if (entry.dataKey === 'Total') return null;
                                    return (
                                      <div key={i} className="flex justify-between items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                          <span className="font-medium text-[11px]">{entry.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-right text-[11px]">
                                          {Number(entry.value).toLocaleString('id-ID')} Bcs
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {activePayload.filter((p: any) => p.dataKey !== 'Total').length === 0 && (
                                    <div className="text-slate-400 text-center py-1">Tidak ada losses</div>
                                  )}
                                </div>
                                <div className={`flex justify-between items-center font-bold border-t pt-1.5 mt-1 ${
                                  theme === 'dark' ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-900'
                                }`}>
                                  <span>Total Losses</span>
                                  <span className="font-mono">{totalVal.toLocaleString('id-ID')} Bcs</span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={45} 
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => <span className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{value}</span>}
                        />
                        
                        {lossesViewMode === 'cause' ? (
                          // Stacked Bars for detailed causes
                          LOSSES_CAUSES.map((cause, cidx) => (
                            <Bar 
                              key={cause.key}
                              name={`${cause.key} (${cause.short})`}
                              dataKey={cause.key} 
                              stackId="a"
                              fill={cause.color} 
                              radius={[0, 0, 0, 0]} 
                              maxBarSize={28} 
                            />
                          ))
                        ) : (
                          // Stacked Bars for categories
                          <>
                            <Bar 
                              name="Virus"
                              dataKey="Virus" 
                              stackId="a"
                              fill="#f43f5e" 
                              radius={[0, 0, 0, 0]} 
                              maxBarSize={28} 
                            />
                            <Bar 
                              name="Diseases"
                              dataKey="Diseases" 
                              stackId="a"
                              fill="#fb923c" 
                              radius={[0, 0, 0, 0]} 
                              maxBarSize={28} 
                            />
                            <Bar 
                              name="Choping"
                              dataKey="Choping" 
                              stackId="a"
                              fill="#38bdf8" 
                              radius={[0, 0, 0, 0]} 
                              maxBarSize={28} 
                            />
                          </>
                        )}

                        {/* Total Line */}
                        <Line 
                          name="Total Losses"
                          type="monotone" 
                          dataKey="Total" 
                          stroke="#ec4899" 
                          strokeWidth={2.5}
                          dot={{ r: 3, strokeWidth: 1 }} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data Table */}
                  <div className="xl:col-span-1">
                    <div className={`max-h-[380px] overflow-y-auto rounded-xl border transition-colors ${
                      theme === 'dark' ? 'border-slate-800 bg-slate-900/20' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className={`border-b transition-colors text-[10px] font-mono uppercase tracking-wider ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            <th className="py-2.5 px-3 font-bold">Periode</th>
                            <th className="py-2.5 px-2 font-bold text-right">
                              {lossesViewMode === 'cause' ? 'Detail Penyebab' : 'Kategori (V/D/C)'}
                            </th>
                            <th className="py-2.5 px-3 font-bold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y text-xs transition-colors ${
                          theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                        }`}>
                          {lossesBananaChartData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                              <td className="py-2 px-3 font-semibold">{row.name}</td>
                              <td className="py-2 px-2 text-right">
                                {lossesViewMode === 'cause' ? (
                                  (() => {
                                    const activeCauses = LOSSES_CAUSES.map(c => ({
                                      name: c.short,
                                      color: c.color,
                                      val: row[c.key] ?? 0
                                    }))
                                    .filter(c => c.val > 0)
                                    .sort((a, b) => b.val - a.val);

                                    if (activeCauses.length === 0) {
                                      return <span className="text-slate-400 text-[10px]">0 Bcs</span>;
                                    }

                                    return (
                                      <div className="flex flex-col gap-0.5 items-end">
                                        {activeCauses.slice(0, 2).map((c, i) => (
                                          <div key={i} className="flex items-center gap-1 text-[10px] leading-tight">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                            <span className="font-semibold text-slate-500 dark:text-slate-400">{c.name}:</span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.val.toLocaleString('id-ID')}</span>
                                          </div>
                                        ))}
                                        {activeCauses.length > 2 && (
                                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                            +{activeCauses.length - 2} lainnya
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="font-mono text-[10px] whitespace-nowrap">
                                    <span className="text-rose-500 font-semibold">{row.Virus.toLocaleString('id-ID')}</span>
                                    <span className="text-slate-400 mx-0.5">/</span>
                                    <span className="text-orange-400 font-semibold">{row.Diseases.toLocaleString('id-ID')}</span>
                                    <span className="text-slate-400 mx-0.5">/</span>
                                    <span className="text-sky-400 font-semibold">{row.Choping.toLocaleString('id-ID')}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                {row.Total.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>



        <div id="bunchweight-trends-panel">
          <BunchweightTrendsPanel
            theme={theme}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            bunchweightChartData={bunchweightChartData}
            showBunchweightTableDetails={showBunchweightTableDetails}
            setShowBunchweightTableDetails={setShowBunchweightTableDetails}
          />
        </div>

        <div id="harvest-parameters-table-panel">
          <HarvestParametersTablePanel
            theme={theme}
            selectedGroup={selectedGroup}
            viewMode={viewMode}
            categoryA={categoryA}
            chartData={chartData}
            data={data}
          />
        </div>

        <div id="calibration-distribution-panel">
          <CalibrationDistributionPanel
            theme={theme}
            calibrationChartType={calibrationChartType}
            setCalibrationChartType={setCalibrationChartType}
            selectedCalibrationPg={selectedCalibrationPg}
            setSelectedCalibrationPg={setSelectedCalibrationPg}
            calibrationChartData={calibrationChartData}
            showCalibrationTableDetails={showCalibrationTableDetails}
            setShowCalibrationTableDetails={setShowCalibrationTableDetails}
          />
        </div>

        <div id="progress-diagnostics-panel">
          <ProgressAndDiagnosticsPanel
            theme={theme}
            selectedGroup={selectedGroup}
            progressChartData={progressChartData}
            showDiagnosticsDetails={showDiagnosticsDetails}
            setShowDiagnosticsDetails={setShowDiagnosticsDetails}
            diagnostics={diagnostics}
            viewMode={viewMode}
          />
        </div>

        {/* --- REC TOTAL PACKABLE TRENDS & DATA TABLE --- */}
        <section id="rec-packable-panel" className={`p-6 rounded-2xl space-y-6 border transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`border-b pb-4 transition-colors ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                  theme === 'dark'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                }`}>
                  <TrendingUp className="h-4 w-4" />
                </span>
                <h2 className={`text-sm sm:text-base md:text-lg font-bold truncate transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Grafik & Tabel REC Total Packable ({
                    recViewGroupType === 'all'
                      ? 'GGP, PG1, PG2, PG3, PG4'
                      : (recSelectedSingle || selectedGroup)
                  }){recTotalPackableRangeLabel ? ` ${recTotalPackableRangeLabel}` : ''}
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* View Type Toggle: Semua Grup vs Grup Tunggal */}
                <div className={`flex items-center p-0.5 rounded-lg border ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setRecViewGroupType('all')}
                    className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
                      recViewGroupType === 'all'
                        ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Semua Grup
                  </button>
                  <button
                    onClick={() => setRecViewGroupType('single')}
                    className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
                      recViewGroupType === 'single'
                        ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Grup Tunggal
                  </button>
                </div>

                {/* Dropdown for Single Group selection */}
                {recViewGroupType === 'single' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">Pilih Grup:</span>
                    <select
                      value={recSelectedSingle}
                      onChange={(e) => setRecSelectedSingle(e.target.value)}
                      className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-lg border transition-all focus:outline-hidden ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-indigo-500 shadow-xs'
                      }`}
                    >
                      <option value="GGP">GGP</option>
                      <option value="PG1">PG1</option>
                      <option value="PG2">PG2</option>
                      <option value="PG3">PG3</option>
                      <option value="PG4">PG4</option>
                      <option value="NSA CG">NSA CG</option>
                      <option value="GGF TOTAL">GGF TOTAL</option>
                    </select>
                  </div>
                )}

                {/* Chart Type Toggle */}
                <div className={`flex items-center p-0.5 rounded-lg border ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setRecTotalPackableChartType('line')}
                    className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
                      recTotalPackableChartType === 'line'
                        ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Grafik Garis
                  </button>
                  <button
                    onClick={() => setRecTotalPackableChartType('bar')}
                    className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
                      recTotalPackableChartType === 'bar'
                        ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Grafik Batang
                  </button>
                </div>
              </div>
            </div>
            {/* Subtitle hidden as requested */}
          </div>

          {/* Line or Bar Chart */}
          <div className="h-[320px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={recTotalPackableChartData} margin={{ top: 30, right: 20, left: -25, bottom: 0 }}>
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
                  domain={[80, 103]}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff', 
                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                  }} 
                  formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'REC Total Packable']}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                {activeGroups.map(group => {
                  const groupStyles: Record<string, { stroke: string; name: string }> = {
                    GGP: { stroke: '#3b82f6', name: 'GGP' },
                    PG1: { stroke: '#0d9488', name: 'PG1' },
                    PG2: { stroke: '#f59e0b', name: 'PG2' },
                    PG3: { stroke: '#ef4444', name: 'PG3' },
                    PG4: { stroke: '#a855f7', name: 'PG4' },
                    'NSA CG': { stroke: '#06b6d4', name: 'NSA CG' },
                    'GGF TOTAL': { stroke: '#ec4899', name: 'GGF TOTAL' },
                  };
                  const style = groupStyles[group] || { stroke: '#0d9488', name: group };
                  const isSingle = recViewGroupType === 'single';

                  if (recTotalPackableChartType === 'bar') {
                    return (
                      <Bar
                        key={group}
                        name={style.name}
                        dataKey={group}
                        fill={style.stroke}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={isSingle ? 50 : 28}
                      >
                        {isSingle && (
                          <LabelList
                            dataKey={group}
                            position="top"
                            offset={10}
                            style={{
                              fill: theme === 'dark' ? '#cbd5e1' : '#1e293b',
                              fontSize: 9,
                              fontWeight: '600'
                            }}
                            formatter={(val: any) => val !== null && val !== undefined ? `${Number(val).toFixed(1)}%` : ''}
                          />
                        )}
                      </Bar>
                    );
                  } else {
                    return (
                      <Line 
                        key={group}
                        name={style.name} 
                        type="monotone" 
                        dataKey={group} 
                        stroke={style.stroke} 
                        strokeWidth={isSingle ? 3 : 2.5} 
                        dot={{ r: isSingle ? 5 : 4, strokeWidth: 1.5, fill: theme === 'dark' ? '#020617' : '#ffffff' }}
                      >
                        {isSingle && (
                          <LabelList
                            dataKey={group}
                            position="top"
                            offset={10}
                            style={{
                              fill: theme === 'dark' ? '#cbd5e1' : '#1e293b',
                              fontSize: 9,
                              fontWeight: '600'
                            }}
                            formatter={(val: any) => val !== null && val !== undefined ? `${Number(val).toFixed(1)}%` : ''}
                          />
                        )}
                      </Line>
                    );
                  }
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className={`rounded-2xl border transition-all duration-300 ${
            showRecTableDetails ? 'p-6' : 'py-1.5 px-6'
          } ${
            theme === 'dark' ? 'bg-slate-900/10 border-slate-800/60 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className={`${showRecTableDetails ? 'space-y-4' : ''}`}>
              <div className={`flex items-center justify-between transition-colors ${
                showRecTableDetails 
                  ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                  : ''
              }`}>
                <h3 className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
                }`}>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  Tabel Rincian Persentase REC Total Packable
                </h3>
                <button
                  onClick={() => setShowRecTableDetails(!showRecTableDetails)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                  }`}
                  title={showRecTableDetails ? "Sembunyikan Panel" : "Tampilkan Panel"}
                >
                  {showRecTableDetails ? (
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

              {showRecTableDetails && (
                <div className="max-h-56 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className={`border-b transition-colors text-xs font-mono uppercase tracking-wider ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        <th className="py-3 px-4 font-semibold sticky top-0">Rentang Waktu</th>
                        {activeGroups.map(group => (
                          <th key={group} className="py-3 px-4 font-semibold text-right sticky top-0">{group}</th>
                        ))}
                        {activeGroups.filter(g => g !== 'GGP' && g !== 'GGF TOTAL').length > 1 && (
                          <th className="py-3 px-4 font-semibold text-right sticky top-0">Rata-rata PG</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-xs transition-colors ${
                      theme === 'dark' ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-100 text-slate-700'
                    }`}>
                      {recTotalPackableChartData.map((row, idx) => {
                        const subGroupValues = activeGroups
                          .filter(g => g !== 'GGP' && g !== 'GGF TOTAL')
                          .map(g => row[g])
                          .filter((v): v is number => v !== null && v !== undefined);
                        const avg = subGroupValues.length > 0 ? (subGroupValues.reduce((sum, v) => sum + v, 0) / subGroupValues.length).toFixed(2) + '%' : '-';
                        const showAvg = activeGroups.filter(g => g !== 'GGP' && g !== 'GGF TOTAL').length > 1;
                        
                        return (
                          <tr key={idx} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors`}>
                            <td className="py-2.5 px-4 font-medium">{row.name}</td>
                            {activeGroups.map(group => {
                              const val = row[group];
                              
                              let colorClass = "text-teal-600 dark:text-teal-400";
                              if (group === 'PG1') colorClass = "text-teal-600 dark:text-teal-400";
                              if (group === 'PG2') colorClass = "text-amber-600 dark:text-amber-400";
                              if (group === 'PG3') colorClass = "text-rose-600 dark:text-rose-400";
                              if (group === 'PG4') colorClass = "text-purple-600 dark:text-purple-400";
                              if (group === 'NSA CG') colorClass = "text-cyan-600 dark:text-cyan-400";
                              if (group === 'GGP') colorClass = "text-blue-600 dark:text-blue-400";
                              if (group === 'GGF TOTAL') colorClass = "text-pink-600 dark:text-pink-400";

                              return (
                                <td key={group} className={`py-2.5 px-4 text-right font-mono ${colorClass} font-semibold`}>
                                  {val !== null && val !== undefined ? `${val.toFixed(2)}%` : '-'}
                                </td>
                              );
                            })}
                            {showAvg && (
                              <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900 dark:text-slate-100">
                                {avg}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- DYNAMIC TREND DEFECT CURAH PANEL (PLANTATION, HARVEST, PACKING HOUSE) --- */}
        <section id="curah-defects-panel" className={`p-6 rounded-2xl space-y-6 border transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`border-b pb-4 transition-colors ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <h2 className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    5 Besar Defect Curah: Plantation, Harvest & Packing House ({selectedGroup}){curahDefectsTrend.latestDataLabel ? ` (${curahDefectsTrend.latestDataLabel})` : ''}
                  </h2>
                  {curahDefectsTrend.proxyUsed && (
                    <span className="text-[10px] text-amber-500 font-semibold uppercase bg-amber-500/10 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                      Menggunakan Data {curahDefectsTrend.proxyUsed} Sebagai Proxy Pertanian
                    </span>
                  )}
                </div>
              </div>

              {/* Basis % Defect Toggle & Trend Info */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Basis %:</span>
                  <div className={`inline-flex rounded-lg p-0.5 border ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'
                  }`}>
                    <button
                      onClick={() => setCurahBasisMode('100_curah')}
                      title="Persentase defect dari 100% total curah"
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                        curahBasisMode === '100_curah'
                          ? theme === 'dark'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-white text-slate-900 shadow-xs'
                          : theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      100%
                    </button>
                    <button
                      onClick={() => setCurahBasisMode('curah_pct')}
                      title="Persentase defect dari % curah riil = (100 - REC Total Packable Aktual)"
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                        curahBasisMode === 'curah_pct'
                          ? theme === 'dark'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-white text-slate-900 shadow-xs'
                          : theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      %Real
                    </button>
                  </div>
                </div>

                <div className={`text-xs border-l pl-2.5 transition-colors ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                  Tren Analisis: <span className="font-semibold text-amber-500 uppercase">{viewMode === 'weekly' || viewMode === 'daily' ? 'WoW (Mingguan)' : 'MoM (Bulanan)'}</span>
                </div>
              </div>
            </div>

            <p className={`text-xs mt-2 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
              <strong>Panduan Tindakan PPIC:</strong> Ketika efisiensi <strong>REC Total Packable (Recovery)</strong> menurun, gunakan rincian 5 besar defect curah ini untuk mendiagnosis penyebab utama. Defect dengan status <span className="text-rose-500 dark:text-rose-400 font-semibold">Naik (Memburuk)</span> adalah parameter kritis yang sedang menyumbang kerusakan buah tertinggi, sementara status <span className="text-teal-600 dark:text-teal-400 font-semibold">Turun (Membaik)</span> menunjukkan keberhasilan penanggulangan mutu di lapangan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. PLANTATION COLUMN */}
            <div className={`p-4 rounded-xl border transition-colors ${
              theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h3 className={`text-sm font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  1. Kategori PLANTATION (Kebun)
                </h3>
              </div>
              
              {curahDefectsTrend.plantation.length === 0 ? (
                <div className="text-xs text-center py-6 text-slate-400">
                  Tidak ada data defect Plantation
                </div>
              ) : (
                <div className="space-y-3">
                  {curahDefectsTrend.plantation.map((defect, i) => {
                    const trendDir = defect.direction;
                    const diffVal紧 = defect.diff;
                    const precision = curahBasisMode === 'curah_pct' ? 2 : 1;
                    const displayDiff = defect.diff !== null ? `${defect.diff > 0 ? '+' : ''}${defect.diff.toFixed(precision)}%` : '';
                    const progLabel紧 = defect.modeLabel === 'WoW'
                      ? `Progres Mingguan (${defect.points.length} mgg)`
                      : `Progres Bulanan (${defect.points.length} bln)`;
                    
                    return (
                      <div key={i} className={`border p-3 rounded-xl flex items-center justify-between gap-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800/40'
                          : 'bg-white border-slate-200/80 shadow-sm'
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`flex items-center justify-center h-6 w-6 font-mono font-bold text-[10px] rounded-full border shrink-0 transition-colors ${
                            theme === 'dark'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={`text-[11px] font-bold block uppercase truncate transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                              {defect.defectName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[9px] transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                {progLabel紧}
                              </span>
                              {trendDir !== 'unknown' && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold ${
                                  trendDir === 'down'
                                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                                    : trendDir === 'up'
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                      : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                }`}>
                                  {trendDir === 'down' ? '↓' : trendDir === 'up' ? '↑' : ''} {displayDiff} {defect.modeLabel}
                                  {trendDir === 'down' ? ' (Membaik)' : trendDir === 'up' ? ' (Memburuk)' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sparkline Trend */}
                        {defect.points && defect.points.length > 0 && (
                          <div className="w-16 h-8 shrink-0 hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={defect.points}>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                                    borderRadius: '6px',
                                    padding: '2px 6px',
                                    fontSize: '9px',
                                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                                  }}
                                  labelStyle={{ display: 'none' }}
                                  itemStyle={{ color: '#10b981', padding: 0 }}
                                  formatter={(val: any) => [`${Number(val).toFixed(precision)}%`, '']}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#10b981"
                                  fill="#10b981"
                                  fillOpacity={0.08}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono text-emerald-500 dark:text-emerald-400 block">
                            {defect.latestVal !== null ? `${defect.latestVal.toFixed(precision)}%` : `${defect.activeAvg.toFixed(precision)}%`}
                          </span>
                          <span className={`text-[8px] font-mono block transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {defect.latestPointName ? `${defect.latestPointName}` : `Avg: ${defect.activeAvg.toFixed(precision)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. HARVEST COLUMN */}
            <div className={`p-4 rounded-xl border transition-colors ${
              theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <h3 className={`text-sm font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  2. Kategori HARVEST (Panen)
                </h3>
              </div>
              
              {curahDefectsTrend.harvest.length === 0 ? (
                <div className="text-xs text-center py-6 text-slate-400">
                  Tidak ada data defect Harvest
                </div>
              ) : (
                <div className="space-y-3">
                  {curahDefectsTrend.harvest.map((defect, i) => {
                    const trendDir = defect.direction;
                    const precision = curahBasisMode === 'curah_pct' ? 2 : 1;
                    const displayDiff = defect.diff !== null ? `${defect.diff > 0 ? '+' : ''}${defect.diff.toFixed(precision)}%` : '';
                    const progLabel = defect.modeLabel === 'WoW'
                      ? `Progres Mingguan (${defect.points.length} mgg)`
                      : `Progres Bulanan (${defect.points.length} bln)`;
                    
                    return (
                      <div key={i} className={`border p-3 rounded-xl flex items-center justify-between gap-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800/40'
                          : 'bg-white border-slate-200/80 shadow-sm'
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`flex items-center justify-center h-6 w-6 font-mono font-bold text-[10px] rounded-full border shrink-0 transition-colors ${
                            theme === 'dark'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={`text-[11px] font-bold block uppercase truncate transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                              {defect.defectName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[9px] transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                {progLabel}
                              </span>
                              {trendDir !== 'unknown' && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold ${
                                  trendDir === 'down'
                                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                                    : trendDir === 'up'
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                      : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                }`}>
                                  {trendDir === 'down' ? '↓' : trendDir === 'up' ? '↑' : ''} {displayDiff} {defect.modeLabel}
                                  {trendDir === 'down' ? ' (Membaik)' : trendDir === 'up' ? ' (Memburuk)' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sparkline Trend */}
                        {defect.points && defect.points.length > 0 && (
                          <div className="w-16 h-8 shrink-0 hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={defect.points}>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                                    borderRadius: '6px',
                                    padding: '2px 6px',
                                    fontSize: '9px',
                                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                                  }}
                                  labelStyle={{ display: 'none' }}
                                  itemStyle={{ color: '#f59e0b', padding: 0 }}
                                  formatter={(val: any) => [`${Number(val).toFixed(precision)}%`, '']}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#f59e0b"
                                  fill="#f59e0b"
                                  fillOpacity={0.08}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono text-amber-500 dark:text-amber-400 block">
                            {defect.latestVal !== null ? `${defect.latestVal.toFixed(precision)}%` : `${defect.activeAvg.toFixed(precision)}%`}
                          </span>
                          <span className={`text-[8px] font-mono block transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {defect.latestPointName ? `${defect.latestPointName}` : `Avg: ${defect.activeAvg.toFixed(precision)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. PACKING HOUSE COLUMN */}
            <div className={`p-4 rounded-xl border transition-colors ${
              theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <h3 className={`text-sm font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                  3. Kategori PACKING HOUSE (PH)
                </h3>
              </div>
              
              {curahDefectsTrend.packingHouse.length === 0 ? (
                <div className="text-xs text-center py-6 text-slate-400">
                  Tidak ada data defect Packing House
                </div>
              ) : (
                <div className="space-y-3">
                  {curahDefectsTrend.packingHouse.map((defect, i) => {
                    const trendDir紧 = defect.direction;
                    const precision = curahBasisMode === 'curah_pct' ? 2 : 1;
                    const displayDiff = defect.diff !== null ? `${defect.diff > 0 ? '+' : ''}${defect.diff.toFixed(precision)}%` : '';
                    const progLabel = defect.modeLabel === 'WoW'
                      ? `Progres Mingguan (${defect.points.length} mgg)`
                      : `Progres Bulanan (${defect.points.length} bln)`;
                    
                    return (
                      <div key={i} className={`border p-3 rounded-xl flex items-center justify-between gap-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800/40'
                          : 'bg-white border-slate-200/80 shadow-sm'
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`flex items-center justify-center h-6 w-6 font-mono font-bold text-[10px] rounded-full border shrink-0 transition-colors ${
                            theme === 'dark'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={`text-[11px] font-bold block uppercase truncate transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                              {defect.defectName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[9px] transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                {progLabel}
                              </span>
                              {trendDir紧 !== 'unknown' && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold ${
                                  trendDir紧 === 'down'
                                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                                    : trendDir紧 === 'up'
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                      : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                }`}>
                                  {trendDir紧 === 'down' ? '↓' : trendDir紧 === 'up' ? '↑' : ''} {displayDiff} {defect.modeLabel}
                                  {trendDir紧 === 'down' ? ' (Membaik)' : trendDir紧 === 'up' ? ' (Memburuk)' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sparkline Trend */}
                        {defect.points && defect.points.length > 0 && (
                          <div className="w-16 h-8 shrink-0 hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={defect.points}>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                                    borderRadius: '6px',
                                    padding: '2px 6px',
                                    fontSize: '9px',
                                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                                  }}
                                  labelStyle={{ display: 'none' }}
                                  itemStyle={{ color: '#f43f5e', padding: 0 }}
                                  formatter={(val: any) => [`${Number(val).toFixed(precision)}%`, '']}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#f43f5e"
                                  fill="#f43f5e"
                                  fillOpacity={0.08}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono text-rose-500 dark:text-rose-400 block">
                            {defect.latestVal !== null ? `${defect.latestVal.toFixed(precision)}%` : `${defect.activeAvg.toFixed(precision)}%`}
                          </span>
                          <span className={`text-[8px] font-mono block transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {defect.latestPointName ? `${defect.latestPointName}` : `Avg: ${defect.activeAvg.toFixed(precision)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- CLASS A & CLASS B QUALITY RATIO PIE CHART --- */}
        <section id="fruit-quality-ratio-panel" className={`p-6 rounded-2xl space-y-6 border transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`border-b pb-4 transition-colors ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                  theme === 'dark'
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                    : 'bg-teal-50 text-teal-600 border-teal-200'
                }`}>
                  <PieIcon className="h-4 w-4" />
                </span>
                <h2 className={`text-sm sm:text-base md:text-lg font-bold truncate transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Rasio Kualitas Buah: Class A vs Class B ({selectedGroup})
                </h2>
              </div>

              <div className="flex items-center shrink-0 gap-3">
                {/* ToDate vs Trend Toggle */}
                <div className={`flex items-center p-0.5 rounded-lg border ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setQualityRatioChartType('todate')}
                    className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
                      qualityRatioChartType === 'todate'
                        ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    ToDate
                  </button>
                  <button
                    onClick={() => setQualityRatioChartType('trend')}
                    className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
                      qualityRatioChartType === 'trend'
                        ? theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Progres
                  </button>
                </div>

                <div className={`text-xs hidden md:block transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Filter Aktif: <span className="font-semibold text-teal-500 uppercase">{viewMode === 'weekly' ? 'Mingguan' : viewMode === 'daily' ? 'Harian' : 'Bulanan'}</span>
                </div>
              </div>
            </div>
            <p className={`text-xs mt-1.5 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Grafik proporsi volume panen aktual berkualitas ekspor (Class A) dan kualitas lokal/sekunder (Class B) untuk menakar efisiensi pengemasan kebun.
            </p>
          </div>

          {classABData && classABData.hasData ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Pie Chart or Trend Chart Area */}
              {qualityRatioChartType === 'trend' ? (
                <div className="lg:col-span-7 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={classABData.trendData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
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
                          color: theme === 'dark' ? '#cbd5e1' : '#1e293b',
                          fontSize: '11px',
                        }} 
                        formatter={(value: any, name: any, entry: any) => {
                          const payload = entry.payload;
                          if (!payload) return [`${value}%`];
                          const isA = name.includes('Class A') || name.includes('Premium');
                          const vol = isA ? payload.valA : payload.valB;
                          const ton = (vol * 13.5) / 1000;
                          return [
                            `${Number(value).toFixed(1)}% (${Math.round(vol).toLocaleString('id-ID')} Box / ${ton.toFixed(1)} Ton)`,
                            name
                          ];
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area 
                        type="monotone" 
                        name="Class B (Sekunder)" 
                        dataKey="pctB" 
                        stackId="1" 
                        stroke="#f59e0b" 
                        fill="#f59e0b" 
                        fillOpacity={0.4} 
                      />
                      <Area 
                        type="monotone" 
                        name="Class A (Premium)" 
                        dataKey="pctA" 
                        stackId="1" 
                        stroke="#0ea5e9" 
                        fill="#0ea5e9" 
                        fillOpacity={0.4} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="lg:col-span-5 flex justify-center items-center h-[260px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Class A (Premium)', value: classABData.sumA },
                          { name: 'Class B (Sekunder)', value: classABData.sumB }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#0ea5e9" /> {/* Sky Blue for Class A */}
                        <Cell fill="#f59e0b" /> {/* Amber for Class B */}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [
                          `${value.toLocaleString('id-ID')} Box (${(value * 13.5 / 1000).toFixed(1)} Ton)`, 
                          'Volume'
                        ]}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                          fontSize: '11px',
                          borderRadius: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center text overlay */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-[10px] font-mono uppercase tracking-wider transition-colors ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>Total Vol</span>
                    <span className={`text-sm font-extrabold transition-colors ${
                      theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      {((classABData.sumA + classABData.sumB) * 13.5 / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} T
                    </span>
                    <span className={`text-[9px] transition-colors ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {Math.round(classABData.sumA + classABData.sumB).toLocaleString('id-ID')} Box
                    </span>
                  </div>
                </div>
              )}

              {/* Data Breakdown & Analysis */}
              <div className={`${qualityRatioChartType === 'trend' ? 'lg:col-span-5' : 'lg:col-span-7'} space-y-5`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Class A Box */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    theme === 'dark' ? 'bg-sky-950/20 border-sky-500/20' : 'bg-sky-50/50 border-sky-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-500">CLASS A (Premium)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-500">
                        {((classABData.sumA / (classABData.sumA + classABData.sumB)) * 100 || 0).toFixed(1)}%
                      </span>
                    </div>
                    <p className={`text-lg font-black mt-2 transition-colors ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {classABData.sumA.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs font-normal">Box</span>
                    </p>
                    <div className={`flex justify-between items-center text-[10px] mt-1 font-mono transition-colors ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <span>Setara Tonase:</span>
                      <span className="font-bold text-sky-500">
                        {((classABData.sumA * 13.5) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton
                      </span>
                    </div>
                  </div>

                  {/* Class B Box */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    theme === 'dark' ? 'bg-amber-950/20 border-amber-500/20' : 'bg-amber-50/50 border-amber-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-500">CLASS B (Sekunder)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500">
                        {((classABData.sumB / (classABData.sumA + classABData.sumB)) * 100 || 0).toFixed(1)}%
                      </span>
                    </div>
                    <p className={`text-lg font-black mt-2 transition-colors ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {classABData.sumB.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs font-normal">Box</span>
                    </p>
                    <div className={`flex justify-between items-center text-[10px] mt-1 font-mono transition-colors ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <span>Setara Tonase:</span>
                      <span className="font-bold text-amber-500">
                        {((classABData.sumB * 13.5) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI & PPIC Analysis Insight */}
                <div className={`p-4 rounded-xl border transition-all text-xs leading-relaxed ${
                  theme === 'dark' 
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' 
                    : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1.5 text-teal-500">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    <span>PPIC Quality Insight ({selectedGroup})</span>
                  </div>
                  {(() => {
                    const ratioA = (classABData.sumA / (classABData.sumA + classABData.sumB)) * 100;
                    if (ratioA >= 70) {
                      return (
                        <p>
                          Performa kualitas panen di <strong>{selectedGroup}</strong> sangat prima dengan rasio Class A mencapai <strong>{ratioA.toFixed(1)}%</strong>. 
                          Dominasi buah berkualitas premium ini memaksimalkan potensi pendapatan ekspor dan menunjukkan efisiensi tinggi pada penanganan harian kebun serta tingkat kematangan buah yang seragam saat proses panen.
                        </p>
                      );
                    } else if (ratioA >= 50) {
                      return (
                        <p>
                          Kualitas buah di <strong>{selectedGroup}</strong> berada dalam level moderat dengan rasio Class A sebesar <strong>{ratioA.toFixed(1)}%</strong>. 
                          Terdapat peluang peningkatan melalui penekanan intensitas perawatan kebun, proteksi buah dari serangan hama thrips, serta meminimalisir luka mekanis saat pengangkutan dari lapangan menuju packing house.
                        </p>
                      );
                    } else {
                      return (
                        <p>
                          Rasio Class A di <strong>{selectedGroup}</strong> tergolong rendah di angka <strong>{ratioA.toFixed(1)}%</strong> (didominasi Class B sebesar <strong>{(100 - ratioA).toFixed(1)}%</strong>). 
                          PPIC merekomendasikan investigasi segera terhadap defect dominan di lapangan (seperti penyakit moko, sunburn, atau luka gesek) guna mencegah penurunan grade buah lebih lanjut sebelum proses pengemasan.
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-8 text-center italic text-xs transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Tidak ada data aktual untuk parameter CLASS A dan CLASS B pada Group {selectedGroup} untuk periode/filter ini.
            </div>
          )}
        </section>

        {/* --- TOP 5 DEFECTS BREAKDOWN --- */}
        <section id="top5-defects-panel" className={`p-6 rounded-2xl space-y-6 border transition-colors ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`border-b pb-4 transition-colors ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <h2 className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  5 Besar Defects (FB) Plantation, Harvest & Packing House
                </h2>
              </div>
              <div className={`text-xs transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Peringkat defek untuk Group: <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{selectedGroup}</span>
                {groupDefects.proxyUsed && (
                  <span className={`font-semibold block sm:inline sm:ml-2 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                    (Menggunakan {groupDefects.proxyUsed} sebagai data representatif)
                  </span>
                )}
              </div>
            </div>
            <p className={`text-xs mt-1 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Deffect diurutkan berdasarkan persentase kejadian terbesar. menunjukan deffect apa yang paling berkontribusi menurunkan recovery Class A
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plantation Defects Column */}
            <div className="space-y-4">
              <div className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>Plantation Defects (Kebun)</span>
              </div>

              <div className="space-y-3">
                {groupDefects.plantation.length === 0 ? (
                  <p className={`text-xs italic p-4 text-center transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Tidak ada rincian data defek plantation.</p>
                ) : (
                  groupDefects.plantation.map((item, idx) => {
                    return (
                      <div key={idx} className={`border p-3 rounded-xl flex items-center justify-between gap-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800/40'
                          : 'bg-slate-50 border-slate-200/80 shadow-sm'
                      }`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`flex items-center justify-center h-6 w-6 font-mono font-bold text-xs rounded-full border shrink-0 transition-colors ${
                            theme === 'dark'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {item.rank}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={`text-xs font-bold block truncate transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                              {item.defectName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[10px] transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                Progres Mingguan ({item.weeklyData.length} mgg)
                              </span>
                              {item.diff !== null && item.diff !== undefined && (
                                <span className={`inline-flex items-center gap-0.5 px-1 rounded text-[9px] font-mono font-bold ${
                                  item.direction === 'down'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : item.direction === 'up'
                                      ? 'bg-rose-500/10 text-rose-500'
                                      : 'bg-slate-500/10 text-slate-500'
                                }`}>
                                  {item.direction === 'down' ? <ArrowDown className="h-2 w-2" /> : item.direction === 'up' ? <ArrowUp className="h-2 w-2" /> : null}
                                  {item.diff > 0 ? '+' : ''}{item.diff.toFixed(1)}% WoW
                                  {item.direction === 'down' ? ' (Membaik)' : item.direction === 'up' ? ' (Memburuk)' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sparkline Trend */}
                        {item.weeklyData && item.weeklyData.length > 0 && (
                          <div className="w-24 h-8 shrink-0 hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={item.weeklyData}>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                                    borderRadius: '6px',
                                    padding: '2px 6px',
                                    fontSize: '9px',
                                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                                  }}
                                  labelStyle={{ display: 'none' }}
                                  itemStyle={{ color: '#10b981', padding: 0 }}
                                  formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#10b981"
                                  fill="#10b981"
                                  fillOpacity={0.08}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black font-mono text-emerald-500 block">
                            {item.latestVal !== null && item.latestVal !== undefined ? `${item.latestVal.toFixed(1)}%` : `${item.monthlyAvg.toFixed(1)}%`}
                          </span>
                          <span className={`text-[9px] font-mono block transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {item.latestWeekName ? `${item.latestWeekName}` : `Avg: ${item.monthlyAvg.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Harvest & Packing House Defects Column */}
            <div className="space-y-4">
              <div className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <FileSpreadsheet className="h-4 w-4 text-purple-500" />
                <span>Harvest & Packing House Defects</span>
              </div>

              <div className="space-y-3">
                {groupDefects.harvestPH.length === 0 ? (
                  <p className={`text-xs italic p-4 text-center transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Tidak ada rincian data defek harvest / PH.</p>
                ) : (
                  groupDefects.harvestPH.map((item, idx) => {
                    return (
                      <div key={idx} className={`border p-3 rounded-xl flex items-center justify-between gap-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800/40'
                          : 'bg-slate-50 border-slate-200/80 shadow-sm'
                      }`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`flex items-center justify-center h-6 w-6 font-mono font-bold text-xs rounded-full border shrink-0 transition-colors ${
                            theme === 'dark'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-purple-50 text-purple-600 border-purple-200'
                          }`}>
                            {item.rank}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={`text-xs font-bold block truncate transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                              {item.defectName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[10px] transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                Progres Mingguan ({item.weeklyData.length} mgg)
                              </span>
                              {item.diff !== null && item.diff !== undefined && (
                                <span className={`inline-flex items-center gap-0.5 px-1 rounded text-[9px] font-mono font-bold ${
                                  item.direction === 'down'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : item.direction === 'up'
                                      ? 'bg-rose-500/10 text-rose-500'
                                      : 'bg-slate-500/10 text-slate-500'
                                }`}>
                                  {item.direction === 'down' ? <ArrowDown className="h-2 w-2" /> : item.direction === 'up' ? <ArrowUp className="h-2 w-2" /> : null}
                                  {item.diff > 0 ? '+' : ''}{item.diff.toFixed(1)}% WoW
                                  {item.direction === 'down' ? ' (Membaik)' : item.direction === 'up' ? ' (Memburuk)' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sparkline Trend */}
                        {item.weeklyData && item.weeklyData.length > 0 && (
                          <div className="w-24 h-8 shrink-0 hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={item.weeklyData}>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#020617' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                                    borderRadius: '6px',
                                    padding: '2px 6px',
                                    fontSize: '9px',
                                    color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
                                  }}
                                  labelStyle={{ display: 'none' }}
                                  itemStyle={{ color: '#a855f7', padding: 0 }}
                                  formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#a855f7"
                                  fill="#a855f7"
                                  fillOpacity={0.08}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black font-mono text-purple-500 block">
                            {item.latestVal !== null && item.latestVal !== undefined ? `${item.latestVal.toFixed(1)}%` : `${item.monthlyAvg.toFixed(1)}%`}
                          </span>
                          <span className={`text-[9px] font-mono block transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {item.latestWeekName ? `${item.latestWeekName}` : `Avg: ${item.monthlyAvg.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>







        {/* --- ANALISA PENURUNAN BUNCHWEIGHT & TINDAKAN PERBAIKAN --- */}
        <section id="bunchweight-analysis-section" className={`rounded-2xl border transition-all duration-300 ${
          showBunchweightAnalysis ? 'p-6' : 'py-1.5 px-6'
        } ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`${showBunchweightAnalysis ? 'space-y-6' : ''}`}>
            <div className={`flex items-center justify-between transition-colors ${
              showBunchweightAnalysis 
                ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                : ''
            }`}>
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  <ClipboardList className="h-4 w-4" />
                </span>
                <h2 className={`text-sm md:text-lg font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Analisa Penurunan Bunchweight & Rencana Tindakan Perbaikan
                </h2>
              </div>
              <button
                onClick={() => setShowBunchweightAnalysis(!showBunchweightAnalysis)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                }`}
                title={showBunchweightAnalysis ? "Sembunyikan Panel" : "Tampilkan Panel"}
              >
                {showBunchweightAnalysis ? (
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

            {showBunchweightAnalysis && (
              <>
                <p className={`text-xs -mt-2 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ulasan mendalam pengaruh 4 faktor agronomi terhadap bobot tandan aktual beserta simulasi pemulihan dan langkah strategis PPIC & Agronomy.
                </p>

                {/* Diagnostic Grid: Actual vs Target & Estimated Contribution */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Calibration Card */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    1. Kalibrasi Buah
                  </span>
                  <div className="text-xl font-bold font-mono">
                    {bunchweightAnalysisSummary?.avgCalib ? `${bunchweightAnalysisSummary.avgCalib.toFixed(2)} cm` : '-'}
                  </div>
                </div>
                <span className={`p-1 rounded-lg ${
                  (bunchweightAnalysisSummary?.avgCalib || 0) >= 44.5 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <Cpu className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Target Optimal:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">44.50 cm</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Deviasi:</span>
                  <span className={`font-semibold font-mono ${
                    (bunchweightAnalysisSummary?.avgCalib || 0) >= 44.5 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {(bunchweightAnalysisSummary?.avgCalib || 0) >= 44.5 ? '+' : ''}
                    {((bunchweightAnalysisSummary?.avgCalib || 0) - 44.5).toFixed(2)} cm
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Est. Kontribusi:</span>
                  <span className={`font-bold font-mono ${
                    (bunchweightAnalysisSummary?.avgCalib || 0) >= 44.5 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {(bunchweightAnalysisSummary?.avgCalib || 0) >= 44.5 ? '+' : ''}
                    {(((bunchweightAnalysisSummary?.avgCalib || 0) - 44.5) * 0.45).toFixed(2)} Kg
                  </span>
                </div>
              </div>
            </div>

            {/* Age Card */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    2. Umur Panen
                  </span>
                  <div className="text-xl font-bold font-mono">
                    {bunchweightAnalysisSummary?.avgAge ? `${bunchweightAnalysisSummary.avgAge.toFixed(2)} mgg` : '-'}
                  </div>
                </div>
                <span className={`p-1 rounded-lg ${
                  (bunchweightAnalysisSummary?.avgAge || 0) >= 10.0 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Target Optimal:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">10.00 mgg</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Deviasi:</span>
                  <span className={`font-semibold font-mono ${
                    (bunchweightAnalysisSummary?.avgAge || 0) >= 10.0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {(bunchweightAnalysisSummary?.avgAge || 0) >= 10.0 ? '+' : ''}
                    {((bunchweightAnalysisSummary?.avgAge || 0) - 10.0).toFixed(2)} mgg
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Est. Kontribusi:</span>
                  <span className={`font-bold font-mono ${
                    (bunchweightAnalysisSummary?.avgAge || 0) >= 10.0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {(bunchweightAnalysisSummary?.avgAge || 0) >= 10.0 ? '+' : ''}
                    {(((bunchweightAnalysisSummary?.avgAge || 0) - 10.0) * 1.2).toFixed(2)} Kg
                  </span>
                </div>
              </div>
            </div>

            {/* Hand Class Card */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    3. Hanclass Panen
                  </span>
                  <div className="text-xl font-bold font-mono">
                    {bunchweightAnalysisSummary?.avgHand ? `${bunchweightAnalysisSummary.avgHand.toFixed(2)}` : '-'}
                  </div>
                </div>
                <span className={`p-1 rounded-lg ${
                  (bunchweightAnalysisSummary?.avgHand || 0) >= 8.0 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <Layers className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Target Optimal:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">8.00 sisir</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Deviasi:</span>
                  <span className={`font-semibold font-mono ${
                    (bunchweightAnalysisSummary?.avgHand || 0) >= 8.0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {(bunchweightAnalysisSummary?.avgHand || 0) >= 8.0 ? '+' : ''}
                    {((bunchweightAnalysisSummary?.avgHand || 0) - 8.0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Est. Kontribusi:</span>
                  <span className={`font-bold font-mono ${
                    (bunchweightAnalysisSummary?.avgHand || 0) >= 8.0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {(bunchweightAnalysisSummary?.avgHand || 0) >= 8.0 ? '+' : ''}
                    {(((bunchweightAnalysisSummary?.avgHand || 0) - 8.0) * 1.5).toFixed(2)} Kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Interactive Simulation Panel */}
          <div className={`p-5 rounded-xl border ${
            theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80' : 'bg-slate-50 border-slate-200 shadow-sm'
          } grid grid-cols-1 lg:grid-cols-12 gap-6`}>
            {/* Left side: Range sliders */}
            <div className="lg:col-span-7 space-y-5">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Simulasi Pemulihan & Skenario Perbaikan Parameter
              </h3>
              <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Geser nilai parameter di bawah ini untuk melihat perkiraan kontribusi pemulihan terhadap Bunchweight aktual Group <strong className="text-emerald-500">{selectedGroup}</strong> beserta dampak penambahan box di pabrik kemasan.
              </p>

              <div className="space-y-4 pt-2">
                {/* Calibration slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="flex items-center gap-1"><Cpu className="h-3 w-3 text-amber-500" /> Kalibrasi Buah (cm):</span>
                    <span className="font-bold text-amber-500">{simCalib.toFixed(1)} cm</span>
                  </div>
                  <input 
                    type="range" 
                    min="40.0" 
                    max="48.0" 
                    step="0.1"
                    value={simCalib}
                    onChange={(e) => setSimCalib(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Min: 40.0 cm</span>
                    <span>Target: 44.5 cm</span>
                    <span>Max: 48.0 cm</span>
                  </div>
                </div>

                {/* Harvesting Age slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-teal-500" /> Umur Panen Buah (minggu):</span>
                    <span className="font-bold text-teal-500">{simAge.toFixed(1)} mgg</span>
                  </div>
                  <input 
                    type="range" 
                    min="8.5" 
                    max="11.5" 
                    step="0.1"
                    value={simAge}
                    onChange={(e) => setSimAge(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Min: 8.5 mgg</span>
                    <span>Target: 10.0 mgg</span>
                    <span>Max: 11.5 mgg</span>
                  </div>
                </div>

                {/* Hand Class slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3 text-purple-500" /> Hanclass (Jumlah Sisir):</span>
                    <span className="font-bold text-purple-500">{simHand.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="6.0" 
                    max="9.0" 
                    step="0.1"
                    value={simHand}
                    onChange={(e) => setSimHand(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Min: 6.0</span>
                    <span>Target: 8.0</span>
                    <span>Max: 9.0</span>
                  </div>
                </div>


              </div>
            </div>

            {/* Right side: Simulated result outputs */}
            <div className="lg:col-span-5 flex flex-col justify-between border p-5 rounded-xl bg-slate-950/20 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 space-y-4">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Hasil Simulasi Skenario Pemulihan
              </span>

              {/* Dynamic calculations */}
              {(() => {
                const actBW = packableAnalysisData.avgBunchweightA || 18.64;
                const actCalib = bunchweightAnalysisSummary?.avgCalib || 44.0;
                const actAge = bunchweightAnalysisSummary?.avgAge || 9.8;
                const actHand = bunchweightAnalysisSummary?.avgHand || 7.8;
                const actSisa = bunchweightAnalysisSummary?.avgSisa || 4.5;

                // Simulated BW formula:
                const deltaBW = (simCalib - actCalib) * 0.45 + (simAge - actAge) * 1.2 + (simHand - actHand) * 1.5 - (simSisa - actSisa) * 0.15;
                const simBW = Math.max(12.0, Math.min(26.0, actBW + deltaBW));
                const bPercent = ((simBW - actBW) / actBW) * 100;

                // Box effect: (Harvest * deltaBW * (avgRecA / 100)) / 13.5
                const harvestVal = packableAnalysisData.totalHarvestA || 150000;
                const recVal = packableAnalysisData.avgRecA || 85.0;
                const simBoxEffect = (harvestVal * deltaBW * (recVal / 100)) / 13.5;

                return (
                  <div className="space-y-4 my-auto">
                    {/* Simulated Bunchweight (Kg) output */}
                    <div className="space-y-1 text-center">
                      <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Proyeksi Bunchweight Hasil Perbaikan:
                      </span>
                      <div className="text-3xl font-black font-mono tracking-tight text-emerald-500 flex items-center justify-center gap-1">
                        {simBW.toFixed(2)} Kg
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          bPercent >= 0 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {bPercent >= 0 ? '+' : ''}{bPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        Bunchweight Rata-Rata Saat Ini: <span className="font-mono">{actBW.toFixed(2)} Kg</span>
                      </div>
                    </div>

                    {/* Simulated Box effect output */}
                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2 text-center">
                      <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Dampak Tambahan Terhadap Volume Kemasan:
                      </span>
                      <div className={`text-2xl font-black font-mono ${
                        simBoxEffect >= 0 ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {simBoxEffect >= 0 ? '+' : ''}
                        {Math.round(simBoxEffect).toLocaleString('id-ID')} Box
                      </div>
                      <p className={`text-[11px] leading-relaxed px-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {simBoxEffect >= 0 ? (
                          <span>
                            Memenuhi standardisasi 4 faktor agronomi akan menghasilkan kenaikan kapasitas produksi harian/mingguan yang signifikan sebesar <strong>{Math.round(simBoxEffect).toLocaleString('id-ID')} Box Packable</strong>.
                          </span>
                        ) : (
                          <span>
                            Mendiamkan parameter di bawah standar berpotensi menurunkan volume total sebanyak <strong>{Math.abs(Math.round(simBoxEffect)).toLocaleString('id-ID')} Box Packable</strong>.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <button 
                onClick={() => {
                  if (bunchweightAnalysisSummary) {
                    setSimCalib(Number(bunchweightAnalysisSummary.avgCalib.toFixed(2)) || 44.0);
                    setSimAge(Number(bunchweightAnalysisSummary.avgAge.toFixed(2)) || 9.8);
                    setSimHand(Number(bunchweightAnalysisSummary.avgHand.toFixed(2)) || 7.8);
                    setSimSisa(Number(bunchweightAnalysisSummary.avgSisa.toFixed(2)) || 4.5);
                  }
                }}
                className={`w-full py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
                }`}
              >
                Reset Parameter ke Aktual
              </button>
            </div>
          </div>

          {/* Action Recommendations Card ("Simpulan Langkah Perbaikan") */}
          <div className={`border p-5 rounded-xl space-y-4 ${
            theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Simpulan Diagnostik & Rencana Perbaikan Strategis (PPIC & Agronomy)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agronomy Action Plan */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              } space-y-3`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Agronomy & Field Operations</h4>
                </div>
                <ul className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>
                      <strong>Audit Penjarangan Sensus Bagging</strong>: Melakukan pengetatan ukuran kalibrasi minimum buah saat bagging (pembungkusan) untuk memastikan buah panen mencapai minimal <strong>44.5 cm</strong>.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>
                      <strong>Rehabilitasi Lahan Sisa (Sebab-Sisa)</strong>: Memobilisasi tenaga pemeliharaan khusus untuk melakukan pemupukan darurat, penyiangan gulma, dan penjarangan anakan di area marginal yang unmaintained (&gt;3.0%).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>
                      <strong>Manajemen Dehanding</strong>: Melakukan seleksi jumlah sisir (dehanding) yang presisi sejak dini pada tandan bunga muda untuk mendistribusikan aliran nutrisi optimal, menaikkan bobot per sisir.
                    </span>
                  </li>
                </ul>
              </div>

              {/* PPIC & Harvest Ops Action Plan */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              } space-y-3`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider">PPIC & Harvest Operations</h4>
                </div>
                <ul className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>
                      <strong>Proteksi Umur Potong (Harvest Age Protection)</strong>: Menolak pemotongan buah di bawah umur <strong>9.9 - 10.0 minggu</strong>. Menghindari tebang paksa (premature harvesting) demi mengejar kuota box harian.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>
                      <strong>Penjadwalan Rotasi Panen (Crop Rotation scheduling)</strong>: Memperbaiki akurasi rotasi panen harian per blok guna menjaga kestabilan kualitas parameter kalibrasi dan persentase handclass.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>
                      <strong>Sistem Pelacakan Lokasi Sisa</strong>: Mengintegrasikan log pemetaan GIS untuk memonitor kontribusi produksi dari blok yang kurang terawat, sehingga meminimalkan buah reject.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
              </>
            )}
          </div>
        </section>

        {/* --- PRESENTASI EVALUASI PRODUKSI SSN --- */}
        <section id="ssn-presentation-section" className={`rounded-2xl border transition-all duration-300 ${
          showSsnPresentation ? 'p-4 sm:p-6' : 'py-1.5 px-4 sm:px-6'
        } ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className={`${showSsnPresentation ? 'space-y-4' : ''}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
              showSsnPresentation 
                ? 'border-b pb-3 ' + (theme === 'dark' ? 'border-slate-800' : 'border-slate-200')
                : ''
            }`}>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                  theme === 'dark'
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                    : 'bg-violet-50 text-violet-600 border-violet-200'
                }`}>
                  <Presentation className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors break-words flex-wrap ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    Display 5 (PPT)
                  </h3>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                {showSsnPresentation && (
                  <>
                    <button
                      onClick={handleRefreshSsn}
                      disabled={isRefreshingSsn}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 shadow-xs'
                      }`}
                      title="Muat ulang presentasi dari sumber"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefreshingSsn ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
                      <span className="hidden sm:inline">{isRefreshingSsn ? 'Memperbarui...' : 'Perbarui'}</span>
                    </button>

                    <button
                      onClick={toggleFullscreenPresentation}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-slate-900/50 border-slate-800 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300'
                          : 'bg-violet-50/50 border-violet-100 text-violet-600 hover:bg-violet-100 hover:text-violet-800'
                      }`}
                    >
                      <Maximize2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Buka Penuh</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowSsnPresentation(!showSsnPresentation)}
                  className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800 shadow-xs'
                  }`}
                  title={showSsnPresentation ? "Sembunyikan Panel" : "Tampilkan Panel"}
                >
                  {showSsnPresentation ? (
                    <ChevronUp className="h-4 w-4 text-rose-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-emerald-500" />
                  )}
                </button>
              </div>
            </div>

            {showSsnPresentation && (
              <div 
                ref={presentationContainerRef}
                className="group w-full aspect-[16/9] min-h-[300px] md:min-h-[450px] lg:min-h-[500px] relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-md bg-white dark:bg-slate-950"
              >
                <iframe
                  id="ssn-presentation-iframe"
                  src={`https://docs.google.com/presentation/d/1kKR3r_FxLM8DkO1J8AQnLFJNzAsqknUk/embed?start=false&loop=false&delayms=3000&rm=minimal&slide=${
                    currentSsnSlide === 1 ? 'id.p' : 'id.p' + currentSsnSlide
                  }&_cb=${ssnCacheBuster}`}
                  frameBorder="0"
                  width="100%"
                  allowFullScreen={true}
                  className="absolute left-0 top-0 w-full"
                  style={{ height: 'calc(100% + 38px)', pointerEvents: 'auto' }}
                  title="Display 5 (PPT)"
                  referrerPolicy="no-referrer"
                ></iframe>

                {/* Blocker transparan untuk melindungi bar kontrol Google yang disembunyikan */}
                <div className="absolute bottom-0 left-0 right-0 h-[38px] bg-transparent z-10 pointer-events-auto" />

                {/* Petunjuk Interaktivitas Slide */}
                <div className="absolute bottom-3 left-3 z-20 pointer-events-auto">
                  <button
                    onClick={() => setShowSsnNavHint(!showSsnNavHint)}
                    type="button"
                    title={showSsnNavHint ? "Klik tanda hijau untuk sembunyikan tulisan petunjuk" : "Klik tanda hijau untuk tampilkan tulisan petunjuk"}
                    className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md text-white border border-slate-700/80 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-xl flex items-center gap-2 opacity-90 hover:opacity-100 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer"
                  >
                    <span className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {showSsnNavHint && (
                      <span className="select-none">Klik/Ketuk slide atau gunakan panah keyboard untuk navigasi</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- EVALUASI PLAN VS ACTUAL & POTENSI 3 WEEKS --- */}
        <EvaluasiPlanPanel theme={theme} />

        {/* --- SUMBER DATA (DATA PARAMETER TERINCI) --- */}
        <section id="raw-parameters-section" className={`p-6 rounded-2xl space-y-6 border transition-all duration-200 ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          {/* Header */}
          <div className={`border-b pb-4 transition-colors ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  <Table className="h-4 w-4" />
                </span>
                <div>
                  <h2 className={`text-lg font-bold transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    Sumber Data
                  </h2>
                  <p className={`text-xs mt-0.5 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Data tabular lengkap seluruh parameter produksi, silahkan gunakan fitur pencarian / filter untuk menemukan data tertentu
                  </p>
                </div>
              </div>

              {/* Show / Hide Toggle Button */}
              <button
                onClick={() => setShowRawDataPanel(prev => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 shrink-0 ${
                  showRawDataPanel
                    ? (theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700 hover:text-slate-900')
                    : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                }`}
                title={showRawDataPanel ? "Sembunyikan Panel Sumber Data" : "Tampilkan Panel Sumber Data"}
              >
                {showRawDataPanel ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                    <span>Sembunyikan Panel</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-white" />
                    <span>Tampilkan Panel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showRawDataPanel && (
            <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={rawTableSearch}
                onChange={(e) => {
                  setRawTableSearch(e.target.value);
                  setActiveSuggestionIndex(-1);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Wait a bit to let clicks on suggestions register first
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onKeyDown={(e) => {
                  if (!rawTableSuggestions.length || !showSuggestions) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveSuggestionIndex(prev => (prev + 1 < rawTableSuggestions.length ? prev + 1 : 0));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveSuggestionIndex(prev => (prev - 1 >= 0 ? prev - 1 : rawTableSuggestions.length - 1));
                  } else if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    const idx = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
                    if (rawTableSuggestions[idx]) {
                      setRawTableSearch(rawTableSuggestions[idx]);
                      setShowSuggestions(false);
                      setActiveSuggestionIndex(-1);
                    }
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    setActiveSuggestionIndex(-1);
                  }
                }}
                placeholder="Cari parameter, group, atau unit..."
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400'
                }`}
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && rawTableSuggestions.length > 0 && (
                <div
                  className={`absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-xl transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {rawTableSuggestions.map((suggestion, idx) => {
                    const isSelected = idx === activeSuggestionIndex;
                    return (
                      <div
                        key={suggestion}
                        onMouseDown={(e) => {
                          // Prevents the blur event of input from firing before click is processed
                          e.preventDefault();
                        }}
                        onClick={() => {
                          setRawTableSearch(suggestion);
                          setShowSuggestions(false);
                          setActiveSuggestionIndex(-1);
                        }}
                        className={`px-4 py-2 text-xs cursor-pointer flex justify-between items-center transition-colors ${
                          isSelected
                            ? theme === 'dark'
                              ? 'bg-blue-600/30 text-blue-400 font-medium'
                              : 'bg-blue-50 text-blue-700 font-medium'
                            : theme === 'dark'
                              ? 'hover:bg-slate-800'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          {/* Highlight matching substring */}
                          {(() => {
                            const q = rawTableSearch.toLowerCase();
                            const sLower = suggestion.toLowerCase();
                            const matchIndex = sLower.indexOf(q);
                            if (matchIndex === -1) return <span>{suggestion}</span>;
                            
                            const before = suggestion.slice(0, matchIndex);
                            const match = suggestion.slice(matchIndex, matchIndex + q.length);
                            const after = suggestion.slice(matchIndex + q.length);
                            
                            return (
                              <>
                                <span>{before}</span>
                                <span className={theme === 'dark' ? 'text-blue-400 font-bold underline' : 'text-blue-600 font-bold underline'}>
                                  {match}
                                </span>
                                <span>{after}</span>
                              </>
                            );
                          })()}
                        </div>
                        {idx === 0 && activeSuggestionIndex === -1 && (
                          <span className={`text-[10px] uppercase font-mono px-1 rounded border ${
                            theme === 'dark' 
                              ? 'bg-slate-800 border-slate-700 text-slate-400' 
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            TAB
                          </span>
                        )}
                        {isSelected && (
                          <span className={`text-[10px] uppercase font-mono px-1 rounded border ${
                            theme === 'dark' 
                              ? 'bg-slate-800 border-slate-700 text-slate-400' 
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            ENTER
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Group Filter */}
            <div>
              <select
                value={rawTableGroup}
                onChange={(e) => setRawTableGroup(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-blue-400'
                }`}
              >
                <option value="Semua Group">Semua Group</option>
                {uniqueGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Jenis Data Filter */}
            <div>
              <select
                value={rawTableDataType}
                onChange={(e) => setRawTableDataType(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-blue-400'
                }`}
              >
                <option value="Semua Jenis">Semua Jenis Data</option>
                {uniqueDataTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* View Mode Selector */}
            <div>
              <select
                value={rawTableViewMode}
                onChange={(e) => setRawTableViewMode(e.target.value as ViewMode)}
                className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-blue-400 focus:border-slate-700'
                    : 'bg-blue-50 border-blue-100 text-blue-700 focus:border-blue-400'
                }`}
              >
                <option value="weekly">Mode Mingguan (W1 - W53)</option>
                <option value="monthlyCutDate">Mode Bulanan Cut Date</option>
                <option value="monthlyCutWeek">Mode Bulanan Cut Week</option>
                <option value="daily">Mode Harian (29-Dec - 3-Jan)</option>
              </select>
            </div>
          </div>

          {/* Table container with fixed height 20 cm and overflow scroll */}
          <div className={`relative overflow-auto border rounded-xl shadow-inner transition-colors ${
            theme === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`} style={{ maxHeight: '20cm' }}>
            <table className="w-full text-left border-collapse table-fixed text-[11px]">
              <thead>
                <tr className={`border-b transition-colors ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {/* Sticky Header Columns */}
                  <th className={`py-2.5 px-1 text-center font-semibold w-[40px] min-w-[40px] max-w-[40px] sticky left-0 top-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] transition-colors ${
                    theme === 'dark' ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Group
                  </th>
                  <th className={`py-2.5 px-2 font-semibold w-[90px] min-w-[90px] max-w-[90px] sticky left-[40px] top-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] transition-colors ${
                    theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
                  }`}>
                    Parameter
                  </th>
                  <th className={`py-2.5 px-1 text-center font-semibold w-[40px] min-w-[40px] max-w-[40px] sticky left-[130px] top-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] transition-colors ${
                    theme === 'dark' ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Jenis
                  </th>
                  
                  {/* Dynamic Time Columns */}
                  {rawColumns.map((col) => (
                    <th 
                      key={col.key} 
                      className={`py-2.5 px-3 font-semibold sticky top-0 z-20 w-[80px] min-w-[80px] max-w-[80px] ${
                        col.textRight ? 'text-right' : ''
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${
                theme === 'dark' ? 'divide-slate-800/60' : 'divide-slate-200/60'
              }`}>
                {paginatedRawRows.length > 0 ? (
                  paginatedRawRows.map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowBgClass = isEven 
                      ? (theme === 'dark' ? 'bg-slate-900/15' : 'bg-white') 
                      : (theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-50/50');
                      
                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors hover:bg-slate-500/10 ${rowBgClass}`}
                      >
                        {/* Sticky Columns */}
                        <td className={`py-2 px-1 text-center font-medium sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] transition-colors ${rowBgClass}`}>
                          <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                            row.group === 'GGP' 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : row.group === 'GGF TOTAL'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {row.group}
                          </span>
                        </td>
                        <td className={`py-2 px-2 font-semibold sticky left-[40px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] truncate transition-colors ${rowBgClass} ${
                          theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {row.parameter}
                        </td>
                        <td className={`py-2 px-1 text-center sticky left-[130px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] transition-colors ${rowBgClass}`}>
                          <span className={`px-1 py-0.5 rounded-[4px] text-[9px] font-bold ${
                            row.dataType === 'Aktual'
                              ? (theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-100')
                              : row.dataType === 'Budget'
                              ? (theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700 border border-amber-100')
                              : row.dataType === 'Demand'
                              ? (theme === 'dark' ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-700 border border-pink-100')
                              : (theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700 border border-blue-100')
                          }`}>
                            {row.dataType}
                          </span>
                        </td>
                        
                        {/* Dynamic Columns values */}
                        {rawColumns.map((col) => {
                          let rawVal: number | null | undefined = null;
                          
                          if (rawTableViewMode === 'monthlyCutDate') {
                            if (col.key === 'monthlyCutDateTotal') {
                              rawVal = row.monthlyCutDateTotal;
                            } else {
                              const monthIdx = parseInt(col.key.replace('monthlyCutDate_', ''));
                              rawVal = row.monthlyCutDate?.[monthIdx];
                            }
                          } else if (rawTableViewMode === 'monthlyCutWeek') {
                            if (col.key === 'monthlyCutWeekTotal') {
                              rawVal = row.monthlyCutWeekTotal;
                            } else {
                              const monthIdx = parseInt(col.key.replace('monthlyCutWeek_', ''));
                              rawVal = row.monthlyCutWeek?.[monthIdx];
                            }
                          } else if (rawTableViewMode === 'weekly') {
                            if (col.key === 'weeklyTotal') {
                              rawVal = row.weeklyTotal;
                            } else {
                              const weekIdx = parseInt(col.key.replace('weekly_', ''));
                              rawVal = row.weekly?.[weekIdx];
                            }
                          } else if (rawTableViewMode === 'daily') {
                            const dayIdx = parseInt(col.key.replace('daily_', ''));
                            rawVal = row.daily?.[dayIdx];
                          }
                          
                          return (
                            <td 
                              key={col.key} 
                              className={`py-2 px-3 text-right font-mono transition-colors ${
                                rawVal === null || rawVal === undefined 
                                  ? (theme === 'dark' ? 'text-slate-600 font-medium' : 'text-slate-400/50 font-medium') 
                                  : (theme === 'dark' ? 'text-white font-bold' : 'text-slate-950 font-bold')
                              }`}
                            >
                              {formatRawValue(rawVal, row.unit)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td 
                      colSpan={3 + rawColumns.length} 
                      className="py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      Tidak ada data parameter yang cocok dengan filter aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination and Summary Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs">
            <div className={`transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Menampilkan <span className="font-semibold text-slate-900 dark:text-slate-100">
                {filteredRawRows.length > 0 ? (rawTablePage - 1) * rawTableRowsPerPage + 1 : 0}
              </span> hingga <span className="font-semibold text-slate-900 dark:text-slate-100">
                {Math.min(rawTablePage * rawTableRowsPerPage, filteredRawRows.length)}
              </span> dari <span className="font-semibold text-slate-900 dark:text-slate-100">
                {filteredRawRows.length}
              </span> parameter
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Baris per halaman:</span>
                <select
                  value={rawTableRowsPerPage}
                  onChange={(e) => {
                    setRawTableRowsPerPage(Number(e.target.value));
                    setRawTablePage(1);
                  }}
                  className={`px-2 py-1 rounded border transition-colors outline-none ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRawTablePage(prev => Math.max(prev - 1, 1))}
                  disabled={rawTablePage === 1}
                  className={`p-1.5 rounded border transition-all ${
                    rawTablePage === 1
                      ? 'opacity-40 cursor-not-allowed'
                      : (theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm')
                  }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                
                <span className={`px-3 py-1 font-semibold rounded border transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  {rawTablePage} / {totalRawPages}
                </span>

                <button
                  onClick={() => setRawTablePage(prev => Math.min(prev + 1, totalRawPages))}
                  disabled={rawTablePage === totalRawPages}
                  className={`p-1.5 rounded border transition-all ${
                    rawTablePage === totalRawPages
                      ? 'opacity-40 cursor-not-allowed'
                      : (theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm')
                  }`}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
          </>
          )}
        </section>

        {/* --- AI ANALYST ASSISTANT PANEL --- */}
        <section id="ai-analyst-section" className={`p-6 rounded-2xl space-y-6 border transition-all duration-200 mt-8 ${
          theme === 'dark' 
            ? 'bg-slate-950/40 border-slate-800/80 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          {/* Header */}
          <div className={`border-b pb-4 transition-colors ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}>
                <Brain className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  PPIC Banana AI Analyst Assistant
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h3>
                <p className={`text-[11px] mt-0.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Asisten cerdas PPIC berbasis AI untuk mendeteksi korelasi parameter produksi, menganalisis kegagalan target, dan memberikan rekomendasi solusi taktis perkebunan GGP.
                </p>
              </div>
            </div>
          </div>

          {/* Preset Questions / Pertanyaan Cepat */}
          <div className="space-y-2">
            <h4 className={`text-xs font-semibold ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Pertanyaan Cepat (Analisis PPIC & Kualitas):
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  text: 'Mengapa penurunan bunchweight sangat berpengaruh terhadap box packable?',
                  label: 'Korelasi Bunchweight dan Box Packable'
                },
                {
                  text: 'bagaimana cara penanggulangan Deffect moko?',
                  label: 'Penanggulangan moko'
                },
                {
                  text: 'Bagaimana cara menjaga kualitas produk banana baik dari kebersihan buah maupun berat tandan?',
                  label: 'Konsistensi Mutu'
                }
              ].map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleAiSubmit(preset.text)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all text-left ${
                    aiLoading 
                      ? 'opacity-50 cursor-not-allowed'
                      : (theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 text-slate-300'
                        : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-white text-slate-700 shadow-xs')
                  }`}
                >
                  <span className="font-semibold block text-blue-500 mb-0.5">{preset.label}</span>
                  {preset.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAiSubmit();
            }}
            className="space-y-3"
          >
            <div className="relative">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                disabled={aiLoading}
                placeholder="Tulis pertanyaan operasional atau PPIC Anda di sini... (contoh: Bagaimana tren recovery dan defect bulan ini?)"
                rows={3}
                className={`w-full p-3.5 pr-12 text-xs rounded-xl border transition-all outline-none resize-none focus:ring-1 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400 shadow-inner'
                }`}
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuestion.trim()}
                className={`absolute right-3.5 bottom-3.5 p-2 rounded-lg transition-all ${
                  aiLoading || !aiQuestion.trim()
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95'
                }`}
                title="Kirim pertanyaan"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* AI Response Display */}
          {(aiLoading || aiAnswer || aiError) && (
            <div className={`p-5 rounded-xl border transition-all ${
              theme === 'dark'
                ? 'bg-slate-950/60 border-slate-800/50'
                : 'bg-slate-50 border-slate-200/60'
            }`}>
              {/* Loading State */}
              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full border-2 border-blue-500/20 animate-ping absolute"></div>
                    <div className="h-10 w-10 rounded-full border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin relative flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-500 animate-pulse">Asisten AI sedang bekerja...</p>
                    <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Menganalisis parameter PPIC GGP & merumuskan korelasi defect kebun...
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {aiError && (
                <div className="flex items-start gap-3 py-2 text-red-500">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold">Gagal Menganalisis</h5>
                    <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">{aiError}</p>
                    <button
                      type="button"
                      onClick={() => handleAiSubmit()}
                      className="text-[10px] font-bold underline mt-1.5 hover:text-red-400 block"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}

              {/* Answer State */}
              {aiAnswer && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-dashed pb-2 border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-500">Analisis & Rekomendasi PPIC AI</span>
                    </div>
                    <span className="text-[9px] font-mono opacity-50">PPIC BANANA AI • Analisis Sistem</span>
                  </div>
                  <div className="space-y-1">
                    {renderFormattedAnswer(aiAnswer, theme)}
                  </div>
                  <div className="text-right pt-2 border-t border-dashed border-slate-800/30">
                    <button
                      type="button"
                      onClick={() => {
                        setAiAnswer(null);
                        setAiQuestion('');
                      }}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
                          : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      Reset Percakapan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
          </>
        )}
      </main>

      {/* --- FLOATING SCROLL NAVIGATION WIDGET --- */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
        <AnimatePresence>
          {showPanelSelector && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-md mb-1 max-h-72 overflow-y-auto w-64 space-y-1 ${
                theme === 'dark' 
                  ? 'bg-slate-900/95 border-slate-800 text-slate-200 shadow-slate-950/80' 
                  : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span>Lompat Ke Panel:</span>
                <button onClick={() => setShowPanelSelector(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-3 w-3" />
                </button>
              </div>
              {[
                { id: 'top-filter-panel', name: 'Filter Control Panel' },
                { id: 'kpi-summary-panel', name: 'Ringkasan KPI Utama' },
                { id: 'side-by-side-panel', name: 'Grafik Trend Analisis Utama' },
                { id: 'waterfall-bridge-panel', name: 'Jembatan Box (Waterfall)' },
                { id: 'bunches-panen-panel', name: 'Grafik Bunches Panen' },
                { id: 'loss-analysis-panel', name: 'Analisis Losses Banana' },
                { id: 'bunchweight-trends-panel', name: 'Trend Bunchweight' },
                { id: 'calibration-distribution-panel', name: 'Sebaran Kalibrasi' },
                { id: 'progress-diagnostics-panel', name: 'Progress & Diagnostik' },
                { id: 'rec-packable-panel', name: 'REC Total Packable' },
                { id: 'ssn-presentation-section', name: 'Display 5 (PPT)' },
                { id: 'evaluasi-plan-section', name: 'Evaluasi Plan vs Actual' },
                { id: 'raw-parameters-section', name: 'Sumber Data' },
                { id: 'ai-analyst-section', name: 'Asisten AI PPIC' }
              ].map((panel) => {
                const isCurrent = lastViewedPanel?.id === panel.id;
                return (
                  <button
                    key={panel.id}
                    onClick={() => {
                      const el = document.getElementById(panel.id);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setLastViewedPanel(panel);
                      }
                      setShowPanelSelector(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/30'
                        : theme === 'dark'
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{panel.name}</span>
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Scroll Button Group */}
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-slate-950/60'
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
        }`}>
          {/* 1. Scroll langsung kebagian atas halaman */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700 shadow-xs'
            }`}
            title="Scroll langsung kebagian atas halaman"
          >
            <ArrowUp className="h-3.5 w-3.5 text-teal-500" />
            <span className="hidden sm:inline">Ke Atas</span>
          </button>

          {/* 2. Scroll kebawah dibagian panel terakhir yang dilihat */}
          <button
            onClick={() => {
              if (lastViewedPanel?.id) {
                const el = document.getElementById(lastViewedPanel.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  return;
                }
              }
              window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-xs'
            }`}
            title={`Scroll kebawah ke panel terakhir: ${lastViewedPanel?.name || 'Panel Terakhir'}`}
          >
            <Target className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate">
              {lastViewedPanel?.name || 'Panel Terakhir'}
            </span>
          </button>

          {/* Selector toggle */}
          <button
            onClick={() => setShowPanelSelector(!showPanelSelector)}
            className={`p-1.5 rounded-xl border transition-all ${
              showPanelSelector
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : theme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
            title="Pilih daftar panel untuk lompat langsung"
          >
            <ChevronUp className={`h-3.5 w-3.5 transition-transform duration-200 ${showPanelSelector ? 'rotate-180' : ''}`} />
          </button>

          {/* 3. Scroll langsung kebagian bawah halaman */}
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700 shadow-xs'
            }`}
            title="Scroll langsung kebagian bawah halaman"
          >
            <ArrowDown className="h-3.5 w-3.5 text-purple-500" />
            <span className="hidden sm:inline">Ke Bawah</span>
          </button>
        </div>
      </div>

      {/* Custom Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl border flex items-start gap-3 z-50 max-w-sm ${
              theme === 'dark' 
                ? 'bg-slate-900 border-indigo-500/40 text-slate-100 shadow-indigo-950/40' 
                : 'bg-white border-indigo-200 text-slate-800 shadow-xl shadow-indigo-100/50'
            }`}
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 pr-4 text-left">
              <h5 className="font-bold text-xs text-indigo-500 mb-0.5">Pembaruan Data Baru</h5>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-400 font-medium">
                {toastMessage}
              </p>
              <div className="mt-2 flex gap-3 text-[11px] font-semibold">
                <button 
                  onClick={() => {
                    setToastMessage(null);
                    setShowNotifications(true);
                  }}
                  className="text-indigo-500 hover:text-indigo-400"
                >
                  Lihat Detail
                </button>
                <button 
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Tutup
                </button>
              </div>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`max-w-[1600px] mx-auto px-6 mt-16 text-center text-xs transition-colors ${
        theme === 'dark' ? 'text-slate-600' : 'text-slate-500'
      }`}>
        <p>© 2026 Banana Production Comparation Dashboard.</p>
        <p className={`mt-1 transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-slate-500'}`}>Maintenance by Arham (PPIC BANANA)</p>
      </footer>
    </div>
  );
}
