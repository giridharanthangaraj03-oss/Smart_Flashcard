import re

from .settings import is_lightweight_mode

_model = None
_tokenizer = None
_t5_available = None

DEFINITION_PATTERN = re.compile(
    r'^(?P<subject>.+?)\s+(?P<verb>is|are|was|were|means|refers to|defined as)\s+(?P<definition>.+)$',
    re.IGNORECASE,
)

PROCESS_PATTERN = re.compile(
    r'^(?P<process>.+?)\s+(?P<verb>is the process (?:by which|of|in which)|is a process (?:by which|of|in which))\s+(?P<detail>.+)$',
    re.IGNORECASE,
)

PASSIVE_PATTERN = re.compile(
    r'^(?P<subject>.+?)\s+is\s+(?P<action>released|produced|formed|created|generated|stored|used)\s+(?P<detail>.+)$',
    re.IGNORECASE,
)

SIMPLE_QUESTION_PATTERNS = (
    re.compile(r'^what is\b', re.I),
    re.compile(r'^what are\b', re.I),
    re.compile(r'^who is\b', re.I),
    re.compile(r'^define\b', re.I),
    re.compile(r'^name\b', re.I),
    re.compile(r'^list\b', re.I),
    re.compile(r'^state\b', re.I),
    re.compile(r'^give\b', re.I),
)

DEEP_QUESTION_MARKERS = (
    'analyze', 'analyse', 'explain', 'evaluate', 'critically', 'mechanism',
    'underlying', 'significance', 'implications', 'conceptual', 'principle',
    'reasoning', 'justify', 'synthesize', 'synthesise', 'compare', 'contrast',
    'relationship', 'influence', 'consequences', 'interconnect', 'depth',
    'framework', 'hypothesize', 'hypothesise', 'predict', 'differentiate',
    'integrate', 'interpret', 'assess', 'examine', 'deconstruct',
)

ACTION_VERBS = (
    'absorbs', 'absorb', 'produces', 'produce', 'releases', 'release',
    'converts', 'convert', 'forms', 'form', 'creates', 'create',
    'stores', 'store', 'uses', 'use', 'helps', 'help', 'contains', 'contain',
)

CAUSAL_MARKERS = ('because', 'therefore', 'thus', 'hence', 'as a result', 'consequently', 'leads to', 'results in')
COMPARISON_MARKERS = ('whereas', 'however', 'unlike', 'compared to', 'in contrast', 'while', 'although')
MECHANISM_MARKERS = ('through', 'via', 'by means of', 'mechanism', 'pathway', 'cycle', 'phase', 'step', 'stage')


def _normalize(text: str) -> str:
    return re.sub(r'\s+', ' ', text.strip().lower().rstrip('.'))


def _clean_sentence(sentence: str) -> str:
    return sentence.strip().rstrip('.')


def _capitalize_answer(answer: str) -> str:
    answer = answer.strip()
    if not answer:
        return answer
    return answer[0].upper() + answer[1:]


def _is_simple_question(question: str) -> bool:
    normalized = _normalize(question)
    if any(pattern.search(normalized) for pattern in SIMPLE_QUESTION_PATTERNS):
        return True
    words = normalized.split()
    if len(words) < 10:
        return True
    if not any(marker in normalized for marker in DEEP_QUESTION_MARKERS):
        return True
    return False


def _is_deep_question(question: str) -> bool:
    return not _is_simple_question(question)


def _check_t5_available():
    global _t5_available
    if is_lightweight_mode():
        _t5_available = False
        return False

    if _t5_available is not None:
        return _t5_available

    try:
        import sentencepiece  # noqa: F401
        from transformers import T5ForConditionalGeneration, T5Tokenizer

        _t5_available = True
        return True
    except ImportError as error:
        print(f"T5 unavailable, using fallback question generation: {error}")
        _t5_available = False
        return False


