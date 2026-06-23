export const TOPIC_SUBTOPICS = [
  (topic) => `Introduction to ${topic}`,
  (topic) => `Key definitions in ${topic}`,
  (topic) => `Core principles of ${topic}`,
  (topic) => `Examples and applications of ${topic}`,
  (topic) => `Practice questions for ${topic}`,
  (topic) => `Common mistakes in ${topic}`,
  (topic) => `Revision and summary of ${topic}`,
];

export function expandTopicMaterial(topic) {
  const cleanTopic = topic.trim();
  if (!cleanTopic) return '';

  return TOPIC_SUBTOPICS.map((builder) => builder(cleanTopic)).join('\n\n');
}

export function getTopicPlanChunks(topic, sessionCount) {
  const cleanTopic = topic.trim();
  const subtopics = TOPIC_SUBTOPICS.map((builder) => builder(cleanTopic));
  const count = Math.max(sessionCount, 1);

  if (subtopics.length >= count) {
    const perGroup = Math.ceil(subtopics.length / count);
    const chunks = [];

    for (let i = 0; i < count; i += 1) {
      const group = subtopics.slice(i * perGroup, (i + 1) * perGroup);
      if (!group.length) continue;
      chunks.push({
        title: group[0],
        preview: `Study ${group.join(', ')} for ${cleanTopic}.`,
      });
    }

    return chunks.length ? chunks : [{ title: cleanTopic, preview: `Study ${cleanTopic} step by step.` }];
  }

  return Array.from({ length: count }, (_, index) => ({
    title: subtopics[index] || `Topic ${index + 1}: ${cleanTopic}`,
    preview: `Focus on learning ${cleanTopic} through reading, flashcards, and practice.`,
  }));
}
