import api from './api';

export const generateFlashcardSet = async ({ setName, studyNotes, subjectFile, maxCards = 8 }) => {
  if (subjectFile) {
    const formData = new FormData();
    formData.append('setName', setName);
    formData.append('maxCards', String(maxCards));
    formData.append('subjectFile', subjectFile);
    if (studyNotes?.trim()) {
      formData.append('studyNotes', studyNotes.trim());
    }

    const { data } = await api.post('/flashcards/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  const { data } = await api.post('/flashcards/generate', { setName, studyNotes, maxCards });
  return data;
};

export const getFlashcardSets = async (params = {}) => {
  const { data } = await api.get('/flashcards', { params });
  return data;
};

export const getFlashcardSet = async (id) => {
  const { data } = await api.get(`/flashcards/${id}`);
  return data;
};

export const deleteFlashcardSet = async (id) => {
  const { data } = await api.delete(`/flashcards/${id}`);
  return data;
};