def get_t5():
    global _model, _tokenizer

    if not _check_t5_available():
        return None, None

    if _model is None:
        from transformers import T5ForConditionalGeneration, T5Tokenizer

        _tokenizer = T5Tokenizer.from_pretrained('t5-small')
        _model = T5ForConditionalGeneration.from_pretrained('t5-small')

    return _model, _tokenizer


def _extract_subject(sentence: str) -> str | None:
    words = _clean_sentence(sentence).split()
    if len(words) < 2:
        return None

    subject_words = []
    for word in words[:5]:
        clean_word = re.sub(r'[^\w-]', '', word)
        if not clean_word:
            continue
        if clean_word.lower() in ACTION_VERBS:
            break
        subject_words.append(clean_word)

    if not subject_words:
        return None

    subject = ' '.join(subject_words).strip(' "\'')
    return subject if len(subject) > 2 else None


def _extract_core_concept(sentence: str, keywords: list[str]) -> str:
    ranked_keywords = sorted(keywords, key=len, reverse=True)
    sentence_lower = sentence.lower()

    for keyword in ranked_keywords:
        keyword_clean = keyword.strip().lower()
        if len(keyword_clean) >= 4 and keyword_clean in sentence_lower:
            return keyword_clean

    subject = _extract_subject(sentence)
    if subject:
        return subject.lower()

    words = [re.sub(r'[^\w-]', '', word) for word in sentence.split()]
    meaningful = [word for word in words if len(word) >= 5]
    return meaningful[0].lower() if meaningful else 'this concept'


def _build_definition_pair(sentence: str, keywords: list[str]) -> tuple[str, str] | None:
    match = DEFINITION_PATTERN.match(_clean_sentence(sentence))
    if not match:
        return None

    subject = match.group('subject').strip(' "\'')
    definition = match.group('definition').strip()
    if len(subject) < 3 or len(definition) < 10:
        return None

    question = f"What is {subject.strip()}?"
    answer = _capitalize_answer(definition)
    if not answer.endswith('.'):
        answer += '.'
    return question, answer


def _build_process_pair(sentence: str, keywords: list[str]) -> tuple[str, str] | None:
    match = PROCESS_PATTERN.match(_clean_sentence(sentence))
    if not match:
        return None

    process = match.group('process').strip(' "\'')
    detail = match.group('detail').strip()
    if len(process) < 3 or len(detail) < 10:
        return None

    question = f"How does {process.strip()} work?"
    answer = _capitalize_answer(f"{process.strip()} is the process by which {detail.rstrip('.')}.")
    if not answer.endswith('.'):
        answer += '.'
    return question, answer


def _extract_comparison_terms(sentence: str) -> tuple[str, str] | None:
    clean = _clean_sentence(sentence)
    lower = clean.lower()

    if ' versus ' in lower:
        parts = re.split(r'\s+versus\s+', clean, maxsplit=1)
    elif ' compared to ' in lower:
        parts = re.split(r'\s+compared to\s+', clean, maxsplit=1)
    elif ' unlike ' in lower:
        parts = re.split(r'\s+unlike\s+', clean, maxsplit=1)
    elif ' whereas ' in lower:
        parts = re.split(r'\s+whereas\s+', clean, maxsplit=1)
    else:
        parts = re.split(r'\s+and\s+|\s+or\s+', clean, maxsplit=1)

    if len(parts) != 2:
        return None

    left = parts[0].strip(' .,')
    right = parts[1].strip(' .,')
    if len(left.split()) < 1 or len(right.split()) < 1:
        return None

    return left, right


def _build_comparison_pair(sentence: str, keywords: list[str]) -> tuple[str, str] | None:
    sentence_clean = _clean_sentence(sentence)
    if not any(marker in sentence_clean.lower() for marker in COMPARISON_MARKERS):
        return None

    terms = _extract_comparison_terms(sentence_clean)
    if not terms:
        return None

    left, right = terms
    question = f"What are the differences between {left} and {right}?"
    answer = _capitalize_answer(sentence_clean)
    if not answer.endswith('.'):
        answer += '.'
    return question, answer


