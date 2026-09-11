import re

# ─── NUMBER WORD TABLES ───────────────────────────────────────────────────────
HINDI_NUMBER_WORDS = {
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5,
    "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "ग्यारह": 11, "बारह": 12, "तेरह": 13, "चौदह": 14, "पंद्रह": 15,
    "सोलह": 16, "सत्रह": 17, "अठारह": 18, "उन्नीस": 19, "बीस": 20,
    "तीस": 30, "चालीस": 40, "पचास": 50, "साठ": 60, "सत्तर": 70,
    "अस्सी": 80, "नब्बे": 90, "सौ": 100,
}
MARATHI_NUMBER_WORDS = {
    "एक": 1, "दोन": 2, "तीन": 3, "चार": 4, "पाच": 5,
    "सहा": 6, "सात": 7, "आठ": 8, "नऊ": 9, "दहा": 10,
    "अकरा": 11, "बारा": 12, "तेरा": 13, "चौदा": 14, "पंधरा": 15,
    "सोळा": 16, "सतरा": 17, "अठरा": 18, "एकोणीस": 19, "वीस": 20,
    "तीस": 30, "चाळीस": 40, "पन्नास": 50, "साठ": 60, "सत्तर": 70,
    "ऐंशी": 80, "नव्वद": 90, "शंभर": 100,
}

# Lakh keywords in different languages
LAKH_KEYWORDS = ["lakh", "lac", "lacs", "lakhs", "लाख", "लक्ष"]


def _extract_lakh_amount(text: str) -> str:
    """Extract income expressed in lakhs (any language)."""
    # Numeric + lakh keyword
    lakh_match = re.search(
        r'(\d+(?:\.\d+)?)\s*(?:' + '|'.join(LAKH_KEYWORDS) + r')',
        text, re.IGNORECASE | re.UNICODE
    )
    if lakh_match:
        try:
            return str(int(float(lakh_match.group(1)) * 100000))
        except ValueError:
            pass

    # Hindi/Marathi number word + lakh (e.g. "दो लाख", "तीन लक्ष")
    all_number_words = {**HINDI_NUMBER_WORDS, **MARATHI_NUMBER_WORDS}
    for word, val in all_number_words.items():
        pattern = word + r'\s*(?:' + '|'.join(LAKH_KEYWORDS) + r')'
        if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
            return str(val * 100000)
    return ""


def _extract_number_word(text: str, word_map: dict) -> int:
    """Return the first number word found in the text from the given map."""
    for word, val in word_map.items():
        if word in text:
            return val
    return 0


