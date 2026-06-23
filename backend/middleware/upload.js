const multer = require('multer');

const allowedMimeTypes = new Set([
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const allowedExtensions = ['.txt', '.pdf', '.docx', '.doc'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowedMimeTypes.has(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only .txt, .pdf, .doc, and .docx files are supported'));
  },
});

module.exports = upload;
