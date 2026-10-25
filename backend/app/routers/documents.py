from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.orm import Session
import jwt
import os

from ..database import get_db
from ..models import Scheme, SavedScheme, User
from ..document_help import RULES, FALLBACK, CSC_LOCATOR

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Master catalog of standard documents
MASTER_DOCUMENTS = [
    {
        "id": "aadhaar",
        "keywords": ["aadhaar"],
        "category": "Identity",
        "en": {
            "name": "Aadhaar Card",
            "category": "Identity",
            "description": "12-digit unique identity number issued by UIDAI. Universal proof of identity and address.",
            "how_to": "Visit your nearest Aadhaar Seva Kendra or bank branch, or update online at uidai.gov.in.",
        },
        "ta": {
            "name": "ஆதார் அட்டை",
            "category": "அடையாளச் சான்று",
            "description": "UIDAI வழங்கிய 12 இலக்க தனித்துவ அடையாள எண். உலகளாவிய அடையாள மற்றும் முகவரிச் சான்று.",
            "how_to": "உங்கள் அருகிலுள்ள ஆதார் சேவை மையம் அல்லது வங்கி கிளைக்குச் செல்லவும், அல்லது uidai.gov.in போர்ட்டலில் ஆன்லைனில் விண்ணப்பிக்கவும்.",
        },
        "hi": {
            "name": "आधार कार्ड",
            "category": "पहचान",
            "description": "UIDAI द्वारा जारी 12 अंकों की विशिष्ट पहचान संख्या। पहचान और पते का सार्वभौमिक प्रमाण।",
            "how_to": "अपने नज़दीकी आधार सेवा केंद्र या बैंक शाखा जाएं, या uidai.gov.in पर ऑनलाइन आवेदन करें।",
        },
        "te": {
            "name": "ఆధార్ కార్డు",
            "category": "గుర్తింపు",
            "description": "UIDAI జారీ చేసిన 12 అంకెల విశిష్ట గుర్తింపు సంఖ్య. గుర్తింపు మరియు చిరునామాకు సార్వత్రిక రుజువు.",
            "how_to": "మీ సమీప ఆధార్ సేవా కేంద్రం లేదా బ్యాంక్ శాఖను సందర్శించండి, లేదా uidai.gov.in లో ఆన్‌లైన్‌లో దరఖాస్తు చేసుకోండి.",
        },
        "url": "https://uidai.gov.in",
    },
    {
        "id": "income-cert",
        "keywords": ["income certificate", "income proof"],
        "category": "Financial",
        "en": {
            "name": "Income Certificate",
            "category": "Income & Finance",
            "description": "Official certificate stating the annual income of all family members from all sources.",
            "how_to": "Apply at your local Tehsildar or SDM office, state e-District portal, or CSC.",
        },
        "ta": {
            "name": "வருமானச் சான்றிதழ்",
            "category": "வருமானம் மற்றும் நிதி",
            "description": "அனைத்து வழிகளிலிருந்தும் குடும்ப உறுப்பினர்களின் ஆண்டு வருமானத்தைக் குறிப்பிடும் அதிகாரப்பூர்வ சான்றிதழ்.",
            "how_to": "உங்கள் உள்ளூர் வட்டாட்சியர் (தாசில்தார்) அலுவலகம், மாநிலத்தின் இ-சேவை போர்டல் அல்லது CSC மையத்தில் விண்ணப்பிக்கவும்.",
        },
        "hi": {
            "name": "आय प्रमाण पत्र",
            "category": "आय और वित्त",
            "description": "सभी स्रोतों से परिवार के सभी सदस्यों की वार्षिक आय प्रमाणित करने वाला आधिकारिक प्रमाण पत्र।",
            "how_to": "अपने स्थानीय तहसीलदार या SDM कार्यालय, राज्य के ई-डिस्ट्रिक्ट पोर्टल, या CSC पर आवेदन करें।",
        },
        "te": {
            "name": "ఆదాయ ధృవీకరణ పత్రం",
            "category": "ఆదాయం & ఆర్థికం",
            "description": "అన్ని మార్గాల ద్వారా కుటుంబ సభ్యుల వార్షిక ఆదాయాన్ని ధృవీకరించే అధికారిక పత్రం.",
            "how_to": "మీ స్థానిక తహశీల్దార్ కార్యాలయం, రాష్ట్ర ఇ-డిస్ట్రిక్ట్ పోర్టల్ లేదా CSC లో దరఖాస్తు చేసుకోండి.",
        },
        "url": CSC_LOCATOR,
    },
    {
        "id": "bank-passbook",
        "keywords": ["bank account", "passbook"],
        "category": "Financial",
        "en": {
            "name": "Bank Account Details / Passbook",
            "category": "Income & Finance",
            "description": "Active bank account linked with Aadhaar (DBT enabled) with IFSC and account number.",
            "how_to": "Open a zero-balance Jan Dhan savings account at any bank branch or Bank Mitra.",
        },
        "ta": {
            "name": "வங்கி கணக்கு விவரங்கள் / பாஸ்புக்",
            "category": "வருமானம் மற்றும் நிதி",
            "description": "ஆதாருடன் இணைக்கப்பட்ட செயலில் உள்ள வங்கி கணக்கு (DBT இயக்கப்பட்ட கணக்கு).",
            "how_to": "அருகிலுள்ள எந்தவொரு வங்கி கிளையிலோ அல்லது வங்கி மித்ரா மூலமாகவோ பூஜ்ஜிய இருப்பு ஜன் தன் கணக்கைத் தொடங்கவும்.",
        },
        "hi": {
            "name": "बैंक खाता विवरण / पासबुक",
            "category": "आय और वित्त",
            "description": "आधार से जुड़ा सक्रिय बैंक खाता (DBT सक्षम) जिसमें IFSC और खाता संख्या स्पष्ट हो।",
            "how_to": "किसी भी बैंक शाखा या बैंक मित्र के पास जाकर शून्य-बैलेंस जन धन बचत खाता खोलें।",
        },
        "te": {
            "name": "బ్యాంక్ ఖాతా వివరాలు / పాస్‌బుక్",
            "category": "ఆదాయం & ఆర్థికం",
            "description": "ఆధార్‌తో అనుసంధానించబడిన క్రియాశీల బ్యాంక్ ఖాతా (DBT ప్రారంభించబడింది).",
            "how_to": "ఏదైనా బ్యాంక్ శాఖ లేదా బ్యాంక్ మిత్ర వద్ద సున్నా-బ్యాలెన్స్ జన్ ధన్ పొదుపు ఖాతాను తెరవండి.",
        },
        "url": "https://pmjdy.gov.in",
    },
    {
        "id": "caste-cert",
        "keywords": ["caste certificate"],
        "category": "Social Category",
        "en": {
            "name": "Caste / Category Certificate",
            "category": "Social Category",
            "description": "Valid community/caste certificate for SC, ST, OBC, or EWS reservations and benefits.",
            "how_to": "Apply at local Revenue Department / Tehsildar office or state e-District portal.",
        },
        "ta": {
            "name": "சாதி / சமூகப் பிரிவு சான்றிதழ்",
            "category": "சமூகப் பிரிவு",
            "description": "SC, ST, OBC அல்லது EWS இடஒதுக்கீடு மற்றும் பலன்களுக்கான செல்லுபடியாகும் சாதிச் சான்றிதழ்.",
            "how_to": "உள்ளூர் வட்டாட்சியர் அல்லது வருவாய்த் துறை அலுவலகம், அல்லது மாநிலத்தின் இ-சேவை போர்ட்டலில் விண்ணப்பிக்கவும்.",
        },
        "hi": {
            "name": "जाति / श्रेणी प्रमाण पत्र",
            "category": "सामाजिक श्रेणी",
            "description": "SC, ST, OBC या EWS आरक्षण और सरकारी लाभों के लिए वैध समुदाय/जाति प्रमाण पत्र।",
            "how_to": "स्थानीय राजस्व कार्यालय, तहसीलदार या राज्य के ई-डिस्ट्रिक्ट पोर्टल पर आवेदन करें।",
        },
        "te": {
            "name": "కుల / వర్గ ధృవీకరణ పత్రం",
            "category": "సామాజిక వర్గం",
            "description": "SC, ST, OBC లేదా EWS రిజర్వేషన్లు మరియు ప్రయోజనాల కోసం చెల్లుబాటు అయ్యే కుల ధృవీకరణ పత్రం.",
            "how_to": "స్థానిక రెవెన్యూ కార్యాలయం, తహశీల్దార్ లేదా రాష్ట్ర ఇ-డిస్ట్రిక్ట్ పోర్టల్‌లో దరఖాస్తు చేసుకోండి.",
        },
        "url": CSC_LOCATOR,
    },
    {
        "id": "ration-card",
        "keywords": ["ration card"],
        "category": "Address & Residence",
        "en": {
            "name": "Ration Card",
            "category": "Address & Residence",
            "description": "State-issued family ration card (BPL, Antyodaya, or Priority Household).",
            "how_to": "Apply through your state's Food & Civil Supplies Department or local ration office.",
        },
        "ta": {
            "name": "குடும்ப அட்டை (ரேஷன் கார்டு)",
            "category": "முகவரி மற்றும் குடியிருப்பு",
            "description": "மாநில அரசு வழங்கிய குடும்ப அட்டை (வறுமைக் கோட்டிற்கு கீழ் / முன்னுரிமை குடும்ப அட்டை).",
            "how_to": "உங்கள் மாநில உணவு மற்றும் நுகர்வோர் பாதுகாப்புத் துறை மூலமாக விண்ணப்பிக்கவும்.",
        },
        "hi": {
            "name": "राशन कार्ड",
            "category": "पता और आवास",
            "description": "राज्य सरकार द्वारा जारी पारिवारिक राशन कार्ड (BPL, अंत्योदय या प्राथमिकता राशन कार्ड)।",
            "how_to": "राज्य के खाद्य एवं नागरिक आपूर्ति विभाग या नज़दीकी राशन कार्यालय से आवेदन करें।",
        },
        "te": {
            "name": "రేషన్ కార్డు",
            "category": "చిరునామా & నివాసం",
            "description": "రాష్ట్ర ప్రభుత్వం జారీ చేసిన కుటుంబ రేషన్ కార్డు (BPL, అంత్యోదయ లేదా ప్రాధాన్యత కార్డు).",
            "how_to": "మీ రాష్ట్ర ఆహార మరియు పౌర సరఫరాల శాఖ ద్వారా లేదా స్థానిక రేషన్ కార్యాలయంలో దరఖాస్తు చేసుకోండి.",
        },
        "url": CSC_LOCATOR,
    },
    {
        "id": "land-records",
        "keywords": ["land record", "land document", "land ownership", "tenancy"],
        "category": "Land & Property",
        "en": {
            "name": "Land Ownership / Tenancy Records",
            "category": "Land & Agriculture",
            "description": "Record of Rights (RoR), Khatauni, Patta, or registered tenancy agreement.",
            "how_to": "Check your state's Bhulekh / Bhu-Naksha portal or visit local Patwari / Revenue office.",
        },
        "ta": {
            "name": "நில உரிமை / குத்தகை ஆவணங்கள் (பட்டா/சிட்டா)",
            "category": "நிலம் மற்றும் விவசாயம்",
            "description": "நில உரிமை ஆவணம் (பட்டா, சிட்டா, அடங்கல் அல்லது பதிவு செய்யப்பட்ட குத்தகை ஒப்பந்தம்).",
            "how_to": "உங்கள் மாநிலத்தின் நில ஆவணங்கள் போர்ட்டலை சரிபார்க்கவும் அல்லது உள்ளூர் VAO அலுவலகத்திற்குச் செல்லவும்.",
        },
        "hi": {
            "name": "भूमि स्वामित्व / पट्टा रिकॉर्ड",
            "category": "भूमि और कृषि",
            "description": "खतौनी, खसरा, जमाबंदी या पंजीकृत पट्टा/किराया समझौता।",
            "how_to": "अपने राज्य के भूलेख / भू-नक्शा पोर्टल पर ऑनलाइन देखें या स्थानीय पटवारी कार्यालय जाएं।",
        },
        "te": {
            "name": "భూమి యాజమాన్య / కౌలు పత్రాలు",
            "category": "భూమి & వ్యవసాయం",
            "description": "రైతు పట్టాదారు పాస్‌బుక్, 1B అడంగల్ లేదా రిజిస్టర్డ్ కౌలు ఒప్పందం.",
            "how_to": "మీ రాష్ట్ర మీభూమి / భూలేఖ్ పోర్టల్‌లో చూడండి లేదా స్థానిక పట్వారీ కార్యాలయాన్ని సందర్శించండి.",
        },
        "url": "https://bhuvan.nrsc.gov.in",
    },
    {
        "id": "disability-cert",
        "keywords": ["disability certificate", "udid"],
        "category": "Special Category",
        "en": {
            "name": "Disability Certificate / UDID Card",
            "category": "Special Category",
            "description": "Unique Disability Identity Card (UDID) issued by the Ministry of Social Justice & Empowerment.",
            "how_to": "Apply online at swavlambancard.gov.in or visit district hospital / DDRC.",
        },
        "ta": {
            "name": "மாற்றுத்திறனாளி சான்றிதழ் / UDID அட்டை",
            "category": "சிறப்புப் பிரிவு",
            "description": "மத்திய சமூக நீதி அமைச்சகம் வழங்கிய தனித்துவமான மாற்றுத்திறனாளி அடையாள அட்டை (UDID).",
            "how_to": "swavlambancard.gov.in போர்ட்டலில் ஆன்லைனில் விண்ணப்பிக்கவும் அல்லது மாவட்ட அரசு மருத்துவமனைக்குச் செல்லவும்.",
        },
        "hi": {
            "name": "दिव्यांगता प्रमाण पत्र / UDID कार्ड",
            "category": "विशेष श्रेणी",
            "description": "सामाजिक न्याय एवं अधिकारिता मंत्रालय द्वारा जारी विशिष्ट दिव्यांगता पहचान पत्र (UDID)।",
            "how_to": "swavlambancard.gov.in पर ऑनलाइन आवेदन करें या ज़िला अस्पताल जाएं।",
        },
        "te": {
            "name": "దివ్యాంగ ధృవీకరణ పత్రం / UDID కార్డు",
            "category": "ప్రత్యేక వర్గం",
            "description": "సామాజిక న్యాయ మంత్రిత్వ శాఖ జారీ చేసిన విశిష్ట దివ్యాంగ గుర్తింపు కార్డు (UDID).",
            "how_to": "swavlambancard.gov.in లో ఆన్‌లైన్‌లో దరఖాస్తు చేసుకోండి లేదా జిల్లా ఆసుపత్రిని సంప్రదించండి.",
        },
        "url": "https://www.swavlambancard.gov.in",
    },
    {
        "id": "education-cert",
        "keywords": ["marksheet", "education certificate", "admission proof", "bonafide"],
        "category": "Academic",
        "en": {
            "name": "Educational Certificates & Marksheets",
            "category": "Academic",
            "description": "Previous qualification marksheets, bonafide student certificate, or admission proof.",
            "how_to": "Obtain from your current or past school, college, or university administration.",
        },
        "ta": {
            "name": "கல்விச் சான்றிதழ்கள் மற்றும் மதிப்பெண் பட்டியல்கள்",
            "category": "கல்வி",
            "description": "முந்தைய கல்வித் தகுதி மதிப்பெண் பட்டியல், கல்வி பயில்வதற்கான போனாஃபைட் சான்றிதழ்.",
            "how_to": "உங்கள் பள்ளி அல்லது கல்லூரியின் நிர்வாக அலுவலகத்திலிருந்து பெறவும்.",
        },
        "hi": {
            "name": "शैक्षणिक प्रमाण पत्र एवं अंकतालिका",
            "category": "शैक्षणिक",
            "description": "पिछली योग्यता की अंकतालिका, बोनाफाइड प्रमाण पत्र या प्रवेश की रसीद।",
            "how_to": "अपने संबंधित स्कूल, कॉलेज या विश्वविद्यालय के परीक्षा अथवा प्रवेश कार्यालय से प्राप्त करें।",
        },
        "te": {
            "name": "విద్యా ధృవీకరణ పత్రాలు & మార్కుల జాబితా",
            "category": "విద్య",
            "description": "మునుపటి విద్యార్హత మార్కుల మెమో, బోనఫైడ్ సర్టిఫికెట్ లేదా అడ్మిషన్ రుజువు.",
            "how_to": "మీ పాఠశాల, కళాశాల లేదా విశ్వవిద్యాలయ పరిపాలనా విభాగం నుండి పొందండి.",
        },
        "url": None,
    },
    {
        "id": "electricity-bill",
        "keywords": ["electricity bill"],
        "category": "Address & Residence",
        "en": {
            "name": "Recent Electricity Bill",
            "category": "Address & Residence",
            "description": "Recent electricity utility bill in applicant's or family's name showing consumer number.",
            "how_to": "Use recent physical bill or download bill PDF from state power DISCOM portal/app.",
        },
        "ta": {
            "name": "மின் கட்டண ரசீது",
            "category": "முகவரி மற்றும் குடியிருப்பு",
            "description": "நுகர்வோர் எண் தெளிவாகத் தெரியும் குடும்ப உறுப்பினரின் பெயரிலுள்ள சமீபத்திய மின் கட்டண ரசீது.",
            "how_to": "சமீபத்திய ரசீதைப் பயன்படுத்தவும் அல்லது மின்வாரிய இணையதளம்/செயலியிலிருந்து பதிவிறக்கவும்.",
        },
        "hi": {
            "name": "हाल का बिजली बिल",
            "category": "पता और आवास",
            "description": "आवेदक या परिवार के मुखिया के नाम पर हाल ही का बिजली बिल जिसमें उपभोक्ता संख्या अंकित हो।",
            "how_to": "हाल का बिजली बिल उपयोग करें या बिजली वितरण कंपनी के पोर्टल/ऐप से डाउनलोड करें।",
        },
        "te": {
            "name": "ఇటీవలి విద్యుత్ బిల్లు",
            "category": "చిరునామా & నివాసం",
            "description": "వినియోగదారు సంఖ్య కనిపించే దరఖాస్తుదారు లేదా కుటుంబ సభ్యుల పేరుతో ఉన్న విద్యుత్ బిల్లు.",
            "how_to": "ఇటీవలి బిల్లును ఉపయోగించండి లేదా విద్యుత్ సంస్థ యాప్/పోర్టల్ నుండి డౌన్‌లోడ్ చేసుకోండి.",
        },
        "url": None,
    },
    {
        "id": "photo",
        "keywords": ["photo"],
        "category": "Identity",
        "en": {
            "name": "Passport-sized Photographs",
            "category": "Identity",
            "description": "Recent color photographs with white or light background (typically 2 to 4 copies).",
            "how_to": "Get passport-size photos taken at any local photo studio or CSC.",
        },
        "ta": {
            "name": "பாஸ்போர்ட் அளவிலான புகைப்படங்கள்",
            "category": "அடையாளச் சான்று",
            "description": "வெள்ளை அல்லது வெளிர் பின்னணியில் எடுக்கப்பட்ட சமீபத்திய வண்ணப் புகைப்படங்கள்.",
            "how_to": "உள்ளூர் புகைப்பட நிலையம் அல்லது CSC மையத்தில் பாஸ்போர்ட் அளவு புகைப்படங்களை எடுக்கவும்.",
        },
        "hi": {
            "name": "पासपोर्ट साइज फोटो",
            "category": "पहचान",
            "description": "सफेद या हल्के बैकग्राउंड के साथ हाल ही में खींची गई रंगीन पासपोर्ट साइज फोटो।",
            "how_to": "किसी भी स्थानीय फोटो स्टूडियो या कॉमन सर्विस सेंटर पर जाकर फोटो खिंचवाएं।",
        },
        "te": {
            "name": "పాస్‌పోర్ట్ సైజు ఫోటోలు",
            "category": "గుర్తింపు",
            "description": "తెలుపు లేదా లేత నేపథ్యంతో తీసిన ఇటీవలి రంగు పాస్‌పోర్ట్ సైజు ఫోటోలు.",
            "how_to": "ఏదైనా స్థానిక ఫోటో స్టూడియో లేదా CSC వద్ద పాస్‌పోర్ట్ సైజు ఫోటోలు తీయించండి.",
        },
        "url": None,
    },
]


