import React from "react";
import { formatDate, getDaysRemaining, getActivePacks } from "../../utils/billingUtils";
import Icon from "../../components/common/Icon";

function ProfileView({ sheetData, mode, onClose, onLogout }) {
  if (!sheetData) return null;

  const activePacks = getActivePacks(sheetData.packs || []);
  const totalSlots = activePacks.reduce((sum, p) => sum + (p.slots || 0), 0);

  // Find nearest expiry
  const nearestPack = activePacks.length ? [...activePacks].sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0] : null;

  const InfoRow = ({ label, value, valueColor }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid rgba(0,180,216,0.08)",
      }}
    >
      <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || "#e2e8f0" }}>{value || "—"}</span>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#1a1f2e",
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 380,
          border: "1px solid rgba(0,180,216,0.25)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#00b4d8" }}>Shop Profile</div>
        <button style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
          <Icon name="X" size={16} />
        </button>
        </div>

        {/* Shop ID — top */}
        {sheetData.shopId && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 14,
              padding: "6px 12px",
              background: "rgba(0,180,216,0.08)",
              borderRadius: 8,
              border: "1px solid rgba(0,180,216,0.2)",
            }}
          >
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>Shop ID</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#00b4d8", letterSpacing: "0.08em" }}>{sheetData.shopId}</div>
          </div>
        )}

        {/* Profile icon */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00b4d8, #06d6a0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#0d1117",
              margin: "0 auto 8px",
            }}
          >
            {(sheetData.shopName || "N")[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{sheetData.shopName || "My Shop"}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: mode === "live" ? "#22c55e" : "#3b82f6",
              }}
            />
            <span>{mode === "live" ? "Live Mode" : "Explore Mode"}</span>
          </div>
        </div>

        {/* Shop details */}
        <div
          style={{
            background: "rgba(15,23,42,0.6)",
            borderRadius: 10,
            padding: "4px 14px",
            marginBottom: 14,
            border: "1px solid rgba(148,163,184,0.1)",
          }}
        >
          <InfoRow label="Owner" value={sheetData.ownerName} />
          <InfoRow label="Mobile" value={sheetData.mobile} />
          <InfoRow label="Address" value={sheetData.address} />
          <InfoRow label="Shop Code" value={sheetData.sheetCode} valueColor="#818cf8" />
        </div>

        {/* Slots summary */}
        <div
          style={{
            background: "rgba(15,23,42,0.6)",
            borderRadius: 10,
            padding: "4px 14px",
            marginBottom: 14,
            border: "1px solid rgba(148,163,184,0.1)",
          }}
        >
          <InfoRow label="Total Active Slots" value={totalSlots} valueColor="#00b4d8" />
          <InfoRow label="Nearest Expiry" value={nearestPack ? formatDate(nearestPack.expiry) : "—"} valueColor={nearestPack && getDaysRemaining(nearestPack.expiry) <= 7 ? "#fca5a5" : "#e2e8f0"} />
          {nearestPack && <InfoRow label="Days Remaining" value={getDaysRemaining(nearestPack.expiry) + " days"} valueColor={getDaysRemaining(nearestPack.expiry) <= 7 ? "#fca5a5" : "#6ee7b7"} />}
        </div>

        {/* Active packs with availed date */}
        {activePacks.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Active Packs
            </div>
            {activePacks.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(15,23,42,0.6)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 6,
                  border: "1px solid rgba(0,180,216,0.15)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{p.slots} Slots</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Availed: {p.availed ? formatDate(p.availed) : "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#fde68a" }}>Expires: {formatDate(p.expiry)}</div>
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 2,
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

        {activePacks.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 12,
              background: "rgba(239,68,68,0.08)",
              borderRadius: 8,
              marginBottom: 14,
              border: "1px solid rgba(239,68,68,0.2)",
              fontSize: 12,
              color: "#fca5a5",
            }}
          >
            No active packs. Purchase slots to continue.
          </div>
        )}

        {/* Last synced */}
        {sheetData.syncedAt && <div style={{ fontSize: 10, color: "#475569", textAlign: "center", marginBottom: 14 }}>Last synced: {sheetData.syncedAt}</div>}

        {/* Logout */}
        <button className="btn btn-danger" style={{ width: "100%", fontSize: 13 }} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default ProfileView;
