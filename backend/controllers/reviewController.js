const FlashcardSet = require('../models/FlashcardSet');
const { updateCardReview, getReviewInterval } = require('../services/reviewService');

// @desc    Update flashcard review status
// @route   PUT /api/review/:cardId
exports.updateReview = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { result, setId } = req.body;

    if (!['known', 'not_known'].includes(result)) {
      return res.status(400).json({ success: false, message: 'Result must be "known" or "not_known"' });
    }

    if (!setId) {
      return res.status(400).json({ success: false, message: 'setId is required' });
    }

    const set = await FlashcardSet.findOne({ _id: setId, userId: req.user.id });
    if (!set) {
      return res.status(404).json({ success: false, message: 'Flashcard set not found' });
    }

    const card = set.flashcards.id(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Flashcard not found' });
    }

    const updatedCard = updateCardReview(card, result);

    set.reviewHistory.push({
      cardId: card._id,
      result,
      reviewedAt: new Date(),
    });

    await set.save();

    res.json({
      success: true,
      data: {
        card: updatedCard,
        nextInterval: getReviewInterval(updatedCard.knownCount),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get review history for a set
// @route   GET /api/review/history/:setId
exports.getReviewHistory = async (req, res, next) => {
  try {
    const set = await FlashcardSet.findOne({
      _id: req.params.setId,
      userId: req.user.id,
    }).select('reviewHistory setName');

    if (!set) {
      return res.status(404).json({ success: false, message: 'Flashcard set not found' });
    }

    const history = set.reviewHistory
      .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
      .slice(0, 50);

    res.json({ success: true, data: { setName: set.setName, history } });
  } catch (error) {
    next(error);
  }
};
