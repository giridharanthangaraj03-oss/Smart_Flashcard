import re


HEADING_PATTERNS = (
    re.compile(r'^(chapter|section|unit|part|module)\b', re.I),
    re.compile(r'^(table of contents|contents|index|references|bibliography|appendix)\b', re.I),
    re.compile(r'^[A-Z0-9][A-Z0-9\s\-\&,:;\'\"\.\(\)]+$'),
)

TOC_LINE_PATTERN = re.compile(r'\.{3,}|\s+\d+$')
PAGE_NUMBER_PATTERN = re.compile(r'^(page|p)\s*\d+(?:\s*/\s*\d+)?$', re.I)


def _remove_repeated_words(text: str) -> str:
    return re.sub(r'\b(\w+)(?:\s+\1\b)+', r'\1', text, flags=re.IGNORECASE)


def _looks_like_heading(line: str) -> bool:
    if len(line.split()) <= 1:
        return True
    if PAGE_NUMBER_PATTERN.match(line):
        return True
    if any(pattern.match(line) for pattern in HEADING_PATTERNS):
        return True
    if TOC_LINE_PATTERN.search(line) and len(line) < 80:
        return True
    if line.isupper() and len(line.split()) <= 10:
        return True
    if len(line.split()) <= 6 and line[0].isupper() and not line.endswith(('.', '?', '!')):
        return True
    return False


def _remove_repeated_sequences(text: str) -> str:
    words = text.split()
    result = []
    i = 0
    while i < len(words):
        matched = False
        for size in range(min(4, i), 0, -1):
            if words[i - size:i] == words[i:i + size]:
                i += size
                matched = True
                break
        if not matched:
            result.append(words[i])
            i += 1
    return ' '.join(result)


def clean_text(text: str) -> str:
    """Step 1: Clean and normalize text."""
    text = text.replace('\r\n', '\n').replace('\r', '\n').strip()
    lines = []
    for raw_line in text.split('\n'):
        line = raw_line.strip()
        if not line:
            continue
        if _looks_like_heading(line):
            continue
        line = re.sub(r'\[\d+\]', '', line)
        line = re.sub(r'\(\s*\d{4}\s*\)', '', line)
        line = re.sub(r'\s+', ' ', line)
        line = _remove_repeated_sequences(line)
        lines.append(line)

    cleaned = ' '.join(lines)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = _remove_repeated_sequences(cleaned)
    return cleaned.strip()


def split_sentences(text: str) -> list[str]:
    """Split text into sentences using regex boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]
