/**
 * Multer middleware for CSV file upload
 */

import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const isCsvFile = (file) => {
  const originalName = (file.originalname || '').toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();

  return originalName.endsWith('.csv') || ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'].includes(mimeType);
};

const fileFilter = (req, file, cb) => {
  if (isCsvFile(file)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export default upload;
