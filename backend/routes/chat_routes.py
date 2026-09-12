"""
ArthMitra AI — Helper AI Chat Routes (Scheme Support Bot)
RAG-inspired keyword matching against scheme FAQ + description + ArthMitra app knowledge.
Provides natural language Q&A in English, Hindi, and Marathi with profile personalization.
"""
import json
import os
import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, LiveScheme
from typing import Optional

router = APIRouter(prefix="/schemes", tags=["Chat"])


# ─── PYDANTIC MODELS ─────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    scheme_name: Optional[str] = ""
    question: str
    language: str = "en"   # en | hi | mr
    user_context: Optional[dict] = None  # optional profile for personalized answers


class ChatResponse(BaseModel):
    answer: str
    sources: list = []
    confidence: str = "medium"  # high | medium | low


# ─── OFF-TOPIC DETECTION ─────────────────────────────────────────────────────
OFFTOPIC_PATTERNS = [
    # Sports / Cricket / IPL
    r"\bipl\b", r"\bcricket\b", r"\bfootball\b", r"\bworld cup\b", r"\bdhoni\b", r"\bkohli\b", r"\brohit\b", r"\bmatch\b",
    # Entertainment / Movies
    r"\bmovie\b", r"\bcinema\b", r"\bactor\b", r"\bactress\b", r"\bbollywood\b", r"\bhollywood\b", r"\bnetflix\b", r"\bsong\b",
    # Tech / Coding / Miscellaneous
    r"\bprogramming\b", r"\bjavascript\b", r"\bpython code\b", r"\bwrite a code\b", r"\bweather\b", r"\brecipe\b", r"\bgaming\b"
]

OFFTOPIC_RESPONSES = {
    "en": "I am ArthMitra Helper AI, designed specifically to assist you with government welfare schemes, financial wellness, and application processes. Please ask me questions related to government schemes or ArthMitra services.",
    "hi": "मैं अर्थमित्र सहायक एआई हूँ, जिसे विशेष रूप से सरकारी कल्याणकारी योजनाओं, वित्तीय कल्याण और आवेदन प्रक्रियाओं में आपकी सहायता के लिए डिज़ाइन किया गया है। कृपया मुझसे सरकारी योजनाओं या अर्थमित्र सेवाओं से संबंधित प्रश्न पूछें।",
    "mr": "मी अर्थमित्र सहाय्यक AI आहे, ज्याची रचना तुम्हाला सरकारी कल्याणकारी योजना, आर्थिक सुदृढता आणि अर्ज प्रक्रियेत मदत करण्यासाठी केली आहे. कृपया मला सरकारी योजना किंवा अर्थमित्र सेवांशी संबंधित प्रश्न विचारा."
}


