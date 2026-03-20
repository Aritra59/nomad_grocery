import React, { useEffect, useState } from "react";
import { BILLING } from "../../config/billingConfig";
import { calculateAmount, isNewSeller } from "../../utils/billingUtils";
import Icon from "../../components/common/Icon";
import SelectField from "../../components/common/SelectField";

function BillingPlans({ packs = [], onSelectPlan, selectedPlan }) {
  const newSeller = isNewSeller(packs);
  const [validityMap, setValidityMap] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const getValidity = (packId) => validityMap[packId] || 28;
  const setValidity = (packId, days) => setValidityMap((prev) => ({ ...prev, [packId]: days }));

  const plansToShow = BILLING.addOnPacks;

  // Whenever selectedIds or validity change, compute combined selection and notify parent.
  useEffect(() => {
    if (!selectedIds.length) {
      onSelectPlan(null);
      return;
    }
    const selectedPacks = plansToShow.filter((p) => selectedIds.includes(p.id));
    const totalSlots = selectedPacks.reduce((sum, p) => sum + (p.slots || 0), 0);
    const totalAmount = selectedPacks.reduce((sum, p) => {
      const days = getValidity(p.id);
      return sum + calculateAmount(p.slots, days);
    }, 0);
    // Use the first pack's validity just for display/note; amount is already computed.
    const firstDays = getValidity(selectedPacks[0].id);
    onSelectPlan({
      slots: totalSlots,
      days: firstDays,
      amount: totalAmount,
      selectedPackIds: selectedIds,
    });
  }, [selectedIds, validityMap, onSelectPlan, plansToShow]);

  return (
    <div>
      {newSeller && (
        <div
          style={{
            background: "rgba(0,180,216,0.1)",
            border: "1px solid #00b4d8",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 11,
            color: "#67e8f9",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="Sparkles" size={16} />
          <span>Welcome! Minimum 100 slots required to get started.</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {plansToShow.map((plan) => {
          const isDisabled = newSeller && plan.newUserDisabled;
          const validity = getValidity(plan.id);
          const amount = calculateAmount(plan.slots, validity);
          const isSelected = selectedIds.includes(plan.id);

          return (
            <div
              key={plan.id}
              onClick={() => {
                if (isDisabled) {
                  window.alert("First purchase must be at least 100 slots. Please select 100 or more.");
                  return;
                }
                setSelectedIds((prev) => (prev.includes(plan.id) ? prev.filter((id) => id !== plan.id) : [...prev, plan.id]));
              }}
              title={isDisabled ? "Minimum 100 slots to start" : ""}
              style={{
                borderRadius: 10,
                padding: "10px 14px",
                border: `1px solid ${isSelected ? "#00b4d8" : isDisabled ? "#1e293b" : "rgba(148,163,184,0.2)"}`,
                background: isSelected ? "rgba(0,180,216,0.12)" : isDisabled ? "rgba(15,23,42,0.3)" : "rgba(15,23,42,0.6)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.45 : 1,
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isDisabled ? 0 : 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isDisabled ? "#334155" : "#e2e8f0" }}>
                    {plan.label}
                    {isDisabled && <span style={{ fontSize: 9, color: "#475569", marginLeft: 8 }}>Min 100 slots to start</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isDisabled ? "#334155" : "#00b4d8" }}>₹{amount}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>₹{(amount / plan.slots).toFixed(2)}/slot</div>
                </div>
                {isSelected && (
                  <div
                    style={{
                      marginLeft: 10,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#00b4d8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="Check" size={12} style={{ color: "#0d1117" }} />
                  </div>
                )}
              </div>

              {/* Validity dropdown */}
              {!isDisabled && (
                <div style={{ marginTop: 4 }}>
                  <SelectField
                    value={validity}
                    onChange={(e) => {
                      e.stopPropagation();
                      setValidity(plan.id, Number(e.target.value));
                    }}
                    selectStyle={{ fontSize: 11 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {BILLING.validityOptions.map((v) => (
                      <option key={v.days} value={v.days}>
                        {v.label}
                      </option>
                    ))}
                  </SelectField>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BillingPlans;
