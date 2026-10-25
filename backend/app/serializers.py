from .schemas import SchemeOut
from .document_help import build_document_help


def scheme_to_out(scheme, lang: str = "en") -> SchemeOut:
    l = (lang or "en").lower()
    if l == "ta" and getattr(scheme, "name_ta", None):
        name = scheme.name_ta
        summary = scheme.summary_ta or scheme.summary
        benefits = scheme.benefits_ta or scheme.benefits
        eligibility_text = scheme.eligibility_text_ta or scheme.eligibility_text
        documents_display = scheme.documents_ta or scheme.documents or []
    elif l == "te" and getattr(scheme, "name_te", None):
        name = scheme.name_te
        summary = scheme.summary_te or scheme.summary
        benefits = scheme.benefits_te or scheme.benefits
        eligibility_text = scheme.eligibility_text_te or scheme.eligibility_text
        documents_display = scheme.documents_te or scheme.documents or []
    elif l == "hi" and getattr(scheme, "name_hi", None):
        name = scheme.name_hi
        summary = scheme.summary_hi or scheme.summary
        benefits = scheme.benefits_hi or scheme.benefits
        eligibility_text = scheme.eligibility_text_hi or scheme.eligibility_text
        documents_display = scheme.documents_hi or scheme.documents or []
    else:
        name = scheme.name
        summary = scheme.summary
        benefits = scheme.benefits
        eligibility_text = scheme.eligibility_text
        documents_display = scheme.documents or []

    documents_en = scheme.documents or []

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
        document_help=build_document_help(documents_en, documents_display, l),
        apply_url=scheme.apply_url,
    )
