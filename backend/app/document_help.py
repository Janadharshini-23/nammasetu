"""Practical, plain-language guidance on where to get each required document.

Matched by keyword against the scheme's document list rather than an exact
string map, so new document phrasings still get sensible guidance instead of
falling through to the generic fallback.
"""
from typing import List, Dict

CSC_LOCATOR = "https://findmycsc.nic.in/csc/"

RULES = [
    (["aadhaar"], {
        "en": "Visit your nearest Aadhaar Seva Kendra or bank branch, or apply online.",
        "hi": "अपने नज़दीकी आधार सेवा केंद्र या बैंक शाखा जाएं, या ऑनलाइन आवेदन करें।",
        "url": "https://uidai.gov.in",
    }),
    (["income certificate", "income proof"], {
        "en": "Apply at your local Tehsildar or SDM office, your state's e-District portal, or a Common Service Centre (CSC).",
        "hi": "अपने स्थानीय तहसीलदार या SDM कार्यालय, राज्य के ई-डिस्ट्रिक्ट पोर्टल, या नज़दीकी कॉमन सर्विस सेंटर (CSC) पर आवेदन करें।",
        "url": CSC_LOCATOR,
    }),
    (["bank account", "passbook"], {
        "en": "Open a savings account at any nearby bank branch or with a Bank Mitra (Business Correspondent). A Jan Dhan account needs zero balance.",
        "hi": "किसी भी नज़दीकी बैंक शाखा या बैंक मित्र के पास बचत खाता खोलें। जन धन खाते में शून्य बैलेंस की भी अनुमति है।",
        "url": "https://pmjdy.gov.in",
    }),
    (["caste certificate"], {
        "en": "Apply at your local Tehsildar or Revenue office, or your state's e-District portal.",
        "hi": "अपने स्थानीय तहसीलदार या राजस्व कार्यालय, या राज्य के ई-डिस्ट्रिक्ट पोर्टल पर आवेदन करें।",
        "url": CSC_LOCATOR,
    }),
    (["ration card"], {
        "en": "Apply through your state's Food & Civil Supplies Department, or visit the nearest ration office.",
        "hi": "अपने राज्य के खाद्य एवं नागरिक आपूर्ति विभाग के ज़रिए आवेदन करें, या नज़दीकी राशन कार्यालय जाएं।",
        "url": CSC_LOCATOR,
    }),
    (["land record", "land document", "land ownership", "tenancy"], {
        "en": "Check your state's land records portal (Bhulekh / Bhu-Naksha), or visit the local Patwari or Revenue office.",
        "hi": "अपने राज्य के भूलेख / भू-नक्शा पोर्टल पर देखें, या स्थानीय पटवारी या राजस्व कार्यालय जाएं।",
        "url": "https://bhuvan.nrsc.gov.in",
    }),
    (["disability certificate", "udid"], {
        "en": "Apply online at the UDID portal, or visit your nearest District Disability Rehabilitation Centre or government hospital.",
        "hi": "UDID पोर्टल पर ऑनलाइन आवेदन करें, या नज़दीकी जिला दिव्यांगता पुनर्वास केंद्र या सरकारी अस्पताल जाएं।",
        "url": "https://www.swavlambancard.gov.in",
    }),
    (["marksheet", "education certificate", "admission proof", "bonafide"], {
        "en": "Obtain this from your school or college's examination or admissions office.",
        "hi": "यह अपने स्कूल या कॉलेज के परीक्षा या प्रवेश कार्यालय से प्राप्त करें।",
        "url": None,
    }),
    (["electricity bill"], {
        "en": "Use your latest bill, or download it from your electricity provider's website or app.",
        "hi": "अपना नवीनतम बिल इस्तेमाल करें, या अपनी बिजली कंपनी की वेबसाइट या ऐप से डाउनलोड करें।",
        "url": None,
    }),
    (["photo"], {
        "en": "Get a passport-size photo taken at any local photo studio.",
        "hi": "किसी भी स्थानीय फोटो स्टूडियो से पासपोर्ट साइज़ फोटो खिंचवाएं।",
        "url": None,
    }),
    (["business plan", "quotation", "project report"], {
        "en": "Prepare this with help from your bank, District Industries Centre, or a Common Service Centre operator.",
        "hi": "अपने बैंक, जिला उद्योग केंद्र, या कॉमन सर्विस सेंटर संचालक की मदद से इसे तैयार करें।",
        "url": CSC_LOCATOR,
    }),
    (["mgnrega", "job card"], {
        "en": "Apply at your Gram Panchayat office.",
        "hi": "अपने ग्राम पंचायत कार्यालय में आवेदन करें।",
        "url": None,
    }),
    (["birth certificate"], {
        "en": "Available from your municipal corporation or Gram Panchayat's birth registration office.",
        "hi": "यह आपके नगर निगम या ग्राम पंचायत के जन्म पंजीकरण कार्यालय से मिलता है।",
        "url": None,
    }),
    (["secc", "survey reference", "vending"], {
        "en": "Ask your local municipal body or urban local body whether your name is listed; they can guide you to the right office.",
        "hi": "अपने स्थानीय नगर निकाय से पूछें कि क्या आपका नाम सूची में है; वे आपको सही कार्यालय बताएंगे।",
        "url": CSC_LOCATOR,
    }),
]

FALLBACK = {
    "en": "Visit your nearest Common Service Centre (CSC) or the concerned government office for guidance on this document.",
    "hi": "इस दस्तावेज़ के लिए अपने नज़दीकी कॉमन सर्विस सेंटर (CSC) या संबंधित सरकारी कार्यालय से मदद लें।",
    "url": CSC_LOCATOR,
}


def guide_for(document_en: str, lang: str) -> Dict:
    low = document_en.lower()
    for keywords, guide in RULES:
        if any(k in low for k in keywords):
            return {"how_to": guide["hi"] if lang == "hi" else guide["en"], "url": guide["url"]}
    return {"how_to": FALLBACK["hi"] if lang == "hi" else FALLBACK["en"], "url": FALLBACK["url"]}


def build_document_help(documents_en: List[str], documents_display: List[str], lang: str) -> List[Dict]:
    """documents_en: original English strings used as matching keys.
    documents_display: the (possibly localized) strings to show as the label.
    """
    out = []
    for i, doc_en in enumerate(documents_en):
        label = documents_display[i] if i < len(documents_display) else doc_en
        guide = guide_for(doc_en, lang)
        out.append({"name": label, "how_to": guide["how_to"], "url": guide["url"]})
    return out
