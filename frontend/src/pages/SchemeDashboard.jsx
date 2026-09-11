import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, AlertCircle, FileText, TrendingUp, Info, HelpCircle, BookOpen } from "lucide-react";
import API from "../api/axios";
import "./SchemeDashboard.css";
import { useLanguage } from "../LanguageContext";
import SchemeChatBot from "../components/SchemeChatBot";

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
    const { t } = useLanguage();

    const [user, setUser] = useState(null);
    const [userDocs, setUserDocs] = useState([]);
    const [currentApp, setCurrentApp] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [applying, setApplying] = useState(false);
    const [submittingApp, setSubmittingApp] = useState(false);
    const [uploadingDocKey, setUploadingDocKey] = useState(null);
    const [reasonText, setReasonText] = useState("");

    const decodedName = decodeURIComponent(schemeName);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            navigate("/");
            return;
        }
        const parsed = JSON.parse(stored);
        setUser(parsed);
        loadAllData(parsed.id);
    }, [navigate, decodedName]);

    const loadAllData = async (userId) => {
        try {
            const [docsRes, appsRes] = await Promise.all([
                API.get(`/documents/my/${userId}`),
                API.get(`/applications/my/${userId}`)
            ]);
            setUserDocs(docsRes.data);
            const foundApp = (appsRes.data || []).find(a => a.scheme_name === decodedName);
            setCurrentApp(foundApp || null);
            if (foundApp?.reason_for_applying) {
                setReasonText(foundApp.reason_for_applying);
            }
        } catch (e) {
            console.error("Error loading scheme application data:", e);
        }
    };

    const handleStartApplication = async () => {
        if (!user) return;
        setApplying(true);
        try {
            const res = await API.post("/applications/apply", {
                user_id: user.id,
                scheme_name: decodedName,
                category: decodedName.includes("Kisan") || decodedName.includes("Fasal") ? "Agriculture" : decodedName.includes("Ayushman") || decodedName.includes("Bima") ? "Healthcare" : "Welfare",
                benefit: details.benefits?.[0] || "Standard Welfare Grant",
                reason_for_applying: reasonText || `Eligible citizen (${user.occupation || "Applicant"}, Income: ${user.income || "Standard"}) applying via ArthMitra Direct Pipeline.`
            });
            if (
                res.data.status === "success" ||
                res.data.application_status === "draft"
            ) {
                await loadAllData(user.id);

                const applicationId =
                    res.data.application_id || res.data.application?.id;

                alert(
                    `📋 Application #${applicationId || "created"} Initiated!\n\n` +
                    `Step 1: Upload the required documents below.\n` +
                    `Step 2: Review and submit your application to the Section Officer (Clerk).`
                );
            }
        } catch (e) {
            console.error("Apply error:", e);
            alert(e.response?.data?.detail || "Application failed");
        } finally {
            setApplying(false);
        }
    };

    const handleUploadDocForApp = async (docKey, file) => {
        if (!file || !user) return;
        if (!currentApp) {
            alert("Please click 'Start Application' first so documents can be linked to your application.");
            return;
        }
        setUploadingDocKey(docKey);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("user_id", user.id);
            fd.append("doc_type", docKey);
            fd.append("application_id", currentApp.id);

            await API.post("/documents/upload", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            await loadAllData(user.id);
        } catch (e) {
            console.error("Upload error:", e);
            alert(e.response?.data?.detail || "Document upload failed");
        } finally {
            setUploadingDocKey(null);
        }
    };

    const handleSubmitApplication = async () => {
        if (!user || !currentApp) return;
        const attached = currentApp.documents || [];
        if (attached.length === 0) {
            alert("Please upload at least one required document before submitting.");
            return;
        }
        setSubmittingApp(true);
        try {
            const res = await API.post(`/applications/${currentApp.id}/submit`, {
                user_id: user.id
            });
            if (res.data.status === "success") {
                await loadAllData(user.id);
                alert(`🎉 Application #${currentApp.id} Submitted Successfully!\n\nYour application and all attached documents have been forwarded to the Section Officer (Clerk) for Level-1 Verification.`);
            }
        } catch (e) {
            console.error("Submit error:", e);
            alert(e.response?.data?.detail || "Submission failed");
        } finally {
            setSubmittingApp(false);
        }
    };

    // Find scheme details, or construct a dynamic detailed fallback
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

    // Calculate document checklist status based on this application's attached docs
    const appDocs = currentApp?.documents || [];
    const docChecklist = details.docs.map(docKey => {
        const matchingDoc = appDocs.find(d => d.doc_type === docKey);
        const docLabel = t(`doc_${docKey}`) || COMMON_DOCS[docKey]?.label || docKey;
        const icon = COMMON_DOCS[docKey]?.icon || "📄";

        let status = "missing";
        if (matchingDoc) {
            status = matchingDoc.status;
        }

        return {
            key: docKey,
            label: docLabel,
            icon: icon,
            status: status,
            docObj: matchingDoc
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
        <>
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
                    <ArrowLeft size={16} /> {t("sd_back")}
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span className="scheme-category-badge">{decodedName.includes("Kisan") || decodedName.includes("Fasal") ? "🌾 Agriculture" : decodedName.includes("Ayushman") || decodedName.includes("Bima") ? "🏥 Healthcare" : "🏛️ Welfare"}</span>
                            <span className="scheme-status-active">● {t("sd_active_scheme")}</span>
                        </div>
                        <h1 className="scheme-title">{decodedName}</h1>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {!currentApp ? (
                            <button
                                onClick={handleStartApplication}
                                disabled={applying}
                                className="apply-btn-main"
                                style={{
                                    background: "linear-gradient(90deg, #FF6B00 0%, #FF8C00 100%)",
                                    border: "none",
                                    cursor: applying ? "default" : "pointer"
                                }}
                            >
                                {applying ? "Initiating..." : "Apply / Start Application"}
                            </button>
                        ) : currentApp.status === "draft" ? (
                            <button
                                onClick={() => {
                                    const el = document.getElementById("app-workflow-card");
                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="apply-btn-main"
                                style={{
                                    background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                📋 Draft Active (#{currentApp.id}) — Upload & Submit
                            </button>
                        ) : currentApp.status === "SUBMITTED" ? (
                            <span className="apply-btn-main" style={{ background: "#2563eb", color: "#fff", cursor: "default" }}>
                                ⏳ Submitted — Pending Clerk Review (#{currentApp.id})
                            </span>
                        ) : currentApp.status === "CLERK_APPROVED" ? (
                            <span className="apply-btn-main" style={{ background: "#7c3aed", color: "#fff", cursor: "default" }}>
                                ⏳ Clerk Approved — Pending District Officer (#{currentApp.id})
                            </span>
                        ) : currentApp.status === "OFFICER_APPROVED" ? (
                            <span className="apply-btn-main" style={{ background: "#9333ea", color: "#fff", cursor: "default" }}>
                                ⏳ Officer Approved — Pending Secretary (#{currentApp.id})
                            </span>
                        ) : currentApp.status === "FINAL_VERIFICATION" ? (
                            <span className="apply-btn-main" style={{ background: "#ea580c", color: "#fff", cursor: "default" }}>
                                ⏳ Final Verification — Pending Minister (#{currentApp.id})
                            </span>
                        ) : currentApp.status === "APPROVED" ? (
                            <span className="apply-btn-main" style={{ background: "#16a34a", color: "#fff", cursor: "default" }}>
                                ✅ Approved & Disbursed (#{currentApp.id})
                            </span>
                        ) : currentApp.status === "REJECTED" ? (
                            <span className="apply-btn-main" style={{ background: "#dc2626", color: "#fff", cursor: "default" }}>
                                ❌ Application Rejected (#{currentApp.id})
                            </span>
                        ) : (
                            <span className="apply-btn-main" style={{ background: "#475569", color: "#fff", cursor: "default" }}>
                                ● {currentApp.status} (#{currentApp.id})
                            </span>
                        )}
                        <a href={details.link} target="_blank" rel="noopener noreferrer" className="apply-btn-main" style={{ background: "rgba(0,0,0,0.05)", color: "#1a1a1a", border: "1px solid #ddd" }}>
                            {t("sd_official_portal")} <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </header>

            {/* SCHEME APPLICATION WORKFLOW CARD */}
            {currentApp && (
                <div id="app-workflow-card" style={{ maxWidth: 1200, margin: "0 auto 20px", padding: "0 24px" }}>
                    <div style={{
                        background: currentApp.status === "draft" ? "#fffbf5" : currentApp.status === "APPROVED" ? "#f0fdf4" : currentApp.status === "REJECTED" ? "#fef2f2" : "#f8fafc",
                        border: `1.5px solid ${currentApp.status === "draft" ? "#f59e0b" : currentApp.status === "APPROVED" ? "#86efac" : currentApp.status === "REJECTED" ? "#fca5a5" : "#cbd5e1"}`,
                        borderRadius: 14,
                        padding: "20px 24px",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.03)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, background: "#1a1a1a", color: "#fff", padding: "3px 10px", borderRadius: 6 }}>
                                        Application ID: #{currentApp.id}
                                    </span>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700,
                                        color: currentApp.status === "draft" ? "#b45309" : currentApp.status === "APPROVED" ? "#15803d" : currentApp.status === "REJECTED" ? "#b91c1c" : "#1d4ed8",
                                        background: currentApp.status === "draft" ? "#fef3c7" : currentApp.status === "APPROVED" ? "#dcfce7" : currentApp.status === "REJECTED" ? "#fee2e2" : "#dbeafe",
                                        padding: "3px 10px", borderRadius: 6
                                    }}>
                                        {currentApp.status === "draft" ? "Step 2: Upload Documents & Submit" : `Status: ${currentApp.status.toUpperCase()}`}
                                    </span>
                                </div>
                                <h3 style={{ margin: "10px 0 4px", fontSize: 18, color: "#1e293b" }}>
                                    {decodedName} — Application Desk
                                </h3>
                                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                                    {currentApp.status === "draft"
                                        ? "All uploaded documents are directly linked to this Application ID. Upload the required documents, review, and click 'Submit to Clerk'."
                                        : `Handled by: ${currentApp.current_handler || "Review Authority"} • Applied: ${currentApp.applied_at?.split("T")[0] || "Recent"}`}
                                </p>
                            </div>

                            {currentApp.status === "draft" && (
                                <button
                                    onClick={handleSubmitApplication}
                                    disabled={submittingApp || (currentApp.documents || []).length === 0}
                                    style={{
                                        background: (currentApp.documents || []).length > 0 ? "linear-gradient(90deg, #138808 0%, #16a34a 100%)" : "#cbd5e1",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "10px 20px",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        cursor: (currentApp.documents || []).length > 0 ? "pointer" : "not-allowed",
                                        boxShadow: (currentApp.documents || []).length > 0 ? "0 4px 12px rgba(19, 136, 8, 0.25)" : "none"
                                    }}
                                >
                                    {submittingApp ? "Submitting..." : "🚀 Review & Submit Application to Clerk"}
                                </button>
                            )}
                        </div>

                        {/* REJECTION REASON IF ANY */}
                        {currentApp.status === "REJECTED" && currentApp.review_note && (
                            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#7f1d1d" }}>
                                <strong>Rejection Details:</strong> {currentApp.review_note}
                            </div>
                        )}

                        {/* REQUIRED DOCUMENTS ATTACHMENT HUB */}
                        <div style={{ marginTop: 14, background: "#ffffff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
                                📑 Required Scheme Documents (Linked to Application #{currentApp.id})
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                                {details.docs.map((docKey) => {
                                    const attachedDoc = (currentApp.documents || []).find(d => d.doc_type === docKey);
                                    const label = COMMON_DOCS[docKey]?.label || docKey;
                                    const icon = COMMON_DOCS[docKey]?.icon || "📄";
                                    const isUploading = uploadingDocKey === docKey;

                                    return (
                                        <div key={docKey} style={{
                                            border: `1.5px solid ${attachedDoc ? "#bbf7d0" : "#fed7aa"}`,
                                            background: attachedDoc ? "#f0fdf4" : "#fffaf5",
                                            borderRadius: 8,
                                            padding: "12px 14px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: 10
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                                                <span style={{ fontSize: 22 }}>{icon}</span>
                                                <div style={{ overflow: "hidden" }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {label}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: attachedDoc ? "#166534" : "#9a3412" }}>
                                                        {attachedDoc ? `✓ ${attachedDoc.original_name}` : "Missing / Required"}
                                                    </div>
                                                </div>
                                            </div>

                                            {currentApp.status === "draft" ? (
                                                <label style={{
                                                    background: attachedDoc ? "#e2e8f0" : "#ff6b00",
                                                    color: attachedDoc ? "#334155" : "#ffffff",
                                                    padding: "6px 12px",
                                                    borderRadius: 6,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    cursor: isUploading ? "wait" : "pointer",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {isUploading ? "Uploading..." : attachedDoc ? "Re-upload" : "Upload File"}
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        style={{ display: "none" }}
                                                        disabled={isUploading}
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                handleUploadDocForApp(docKey, e.target.files[0]);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            ) : (
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    padding: "3px 8px",
                                                    borderRadius: 4,
                                                    background: attachedDoc?.status === "verified" ? "#bbf7d0" : attachedDoc?.status === "rejected" ? "#fca5a5" : "#fef08a",
                                                    color: attachedDoc?.status === "verified" ? "#166534" : attachedDoc?.status === "rejected" ? "#991b1b" : "#854d0e"
                                                }}>
                                                    {attachedDoc ? attachedDoc.status.replace("_", " ") : "Not provided"}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {currentApp.status === "draft" && (
                                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 12, color: "#64748b" }}>
                                    <span>
                                        Uploaded: <strong>{(currentApp.documents || []).length}</strong> / {details.docs.length} required documents
                                    </span>
                                    {(currentApp.documents || []).length === 0 && (
                                        <span style={{ color: "#c2410c", fontWeight: 600 }}>
                                            ⚠️ Upload at least one document before submitting to Clerk.
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DASHBOARD CONTENT GRID */}
            <div className="scheme-dash-grid">
                {/* LEFT: Nav Tabs & Main Content */}
                <div className="scheme-dash-main-pane">
                    {/* Navigation Tabs */}
                    <div className="scheme-tab-bar">
                        {[
                            { id: "overview", label: t("sd_tab_overview"), icon: <BookOpen size={14} /> },
                            { id: "checklist", label: t("sd_tab_checklist"), icon: <FileText size={14} /> },
                            { id: "stats", label: t("sd_tab_stats"), icon: <TrendingUp size={14} /> }
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
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.saffron, marginBottom: 12 }}>{t("sd_theory_title")}</h3>
                                <p style={{ fontSize: "0.95rem", lineHeight: 1.8, color: C.textSoft }}>{details.theory}</p>
                            </TiltCard>

                            {/* Benefits List */}
                            <div className="theory-card" style={{ marginTop: "1.25rem" }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.green, marginBottom: 14 }}>{t("sd_benefits_title")}</h3>
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
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.text, marginBottom: 14 }}>{t("sd_steps_title")}</h3>
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
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.saffron, marginBottom: 4 }}>{t("sd_docs_title")}</h3>
                                <p style={{ fontSize: "0.85rem", color: C.textMuted, marginBottom: 20 }}>{t("sd_readiness_sub")}</p>

                                <div className="checklist-container">
                                    {docChecklist.map((doc, idx) => (
                                        <div key={idx} className="checklist-row">
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <span style={{ fontSize: 20 }}>{doc.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.label}</div>
                                                    <div style={{ fontSize: 10, color: C.textMuted }}>Requirement for verification</div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                {doc.status === "verified" && (
                                                    <span className="doc-badge doc-badge-verified">
                                                        <CheckCircle size={12} /> {t("sd_verified_ready")}
                                                    </span>
                                                )}
                                                {doc.status === "pending" && (
                                                    <span className="doc-badge doc-badge-pending">
                                                        <AlertCircle size={12} /> {t("sd_pending_review")}
                                                    </span>
                                                )}
                                                {doc.status === "rejected" && (
                                                    <span className="doc-badge doc-badge-rejected">
                                                        <XCircle size={12} /> {t("sd_rejected")}
                                                    </span>
                                                )}
                                                {doc.status === "missing" && (
                                                    <span className="doc-badge doc-badge-missing">
                                                        <XCircle size={12} /> {t("sd_not_uploaded")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {readinessScore === 100 ? (
                                    <div className="checklist-success-banner">
                                        <CheckCircle size={16} /> {t("sd_all_ready_banner")}
                                    </div>
                                ) : (
                                    <div className="checklist-warn-banner">
                                        <AlertCircle size={16} /> {t("sd_missing_warn_banner")}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "stats" && (
                        <div className="tab-pane animate-fade-in">
                            <div className="theory-card">
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.saffron, marginBottom: 4 }}>{t("sd_budget_title")}</h3>
                                <p style={{ fontSize: "0.85rem", color: C.textMuted, marginBottom: 20 }}>{t("sd_budget_sub")}</p>

                                <div style={{ width: "100%", height: 260 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={details.stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede8e1" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ede8e1' }} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                            <Bar dataKey="budget" name={t("sd_budget_legend")} fill="#FF6B00" radius={[4, 4, 0, 0]} barSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="theory-card" style={{ marginTop: "1.25rem" }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: C.green, marginBottom: 4 }}>{t("sd_ben_title")}</h3>
                                <p style={{ fontSize: "0.85rem", color: C.textMuted, marginBottom: 20 }}>{t("sd_ben_sub")}</p>

                                <div style={{ width: "100%", height: 260 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={details.stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ede8e1" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ede8e1' }} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                            <Line type="monotone" dataKey="beneficiaries" name={t("sd_ben_legend")} stroke="#138808" strokeWidth={3} activeDot={{ r: 8 }} />
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
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t("sd_doc_readiness")}</div>
                            <div style={{ fontSize: 10, color: C.textMuted }}>{t("sd_req_score")}</div>
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
                                    {readinessScore === 100 ? t("sd_status_ready") : t("sd_status_incomplete")}
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: "center", fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>
                            {verifiedCount} / {totalCount} {t("sd_verified_ready")}
                        </div>
                    </TiltCard>

                    {/* FAQ */}
                    <div className="side-card" style={{ marginTop: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                            <HelpCircle size={16} color={C.saffron} /> {t("sd_faq_title")}
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
                                <h4 style={{ fontSize: 12, fontWeight: 700, margin: "0 0 4px", color: C.text }}>{t("sd_notice_title")}</h4>
                                <p style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.6, margin: 0 }}>
                                    {t("sd_notice_body")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* ── Helper AI Chatbot Widget ── */}
        <SchemeChatBot schemeName={schemeName} />
        </>
    );
}
