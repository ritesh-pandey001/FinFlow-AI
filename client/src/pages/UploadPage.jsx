import { useState, useContext, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCloudUpload, HiOutlineDocumentSearch,
  HiOutlineExclamation, HiOutlineTrash,
  HiOutlineCheck, HiOutlineShieldCheck,
  HiOutlineClock, HiOutlineDatabase, HiOutlinePhotograph, HiOutlineRefresh
} from 'react-icons/hi';
import { AppContext } from '../App';
import { workspaceSeed } from '../data/seedData';
import { uploadCSV, clearInvoices } from '../services/api';
import { formatCurrency, formatDate, getEscalationBadgeClass } from '../utils/formatters';
import { buildSampleCsv, normalizeInvoices } from '../utils/workspace';

export default function UploadPage() {
  const { invoices, setInvoices, addToast, addAuditLog } = useContext(AppContext);
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const isCsvFile = (candidate) => {
    if (!candidate) return false;
    const name = candidate.name?.toLowerCase() || '';
    const mimeType = candidate.type?.toLowerCase() || '';
    return name.endsWith('.csv') || ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'].includes(mimeType);
  };

  const downloadSampleCsv = () => {
    const csv = buildSampleCsv(workspaceSeed.invoices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'finflow-sample-invoices.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    addToast('Sample CSV downloaded', 'success');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (isCsvFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      addToast('Please upload a valid CSV file', 'error');
    }
    e.target.value = '';
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isCsvFile(droppedFile)) {
        setFile(droppedFile);
      } else {
        addToast('Please upload a valid CSV file', 'error');
      }
    }
  }, [addToast]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setUploadProgress(10);
    try {
      const res = await uploadCSV(file);
      setUploadProgress(100);
      setTimeout(() => {
        const uploadedInvoices = Array.isArray(res.data.invoices) ? normalizeInvoices(res.data.invoices) : [];
        if (uploadedInvoices.length === 0) {
          addToast(res.data.message || 'No valid invoice rows were found in the uploaded CSV', 'error');
          setLoading(false);
          setUploadProgress(0);
          return;
        }

        setInvoices(uploadedInvoices);
        addAuditLog({
          action: 'CSV_UPLOAD',
          invoice_no: uploadedInvoices?.[0]?.invoice_no || '-',
          client_name: `${res.data.total} invoices uploaded`,
          tone: '-',
          status: 'success',
          details: `Imported ${res.data.total} invoices from ${file.name}`,
          source: 'upload',
          eventType: 'upload',
          escalation: uploadedInvoices.some((invoice) => invoice.escalation?.requiresLegal) ? 'legal' : 'friendly',
        });
        addToast(`Successfully ingested ${res.data.total} records`, 'success');
        setFile(null);
        setLoading(false);
        setUploadProgress(0);
      }, 400);
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Ingestion failed';
      const validationErrors = Array.isArray(err.response?.data?.errors) ? err.response.data.errors.slice(0, 3).join(' • ') : '';
      addToast(validationErrors ? `${serverMessage}: ${validationErrors}` : serverMessage, 'error');
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Wipe system memory? This will purge all active invoice data.')) return;
    try {
      await clearInvoices();
      setInvoices([]);
      addAuditLog({
        action: 'INVOICES_CLEARED',
        invoice_no: '-',
        client_name: 'System',
        tone: '-',
        status: 'warning',
        details: 'Invoice workspace cleared by user action',
        source: 'workspace',
        eventType: 'clear',
        escalation: 'general',
      });
      addToast('System memory cleared', 'info');
    } catch (err) {
      addToast('Failed to purge memory', 'error');
    }
  };

  const stats = useMemo(() => {
    const avgOverdue = invoices.length > 0
      ? Math.round(invoices.reduce((a, b) => a + (parseInt(b.days_overdue) || 0), 0) / invoices.length)
      : 0;
    const legalCount = invoices.filter((invoice) => parseInt(invoice.days_overdue) > 30).length;
    const totalAmount = invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0);

    return [
      { label: 'Total ingested', value: invoices.length, icon: HiOutlineCheck, detail: 'Invoice nodes' },
      { label: 'Avg overdue', value: `${avgOverdue}d`, icon: HiOutlineClock, detail: 'Escalation pace' },
      { label: 'Legal locks', value: legalCount, icon: HiOutlineShieldCheck, detail: 'Manual review' },
      { label: 'Exposure', value: formatCurrency(totalAmount), icon: HiOutlineDatabase, detail: 'Live amount' },
    ];
  }, [invoices]);

  const schemaChecklist = ['invoice_no', 'client_name', 'amount', 'due_date', 'email', 'days_overdue'];
  const recentInvoices = useMemo(() => invoices.slice(0, 6), [invoices]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <section className="hero-panel glass-panel p-6 sm:p-8 xl:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
              <HiOutlineCloudUpload size={14} />
              Data ingestion pipeline
            </div>
            <div>
              <h1 className="section-title">Upload and classify finance data</h1>
              <p className="mt-4 max-w-2xl section-subtitle">Drop in CSV invoices, validate the schema, and push the stream into the AI workflow without leaving the workspace.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[46rem]">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <stat.icon className="text-cyan-300" size={18} />
                <p className="mt-3 text-2xl font-black tracking-tighter text-white">{stat.value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{stat.label}</p>
                <p className="mt-1 text-[11px] text-white/30">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <section
            className={`glass-panel border-2 border-dashed p-6 sm:p-8 transition duration-300 ${dragActive ? 'border-cyan-400/40 bg-cyan-400/8' : 'border-white/10'}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} disabled={loading} className="hidden" />

            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              className="flex cursor-pointer flex-col items-center text-center outline-none"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_30px_80px_-30px_rgba(2,6,23,0.95)]">
                {file ? <HiOutlineDocumentSearch className="text-cyan-300" size={42} /> : <HiOutlineCloudUpload className="text-white/20" size={42} />}
              </div>
              <h3 className="mt-6 text-2xl font-black tracking-tight text-white">{file ? file.name : 'Drop your CSV file here'}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/35">Drag and drop a valid invoice CSV or click to browse. The upload zone is fully responsive and validates format before execution.</p>

              <div className="mt-8 w-full">
                <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  <span>Upload progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
              <button type="button" onClick={openFilePicker} disabled={loading} className="btn-secondary flex-1 py-4 text-xs uppercase tracking-[0.2em]">
                <HiOutlineCloudUpload size={16} />
                Browse CSV
              </button>
              <button type="button" onClick={downloadSampleCsv} className="btn-secondary flex-1 py-4 text-xs uppercase tracking-[0.2em]">
                <HiOutlineDocumentSearch size={16} />
                Download sample CSV
              </button>
              <button type="button" onClick={handleUpload} disabled={!file || loading} className="btn-primary flex-1 py-4">
                {loading ? <HiOutlineRefresh className="animate-spin" size={18} /> : <HiOutlineCloudUpload size={18} />}
                {loading ? 'Processing stream' : 'Execute ingestion'}
              </button>
              <button type="button" onClick={handleClear} disabled={invoices.length === 0} className="btn-secondary flex-1 py-4 text-xs uppercase tracking-[0.2em]">
                <HiOutlineTrash size={16} />
                Purge memory
              </button>
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                <HiOutlineExclamation size={18} />
              </div>
              <div>
                <p className="section-kicker">Schema validation</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-white">Required columns</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {schemaChecklist.map((field) => (
                <div key={field} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                  <span className="font-medium text-white/75">{field}</span>
                  <span className="badge-cyan">Required</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5 sm:px-8">
              <div>
                <p className="section-kicker">Live preview</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-white">Invoice stream</h3>
              </div>
              <span className="badge-cyan">{invoices.length} nodes</span>
            </div>
            <div className="max-h-[34rem] overflow-auto">
              {invoices.length > 0 ? (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Node ID</th>
                      <th>Entity</th>
                      <th>Exposure</th>
                      <th>Timeline</th>
                      <th>Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, index) => (
                      <motion.tr key={invoice.invoice_no} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}>
                        <td className="font-mono text-xs text-cyan-200">{invoice.invoice_no}</td>
                        <td className="font-semibold text-white/85">{invoice.client_name}</td>
                        <td className="font-bold text-white">{formatCurrency(invoice.amount)}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-white/65">{formatDate(invoice.due_date)}</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">{invoice.days_overdue}d overdue</span>
                          </div>
                        </td>
                        <td>
                          <span className={getEscalationBadgeClass(invoice.escalation.id)}>{invoice.escalation.label}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex min-h-[24rem] flex-col items-center justify-center p-12 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                    <HiOutlineDocumentSearch className="text-white/10" size={46} />
                  </div>
                  <h4 className="mt-6 text-2xl font-black tracking-tight text-white">Stream empty</h4>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/35">Upload a CSV to preview the active dataset, validate structure, and enable downstream AI workflows.</p>
                </div>
              )}
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Recent ingestions</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-white">Latest invoice nodes</h3>
              </div>
              <HiOutlinePhotograph className="text-cyan-300" size={18} />
            </div>
            <div className="mt-5 space-y-3">
              {recentInvoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">No records to display yet</div>
              ) : recentInvoices.map((invoice) => (
                <div key={invoice.invoice_no} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white/85">{invoice.client_name}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">{invoice.invoice_no} • {formatDate(invoice.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white">{formatCurrency(invoice.amount)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">{invoice.days_overdue}d overdue</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
