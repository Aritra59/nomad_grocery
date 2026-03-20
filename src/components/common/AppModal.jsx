import React from "react";
import Icon from "./Icon";

/**
 * Reusable in-app modal
 * Props:
 * - type: "alert" | "confirm" | "success" | "error" | "warning"
 * - title: string
 * - message: string
 * - confirmLabel: string (default "OK")
 * - cancelLabel: string (default "Cancel")
 * - onConfirm: function
 * - onCancel: function (if null, no cancel button shown)
 */

const ICONS = {
  alert: "AlertTriangle",
  confirm: "HelpCircle",
  success: "CheckCircle2",
  error: "XCircle",
  warning: "AlertTriangle",
  info: "Info",
};

const COLORS = {
  alert: "#f59e0b",
  confirm: "#818cf8",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#00b4d8",
};

function AppModal({ type = "alert", title, message, confirmLabel = "OK", cancelLabel = "Cancel", onConfirm, onCancel }) {
  const color = COLORS[type] || COLORS.info;
  const iconName = ICONS[type] || ICONS.info;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#1a1f2e",
          borderRadius: 14,
          padding: "22px 20px",
          width: "100%",
          maxWidth: 340,
          border: `1px solid ${color}44`,
          boxShadow: `0 0 24px ${color}22`,
        }}
      >
        {/* Icon + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "rgba(15,23,42,0.9)",
              border: `1px solid ${color}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={iconName} size={18} strokeWidth={2.4} style={{ color }} />
          </span>
          {title && <div style={{ fontSize: 14, fontWeight: 700, color }}>{title}</div>}
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              fontSize: 13,
              color: "#cbd5e1",
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            {message}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                background: "transparent",
                color: "#e2e8f0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              flex: 2,
              padding: "9px 0",
              borderRadius: 999,
              border: "none",
              background: `linear-gradient(135deg, ${color}, ${color}bb)`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppModal;
