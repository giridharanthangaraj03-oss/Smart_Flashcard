const express = require('express');
const { body } = require('express-validator');
const {
  generateFlashcards,
  getFlashcardSets,
  getFlashcardSet,
  deleteFlashcardSet,
} = require('../controllers/flashcardController');
const { protect } = require('../middleware/auth');
const dbReady = require('../middleware/dbReady');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(dbReady);
router.use(protect);

router.post(
  '/generate',
  upload.single('subjectFile'),
  [body('setName').trim().notEmpty().withMessage('Set name is required')],
  generateFlashcards
);

router.get('/', getFlashcardSets);
router.get('/:id', getFlashcardSet);
router.delete('/:id', deleteFlashcardSet);

module.exports = router;
