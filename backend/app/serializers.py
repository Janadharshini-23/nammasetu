from .schemas import SchemeOut
from .document_help import build_document_help


def scheme_to_out(scheme, lang: str = "en") -> SchemeOut:
    hi = (lang or "en").lower() == "hi"
    name = (scheme.name_hi if hi and scheme.name_hi else scheme.name)
    summary = (scheme.summary_hi if hi and scheme.summary_hi else scheme.summary)
    benefits = (scheme.benefits_hi if hi and scheme.benefits_hi else scheme.benefits)
    eligibility_text = (scheme.eligibility_text_hi if hi and scheme.eligibility_text_hi else scheme.eligibility_text)
    documents_en = scheme.documents or []
    documents_display = (scheme.documents_hi if hi and scheme.documents_hi else scheme.documents) or []

    return SchemeOut(
        id=scheme.id,
        slug=scheme.slug,
        name=name,
        ministry=scheme.ministry,
        level=scheme.level,
        tags=scheme.tags or [],
        summary=summary,
        benefits=benefits,
        eligibility_text=eligibility_text,
        documents=documents_display,
        document_help=build_document_help(documents_en, documents_display, lang or "en"),
        apply_url=scheme.apply_url,
    )
