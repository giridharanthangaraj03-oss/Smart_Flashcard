const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    studyProfile: {
      displayName: { type: String, trim: true, default: '' },
      institutionType: { type: String, trim: true, default: '' },
      institutionName: { type: String, trim: true, default: '' },
      standard: { type: String, trim: true, default: '' },
      degree: { type: String, trim: true, default: '' },
      studyGoal: { type: String, trim: true, default: '' },
      studyFrequency: { type: String, trim: true, default: '' },
      focusSubject: { type: String, trim: true, default: '' },
      examDateOption: { type: String, trim: true, default: '' },
      examDate: { type: String, trim: true, default: '' },
      studyLanguage: { type: String, trim: true, default: '' },
      onboardingCompleted: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
