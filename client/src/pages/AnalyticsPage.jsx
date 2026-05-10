import { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import {
  HiOutlineChartBar,
  HiOutlinePresentationChartBar,
  HiOutlineLibrary,
  HiOutlineTrendingUp,
  HiOutlineShieldCheck,
  HiOutlineDatabase,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
  HiOutlineCube,
  HiOutlineRefresh,
  HiOutlineMail,
} from 'react-icons/hi';
import { AppContext } from '../App';
import { formatCurrency } from '../utils/formatters';

const COLORS = ['#22d3ee', '#8b5cf6', '#f59e0b', '#f97316', '#ef4444'];

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatBandRange = (min, max, formatter = (value) => `${value}`, suffix = '') => {
  const formatValue = (value) => `${formatter(value)}${suffix}`;
  if (min === max) return formatValue(min);
  return `${formatValue(min)}-${formatValue(max)}`;
};

const buildDynamicBands = (invoices, accessor, labelPrefix, formatter, suffix = '') => {
  const values = invoices.map((invoice) => accessor(invoice)).map((value) => Math.max(0, Math.round(value))).sort((a, b) => a - b);
  if (values.length === 0) return [];

  const bucketCount = Math.min(5, values.length);
  const size = Math.ceil(values.length / bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => {
    const startIndex = index * size;
    const slice = values.slice(startIndex, startIndex + size);
    const min = slice[0] ?? values[0];
    const max = slice[slice.length - 1] ?? values[values.length - 1];
    return {
      name: `${labelPrefix} ${index + 1} (${formatBandRange(min, max, formatter, suffix)})`,
      min,
      max,
      value: slice.length,
      amount: 0,
      invoices: [],
    };
  });
};

export default function AnalyticsPage() {
  const { invoices, emails, auditLogs } = useContext(AppContext);
  const loading = invoices.length === 0 && emails.length === 0 && auditLogs.length === 0;
  const metrics = useMemo(() => {
    const totalPendingAmount = invoices.reduce((sum, inv) => sum + toNumber(inv.amount), 0);
    const overdueDays = invoices.map((inv) => Math.max(0, Math.round(toNumber(inv.days_overdue))));
    const averageOverdueDays = invoices.length > 0 ? Math.round(overdueDays.reduce((sum, value) => sum + value, 0) / invoices.length) : 0;
    const sortedAmounts = invoices.map((inv) => toNumber(inv.amount)).sort((a, b) => a - b);
    const medianExposure = sortedAmounts.length === 0 ? 0 : sortedAmounts[Math.floor(sortedAmounts.length / 2)];

    return {
      totalInvoices: invoices.length,
      totalPendingAmount,
      averageOverdueDays,
      medianExposure,
      maxOverdueDays: overdueDays.length > 0 ? Math.max(...overdueDays) : 0,
      minOverdueDays: overdueDays.length > 0 ? Math.min(...overdueDays) : 0,
    };
  }, [invoices]);

  const overdueDistribution = useMemo(() => {
    if (invoices.length === 0) return [];

    const bands = buildDynamicBands(invoices, (invoice) => toNumber(invoice.days_overdue), 'Band', (value) => `${value}`, 'd');
    invoices.forEach((invoice) => {
      const days = Math.max(0, Math.round(toNumber(invoice.days_overdue)));
      const band = bands.find((entry) => days >= entry.min && days <= entry.max) || bands[bands.length - 1];
      if (band) {
        band.value += 1;
        band.invoices.push(invoice);
      }
    });

    return bands.filter((entry) => entry.value > 0);
  }, [invoices]);

  const amountByStage = useMemo(() => {
    if (invoices.length === 0) return [];

    const bands = buildDynamicBands(invoices, (invoice) => toNumber(invoice.amount), 'Exposure band', (value) => `₹${Math.round(value / 1000)}k`);
    invoices.forEach((invoice) => {
      const amount = toNumber(invoice.amount);
      const band = bands.find((entry) => amount >= entry.min && amount <= entry.max) || bands[bands.length - 1];
      if (band) {
        band.amount += amount;
        band.invoices.push(invoice);
      }
    });

    return bands.filter((entry) => entry.amount > 0);
  }, [invoices]);

  const topClients = useMemo(() => {
    const map = invoices.reduce((acc, invoice) => {
      const amount = parseFloat(invoice.amount) || 0;
      if (!acc[invoice.client_name]) {
        acc[invoice.client_name] = { name: invoice.client_name, totalAmount: 0, count: 0 };
      }
      acc[invoice.client_name].totalAmount += amount;
      acc[invoice.client_name].count += 1;
      return acc;
    }, {});

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);
  }, [invoices]);

  const stageMomentum = useMemo(() => {
    const total = Math.max(metrics.totalPendingAmount || 1, 1);
    return amountByStage.map((entry, index) => ({
      ...entry,
      rate: Math.round(((entry.amount || 0) / total) * 100),
      rank: index + 1,
    }));
  }, [amountByStage, metrics.totalPendingAmount]);

  const invoiceTrend = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .map((invoice, index) => ({
        name: invoice.invoice_no,
        amount: parseFloat(invoice.amount) || 0,
        overdue: parseInt(invoice.days_overdue) || 0,
        index: index + 1,
      }));
  }, [invoices]);

  const aiMetrics = useMemo(() => {
    const legalBlocks = auditLogs.filter((log) => log.action === 'EMAIL_BLOCKED_LEGAL').length;
    const generatedToday = emails.filter((email) => {
      const generatedAt = new Date(email.email.generatedAt);
      const now = new Date();
      return generatedAt.getUTCFullYear() === now.getUTCFullYear() && generatedAt.getUTCMonth() === now.getUTCMonth() && generatedAt.getUTCDate() === now.getUTCDate();
    }).length;

    return {
      generatedToday,
      totalGenerated: emails.length,
      legalBlocks,
      responseRate: invoices.length > 0 ? Math.round((emails.length / invoices.length) * 100) : 0,
    };
  }, [auditLogs, emails, invoices.length]);

  const insights = useMemo(() => {
    if (invoices.length === 0) {
      return [
        'Upload invoice data to unlock live overdue and escalation analysis.',
        'AI generation metrics will appear once the email workspace starts producing payloads.',
        'Legal queue and audit activity stay synchronized with persisted state.',
      ];
    }

    const sortedByAmount = [...invoices].sort((a, b) => toNumber(b.amount) - toNumber(a.amount));
    const totalExposure = metrics.totalPendingAmount;
    const topClientExposure = topClients[0]?.totalAmount || 0;
    const topClientShare = totalExposure > 0 ? Math.round((topClientExposure / totalExposure) * 100) : 0;
    const concentratedInvoices = sortedByAmount.slice(0, Math.max(1, Math.ceil(invoices.length * 0.25)));
    const concentratedExposure = concentratedInvoices.reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
    const highRiskShare = totalExposure > 0 ? Math.round((concentratedExposure / totalExposure) * 100) : 0;

    return [
      `The largest client, ${topClients[0]?.name || 'unknown'}, represents ${topClientShare}% of pending exposure.`,
      `The top quarter of invoices carries ${highRiskShare}% of total exposure, so concentration risk is driven by actual invoice values rather than fixed stages.`,
      `Average overdue age is ${metrics.averageOverdueDays} days across ${metrics.totalInvoices} invoices.`,
      `${aiMetrics.totalGenerated} email payloads are persisted in the workspace vault.`,
    ];
  }, [aiMetrics.totalGenerated, invoices, metrics.averageOverdueDays, metrics.totalInvoices, metrics.totalPendingAmount, topClients]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl border border-white/8 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">{label}</p>
          <p className="text-lg font-semibold text-white">
            {typeof payload[0].value === 'number' && (payload[0].dataKey === 'amount' || payload[0].dataKey === 'totalAmount')
              ? formatCurrency(payload[0].value)
              : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (invoices.length === 0) {
    return (
      <div className="flex min-h-[66vh] flex-col items-center justify-center text-center animate-in fade-in duration-700">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/8 bg-white/[0.03]">
          <HiOutlineChartBar size={42} className="text-white/12" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">No intelligence data</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/35">Upload invoice data to unlock trend analysis, escalation breakdowns, and client concentration visuals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="section-kicker">Analytics intelligence</p>
          <h1 className="section-title">Financial pattern analysis</h1>
          <p className="section-subtitle max-w-2xl">A cleaner view of overdue distribution, exposure concentration, and client risk derived directly from the current dataset.</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-right">
          <p className="section-kicker">Visualization mode</p>
          <p className="mt-1 text-sm font-medium text-white/75">{loading ? 'Refreshing' : 'Live'}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total invoices', value: metrics.totalInvoices, icon: HiOutlinePresentationChartBar },
          { label: 'Pending exposure', value: formatCurrency(metrics.totalPendingAmount), icon: HiOutlineDatabase },
          { label: 'Avg overdue', value: `${metrics.averageOverdueDays}d`, icon: HiOutlineTrendingUp },
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

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">AI-generated insights</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Assignment intelligence</h3>
            </div>
            <HiOutlineSparkles className="text-cyan-200" size={18} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {insights.map((insight, index) => (
              <div key={index} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm leading-6 text-white/75">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">AI generation metrics</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Email engine health</h3>
            </div>
            <HiOutlineMail className="text-violet-200" size={18} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Generated today', value: aiMetrics.generatedToday },
              { label: 'Vault size', value: aiMetrics.totalGenerated },
              { label: 'Legal blocks', value: aiMetrics.legalBlocks },
              { label: 'Response rate', value: `${aiMetrics.responseRate}%` },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="section-kicker">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Overdue distribution</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Data-driven risk mix</h3>
            </div>
            <HiOutlineSparkles className="text-cyan-200" size={18} />
          </div>
          <div className="mt-5 h-[20rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={overdueDistribution} innerRadius={72} outerRadius={112} paddingAngle={6} dataKey="value">
                  {overdueDistribution.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="rgba(15, 23, 42, 0.7)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Exposure by band</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Value heatmap</h3>
            </div>
            <HiOutlineLibrary className="text-violet-200" size={18} />
          </div>
          <div className="mt-5 h-[20rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={amountByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.18)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.18)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                  {amountByStage.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 sm:p-8 xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Client concentration</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Exposure leaders</h3>
            </div>
            <HiOutlineCube className="text-cyan-200" size={18} />
          </div>
          <div className="mt-5 h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={topClients}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.18)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.18)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="totalAmount" stroke="#22d3ee" fill="url(#colorAmount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Concentration momentum</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Exposure share by band</h3>
            </div>
            <HiOutlineRefresh className="text-cyan-200" size={18} />
          </div>
          <div className="mt-5 h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stageMomentum}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.18)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.18)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 sm:p-8 xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Invoice trends</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Amount and overdue trajectory</h3>
            </div>
            <HiOutlineChartBar className="text-violet-200" size={18} />
          </div>
          <div className="mt-5 h-[18rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={invoiceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.18)" fontSize={10} tickLine={false} axisLine={false} interval={0} hide />
                <YAxis stroke="rgba(255,255,255,0.18)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:col-span-2">
          {[
            { label: 'Data fidelity', value: 'High', icon: HiOutlineDatabase },
            { label: 'Network health', value: 'Stable', icon: HiOutlineShieldCheck },
            { label: 'Processing load', value: 'Optimal', icon: HiOutlineLightningBolt },
            { label: 'Neural accuracy', value: '99.8%', icon: HiOutlinePresentationChartBar },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-cyan-200">
                  <stat.icon size={18} />
                </div>
                <div>
                  <p className="section-kicker">{stat.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
