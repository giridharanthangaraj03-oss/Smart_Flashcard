import random
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

ACTION_PATTERN = re.compile(
    r'^(?P<subject>.+?)\s+(?P<verb>absorbs|absorb|produces|produce|releases|release|converts|convert|forms|form|creates|create|stores|store|uses|use|helps|help|contains|contain)\s+(?P<object>.+)$',
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

PRONOUN_SUBJECTS = {'it', 'this', 'these', 'those', 'they', 'them', 'he', 'she', 'we', 'you', 'i', 'there'}

QUESTION_TEMPLATES = {
    'definition': [
        'What is {concept}?',
        'Define {concept}.',
        'Explain {concept}.',
        'Describe {concept}.',
        'What does {term} mean?',
        'State the definition of {term}.',
    ],
    'function': [
        'What does {concept} do?',
        'What is the function of {concept}?',
        'How does {concept} operate?',
        'How is {concept} used in practice?',
        'What role does {concept} play?',
        'How does {concept} perform its task?',
        'What does {concept} help accomplish?',
        'How does {concept} contribute to a system?',
        'What is the primary function of {concept}?',
        'How does {concept} work in context?',
        'What is the job of {concept}?',
        'In what way does {concept} function?',
        'What does {concept} enable?',
    ],
    'purpose': [
        'What is the purpose of {concept}?',
        'Why is {concept} important?',
        'Why is {concept} used?',
        'When should {concept} be used?',
        'Where is {concept} applied?',
        'What are the applications of {concept}?',
        'Where is {concept} used in real life?',
        'Give practical uses of {concept}.',
        'Why would someone choose {concept}?',
        'What makes {concept} useful?',
    ],
    'features': [
        'What are the features of {concept}?',
        'What are the characteristics of {concept}?',
        'What are the components of {concept}?',
        'What are the elements of {concept}?',
        'What are the parts of {concept}?',
        'Explain the architecture of {concept}.',
        'Describe the structure of {concept}.',
        'What modules make up {concept}?',
        'Explain the layers of {concept}.',
        'What is contained in {concept}?',
        'What are the building blocks of {concept}?',
        'Describe the internal structure of {concept}.',
    ],
    'advantages': [
        'What are the advantages of {concept}?',
        'What are the disadvantages of {concept}?',
        'List the benefits of {concept}.',
        'List the limitations of {concept}.',
        'What problems does {concept} solve?',
        'What is the significance of {concept}?',
        'Explain the relevance of {concept}.',
        'Why is {concept} valuable?',
    ],
    'examples': [
        'Give examples of {concept}.',
        'What is an example of {concept}?',
        'Describe use cases of {concept}.',
        'What are common uses of {concept}?',
        'How is {concept} applied?',
        'Explain real-world applications of {concept}.',
        'What is one practical use for {concept}?',
    ],
    'comparison': [
        'Differentiate between {conceptA} and {conceptB}.',
        'Compare {conceptA} and {conceptB}.',
        'How is {conceptA} different from {conceptB}?',
        'What are the similarities between {conceptA} and {conceptB}?',
        'Which is better: {conceptA} or {conceptB}?',
        'Explain the relationship between {conceptA} and {conceptB}.',
        'Distinguish {conceptA} from {conceptB}.',
    ],
    'process': [
        'Explain the working of {concept}.',
        'How does {concept} work?',
        'Describe the process of {concept}.',
        'What are the steps involved in {concept}?',
        'Explain the workflow of {concept}.',
        'How is {concept} implemented?',
        'What happens during {concept}?',
        'Describe the execution of {concept}.',
        'Explain the operation of {concept}.',
        'Outline the process of {concept}.',
    ],
    'history': [
        'Who developed {concept}?',
        'Who invented {concept}?',
        'When was {concept} introduced?',
        'What is the history of {concept}?',
        'What led to the development of {concept}?',
        'Why was {concept} created?',
        'What problem inspired {concept}?',
        'Describe the evolution of {concept}.',
        'What are the origins of {concept}?',
        'Explain the background of {concept}.',
    ],
    'formula': [
        'What is the formula for {concept}?',
        'State the equation of {concept}.',
        'Explain the formula of {concept}.',
        'What variables are used in {formula}?',
        'How is {formula} calculated?',
        'Describe the mathematical expression of {concept}.',
        'Explain the derivation of {formula}.',
        'What is the significance of {formula}?',
        'Apply {formula} to solve a problem.',
        'What does the formula represent?',
    ],
    'summary': [
        'What are the key points of {concept}?',
        'Summarize {concept}.',
        'What should be remembered about {concept}?',
        'What is the main idea of {concept}?',
        'State the core concept of {concept}.',
        'What is the central principle of {concept}?',
        'Explain the most important aspect of {concept}.',
        'What is the takeaway from {concept}?',
        'What is the essence of {concept}?',
        'What is the fundamental concept behind {concept}?',
    ],
}

USE_QUESTION_PATTERN = re.compile(
    r'^(?P<subject>[A-Za-z0-9\- ]+?)\s+(?:and|&)\s+(?P=subject)\s+(?:use|uses|using|used)\b',
    re.IGNORECASE,
)


def _format_template(template: str, context: dict[str, str]) -> str:
    try:
        return template.format(**context)
    except KeyError:
        return template


def _template_options(theme: str, context: dict[str, str], used_templates: set[str] | None = None) -> list[tuple[str, str]]:
    candidates = QUESTION_TEMPLATES.get(theme, [])
    if not candidates:
        return []

    if used_templates is None:
        return [(candidates[0], _format_template(candidates[0], context))]

    unused = [template for template in candidates if template not in used_templates]
    if not unused:
        unused = candidates.copy()

    random.shuffle(unused)
    return [(template, _format_template(template, context)) for template in unused]


def _choose_template(theme: str, context: dict[str, str], used_templates: set[str] | None = None) -> str:
    options = _template_options(theme, context, used_templates)
    return options[0][1] if options else ''


def _infer_question_theme(sentence: str) -> str:
    text = sentence.lower()
    if re.search(r'\b(absorb|produce|release|convert|store|use|help|contain|perform|operate|function|role|process|purpose|purpose of)\b', text):
        return 'function'
    if re.search(r'\b(formula|equation|calculate|derivation|variable|solve)\b', text):
        return 'formula'
    if re.search(r'\b(developed|invented|introduced|history|origin|evolution|background|created|originated)\b', text):
        return 'history'
    if re.search(r'\b(example|examples|use case|applications|applied|industries|real life|practical)\b', text):
        return 'examples'
    if re.search(r'\b(features|characteristics|components|elements|parts|architecture|structure|modules|layers|building blocks|internal structure)\b', text):
        return 'features'
    if re.search(r'\b(advantages|disadvantages|benefits|limitations|problems|solves|important|valuable|purpose|used|use|application|relevance|significance)\b', text):
        return 'advantages'
    if re.search(r'\b(how does|working|process|steps|workflow|operation|implement|happens|execution|describe|operation of)\b', text):
        return 'process'
    if re.search(r'\b(compare|differences|similarities|relationship|better|distinguish|vs\.?|versus)\b', text):
        return 'comparison'
    return 'definition'

ACTION_VERBS = (
    'absorbs', 'absorb', 'produces', 'produce', 'releases', 'release',
    'converts', 'convert', 'forms', 'form', 'creates', 'create',
    'stores', 'store', 'uses', 'use', 'helps', 'help', 'contains', 'contain',
)
LINKING_VERBS = {
    'is', 'are', 'was', 'were', 'be', 'being', 'been',
    'has', 'have', 'had', 'does', 'do', 'did',
    'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must',
}

CAUSAL_MARKERS = ('because', 'therefore', 'thus', 'hence', 'as a result', 'consequently', 'leads to', 'results in')
COMPARISON_MARKERS = ('whereas', 'however', 'unlike', 'compared to', 'in contrast', 'while', 'although')
MECHANISM_MARKERS = ('through', 'via', 'by means of', 'mechanism', 'pathway', 'cycle', 'phase', 'step', 'stage')


def _remove_repeated_words(text: str) -> str:
    return re.sub(r'\b(\w+)(?:\s+\1\b)+', r'\1', text, flags=re.IGNORECASE)


def _normalize(text: str) -> str:
    cleaned = re.sub(r'\s+', ' ', text.strip().lower().rstrip('.'))
    return _remove_repeated_words(cleaned)


def _clean_sentence(sentence: str) -> str:
    cleaned = sentence.strip().rstrip('.')
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return _remove_repeated_words(cleaned)


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
        if clean_word.lower() in ACTION_VERBS or clean_word.lower() in LINKING_VERBS:
            break
        subject_words.append(clean_word)

    if not subject_words:
        return None

    subject = ' '.join(subject_words).strip(' "\'')
    if subject.lower() in PRONOUN_SUBJECTS:
        return None
    return subject if len(subject) > 2 else None

def _extract_primary_concept(sentence: str, keywords: list[str]) -> str:
    sentence_clean = _clean_sentence(sentence)
    definition_match = DEFINITION_PATTERN.match(sentence_clean)
    if definition_match:
        subject = definition_match.group('subject').strip(' "\'')
        if len(subject) > 2 and subject.lower() not in PRONOUN_SUBJECTS:
            return subject

    subject = _extract_subject(sentence_clean)
    if subject and subject.lower() not in PRONOUN_SUBJECTS:
        return subject

    if keywords:
        return keywords[0]

    words = re.findall(r'\b[A-Za-z][A-Za-z0-9\-]{2,}\b', sentence_clean)
    return words[0] if words else 'this concept'

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
    if subject.lower() in PRONOUN_SUBJECTS:
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


def _to_base_verb(verb: str) -> str:
    base_forms = {
        'absorbs': 'absorb',
        'produces': 'produce',
        'releases': 'release',
        'converts': 'convert',
        'creates': 'create',
        'stores': 'store',
        'uses': 'use',
        'helps': 'help',
        'contains': 'contain',
        'has': 'have',
        'does': 'do',
        'is': 'be',
        'was': 'be',
        'were': 'be',
    }
    verb_lower = verb.lower()
    if verb_lower in base_forms:
        return base_forms[verb_lower]
    if verb_lower.endswith('ies'):
        return verb_lower[:-3] + 'y'
    if verb_lower.endswith('es'):
        return verb_lower[:-2]
    if verb_lower.endswith('s') and len(verb_lower) > 3:
        return verb_lower[:-1]
    return verb_lower


def _build_action_pair(sentence: str, keywords: list[str]) -> tuple[str, str] | None:
    match = ACTION_PATTERN.match(_clean_sentence(sentence))
    if not match:
        return None

    subject = match.group('subject').strip(' "\'')
    verb = match.group('verb').strip()
    obj = match.group('object').strip()
    if len(subject) < 2 or len(obj) < 3:
        return None

    base_verb = _to_base_verb(verb)
    question = f"What does {subject} {base_verb}?"
    answer = _capitalize_answer(f"{subject} {verb} {obj.rstrip('.')}." )
    if not answer.endswith('.'):
        answer += '.'
    return question, answer


def _build_use_pair(sentence: str, keywords: list[str]) -> tuple[str, str] | None:
    sentence_clean = _clean_sentence(sentence)
    match = USE_QUESTION_PATTERN.search(sentence_clean)
    if not match:
        return None

    subject = match.group('subject').strip(' "\'')
    if not subject:
        return None

    question = f"What is {subject} and what does {subject} use?"
    answer = _capitalize_answer(sentence_clean)
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
    use_phrase = ''
    if re.search(r'\b(use|uses|using|used)\b', sentence_clean, re.IGNORECASE):
        use_phrase = ' and what does it use'
    return f"What is the key concept described by {concept}{use_phrase}?"


def _format_answer(answer: str) -> str:
    answer = _capitalize_answer(answer)
    if not answer.endswith('.'):
        answer += '.'
    return answer


def _answer_from_question(question: str, sentence: str, keywords: list[str]) -> str:
    question_clean = _clean_sentence(question)
    sentence_clean = _clean_sentence(sentence)
    question_lower = question_clean.lower()

    what_match = re.match(r'^what (?:is|are) (.+)\?$', question_lower)
    if what_match:
        subject = what_match.group(1).strip()
        definition_match = DEFINITION_PATTERN.match(sentence_clean)
        if definition_match:
            return _format_answer(definition_match.group('definition').strip())
        sentence_lower = sentence_clean.lower()
        if subject and subject in sentence_lower:
            if ' is ' in sentence_lower:
                maybe_def = sentence_clean.split(' is ', 1)[1]
                return _format_answer(maybe_def)
        return _format_answer(sentence_clean)

    how_match = re.match(r'^how does (.+) work\?$', question_lower)
    if how_match:
        process = how_match.group(1).strip()
        process_match = PROCESS_PATTERN.match(sentence_clean)
        if process_match and process.lower() in process_match.group('process').lower():
            return _format_answer(
                f"{process_match.group('process').strip()} works by {process_match.group('detail').strip().rstrip('.')}."
            )
        return _format_answer(sentence_clean)

    diff_match = re.match(r'^what are the differences between (.+) and (.+)\?$', question_lower)
    if diff_match:
        if any(marker in sentence_clean.lower() for marker in COMPARISON_MARKERS):
            return _format_answer(sentence_clean)
        left = diff_match.group(1).strip().capitalize()
        right = diff_match.group(2).strip()
        return _format_answer(f"{left} and {right} differ in important ways based on the source material")

    if question_lower.startswith('why') or question_lower.startswith('how'):
        return _format_answer(sentence_clean)

    return _format_answer(sentence_clean)


def _is_valid_pair(question: str, answer: str) -> bool:
    if len(answer) < 10:
        return False

    normalized_question = _normalize(question)
    if normalized_question.startswith(('what is', 'how does', 'what are', 'what does', 'why is', 'why does')):
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


def build_flashcard_pair(sentence: str, keywords: list[str], used_templates: set[str] | None = None) -> tuple[str, str] | None:
    """Create a question/answer pair."""
    sentence_clean = _clean_sentence(sentence)
    concept = _extract_primary_concept(sentence_clean, keywords)
    builders = (
        (_build_use_pair, 'purpose'),
        (_build_comparison_pair, 'comparison'),
        (_build_process_pair, 'process'),
        (_build_action_pair, 'function'),
        (_build_definition_pair, 'definition'),
    )

    for builder, theme in builders:
        pair = builder(sentence, keywords)
        if pair and _is_valid_pair(*pair):
            if used_templates is not None:
                context = {'concept': concept, 'term': concept, 'formula': concept, 'conceptA': concept, 'conceptB': concept}
                for template, formatted in _template_options(theme, context, used_templates):
                    if not formatted:
                        continue
                    answer = pair[1]
                    if _is_valid_pair(formatted, answer):
                        used_templates.add(template)
                        return formatted, answer
            return pair

    template_question = _choose_template(
        _infer_question_theme(sentence_clean),
        {'concept': concept, 'term': concept, 'formula': concept, 'conceptA': concept, 'conceptB': concept},
        used_templates,
    )
    if template_question:
        answer = _answer_from_question(template_question, sentence_clean, keywords)
        if _is_valid_pair(template_question, answer):
            return template_question, answer

    t5_question = _generate_t5_question(sentence_clean)
    question = t5_question or _fallback_question(sentence_clean, keywords)
    answer = _answer_from_question(question, sentence_clean, keywords)

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
