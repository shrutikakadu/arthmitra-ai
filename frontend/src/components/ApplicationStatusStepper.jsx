import React from "react";
import { useLanguage } from "../LanguageContext";

// Step definitions using translation keys — no hardcoded multilingual labels needed
const STEP_KEYS = [
  { key: "draft",              tKey: "step_draft",        icon: "📝" },
  { key: "SUBMITTED",          tKey: "step_submitted",    icon: "📤" },
  { key: "CLERK_APPROVED",     tKey: "step_clerk_review", icon: "📋" },
  { key: "OFFICER_APPROVED",   tKey: "step_dm_review",    icon: "🏛️" },
  { key: "FINAL_VERIFICATION", tKey: "step_final_review", icon: "🔍" },
  { key: "APPROVED",           tKey: "step_approved",     icon: "✅" },
];

function getStepIndex(status) {
  const normalized = (status || "").toUpperCase()
    .replace("PENDING_CLERK", "SUBMITTED")
    .replace("PENDING_OFFICER", "CLERK_APPROVED")
    .replace("PENDING_SECRETARY", "OFFICER_APPROVED")
    .replace("PENDING_MINISTER", "FINAL_VERIFICATION")
    .replace("VERIFIED", "APPROVED");
  const idx = STEP_KEYS.findIndex(s => s.key === normalized || s.key.toUpperCase() === normalized);
  return idx >= 0 ? idx : 0;
}

export default function ApplicationStatusStepper({ status }) {
  const { t } = useLanguage();
  const isRejected = (status || "").toUpperCase() === "REJECTED";
  const currentIdx = isRejected ? -1 : getStepIndex(status);

  // Build the steps array — add rejected step if needed
  const steps = isRejected
    ? [...STEP_KEYS.slice(0, Math.max(currentIdx + 1, 2)), { key: "REJECTED", tKey: "step_rejected", icon: "❌" }]
    : STEP_KEYS;

  return (
    <div style={{ width: "100%", overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", minWidth: 520, gap: 0 }}>
        {steps.map((step, idx, arr) => {
          const isActive   = !isRejected && idx === currentIdx;
          const isComplete = !isRejected && idx < currentIdx;
          const isReject   = step.key === "REJECTED";

          const dotColor = isReject ? "#DC2626"
            : isComplete ? "#16A34A"
            : isActive   ? "#FF6B00"
            : "#CBD5E1";

          const textColor = isReject ? "#DC2626"
            : isComplete ? "#16A34A"
            : isActive   ? "#FF6B00"
            : "#94A3B8";

          return (
            <React.Fragment key={step.key}>
              {/* Step */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto", minWidth: 72 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: isComplete ? "#DCFCE7" : isActive ? "#FFF3ED" : isReject ? "#FEE2E2" : "#F1F5F9",
                  border: `2.5px solid ${dotColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isComplete ? 16 : 15,
                  transition: "all 0.3s ease",
                  boxShadow: isActive ? `0 0 0 4px rgba(255,107,0,0.15)` : isReject ? `0 0 0 4px rgba(220,38,38,0.12)` : "none",
                }}>
                  {isComplete ? "✓" : step.icon}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive || isReject ? 700 : 500,
                  color: textColor,
                  marginTop: 5,
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: 68,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}>
                  {t(step.tKey)}
                </span>
              </div>

              {/* Connector line */}
              {idx < arr.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  background: idx < currentIdx || isReject ? "#16A34A" : "#E2E8F0",
                  marginBottom: 18,
                  minWidth: 16,
                  transition: "background 0.3s ease",
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