# ─── ARTHMITRA APP KNOWLEDGE BASE ────────────────────────────────────────────
ARTHMITRA_KNOWLEDGE = {
    "health_score": {
        "patterns": ["financial health", "health score", "score", "स्वास्थ्य स्कोर", "आर्थिक आरोग्य", "गुण"],
        "responses": {
            "en": "The Financial Health Score (0–100) measures your family's overall financial well-being across 5 pillars: Income Adequacy, Scheme Coverage, Savings Potential, Education Level, and Social Security. Maintain emergency savings, obtain health insurance, and enroll in eligible schemes to boost your score.",
            "hi": "वित्तीय स्वास्थ्य स्कोर (0-100) 5 स्तंभों के आधार पर आपके परिवार की समग्र वित्तीय स्थिति को मापता है: आय की पर्याप्तता, योजना कवरेज, बचत क्षमता, शिक्षा स्तर और सामाजिक सुरक्षा। आपातकालीन बचत रखकर, स्वास्थ्य बीमा लेकर और पात्र योजनाओं में नामांकन करके अपना स्कोर बढ़ाएं।",
            "mr": "आर्थिक आरोग्य गुण (0-100) 5 स्तंभांवर आधारित तुमच्या कुटुंबाच्या एकूण आर्थिक सुदृढतेचे मोजमाप करतो: उत्पन्नाची पर्याप्तता, योजना कव्हरेज, बचत क्षमता, शिक्षण पातळी आणि सामाजिक सुरक्षा. आणीबाणीच्या प्रसंगासाठी बचत ठेवून, आरोग्य विमा घेऊन आणि पात्र योजनांमध्ये नावनोंदणी करून तुमचा गुण वाढवा."
        }
    },
    "savings_planner": {
        "patterns": ["savings", "planner", "micro-investment", "post office", "rd", "kvp", "recurring deposit", "बचत", "गुंतवणूक"],
        "responses": {
            "en": "ArthMitra Savings Planner offers zero-risk, government-backed micro-investment options like Post Office Recurring Deposits (RD) and Kisan Vikas Patra (KVP). It models 1, 3, and 5-year growth to deliver guaranteed returns.",
            "hi": "अर्थमित्र बचत योजना पोस्ट ऑफिस आवर्ती जमा (RD) और किसान विकास पत्र (KVP) जैसे शून्य-जोखिम, सरकार द्वारा समर्थित सूक्ष्म-निवेश विकल्प प्रदान करती है। यह गारंटीकृत रिटर्न देने के लिए 1, 3 और 5 साल के विकास का मॉडल तैयार करती है।",
            "mr": "अर्थमित्र बचत नियोजन पोस्ट ऑफिस रिकरिंग डिपॉझिट (RD) आणि किसान विकास पत्र (KVP) सारखे शून्य-जोखीम, सरकार-मान्य सूक्ष्म-गुंतवणूक पर्याय प्रदान करते. हे हमी परतावा देण्यासाठी 1, 3 आणि 5 वर्षांच्या वाढीचे मॉडेल तयार करते."
        }
    },
    "documents": {
        "patterns": ["document", "documents", "aadhaar", "income cert", "caste cert", "locker", "upload", "कागदपत्रे", "दस्तावेज़"],
        "responses": {
            "en": "ArthMitra Document Locker securely manages key eligibility proofs: Aadhaar Card, Income Certificate, Caste Certificate, Ration Card, Bank Passbook, and Land Records (7/12). Upload your verified documents once for instant multi-scheme applications.",
            "hi": "अर्थमित्र दस्तावेज़ लॉकर आपकी पात्रता के मुख्य प्रमाणों को सुरक्षित रूप से प्रबंधित करता है: आधार कार्ड, आय प्रमाण पत्र, जाति प्रमाण पत्र, राशन कार्ड, बैंक पासबुक और भूमि अभिलेख। त्वरित बहु-योजना आवेदनों के लिए अपने दस्तावेज़ एक बार अपलोड करें।",
            "mr": "अर्थमित्र कागदपत्रे लॉकर तुमच्या पात्रतेच्या मुख्य पुराव्यांचे सुरक्षितपणे व्यवस्थापन करते: आधार कार्ड, उत्पन्नाचा दाखला, जात प्रमाणपत्र, रेशन कार्ड, बँक पासबुक आणि जमीन उतारा (7/12). त्वरित बहु-योजना अर्जांसाठी तुमची कागदपत्रे एकदाच अपलोड करा."
        }
    },
    "workflow": {
        "patterns": ["status", "stage", "dm", "district officer", "pending", "rejection", "approval", "सत्यापन", "अर्जाची स्थिती", "प्रक्रिया"],
        "responses": {
            "en": "The application process moves through 4 transparent verification stages:\n1. Citizen Application Submission\n2. Automated Eligibility Rule Engine Check\n3. District Officer / DM Review & Verification\n4. Direct Benefit Transfer (DBT) credit directly to your Aadhaar-linked bank account.",
            "hi": "आवेदन प्रक्रिया 4 पारदर्शी सत्यापन चरणों से गुजरती है:\n1. नागरिक आवेदन जमा करना\n2. स्वचालित पात्रता नियम इंजन जांच\n3. जिला अधिकारी / डीएम समीक्षा और सत्यापन\n4. आपके आधार-लिंक किए गए बैंक खाते में सीधा लाभ हस्तांतरण (DBT)।",
            "mr": "अर्ज प्रक्रिया 4 पारदर्शक पडताळणी टप्प्यांतून जाते:\n1. नागरिक अर्ज सबमिशन\n2. स्वयंचलित पात्रता नियम इंजिन तपासणी\n3. जिल्हा अधिकारी / डीएम पुनरावलोकन आणि पडताळणी\n4. तुमच्या आधार-लिंक केलेल्या बँक खात्यात थेट लाभ हस्तांतरण (DBT)."
        }
    },
    "voice_assistant": {
        "patterns": ["voice", "speak", "hands-free", "आवाज", "बोलून", "व्हॉइस"],
        "responses": {
            "en": "ArthMitra Voice Assistant provides hands-free application form filling. Speak your details naturally in English, Hindi, or Marathi, and AI will automatically transcribe and populate your application fields.",
            "hi": "अर्थमित्र वॉयस असिस्टेंट हैंड्स-फ्री आवेदन पत्र भरने की सुविधा प्रदान करता है। अंग्रेजी, हिंदी या मराठी में स्वाभाविक रूप से अपने विवरण बोलें, और एआई आपके आवेदन फ़ील्ड को स्वचालित रूप से भर देगा।",
            "mr": "अर्थमित्र व्हॉइस असिस्टंट हँड्स-फ्री अर्ज भरण्याची सुविधा प्रदान करतो. इंग्रजी, हिंदी किंवा मराठीत तुमची माहिती सांगा आणि AI स्वयंचलितपणे तुमचे अर्ज फॉर्म भरेल."
        }
    }
}


