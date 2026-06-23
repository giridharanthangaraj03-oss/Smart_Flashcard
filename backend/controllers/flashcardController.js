const { validationResult } = require('express-validator');
const FlashcardSet = require('../models/FlashcardSet');
const { generateFlashcards } = require('../services/nlpClient');
const { extractTextFromFile, normalizeStudyText } = require('../services/fileTextExtractor');
const { getWeightedCards, calculateStats } = require('../services/reviewService');

const resolveStudyNotes = async (req) => {
  if (req.file) {
    const extracted = await extractTextFromFile(req.file);
    return normalizeStudyText(extracted);
  }

  return normalizeStudyText(req.body.studyNotes || '');
};

// @desc    Generate and save flashcards from study notes or uploaded file
// @route   POST /api/flashcards/generate
exports.generateFlashcards = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { setName, maxCards } = req.body;
    const studyNotes = await resolveStudyNotes(req);
    const cardLimit = Math.min(Math.max(parseInt(maxCards, 10) || 8, 1), 15);

    if (!studyNotes || studyNotes.length < 3) {
      return res.status(400).json({
        success: false,
        message: req.file
          ? 'Uploaded file does not contain enough readable text (minimum 3 characters).'
          : 'Study notes must be at least 3 characters.',
      });
    }

    const generatedCards = await generateFlashcards(studyNotes, cardLimit);

    if (!generatedCards || generatedCards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not generate flashcards from the provided notes. Please add more content.',
      });
    }

    const flashcards = generatedCards.map((card) => ({
      question: card.question,
      answer: card.answer,
      knownCount: 0,
      notKnownCount: 0,
      nextReviewDate: new Date(),
    }));

    const flashcardSet = await FlashcardSet.create({
      userId: req.user.id,
      setName,
      flashcards,
    });

    res.status(201).json({
      success: true,
      data: flashcardSet,
      meta: {
        requestedCount: cardLimit,
        generatedCount: flashcards.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all flashcard sets for user with stats
// @route   GET /api/flashcards
exports.getFlashcardSets = async (req, res, next) => {
  try {
    const { search, sort } = req.query;
    const query = { userId: req.user.id };

    let sets = await FlashcardSet.find(query).sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      sets = sets.filter((set) => set.setName.toLowerCase().includes(searchLower));
    }

    if (sort === 'date_asc') {
      sets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'name') {
      sets.sort((a, b) => a.setName.localeCompare(b.setName));
    }

    const stats = calculateStats(sets);

    res.json({
      success: true,
      data: sets,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single flashcard set
// @route   GET /api/flashcards/:id
exports.getFlashcardSet = async (req, res, next) => {
  try {
    const set = await FlashcardSet.findOne({ _id: req.params.id, userId: req.user.id });

    if (!set) {
      return res.status(404).json({ success: false, message: 'Flashcard set not found' });
    }

    const weightedCards = getWeightedCards(set.flashcards);
    const dueCards = weightedCards.filter((c) => new Date(c.nextReviewDate) <= new Date());

    res.json({
      success: true,
      data: set,
      reviewQueue: dueCards.length > 0 ? dueCards : weightedCards,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete flashcard set
// @route   DELETE /api/flashcards/:id
exports.deleteFlashcardSet = async (req, res, next) => {
  try {
    const set = await FlashcardSet.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!set) {
      return res.status(404).json({ success: false, message: 'Flashcard set not found' });
    }

    res.json({ success: true, message: 'Flashcard set deleted' });
  } catch (error) {
    next(error);
  }
};
