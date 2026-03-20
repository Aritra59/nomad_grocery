import React, { useState } from "react";
import { BILLING } from "../../config/billingConfig";
import { calculateAmount, generateUPIUrl, generateWhatsAppUrl, isSlotPurchaseValid, getTotalActiveSlots } from "../../utils/billingUtils";
import BillingPlans from "./BillingPlans";
import AppModal from "../../components/common/AppModal";
import Icon from "../../components/common/Icon";
import { updateSheetSlotsByCode } from "../../hooks/useSheetSync";

function BillingProcess({ packs = [], sheetCode, onClose, onSlotsActivated }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [modal, setModal] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [activating, setActivating] = useState(false);

  const amount = selectedPlan ? selectedPlan.amount ?? calculateAmount(selectedPlan.slots, selectedPlan.days) : 0;
  const activeSlots = getTotalActiveSlots(packs);
  // Validate based on total slots after the selected purchase (existing + new).
  const totalSlots = selectedPlan ? activeSlots + selectedPlan.slots : activeSlots;
  const canProceed = isSlotPurchaseValid(totalSlots, termsAccepted);

  const getNextAvailablePackId = () => {
    const activeIds = new Set((packs || []).map((p) => p.id));
    for (let i = 1; i <= 3; i++) {
      if (!activeIds.has(i)) return i;
    }
    return null;
  };

  const handleCopyUPI = async () => {
    if (!canProceed) {
      setModal({
        type: "warning",
        title: "Minimum 100 Slots Required",
        message: "Minimum 100 slots required and accept terms.",
        onConfirm: () => setModal(null),
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(BILLING.upiId);
      setModal({
        type: "success",
        title: "UPI ID Copied",
        message: BILLING.upiId + " copied to clipboard.",
        onConfirm: () => setModal(null),
      });
    } catch {
      setModal({
        type: "info",
        title: "UPI ID",
        message: "UPI ID: " + BILLING.upiId,
        onConfirm: () => setModal(null),
      });
    }
  };

  const handlePay = () => {
    if (!selectedPlan) {
      setModal({ type: "warning", title: "Select a Plan", message: "Please select a slot plan before proceeding.", onConfirm: () => setModal(null) });
      return;
    }
    if (!canProceed) {
      setModal({
        type: "warning",
        title: "Minimum 100 Slots Required",
        message: "Minimum 100 slots required and accept terms.",
        onConfirm: () => setModal(null),
      });
      return;
    }
    const url = generateUPIUrl(amount, "Nomad GroceryApp " + selectedPlan.slots + " slots/" + selectedPlan.days + "d");
    window.location.href = url;
  };

  const handleWhatsApp = () => {
    if (!selectedPlan) {
      setModal({ type: "warning", title: "Select a Plan", message: "Please select a slot plan first.", onConfirm: () => setModal(null) });
      return;
    }
    const url = generateWhatsAppUrl(selectedPlan.slots, selectedPlan.days, amount);
    window.open(url, "_blank");
  };

  const handleActivateAndSync = async () => {
    if (!selectedPlan) {
      setModal({ type: "warning", title: "Select a Plan", message: "Please select a slot plan first.", onConfirm: () => setModal(null) });
      return;
    }
    if (!canProceed) {
      setModal({
        type: "warning",
        title: "Minimum 100 Slots Required",
        message: "Minimum 100 slots required and accept terms.",
        onConfirm: () => setModal(null),
      });
      return;
    }
    if (!sheetCode || !String(sheetCode).trim()) {
      setModal({ type: "error", title: "Not Logged In", message: "Sheet code missing. Please login again.", onConfirm: () => setModal(null) });
      return;
    }

    const packId = getNextAvailablePackId();
    if (!packId) {
      setModal({
        type: "warning",
        title: "Slots Full",
        message: "All pack slots (pack1..pack3) are currently active. Wait for expiry or contact support.",
        onConfirm: () => setModal(null),
      });
      return;
    }

    setActivating(true);
    try {
      await updateSheetSlotsByCode({
        code: sheetCode,
        packId,
        slots: selectedPlan.slots,
        days: selectedPlan.days,
        transactionId,
      });

      setModal({
        type: "success",
        title: "Excel Updated",
        message: "Slots & expiry are synced. Refreshing dashboard…",
        onConfirm: () => {
          setModal(null);
          onSlotsActivated?.(sheetCode);
        },
      });
    } catch (err) {
      setModal({
        type: "error",
        title: "Excel Sync Failed",
        message: err?.message || "Could not update sheet. Please check API configuration.",
        onConfirm: () => setModal(null),
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel="OK" />}

      {showTerms && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#1a1f2e", borderRadius: 14, padding: 20, width: "100%", maxWidth: 400, maxHeight: "80vh", overflowY: "auto", border: "1px solid rgba(0,180,216,0.3)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#00b4d8" }}>Terms &amp; Conditions</div>
            <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.8 }}>
              <p style={{ marginBottom: 8 }}>1. Slots are valid for the purchased validity period only.</p>
              <p style={{ marginBottom: 8 }}>2. Slots are non-refundable once activated.</p>
              <p style={{ marginBottom: 8 }}>3. Each slot allows one product listing in your inventory.</p>
              <p style={{ marginBottom: 8 }}>4. Nomad GrocerApp reserves the right to modify pricing.</p>
              <p style={{ marginBottom: 8 }}>5. Payment must be confirmed via WhatsApp with transaction ID.</p>
              <p style={{ marginBottom: 8 }}>6. Account activation happens within 24 hours of payment confirmation.</p>
              <p style={{ marginBottom: 8 }}>7. Misuse of the platform may result in account suspension.</p>
              <p style={{ marginBottom: 8 }}>8. All disputes subject to jurisdiction of Pune, Maharashtra.</p>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => {
                setTermsAccepted(true);
                setShowTerms(false);
              }}
            >
              I Accept
            </button>
            <button className="btn btn-outline" style={{ width: "100%", marginTop: 8 }} onClick={() => setShowTerms(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Add Slots</div>
        {onClose && (
          <button style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Plan</div>
        <BillingPlans packs={packs} selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />
      </div>

      {selectedPlan && (
        <div
          style={{
            background: "rgba(0,180,216,0.08)",
            border: "1px solid rgba(0,180,216,0.3)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              {selectedPlan.slots} slots · {selectedPlan.days} days
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>UPI: {BILLING.upiId}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#00b4d8" }}>₹{amount}</div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer" }} onClick={() => setTermsAccepted(!termsAccepted)}>
        <div className={"app-checkbox" + (termsAccepted ? " checked" : "")}>{termsAccepted && <span style={{ color: "#0d1117", fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
        <span style={{ fontSize: 12, color: "#cbd5e1" }}>
          I accept the{" "}
          <span
            style={{ color: "#00b4d8", textDecoration: "underline" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowTerms(true);
            }}
          >
            Terms &amp; Conditions
          </span>
        </span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>UPI Transaction ID</div>
        <input
          className="input"
          placeholder="e.g. 9QW123456789 (optional)"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          style={{ textAlign: "left" }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button
          className="btn btn-outline"
          style={{ flex: 1, fontSize: 12, opacity: !canProceed ? 0.45 : 1, cursor: !canProceed ? "not-allowed" : "pointer" }}
          onClick={handleCopyUPI}
        >
          Copy UPI ID
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 2, fontSize: 12, opacity: !canProceed ? 0.45 : 1, cursor: !canProceed ? "not-allowed" : "pointer" }}
          onClick={handlePay}
        >
          Pay ₹{amount || "—"}
        </button>
      </div>

      <button className="btn btn-outline" style={{ width: "100%", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }} onClick={handleWhatsApp}>
        <Icon name="Send" size={14} />
        <span>Send Payment Details on WhatsApp</span>
      </button>

      <button
        className="btn btn-primary"
        style={{
          width: "100%",
          fontSize: 12,
          marginTop: 10,
          opacity: activating ? 0.7 : !canProceed ? 0.45 : 1,
          cursor: activating || !canProceed ? "not-allowed" : "pointer",
        }}
        onClick={handleActivateAndSync}
        disabled={activating || !canProceed}
      >
        {activating ? "Syncing to Excel…" : "Activate & Sync to Excel"}
      </button>

      <div style={{ fontSize: 10, color: "#475569", textAlign: "center", marginTop: 10 }}>After payment send screenshot on WhatsApp. Activation within 24 hours.</div>
    </div>
  );
}

export default BillingProcess;