# ─── KEYWORD INTENT DETECTION ────────────────────────────────────────────────
INTENT_PATTERNS = {
    "timeline": [
        "how long", "how many days", "days", "weeks", "time", "duration", "processing",
        "verification time", "when will", "take time", "approval time",
        "कितने दिन", "कितना समय", "कब", "दिन", "सप्ताह", "प्रक्रिया",
        "किती दिवस", "किती वेळ", "कधी", "दिवस", "आठवडे", "कालावधी",
    ],
    "eligibility": [
        "eligible", "qualify", "who can", "can i", "am i", "criteria",
        "income limit", "caste", "age limit", "who is", "requirements", "minimum",
        "पात्र", "योग्य", "कौन", "मैं", "पात्रता", "आय सीमा", "जाति", "आयु",
        "कोण", "मी", "उत्पन्न", "जात", "वय",
    ],
    "documents": [
        "document", "documents", "upload", "certificate", "aadhaar", "income certificate",
        "what to submit", "papers", "required", "proof",
        "दस्तावेज़", "आधार", "प्रमाण पत्र", "अपलोड", "जमा",
        "कागदपत्रे", "प्रमाणपत्र",
    ],
    "steps": [
        "how to apply", "steps", "process", "register", "where to apply", "portal",
        "procedure", "apply online", "application process",
        "कैसे आवेदन", "कदम", "प्रक्रिया", "पंजीकरण", "कहाँ", "पोर्टल",
        "कसा अर्ज", "पायऱ्या", "नोंदणी", "कुठे",
    ],
    "benefit": [
        "benefit", "amount", "money", "how much", "rupees", "payment", "receive",
        "get", "cash", "coverage", "scholarship amount",
        "लाभ", "राशि", "पैसे", "कितना", "रुपये", "भुगतान",
        "रक्कम", "किती", "मिळेल",
    ],
}

# ─── MULTILINGUAL RESPONSES ──────────────────────────────────────────────────
FALLBACK_RESPONSES = {
    "en": "I couldn't find a specific answer for that query. Please visit the official scheme portal for accurate information or contact your nearest Common Service Center (CSC).",
    "hi": "मुझे इस प्रश्न का सटीक उत्तर नहीं मिला। कृपया आधिकारिक पोर्टल देखें या अपने नजदीकी जन सेवा केंद्र (CSC) से संपर्क करें।",
    "mr": "या प्रश्नाचे नेमके उत्तर मला सापडले नाही. कृपया अधिकृत पोर्टल पहा किंवा जवळच्या सामान्य सेवा केंद्राशी (CSC) संपर्क साधा.",
}

TIMELINE_DEFAULT = {
    "en": "Typically, document verification takes 30–45 working days after submission. Direct benefit transfers credit into your bank account shortly after DM approval.",
    "hi": "आमतौर पर, दस्तावेज़ सत्यापन में जमा करने के बाद 30–45 कार्य दिवस लगते हैं। डीएम की मंजूरी के तुरंत बाद सीधा लाभ हस्तांतरण आपके बैंक खाते में जमा हो जाता है।",
    "mr": "साधारणतः, कागदपत्र पडताळणीस सादर केल्यानंतर 30–45 कामकाजी दिवस लागतात. डीएम मंजुरीनंतर लगेचच थेट लाभ हस्तांतरण तुमच्या बँक खात्यात जमा होते.",
}

