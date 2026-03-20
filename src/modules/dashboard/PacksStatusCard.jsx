import React, { useState } from "react";
import { BILLING } from "../../config/billingConfig";
import { getActivePacks, getNearestExpiry, getDaysRemaining, formatDate, calculateAmount } from "../../utils/billingUtils";
import BillingProcess from "../billing/BillingProcess";
import AppModal from "../../components/common/AppModal";

function PacksStatusCard({ mode, sheetData, onSlotsActivated }) {
  const [showBilling, setShowBilling] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState(null);

  const packs = sheetData?.packs || [];
  const activePacks = getActivePacks(packs);
  const nearestExpiry = getNearestExpiry(packs);
  const isExplore = mode === "explore";

  // In explore mode show sample values
  const totalSlots = isExplore ? 100 : activePacks.reduce((sum, p) => sum + (p.slots || 0), 0);
  const isNewSeller = !isExplore && activePacks.length === 0;

  return (
    <>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel="OK" />}

      <section className="card">
        {/* Header */}
        <div className="card-header">
          <span>Packs &amp; Slots</span>
          <span style={{ fontSize: 10, color: "#475569", fontWeight: 400 }}>₹1 / slot / 28 days</span>
        </div>

        {/* Slot summary boxes */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {/* Total Active */}
          <div
            style={{
              flex: 1,
              background: "#0a0f18",
              borderRadius: 8,
              padding: "8px 10px",
              border: "1px solid rgba(0,180,216,0.2)",
              textAlign: "center",
            }}
          >
            <div className="status-label">Total Active</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#00b4d8" }}>{totalSlots}</div>
          </div>

          {/* Nearest Expiry — tappable */}
          <div
            style={{
              flex: 2,
              background: "#0a0f18",
              borderRadius: 8,
              padding: "8px 10px",
              border: "1px solid rgba(0,180,216,0.2)",
              cursor: !isExplore && activePacks.length > 0 ? "pointer" : "default",
            }}
            onClick={() => !isExplore && activePacks.length > 0 && setExpanded(!expanded)}
          >
            <div className="status-label">Nearest Expiry</div>
            {isExplore || !nearestExpiry ? (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>—</div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  {nearestExpiry.availed && <div style={{ fontSize: 9, color: "#475569" }}>From: {formatDate(nearestExpiry.availed)}</div>}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: getDaysRemaining(nearestExpiry.expiry) <= 7 ? "#ef4444" : "#fde68a",
                    }}
                  >
                    {formatDate(nearestExpiry.expiry)}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{getDaysRemaining(nearestExpiry.expiry)} days left</div>
                </div>
                <div style={{ fontSize: 10, color: "#00b4d8" }}>{expanded ? "↑ Collapse" : "View All ↓"}</div>
              </div>
            )}
          </div>
        </div>

        {/* Expanded pack details */}
        {expanded && !isExplore && activePacks.length > 0 && (
          <div
            style={{
              marginBottom: 10,
              padding: 10,
              background: "#0a0f18",
              borderRadius: 8,
              border: "1px solid rgba(0,180,216,0.1)",
            }}
          >
            {activePacks.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: i < activePacks.length - 1 ? "1px solid rgba(0,180,216,0.08)" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{p.slots} slots</div>
                  {p.availed && <div style={{ fontSize: 10, color: "#475569" }}>From: {formatDate(p.availed)}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#fde68a" }}>Expires: {formatDate(p.expiry)}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: getDaysRemaining(p.expiry) <= 7 ? "#fca5a5" : "#6ee7b7",
                    }}
                  >
                    {getDaysRemaining(p.expiry)} days left
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Slots CTA */}
        <button className="btn btn-primary" style={{ width: "100%", fontSize: 12 }} onClick={() => setShowBilling(true)}>
          {isNewSeller ? "Buy Slots to Start" : "+ Add Slots"}
        </button>

        {isExplore && (
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              color: "#475569",
              textAlign: "center",
            }}
          >
            Login to see your active slots and expiry details.
          </div>
        )}
      </section>

      {/* Billing bottom sheet */}
      {showBilling && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowBilling(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <BillingProcess
              packs={packs}
              sheetCode={sheetData?.sheetCode}
              onClose={() => setShowBilling(false)}
              onSlotsActivated={onSlotsActivated}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default PacksStatusCard;
