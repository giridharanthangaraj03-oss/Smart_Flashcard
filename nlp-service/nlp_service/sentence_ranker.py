import re

from .settings import is_lightweight_mode

_model = None


def get_model():
    global _model
    if is_lightweight_mode():
        return None

    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def _rank_sentences_heuristic(
    sentences: list[str],
    keywords: list[str],
    top_n: int,
) -> list[tuple[str, float]]:
    keyword_terms = set()
    for keyword in keywords:
        keyword_terms.update(keyword.lower().split())

    scored = []
    for sentence in sentences:
        words = set(re.findall(r'\b[a-z]{3,}\b', sentence.lower()))
        overlap = len(words & keyword_terms) / max(len(keyword_terms), 1)
        length_bonus = min(len(sentence.split()) / 30, 1.0) * 0.2
        scored.append((sentence, overlap + length_bonus + 0.3))

    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[:top_n]


def rank_sentences(sentences: list[str], keywords: list[str], top_n: int = 30) -> list[tuple[str, float]]:
    """Rank sentences by semantic similarity or lightweight keyword overlap."""
    if not sentences:
        return []

    if is_lightweight_mode() or not keywords:
        return _rank_sentences_heuristic(sentences, keywords, top_n)

    model = get_model()
    if model is None:
        return _rank_sentences_heuristic(sentences, keywords, top_n)

    from sentence_transformers import util

    keyword_text = ' '.join(keywords[:10])
    keyword_embedding = model.encode(keyword_text, convert_to_tensor=True)
    sentence_embeddings = model.encode(sentences, convert_to_tensor=True)

    similarities = util.cos_sim(keyword_embedding, sentence_embeddings)[0]
    scored = [(sentences[i], float(similarities[i])) for i in range(len(sentences))]
    scored.sort(key=lambda x: x[1], reverse=True)

    return scored[:top_n]