STEPS_GENERIC = {
    "en": "General application steps:\n1. Register on the official portal with your Aadhaar and mobile number.\n2. Fill in your personal and family details.\n3. Upload required documents (income certificate, caste certificate, bank passbook).\n4. Submit the application before the deadline.\n5. Track status on the portal or at your nearest Common Service Center.",
    "hi": "सामान्य आवेदन चरण:\n1. आधार और मोबाइल नंबर से आधिकारिक पोर्टल पर पंजीकरण करें।\n2. व्यक्तिगत और परिवार की जानकारी भरें।\n3. आवश्यक दस्तावेज़ अपलोड करें।\n4. अंतिम तिथि से पहले आवेदन जमा करें।\n5. पोर्टल पर या CSC पर स्थिति ट्रैक करें।",
    "mr": "सामान्य अर्ज प्रक्रिया:\n1. आधार आणि मोबाइल नंबरसह अधिकृत पोर्टलवर नोंदणी करा.\n2. वैयक्तिक आणि कौटुंबिक माहिती भरा.\n3. आवश्यक कागदपत्रे अपलोड करा.\n4. अंतिम तारखेपूर्वी अर्ज सादर करा.\n5. पोर्टलवर किंवा CSC वर स्थिती ट्रॅक करा.",
}


def is_offtopic(question: str) -> bool:
    q = question.lower()
    for pattern in OFFTOPIC_PATTERNS:
        if re.search(pattern, q):
            return True
    return False


def detect_app_knowledge(question: str, lang: str) -> Optional[str]:
    q = question.lower()
    for key, data in ARTHMITRA_KNOWLEDGE.items():
        for pat in data["patterns"]:
            if pat in q:
                return data["responses"].get(lang, data["responses"]["en"])
    return None


def detect_intent(question: str) -> str:
    question_lower = question.lower()
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if pattern.lower() in question_lower:
                return intent
    return "general"


def find_best_faq_answer(faqs: list, question: str) -> Optional[str]:
    """Simple keyword overlap matching against FAQ entries."""
    if not faqs:
        return None
    question_words = set(re.findall(r'\w+', question.lower()))
    best_score = 0
    best_answer = None
    for faq in faqs:
        q_words = set(re.findall(r'\w+', faq.get("q", "").lower()))
        score = len(question_words & q_words)
        if score > best_score:
            best_score = score
            best_answer = faq.get("a")
    return best_answer if best_score >= 2 else None


def get_personalized_recommendations(user_context: dict, lang: str, db: Session) -> str:
    name = user_context.get("full_name") or user_context.get("name") or "Citizen"
    state = user_context.get("state")
    occ = user_context.get("occupation") or "Citizen"
    caste = user_context.get("caste_category") or user_context.get("caste")
    inc = user_context.get("annual_income") or user_context.get("income")

    query = db.query(LiveScheme).filter(LiveScheme.is_active == True)
    if state:
        query = query.filter((LiveScheme.state == None) | (LiveScheme.state == state))
    
    schemes = query.limit(3).all()
    if not schemes:
        schemes = db.query(LiveScheme).filter(LiveScheme.is_active == True).limit(3).all()

    if lang == "hi":
        res = f"नमस्ते {name}! आपके प्रोफ़ाइल ({occ}"
        if state: res += f", {state}"
        res += ") के आधार पर, यहाँ आपके लिए अनुशंसित शीर्ष योजनाएं हैं:\n"
        for s in schemes:
            res += f"• **{s.scheme_name}**: {s.benefit_amount or s.description[:80]}\n"
        res += "\nआप 'योजनाएं' टैब में जाकर तुरंत आवेदन कर सकते हैं।"
        return res
    elif lang == "mr":
        res = f"नमस्कार {name}! तुमच्या प्रोफाइलनुसार ({occ}"
        if state: res += f", {state}"
        res += "), तुमच्यासाठी सुचवलेल्या शीर्ष योजना:\n"
        for s in schemes:
            res += f"• **{s.scheme_name}**: {s.benefit_amount or s.description[:80]}\n"
        res += "\nतुम्ही 'योजना' टॅबवर जाऊन लगेच अर्ज करू शकता."
        return res
    else:
        res = f"Hello {name}! Based on your profile ({occ}"
        if state: res += f" in {state}"
        res += "), here are top recommended welfare schemes for you:\n"
        for s in schemes:
            res += f"• **{s.scheme_name}**: {s.benefit_amount or s.description[:80]}\n"
        res += "\nYou can apply directly under the Schemes tab."
        return res


