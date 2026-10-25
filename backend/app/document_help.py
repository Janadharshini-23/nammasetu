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
        "ta": "உங்கள் அருகிலுள்ள ஆதார் சேவை மையம் அல்லது வங்கி கிளைக்குச் செல்லவும், அல்லது ஆன்லைனில் விண்ணப்பிக்கவும்.",
        "te": "మీ సమీప ఆధార్ సేవా కేంద్రం లేదా బ్యాంక్ శాఖను సందర్శించండి, లేదా ఆన్‌లైన్‌లో దరఖాస్తు చేసుకోండి.",
        "url": "https://uidai.gov.in",
    }),
    (["income certificate", "income proof"], {
        "en": "Apply at your local Tehsildar or SDM office, your state's e-District portal, or a Common Service Centre (CSC).",
        "hi": "अपने स्थानीय तहसीलदार या SDM कार्यालय, राज्य के ई-डिस्ट्रिक्ट पोर्टल, या नज़दीकी कॉमन सर्विस सेंटर (CSC) पर आवेदन करें।",
        "ta": "உங்கள் உள்ளூர் வட்டாட்சியர் (தாசில்தார்) அலுவலகம், மாநிலத்தின் இ-சேவை போர்டல் அல்லது பொது சேவை மையத்தில் (CSC) விண்ணப்பிக்கவும்.",
        "te": "మీ స్థానిక తహశీల్దార్ కార్యాలయం, రాష్ట్ర ఇ-డిస్ట్రిక్ట్ పోర్టల్ లేదా కామన్ సర్వీస్ సెంటర్ (CSC) లో దరఖాస్తు చేసుకోండి.",
        "url": CSC_LOCATOR,
    }),
    (["bank account", "passbook"], {
        "en": "Open a savings account at any nearby bank branch or with a Bank Mitra (Business Correspondent). A Jan Dhan account needs zero balance.",
        "hi": "किसी भी नज़दीकी बैंक शाखा या बैंक मित्र के पास बचत खाता खोलें। जन धन खाते में शून्य बैलेंस की भी अनुमति है।",
        "ta": "அருகிலுள்ள எந்தவொரு வங்கி கிளையிலோ அல்லது வங்கி மித்ரா மூலமாகவோ சேமிப்புக் கணக்கைத் தொடங்கவும். ஜன் தன் கணக்கிற்கு பூஜ்ஜிய இருப்பு போதுமானது.",
        "te": "సమీప బ్యాంక్ శాఖలో లేదా బ్యాంక్ మిత్ర వద్ద పొదుపు ఖాతాను తెరవండి. జన్ ధన్ ఖాతాకు జీరో బ్యాలెన్స్ సరిపోతుంది.",
        "url": "https://pmjdy.gov.in",
    }),
    (["caste certificate"], {
        "en": "Apply at your local Tehsildar or Revenue office, or your state's e-District portal.",
        "hi": "अपने स्थानीय तहसीलदार या राजस्व कार्यालय, या राज्य के ई-डिस्ट्रिक्ट पोर्टल पर आवेदन करें।",
        "ta": "உங்கள் உள்ளூர் வட்டாட்சியர் அல்லது வருவாய்த் துறை அலுவலகம், அல்லது மாநிலத்தின் இ-சேவை போர்ட்டலில் விண்ணப்பிக்கவும்.",
        "te": "మీ స్థానిక తహశీల్దార్ లేదా రెవెన్యూ కార్యాలయం, లేదా రాష్ట్ర ఇ-డిస్ట్రిక్ట్ పోర్టల్‌లో దరఖాస్తు చేసుకోండి.",
        "url": CSC_LOCATOR,
    }),
    (["ration card"], {
        "en": "Apply through your state's Food & Civil Supplies Department, or visit the nearest ration office.",
        "hi": "अपने राज्य के खाद्य एवं नागरिक आपूर्ति विभाग के ज़रिए आवेदन करें, या नज़दीकी राशन कार्यालय जाएं।",
        "ta": "உங்கள் மாநில உணவு மற்றும் நுகர்வோர் பாதுகாப்புத் துறை மூலமாக விண்ணப்பிக்கவும், அல்லது அருகிலுள்ள வட்ட வழங்கல் அலுவலகத்திற்குச் செல்லவும்.",
        "te": "మీ రాష్ట్ర ఆహార మరియు పౌర సరఫరాల శాఖ ద్వారా దరఖాస్తు చేసుకోండి, లేదా సమీప రేషన్ కార్యాలయాన్ని సందర్శించండి.",
        "url": CSC_LOCATOR,
    }),
    (["land record", "land document", "land ownership", "tenancy"], {
        "en": "Check your state's land records portal (Bhulekh / Bhu-Naksha), or visit the local Patwari or Revenue office.",
        "hi": "अपने राज्य के भूलेख / भू-नक्शा पोर्टल पर देखें, या स्थानीय पटवारी या राजस्व कार्यालय जाएं।",
        "ta": "உங்கள் மாநிலத்தின் நில ஆவணங்கள் போர்ட்டலை (பட்டா/சிட்டா) சரிபார்க்கவும் அல்லது உள்ளூர் கிராம நிர்வாக அலுவலர் (VAO) அல்லது வருவாய்த் துறை அலுவலகத்திற்குச் செல்லவும்.",
        "te": "మీ రాష్ట్ర భూ రికార్డుల పోర్టల్ (మీభూమి / భూలేఖ్) ను చూడండి, లేదా స్థానిక పట్వారీ లేదా రెవెన్యూ కార్యాలయాన్ని సందర్శించండి.",
        "url": "https://bhuvan.nrsc.gov.in",
    }),
    (["disability certificate", "udid"], {
        "en": "Apply online at the UDID portal, or visit your nearest District Disability Rehabilitation Centre or government hospital.",
        "hi": "UDID पोर्टल पर ऑनलाइन आवेदन करें, या नज़दीकी जिला दिव्यांगता पुनर्वास केंद्र या सरकारी अस्पताल जाएं।",
        "ta": "UDID போர்ட்டலில் ஆன்லைனில் விண்ணப்பிக்கவும், அல்லது அருகிலுள்ள மாவட்ட மாற்றுத்திறனாளிகள் மறுவாழ்வு மையம் அல்லது அரசு மருத்துவமனைக்குச் செல்லவும்.",
        "te": "UDID పోర్టల్‌లో ఆన్‌లైన్‌లో దరఖాస్తు చేసుకోండి, లేదా మీ సమీప జిల్లా దివ్యాంగుల పునరావాస కేంద్రం లేదా ప్రభుత్వ ఆసుపత్రిని సందర్శించండి.",
        "url": "https://www.swavlambancard.gov.in",
    }),
    (["marksheet", "education certificate", "admission proof", "bonafide"], {
        "en": "Obtain this from your school or college's examination or admissions office.",
        "hi": "यह अपने स्कूल या कॉलेज के परीक्षा या प्रवेश कार्यालय से प्राप्त करें।",
        "ta": "இதை உங்கள் பள்ளி அல்லது கல்லூரியின் தேர்வுகள் அல்லது சேர்க்கை அலுவலகத்திலிருந்து பெறவும்.",
        "te": "దీన్ని మీ పాఠశాల లేదా కళాశాల పరీక్ష లేదా అడ్మిషన్ల కార్యాలయం నుండి పొందండి.",
        "url": None,
    }),
    (["electricity bill"], {
        "en": "Use your latest bill, or download it from your electricity provider's website or app.",
        "hi": "अपना नवीनतम बिल इस्तेमाल करें, या अपनी बिजली कंपनी की वेबसाइट या ऐप से डाउनलोड करें।",
        "ta": "உங்கள் சமீபத்திய மின் கட்டண ரசீதைப் பயன்படுத்தவும், அல்லது மின்வாரிய இணையதளம் அல்லது செயலியிலிருந்து பதிவிறக்கவும்.",
        "te": "మీ తాజా విద్యుత్ బిల్లును ఉపయోగించండి, లేదా విద్యుత్ పంపిణీ సంస్థ వెబ్‌సైట్ లేదా యాప్ నుండి డౌన్‌లోడ్ చేసుకోండి.",
        "url": None,
    }),
    (["photo"], {
        "en": "Get a passport-size photo taken at any local photo studio.",
        "hi": "किसी भी स्थानीय फोटो स्टूडियो से पासपोर्ट साइज़ फोटो खिंचवाएं।",
        "ta": "உள்ளூர் புகைப்பட நிலையத்தில் பாஸ்போர்ட் அளவிலான புகைப்படத்தை எடுக்கவும்.",
        "te": "ఏదైనా స్థానిక ఫోటో స్టూడియో నుండి పాస్‌పోర్ట్ సైజు ఫోటో తీయించండి.",
        "url": None,
    }),
    (["business plan", "quotation", "project report"], {
        "en": "Prepare this with help from your bank, District Industries Centre, or a Common Service Centre operator.",
        "hi": "अपने बैंक, जिला उद्योग केंद्र, या कॉमन सर्विस सेंटर संचालक की मदद से इसे तैयार करें।",
        "ta": "உங்கள் வங்கி, மாவட்ட தொழில் மையம் அல்லது பொது சேவை மைய இயக்குநரின் உதவியுடன் இதைத் தயாரிக்கவும்.",
        "te": "మీ బ్యాంక్, జిల్లా పరిశ్రమల కేంద్రం లేదా కామన్ సర్వీస్ సెంటర్ నిర్వాహకుడి సహాయంతో దీన్ని సిద్ధం చేయండి.",
        "url": CSC_LOCATOR,
    }),
    (["mgnrega", "job card"], {
        "en": "Apply at your Gram Panchayat office.",
        "hi": "अपने ग्राम पंचायत कार्यालय में आवेदन करें।",
        "ta": "உங்கள் கிராம பஞ்சாயத்து அலுவலகத்தில் விண்ணப்பிக்கவும்.",
        "te": "మీ గ్రామ పంచాయతీ కార్యాలయంలో దరఖాస్తు చేసుకోండి.",
        "url": None,
    }),
    (["birth certificate"], {
        "en": "Available from your municipal corporation or Gram Panchayat's birth registration office.",
        "hi": "यह आपके नगर निगम या ग्राम पंचायत के जन्म पंजीकरण कार्यालय से मिलता है।",
        "ta": "இது உங்கள் நகராட்சி அல்லது கிராம பஞ்சாயத்து பிறப்பு பதிவு அலுவலகத்தில் கிடைக்கும்.",
        "te": "ఇది మీ మునిసిపల్ కార్పొరేషన్ లేదా గ్రామ పంచాయతీ జనన నమోదు కార్యాలయం నుండి లభిస్తుంది.",
        "url": None,
    }),
    (["secc", "survey reference", "vending"], {
        "en": "Ask your local municipal body or urban local body whether your name is listed; they can guide you to the right office.",
        "hi": "अपने स्थानीय नगर निकाय से पूछें कि क्या आपका नाम सूची में है; वे आपको सही कार्यालय बताएंगे।",
        "ta": "உங்கள் பெயர் பட்டியலில் உள்ளதா என உங்கள் உள்ளூர் நகராட்சி அல்லது உள்ளாட்சி அமைப்பிடம் கேளுங்கள்; அவர்கள் சரியான அலுவலகத்திற்கு வழிகாட்டுவார்கள்.",
        "te": "మీ పేరు జాబితాలో ఉందో లేదో తెలుసుకోవడానికి మీ స్థానిక మునిసిపల్ సంస్థను సంప్రదించండి; వారు మీకు సరైన మార్గదర్శకత్వం ఇస్తారు.",
        "url": CSC_LOCATOR,
    }),
]

