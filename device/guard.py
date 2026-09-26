"""Deterministic guardrails. These always override the decision model."""
import re

PII_PATTERNS = {
    "phone": re.compile(r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)"),
    "email": re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    "aadhaar": re.compile(r"(?<!\d)\d{4}\s?\d{4}\s?\d{4}(?!\d)"),
}


def find_pii(text: str) -> list[str]:
    """Names of the PII kinds found in text (empty list if none)."""
    return [kind for kind, rx in PII_PATTERNS.items() if rx.search(text)]


def apply(decision: dict, text: str, duplicate_of: str | None = None) -> dict:
    """Return the final decision after hard rules. Keeps the model's proposal for the log."""
    d = dict(decision, proposed=decision["residency"], override=None)
    pii = find_pii(text)
    if pii:
        d.update(residency="private", override=f"PII regex matched: {', '.join(pii)}")
    elif d["residency"] == "sync" and duplicate_of:
        d.update(residency="drop", override=f"duplicate of fleet memory {duplicate_of}")
    return d
