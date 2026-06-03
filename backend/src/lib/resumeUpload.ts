import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

export function textField(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim();
  return '';
}

export async function extractResumeText(file?: Express.Multer.File): Promise<string> {
  if (!file) return '';

  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.originalname.toLowerCase().endsWith('.docx')
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value.trim();
  }

  if (file.mimetype.startsWith('text/') || /\.(txt|md)$/i.test(file.originalname)) {
    return file.buffer.toString('utf8').trim();
  }

  throw new Error('Unsupported resume file type. Upload a PDF, DOCX, TXT, or MD file.');
}
