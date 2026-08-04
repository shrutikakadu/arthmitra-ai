import json
import math

def calculate_health_score(profile: dict) -> dict:
    """
    AI-powered Financial Health Score calculation.
    Scores 0-100 across 5 dimensions with a personalised roadmap.
    """
    age         = int(profile.get("age") or 30)
    income      = float(profile.get("income") or 0)
    occupation  = (profile.get("occupation") or "").lower()
    caste       = (profile.get("caste") or "general").lower()
    family_size = int(profile.get("family_size") or 4)
    gender      = (profile.get("gender") or "").lower()
    education   = (profile.get("education") or "").lower()

    # ── Dimension 1: Income Adequacy (0-30) ──────────────────────
    per_capita = income / max(family_size, 1)
    if per_capita >= 100000:
        income_score = 30
    elif per_capita >= 60000:
        income_score = 24
    elif per_capita >= 36000:
        income_score = 18
    elif per_capita >= 18000:
        income_score = 12
    elif per_capita >= 6000:
        income_score = 7
    else:
        income_score = 3

    # ── Dimension 2: Scheme Coverage (0-25) ──────────────────────
    scheme_pts = 5  # base
    if occupation == "farmer":
        scheme_pts += 7
    if income <= 200000:
        scheme_pts += 5
    if caste in ["sc", "st", "obc"]:
        scheme_pts += 5
    if gender == "female":
        scheme_pts += 3
    scheme_score = min(25, scheme_pts)

    # ── Dimension 3: Savings Potential (0-20) ────────────────────
    monthly_income = income / 12
    # Rough estimate: save 20% of income
    savings_ratio = 0.20 if income > 50000 else 0.10 if income > 20000 else 0.05
    annual_savings = monthly_income * 12 * savings_ratio
    if annual_savings >= 50000:
        savings_score = 20
    elif annual_savings >= 25000:
        savings_score = 16
    elif annual_savings >= 10000:
        savings_score = 12
    elif annual_savings >= 3000:
        savings_score = 7
    else:
        savings_score = 3

    # ── Dimension 4: Education / Skill Level (0-15) ──────────────
    edu_map = {
        "graduate": 15, "post graduate": 15, "postgraduate": 15,
        "12th pass": 11, "higher secondary": 11,
        "10th pass": 8,  "matriculate": 8,
        "8th pass": 5,
        "literate": 3, "illiterate": 1, "": 4
    }
    edu_score = edu_map.get(education, 6)

    # ── Dimension 5: Social Security Coverage (0-10) ─────────────
    social_pts = 2
    if income <= 300000:   social_pts += 3  # likely BPL card eligible
    if age >= 60:          social_pts += 2  # senior citizen schemes
    if caste in ["sc","st"]: social_pts += 2
    social_score = min(10, social_pts)

    total = income_score + scheme_score + savings_score + edu_score + social_score
    total = min(100, total)

    # Grade
    if total >= 80:   grade = "A"
    elif total >= 65: grade = "B"
    elif total >= 50: grade = "C"
    elif total >= 35: grade = "D"
    else:             grade = "F"

    # Roadmap
    roadmap = []
    if income_score < 20:
        roadmap.append({"priority": "HIGH", "action": "Apply for PM Kisan / MGNREGA to boost household income", "impact": "+8 pts"})
    if scheme_score < 18:
        roadmap.append({"priority": "HIGH", "action": "Run Scheme Matcher to discover unclaimed benefits", "impact": "+6 pts"})
    if savings_score < 14:
        roadmap.append({"priority": "MEDIUM", "action": "Open Post Office RD with ₹500/month — builds ₹6,600/yr", "impact": "+5 pts"})
    if edu_score < 10:
        roadmap.append({"priority": "MEDIUM", "action": "Enroll in PM Kaushal Vikas Yojana (free skill training)", "impact": "+4 pts"})
    if social_score < 7:
        roadmap.append({"priority": "LOW", "action": "Register for Ayushman Bharat PM-JAY health coverage", "impact": "+3 pts"})

    return {
        "status": "ok",
        "score": total,
        "grade": grade,
        "dimensions": {
            "income_adequacy":   {"score": income_score,  "max": 30, "label": "Income Adequacy"},
            "scheme_coverage":   {"score": scheme_score,  "max": 25, "label": "Scheme Coverage"},
            "savings_potential": {"score": savings_score, "max": 20, "label": "Savings Potential"},
            "education_level":   {"score": edu_score,     "max": 15, "label": "Education Level"},
            "social_security":   {"score": social_score,  "max": 10, "label": "Social Security"},
        },
        "roadmap": roadmap,
        "summary": f"Your Family Financial Health Score is {total}/100 (Grade {grade}). " +
                   ("Excellent coverage! Keep investing." if total >= 80 else
                    "Good standing — a few improvements can push you higher." if total >= 65 else
                    "Moderate — several unclaimed benefits can boost your score significantly." if total >= 50 else
                    "Needs attention — please use Scheme Matcher to discover your eligible benefits." if total >= 35 else
                    "Critical — you qualify for major welfare programs. Act today.")
    }
