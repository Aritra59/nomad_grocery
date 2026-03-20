import React, { useState } from "react";
import { syncSheetByCode } from "../../hooks/useSheetSync";
import AppModal from "../../components/common/AppModal";

function LoginModal({ onClose, onLogin }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);

  const handleLogin = async () => {
    if (!code.trim()) {
      setModal({
        type: "warning",
        title: "Code Required",
        message: "Please enter your shop code to login.",
        onConfirm: () => setModal(null),
      });
      return;
    }
    setLoading(true);
    try {
      const data = await syncSheetByCode(code.trim());
      onLogin(code.trim(), data);
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("Could not reach") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        setModal({
          type: "warning",
          title: "Login Delay",
          message: "Login Delay. Please try after sometime.",
          onConfirm: () => {
            setModal(null);
            onLogin(code.trim(), null);
          },
          confirmLabel: "Continue",
        });
      } else {
        setModal({
          type: "error",
          title: "Invalid Code",
          message: "Invalid code. Please check and try again.",
          onConfirm: () => setModal(null),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel={modal.confirmLabel || "OK"} />}

      <div
        style={{
          background: "#1a1f2e",
          borderRadius: 14,
          padding: 22,
          width: "100%",
          maxWidth: 340,
          border: "1px solid rgba(0,180,216,0.25)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Sign in to your Shop</div>
          <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>Enter the code shared with you when you signed up for Nomad GrocerApp.</div>
        </div>

        {/* Input */}
        <input
          className="input"
          placeholder="Enter your Shop Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
          autoFocus
          style={{ marginBottom: 12, textAlign: "center", letterSpacing: "0.1em", fontWeight: 600 }}
        />

        {/* Login button */}
        <button className={"btn btn-primary" + (loading ? " btn-disabled" : "")} style={{ width: "100%", marginBottom: 8 }} onClick={loading ? undefined : handleLogin}>
          {loading ? "Verifying…" : "Sign In"}
        </button>

        {/* Cancel */}
        <button className="btn btn-outline" style={{ width: "100%" }} onClick={onClose}>
          Cancel – Continue Exploring
        </button>

        {/* Footer */}
        <div style={{ marginTop: 14, fontSize: 10, color: "#334155", textAlign: "center" }}>Don't have a code? Message us on WhatsApp to get started.</div>
      </div>
    </div>
  );
}

export default LoginModal;
