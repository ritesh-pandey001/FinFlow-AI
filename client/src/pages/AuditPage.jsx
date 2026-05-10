import { useState, useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineClipboardList,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineDatabase,
  HiOutlineTerminal,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineFilter,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { AppContext } from '../App';
import { formatDateTime } from '../utils/formatters';

export default function AuditPage() {
  const { addToast, auditLogs, setAuditLogs, addAuditLog } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [escalationFilter, setEscalationFilter] = useState('all');

  const logs = auditLogs;
  const total = auditLogs.length;
  const loading = auditLogs.length === 0;
  const storageVolumeKb = (JSON.stringify(auditLogs).length / 1024).toFixed(1);

  const handleClear = async () => {
    if (!window.confirm('Wipe all system logs? This action is permanent.')) return;
    setAuditLogs([]);
    addAuditLog({
      action: 'AUDIT_CLEARED',
      invoice_no: '-',
      client_name: 'System',
      tone: '-',
      status: 'warning',
      details: 'Audit logs cleared by user action',
      source: 'workspace',
      eventType: 'clear',
      escalation: 'general',
    });
    addToast('Logs purged successfully', 'info');
  };

  const handleExport = () => {
    const csv = [
      ['timestamp', 'action', 'client_name', 'invoice_no', 'tone', 'status', 'source', 'eventType', 'escalation', 'details'],
      ...logs.map((log) => [log.timestamp, log.action, log.client_name, log.invoice_no, log.tone, log.status, log.source, log.eventType, log.escalation, log.details]),
    ]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `finflow-audit-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    addToast('Export successful', 'success');
  };

  const filteredLogs = useMemo(() => logs
    .filter((log) =>
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((log) => (statusFilter === 'all' ? true : log.status === statusFilter))
    .filter((log) => (escalationFilter === 'all' ? true : log.escalation === escalationFilter)), [logs, searchTerm, statusFilter, escalationFilter]);

  const successRate = logs.length > 0 ? Math.round((logs.filter((log) => log.status === 'success').length / logs.length) * 100) : 100;

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="section-kicker">Audit monitoring</p>
          <h1 className="section-title">Enterprise audit trail</h1>
          <p className="section-subtitle max-w-2xl">Search, filter, export, and review system events through a compact monitoring-grade interface.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} disabled={logs.length === 0} className="btn-secondary">
            <HiOutlineDownload size={16} />
            Export
          </button>
          <button onClick={handleClear} disabled={logs.length === 0} className="rounded-full border border-white/8 bg-white/[0.03] p-3 text-white/55 transition hover:text-white">
            <HiOutlineTrash size={18} />
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Events indexed', value: total, icon: HiOutlineTerminal },
          { label: 'Success rate', value: `${successRate}%`, icon: HiOutlineShieldCheck },
          { label: 'Storage volume', value: `${storageVolumeKb} KB`, icon: HiOutlineDatabase },
          { label: 'Live mode', value: loading ? 'Refreshing' : 'Active', icon: HiOutlineSparkles },
        ].map((item) => (
          <div key={item.label} className="glass-panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{item.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-cyan-200">
                <item.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-xl">
            <HiOutlineSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={18} />
            <input
              type="text"
              placeholder="Search event, invoice, client, or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/25 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {['all', 'success', 'warning', 'error'].map((state) => (
              <button
                key={state}
                onClick={() => setStatusFilter(state)}
                className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${statusFilter === state ? 'border-white/10 bg-white/[0.05] text-white' : 'border-white/8 bg-white/[0.03] text-white/40 hover:text-white'}`}
              >
                {state}
              </button>
            ))}
            {['all', 'friendly', 'polite', 'formal', 'urgent', 'legal'].map((state) => (
              <button
                key={state}
                onClick={() => setEscalationFilter(state)}
                className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${escalationFilter === state ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100' : 'border-white/8 bg-white/[0.03] text-white/40 hover:text-white'}`}
              >
                {state}
              </button>
            ))}
            <button onClick={() => addToast('Audit view updated from local workspace state', 'info')} className="btn-secondary px-4 py-2 text-xs">
              <HiOutlineRefresh className={loading ? 'animate-spin' : ''} size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel overflow-hidden">
          <div className="border-b border-white/8 px-6 py-5 sm:px-8">
            <p className="section-kicker">Timeline feed</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Event stream</h3>
          </div>

          <div className="max-h-[42rem] overflow-auto p-4 sm:p-6">
            {filteredLogs.length > 0 ? (
              <div className="space-y-4">
                {filteredLogs.map((log, index) => (
                  <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.015, 0.3) }} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge-${log.status === 'warning' ? 'amber' : log.status === 'success' ? 'cyan' : 'red'}`}>{log.action.replace('_', ' ')}</span>
                          <span className="section-kicker">{log.tone || 'No tone'}</span>
                          <span className="badge-purple">{log.escalation || 'general'}</span>
                          <span className="badge-cyan">{log.source || 'system'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{log.client_name || 'System event'}</p>
                          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/55">{log.invoice_no || 'N/A'}</p>
                        </div>
                        <p className="max-w-3xl text-sm leading-6 text-white/40">{log.details}</p>
                      </div>

                      <div className="flex flex-col items-start gap-2 lg:items-end">
                        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                          <HiOutlineClock size={14} />
                          {formatDateTime(log.timestamp)}
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
                          {log.status}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[26rem] flex-col items-center justify-center text-center">
                <HiOutlineDatabase className="text-white/10" size={72} />
                <h4 className="mt-6 text-2xl font-black tracking-tight text-white">Logs empty</h4>
                <p className="mt-2 max-w-sm text-sm text-white/35">No events match the current filters. Try broadening the search or refreshing the stream.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Telemetry controls</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Monitoring state</h3>
              </div>
              <HiOutlineFilter className="text-cyan-200" size={18} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { label: 'Live monitoring', value: 'Enabled' },
                { label: 'Log rotation', value: '30 days' },
                { label: 'Archive size', value: `${Math.max(total, 1)} records` },
                { label: 'Integrity', value: 'Verified' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="section-kicker">{item.label}</p>
                  <p className="mt-2 text-lg font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Action history</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Recent patterns</h3>
              </div>
              <HiOutlineSparkles className="text-violet-200" size={18} />
            </div>
            <div className="mt-5 space-y-3">
              {filteredLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">{log.action.replace('_', ' ')}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">{log.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-white/35">{log.client_name || 'System'} {log.invoice_no ? `• ${log.invoice_no}` : ''}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
