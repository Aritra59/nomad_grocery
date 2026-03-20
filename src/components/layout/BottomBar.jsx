import React from "react";

function BottomBar({ leftText, rightText, ctaLabel, onCtaClick, disabled }) {
  return (
    <footer className="bottom-bar">
      <div className="bottom-bar-inner">
        <div className="bottom-bar-row">
          <span>{leftText || ""}</span>
          <span>{rightText || ""}</span>
        </div>
        {ctaLabel && (
          <button
            className={"btn btn-primary" + (disabled ? " btn-disabled" : "")}
            style={{ width: "100%" }}
            onClick={disabled ? undefined : onCtaClick}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </footer>
  );
}

export default BottomBar;
