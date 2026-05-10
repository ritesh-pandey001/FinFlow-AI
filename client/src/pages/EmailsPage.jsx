import { useState, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlineMail,
  HiOutlineClipboardCopy,
  HiOutlineTerminal,
  HiOutlineScale,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCube,
  HiOutlineClock,
  HiOutlineSwitchHorizontal,
  HiOutlineShieldCheck,
  HiOutlineDownload,
  HiOutlineX,
  HiOutlineMailOpen,
} from 'react-icons/hi';
import { AppContext } from '../App';
import { generateEmail, generateBatchEmails } from '../services/api';
import { buildEmailsCsv } from '../utils/workspace';
import { formatCurrency, getEscalationBadgeClass, formatDateTime } from '../utils/formatters';

export default function EmailsPage() {
  const { invoices, emails, setEmails, addToast, addAuditLog, legalQueue } = useContext(AppContext);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [previewEmail, setPreviewEmail] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const legalHoldQueue = useMemo(() => legalQueue.filter((invoice) => invoice.escalation?.requiresLegal), [legalQueue]);

  const pendingCount = invoices.filter((invoice) => !emails.some((email) => email.invoice.invoice_no === invoice.invoice_no)).length;
  const legalCount = legalHoldQueue.length;

  const visibleQueue = useMemo(() => {
    return invoices.filter((invoice) => {
      const alreadyGenerated = emails.some((email) => email.invoice.invoice_no === invoice.invoice_no);
      if (alreadyGenerated) return false;
      if (activeFilter === 'legal') return invoice.escalation.requiresLegal;
      if (activeFilter === 'ready') return !invoice.escalation.requiresLegal;
      return true;
    });
  }, [activeFilter, emails, invoices]);

  const generationState = [
    { label: 'Queue pending', value: pendingCount, icon: HiOutlineTerminal },
    { label: 'Payloads secure', value: emails.length, icon: HiOutlineMail },
    { label: 'Legal holds', value: legalCount, icon: HiOutlineScale },
    { label: 'Dry-run mode', value: 'On', icon: HiOutlineShieldCheck },
  ];

  const downloadEmailsCsv = () => {
    const csv = buildEmailsCsv(emails);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `finflow-email-vault-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    addToast('Email vault exported', 'success');
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('Payload copied to clipboard', 'success');
    } catch {
      addToast('Clipboard access blocked', 'error');
    }
  };

  const handleGenerate = async (invoice) => {
    if (invoice.escalation.requiresLegal) {
      addAuditLog({
        action: 'EMAIL_BLOCKED_LEGAL',
        invoice_no: invoice.invoice_no,
        client_name: invoice.client_name,
        tone: invoice.escalation.label,
        status: 'warning',
        details: `Blocked email generation because ${invoice.escalation.reason}`,
        source: 'ai',
        eventType: 'blocked',
        escalation: 'legal',
      });
      addToast('Legal escalation required. Generation blocked.', 'warning');
      return;
    }

    setGeneratingId(invoice.invoice_no);
    try {
      const res = await generateEmail(invoice);
      if (res.data.success) {
        setEmails((prev) => [res.data, ...prev.filter((email) => email.invoice.invoice_no !== invoice.invoice_no)]);
        addAuditLog({
          action: 'EMAIL_GENERATED',
          invoice_no: invoice.invoice_no,
          client_name: invoice.client_name,
          tone: res.data.email.tone,
          status: 'success',
          details: `Generated follow-up email for ${invoice.client_name}`,
          source: 'ai',
          eventType: 'email_generate',
          escalation: invoice.escalation.id,
        });
        addToast(`Neural generation complete: ${invoice.invoice_no}`, 'success');
      } else {
        addToast(res.data.error || 'Generation failed', 'error');
      }
    } catch {
      addToast('AI Engine Offline', 'error');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleBatchGenerate = async () => {
    const processable = invoices.filter((invoice) => !invoice.escalation.requiresLegal);
    if (processable.length === 0) {
      addToast('No processable nodes in current stream', 'warning');
      return;
    }
    if (!window.confirm(`Initiate batch neural generation for ${processable.length} nodes?`)) return;

    setLoadingBatch(true);
    try {
      const res = await generateBatchEmails(processable);
      const newEmails = res.data.results.filter((result) => result.success);
      setEmails((prev) => {
        const existingNos = new Set(newEmails.map((email) => email.invoice.invoice_no));
        return [...newEmails, ...prev.filter((email) => !existingNos.has(email.invoice.invoice_no))];
      });

      newEmails.forEach((result) => {
        addAuditLog({
          action: 'EMAIL_GENERATED',
          invoice_no: result.invoice.invoice_no,
          client_name: result.invoice.client_name,
          tone: result.email.tone,
          status: 'success',
          details: `Batch generated email for ${result.invoice.client_name}`,
          source: 'ai',
          eventType: 'batch_generate',
          escalation: result.invoice.escalation.id,
        });
      });

      addToast(`Batch successful: ${res.data.generated} generations complete`, 'info');
    } catch {
      addToast('Batch execution failed', 'error');
    } finally {
      setLoadingBatch(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <section className="hero-panel glass-panel p-6 sm:p-8 xl:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">
              <HiOutlineSparkles size={14} />
              Dry-run mode enabled
            </div>
            <div>
              <h1 className="section-title">Generate premium follow-up emails</h1>
              <p className="mt-4 max-w-2xl section-subtitle">Manage the AI queue, review generated payloads, and monitor legal holds from a single responsive workspace. No real emails are sent from this demo.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:w-auto xl:items-center">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
              <p className="section-kicker">Model engine</p>
              <p className="mt-1 text-sm font-bold text-white">~google/gemini-flash-latest</p>
            </div>
            <button onClick={downloadEmailsCsv} disabled={emails.length === 0} className="btn-secondary px-6 py-4">
              <HiOutlineDownload size={18} />
              Export email vault
            </button>
            <button onClick={handleBatchGenerate} disabled={loadingBatch || invoices.length === 0} className="btn-primary px-6 py-4">
              {loadingBatch ? <HiOutlineRefresh className="animate-spin" /> : <HiOutlineSparkles size={18} />}
              {loadingBatch ? 'Executing batch' : 'Batch generate'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {generationState.map((item) => (
          <div key={item.label} className="glass-panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">{item.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tighter text-white">{item.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-cyan-200">
                <item.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Generation queue</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-white">Invoices ready for AI</h3>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] p-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                {['all', 'ready', 'legal'].map((filter) => (
                  <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-2 transition ${activeFilter === filter ? 'bg-cyan-400/15 text-cyan-200' : 'hover:text-white'}`}>
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
              {visibleQueue.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/30">No invoices in the current filter</div>
              ) : visibleQueue.map((invoice) => (
                <motion.div layout key={invoice.invoice_no} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-cyan-400/20 hover:bg-white/[0.05]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-bold text-white">{invoice.client_name}</p>
                        <span className={getEscalationBadgeClass(invoice.escalation.id)}>{invoice.escalation.label}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-white/40">{invoice.escalation.reason}</p>
                      <div className="mt-3 grid gap-2 text-[11px] font-mono font-bold text-white/35 sm:grid-cols-4">
                        <span className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">{invoice.invoice_no}</span>
                        <span className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">{formatCurrency(invoice.amount)}</span>
                        <span className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-rose-300">{invoice.days_overdue} days overdue</span>
                        <span className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-white/50">{invoice.payment_reference}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {invoice.escalation.requiresLegal ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-red-300">
                          <HiOutlineScale size={16} />
                          Legal hold
                        </div>
                      ) : (
                        <button onClick={() => handleGenerate(invoice)} disabled={generatingId === invoice.invoice_no} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950">
                          {generatingId === invoice.invoice_no ? <HiOutlineRefresh className="animate-spin" size={18} /> : <HiOutlineSparkles size={18} />}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Legal review queue</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-white">Blocked from generation</h3>
              </div>
              <HiOutlineScale className="text-red-300" size={18} />
            </div>
            <div className="mt-5 space-y-3">
              {legalHoldQueue.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/30">No legal queue items right now</div>
              ) : legalHoldQueue.map((invoice) => (
                <div key={invoice.invoice_no} className="rounded-3xl border border-red-400/15 bg-red-400/8 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-white">{invoice.client_name}</p>
                        <span className="badge-red">Legal review</span>
                      </div>
                      <p className="mt-2 text-sm text-white/35">{invoice.escalation.reason}</p>
                      <p className="mt-2 text-[11px] font-mono text-white/40">{invoice.invoice_no} • {invoice.payment_reference}</p>
                    </div>
                    <div className="text-right text-[11px] text-white/40">
                      <p className="font-black uppercase tracking-[0.18em] text-red-200">Escalation timestamp</p>
                      <p className="mt-1">{invoice.escalation.legalReviewAt ? formatDateTime(invoice.escalation.legalReviewAt) : 'Pending'}</p>
                      <p className="mt-1 text-red-200">Blocked email generation</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Generated output</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-white">Email vault</h3>
              </div>
              <span className="badge-purple">{emails.length} payloads</span>
            </div>

            <div className="mt-5 space-y-4">
              {emails.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
                  <HiOutlineCube className="mx-auto text-white/10" size={46} />
                  <p className="mt-4 text-lg font-bold text-white">Workspace empty</p>
                  <p className="mt-2 text-sm text-white/35">Generate a batch or trigger one invoice to create the first premium email preview.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {emails.map((emailData, idx) => (
                    <motion.div key={emailData.invoice.invoice_no} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] transition hover:border-violet-400/20 hover:bg-white/[0.05]">
                      <div role="button" tabIndex={0} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none" onClick={() => setExpandedEmail(expandedEmail === idx ? null : idx)} onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setExpandedEmail(expandedEmail === idx ? null : idx);
                        }
                      }}>
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200">
                            <HiOutlineMail size={22} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-bold text-white">{emailData.invoice.client_name}</p>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">{emailData.email.tone}</span>
                            </div>
                            <p className="mt-1 truncate text-xs text-white/40">{emailData.email.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-white/35">
                          <div className="hidden text-right md:block">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/60">Generated</p>
                            <p className="mt-1 text-[10px] font-bold text-white/30">{formatDateTime(emailData.email.generatedAt)}</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewEmail(emailData); }} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45 transition hover:text-cyan-200 hover:bg-cyan-400/10">
                            Preview
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); copyToClipboard(emailData.email.fullContent); }} className="rounded-xl border border-white/8 bg-white/[0.03] p-2 transition hover:bg-white/[0.06]">
                            <HiOutlineClipboardCopy size={18} />
                          </button>
                          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2">
                            {expandedEmail === idx ? <HiOutlineChevronUp size={18} /> : <HiOutlineChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedEmail === idx && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-white/8 px-5 pb-5">
                            <div className="relative mt-4 rounded-[28px] border border-white/8 bg-slate-950/70 p-5">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                                <HiOutlineClock size={14} />
                                Email preview
                              </div>
                              <p className="mt-4 font-mono text-[11px] leading-6 text-white/65 whitespace-pre-wrap">
                                <span className="mb-4 block text-cyan-200 font-black">SUBJECT: {emailData.email.subject}</span>
                                {emailData.email.body}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Tone and status</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-white">Operational summary</h3>
              </div>
              <HiOutlineSwitchHorizontal className="text-cyan-300" size={18} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Batch mode', value: 'Ready' },
                { label: 'Clipboard', value: 'Enabled' },
                { label: 'Escalation', value: 'Guarded' },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-center">
                  <p className="section-kicker">{item.label}</p>
                  <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <AnimatePresence>
        {previewEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            onClick={() => setPreviewEmail(null)}
          >
            <motion.div
              initial={{ y: 16, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.98 }}
              className="glass-panel w-full max-w-4xl overflow-hidden p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
                <div>
                  <p className="section-kicker">Email preview modal</p>
                  <h3 className="mt-2 text-xl font-black tracking-tight text-white">{previewEmail.email.subject}</h3>
                </div>
                <button onClick={() => setPreviewEmail(null)} className="rounded-xl border border-white/8 bg-white/[0.03] p-2 text-white/50 transition hover:text-white">
                  <HiOutlineX size={18} />
                </button>
              </div>
              <div className="grid gap-6 p-6 lg:grid-cols-[0.7fr_0.3fr]">
                <div className="rounded-[28px] border border-white/8 bg-slate-950/70 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={getEscalationBadgeClass(previewEmail.invoice.escalation.id)}>{previewEmail.email.tone}</span>
                    <span className="badge-cyan">{previewEmail.invoice.invoice_no}</span>
                    <span className="badge-purple">{formatDateTime(previewEmail.email.generatedAt)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/70 whitespace-pre-wrap">{previewEmail.email.fullContent}</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-5">
                    <p className="section-kicker">Client</p>
                    <p className="mt-2 text-lg font-bold text-white">{previewEmail.invoice.client_name}</p>
                    <p className="mt-1 text-sm text-white/35">{previewEmail.invoice.email}</p>
                  </div>
                  <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-5">
                    <p className="section-kicker">Actions</p>
                    <button onClick={() => copyToClipboard(previewEmail.email.fullContent)} className="btn-secondary mt-4 w-full justify-center py-3 text-xs uppercase tracking-[0.2em]">
                      <HiOutlineClipboardCopy size={16} />
                      Copy content
                    </button>
                    <button onClick={downloadEmailsCsv} className="btn-secondary mt-3 w-full justify-center py-3 text-xs uppercase tracking-[0.2em]">
                      <HiOutlineDownload size={16} />
                      Export vault CSV
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}