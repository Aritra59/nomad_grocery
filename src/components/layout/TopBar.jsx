import React, { useState } from "react";
import nomadLogo from "../../assets/nomad-logo.png";
import LoginModal from "../../modules/dashboard/LoginModal";
import ProfileView from "../../modules/profile/ProfileView";
import { getInitials } from "../../utils/catalogUtils";

function TopBar({ mode, headerTitle, sheetData, onLogin, onLogout }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const isLive = mode === "live";

  // Profile icon initials
  const profileInitials = isLive ? (getInitials(sheetData?.shopName || "")[0] || "N") + (getInitials(sheetData?.ownerName || "")[0] || "") : "N";

  return (
    <>
      <div className="top-bar">
        {/* Left — Logo + Brand */}
        <div className="top-bar-left">
          <div className="brand-logo">
            <img src={nomadLogo} alt="Nomad" />
          </div>
          <div className="brand-text">
            <span className="brand-line-1">Nomad</span>
            <span className="brand-line-2">GroceryApp</span>
          </div>
        </div>

        {/* Centre — Page title only */}
        <div className="top-bar-center">
          {mode === "explore" ? (
            <>
              <div className="top-bar-title top-bar-title-explore">Explore</div>
              <div className="top-bar-subtitle">Demo Mode</div>
            </>
          ) : (
            <div className="top-bar-title">{headerTitle}</div>
          )}
        </div>

        {/* Right — Live: shop info + profile + logout / Explore: Login */}
        <div className="top-bar-right">
          {isLive ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid rgba(0,180,216,0.2)",
                background: "rgba(0,180,216,0.06)",
              }}
              onClick={() => setShowProfile(true)}
            >
              {/* Shop + Owner names */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#f1f5f9",
                    whiteSpace: "nowrap",
                    maxWidth: 100,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sheetData?.shopName || "My Shop"}
                </div>
                <div style={{ fontSize: 9, color: "#64748b" }}>{sheetData?.ownerName || ""}</div>
                <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 600 }}>Logout</div>
              </div>
              {/* Profile icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #00b4d8, #06d6a0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0d1117",
                  flexShrink: 0,
                  border: "1px solid rgba(6,214,160,0.4)",
                }}
              >
                {profileInitials}
              </div>
            </div>
          ) : (
            <>
              <span className="top-bar-cta" onClick={() => setShowLogin(true)}>
                Login
              </span>
              <div className="profile-chip" onClick={() => setShowLogin(true)}>
                N
              </div>
            </>
          )}
        </div>
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={(code, data) => {
            onLogin(code, data);
            setShowLogin(false);
          }}
        />
      )}

      {showProfile && (
        <ProfileView
          mode={mode}
          sheetData={sheetData}
          onClose={() => setShowProfile(false)}
          onLogout={() => {
            setShowProfile(false);
            onLogout();
          }}
        />
      )}
    </>
  );
}

export default TopBar;
