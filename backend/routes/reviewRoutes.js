const express = require('express');
const { updateReview, getReviewHistory } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const dbReady = require('../middleware/dbReady');

const router = express.Router();

router.use(dbReady);
router.use(protect);

router.put('/:cardId', updateReview);
router.get('/history/:setId', getReviewHistory);

module.exports = router;
