"""
ArthMitra AI — Helper AI Chat Routes (Scheme Support Bot)
RAG-inspired keyword matching against scheme FAQ + description.
Provides natural language Q&A in English, Hindi, and Marathi.
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
    scheme_name: str
    question: str
    language: str = "en"   # en | hi | mr
    user_context: Optional[dict] = None  # optional profile for personalized answers


class ChatResponse(BaseModel):
    answer: str
    sources: list = []
    confidence: str = "medium"  # high | medium | low


# ─── KEYWORD INTENT DETECTION ────────────────────────────────────────────────
INTENT_PATTERNS = {
    "timeline": [
        # English
        "how long", "how many days", "days", "weeks", "time", "duration", "processing",
        "verification time", "when will", "take time", "approval time",
        # Hindi
        "कितने दिन", "कितना समय", "कब", "दिन", "सप्ताह", "प्रक्रिया",
        # Marathi
        "किती दिवस", "किती वेळ", "कधी", "दिवस", "आठवडे", "कालावधी",
    ],
    "eligibility": [
        # English
        "eligible", "qualify", "who can", "can i", "can second", "am i", "criteria",
        "income limit", "caste", "age limit", "who is", "requirements", "minimum",
        "second year", "engineering", "student",
        # Hindi
        "पात्र", "योग्य", "कौन", "मैं", "पात्रता", "आय सीमा", "जाति", "आयु",
        "कर सकता", "क्या मैं", "मेरिट",
        # Marathi
        "पात्र", "योग्य", "कोण", "मी", "पात्रता", "उत्पन्न", "जात", "वय",
        "करू शकतो", "मला",
    ],
    "documents": [
        # English
        "document", "documents", "upload", "certificate", "aadhaar", "income certificate",
        "what to submit", "papers", "required", "proof",
        # Hindi
        "दस्तावेज़", "आधार", "प्रमाण पत्र", "अपलोड", "जमा",
        # Marathi
        "कागदपत्रे", "आधार", "प्रमाणपत्र", "अपलोड", "जमा",
    ],
    "steps": [
        # English
        "how to apply", "steps", "process", "register", "where to apply", "portal",
        "how do i", "how can i", "procedure", "apply online", "application process",
        # Hindi
        "कैसे आवेदन", "कदम", "प्रक्रिया", "पंजीकरण", "कहाँ", "पोर्टल",
        "ऑनलाइन",
        # Marathi
        "कसा अर्ज", "पायऱ्या", "प्रक्रिया", "नोंदणी", "कुठे", "पोर्टल",
        "ऑनलाइन",
    ],
    "benefit": [
        # English
        "benefit", "amount", "money", "how much", "rupees", "payment", "receive",
        "get", "cash", "coverage", "scholarship amount",
        # Hindi
        "लाभ", "राशि", "पैसे", "कितना", "रुपये", "भुगतान", "मिलता",
        # Marathi
        "लाभ", "रक्कम", "पैसे", "किती", "रुपये", "मिळेल", "अनुदान",
    ],
}

# ─── MULTILINGUAL RESPONSES ──────────────────────────────────────────────────
FALLBACK_RESPONSES = {
    "en": "I couldn't find a specific answer for that query. Please visit the official scheme portal for accurate information or contact your nearest Common Service Center (CSC).",
    "hi": "मुझे इस प्रश्न का सटीक उत्तर नहीं मिला। कृपया आधिकारिक पोर्टल देखें या अपने नजदीकी जन सेवा केंद्र (CSC) से संपर्क करें।",
    "mr": "या प्रश्नाचे नेमके उत्तर मला सापडले नाही. कृपया अधिकृत पोर्टल पहा किंवा जवळच्या सामान्य सेवा केंद्राशी (CSC) संपर्क साधा.",
}

TIMELINE_DEFAULT = {
    "en": "Typically, document verification takes 30–45 working days after submission. NSP scholarships usually credit amounts within 3–4 months after the deadline.",
    "hi": "आमतौर पर, दस्तावेज़ सत्यापन में जमा करने के बाद 30–45 कार्य दिवस लगते हैं। NSP छात्रवृत्ति की राशि आमतौर पर अंतिम तिथि के 3–4 महीने बाद जमा होती है।",
    "mr": "साधारणतः, कागदपत्र पडताळणीस सादर केल्यानंतर 30–45 कामकाजी दिवस लागतात. NSP शिष्यवृत्तींची रक्कम अंतिम तारखेनंतर 3–4 महिन्यांत जमा होते.",
}

STEPS_GENERIC = {
    "en": "General application steps:\n1. Register on the official portal with your Aadhaar and mobile number.\n2. Fill in your personal and family details.\n3. Upload required documents (income certificate, caste certificate, bank passbook).\n4. Submit the application before the deadline.\n5. Track status on the portal or at your nearest Common Service Center.",
    "hi": "सामान्य आवेदन चरण:\n1. आधार और मोबाइल नंबर से आधिकारिक पोर्टल पर पंजीकरण करें।\n2. व्यक्तिगत और परिवार की जानकारी भरें।\n3. आवश्यक दस्तावेज़ अपलोड करें।\n4. अंतिम तिथि से पहले आवेदन जमा करें।\n5. पोर्टल पर या CSC पर स्थिति ट्रैक करें।",
    "mr": "सामान्य अर्ज प्रक्रिया:\n1. आधार आणि मोबाइल नंबरसह अधिकृत पोर्टलवर नोंदणी करा.\n2. वैयक्तिक आणि कौटुंबिक माहिती भरा.\n3. आवश्यक कागदपत्रे अपलोड करा.\n4. अंतिम तारखेपूर्वी अर्ज सादर करा.\n5. पोर्टलवर किंवा CSC वर स्थिती ट्रॅक करा.",
}


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
    # Only use FAQ match if there's reasonable overlap (at least 2 words)
    return best_answer if best_score >= 2 else None


def build_answer(scheme: LiveScheme, intent: str, question: str, lang: str) -> tuple[str, str, str]:
    """Returns (answer, source_description, confidence)."""
    faqs = json.loads(scheme.faq_json) if scheme.faq_json else []
    req_docs = json.loads(scheme.required_docs) if scheme.required_docs else []

    # 1. Try direct FAQ match first (highest confidence)
    faq_answer = find_best_faq_answer(faqs, question)
    if faq_answer:
        return faq_answer, "scheme_faq", "high"

    # 2. Intent-based structured responses
    if intent == "timeline":
        return TIMELINE_DEFAULT[lang], "general_knowledge", "medium"

    if intent == "eligibility":
        parts = []
        if scheme.eligibility_caste and scheme.eligibility_caste != "ALL":
            caste_labels = {
                "en": f"Category: {scheme.eligibility_caste}",
                "hi": f"श्रेणी: {scheme.eligibility_caste}",
                "mr": f"प्रवर्ग: {scheme.eligibility_caste}",
            }
            parts.append(caste_labels[lang])
        if scheme.eligibility_income_max:
            inc = f"₹{int(scheme.eligibility_income_max):,}"
            income_labels = {
                "en": f"Maximum annual income: {inc}",
                "hi": f"अधिकतम वार्षिक आय: {inc}",
                "mr": f"कमाल वार्षिक उत्पन्न: {inc}",
            }
            parts.append(income_labels[lang])
        if scheme.eligibility_gender and scheme.eligibility_gender != "ALL":
            gender_labels = {
                "en": f"Gender: {scheme.eligibility_gender} only",
                "hi": f"लिंग: केवल {scheme.eligibility_gender}",
                "mr": f"लिंग: फक्त {scheme.eligibility_gender}",
            }
            parts.append(gender_labels[lang])
        if scheme.eligibility_occupation:
            occ_labels = {
                "en": f"Occupation: {scheme.eligibility_occupation}",
                "hi": f"व्यवसाय: {scheme.eligibility_occupation}",
                "mr": f"व्यवसाय: {scheme.eligibility_occupation}",
            }
            parts.append(occ_labels[lang])
        if scheme.eligibility_age_min or scheme.eligibility_age_max:
            age_str = f"{scheme.eligibility_age_min or ''}–{scheme.eligibility_age_max or ''}"
            age_labels = {
                "en": f"Age range: {age_str} years",
                "hi": f"आयु सीमा: {age_str} वर्ष",
                "mr": f"वयोमर्यादा: {age_str} वर्षे",
            }
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

    # 3. Fallback: use scheme description
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
    RAG-style scheme support chatbot endpoint.
    Matches user question against scheme FAQ + structured data.
    Falls back to general guidance if no specific match found.
    """
    lang = req.language if req.language in ("en", "hi", "mr") else "en"

    # Look up the scheme in live DB
    scheme = db.query(LiveScheme).filter(
        LiveScheme.scheme_name.ilike(f"%{req.scheme_name}%"),
        LiveScheme.is_active == True,
    ).first()

    if not scheme:
        # Scheme not in live DB — provide generic helpful response
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
