export const institutionTypes = ['School', 'College', 'University'];

export const schoolStandards = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

export const degrees = ['Bachelor', 'Master', 'PhD', 'Diploma', 'Other'];

export const schoolCourses = {
  'Class 6': ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science'],
  'Class 7': ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science'],
  'Class 8': ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science'],
  'Class 9': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Science', 'Computer Science'],
  'Class 10': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Science', 'Computer Science'],
  'Class 11': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Economics', 'Accountancy'],
  'Class 12': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Economics', 'Accountancy'],
};

export const degreeCourses = {
  Bachelor: [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Commerce',
    'Physics',
    'Chemistry',
    'Biology',
    'Mathematics',
    'English Literature',
  ],
  Master: [
    'Computer Science',
    'Data Science',
    'Artificial Intelligence',
    'Business Administration',
    'Finance',
    'Physics',
    'Chemistry',
    'Biology',
    'Mathematics',
    'English Literature',
  ],
  PhD: [
    'Computer Science',
    'Data Science',
    'Artificial Intelligence',
    'Physics',
    'Chemistry',
    'Biology',
    'Mathematics',
    'Management Studies',
    'English Literature',
  ],
  Diploma: [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
  ],
  Other: ['General Studies', 'Custom Subject'],
};

export const studyGoals = [
  'Get better marks',
  'Understand the concept',
  "Feel confident with what I've learned",
  'Others',
];

export const studyFrequencies = [
  'Everyday',
  '2-4 times in a week',
  'Just when I can',
];

export const examDateOptions = [
  { value: '7_days', label: 'In 7 days' },
  { value: '1_month', label: 'In 1 month' },
  { value: 'custom', label: 'Choose the exact date' },
];

export const studyLanguages = [
  'English',
  'French',
  'Tamil',
  'Hindi',
  'Spanish',
  'German',
  'Telugu',
  'Malayalam',
  'Other',
];

export const getCoursesForProfile = (institutionType, standard, degree) => {
  if (institutionType === 'School' && standard) {
    return schoolCourses[standard] || [];
  }
  if ((institutionType === 'College' || institutionType === 'University') && degree) {
    return degreeCourses[degree] || [];
  }
  return [];
};

export const getInstitutionNameLabel = (institutionType) => {
  if (institutionType === 'School') return 'School name';
  if (institutionType === 'College') return 'College name';
  if (institutionType === 'University') return 'University name';
  return 'Institution name';
};

export const getInstitutionNameStepTitle = (institutionType) => {
  if (institutionType === 'School') return 'Which school do you study at?';
  if (institutionType === 'College') return 'Which college do you study at?';
  return 'Which university do you study at?';
};

export const getInstitutionNamePlaceholder = (institutionType) => {
  if (institutionType === 'School') return 'Enter your school name';
  if (institutionType === 'College') return 'Enter your college name';
  return 'Enter your university name';
};
