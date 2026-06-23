const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config/env');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpire });
};

// @desc    Register user
// @route   POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        studyProfile: user.studyProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save study onboarding profile
// @route   PUT /api/auth/study-profile
exports.saveStudyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.studyProfile = {
      displayName: req.body.displayName || user.name,
      institutionType: req.body.institutionType || '',
      institutionName: req.body.institutionName || '',
      standard: req.body.standard || '',
      degree: req.body.degree || '',
      studyGoal: req.body.studyGoal || '',
      studyFrequency: req.body.studyFrequency || '',
      focusSubject: req.body.focusSubject || '',
      examDateOption: req.body.examDateOption || '',
      examDate: req.body.examDate || '',
      studyLanguage: req.body.studyLanguage || '',
      onboardingCompleted: true,
    };

    await user.save();

    res.json({ success: true, data: user.studyProfile });
  } catch (error) {
    next(error);
  }
};

// @desc    Get study onboarding profile
// @route   GET /api/auth/study-profile
exports.getStudyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('studyProfile name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user.studyProfile });
  } catch (error) {
    next(error);
  }
};
