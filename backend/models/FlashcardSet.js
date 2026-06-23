const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  knownCount: {
    type: Number,
    default: 0,
  },
  notKnownCount: {
    type: Number,
    default: 0,
  },
  nextReviewDate: {
    type: Date,
    default: Date.now,
  },
});

const reviewHistorySchema = new mongoose.Schema({
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  result: {
    type: String,
    enum: ['known', 'not_known'],
    required: true,
  },
  reviewedAt: {
    type: Date,
    default: Date.now,
  },
});

const flashcardSetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    setName: {
      type: String,
      required: [true, 'Set name is required'],
      trim: true,
      maxlength: [200, 'Set name cannot exceed 200 characters'],
    },
    flashcards: [flashcardSchema],
    reviewHistory: [reviewHistorySchema],
  },
  {
    timestamps: true,
  }
);

flashcardSetSchema.virtual('cardCount').get(function () {
  return this.flashcards.length;
});

flashcardSetSchema.set('toJSON', { virtuals: true });
flashcardSetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FlashcardSet', flashcardSetSchema);
