/**
 * Analytics Routes
 */

import { Router } from 'express';
import { getEscalationSummary, getEscalationStage } from '../services/escalationService.js';

const router = Router();

// Get analytics for provided invoices
router.post('/overview', (req, res) => {
  const { invoices } = req.body;
  if (!invoices || !Array.isArray(invoices)) {
    return res.status(400).json({ error: true, message: 'Invoices array required' });
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const avgOverdue = invoices.length > 0
    ? Math.round(invoices.reduce((sum, inv) => sum + (parseInt(inv.days_overdue) || 0), 0) / invoices.length)
    : 0;

  const escalationSummary = getEscalationSummary(invoices);

  // Overdue distribution for charts
  const overdueDistribution = [
    { name: '1-7 days', value: escalationSummary.friendly.count, fill: '#22d3ee' },
    { name: '8-14 days', value: escalationSummary.polite.count, fill: '#a78bfa' },
    { name: '15-21 days', value: escalationSummary.formal.count, fill: '#f59e0b' },
    { name: '22-30 days', value: escalationSummary.urgent.count, fill: '#f97316' },
    { name: '30+ days', value: escalationSummary.legal.count, fill: '#ef4444' }
  ];

  // Amount by escalation stage
  const amountByStage = [
    { name: 'Friendly', amount: escalationSummary.friendly.totalAmount, fill: '#22d3ee' },
    { name: 'Polite', amount: escalationSummary.polite.totalAmount, fill: '#a78bfa' },
    { name: 'Formal', amount: escalationSummary.formal.totalAmount, fill: '#f59e0b' },
    { name: 'Urgent', amount: escalationSummary.urgent.totalAmount, fill: '#f97316' },
    { name: 'Legal', amount: escalationSummary.legal.totalAmount, fill: '#ef4444' }
  ];

  // Client-wise breakdown
  const clientBreakdown = {};
  invoices.forEach(inv => {
    if (!clientBreakdown[inv.client_name]) {
      clientBreakdown[inv.client_name] = { name: inv.client_name, totalAmount: 0, count: 0, maxOverdue: 0 };
    }
    clientBreakdown[inv.client_name].totalAmount += parseFloat(inv.amount) || 0;
    clientBreakdown[inv.client_name].count++;
    clientBreakdown[inv.client_name].maxOverdue = Math.max(
      clientBreakdown[inv.client_name].maxOverdue,
      parseInt(inv.days_overdue) || 0
    );
  });

  const topClients = Object.values(clientBreakdown)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  res.json({
    metrics: {
      totalInvoices: invoices.length,
      totalPendingAmount: totalAmount,
      averageOverdueDays: avgOverdue,
      highRiskCount: escalationSummary.legal.count,
      urgentCount: escalationSummary.urgent.count,
      legalEscalations: escalationSummary.legal.count
    },
    escalationSummary,
    overdueDistribution,
    amountByStage,
    topClients
  });
});

export default router;
