/**
 * Escalation Service
 * Determines the escalation stage and tone based on overdue days
 */

const ESCALATION_STAGES = [
  {
    id: 'friendly',
    label: 'Warm & Friendly',
    minDays: 1,
    maxDays: 7,
    color: '#22d3ee',
    bgColor: 'rgba(34, 211, 238, 0.1)',
    borderColor: 'rgba(34, 211, 238, 0.3)',
    severity: 1,
    description: 'Gentle reminder about the pending payment',
    toneInstruction: 'Write in a warm, friendly, and polite tone. Be understanding and helpful. Assume it may be an oversight.'
  },
  {
    id: 'polite',
    label: 'Polite but Firm',
    minDays: 8,
    maxDays: 14,
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
    severity: 2,
    description: 'Polite follow-up with clear expectation',
    toneInstruction: 'Write in a polite but firm tone. Clearly state the overdue amount and request prompt payment. Maintain professionalism but convey importance.'
  },
  {
    id: 'formal',
    label: 'Formal & Serious',
    minDays: 15,
    maxDays: 21,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    severity: 3,
    description: 'Formal notice with consequences mentioned',
    toneInstruction: 'Write in a formal and serious tone. Mention potential consequences of continued non-payment. Reference previous reminders. Request immediate action.'
  },
  {
    id: 'urgent',
    label: 'Stern & Urgent',
    minDays: 22,
    maxDays: 30,
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    severity: 4,
    description: 'Urgent demand with escalation warning',
    toneInstruction: 'Write in a stern and urgent tone. Clearly state this is a final reminder before legal escalation. Demand immediate payment. Mention potential legal consequences and credit impact.'
  },
  {
    id: 'legal',
    label: 'Legal Escalation',
    minDays: 31,
    maxDays: Infinity,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    severity: 5,
    description: 'Beyond email — escalated to legal review',
    toneInstruction: null // No AI email generated
  }
];

export function getEscalationStage(daysOverdue) {
  const days = Math.max(0, parseInt(daysOverdue) || 0);

  for (const stage of ESCALATION_STAGES) {
    if (days >= stage.minDays && days <= stage.maxDays) {
      return {
        ...stage,
        daysOverdue: days,
        requiresLegal: stage.id === 'legal',
        canGenerateEmail: stage.id !== 'legal'
      };
    }
  }

  // Default to legal if somehow not matched
  return {
    ...ESCALATION_STAGES[4],
    daysOverdue: days,
    requiresLegal: true,
    canGenerateEmail: false
  };
}

export function classifyInvoices(invoices) {
  const classified = invoices.map(inv => {
    const escalation = getEscalationStage(inv.days_overdue);
    return {
      ...inv,
      escalation
    };
  });

  return classified;
}

export function getEscalationSummary(invoices) {
  const summary = {
    friendly: { count: 0, totalAmount: 0 },
    polite: { count: 0, totalAmount: 0 },
    formal: { count: 0, totalAmount: 0 },
    urgent: { count: 0, totalAmount: 0 },
    legal: { count: 0, totalAmount: 0 }
  };

  invoices.forEach(inv => {
    const stage = getEscalationStage(inv.days_overdue);
    const amount = parseFloat(inv.amount) || 0;
    if (summary[stage.id]) {
      summary[stage.id].count++;
      summary[stage.id].totalAmount += amount;
    }
  });

  return summary;
}

export { ESCALATION_STAGES };
