"""Deterministic, explainable eligibility engine.

Each scheme carries a machine-readable `rules` dict. Supported keys:

    min_age / max_age      int
    max_income              int (annual household income, INR)
    gender                  "female" | "male"
    categories               list of allowed categories e.g. ["sc","st"]
    occupations               list e.g. ["farmer"], ["student"], ["street-vendor"]
    area                     "rural" | "urban"
    disability                True (must be a person with disability)
    minority                   True (must belong to a notified minority)

For every rule we return met / not_met / unknown so the frontend can show
exactly WHY a scheme matched or did not. Verdicts:
    eligible      every defined rule is met
    likely        no rule failed, but some could not be checked (missing profile info)
    not_eligible  at least one rule failed

Criterion labels are generated bilingually (English / Hindi) based on profile.lang,
so the same deterministic logic powers both language experiences.
"""
from typing import List, Tuple
from .schemas import Profile, CriterionResult


def _label(lang: str, key: str, **kw) -> str:
    hi = lang == "hi"
    if key == "age":
        lo, hi_v = kw.get("lo"), kw.get("hi")
        if hi:
            return f"आयु {lo or 'कोई भी'} से {hi_v or 'कोई भी'} वर्ष के बीच"
        return f"Age {lo or 'any'} to {hi_v or 'any'} years"
    if key == "income":
        cap = kw["cap"]
        return f"वार्षिक पारिवारिक आय ₹{cap:,} से कम या बराबर" if hi else f"Annual household income at or below ₹{cap:,}"
    if key == "gender":
        g = kw["g"]
        g_hi = {"female": "महिला", "male": "पुरुष", "other": "अन्य"}.get(g, g)
        return f"आवेदक {g_hi} होना चाहिए" if hi else f"Applicant must be {g}"
    if key == "categories":
        cats = kw["cats"]
        return "श्रेणी: " + "/".join(c.upper() for c in cats) if hi else "Category: " + "/".join(c.upper() for c in cats)
    if key == "occupations":
        occs = kw["occs"]
        occ_hi_map = {"farmer": "किसान", "student": "छात्र", "self-employed": "स्वरोजगार", "salaried": "वेतनभोगी",
                      "unemployed": "बेरोज़गार", "artisan": "कारीगर", "street-vendor": "रेहड़ी-पटरी विक्रेता", "other": "अन्य"}
        if hi:
            return "व्यवसाय: " + "/".join(occ_hi_map.get(o, o) for o in occs)
        return "Occupation: " + "/".join(occs)
    if key == "area":
        a = kw["a"]
        a_hi = "ग्रामीण" if a == "rural" else "शहरी"
        return f"{a_hi} क्षेत्र का निवासी होना चाहिए" if hi else f"Resident of a {a} area"
    if key == "disability":
        return "दिव्यांग व्यक्ति" if hi else "Person with disability"
    if key == "minority":
        return "अधिसूचित अल्पसंख्यक समुदाय से संबंधित" if hi else "Belongs to a notified minority community"
    return key


def _check(rules: dict, profile: Profile) -> List[CriterionResult]:
    lang = (profile.lang or "en").lower()
    out: List[CriterionResult] = []

    def add(label: str, ok):
        out.append(CriterionResult(label=label, status="unknown" if ok is None else ("met" if ok else "not_met")))

    if "min_age" in rules or "max_age" in rules:
        lo, hiv = rules.get("min_age"), rules.get("max_age")
        label = _label(lang, "age", lo=lo, hi=hiv)
        if profile.age is None:
            add(label, None)
        else:
            add(label, (lo is None or profile.age >= lo) and (hiv is None or profile.age <= hiv))

    if "max_income" in rules:
        cap = rules["max_income"]
        label = _label(lang, "income", cap=cap)
        add(label, None if profile.annual_income is None else profile.annual_income <= cap)

    if "gender" in rules:
        g = rules["gender"]
        label = _label(lang, "gender", g=g)
        add(label, None if not profile.gender else profile.gender.lower() == g)

    if "categories" in rules:
        cats = [c.lower() for c in rules["categories"]]
        label = _label(lang, "categories", cats=cats)
        add(label, None if not profile.category else profile.category.lower() in cats)

    if "occupations" in rules:
        occs = [o.lower() for o in rules["occupations"]]
        label = _label(lang, "occupations", occs=occs)
        add(label, None if not profile.occupation else profile.occupation.lower() in occs)

    if "area" in rules:
        label = _label(lang, "area", a=rules["area"])
        add(label, None if not profile.area else profile.area.lower() == rules["area"])

    if rules.get("disability"):
        add(_label(lang, "disability"), profile.disability if profile.disability is not None else None)

    if rules.get("minority"):
        add(_label(lang, "minority"), profile.minority if profile.minority is not None else None)

    return out


def evaluate(rules: dict, profile: Profile) -> Tuple[str, float, List[CriterionResult]]:
    criteria = _check(rules or {}, profile)
    if not criteria:  # scheme with no machine rules: cannot fail, cannot confirm
        return "likely", 0.5, criteria
    met = sum(1 for c in criteria if c.status == "met")
    failed = any(c.status == "not_met" for c in criteria)
    unknown = any(c.status == "unknown" for c in criteria)
    score = met / len(criteria)
    if failed:
        return "not_eligible", score, criteria
    if unknown:
        return "likely", score, criteria
    return "eligible", 1.0, criteria
