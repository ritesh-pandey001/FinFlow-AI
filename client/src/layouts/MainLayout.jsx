import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiMenuAlt2,
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineMail,
  HiOutlineClipboardList,
  HiOutlineUserCircle,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineExternalLink,
  HiOutlineInformationCircle,
  HiOutlineChartBar,
} from 'react-icons/hi';
import { AppContext } from '../App';
import BrandMark from '../components/BrandMark';
import { formatDateTime } from '../utils/formatters';

export default function MainLayout() {
  const { invoices, emails, auditLogs, workspaceSummary, profile, setIsAuthenticated, resetWorkspace, notifications } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const bellRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(event.target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const invoiceHits = invoices
      .filter((invoice) =>
        invoice.invoice_no?.toLowerCase().includes(query) ||
        invoice.client_name?.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .map((invoice) => ({
        type: 'Invoice',
        label: invoice.client_name,
        meta: `${invoice.invoice_no} • ${invoice.days_overdue}d overdue`,
        icon: HiOutlineChartBar,
        action: () => navigate('/upload'),
      }));

    const emailHits = emails
      .filter((entry) =>
        entry.invoice?.client_name?.toLowerCase().includes(query) ||
        entry.email?.subject?.toLowerCase().includes(query) ||
        entry.email?.body?.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .map((entry) => ({
        type: 'Email',
        label: entry.invoice.client_name,
        meta: entry.email.subject,
        icon: HiOutlineMail,
        action: () => navigate('/emails'),
      }));

    const auditHits = auditLogs
      .filter((log) =>
        log.action?.toLowerCase().includes(query) ||
        log.client_name?.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .map((log) => ({
        type: 'Audit',
        label: log.action.replace('_', ' '),
        meta: `${log.client_name || 'System'} • ${log.status}`,
        icon: HiOutlineClipboardList,
        action: () => navigate('/audit'),
      }));

    return [...invoiceHits, ...emailHits, ...auditHits].slice(0, 6);
  }, [auditLogs, emails, invoices, navigate, searchQuery]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setProfileOpen(false);
  };

  return (
    <div className="app-shell relative selection:bg-brand-primary/20 selection:text-white">
      <div className="relative min-h-screen lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <AnimatePresence>
          {sidebarOpen && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
              aria-label="Close navigation"
            />
          )}
        </AnimatePresence>

        <div className="min-w-0 flex min-h-screen flex-col">
          <header
            className={`sticky top-0 z-30 border-b transition-all duration-300 ${scrolled ? 'border-white/8 bg-slate-950/80 backdrop-blur-xl' : 'border-transparent bg-transparent'}`}
          >
            <div className="page-shell flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8 xl:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] p-2 text-white/70 transition hover:bg-white/[0.06] lg:hidden"
                  aria-label="Open navigation"
                >
                  <HiMenuAlt2 size={22} />
                </button>

                <div className="hidden items-center gap-3 xl:flex">
                  <BrandMark size={32} compact />
                  <div className="min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/24">FinFlow AI Workspace</div>
                    <div className="mt-1 truncate text-sm font-medium text-white/60">{location.pathname.replace('/', '') || 'dashboard'}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div ref={searchRef} className="relative hidden md:block">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-white/38">
                    <HiOutlineSearch size={15} />
                    <input
                      value={searchQuery}
                      onFocus={() => setSearchOpen(true)}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchOpen(true);
                      }}
                      placeholder="Search invoices, clients, emails"
                      className="w-[16rem] bg-transparent text-sm text-white outline-none placeholder:text-white/22"
                    />
                  </div>

                  <AnimatePresence>
                    {searchOpen && searchQuery.trim() && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-[calc(100%+0.75rem)] w-[28rem] overflow-hidden rounded-3xl border border-white/8 bg-slate-950/98 shadow-[0_24px_70px_-35px_rgba(2,6,23,0.95)]">
                        <div className="border-b border-white/8 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                          Search results
                        </div>
                        <div className="max-h-[24rem] overflow-auto p-2">
                          {searchResults.length > 0 ? searchResults.map((item, index) => (
                            <button key={`${item.type}-${index}`} onClick={item.action} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.04]">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-cyan-200">
                                <item.icon size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-white">{item.label}</div>
                                <div className="truncate text-xs text-white/35">{item.meta}</div>
                              </div>
                              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">{item.type}</div>
                            </button>
                          )) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">No matches found</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={bellRef}>
                  <button onClick={() => setNotificationsOpen((open) => !open)} className="relative rounded-xl border border-white/8 bg-white/[0.03] p-2.5 text-white/55 transition hover:bg-white/[0.06] hover:text-white" aria-label="Notifications">
                    <HiOutlineBell size={18} />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-300 px-1 text-[9px] font-black text-slate-950">{notifications.length}</span>
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-[calc(100%+0.75rem)] w-[22rem] overflow-hidden rounded-3xl border border-white/8 bg-slate-950/98 shadow-[0_24px_70px_-35px_rgba(2,6,23,0.95)]">
                        <div className="border-b border-white/8 px-4 py-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Recent activity</div>
                        </div>
                        <div className="max-h-[22rem] overflow-auto p-2">
                          {notifications.length > 0 ? notifications.map((item) => (
                            <div key={item.id} className="flex gap-3 rounded-2xl px-3 py-3 hover:bg-white/[0.04]">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${item.tone === 'amber' ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : item.tone === 'red' ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'}`}>
                                <item.icon size={15} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-white">{item.title}</div>
                                <div className="truncate text-xs text-white/35">{item.meta}</div>
                              </div>
                            </div>
                          )) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">No recent notifications</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left transition hover:bg-white/[0.06]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.04]">
                      <span className="text-xs font-black text-white/80">{(profile?.name || 'Workspace user').split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}</span>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-medium text-white">{profile?.name || 'Workspace user'}</div>
                      <div className="text-[10px] text-white/35">{profile?.title || 'Active session'}</div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-[calc(100%+0.75rem)] w-[18rem] overflow-hidden rounded-3xl border border-white/8 bg-slate-950/98 shadow-[0_24px_70px_-35px_rgba(2,6,23,0.95)]">
                        <div className="border-b border-white/8 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <BrandMark size={34} compact />
                            <div>
                              <div className="text-sm font-semibold text-white">{profile?.name || 'Workspace user'}</div>
                              <div className="text-xs text-white/35">{profile?.email || 'No email saved'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.04]">
                            <HiOutlineUserCircle size={16} /> Profile
                          </button>
                          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.04]">
                            <HiOutlineCog size={16} /> Settings
                          </button>
                          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.04]">
                            <HiOutlineExternalLink size={16} /> Workspace info
                          </button>
                          <button onClick={resetWorkspace} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.04]">
                            <HiOutlineSparkles size={16} /> Reset workspace
                          </button>
                          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-rose-200 transition hover:bg-rose-400/10">
                            <HiOutlineLogout size={16} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-cyan-400/15 bg-cyan-400/10 px-4 py-2 sm:px-6 lg:px-8 xl:px-10">
            <div className="page-shell flex flex-col gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/80 sm:flex-row sm:items-center sm:justify-between">
              <span>Dry run mode enabled</span>
              <span>No real emails are being sent. All actions remain review-only until manually approved.</span>
            </div>
          </div>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
            <div className="page-shell">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </div>
          </main>

          <footer className="px-4 pb-5 sm:px-6 lg:px-8 xl:px-10">
            <div className="page-shell border-t border-white/6 pt-4 text-[10px] font-medium tracking-[0.18em] text-white/24">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p>© 2026 FinFlow AI</p>
                <div className="flex flex-wrap items-center gap-4 text-white/30">
                  <span>{workspaceSummary.totalInvoices} invoices</span>
                  <span>{workspaceSummary.legalQueueCount} in legal queue</span>
                  <span>Last sync {formatDateTime(workspaceSummary.lastUpdatedAt)}</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
