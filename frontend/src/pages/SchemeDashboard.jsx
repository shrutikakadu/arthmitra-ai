import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, AlertCircle, FileText, TrendingUp, Info, HelpCircle, BookOpen } from "lucide-react";
import API from "../api/axios";
import "./SchemeDashboard.css";

// ─── 3D TILT CARD COMPONENT ──────────────────────────────────────────────────
function TiltCard({ children, style, className }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-60, 60], [8, -8]), { stiffness: 350, damping: 25 });
    const rotateY = useSpring(useTransform(x, [-60, 60], [-8, 8]), { stiffness: 350, damping: 25 });

    function onMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;
        x.set(mouseX);
        y.set(mouseY);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            className={className}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ ...style, rotateX, rotateY, transformStyle: "preserve-3d" }}
        >
            {children}
        </motion.div>
    );
}

// ─── DETAILED SCHEME DATA ────────────────────────────────────────────────────
const COMMON_DOCS = {
    aadhaar: { label: "Aadhaar Card", icon: "🪪" },
    income_cert: { label: "Income Certificate", icon: "💰" },
    caste_cert: { label: "Caste Certificate", icon: "📜" },
    ration_card: { label: "Ration Card", icon: "🏠" },
    bank_passbook: { label: "Bank Passbook", icon: "🏦" },
    land_record: { label: "Land Record", icon: "🌾" },
    pan_card: { label: "PAN Card", icon: "💳" },
    voter_id: { label: "Voter ID", icon: "🗳️" }
};

const SCHEME_DETAILS_MAP = {
    "PM Kisan Samman Nidhi": {
        link: "https://pmkisan.gov.in/",
        theory: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a Central Sector Scheme to provide income support to all landholding farmers' families in the country. Under the scheme, an income support of ₹6,000 per year is provided in three equal installments directly into the bank accounts of the beneficiaries.",
        benefits: [
            "Direct income support of ₹6,000 per annum paid in three installments of ₹2,000 each.",
            "Worry-free automatic transfer directly using Aadhaar-enabled bank accounts.",
            "Provides financial assistance to procure seeds, fertilizers, and other farm inputs."
        ],
        docs: ["aadhaar", "land_record", "bank_passbook"],
        steps: [
            "Ensure your land records are updated and mapped with your name.",
            "Visit the official PM-Kisan portal (pmkisan.gov.in) or your nearest CSC.",
            "Navigate to 'New Farmer Registration' and enter your Aadhaar and mobile details.",
            "Fill in land holdings data and upload land record docs.",
            "Submit the application and verify using OTP biometric verification."
        ],
        stats: [
            { year: "2022", budget: 68000, beneficiaries: 10.4 },
            { year: "2023", budget: 60000, beneficiaries: 11.2 },
            { year: "2024", budget: 62000, beneficiaries: 11.8 },
            { year: "2025", budget: 65000, beneficiaries: 12.1 },
            { year: "2026", budget: 68000, beneficiaries: 12.5 }
        ],
        faq: [
            { q: "Who is eligible for PM-Kisan?", a: "All landholding farmers' families who have cultivable land in their names are eligible." },
            { q: "Are institutional landholders eligible?", a: "No, institutional landholders are excluded from the scheme benefits." }
        ]
    },
    "Ayushman Bharat PM-JAY": {
        link: "https://pmjay.gov.in/",
        theory: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY) is the largest health assurance scheme in the world. It aims to provide a health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization to over 12 crore poor and vulnerable families.",
        benefits: [
            "Health cover of ₹5,000,000 (₹5 Lakhs) per family per year.",
            "Cashless and paperless access to healthcare services at any empanelled hospital.",
            "Covers pre-existing diseases, medical examinations, consultations, and post-hospitalization costs."
        ],
        docs: ["aadhaar", "ration_card", "income_cert"],
        steps: [
            "Check your eligibility on the PM-JAY portal or at an empanelled hospital.",
            "Ensure you have a valid Ration Card / Socio-Economic Caste Census (SECC) mapping.",
            "Visit the nearest Ayushman Mitra desk at an empanelled hospital or CSC.",
            "Provide your Aadhaar card and Ration card for biometric verification.",
            "Get your Ayushman Golden Card generated for free cashless service."
        ],
        stats: [
            { year: "2022", budget: 6400, beneficiaries: 18.2 },
            { year: "2023", budget: 7200, beneficiaries: 22.4 },
            { year: "2024", budget: 7500, beneficiaries: 26.8 },
            { year: "2025", budget: 8000, beneficiaries: 30.5 },
            { year: "2026", budget: 8500, beneficiaries: 34.2 }
        ],
        faq: [
            { q: "Is there any limit on family size?", a: "No, there is no limit on family size or age of family members." },
            { q: "Is this scheme applicable in private hospitals?", a: "Yes, in all government hospitals and empanelled private hospitals." }
        ]
    },
    "PM Ujjwala Yojana 2.0": {
        link: "https://www.pmuy.gov.in/",
        theory: "Pradhan Mantri Ujjwala Yojana (PMUY) 2.0 was launched to provide deposit-free LPG connections to women from poor households who did not get covered in the first phase. It aims to provide clean cooking fuel to safeguard the health of women and children.",
        benefits: [
            "Free LPG connection with no security deposit required.",
            "First refilled cylinder and hot plate (stove) provided completely free.",
            "₹1,600 financial support per connection."
        ],
        docs: ["aadhaar", "ration_card", "caste_cert", "bank_passbook"],
        steps: [
            "Confirm eligibility (should be an adult woman from a BPL/marginalized household).",
            "Collect verification documents (Aadhaar, Caste Certificate, Ration Card, Bank Passbook).",
            "Apply online through pmuy.gov.in or visit your nearest LPG distributor.",
            "Submit the application form along with KYC details.",
            "Collect the LPG cylinder and gas stove once verified by the distributor."
        ],
        stats: [
            { year: "2022", budget: 8000, beneficiaries: 9.0 },
            { year: "2023", budget: 9600, beneficiaries: 9.6 },
            { year: "2024", budget: 10200, beneficiaries: 10.1 },
            { year: "2025", budget: 11000, beneficiaries: 10.3 },
            { year: "2026", budget: 12000, beneficiaries: 10.6 }
        ],
        faq: [
            { q: "Can men apply for this scheme?", a: "No, the LPG connection must be registered in the name of an adult woman of the household." },
            { q: "Is a caste certificate mandatory?", a: "Yes, for applicants belonging to Scheduled Castes, Scheduled Tribes or other reserved categories." }
        ]
    }
};

