import re

def process_voice_text(text: str) -> dict:
    """
    Parses natural language transcription of voice input to extract user profile fields.
    Example: "I am a 35 years old farmer from Maharashtra, general category, income is 150000 and 4 family members"
    Returns a dictionary of matched fields:
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

    # 1. Age extraction
    # Matches "35 years old", "35 year old", "age 35", "am 35", "age is 35"
    age_match = re.search(r'\b(?:age|am|is)?\s*(\d{1,2})\s*(?:years?|yrs?|old)?\b', text_lower)
    if age_match:
        # Check if the number is within a reasonable age range
        val = int(age_match.group(1))
        if 1 <= val <= 110:
            result["age"] = val

    # 2. Income extraction
    # Matches "income is 150000", "earning 2 lakhs", "1.5 lakh", "120000 rupees"
    # Let's check for standard numbers and lakh keywords
    lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lakh?|lac?)', text_lower)
    if lakh_match:
        try:
            val = float(lakh_match.group(1))
            result["income"] = str(int(val * 100000))
        except ValueError:
            pass
    else:
        # Match plain digits for income (greater than 1000, to avoid mixing with age/family size)
        income_match = re.search(r'\b(?!years?|members?|people)(\d{4,7})\b', text_lower)
        if income_match:
            result["income"] = income_match.group(1)

    # 3. Occupation extraction
    occupations = ["farmer", "laborer", "labor", "labour", "artisan", "self-employed", "student", "teacher", "doctor", "business", "driver", "carpenter", "plumber", "tailor", "shopkeeper", "retired"]
    for occ in occupations:
        if occ in text_lower:
            # Map standard output occupations
            if occ in ["labor", "labour", "laborer"]:
                result["occupation"] = "Labour"
            elif occ == "farmer":
                result["occupation"] = "Farmer"
            else:
                result["occupation"] = occ.capitalize()
            break

    # 4. State extraction
    states = [
        "maharashtra", "uttar pradesh", "rajasthan", "madhya pradesh", "bihar",
        "gujarat", "west bengal", "tamil nadu", "karnataka", "andhra pradesh",
        "kerala", "odisha", "punjab", "haryana", "jharkhand", "chhattisgarh",
        "assam", "telangana", "delhi"
    ]
    for state in states:
        if state in text_lower:
            # Capitalize each word properly
            result["state"] = " ".join([w.capitalize() for w in state.split()])
            break

    # 5. Caste Category extraction
    caste_map = {
        "general": "General",
        "obc": "OBC",
        "other backward": "OBC",
        "sc": "SC",
        "scheduled caste": "SC",
        "st": "ST",
        "scheduled tribe": "ST",
        "ews": "EWS",
        "economically weaker": "EWS"
    }
    for key, val in caste_map.items():
        if key in text_lower:
            result["caste"] = val
            break

    # 6. Family Size extraction
    # Matches "family of 5", "5 members", "5 family members", "size of 4"
    family_match = re.search(r'\b(?:family of|family size|size of)?\s*(\d{1,2})\s*(?:members?|people|family)?\b', text_lower)
    if family_match:
        # Skip if it was already matched as age (just simple heuristic comparison)
        val = int(family_match.group(1))
        if 1 <= val <= 20 and val != result.get("age"):
            result["family_size"] = val

    # 7. Gender extraction
    if "female" in text_lower or "woman" in text_lower or "girl" in text_lower:
        result["gender"] = "Female"
    elif "male" in text_lower or "man" in text_lower or "boy" in text_lower:
        result["gender"] = "Male"

    return result
