import os


def is_lightweight_mode() -> bool:
    return os.getenv('NLP_LIGHTWEIGHT', 'false').strip().lower() in {'1', 'true', 'yes', 'on'}