def _get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    secret = os.getenv("SECRET_KEY", "change-me-to-a-long-random-string")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        email: str = payload.get("sub")
        if not email:
            return None
        return db.query(User).filter(User.email == email).first()
    except Exception:
        return None


@router.get("/tracker")
def get_document_tracker(
    lang: str = Query(default="en"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Returns the comprehensive document tracker dataset with real guidance,
    cross-referenced schemes, official links, and optional user saved scheme readiness.
    """
    l = (lang or "en").lower()
    if l not in ["en", "ta", "hi", "te"]:
        l = "en"

    # Fetch all schemes to compute which schemes require which document
    schemes = db.query(Scheme).all()

    # Optional authenticated user
    user = _get_current_user_optional(authorization, db)
    saved_scheme_ids = set()
    if user:
        rows = db.query(SavedScheme).filter(SavedScheme.user_id == user.id).all()
        saved_scheme_ids = {r.scheme_id for r in rows}

    documents_out = []
    for doc in MASTER_DOCUMENTS:
        doc_info = doc.get(l) or doc["en"]
        
        # Find which schemes require this document
        matched_schemes = []
        is_required_for_saved = False
        for s in schemes:
            s_docs = [d.lower() for d in (s.documents or [])]
            if any(any(k in d for k in doc["keywords"]) for d in s_docs):
                matched_schemes.append({
                    "id": s.id,
                    "slug": s.slug,
                    "name": getattr(s, f"name_{l}", None) or s.name,
                })
                if s.id in saved_scheme_ids:
                    is_required_for_saved = True

        documents_out.append({
            "id": doc["id"],
            "name": doc_info["name"],
            "category": doc_info["category"],
            "description": doc_info["description"],
            "how_to": doc_info["how_to"],
            "portal_url": doc["url"],
            "schemes_count": len(matched_schemes),
            "schemes": matched_schemes[:5],
            "required_for_saved": is_required_for_saved,
        })

    return {
        "status": "ok",
        "total_documents": len(documents_out),
        "user_authenticated": user is not None,
        "saved_schemes_count": len(saved_scheme_ids),
        "documents": documents_out,
    }