def build_answer(scheme: LiveScheme, intent: str, question: str, lang: str) -> tuple[str, str, str]:
    """Returns (answer, source_description, confidence)."""
    faqs = json.loads(scheme.faq_json) if scheme.faq_json else []
    req_docs = json.loads(scheme.required_docs) if scheme.required_docs else []

    # 1. Direct FAQ match first
    faq_answer = find_best_faq_answer(faqs, question)
    if faq_answer:
        return faq_answer, "scheme_faq", "high"

    # 2. Intent-based responses
    if intent == "timeline":
        return TIMELINE_DEFAULT[lang], "general_knowledge", "medium"

    if intent == "eligibility":
        parts = []
        if scheme.eligibility_caste and scheme.eligibility_caste != "ALL":
            caste_labels = {"en": f"Category: {scheme.eligibility_caste}", "hi": f"श्रेणी: {scheme.eligibility_caste}", "mr": f"प्रवर्ग: {scheme.eligibility_caste}"}
            parts.append(caste_labels[lang])
        if scheme.eligibility_income_max:
            inc = f"₹{int(scheme.eligibility_income_max):,}"
            income_labels = {"en": f"Maximum annual income: {inc}", "hi": f"अधिकतम वार्षिक आय: {inc}", "mr": f"कमाल वार्षिक उत्पन्न: {inc}"}
            parts.append(income_labels[lang])
        if scheme.eligibility_gender and scheme.eligibility_gender != "ALL":
            gender_labels = {"en": f"Gender: {scheme.eligibility_gender} only", "hi": f"लिंग: केवल {scheme.eligibility_gender}", "mr": f"लिंग: फक्त {scheme.eligibility_gender}"}
            parts.append(gender_labels[lang])
        if scheme.eligibility_occupation:
            occ_labels = {"en": f"Occupation: {scheme.eligibility_occupation}", "hi": f"व्यवसाय: {scheme.eligibility_occupation}", "mr": f"व्यवसाय: {scheme.eligibility_occupation}"}
            parts.append(occ_labels[lang])
        if scheme.eligibility_age_min or scheme.eligibility_age_max:
            age_str = f"{scheme.eligibility_age_min or ''}–{scheme.eligibility_age_max or ''}"
            age_labels = {"en": f"Age range: {age_str} years", "hi": f"आयु सीमा: {age_str} वर्ष", "mr": f"वयोमर्यादा: {age_str} वर्षे"}
            parts.append(age_labels[lang])
        if parts:
            prefixes = {
                "en": f"Eligibility criteria for {scheme.scheme_name}:\n• ",
                "hi": f"{scheme.scheme_name} के लिए पात्रता मानदंड:\n• ",
                "mr": f"{scheme.scheme_name} साठी पात्रता निकष:\n• ",
            }
            return prefixes[lang] + "\n• ".join(parts), "scheme_data", "high"

    if intent == "documents":
        if req_docs:
            doc_map = {
                "aadhaar": "Aadhaar Card / आधार कार्ड",
                "income_cert": "Income Certificate / उत्पन्नाचा दाखला",
                "caste_cert": "Caste Certificate / जात प्रमाणपत्र",
                "ration_card": "Ration Card / रेशन कार्ड",
                "bank_passbook": "Bank Passbook / बँक पासबुक",
                "land_record": "Land Record / जमीन उतारा",
                "pan_card": "PAN Card",
                "voter_id": "Voter ID Card",
            }
            docs_str = "\n• ".join([doc_map.get(d, d) for d in req_docs])
            prefixes = {
                "en": f"Required documents for {scheme.scheme_name}:\n• ",
                "hi": f"{scheme.scheme_name} के लिए आवश्यक दस्तावेज़:\n• ",
                "mr": f"{scheme.scheme_name} साठी आवश्यक कागदपत्रे:\n• ",
            }
            return prefixes[lang] + docs_str, "scheme_data", "high"

    if intent == "steps":
        if scheme.official_link:
            steps_suffix = {
                "en": f"\n\nOfficial Portal: {scheme.official_link}",
                "hi": f"\n\nआधिकारिक पोर्टल: {scheme.official_link}",
                "mr": f"\n\nअधिकृत पोर्टल: {scheme.official_link}",
            }
            return STEPS_GENERIC[lang] + steps_suffix[lang], "general_knowledge", "medium"
        return STEPS_GENERIC[lang], "general_knowledge", "medium"

    if intent == "benefit":
        if scheme.benefit_amount:
            prefixes = {
                "en": f"The benefit under {scheme.scheme_name} is: {scheme.benefit_amount}",
                "hi": f"{scheme.scheme_name} के तहत लाभ है: {scheme.benefit_amount}",
                "mr": f"{scheme.scheme_name} अंतर्गत लाभ आहे: {scheme.benefit_amount}",
            }
            return prefixes[lang], "scheme_data", "high"

    if scheme.description:
        prefixes = {
            "en": f"About {scheme.scheme_name}: ",
            "hi": f"{scheme.scheme_name} के बारे में: ",
            "mr": f"{scheme.scheme_name} बद्दल: ",
        }
        return prefixes[lang] + scheme.description, "scheme_description", "medium"

    return FALLBACK_RESPONSES[lang], "fallback", "low"