FALLBACK = {
    "en": "Visit your nearest Common Service Centre (CSC) or the concerned government office for guidance on this document.",
    "hi": "इस दस्तावेज़ के लिए अपने नज़दीकी कॉमन सर्विस सेंटर (CSC) या संबंधित सरकारी कार्यालय से मदद लें।",
    "ta": "இந்த ஆவணம் குறித்த வழிகாட்டுதலுக்கு உங்கள் அருகிலுள்ள பொது சேவை மையம் (CSC) அல்லது சம்பந்தப்பட்ட அரசு அலுவலகத்திற்குச் செல்லவும்.",
    "te": "ఈ పత్రం గురించిన మార్గదర్శకత్వం కోసం మీ సమీప కామన్ సర్వీస్ సెంటర్ (CSC) లేదా సంబంధిత ప్రభుత్వ కార్యాలయాన్ని సంప్రదించండి.",
    "url": CSC_LOCATOR,
}


def guide_for(document_en: str, lang: str) -> Dict:
    low = document_en.lower()
    l = (lang or "en").lower()
    for keywords, guide in RULES:
        if any(k in low for k in keywords):
            how_to = guide.get(l) or guide.get("en")
            return {"how_to": how_to, "url": guide["url"]}
    how_to = FALLBACK.get(l) or FALLBACK.get("en")
    return {"how_to": how_to, "url": FALLBACK["url"]}


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
