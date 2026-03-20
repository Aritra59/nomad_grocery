import React from "react";

function ExploreNotice() {
  return (
    <section
      style={{
        marginBottom: 12,
        padding: 8,
        borderRadius: 8,
        background:
          "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(88,28,135,0.5))",
        border: "1px solid rgba(129,140,248,0.9)",
        fontSize: 11,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Explore mode – sample shop
      </div>
      <div className="text-small">
        You are viewing a sample kirana with mock data. Use the Login option in
        the top bar to switch to your real shop using a Code. Billing flows (UPI
        &amp; WhatsApp) are live, but inventory, orders and customers shown here
        are only for demo.
      </div>
    </section>
  );
}

export default ExploreNotice;
