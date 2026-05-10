import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineChartPie,
  HiOutlineCloudUpload,
  HiOutlineMail,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineShieldCheck,
  HiOutlineX,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { checkHealth } from '../services/api';
import BrandMark from './BrandMark';

const navItems = [
  { path: '/dashboard', label: 'Terminal', icon: HiOutlineChartPie },
  { path: '/upload', label: 'Data Ingestion', icon: HiOutlineCloudUpload },
  { path: '/emails', label: 'AI Workspace', icon: HiOutlineMail },
  { path: '/analytics', label: 'Intelligence', icon: HiOutlineChartBar },
  { path: '/audit', label: 'Audit Trail', icon: HiOutlineClipboardList },
  { path: '/security', label: 'Compliance', icon: HiOutlineShieldCheck },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { setIsAuthenticated } = useContext(AppContext);
  const [health, setHealth] = useState(null);

  const refreshHealth = async () => {
    const startedAt = performance.now();

    try {
      const response = await checkHealth();
      setHealth({ ...response.data, latencyMs: performance.now() - startedAt });
    } catch {
      setHealth(null);
    }
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(() => {
      refreshHealth();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 flex w-[min(86vw,16rem)] flex-col border-r border-white/8 bg-slate-950/96 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-[256px] lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between px-4 pb-4 pt-5 lg:px-5 lg:pt-5">
          <div className="flex items-center gap-3">
            <BrandMark size={40} compact />
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-white">FinFlow AI</h1>
              <p className="mt-1 text-[10px] font-medium text-white/35">Enterprise workspace</p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-xl border border-white/8 bg-white/[0.03] p-2 text-white/40 transition hover:text-white lg:hidden" aria-label="Close navigation">
            <HiOutlineX size={18} />
          </button>
        </div>

        <div className="px-4 pb-3 lg:px-5">
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
            <span className="flex items-center gap-2 text-emerald-200/80"><HiOutlineSparkles size={12} /> AI status</span>
            <span>{health?.status === 'operational' ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 lg:px-4">
          <div className="px-2 pb-2 pt-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Navigation</p>
          </div>
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink key={item.path} to={item.path} onClick={onClose} className="block group">
                  <div className={`relative flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors duration-200 ${isActive ? 'border-white/8 bg-white/[0.05] text-white' : 'border-transparent bg-transparent text-white/45 hover:border-white/8 hover:bg-white/[0.03] hover:text-white/75'}`}>
                    {isActive && <motion.div layoutId="navGlow" className="absolute left-1 top-2 bottom-2 w-0.5 rounded-full bg-cyan-300/80" />}
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isActive ? 'border-white/8 bg-white/[0.04] text-cyan-200' : 'border-transparent bg-white/[0.02] text-white/35 group-hover:text-cyan-200'}`}>
                      <item.icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium tracking-tight">{item.label}</div>
                      <div className="mt-0.5 text-[10px] text-white/25">{item.path.replace('/', '')}</div>
                    </div>
                    {isActive && <HiOutlineArrowRight className="text-cyan-200" size={15} />}
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="px-4 pb-4 lg:px-5 lg:pb-5">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-xs text-white/35">
              <span>Latency</span>
              <span>{health?.latencyMs ? `${Math.round(health.latencyMs)}ms` : '--'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
              <span className={`h-2 w-2 rounded-full ${health?.status === 'operational' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{health?.status === 'operational' ? 'Operational' : 'Disconnected'}</span>
            </div>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="btn-secondary mt-4 w-full justify-center py-2.5 text-[11px] uppercase tracking-[0.16em]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
