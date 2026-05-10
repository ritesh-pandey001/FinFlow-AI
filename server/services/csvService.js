/**
 * CSV Parsing Service
 */

import fs from 'fs';
import csvParser from 'csv-parser';

const REQUIRED_COLUMNS = ['invoice_no', 'client_name', 'amount', 'due_date', 'email', 'days_overdue'];

const HEADER_ALIASES = {
  invoice_no: ['invoice_no', 'invoice number', 'invoice number', 'invoice no', 'invoice #', 'invoice id', 'invoice'],
  client_name: ['client_name', 'client name', 'customer', 'customer name', 'company', 'company name', 'client'],
  amount: ['amount', 'invoice amount', 'amount due', 'balance', 'outstanding amount', 'total amount', 'net amount', 'value'],
  due_date: ['due_date', 'due date', 'payment due date', 'due', 'invoice due date'],
  email: ['email', 'email address', 'billing email', 'accounts email', 'ap email', 'contact email'],
  days_overdue: ['days_overdue', 'days overdue', 'overdue days', 'overdue', 'aging days'],
};

const normalizeHeader = (header) => (header || '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, '_');

const normalizeCell = (value) => {
  if (value == null) return '';
  return String(value).trim();
};

const pickValue = (row, column) => {
  const aliases = HEADER_ALIASES[column] || [column];
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const candidate = normalizeCell(row[normalizedAlias]);
    if (candidate) return candidate;
  }
  return '';
};

const deriveDaysOverdue = (row, fallbackDueDate) => {
  const directValue = pickValue(row, 'days_overdue');
  if (directValue) return directValue;

  const dueDateValue = fallbackDueDate || pickValue(row, 'due_date');
  if (!dueDateValue) return '';

  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) return '';

  const today = new Date();
  const diffTime = today - dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return String(Math.max(0, diffDays));
};

export function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];

    fs.createReadStream(filePath)
      .pipe(csvParser({
        mapHeaders: ({ header }) => normalizeHeader(header)
      }))
      .on('data', (row) => {
        const cleanRow = {};
        const rowErrors = [];

        REQUIRED_COLUMNS.forEach((col) => {
          if (col === 'days_overdue') return;
          const value = pickValue(row, col);
          if (!value) {
            rowErrors.push(`Missing ${col}`);
          }
          cleanRow[col] = value;
        });

        cleanRow.days_overdue = deriveDaysOverdue(row, cleanRow.due_date);

        if (!cleanRow.days_overdue) {
          rowErrors.push('Missing days_overdue or a valid due_date');
        }

        cleanRow.amount = normalizeCell(cleanRow.amount).replace(/[^0-9.]/g, '');

        if (!cleanRow.amount) {
          rowErrors.push('Missing amount');
        }

        if (!cleanRow.invoice_no) {
          rowErrors.push('Missing invoice_no');
        }

        if (!cleanRow.client_name) {
          rowErrors.push('Missing client_name');
        }

        if (!cleanRow.email) {
          rowErrors.push('Missing email');
        }

        if (rowErrors.length === 0) {
          results.push(cleanRow);
        } else {
          errors.push(`Row skipped: ${rowErrors.join(', ')} | data=${JSON.stringify(row)}`);
        }
      })
      .on('end', () => {
        resolve({ invoices: results, errors, total: results.length });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

export function validateCSVColumns(filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(csvParser({
        mapHeaders: ({ header }) => normalizeHeader(header)
      }));

    stream.on('headers', (headers) => {
      const missing = REQUIRED_COLUMNS.filter((column) => {
        if (column === 'days_overdue') return false;
        const aliases = HEADER_ALIASES[column] || [column];
        return !aliases.some((alias) => headers.includes(normalizeHeader(alias)));
      });
      stream.destroy();
      resolve({ valid: missing.length === 0, missing, headers });
    });

    stream.on('error', reject);
  });
}
