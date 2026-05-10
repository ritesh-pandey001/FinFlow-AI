/**
 * AI Routes — Email generation and insights
 */

import { Router } from 'express';
import { generateEmail, generateInsights } from '../services/aiService.js';
import { addAuditLog } from '../services/auditService.js';

const router = Router();

// Generate email for single invoice
router.post('/generate-email', async (req, res, next) => {
  try {
    const { invoice } = req.body;
    if (!invoice) {
      return res.status(400).json({ error: true, message: 'Invoice data required' });
    }

    const result = await generateEmail(invoice);

    addAuditLog({
      action: result.legalEscalation ? 'LEGAL_ESCALATION' : 'EMAIL_GENERATED',
      invoice_no: invoice.invoice_no,
      client_name: invoice.client_name,
      tone: result.escalation?.label || 'N/A',
      status: result.success ? 'success' : 'failed',
      details: result.success
        ? `AI email generated with ${result.escalation.label} tone`
        : result.error
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Batch generate emails
router.post('/generate-batch', async (req, res, next) => {
  try {
    const { invoices } = req.body;
    if (!invoices || !Array.isArray(invoices)) {
      return res.status(400).json({ error: true, message: 'Invoices array required' });
    }

    const results = [];
    for (const invoice of invoices) {
      const result = await generateEmail(invoice);
      results.push(result);

      addAuditLog({
        action: result.legalEscalation ? 'LEGAL_ESCALATION' : 'EMAIL_GENERATED',
        invoice_no: invoice.invoice_no,
        client_name: invoice.client_name,
        tone: result.escalation?.label || 'N/A',
        status: result.success ? 'success' : 'failed',
        details: result.success
          ? `AI email generated with ${result.escalation.label} tone`
          : result.error
      });

      // Small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    res.json({
      success: true,
      total: results.length,
      generated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      legalEscalations: results.filter(r => r.legalEscalation).length,
      results
    });
  } catch (err) {
    next(err);
  }
});

// Generate AI insights
router.post('/insights', async (req, res, next) => {
  try {
    const { invoices } = req.body;
    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ error: true, message: 'Invoices array required' });
    }

    const insights = await generateInsights(invoices);

    addAuditLog({
      action: 'INSIGHTS_GENERATED',
      invoice_no: '-',
      client_name: '-',
      tone: '-',
      status: 'success',
      details: `Generated ${insights.length} AI insights for ${invoices.length} invoices`
    });

    res.json({ success: true, insights });
  } catch (err) {
    next(err);
  }
});

export default router;
