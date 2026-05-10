/**
 * Invoice Routes
 */

import { Router } from 'express';
import upload from '../middleware/upload.js';
import { parseCSV } from '../services/csvService.js';
import { classifyInvoices, getEscalationSummary } from '../services/escalationService.js';
import { addAuditLog } from '../services/auditService.js';

const router = Router();

// In-memory invoice store (per session)
let currentInvoices = [];

// Upload CSV
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No CSV file uploaded' });
    }

    const result = await parseCSV(req.file.path);
    if (result.total === 0) {
      return res.status(422).json({
        error: true,
        message: 'No valid invoice rows were found in the uploaded CSV',
        total: 0,
        invoices: [],
        summary: null,
        errors: result.errors,
        filename: req.file.originalname,
      });
    }

    const classified = classifyInvoices(result.invoices);
    currentInvoices = classified;

    addAuditLog({
      action: 'CSV_UPLOAD',
      invoice_no: '-',
      client_name: '-',
      tone: '-',
      status: 'success',
      details: `Uploaded ${result.total} invoices from ${req.file.originalname}`
    });

    res.json({
      success: true,
      message: `Successfully parsed ${result.total} invoices`,
      total: result.total,
      invoices: classified,
      summary: getEscalationSummary(result.invoices),
      errors: result.errors,
      filename: req.file.originalname
    });
  } catch (err) {
    next(err);
  }
});

// Get current invoices
router.get('/', (req, res) => {
  res.json({
    invoices: currentInvoices,
    total: currentInvoices.length,
    summary: currentInvoices.length > 0
      ? getEscalationSummary(currentInvoices)
      : null
  });
});

// Get single invoice
router.get('/:invoiceNo', (req, res) => {
  const invoice = currentInvoices.find(
    inv => inv.invoice_no === req.params.invoiceNo
  );
  if (!invoice) {
    return res.status(404).json({ error: true, message: 'Invoice not found' });
  }
  res.json({ invoice });
});

// Clear invoices
router.delete('/clear', (req, res) => {
  const count = currentInvoices.length;
  currentInvoices = [];
  addAuditLog({
    action: 'INVOICES_CLEARED',
    invoice_no: '-',
    client_name: '-',
    tone: '-',
    status: 'success',
    details: `Cleared ${count} invoices from memory`
  });
  res.json({ success: true, message: `Cleared ${count} invoices` });
});

export default router;
