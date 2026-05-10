const STAGE_META = {
  friendly: {
    id: 'friendly',
    label: 'Warm & Friendly',
    reason: 'Early follow-up for a lightly overdue account.',
  },
  polite: {
    id: 'polite',
    label: 'Polite but Firm',
    reason: 'Reminder sent after the first escalation threshold.',
  },
  formal: {
    id: 'formal',
    label: 'Formal & Serious',
    reason: 'Formal payment notice issued to the finance contact.',
  },
  urgent: {
    id: 'urgent',
    label: 'Urgent Reminder',
    reason: 'Escalation is now time-sensitive and requires attention.',
  },
  legal: {
    id: 'legal',
    label: 'Legal Escalation',
    reason: 'Account exceeds 30 days overdue and must move to legal review.',
  },
};

const toNumber = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getStageFromDays = (daysOverdue) => {
  if (daysOverdue <= 7) return 'friendly';
  if (daysOverdue <= 14) return 'polite';
  if (daysOverdue <= 21) return 'formal';
  if (daysOverdue <= 30) return 'urgent';
  return 'legal';
};

const buildReviewTimestamp = (invoice) => {
  if (invoice?.escalation?.legalReviewAt) return invoice.escalation.legalReviewAt;

  const date = invoice?.due_date ? new Date(`${invoice.due_date}T09:00:00.000Z`) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  const stage = getStageFromDays(toNumber(invoice?.days_overdue));
  if (stage !== 'legal') return null;

  date.setDate(date.getDate() + 7);
  return date.toISOString();
};

export function normalizeInvoice(invoice, index = 0) {
  const daysOverdue = toNumber(invoice?.days_overdue);
  const stage = getStageFromDays(daysOverdue);
  const stageMeta = STAGE_META[stage];

  return {
    ...invoice,
    amount: String(invoice?.amount ?? '0'),
    currency: invoice?.currency || 'INR',
    payment_reference: invoice?.payment_reference || `PMT-${String(index + 1).padStart(4, '0')}`,
    days_overdue: String(daysOverdue),
    escalation: {
      ...stageMeta,
      code: invoice?.escalation?.code || `ESC-${stage.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      reason: invoice?.escalation?.reason || stageMeta.reason,
      requiresLegal: stage === 'legal',
      blockedEmail: stage === 'legal',
      reviewStatus: stage === 'legal' ? 'Queued for legal review' : 'Active collections',
      legalReviewAt: buildReviewTimestamp(invoice),
    },
  };
}

export function normalizeInvoices(invoices = []) {
  return invoices.map((invoice, index) => normalizeInvoice(invoice, index));
}

export function normalizeEmailRecord(record, index = 0) {
  return {
    ...record,
    invoice: record?.invoice ? normalizeInvoice(record.invoice, index) : record.invoice,
    email: {
      ...record?.email,
      subject: record?.email?.subject || 'Payment Follow-Up',
      body: record?.email?.body || '',
      fullContent: record?.email?.fullContent || record?.email?.body || '',
      generatedAt: record?.email?.generatedAt || new Date().toISOString(),
      model: record?.email?.model || '~google/gemini-flash-latest',
      tone: record?.email?.tone || 'Professional',
    },
  };
}

export function normalizeEmails(emails = []) {
  return emails.map((record, index) => normalizeEmailRecord(record, index));
}

export function normalizeAuditLog(entry, index = 0) {
  return {
    id: entry?.id || `audit-${index + 1}`,
    timestamp: entry?.timestamp || new Date().toISOString(),
    action: entry?.action || 'SYSTEM_EVENT',
    invoice_no: entry?.invoice_no ?? '-',
    client_name: entry?.client_name ?? '-',
    tone: entry?.tone ?? '-',
    status: entry?.status || 'success',
    details: entry?.details || '',
    source: entry?.source || 'system',
    eventType: entry?.eventType || 'activity',
    escalation: entry?.escalation || 'general',
    reference: entry?.reference || entry?.invoice_no || '-',
  };
}

export function normalizeAuditLogs(logs = []) {
  return logs.map((log, index) => normalizeAuditLog(log, index));
}

export function normalizeWorkspaceState(state) {
  return {
    invoices: normalizeInvoices(state?.invoices || []),
    emails: normalizeEmails(state?.emails || []),
    auditLogs: normalizeAuditLogs(state?.auditLogs || []),
  };
}

export function deriveLegalQueue(invoices = []) {
  return normalizeInvoices(invoices).filter((invoice) => invoice.escalation?.requiresLegal);
}

export function deriveNotifications(auditLogs = []) {
  return normalizeAuditLogs(auditLogs).slice(0, 6).map((entry) => ({
    id: entry.id,
    title: entry.action.replaceAll('_', ' '),
    meta: `${entry.client_name || 'System'} • ${entry.status}`,
    tone: entry.status === 'warning' ? 'amber' : entry.status === 'error' ? 'red' : 'cyan',
    action: entry.action,
    timestamp: entry.timestamp,
  }));
}

const quoteCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export function buildSampleCsv(invoices = []) {
  const rows = normalizeInvoices(invoices);
  return [
    ['invoice_no', 'client_name', 'amount', 'due_date', 'email', 'days_overdue'],
    ...rows.map((invoice) => [invoice.invoice_no, invoice.client_name, invoice.amount, invoice.due_date, invoice.email, invoice.days_overdue]),
  ]
    .map((row) => row.map(quoteCell).join(','))
    .join('\n');
}

export function buildEmailsCsv(emails = []) {
  return [
    ['timestamp', 'invoice_no', 'client_name', 'tone', 'subject', 'model'],
    ...normalizeEmails(emails).map((entry) => [
      entry.email.generatedAt,
      entry.invoice?.invoice_no,
      entry.invoice?.client_name,
      entry.email.tone,
      entry.email.subject,
      entry.email.model,
    ]),
  ]
    .map((row) => row.map(quoteCell).join(','))
    .join('\n');
}

export function buildAuditCsv(logs = []) {
  return [
    ['timestamp', 'action', 'client_name', 'invoice_no', 'tone', 'status', 'source', 'eventType', 'escalation', 'details'],
    ...normalizeAuditLogs(logs).map((log) => [log.timestamp, log.action, log.client_name, log.invoice_no, log.tone, log.status, log.source, log.eventType, log.escalation, log.details]),
  ]
    .map((row) => row.map(quoteCell).join(','))
    .join('\n');
}