@router.post("/chat", response_model=ChatResponse)
def scheme_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Multilingual, context-aware chatbot endpoint for ArthMitra AI.
    Handles off-topic questions, ArthMitra app knowledge, personalized scheme match, and scheme search.
    """
    lang = req.language if req.language in ("en", "hi", "mr") else "en"

    # 1. Check off-topic questions first
    if is_offtopic(req.question):
        return ChatResponse(
            answer=OFFTOPIC_RESPONSES[lang],
            sources=["arthmitra_policy"],
            confidence="high"
        )

    # 2. Check ArthMitra App Feature Knowledge
    app_ans = detect_app_knowledge(req.question, lang)
    if app_ans:
        return ChatResponse(
            answer=app_ans,
            sources=["arthmitra_knowledge_base"],
            confidence="high"
        )

    # 3. Check Personalized Eligibility / Scheme Matching
    q_lower = req.question.lower()
    if any(k in q_lower for k in ["eligible", "which scheme", "my scheme", "for me", "recommend", "पात्र", "माझ्यासाठी"]):
        if req.user_context:
            pers_ans = get_personalized_recommendations(req.user_context, lang, db)
            return ChatResponse(
                answer=pers_ans,
                sources=["personalized_matcher", "live_db"],
                confidence="high"
            )

    # 4. Search in Live Schemes DB by scheme_name or question keywords
    scheme = None
    if req.scheme_name:
        scheme = db.query(LiveScheme).filter(
            LiveScheme.scheme_name.ilike(f"%{req.scheme_name}%"),
            LiveScheme.is_active == True,
        ).first()

    if not scheme:
        # Search question text against live scheme names or descriptions
        all_schemes = db.query(LiveScheme).filter(LiveScheme.is_active == True).all()
        for s in all_schemes:
            if s.scheme_name.lower() in q_lower or any(word in q_lower for word in s.scheme_name.lower().split()):
                scheme = s
                break

    if not scheme:
        # Provide generic helpful intent response
        intent = detect_intent(req.question)
        if intent == "steps":
            return ChatResponse(answer=STEPS_GENERIC[lang], sources=["general"], confidence="low")
        if intent == "timeline":
            return ChatResponse(answer=TIMELINE_DEFAULT[lang], sources=["general"], confidence="low")
        return ChatResponse(answer=FALLBACK_RESPONSES[lang], sources=["general"], confidence="low")

    intent = detect_intent(req.question)
    answer, source, confidence = build_answer(scheme, intent, req.question, lang)

    return ChatResponse(
        answer=answer,
        sources=[source, scheme.source_portal or "official"],
        confidence=confidence,
    )
