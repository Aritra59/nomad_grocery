import React from "react";

function ProfilePopup({ mode, sheetData, onClose, onLogout }) {
  const isExplore = mode === "explore";

  const initials =
    sheetData?.ownerName
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "NG";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#1f2937",
          borderRadius: 12,
          padding: 20,
          width: "100%",
          maxWidth: 340,
          border: "1px solid rgba(148,163,184,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Profile</div>
          <button className="btn btn-outline" style={{ fontSize: 11, padding: "2px 10px" }} onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{isExplore ? "Sample Kirana" : sheetData?.shopName || "Your Shop"}</div>
            <div className="text-small">{isExplore ? "Guest / Explore Mode" : sheetData?.ownerName || ""}</div>
          </div>
        </div>

        {isExplore ? (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: "rgba(79,70,229,0.15)",
              border: "1px solid rgba(129,140,248,0.3)",
              fontSize: 11,
              color: "#c7d2fe",
              marginBottom: 16,
            }}
          >
            You are in Explore mode with sample data. Sign in with your Code to load your real shop details.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <div className="list-card" style={{ padding: "8px 12px" }}>
              <div className="text-small">Shop Name</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sheetData?.shopName || "—"}</div>
            </div>
            <div className="list-card" style={{ padding: "8px 12px" }}>
              <div className="text-small">Owner Name</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sheetData?.ownerName || "—"}</div>
            </div>
            <div className="list-card" style={{ padding: "8px 12px" }}>
              <div className="text-small">Mobile</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sheetData?.mobile || "—"}</div>
            </div>
            <div className="list-card" style={{ padding: "8px 12px" }}>
              <div className="text-small">Address</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sheetData?.address || "—"}</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!isExplore && (
            <button className="btn btn-danger" style={{ width: "100%" }} onClick={onLogout}>
              Switch to Explore / Sign Out
            </button>
          )}
          <div className="text-muted" style={{ fontSize: 10, textAlign: "center" }}>
            Nomad GrocerApp · v1.0 · For support message us on WhatsApp
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePopup;
