const express = require('express');
const { body } = require('express-validator');
const { signup, login, getProfile, saveStudyProfile, getStudyProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const dbReady = require('../middleware/dbReady');
const { validatePasswordStrength } = require('../utils/passwordValidation');
const router = express.Router();

router.use(dbReady);

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').custom((value) => {
      const errors = validatePasswordStrength(value);
      if (errors.length) {
        throw new Error(errors.join(', '));
      }
      return true;
    }),    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/profile', protect, getProfile);
router.get('/study-profile', protect, getStudyProfile);
router.put('/study-profile', protect, saveStudyProfile);

module.exports = router;
