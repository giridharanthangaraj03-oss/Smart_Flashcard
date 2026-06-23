import re


def clean_text(text: str) -> str:
    """Step 1: Clean and normalize text."""
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s.,;:!?\'\"()-]', '', text)
    return text


def split_sentences(text: str) -> list[str]:
    """Split text into sentences using regex boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]
