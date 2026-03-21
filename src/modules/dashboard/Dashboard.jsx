import React from "react";
import PacksStatusCard from "./PacksStatusCard";
import { useOrderData } from "../../hooks/useOrderData";

function Dashboard({ mode, sheetData, onNavigate, onSlotsActivated }) {
  const { orders } = useOrderData();

  const isExplore = mode === "explore";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pendingCount = orders.filter((o) => o.status === "pending" && new Date(o.date) >= todayStart).length;

  return (
    <div>
      {/* Explore notice */}
      {isExplore && (
        <div className="explore-notice">
          <div className="explore-notice-title">Explore</div>
          <div className="explore-notice-subtitle">Demo Mode</div>
          <div>All data shown is sample only. Login with your code to start live mode.</div>
        </div>
      )}

      {/* Tagline */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: 4,
          }}
        >
          Your shop control center
        </div>
        <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>Add products. Take orders. Track customers. Manage procurement.</div>
      </div>

      {/* Navigation tiles */}
      <section style={{ marginBottom: 14 }}>
        <div className="grid-2">
          <div className="tile-card" onClick={() => onNavigate("inventory")}>
            <div className="tile-icon">📦</div>
            <div className="tile-title">Inventory</div>
            <div className="tile-subtitle">Products &amp; Stock</div>
          </div>

          <div className="tile-card" onClick={() => onNavigate("orders")}>
            <div className="tile-icon">🧾</div>
            <div className="tile-title">Orders</div>
            <div className="tile-subtitle">Live &amp; History</div>
            {pendingCount > 0 && <div className="tile-badge">{pendingCount}</div>}
          </div>

          <div className="tile-card" onClick={() => onNavigate("customers")}>
            <div className="tile-icon">👥</div>
            <div className="tile-title">Customers</div>
            <div className="tile-subtitle">Orders &amp; History</div>
          </div>

          <div className="tile-card" onClick={() => onNavigate("procurement")}>
            <div className="tile-icon">📋</div>
            <div className="tile-title">Procurement</div>
            <div className="tile-subtitle">Suppliers &amp; Procure</div>
          </div>
        </div>
      </section>

      {/* Packs & Slots */}
      <PacksStatusCard mode={mode} sheetData={sheetData} onSlotsActivated={onSlotsActivated} />
    </div>
  );
}

export default Dashboard;
