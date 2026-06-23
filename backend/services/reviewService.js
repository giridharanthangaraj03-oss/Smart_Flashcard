const REVIEW_INTERVALS = {
  1: 3,
  2: 7,
  3: 14,
  default: 30,
};

const getReviewInterval = (knownCount) => {
  if (knownCount <= 0) return 1;
  if (knownCount === 1) return REVIEW_INTERVALS[1];
  if (knownCount === 2) return REVIEW_INTERVALS[2];
  if (knownCount === 3) return REVIEW_INTERVALS[3];
  return REVIEW_INTERVALS.default;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getCardWeight = (card) => {
  return (card.notKnownCount + 1) / (card.knownCount + 1);
};

const getWeightedCards = (flashcards) => {
  return [...flashcards]
    .map((card) => ({
      ...card.toObject ? card.toObject() : card,
      weight: getCardWeight(card),
    }))
    .sort((a, b) => b.weight - a.weight);
};

const updateCardReview = (card, result) => {
  if (result === 'known') {
    card.knownCount += 1;
    const interval = getReviewInterval(card.knownCount);
    card.nextReviewDate = addDays(new Date(), interval);
  } else {
    card.notKnownCount += 1;
    card.nextReviewDate = addDays(new Date(), 1);
  }
  return card;
};

const calculateStats = (sets) => {
  let totalSets = sets.length;
  let totalCards = 0;
  let knownCards = 0;
  let notKnownCards = 0;

  sets.forEach((set) => {
    totalCards += set.flashcards.length;
    set.flashcards.forEach((card) => {
      if (card.knownCount > card.notKnownCount) {
        knownCards += 1;
      } else if (card.notKnownCount > 0) {
        notKnownCards += 1;
      }
    });
  });

  return { totalSets, totalCards, knownCards, notKnownCards };
};

module.exports = {
  getReviewInterval,
  getCardWeight,
  getWeightedCards,
  updateCardReview,
  calculateStats,
  REVIEW_INTERVALS,
};
