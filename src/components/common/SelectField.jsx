import React from "react";
import Icon from "./Icon";

/**
 * Reusable select wrapper with a Lucide chevron icon and correct positioning.
 *
 * Props:
 * - value, onChange, children (same as a normal <select>)
 * - selectStyle: inline style for the underlying <select>
 * - containerStyle: inline style for the outer wrapper (for flex / width control)
 * - className: extra classes for the <select> (defaults to "select")
 */
function SelectField({ value, onChange, children, selectStyle, containerStyle, className = "select", ...rest }) {
  return (
    <div style={{ position: "relative", ...containerStyle }}>
      <select
        value={value}
        onChange={onChange}
        className={className}
        style={{ paddingRight: 30, ...selectStyle }}
        {...rest}
      >
        {children}
      </select>
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
    </div>
  );
}

export default SelectField;

