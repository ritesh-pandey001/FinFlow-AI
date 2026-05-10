import { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineMail,
  HiOutlineExclamationCircle,
  HiOutlineSparkles,
  HiOutlineCloudUpload,
  HiOutlineCube,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineCollection,
  HiOutlineRefresh,
  HiOutlineDatabase,
  HiOutlineChartBar,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import MetricCard from '../components/MetricCard';
import { AppContext } from '../App';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function DashboardPage() {
  const { invoices, emails, auditLogs } = useContext(AppContext);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const highRisk = invoices.filter((inv) => parseInt(inv.days_overdue) > 30);
    const urgent = invoices.filter((inv) => {
      const days = parseInt(inv.days_overdue) || 0;
      return days >= 22 && days <= 30;
    });
    const avgOverdue = invoices.length > 0
      ? Math.round(invoices.reduce((sum, inv) => sum + (parseInt(inv.days_overdue) || 0), 0) / invoices.length)
      : 0;
    const totalClients = new Set(invoices.map((inv) => inv.client_name)).size;

    return { totalAmount, highRisk, urgent, avgOverdue, totalClients };
  }, [invoices]);

  const stageBreakdown = useMemo(() => {
    const stages = [
      { id: 'friendly', label: 'Warm', count: 0, amount: 0 },
      { id: 'polite', label: 'Firm', count: 0, amount: 0 },
      { id: 'formal', label: 'Formal', count: 0, amount: 0 },
      { id: 'urgent', label: 'Urgent', count: 0, amount: 0 },
      { id: 'legal', label: 'Legal', count: 0, amount: 0 },
    ];

    invoices.forEach((invoice) => {
      const days = parseInt(invoice.days_overdue) || 0;
      const amount = parseFloat(invoice.amount) || 0;
      const index = days <= 7 ? 0 : days <= 14 ? 1 : days <= 21 ? 2 : days <= 30 ? 3 : 4;
      stages[index].count += 1;
      stages[index].amount += amount;
    });

    return stages;
  }, [invoices]);

  const topClients = useMemo(() => {
    const map = invoices.reduce((acc, invoice) => {
      const amount = parseFloat(invoice.amount) || 0;
      if (!acc[invoice.client_name]) {
        acc[invoice.client_name] = { client: invoice.client_name, amount: 0, count: 0, overdue: 0 };
      }
      acc[invoice.client_name].amount += amount;
      acc[invoice.client_name].count += 1;
      acc[invoice.client_name].overdue = Math.max(acc[invoice.client_name].overdue, parseInt(invoice.days_overdue) || 0);
      return acc;
    }, {});

    return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 4);
  }, [invoices]);

  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

  const activities = useMemo(() => auditLogs.slice(0, 5), [auditLogs]);

  const insights = useMemo(() => {
    if (invoices.length === 0) {
      return [
        'Upload a CSV to populate live receivables, risk analysis, and workflow history.',
        'Seed data is available on first load so the workspace feels active immediately.',
        'Generated emails, audit events, and metrics persist locally after refresh.',
      ];
    }

    const items = [];
    if (stats.highRisk.length > 0) {
      items.push(`${stats.highRisk.length} invoices are in legal territory with ${formatCurrency(stats.highRisk.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))} at critical risk.`);
    }
    if (stats.urgent.length > 0) {
      items.push(`${stats.urgent.length} invoices are approaching escalation and should be reviewed this cycle.`);
    }
    items.push(`Total pending exposure sits at ${formatCurrency(stats.totalAmount)} across ${stats.totalClients} clients.`);
    items.push(`Average overdue age is ${stats.avgOverdue} days, which keeps the queue ${stats.avgOverdue > 15 ? 'above' : 'within'} expected thresholds.`);
    if (auditLogs.length > 0) {
      items.push(`Most recent event: ${auditLogs[0].action.replace('_', ' ')} from ${auditLogs[0].client_name || 'system'}${auditLogs[0].invoice_no && auditLogs[0].invoice_no !== '-' ? ` for ${auditLogs[0].invoice_no}` : ''}.`);
    }
    return items.slice(0, 6);
  }, [auditLogs, stats.avgOverdue, stats.highRisk, stats.totalAmount, stats.totalClients, stats.urgent, invoices.length]);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="section-kicker">Financial operations overview</p>
          <h1 className="section-title">Enterprise AI receivables cockpit</h1>
          <p className="section-subtitle max-w-2xl">A calm, structured view of exposure, automation, and risk signals across the receivables workflow.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/upload')} className="btn-primary">
            <HiOutlineCloudUpload size={17} />
            Ingest CSV
          </button>
          <button onClick={() => navigate('/analytics')} className="btn-secondary">
            <HiOutlineChartBar size={17} />
            Analytics
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={HiOutlineCube} label="Total exposure" value={formatCurrency(stats.totalAmount)} color="#22d3ee" trend="up" trendValue={`${stats.urgent.length} urgent`} />
        <MetricCard icon={HiOutlineDocumentText} label="Invoices tracked" value={invoices.length} color="#8b5cf6" trend="up" trendValue={`+${stats.totalClients}`} delay={0.06} />
        <MetricCard icon={HiOutlineMail} label="AI generations" value={emails.length} color="#10b981" trend="up" trendValue="Active" delay={0.12} />
        <MetricCard icon={HiOutlineExclamationCircle} label="Critical risk" value={stats.highRisk.length} color="#ef4444" trend={stats.highRisk.length > 0 ? 'up' : 'down'} trendValue={stats.highRisk.length > 0 ? 'High' : 'Zero'} delay={0.18} />
      </section>

      <section className="dashboard-grid items-start">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">AI insights</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white">Neural recommendations</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Concise guidance generated from the live invoice stream.</p>
              </div>
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                  <HiOutlineRefresh size={14} />
                  Live
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <HiOutlineDatabase className="mx-auto text-white/12" size={42} />
                <p className="mt-4 text-lg font-semibold text-white">Awaiting data ingestion</p>
                <p className="mt-2 text-sm text-white/35">Upload a CSV to populate insights, risk summaries, and automation history.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {insights.slice(0, 6).map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
                  >
                    <p className="text-sm leading-6 text-white/72">{insight}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="glass-panel p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-cyan-200">
                  <HiOutlineUserGroup size={18} />
                </div>
                <div>
                  <p className="section-kicker">Active clients</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{stats.totalClients}</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-violet-200">
                  <HiOutlineClock size={18} />
                </div>
                <div>
                  <p className="section-kicker">Urgent queue</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{stats.urgent.length}</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-emerald-200">
                  <HiOutlineCollection size={18} />
                </div>
                <div>
                  <p className="section-kicker">Processing cycle</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{stats.avgOverdue}d</p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Activity stream</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Recent events</h3>
              </div>
              <button onClick={() => navigate('/audit')} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 transition hover:text-white">
                View all
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {activities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">No events yet</div>
              ) : activities.map((log) => (
                <div key={log.id} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-200" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="truncate text-sm font-medium text-white">{log.action.replace('_', ' ')}</p>
                      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/30">{formatDateTime(log.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/35">{log.client_name || 'System'} {log.invoice_no ? `• ${log.invoice_no}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-5">
          <section className="glass-panel p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Escalation mix</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Pipeline health</h3>
              </div>
              <HiOutlineCollection className="text-cyan-200" size={18} />
            </div>

            <div className="mt-5 space-y-4">
              {stageBreakdown.map((stage) => (
                <div key={stage.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white/80">{stage.label}</span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/30">{stage.count} nodes</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${Math.max(stage.count * 18, stage.count > 0 ? 20 : 8)}%` }} />
                  </div>
                  <div className="mt-3 text-[11px] text-white/32">{formatCurrency(stage.amount)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Top clients</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Concentration risk</h3>
              </div>
              <HiOutlineCube className="text-violet-200" size={18} />
            </div>
            <div className="mt-5 space-y-3">
              {topClients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">No client data</div>
              ) : topClients.map((client) => (
                <div key={client.client} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-white">{client.client}</span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/30">{client.count} invoices</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${Math.max((client.amount / Math.max(stats.totalAmount || 1, 1)) * 100, 12)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/32">
                    <span>{formatCurrency(client.amount)}</span>
                    <span>{client.overdue}d max overdue</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-white/8 px-6 py-5">
          <p className="section-kicker">Invoice snapshot</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Recent nodes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Exposure</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center text-white/30">No invoice data yet</td>
                </tr>
              ) : recentInvoices.map((invoice) => (
                <tr key={invoice.invoice_no}>
                  <td className="font-mono text-xs text-cyan-200">{invoice.invoice_no}</td>
                  <td className="font-medium text-white/82">{invoice.client_name}</td>
                  <td className="font-semibold text-white">{formatCurrency(invoice.amount)}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium text-white/70">{invoice.due_date}</span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-rose-300">{invoice.days_overdue} days overdue</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-${invoice.escalation?.id === 'legal' ? 'red' : invoice.escalation?.id === 'urgent' ? 'orange' : invoice.escalation?.id === 'formal' ? 'amber' : invoice.escalation?.id === 'polite' ? 'purple' : 'cyan'}`}>
                      {invoice.escalation?.label || 'Queued'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>
    </div>
  );
}
