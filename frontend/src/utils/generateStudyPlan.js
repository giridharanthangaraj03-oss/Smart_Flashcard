import { getTopicPlanChunks } from './topicMaterial';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return startOfDay(d);
}

export function getExamEndDate(studyProfile) {
  const today = startOfDay(new Date());

  if (studyProfile?.examDateOption === '7_days') {
    return addDays(today, 7);
  }
  if (studyProfile?.examDateOption === '1_month') {
    return addDays(today, 30);
  }
  if (studyProfile?.examDateOption === 'custom' && studyProfile?.examDate) {
    const custom = startOfDay(new Date(studyProfile.examDate));
    return custom > today ? custom : addDays(today, 7);
  }

  return addDays(today, 14);
}

function getSessionsPerWeek(studyFrequency) {
  if (studyFrequency === 'Everyday') return 7;
  if (studyFrequency === '2-4 times in a week') return 3;
  return 2;
}

function buildStudyDates(startDate, endDate, studyFrequency) {
  const sessionsPerWeek = getSessionsPerWeek(studyFrequency);
  const dates = [];
  let cursor = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (sessionsPerWeek === 7) {
    while (cursor < end) {
      dates.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    return dates;
  }

  const weekdayPattern =
    sessionsPerWeek >= 3 ? [1, 3, 5] : [2, 5];

  while (cursor < end) {
    if (weekdayPattern.includes(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor = addDays(cursor, 1);
  }

  if (dates.length === 0) {
    dates.push(new Date(startDate));
  }

  return dates;
}

function isPlaceholderContent(text) {
  return (
    text.startsWith('PDF uploaded:') ||
    text.startsWith('Content will be extracted from uploaded file:')
  );
}

function splitIntoChunks(text, sessionCount, sourceType = 'paste', topic = '') {
  const cleanText = (text || '').trim();
  const count = Math.max(sessionCount, 1);

  if (sourceType === 'topic' && topic.trim()) {
    return getTopicPlanChunks(topic, count);
  }

  if (!cleanText || isPlaceholderContent(cleanText)) {
    return Array.from({ length: count }, (_, index) => ({
      title: `Section ${index + 1}`,
      preview: 'Review uploaded material and key concepts for this section.',
    }));
  }

  const paragraphs = cleanText
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 20);

  if (paragraphs.length >= count) {
    const perGroup = Math.ceil(paragraphs.length / count);
    const chunks = [];

    for (let i = 0; i < count; i += 1) {
      const group = paragraphs.slice(i * perGroup, (i + 1) * perGroup);
      if (!group.length) continue;

      const firstLine = group[0].split('\n')[0].trim();
      chunks.push({
        title: firstLine.slice(0, 70) || `Topic ${i + 1}`,
        preview: group.join(' ').slice(0, 180),
      });
    }

    return chunks.length ? chunks : [{ title: 'Study material', preview: cleanText.slice(0, 180) }];
  }

  const words = cleanText.split(/\s+/).filter(Boolean);
  if (words.length < 40) {
    return [{ title: 'Study material', preview: cleanText.slice(0, 180) }];
  }

  const chunkSize = Math.ceil(words.length / count);
  return Array.from({ length: count }, (_, index) => {
    const slice = words.slice(index * chunkSize, (index + 1) * chunkSize).join(' ');
    return {
      title: `Topic ${index + 1}`,
      preview: slice.slice(0, 180),
    };
  });
}

export function generateStudyPlan({ studyProfile, subject, materialText, sourceType, fileName, topic = '' }) {
  const today = startOfDay(new Date());
  const examDate = getExamEndDate(studyProfile);
  const studyDates = buildStudyDates(today, examDate, studyProfile?.studyFrequency);
  const contentChunks = splitIntoChunks(materialText, studyDates.length, sourceType, topic);
  const focusSubject = subject || studyProfile?.focusSubject || 'General Studies';

  const sessions = studyDates.map((date, index) => {
    const chunk = contentChunks[index] || contentChunks[contentChunks.length - 1];
    const isLastSession = index === studyDates.length - 1;

    const tasks = [
      {
        type: 'read',
        title: `Read: ${chunk.title}`,
        detail: chunk.preview,
      },
      {
        type: 'flashcards',
        title: `Create & review ${focusSubject} flashcards`,
        detail: 'Turn key points from this section into flashcards and review them.',
      },
      {
        type: 'practice',
        title: 'Quick self-check',
        detail: 'Explain the main ideas without looking at your notes.',
      },
    ];

    if (isLastSession) {
      tasks.push({
        type: 'review',
        title: 'Full subject revision',
        detail: `Revise all ${focusSubject} topics before your exam.`,
      });
    }

    return {
      date: toDateKey(date),
      dayNumber: index + 1,
      subject: focusSubject,
      sourceType,
      fileName: fileName || '',
      tasks,
      isExamPrep: isLastSession,
    };
  });

  sessions.push({
    date: toDateKey(examDate),
    dayNumber: sessions.length + 1,
    subject: focusSubject,
    sourceType,
    fileName: fileName || '',
    tasks: [
      {
        type: 'exam',
        title: `${focusSubject} exam / final review`,
        detail: 'Complete a final mock review and go through weak flashcards.',
      },
    ],
    isExamDay: true,
  });

  return {
    subject: focusSubject,
    examDate: toDateKey(examDate),
    studyFrequency: studyProfile?.studyFrequency || 'Everyday',
    studyGoal: studyProfile?.studyGoal || '',
    sourceType,
    fileName: fileName || '',
    sessions,
  };
}

export function getCalendarMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days = [];

  for (let i = 0; i < startPad; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}
