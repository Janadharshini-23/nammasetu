"""AI assistant endpoint.

Grounded generation: we retrieve the most relevant schemes from the database
(keyword scoring over name/summary/tags) and pass ONLY that context to an
OpenAI-compatible LLM. If no LLM is configured via env vars, the endpoint
degrades gracefully to retrieval-only answers, so the app works offline.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Scheme
from ..schemas import ChatIn, ChatOut
from ..serializers import scheme_to_out
from .. import llm

router = APIRouter(prefix="/api/chat", tags=["chat"])

STOPWORDS = {"the", "a", "an", "for", "of", "in", "to", "is", "am", "i", "my", "me", "and", "or", "what", "which", "can", "get", "how", "do"}


def retrieve(db: Session, text: str, k: int = 4):
    words = [w.strip("?.,!").lower() for w in text.split() if len(w) > 2 and w.lower() not in STOPWORDS]
    scored = []
    for s in db.query(Scheme).all():
        hay = " ".join([s.name or "", s.summary or "", s.benefits or "", s.eligibility_text or "", " ".join(s.tags or [])]).lower()
        score = sum(hay.count(w) for w in words)
        if score > 0:
            scored.append((score, s))
    scored.sort(key=lambda t: -t[0])
    return [s for _, s in scored[:k]]


@router.post("", response_model=ChatOut)
async def chat(body: ChatIn, db: Session = Depends(get_db)):
    last_user = next((m["content"] for m in reversed(body.messages) if m.get("role") == "user"), "")
    matches = retrieve(db, last_user)
    lang = (body.lang or "en").lower()

    if llm.configured():
        context = "\n\n".join(
            f"SCHEME: {s.name} ({s.name_hi})\nSUMMARY: {s.summary}\nBENEFITS: {s.benefits}\nELIGIBILITY: {s.eligibility_text}\nAPPLY: {s.apply_url}"
            for s in matches
        ) or "No matching schemes found in the database."
        profile = body.profile.model_dump(exclude_none=True) if body.profile else {}
        lang_instruction = "Respond in simple, everyday Hindi (Devanagari script)." if lang == "hi" else "Respond in simple, everyday English."
        system = (
            "You are SchemeSetu, an assistant that helps people in India, including people with little "
            "formal education or technology experience, discover government schemes. "
            "Answer ONLY using the scheme context provided below. If the context does not contain the answer, "
            "say so and suggest using the eligibility checker. Use short sentences and plain words, avoid jargon. "
            "Write in PLAIN TEXT ONLY: no markdown, no asterisks, no bullet symbols, no numbered-list symbols, "
            "no bold, no headings, and never wrap links in angle brackets or square brackets, just write the bare "
            "URL as plain text. Use line breaks between schemes instead of bullets or numbers. "
            f"{lang_instruction} Always remind the person to verify details on the official portal before applying.\n\n"
            f"USER PROFILE (may be empty): {profile}\n\nSCHEME CONTEXT:\n{context}"
        )
        reply = await llm.complete(system, body.messages[-6:])
        if reply:
            return ChatOut(reply=reply, used_llm=True, schemes=[scheme_to_out(s, lang) for s in matches])

    if matches:
        if lang == "hi":
            lines = [f"{s.name_hi or s.name}: {s.benefits_hi or s.benefits}. आवेदन करें: {s.apply_url}" for s in matches]
            reply = ("आपके सवाल से जुड़ी योजनाएं यहां हैं.\n\n" + "\n\n".join(lines) +
                     "\n\nअपनी व्यक्तिगत सूची के लिए पात्रता जांचें. "
                     "(अभी एआई उत्तर बंद हैं क्योंकि सर्वर पर कोई एआई कुंजी सेट नहीं है.)")
        else:
            lines = [f"{s.name}: {s.benefits} Apply at {s.apply_url}" for s in matches]
            reply = ("Here are schemes related to your question.\n\n" + "\n\n".join(lines) +
                     "\n\nFor a personalised list, run the eligibility checker. "
                     "(AI answers are off right now because no LLM API key is set on the server.)")
    else:
        reply = ("मुझे इससे मेल खाती कोई योजना नहीं मिली. व्यक्तिगत सूची के लिए पात्रता जांच का उपयोग करें, या सभी योजनाएं देखें."
                 if lang == "hi" else
                 "I could not find schemes matching that. Try the eligibility checker for a personalised list, "
                 "or browse all schemes.")
    return ChatOut(reply=reply, used_llm=False, schemes=[scheme_to_out(s, lang) for s in matches])
