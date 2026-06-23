import re
from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer

_ner_pipeline = None

NER_MODEL = 'dslim/bert-base-NER'
NER_ENTITY_LABELS = {'ORG', 'PER', 'LOC', 'MISC'}

STOP_WORDS = {
    'that', 'this', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 'which',
    'when', 'where', 'what', 'about', 'into', 'also', 'more', 'than', 'such', 'each',
    'other', 'these', 'those', 'using', 'used', 'make', 'made', 'will', 'your', 'there',
}


def get_ner_pipeline():
    """Load Hugging Face NER pipeline for keyword extraction."""
    global _ner_pipeline
    if _ner_pipeline is None:
        from transformers import pipeline

        _ner_pipeline = pipeline(
            'ner',
            model=NER_MODEL,
            aggregation_strategy='simple',
        )
    return _ner_pipeline


def preload_keyword_models():
    """Warm up Hugging Face keyword models during service startup."""
    get_ner_pipeline()


def get_nlp():
    """Backward-compatible alias used by app startup."""
    return get_ner_pipeline()


def _extract_ner_keywords(text: str) -> set[str]:
    keywords = set()
    ner = get_ner_pipeline()
    max_chars = 10000
    chunk_size = 2000

    for start in range(0, min(len(text), max_chars), chunk_size):
        chunk = text[start:start + chunk_size].strip()
        if not chunk:
            continue

        try:
            entities = ner(chunk)
        except Exception as error:
            print(f'HF NER extraction failed for chunk: {error}')
            continue

        for entity in entities:
            label = entity.get('entity_group', '')
            phrase = entity.get('word', '').strip().lower()
            if label in NER_ENTITY_LABELS and len(phrase) > 2:
                keywords.add(phrase)

    return keywords


def _extract_phrase_keywords(text: str) -> set[str]:
    keywords = set()

    for match in re.finditer(r'\b(?:[A-Z][a-z]+(?:\s+|-)?){1,4}[A-Z][a-z]+\b', text):
        phrase = match.group().strip().lower()
        if len(phrase) > 4:
            keywords.add(phrase)

    for match in re.finditer(r'\b[a-z]{3,}(?:\s+[a-z]{3,}){1,2}\b', text.lower()):
        phrase = match.group().strip()
        if phrase.startswith(('the ', 'a ', 'an ')):
            continue
        if any(word in STOP_WORDS for word in phrase.split()):
            continue
        keywords.add(phrase)

    return keywords


def extract_keywords(text: str, sentences: list[str]) -> list[str]:
    """Step 2: Extract keywords using Hugging Face NER, TF-IDF, and phrase heuristics."""
    keywords = set()

    try:
        keywords.update(_extract_ner_keywords(text))
    except Exception as error:
        print(f'Keyword model load/extract failed: {error}')

    keywords.update(_extract_phrase_keywords(text))

    if sentences:
        try:
            vectorizer = TfidfVectorizer(
                max_features=20,
                stop_words='english',
                ngram_range=(1, 3),
            )
            tfidf_matrix = vectorizer.fit_transform(sentences)
            feature_names = vectorizer.get_feature_names_out()
            scores = tfidf_matrix.sum(axis=0).A1
            top_indices = scores.argsort()[-15:][::-1]
            for idx in top_indices:
                if scores[idx] > 0:
                    keywords.add(feature_names[idx])
        except ValueError:
            pass

    freq = Counter()
    words = re.findall(r'\b[a-z]{4,}\b', text.lower())
    for word in words:
        if word not in STOP_WORDS:
            freq[word] += 1
    for word, _ in freq.most_common(10):
        keywords.add(word)

    return list(keywords)[:25]
