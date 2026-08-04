def recommend_savings(profile: dict) -> dict:
    """
    Decision-tree based Micro-Savings Recommender.
    Recommends Post Office, Jan Dhan, KVP, SIP plans with 1/3/5-year projections.
    """
    income      = float(profile.get("income") or 0)
    age         = int(profile.get("age") or 30)
    family_size = int(profile.get("family_size") or 4)
    occupation  = (profile.get("occupation") or "").lower()

    monthly_income = income / 12
    # Safe savings capacity: 10-20% of monthly income
    if income >= 300000:
        save_pct = 0.20
    elif income >= 150000:
        save_pct = 0.15
    elif income >= 60000:
        save_pct = 0.10
    else:
        save_pct = 0.05

    monthly_save = max(100, monthly_income * save_pct)

    def fv(monthly, rate_annual, years):
        r = rate_annual / 12
        n = years * 12
        if r == 0:
            return monthly * n
        return monthly * ((((1 + r) ** n) - 1) / r) * (1 + r)

    plans = []

    # ── 1. Post Office RD (6.7% p.a.) ────────────────────────────
    rd_monthly = max(100, round(monthly_save * 0.4 / 100) * 100)
    plans.append({
        "name": "Post Office Recurring Deposit",
        "icon": "🏣",
        "monthly_amount": rd_monthly,
        "interest_rate": 6.7,
        "type": "Government-backed",
        "risk": "Zero Risk",
        "projections": {
            "1yr": round(fv(rd_monthly, 0.067, 1)),
            "3yr": round(fv(rd_monthly, 0.067, 3)),
            "5yr": round(fv(rd_monthly, 0.067, 5)),
        },
        "best_for": "Safe guaranteed returns",
        "how_to": "Visit nearest Post Office. Minimum ₹100/month.",
        "dc_node": "savings-node-01"
    })

    # ── 2. Jan Dhan SIP / PMJJBY ─────────────────────────────────
    plans.append({
        "name": "Jan Dhan SIP + PM Jeevan Jyoti",
        "icon": "🏦",
        "monthly_amount": 100,
        "interest_rate": 4.0,
        "type": "Government Scheme",
        "risk": "Zero Risk",
        "projections": {
            "1yr": round(fv(100, 0.04, 1) + 200000),   # insurance cover
            "3yr": round(fv(100, 0.04, 3) + 200000),
            "5yr": round(fv(100, 0.04, 5) + 200000),
        },
        "best_for": "Insurance + savings combo",
        "how_to": "Open Jan Dhan account. Premium ₹436/year for ₹2L insurance.",
        "dc_node": "savings-node-01"
    })

    # ── 3. Kisan Vikas Patra (KVP) — doubles in ~115 months ──────
    lump = max(1000, round(monthly_save * 2 / 1000) * 1000)
    plans.append({
        "name": "Kisan Vikas Patra (KVP)",
        "icon": "📜",
        "monthly_amount": 0,
        "lump_sum": lump,
        "interest_rate": 7.5,
        "type": "Government-backed",
        "risk": "Zero Risk",
        "projections": {
            "1yr": round(lump * (1.075 ** 1)),
            "3yr": round(lump * (1.075 ** 3)),
            "5yr": round(lump * (1.075 ** 5)),
        },
        "best_for": "Lump-sum investment that doubles",
        "how_to": "Available at Post Office. Min ₹1,000.",
        "dc_node": "savings-node-01"
    })

    # ── 4. Atal Pension Yojana (APY) — if age < 40 ───────────────
    if age < 40:
        apy_monthly = {18: 42, 25: 76, 30: 116, 35: 181, 39: 264}.get(
            min([18,25,30,35,39], key=lambda x: abs(x-age)), 116
        )
        plans.append({
            "name": "Atal Pension Yojana (APY)",
            "icon": "🧓",
            "monthly_amount": apy_monthly,
            "interest_rate": 0,
            "type": "Government Pension",
            "risk": "Zero Risk",
            "projections": {
                "1yr":  apy_monthly * 12,
                "3yr":  apy_monthly * 36,
                "5yr":  apy_monthly * 60,
            },
            "pension_at_60": 5000,
            "best_for": "Guaranteed ₹5,000/month pension at age 60",
            "how_to": "Open through any bank or Post Office. Age 18–40 eligible.",
            "dc_node": "savings-node-01"
        })

    # ── 5. Farmer-specific: PM Kisan deposit ─────────────────────
    if occupation == "farmer":
        pm_amount = monthly_save * 0.3
        plans.append({
            "name": "PM Kisan + RD Combo",
            "icon": "🌾",
            "monthly_amount": round(pm_amount),
            "interest_rate": 6.7,
            "type": "Scheme + Savings",
            "risk": "Zero Risk",
            "projections": {
                "1yr": round(fv(pm_amount, 0.067, 1) + 6000),
                "3yr": round(fv(pm_amount, 0.067, 3) + 18000),
                "5yr": round(fv(pm_amount, 0.067, 5) + 30000),
            },
            "best_for": "Farmers — combines PM Kisan ₹6,000/yr with RD",
            "how_to": "Deposit ₹500/month in Post Office RD alongside PM Kisan receipts.",
            "dc_node": "savings-node-01"
        })

    total_monthly = sum(p["monthly_amount"] for p in plans)
    best_5yr = max(plans, key=lambda p: p["projections"]["5yr"])

    return {
        "status": "ok",
        "monthly_savings_capacity": round(monthly_save),
        "total_monthly_commitment": total_monthly,
        "plans": plans,
        "best_plan": best_5yr["name"],
        "summary": f"Based on your income of ₹{income:,.0f}/year, we recommend saving ₹{round(monthly_save):,}/month across {len(plans)} instruments for maximum returns and security."
    }