def process_voice_text(text: str) -> dict:
    """
    Parses natural language transcription (English, Hindi, Marathi) of voice input
    to extract user profile fields.

    Example inputs:
      EN: "I am a 35 years old farmer from Maharashtra, general category, income is 150000 and 4 family members"
      HI: "मैं 35 साल का किसान हूं, महाराष्ट्र से, ओबीसी श्रेणी, आय दो लाख है"
      MR: "मी महाराष्ट्रातील 28 वर्षांचा शेतकरी आहे, जात OBC, उत्पन्न दीड लाख"

    Returns a dict of matched fields:
    {
      "age": int or "",
      "occupation": str or "",
      "income": str or "",
      "state": str or "",
      "caste": str or "",
      "family_size": int or "",
      "gender": str or ""
    }
    """
    if not text:
        return {}

    text_lower = text.lower()
    result = {
        "age": "",
        "occupation": "",
        "income": "",
        "state": "",
        "caste": "",
        "family_size": "",
        "gender": ""
    }

    # ─── 1. AGE ──────────────────────────────────────────────────────────────
    # English: "35 years old", "age 35", "am 35"
    age_match = re.search(
        r'\b(?:age|am|is)?\s*(\d{1,2})\s*(?:years?|yrs?|old|साल|वर्ष|वर्षे|वर्षांचा|वर्षाचा)?\b',
        text_lower, re.UNICODE
    )
    if age_match:
        val = int(age_match.group(1))
        if 1 <= val <= 110:
            result["age"] = val

    # Hindi/Marathi age word fallback
    if not result["age"]:
        all_numbers = {**HINDI_NUMBER_WORDS, **MARATHI_NUMBER_WORDS}
        age_ctx = re.search(r'(\w+)\s*(?:साल|वर्ष|वर्षे|वर्षांचा)', text, re.UNICODE)
        if age_ctx:
            word = age_ctx.group(1)
            if word in all_numbers and 1 <= all_numbers[word] <= 110:
                result["age"] = all_numbers[word]

    # ─── 2. INCOME ───────────────────────────────────────────────────────────
    lakh_income = _extract_lakh_amount(text_lower)
    if lakh_income:
        result["income"] = lakh_income
    else:
        income_match = re.search(r'\b(?!years?|members?|people)(\d{4,7})\b', text_lower)
        if income_match:
            result["income"] = income_match.group(1)

    # ─── 3. OCCUPATION ───────────────────────────────────────────────────────
    OCCUPATION_MAP = {
        # English keywords
        "farmer": "Farmer", "agriculture": "Farmer", "kisan": "Farmer",
        "किसान": "Farmer", "शेतकरी": "Farmer",
        "laborer": "Labour", "labor": "Labour", "labour": "Labour",
        "मजदूर": "Labour", "कामगार": "Labour",
        "student": "Student", "विद्यार्थी": "Student", "छात्र": "Student",
        "teacher": "Teacher", "शिक्षक": "Teacher",
        "doctor": "Doctor", "डॉक्टर": "Doctor",
        "business": "Business", "व्यापार": "Business", "व्यवसाय": "Business",
        "driver": "Driver", "ड्राइवर": "Driver",
        "self-employed": "Self-Employed", "स्वयंरोजगार": "Self-Employed",
        "artisan": "Artisan", "कारागीर": "Artisan",
        "shopkeeper": "Shopkeeper", "दुकानदार": "Shopkeeper",
        "retired": "Retired", "निवृत्त": "Retired",
        "homemaker": "Homemaker", "गृहिणी": "Homemaker",
        "unemployed": "Unemployed", "बेरोजगार": "Unemployed",
    }
    for keyword, occ in OCCUPATION_MAP.items():
        if keyword in text_lower or keyword in text:
            result["occupation"] = occ
            break

    # ─── 4. STATE ────────────────────────────────────────────────────────────
    STATES_MAP = {
        # English
        "maharashtra": "Maharashtra", "uttar pradesh": "Uttar Pradesh",
        "rajasthan": "Rajasthan", "madhya pradesh": "Madhya Pradesh",
        "bihar": "Bihar", "gujarat": "Gujarat", "west bengal": "West Bengal",
        "tamil nadu": "Tamil Nadu", "karnataka": "Karnataka",
        "andhra pradesh": "Andhra Pradesh", "kerala": "Kerala",
        "odisha": "Odisha", "punjab": "Punjab", "haryana": "Haryana",
        "jharkhand": "Jharkhand", "chhattisgarh": "Chhattisgarh",
        "assam": "Assam", "telangana": "Telangana", "delhi": "Delhi",
        # Hindi/Marathi transliterations
        "महाराष्ट्र": "Maharashtra", "मराठी": "Maharashtra",
        "उत्तर प्रदेश": "Uttar Pradesh",
        "राजस्थान": "Rajasthan",
        "मध्य प्रदेश": "Madhya Pradesh",
        "बिहार": "Bihar",
        "गुजरात": "Gujarat",
        "पश्चिम बंगाल": "West Bengal",
        "तमिलनाडु": "Tamil Nadu",
        "कर्नाटक": "Karnataka",
        "केरल": "Kerala",
        "ओडिशा": "Odisha",
        "पंजाब": "Punjab",
        "हरियाणा": "Haryana",
        "दिल्ली": "Delhi",
        "तेलंगाना": "Telangana",
        "आसाम": "Assam",
    }
    for keyword, state in STATES_MAP.items():
        if keyword in text_lower or keyword in text:
            result["state"] = state
            break

    # ─── 5. CASTE ────────────────────────────────────────────────────────────
    CASTE_MAP = {
        # English
        "general": "General", "obc": "OBC", "other backward": "OBC",
        "sc": "SC", "scheduled caste": "SC",
        "st": "ST", "scheduled tribe": "ST",
        "ews": "EWS", "economically weaker": "EWS",
        # Hindi
        "सामान्य": "General", "ओबीसी": "OBC", "अन्य पिछड़ा": "OBC",
        "अनुसूचित जाति": "SC", "अनुसूचित जनजाति": "ST",
        "आर्थिक रूप से कमजोर": "EWS",
        # Marathi
        "खुला": "General", "सर्वसाधारण": "General",
        "इतर मागास": "OBC", "ओ.बी.सी": "OBC",
        "अनुसूचित जात": "SC", "अनुसूचित जमात": "ST",
        "आर्थिकदृष्ट्या दुर्बल": "EWS",
    }
    for keyword, caste in CASTE_MAP.items():
        if keyword.lower() in text_lower or keyword in text:
            result["caste"] = caste
            break

    # ─── 6. FAMILY SIZE ──────────────────────────────────────────────────────
    family_match = re.search(
        r'\b(?:family of|family size|size of)?\s*(\d{1,2})\s*(?:members?|people|family|सदस्य|जण|लोग|माणसे)?\b',
        text_lower, re.UNICODE
    )
    if family_match:
        val = int(family_match.group(1))
        if 1 <= val <= 20 and val != result.get("age"):
            result["family_size"] = val

    # Hindi/Marathi family size fallback
    if not result["family_size"]:
        family_ctx = re.search(
            r'(\w+)\s*(?:सदस्य|जण|लोग|माणसे|परिवार में)',
            text, re.UNICODE
        )
        if family_ctx:
            word = family_ctx.group(1)
            all_numbers = {**HINDI_NUMBER_WORDS, **MARATHI_NUMBER_WORDS}
            if word in all_numbers and 1 <= all_numbers[word] <= 20:
                result["family_size"] = all_numbers[word]

    # ─── 7. GENDER ───────────────────────────────────────────────────────────
    female_words = ["female", "woman", "girl", "महिला", "स्त्री", "बेटी", "मुलगी", "शेतकरी महिला"]
    male_words = ["male", "man", "boy", "पुरुष", "मर्द", "मुलगा", "लड़का"]

    if any(w in text_lower or w in text for w in female_words):
        result["gender"] = "Female"
    elif any(w in text_lower or w in text for w in male_words):
        result["gender"] = "Male"

    return result
