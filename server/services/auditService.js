/**
 * Audit Trail Service
 * Logs all system actions for compliance
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_FILE = join(__dirname, '..', 'logs', 'audit.json');

function ensureLogFile() {
  const dir = join(__dirname, '..', 'logs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '[]');
}

function readLogs() {
  ensureLogFile();
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  ensureLogFile();
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

export function addAuditLog(entry) {
  const logs = readLogs();
  const logEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...entry
  };
  logs.unshift(logEntry);
  // Keep last 1000 entries
  if (logs.length > 1000) logs.length = 1000;
  writeLogs(logs);
  return logEntry;
}

export function getAuditLogs(limit = 100, offset = 0) {
  const logs = readLogs();
  return {
    logs: logs.slice(offset, offset + limit),
    total: logs.length,
    limit,
    offset
  };
}

export function clearAuditLogs() {
  writeLogs([]);
  return { cleared: true };
}

export function exportAuditCSV() {
  const logs = readLogs();
  if (logs.length === 0) return '';

  const headers = ['id', 'timestamp', 'action', 'invoice_no', 'client_name', 'tone', 'status', 'details'];
  const rows = logs.map(log =>
    headers.map(h => `"${(log[h] || '').toString().replace(/"/g, '""')}"`).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
