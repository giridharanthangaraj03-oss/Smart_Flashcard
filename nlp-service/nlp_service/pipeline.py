import re

from .text_cleaner import clean_text, split_sentences
from .keyword_extractor import extract_keywords
from .sentence_ranker import rank_sentences
from .question_generator import build_flashcard_pair
from .topic_generator import expand_topic_study_notes, generate_flashcards_from_topic

DEFAULT_MAX_CARDS = 8
ABSOLUTE_MAX_CARDS = 15
TOPIC_MODE_MAX_LENGTH = 120


def determine_card_count(sentence_count: int, max_cards: int = DEFAULT_MAX_CARDS) -> int:
    """Use the user-requested count as the generation target."""
    requested = max(1, min(max_cards, ABSOLUTE_MAX_CARDS))
    return requested


def expand_sentence_candidates(sentences: list[str], text: str, target_count: int) -> list[str]:
    """Add more source chunks when there are fewer sentences than requested cards."""
    candidates = []
    seen = set()

    def add_candidate(value: str) -> None:
        cleaned = value.strip()
        key = cleaned.lower()
        if len(cleaned) < 20 or key in seen:
            return
        seen.add(key)
        candidates.append(cleaned)

    for sentence in sentences:
        add_candidate(sentence)

    if len(candidates) >= target_count:
        return candidates

    for part in re.split(r'[;\n]+', text):
        add_candidate(part)
        if len(candidates) >= target_count:
            return candidates

    paragraphs = [part.strip() for part in re.split(r'\n\s*\n+', text) if part.strip()]
    for paragraph in paragraphs:
        add_candidate(paragraph)
        if len(candidates) >= target_count:
            return candidates

    words = text.split()
    if len(words) > 40:
        chunk_size = max(25, len(words) // max(target_count, 1))
        for index in range(0, len(words), chunk_size):
            add_candidate(' '.join(words[index:index + chunk_size]))
            if len(candidates) >= target_count:
                break

    return candidates


def _try_add_card(
    flashcards: list[dict],
    seen_questions: set,
    seen_answers: set,
    sentence: str,
    keywords: list[str],
) -> bool:
    pair = build_flashcard_pair(sentence, keywords)
    if not pair:
        return False

    question, answer = pair
    question_key = question.lower().strip()
    answer_key = answer.lower().strip()

    if question_key in seen_questions or answer_key in seen_answers:
        return False

    seen_questions.add(question_key)
    seen_answers.add(answer_key)
    flashcards.append({'question': question, 'answer': answer})
    return True


def generate_flashcards(text: str, max_cards: int = DEFAULT_MAX_CARDS) -> list[dict]:
    """Full NLP pipeline: clean -> keywords -> rank -> question -> answer."""
    cleaned = clean_text(text)
    if len(cleaned) < 50:
        return []

    sentences = split_sentences(cleaned)
    if not sentences:
        return []

    target_count = determine_card_count(len(sentences), max_cards)
    candidates = expand_sentence_candidates(sentences, cleaned, target_count)

    keywords = extract_keywords(cleaned, sentences)
    ranked = rank_sentences(candidates, keywords, top_n=max(len(candidates), target_count * 2))
    ranked = sorted(
        ranked,
        key=lambda item: (item[1], min(len(item[0].split()) / 15, 1.0)),
        reverse=True,
    )

    flashcards = []
    seen_questions = set()
    seen_answers = set()

    passes = (
        {'min_score': 0.25, 'min_words': 8},
        {'min_score': 0.1, 'min_words': 5},
        {'min_score': 0.0, 'min_words': 4},
    )

    for rules in passes:
        if len(flashcards) >= target_count:
            break

        for sentence, score in ranked:
            if len(flashcards) >= target_count:
                break
            if score < rules['min_score'] and len(flashcards) >= 1:
                continue
            if len(sentence.split()) < rules['min_words'] and len(flashcards) >= 1:
                continue

            _try_add_card(flashcards, seen_questions, seen_answers, sentence, keywords)

    return flashcards[:target_count]


def is_topic_input(text: str) -> bool:
    cleaned = clean_text(text)
    if not cleaned:
        return False
    if len(cleaned) > TOPIC_MODE_MAX_LENGTH:
        return False
    sentence_count = len(split_sentences(cleaned))
    return sentence_count <= 2


def generate_flashcards_from_input(text: str, max_cards: int = DEFAULT_MAX_CARDS, topic: str = "") -> list[dict]:
    """Generate flashcards from study notes or a short topic."""
    topic_value = clean_text(topic)
    source = topic_value or clean_text(text)

    if topic_value or is_topic_input(text):
        cards = generate_flashcards_from_topic(source, max_cards)
        if cards:
            return cards

        expanded = expand_topic_study_notes(source)
        return generate_flashcards(expanded, max_cards)

    return generate_flashcards(text, max_cards)
