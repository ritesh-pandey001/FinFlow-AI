import { motion } from 'framer-motion';
import {
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineEyeOff,
  HiOutlineServer,
  HiOutlineFingerPrint,
  HiOutlineChip,
  HiOutlineCube,
  HiOutlineDotsHorizontal,
  HiOutlineExclamationCircle,
  HiOutlineBan,
  HiOutlineDatabase,
  HiOutlineSparkles,
} from 'react-icons/hi';

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: HiOutlineKey,
      title: 'API Key Isolation',
      desc: 'OpenRouter credentials stay on the server and are never exposed to the browser or persisted client-side.',
      status: 'Secured',
    },
    {
      icon: HiOutlineLockClosed,
      title: 'Dry-Run Protection',
      desc: 'The UI clearly states that no real emails are sent, and the workspace only simulates outbound actions.',
      status: 'Active',
    },
    {
      icon: HiOutlineEyeOff,
      title: 'PII Masking',
      desc: 'Email previews and audit rows can be filtered and exported without exposing hidden server secrets or private keys.',
      status: 'Operational',
    },
    {
      icon: HiOutlineFingerPrint,
      title: 'Audit Traceability',
      desc: 'Uploads, AI generations, exports, and legal blocks are all recorded in a local event stream for compliance review.',
      status: 'Verifiable',
    },
    {
      icon: HiOutlineServer,
      title: 'Prompt Injection Mitigation',
      desc: 'Prompt assembly is constrained to the invoice payload and tone policy so untrusted CSV content does not control system instructions.',
      status: 'Active',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Hallucination Control',
      desc: 'Generated emails follow bounded templates, fixed tone choices, and human-visible preview steps before export or reuse.',
      status: 'Enforced',
    },
  ];

  const mitigationRows = [
    { threat: 'Prompt injection', control: 'Strict template assembly and server-side model proxy', status: 'Mitigated' },
    { threat: 'Sensitive data leakage', control: 'PII masking and no secret exposure in the browser', status: 'Mitigated' },
    { threat: 'Unauthorized sending', control: 'Dry-run mode and manual review before any action', status: 'Blocked' },
    { threat: 'Legal escalation bypass', control: 'Hard block for >30 day overdue invoices', status: 'Blocked' },
    { threat: 'Audit tampering', control: 'Immutable client-side event chain with exportable history', status: 'Monitored' },
  ];

  const complianceBadges = ['SOC 2 Ready', 'GDPR Controls', 'Zero Trust', 'Audit Logged', 'Local Persistence', 'Dry Run'];

  const architectureLayers = [
    { label: 'CSV Upload', detail: 'Invoice rows land in a controlled validation flow.', icon: HiOutlineDatabase },
    { label: 'Validation Engine', detail: 'Schema checks and overdue normalization prepare the workspace.', icon: HiOutlineDotsHorizontal },
    { label: 'Tone + Escalation Logic', detail: 'Stage selection governs legal blocking and outbound tone.', icon: HiOutlineChip },
    { label: 'OpenRouter AI', detail: 'The server proxies model calls without exposing secrets to the client.', icon: HiOutlineSparkles },
    { label: 'Generated Emails', detail: 'AI outputs are stored locally and reviewed before export.', icon: HiOutlineShieldCheck },
    { label: 'Audit Logs', detail: 'Every action is persisted for search, export, and monitoring.', icon: HiOutlineFingerPrint },
    { label: 'Analytics Dashboard', detail: 'Charts derive from the same workspace state to stay synchronized.', icon: HiOutlineCube },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <section className="hero-panel glass-panel p-6 sm:p-8 xl:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
              <HiOutlineShieldCheck size={14} />
              Dry-run safety and governance
            </div>
            <div>
              <h1 className="section-title">Security and compliance architecture</h1>
              <p className="mt-4 max-w-2xl section-subtitle">This workspace is built as a production-style demo: secrets stay server-side, emails are dry-run only, and all user actions are logged locally for review and export.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">
            <p className="section-kicker text-emerald-200/70">Trust index</p>
            <p className="mt-1 text-2xl font-black tracking-tighter text-white">High</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-5 md:grid-cols-2">
          {securityFeatures.map((item, index) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass-panel p-6 sm:p-7 min-h-[16rem]">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-cyan-200">
                    <item.icon size={22} />
                  </div>
                  <span className="badge-cyan">{item.status}</span>
                </div>
                <div className="mt-6 space-y-3">
                  <h3 className="text-lg font-bold tracking-tight text-white">{item.title}</h3>
                  <p className="text-sm leading-6 text-white/35">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <section className="glass-panel p-6 sm:p-8">
            <div>
              <p className="section-kicker">Architecture flow</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-white">CSV to governance path</h3>
            </div>
            <div className="mt-6 space-y-4">
              {architectureLayers.map((step, index) => (
                <div key={step.label} className="relative flex items-start gap-4 rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/70 text-cyan-200">
                    <step.icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-white">{step.label}</p>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Step {index + 1}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-white/35">{step.detail}</p>
                  </div>
                  {index < architectureLayers.length - 1 && <div className="absolute left-6 top-14 h-5 w-px bg-white/10" />}
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div>
              <p className="section-kicker">Compliance badges</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-white">Submission posture</h3>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {complianceBadges.map((badge) => (
                <div key={badge} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  {badge}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Mitigation table</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-white">Assignment risk controls</h3>
            </div>
            <HiOutlineBan className="text-amber-300" size={18} />
          </div>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/8">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Threat</th>
                  <th>Control</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mitigationRows.map((row) => (
                  <tr key={row.threat}>
                    <td className="font-semibold text-white">{row.threat}</td>
                    <td>{row.control}</td>
                    <td><span className="badge-cyan">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="glass-panel p-6 sm:p-8 bg-amber-500/[0.02]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-200">
              <HiOutlineExclamationCircle size={22} />
            </div>
            <div>
              <p className="section-kicker text-amber-200/70">Dry run banner</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-white">No real emails are sent</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/35">All AI output in this prototype is review-only, persisted locally, and intended for assignment demonstration rather than live transmission.</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}