def _fallback_question(sentence: str, keywords: list[str]) -> str:
    sentence_clean = _clean_sentence(sentence)
    concept = _extract_core_concept(sentence_clean, keywords)
    return f"What is the key concept described by {concept}?"


def _is_valid_pair(question: str, answer: str) -> bool:
    if len(answer) < 10:
        return False

    normalized_question = _normalize(question)
    if normalized_question.startswith(('what is', 'how does', 'what are', 'why is', 'why does')):
        return len(normalized_question) >= 8

    if len(question) < 20 or not _is_deep_question(question):
        return False

    if _normalize(question) == _normalize(answer):
        return False

    question_words = set(re.findall(r'\b[a-z]{3,}\b', _normalize(question)))
    answer_words = set(re.findall(r'\b[a-z]{3,}\b', _normalize(answer)))
    if question_words and answer_words:
        overlap = len(question_words & answer_words) / max(len(question_words), 1)
        if overlap > 0.85 and len(answer_words) <= len(question_words) + 2:
            return False

    return True


def _generate_t5_question(sentence: str) -> str | None:
    model, tokenizer = get_t5()
    if model is None or tokenizer is None:
        return None

    try:
        prompt = f"generate deep conceptual exam question: {sentence}"
        inputs = tokenizer.encode(prompt, return_tensors='pt', max_length=512, truncation=True)
        outputs = model.generate(inputs, max_length=80, num_beams=5, early_stopping=True)
        question = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        if not question.endswith('?'):
            question = question.rstrip('.') + '?'

        if len(question) < 15 or _normalize(question) == _normalize(sentence):
            return None

        if not _is_deep_question(question):
            return None

        return question
    except Exception as error:
        print(f"T5 generation failed: {error}")
        return None


def _is_valid_pair(question: str, answer: str) -> bool:
    if len(question) < 20 or len(answer) < 10:
        return False

    if not _is_deep_question(question):
        return False

    if _normalize(question) == _normalize(answer):
        return False

    question_words = set(re.findall(r'\b[a-z]{3,}\b', _normalize(question)))
    answer_words = set(re.findall(r'\b[a-z]{3,}\b', _normalize(answer)))
    if question_words and answer_words:
        overlap = len(question_words & answer_words) / max(len(question_words), 1)
        if overlap > 0.85 and len(answer_words) <= len(question_words) + 2:
            return False

    return True


def build_flashcard_pair(sentence: str, keywords: list[str]) -> tuple[str, str] | None:
    """Create a deep conceptual question/answer pair."""
    builders = (
        _build_causal_pair,
        _build_comparison_pair,
        _build_mechanism_pair,
        _build_application_pair,
        _build_process_pair,
        _build_definition_pair,
        _build_passive_pair,
        _build_action_pair,
        _build_synthesis_pair,
        _build_keyword_pair,
    )

    for builder in builders:
        pair = builder(sentence, keywords)
        if pair and _is_valid_pair(*pair):
            return pair

    sentence_clean = _clean_sentence(sentence)
    t5_question = _generate_t5_question(sentence_clean)
    question = t5_question or _fallback_question(sentence_clean, keywords)
    answer = _capitalize_answer(sentence_clean)
    if not answer.endswith('.'):
        answer += '.'

    if not _is_valid_pair(question, answer):
        return None

    return question, answer


def generate_question(sentence: str) -> str:
    pair = build_flashcard_pair(sentence, [])
    return pair[0] if pair else _fallback_question(sentence, [])


def extract_answer(sentence: str, keywords: list[str]) -> str:
    pair = build_flashcard_pair(sentence, keywords)
    if pair:
        return pair[1]

    sentence_clean = _clean_sentence(sentence)
    answer = _capitalize_answer(sentence_clean)
    return answer if answer.endswith('.') else f"{answer}."
