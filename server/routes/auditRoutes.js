/**
 * Audit Trail Routes
 */

import { Router } from 'express';
import { getAuditLogs, clearAuditLogs, exportAuditCSV } from '../services/auditService.js';

const router = Router();

// Get audit logs
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const result = getAuditLogs(limit, offset);
  res.json(result);
});

// Export audit logs as CSV
router.get('/export', (req, res) => {
  const csv = exportAuditCSV();
  if (!csv) {
    return res.status(404).json({ error: true, message: 'No audit logs to export' });
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=finflow-audit-log.csv');
  res.send(csv);
});

// Clear audit logs
router.delete('/clear', (req, res) => {
  const result = clearAuditLogs();
  res.json(result);
});

export default router;
