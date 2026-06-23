import numpy as np
from sentence_transformers import SentenceTransformer, util

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def rank_sentences(sentences: list[str], keywords: list[str], top_n: int = 30) -> list[tuple[str, float]]:
    """Step 3: Rank sentences by cosine similarity to keyword concepts."""
    if not sentences or not keywords:
        return [(s, 0.5) for s in sentences[:top_n]]

    model = get_model()
    keyword_text = ' '.join(keywords[:10])
    keyword_embedding = model.encode(keyword_text, convert_to_tensor=True)
    sentence_embeddings = model.encode(sentences, convert_to_tensor=True)

    similarities = util.cos_sim(keyword_embedding, sentence_embeddings)[0]
    scored = [(sentences[i], float(similarities[i])) for i in range(len(sentences))]
    scored.sort(key=lambda x: x[1], reverse=True)

    return scored[:top_n]
