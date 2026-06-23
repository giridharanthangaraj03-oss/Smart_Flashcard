def _clean_topic(topic: str) -> str:
    return " ".join(topic.strip().split())


def expand_topic_study_notes(topic: str) -> str:
    """Expand a short topic into study notes for the standard NLP pipeline."""
    topic = _clean_topic(topic)
    if not topic:
        return ""

    paragraphs = [
        f"{topic} is an important topic that students need to understand clearly for exams and practical learning.",
        f"The key concepts in {topic} include definitions, core principles, examples, and how ideas connect together.",
        f"To study {topic} effectively, start with basic terminology and build up to more advanced ideas step by step.",
        f"Understanding {topic} helps students explain concepts, solve problems, and answer common exam questions confidently.",
        f"Important areas in {topic} cover introduction, fundamental rules, applications, examples, and revision points.",
        f"Students learning {topic} should practice definitions, worked examples, short notes, and self-check questions.",
        f"Real-world applications of {topic} make the subject easier to remember and more meaningful during revision.",
        f"A complete review of {topic} includes summary notes, flashcards, practice questions, and final revision before exams.",
    ]
    return "\n\n".join(paragraphs)


def generate_flashcards_from_topic(topic: str, max_cards: int = 8) -> list[dict]:
    """Generate structured flashcards directly from a topic name."""
    topic = _clean_topic(topic)
    if len(topic) < 2:
        return []

    templates = [
        (
            f"Develop a deep conceptual framework for {topic} — what foundational principles organize this field, and how do they interrelate?",
            f"{topic} is built on core principles, definitions, and relationships that students must understand conceptually, not just memorize.",
        ),
        (
            f"Analyze how the central theories of {topic} explain observed phenomena — what assumptions do they make, and where do their limits lie?",
            f"The main concepts in {topic} include foundational terms, core principles, relationships, and examples that form a coherent theoretical structure.",
        ),
        (
            f"Evaluate why the key terminology of {topic} is conceptually loaded — how does precise language shape deeper understanding in this subject?",
            f"Essential vocabulary in {topic} encodes underlying ideas; mastering definitions requires understanding the concepts they represent.",
        ),
        (
            f"Critically assess the governing principles of {topic} — how do they constrain possible outcomes, and what reasoning justifies each principle?",
            f"Core principles in {topic} explain how ideas connect, why certain results follow, and how different parts of the topic form a unified framework.",
        ),
        (
            f"Transfer the conceptual knowledge of {topic} to an unfamiliar problem — what reasoning strategy would you use, and why?",
            f"{topic} applies to practical and theoretical problems when students understand mechanisms and principles rather than surface facts alone.",
        ),
        (
            f"Deconstruct a complex example from {topic} step by step — what conceptual layers must be understood at each stage?",
            f"Worked examples in {topic} reveal how principles combine; analyzing them builds the reasoning skills needed for advanced questions.",
        ),
        (
            f"What conceptual misconceptions are common in {topic}, and how would you diagnose and correct them using principled reasoning?",
            f"Students often confuse related ideas in {topic}; deep study requires distinguishing concepts and understanding why each distinction matters.",
        ),
        (
            f"Integrate {topic} with adjacent areas of study — what conceptual bridges exist, and how does this integration deepen mastery?",
            f"{topic} connects to related chapters and fields; mapping these links builds a network of understanding rather than isolated facts.",
        ),
        (
            f"Hypothesize how a change in one core factor of {topic} would propagate through the system — explain the chain of conceptual consequences.",
            f"Understanding {topic} at depth means predicting how changes in variables or conditions affect outcomes through underlying mechanisms.",
        ),
        (
            f"Synthesize the entire conceptual landscape of {topic} — how would you explain its essence to someone who already knows the basics but seeks deeper insight?",
            f"A deep synthesis of {topic} integrates definitions, principles, mechanisms, applications, and connections into a coherent mental model.",
        ),
    ]

    limit = max(1, min(max_cards, 15))
    return [{"question": q, "answer": a} for q, a in templates[:limit]]
