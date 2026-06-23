const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const getExtension = (filename = '') => filename.toLowerCase().slice(filename.lastIndexOf('.'));

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }
  }
};

const extractTextFromFile = async (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  const extension = getExtension(file.originalname);
  const buffer = file.buffer;

  if (extension === '.txt' || file.mimetype === 'text/plain') {
    return buffer.toString('utf8');
  }

  if (extension === '.pdf' || file.mimetype === 'application/pdf') {
    return extractPdfText(buffer);
  }

  if (
    extension === '.docx' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (extension === '.doc' || file.mimetype === 'application/msword') {
    throw new Error('Legacy .doc files are not supported. Please save as .docx, .pdf, or .txt');
  }

  throw new Error('Unsupported file type. Upload .txt, .pdf, or .docx');
};

const normalizeStudyText = (text) => text.replace(/\s+/g, ' ').trim();

module.exports = { extractTextFromFile, normalizeStudyText };