export default function SchemeDashboard() {
    const { schemeName } = useParams();
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [userDocs, setUserDocs] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [applying, setApplying] = useState(false);
    const [appliedSuccess, setAppliedSuccess] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            navigate("/");
            return;
        }
        const parsed = JSON.parse(stored);
        setUser(parsed);
        fetchUserDocs(parsed.id);
    }, [navigate]);

    const fetchUserDocs = async (userId) => {
        try {
            const res = await API.get(`/documents/my/${userId}`);
            setUserDocs(res.data);
        } catch (e) {
            console.error("Error loading user documents:", e);
        }
    };

    const handleApplyScheme = async () => {
        if (!user) return;
        setApplying(true);
        try {
            const res = await API.post("/applications/apply", {
                user_id: user.id,
                scheme_name: decodedName,
                category: decodedName.includes("Kisan") || decodedName.includes("Fasal") ? "Agriculture" : decodedName.includes("Ayushman") || decodedName.includes("Bima") ? "Healthcare" : "Welfare",
                benefit: details.benefits?.[0] || "Standard Welfare Grant",
                reason_for_applying: `Eligible citizen (${user.occupation || "Applicant"}, Income: ${user.income || "Standard"}) applying via ArthMitra Direct Pipeline.`
            });
            if (res.data.status === "success") {
                setAppliedSuccess(true);
                alert(`🎉 Application Submitted Successfully!\nPushed to Multi-Stage Queue (ID #${res.data.application_id}). Currently pending Local Admin (Clerk) verification.`);
            }
        } catch (e) {
            console.error("Apply error:", e);
            alert(e.response?.data?.detail || "Application failed");
        } finally {
            setApplying(false);
        }
    };


    // Find scheme details, or construct a dynamic detailed fallback
    const decodedName = decodeURIComponent(schemeName);
    const details = SCHEME_DETAILS_MAP[decodedName] || {
        link: "https://www.myscheme.gov.in/",
        theory: `The ${decodedName} is a government initiative designed to provide financial, educational, social, or welfare support. It targets qualified beneficiaries to improve livelihood, enhance standard of living, and ensure socio-economic inclusion.`,
        benefits: [
            "Enables access to subsidized products, financial aid, or capacity training.",
            "Increases social protection and risk mitigation for vulnerable households.",
            "Empowers individual household members through direct benefit transfers (DBT)."
        ],
        docs: ["aadhaar", "income_cert", "ration_card"],
        steps: [
            "Review key requirements and eligibility parameters.",
            "Assemble the required identification and proof documents.",
            "Apply online through the government portal or visit the nearest CSC office.",
            "Submit your biometric e-KYC or file upload validation.",
            "Follow status updates via sms notification alerts."
        ],
        stats: [
            { year: "2022", budget: 5000, beneficiaries: 5.0 },
            { year: "2023", budget: 5500, beneficiaries: 5.6 },
            { year: "2024", budget: 6200, beneficiaries: 6.2 },
            { year: "2025", budget: 6800, beneficiaries: 7.1 },
            { year: "2026", budget: 7500, beneficiaries: 8.0 }
        ],
        faq: [
            { q: "How can I apply?", a: "You can apply via the portal link provided or visit your local Common Services Center (CSC)." },
            { q: "What documents are required?", a: "Aadhaar card, Income Certificate, and secondary ID proof are typically required." }
        ]
    };

    // Calculate document checklist status
    const docChecklist = details.docs.map(docKey => {
        const matchingDoc = userDocs.find(d => d.doc_type === docKey);
        const meta = COMMON_DOCS[docKey] || { label: docKey.replace("_", " ").toUpperCase(), icon: "📄" };
        
        let status = "missing"; // missing, pending, verified
        if (matchingDoc) {
            status = matchingDoc.status; // 'verified', 'pending', 'rejected' -> fallback to pending
        }

        return {
            key: docKey,
            label: meta.label,
            icon: meta.icon,
            status: status
        };
    });

    const verifiedCount = docChecklist.filter(d => d.status === "verified").length;
    const totalCount = docChecklist.length;
    const readinessScore = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;

    // Palette Colors
    const C = {
        saffron: "#FF6B00",
        green: "#138808",
        bg: "#FFFCF8",
        bgSec: "#FFFDFB",
        border: "#ede8e1",
        text: "#1a1a1a",
        textSoft: "#444",
        textMuted: "#999"
    };

    return (
        <div className="scheme-dash-layout">
            {/* Spinning decorative Ashoka Chakra in background */}
            <div className="scheme-dash-bg-chakra">
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#000080" strokeWidth="2" opacity="0.04" />
                    <circle cx="50" cy="50" r="10" fill="#000080" opacity="0.04" />
                    {Array.from({ length: 24 }, (_, i) => {
                        const a = (i * 15) * Math.PI / 180;
                        return <line key={i} x1={50 + 10 * Math.cos(a)} y1={50 + 10 * Math.sin(a)} x2={50 + 40 * Math.cos(a)} y2={50 + 40 * Math.sin(a)} stroke="#000080" strokeWidth="1" opacity="0.03" />;
                    })}
                </svg>
            </div>

            {/* HEADER */}
            <header className="scheme-dash-header">
                <button className="back-btn" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span className="scheme-category-badge">{decodedName.includes("Kisan") || decodedName.includes("Fasal") ? "🌾 Agriculture" : decodedName.includes("Ayushman") || decodedName.includes("Bima") ? "🏥 Healthcare" : "🏛️ Welfare"}</span>
                            <span className="scheme-status-active">● Active Scheme</span>
                        </div>
                        <h1 className="scheme-title">{decodedName}</h1>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                            onClick={handleApplyScheme}
                            disabled={applying || appliedSuccess}
                            className="apply-btn-main"
                            style={{
                                background: appliedSuccess ? "#16a34a" : "linear-gradient(90deg, #FF6B00 0%, #FF8C00 100%)",
                                border: "none",
                                cursor: applying || appliedSuccess ? "default" : "pointer"
                            }}
                        >
                            {appliedSuccess ? "✓ Application Submitted to Queue" : applying ? "Submitting..." : "🚀 Apply Direct via ArthMitra Pipeline"}
                        </button>
                        <a href={details.link} target="_blank" rel="noopener noreferrer" className="apply-btn-main" style={{ background: "rgba(0,0,0,0.05)", color: "#1a1a1a", border: "1px solid #ddd" }}>
                            Official Portal <ExternalLink size={14} />
                        </a>
                    </div>

                </div>
            </header>

            {/* DASHBOARD CONTENT GRID */}
            <div className="scheme-dash-grid">
                {/* LEFT: Nav Tabs & Main Content */}
                <div className="scheme-dash-main-pane">
                    {/* Navigation Tabs */}
                    <div className="scheme-tab-bar">
                        {[
                            { id: "overview", label: "Overview & Benefits", icon: <BookOpen size={14} /> },
                            { id: "checklist", label: "Documents Checklist", icon: <FileText size={14} /> },
                            { id: "stats", label: "Budget & Stats Impact", icon: <TrendingUp size={14} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`scheme-tab-item ${activeTab === tab.id ? "active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab contents */}
                    {activeTab === "overview" && (
                        <div className="tab-pane animate-fade-in">
                            {/* Theory */}
                            <TiltCard className="theory-card">
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.saffron, marginBottom: 12 }}>Detailed Theory</h3>
                                <p style={{ fontSize: "0.95rem", lineHeight: 1.8, color: C.textSoft }}>{details.theory}</p>
                            </TiltCard>

                            {/* Benefits List */}
                            <div className="theory-card" style={{ marginTop: "1.25rem" }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.green, marginBottom: 14 }}>Key Benefits</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {details.benefits.map((benefit, idx) => (
                                        <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, marginTop: 8, flexShrink: 0 }} />
                                            <p style={{ fontSize: "0.92rem", color: C.textSoft, margin: 0 }}>{benefit}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step by Step Guide */}
                            <div className="theory-card" style={{ marginTop: "1.25rem" }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.text, marginBottom: 14 }}>How to Register & Apply</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {details.steps.map((step, idx) => (
                                        <div key={idx} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                            <div style={{
                                                width: 22, height: 22, borderRadius: "50%", background: "#fff3ed", border: `1px solid ${C.saffron}`,
                                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.saffron, flexShrink: 0
                                            }}>{idx + 1}</div>
                                            <p style={{ fontSize: "0.92rem", color: C.textSoft, margin: 0, paddingTop: 2 }}>{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "checklist" && (
                        <div className="tab-pane animate-fade-in">
                            <div className="theory-card">
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.saffron, marginBottom: 4 }}>Required Documents</h3>
                                <p style={{ fontSize: "0.85rem", color: C.textMuted, marginBottom: 20 }}>We've checked your verified dashboard documents to measure readiness.</p>

                                <div className="checklist-container">
                                    {docChecklist.map((doc, idx) => (
                                        <div key={idx} className="checklist-row">
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <span style={{ fontSize: 20 }}>{doc.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.label}</div>
                                                    <div style={{ fontSize: 10, color: C.textMuted }}>Required for identity check</div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                {doc.status === "verified" && (
                                                    <span className="doc-badge doc-badge-verified">
                                                        <CheckCircle size={12} /> Verified Ready
                                                    </span>
                                                )}
                                                {doc.status === "pending" && (
                                                    <span className="doc-badge doc-badge-pending">
                                                        <AlertCircle size={12} /> Pending Review
                                                    </span>
                                                )}
                                                {doc.status === "rejected" && (
                                                    <span className="doc-badge doc-badge-rejected">
                                                        <XCircle size={12} /> Rejected
                                                    </span>
                                                )}
                                                {doc.status === "missing" && (
                                                    <span className="doc-badge doc-badge-missing">
                                                        <XCircle size={12} /> Not Uploaded
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {readinessScore === 100 ? (
                                    <div className="checklist-success-banner">
                                        <CheckCircle size={16} /> All documents ready! You can apply online immediately.
                                    </div>
                                ) : (
                                    <div className="checklist-warn-banner">
                                        <AlertCircle size={16} /> Some required documents are missing or pending. Please upload them in your dashboard to ensure successful processing.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "stats" && (
                        <div className="tab-pane animate-fade-in">
                            <div className="theory-card">
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.saffron, marginBottom: 4 }}>National Budget Allocation</h3>
                                <p style={{ fontSize: "0.85rem", color: C.textMuted, marginBottom: 20 }}>Projected funding in ₹ Crores (5-year historical and target trend)</p>
                                
                                <div style={{ width: "100%", height: 260 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={details.stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede8e1" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ede8e1' }} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                            <Bar dataKey="budget" name="Budget Allocation (in ₹ Crores)" fill="#FF6B00" radius={[4, 4, 0, 0]} barSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="theory-card" style={{ marginTop: "1.25rem" }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.green, marginBottom: 4 }}>Beneficiaries Impacted</h3>
                                <p style={{ fontSize: "0.85rem", color: C.textMuted, marginBottom: 20 }}>Number of active families assisted in Crores</p>
                                
                                <div style={{ width: "100%", height: 260 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={details.stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ede8e1" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ede8e1' }} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                            <Line type="monotone" dataKey="beneficiaries" name="Active Beneficiaries (in Crores)" stroke="#138808" strokeWidth={3} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Document Readiness Score & Related Info */}
                <div className="scheme-dash-side-pane">
                    {/* 2D/3D Document Readiness Circular Gauge */}
                    <TiltCard className="side-card">
                        <div style={{ textAlign: "center", marginBottom: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Document Readiness</div>
                            <div style={{ fontSize: 10, color: C.textMuted }}>Requirement completion score</div>
                        </div>

                        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 16px" }}>
                            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f3f5" strokeWidth="8" />
                                <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke={readinessScore === 100 ? C.green : readinessScore > 50 ? "#3b82f6" : C.saffron}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray="251.2"
                                    initial={{ strokeDashoffset: 251.2 }}
                                    animate={{ strokeDashoffset: 251.2 * (1 - readinessScore / 100) }}
                                    transition={{ duration: 1.8, ease: "easeOut" }}
                                />
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: readinessScore === 100 ? C.green : readinessScore > 50 ? "#3b82f6" : C.saffron, fontFamily: "'Playfair Display', serif" }}>
                                    {readinessScore}%
                                </div>
                                <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                                    {readinessScore === 100 ? "Ready" : "Incomplete"}
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: "center", fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>
                            {verifiedCount} of {totalCount} verified documents are ready.
                        </div>
                    </TiltCard>

                    {/* FAQ */}
                    <div className="side-card" style={{ marginTop: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                            <HelpCircle size={16} color={C.saffron} /> Frequently Asked Questions
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {details.faq.map((item, idx) => (
                                <div key={idx} style={{ borderBottom: idx < details.faq.length - 1 ? `1px solid ${C.border}` : "none", paddingBottom: idx < details.faq.length - 1 ? 10 : 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>Q: {item.q}</div>
                                    <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.6 }}>A: {item.a}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Advice info */}
                    <div className="side-card" style={{ marginTop: "1.25rem", background: "linear-gradient(135deg, #fff3ed, #f0fdf4)", border: `1.5px solid ${C.border}` }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <Info size={18} color={C.saffron} style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <h4 style={{ fontSize: 12, fontWeight: 700, margin: "0 0 4px", color: C.text }}>Important Notice</h4>
                                <p style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.6, margin: 0 }}>
                                    Double-check information on the official government website. Direct all claims through approved Common Service Centers (CSC) to avoid middlemen or processing fees.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
