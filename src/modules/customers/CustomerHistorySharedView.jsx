import React, { useEffect, useState, useMemo } from "react";
import Icon from "../../components/common/Icon";
import SelectField from "../../components/common/SelectField";

function CustomerHistorySharedView({ customers, orders, sharedCustomerId }) {
  const [customer, setCustomer] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = sharedCustomerId || params.get("customerId");
    if (!id) {
      setNotFound(true);
      return;
    }
    const found = customers.find((c) => String(c.id) === String(id));
    if (found) setCustomer(found);
    else setNotFound(true);
  }, [customers]);

  if (notFound) {
    return (
      <div className="p-4 text-center text-muted">
        <div className="fs-1">🔍</div>
        <div>Customer not found or link is invalid.</div>
      </div>
    );
  }

  if (!customer) {
    return <div className="p-4 text-center text-muted">Loading...</div>;
  }

  const customerOrdersAll = orders.filter((o) => String(o.customerId) === String(customer.id) || o.customerName === customer.name);

  const customerOrders = useMemo(() => {
    let list = [...customerOrdersAll];
    const now = new Date();
    if (periodFilter === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      list = list.filter((o) => new Date(o.date) >= today);
    } else if (periodFilter === "week") {
      list = list.filter((o) => new Date(o.date) >= new Date(now.getTime() - 7 * 86400000));
    } else if (periodFilter === "month") {
      list = list.filter((o) => {
        const d = new Date(o.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (periodFilter === "year") {
      list = list.filter((o) => new Date(o.date).getFullYear() === now.getFullYear());
    }
    return list;
  }, [customerOrdersAll, periodFilter]);

  const totalCredit = customerOrders.filter((o) => o.paymentStatus === "credit").reduce((sum, o) => sum + (o.total || 0), 0);

  const totalPaid = customerOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.total || 0), 0);

  const totalOrders = customerOrders.length;

  return (
      <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", background: "#0d1117", color: "#e2e8f0" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f1923, #1a2535)",
            padding: "14px 16px 12px",
            borderBottom: "1px solid rgba(0,180,216,0.25)",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", textAlign: "center" }}>Customer Account Statement</div>
          <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 2 }}>Shareable view — read only</div>
        </div>

        {/* Customer Info */}
        <div style={{ padding: "12px 16px 0" }}>
          <div className="list-card" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{customer.name}</div>
            <div className="text-small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="Phone" size={12} />
              <span>{customer.mobile}</span>
            </div>
            {customer.address && (
              <div className="text-small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="MapPin" size={12} />
                <span>{customer.address}</span>
              </div>
            )}
            <div className="text-small">Member since: {customer.joinDate ? new Date(customer.joinDate).toLocaleDateString("en-IN") : "—"}</div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ padding: "0 16px 8px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }} className="list-card">
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Total Orders</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{totalOrders}</div>
            </div>
            <div style={{ flex: 1 }} className="list-card">
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Paid</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#06d6a0" }}>₹{totalPaid.toFixed(0)}</div>
            </div>
            <div style={{ flex: 1 }} className="list-card">
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Credit Due</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fca5a5" }}>₹{totalCredit.toFixed(0)}</div>
            </div>
          </div>
        </div>

        {/* Outstanding Banner */}
        {totalCredit > 0 && (
          <div
            style={{
              margin: "0 16px 10px",
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "#fecaca" }}>Outstanding Amount</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fee2e2" }}>₹{totalCredit.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "#fecaca" }}>Please clear at the earliest</div>
          </div>
        )}

        {totalCredit === 0 && totalOrders > 0 && (
          <div
            style={{
              margin: "0 16px 10px",
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(22,163,74,0.16)",
              border: "1px solid rgba(34,197,94,0.45)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#bbf7d0" }}>All Clear</div>
            <div style={{ fontSize: 11, color: "#bbf7d0" }}>No outstanding credit</div>
          </div>
        )}

        {/* Filters + History */}
        <div style={{ padding: "4px 16px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>Order History</div>
            <SelectField value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} selectStyle={{ width: "auto", minWidth: 120, fontSize: 11, paddingTop: 4, paddingBottom: 4 }}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </SelectField>
          </div>
        </div>

        <div className="list" style={{ padding: "0 16px 20px" }}>
          {customerOrders.length === 0 ? (
            <div className="text-muted" style={{ fontSize: 11 }}>
              No orders yet.
            </div>
          ) : (
            customerOrders
              .slice()
              .reverse()
              .map((o) => (
                <div key={o.id} className="list-card">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{o.orderNumber || "Order #" + o.id}</div>
                      <div className="text-small">{o.date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>₹{(o.total || 0).toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>{o.items?.length || 0} items</div>
                    </div>
                  </div>
                  {o.items && o.items.length > 0 && (
                    <div className="text-small" style={{ marginTop: 4 }}>
                      {o.items.map((i) => i.name).join(", ")}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="text-muted" style={{ fontSize: 10, textAlign: "center", paddingBottom: 14 }}>
          Powered by Nomad GroceryApp
        </div>
    </div>
  );
}

export default CustomerHistorySharedView;
