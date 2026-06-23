import re
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
import spacy

_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load('en_core_web_sm')
        except OSError:
            from spacy.cli import download
            download('en_core_web_sm')
            _nlp = spacy.load('en_core_web_sm')
    return _nlp


def extract_keywords(text: str, sentences: list[str]) -> list[str]:
    """Step 2: Extract keywords using spaCy noun chunks, NER, and TF-IDF."""
    nlp = get_nlp()
    doc = nlp(text)
    keywords = set()

    for chunk in doc.noun_chunks:
        phrase = chunk.text.strip().lower()
        if len(phrase) > 2 and not phrase.startswith(('the ', 'a ', 'an ')):
            keywords.add(phrase)

    for ent in doc.ents:
        if ent.label_ in ('PERSON', 'ORG', 'GPE', 'PRODUCT', 'EVENT', 'LAW', 'WORK_OF_ART'):
            keywords.add(ent.text.strip().lower())

    if sentences:
        try:
            vectorizer = TfidfVectorizer(
                max_features=20,
                stop_words='english',
                ngram_range=(1, 2),
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
    stop = {'that', 'this', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 'which', 'when', 'where', 'what', 'about', 'into', 'also', 'more', 'than', 'such', 'each', 'other', 'these', 'those', 'using', 'used', 'make', 'made'}
    for w in words:
        if w not in stop:
            freq[w] += 1
    for word, _ in freq.most_common(10):
        keywords.add(word)

    return list(keywords)[:25]
