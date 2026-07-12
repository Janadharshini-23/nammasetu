from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Scheme
from ..schemas import Profile, EligibilityOut, MatchResult, SmartCheckOut
from ..eligibility import evaluate
from ..serializers import scheme_to_out
from .. import llm

router = APIRouter(prefix="/api/eligibility", tags=["eligibility"])


def _match_all(db: Session, profile: Profile):
    eligible, likely, rejected = [], [], 0
    lang = profile.lang or "en"
    for scheme in db.query(Scheme).all():
        verdict, score, criteria = evaluate(scheme.rules or {}, profile)
        result = MatchResult(scheme=scheme_to_out(scheme, lang), verdict=verdict, score=score, criteria=criteria)
        if verdict == "eligible":
            eligible.append(result)
        elif verdict == "likely":
            likely.append(result)
        else:
            rejected += 1
    eligible.sort(key=lambda r: -r.score)
    likely.sort(key=lambda r: -r.score)
    return eligible, likely, rejected


@router.post("/check", response_model=EligibilityOut)
def check(profile: Profile, db: Session = Depends(get_db)):
    eligible, likely, rejected = _match_all(db, profile)
    return EligibilityOut(eligible=eligible, likely=likely, not_eligible_count=rejected)


def _template_narrative(profile: Profile, eligible, likely) -> str:
    lang = (profile.lang or "en").lower()
    top = eligible[:5] or likely[:5]
    if lang == "hi":
        if not top:
            return ("आपने जो जानकारी दी है, उसके आधार पर अभी कोई पक्की योजना नहीं मिली। "
                     "ऊपर और जानकारी भरें, जैसे आय, व्यवसाय और श्रेणी, ताकि बेहतर परिणाम मिल सकें।")
        lines = [f"{r.scheme.name}: {r.scheme.benefits}" for r in top]
        return (f"आपकी जानकारी के अनुसार, आप कुल {len(eligible)} योजनाओं के लिए पात्र दिख रहे हैं "
                f"और {len(likely)} योजनाएं संभावित हैं। आपके लिए सबसे उपयोगी योजनाएं:\n\n" +
                "\n".join(lines) +
                "\n\nहर योजना पर क्लिक करके ज़रूरी दस्तावेज़ और आवेदन करने का तरीका देखें। "
                "आवेदन से पहले आधिकारिक पोर्टल पर विवरण ज़रूर जांच लें।")
    if not top:
        return ("Based on what you shared, no confirmed matches came up yet. "
                 "Fill in more details above, like income, occupation and category, for better results.")
    lines = [f"{r.scheme.name}: {r.scheme.benefits}" for r in top]
    return (f"Based on your profile, you look eligible for {len(eligible)} schemes, with {len(likely)} more "
             f"likely matches. The most useful ones for you:\n\n" +
             "\n".join(lines) +
             "\n\nOpen any scheme to see the exact documents you need and how to apply. "
             "Always verify details on the official portal before applying.")


@router.post("/smart-check", response_model=SmartCheckOut)
async def smart_check(profile: Profile, db: Session = Depends(get_db)):
    """Profile in, personalised plain-language report out: the deterministic rule
    engine decides WHAT you are eligible for (so nothing is invented), and either
    an LLM or a local template explains it back in a warm, conversational way,
    similar to describing your situation to an assistant and getting a tailored
    answer, in your chosen language.
    """
    eligible, likely, rejected = _match_all(db, profile)
    lang = (profile.lang or "en").lower()
    used_llm = False
    narrative = None

    if llm.configured() and (eligible or likely):
        top = (eligible + likely)[:6]
        context = "\n".join(
            f"- {r.scheme.name}: {r.scheme.benefits}. Eligibility: {r.scheme.eligibility_text}. Apply: {r.scheme.apply_url}"
            for r in top
        )
        lang_instruction = "Reply in simple, everyday Hindi (Devanagari script)." if lang == "hi" else "Reply in simple, everyday English."
        system = (
            "You are SchemeSetu. A person shared their profile and a rule engine already determined which "
            "government schemes they qualify for, listed below. Write a warm, encouraging, plain-language summary "
            "explaining what they qualify for and why it matters to them personally, using SHORT sentences. "
            "Do not invent any scheme or detail not listed below. End by telling them to open each scheme for the "
            "document checklist. Write in PLAIN TEXT ONLY: no markdown, no asterisks, no bullet symbols, no "
            "numbered-list symbols, no bold, no headings, and never wrap links in angle brackets or square "
            "brackets, just write the bare URL as plain text if you mention one. Use line breaks between schemes "
            f"instead of bullets or numbers. {lang_instruction}\n\n"
            f"PROFILE: {profile.model_dump(exclude_none=True)}\n\nMATCHED SCHEMES:\n{context}"
        )
        reply = await llm.complete(system, [{"role": "user", "content": "Summarise my matches."}])
        if reply:
            narrative = reply
            used_llm = True

    if narrative is None:
        narrative = _template_narrative(profile, eligible, likely)

    return SmartCheckOut(narrative=narrative, used_llm=used_llm, eligible=eligible, likely=likely, not_eligible_count=rejected)
