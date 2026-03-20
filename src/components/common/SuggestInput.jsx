import React, { useState, useRef } from "react";
import Icon from "./Icon";

/**
 * Reusable suggestion input with a floating list positioned directly
 * under the field (used instead of <datalist> for better control).
 *
 * Props:
 * - value, onChange, placeholder
 * - options: string[]
 * - fieldProps: forwarded props like onFocus / style for voice focus, etc.
 */
function SuggestInput({ value, onChange, placeholder, options = [], fieldProps = {} }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const handleFocus = (e) => {
    if (fieldProps.onFocus) fieldProps.onFocus(e);
    setOpen(true);
  };

  const handleBlur = () => {
    // Small delay so click on option can register before blur closes.
    setTimeout(() => setOpen(false), 120);
  };

  const normalized = (options || []).filter(Boolean);
  const lower = value.toLowerCase();
  const filtered =
    lower.trim() === ""
      ? normalized
      : normalized.filter((opt) => opt.toLowerCase().includes(lower));

  return (
    <div style={{ position: "relative" }} ref={wrapperRef}>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{ paddingRight: 30, ...(fieldProps.style || {}) }}
      />
      {/* Chevron icon to indicate dropdown suggestions */}
      <div
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="ChevronDown" size={16} strokeWidth={2.2} />
      </div>
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            borderRadius: 8,
            background: "#111827",
            border: "1px solid rgba(15,23,42,0.9)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
            maxHeight: 220,
            overflowY: "auto",
            zIndex: 60,
          }}
        >
          {filtered.map((opt) => (
            <div
              key={opt}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                color: "#e2e8f0",
                cursor: "pointer",
                borderBottom: "1px solid rgba(30,41,59,0.9)",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestInput;

