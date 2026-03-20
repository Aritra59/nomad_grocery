import React, { useState, useMemo } from "react";
import { useCustomersData } from "../../hooks/useCustomersData";
import { useOrderData } from "../../hooks/useOrderData";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import SelectField from "../../components/common/SelectField";
import Icon from "../../components/common/Icon";

function CustomersList({ mode, onBack, onViewCustomer, onAddCustomer }) {
  const { customers, totalCreditAllCustomers } = useCustomersData();
  const { orders } = useOrderData();

  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [modal, setModal] = useState(null);

  const { listening, start, stop } = useVoiceInput({
    onResult: (text) => setSearch(text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  const monthName = new Date().toLocaleString("en-IN", { month: "long" });

  const getCustomerAge = (joinDate) => {
    if (!joinDate) return null;
    const join = new Date(joinDate);
    return join.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  const getCustomerStats = (mobile) => {
    let customerOrders = orders.filter((o) => o.mobile === mobile);
    const now = new Date();

    if (periodFilter === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      customerOrders = customerOrders.filter((o) => new Date(o.date) >= today);
    } else if (periodFilter === "week") {
      customerOrders = customerOrders.filter((o) => new Date(o.date) >= new Date(now.getTime() - 7 * 86400000));
    } else if (periodFilter === "month") {
      customerOrders = customerOrders.filter((o) => {
        const d = new Date(o.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (periodFilter === "year") {
      customerOrders = customerOrders.filter((o) => new Date(o.date).getFullYear() === now.getFullYear());
    } else if (periodFilter === "custom" && customFrom && customTo) {
      customerOrders = customerOrders.filter((o) => {
        const d = new Date(o.date);
        return d >= new Date(customFrom) && d <= new Date(customTo);
      });
    }

    if (statusFilter !== "all") customerOrders = customerOrders.filter((o) => o.status === statusFilter);
    if (payFilter !== "all") customerOrders = customerOrders.filter((o) => o.paymentStatus === payFilter);

    return {
      totalOrders: customerOrders.length,
      totalAmount: customerOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      totalCredit: customerOrders.filter((o) => o.paymentStatus === "credit").reduce((sum, o) => sum + (o.total || 0), 0),
    };
  };

  const filtered = useMemo(() => {
    let list = [...customers];

    // Status filter — filter by customer's order history
    if (statusFilter === "completed") {
      list = list.filter((c) => orders.some((o) => o.mobile === c.mobile && o.status === "completed"));
    } else if (statusFilter === "cancelled") {
      list = list.filter((c) => orders.some((o) => o.mobile === c.mobile && o.status === "cancelled"));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name?.toLowerCase().includes(q) || c.mobile?.includes(q));
    }

    // Sort
    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (sortBy === "orders") {
        valA = getCustomerStats(a.mobile).totalOrders;
        valB = getCustomerStats(b.mobile).totalOrders;
      } else if (sortBy === "amount") {
        valA = getCustomerStats(a.mobile).totalAmount;
        valB = getCustomerStats(b.mobile).totalAmount;
      }
      if (typeof valA === "string") return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortDir === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [customers, search, statusFilter, sortBy, sortDir, orders]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const totalOrdersCount = filtered.reduce((sum, c) => sum + getCustomerStats(c.mobile).totalOrders, 0);
  const totalAmountSum = filtered.reduce((sum, c) => sum + getCustomerStats(c.mobile).totalAmount, 0);
  const totalCreditSum = filtered.reduce((sum, c) => sum + getCustomerStats(c.mobile).totalCredit, 0);
  return (
    <div style={{ paddingBottom: 80 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel="OK" />}

      {/* Header row */}
      <div className="page-header-row">
        <span className="back-arrow-gradient" onClick={onBack}>
          <BackIcon size={20} strokeWidth={3} />
        </span>

        <div className="page-title-pill" style={{ padding: "5px 14px" }}>
          {monthName} · 1–{new Date().getDate()} {new Date().toLocaleString("en-IN", { month: "short" })}
        </div>
        <div className="stat-row" style={{ margin: 0, flex: 1, justifyContent: "flex-end" }}>
          <div className="stat-pill">
            <span className="stat-pill-label">Customers</span>
            <span className="stat-pill-value">{filtered.length}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-label">Orders</span>
            <span className="stat-pill-value">{totalOrdersCount}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-label">Amt/Credit</span>
            <span className="stat-pill-value">
              <span className="green">₹{totalAmountSum}</span>
              {totalCreditSum > 0 && <span className="red"> / ₹{totalCreditSum}</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Search + Sort + Add — sticky */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "#0d1117", paddingBottom: 8, borderBottom: "1px solid rgba(0,180,216,0.1)" }}>
        <div className="search-row">
          <input className="input" style={{ flex: 1 }} placeholder="Name or mobile…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className={"mic-btn" + (listening ? " listening" : "")} onClick={listening ? stop : start}>
            <Icon name="Mic" size={16} />
          </button>
          <button className="btn btn-primary" style={{ fontSize: 11, borderRadius: 8 }} onClick={onAddCustomer}>
            + Add
          </button>
        </div>

        {/* Sort pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[
            ["name", "Name"],
            ["orders", "Orders"],
            ["amount", "Amount"],
          ].map(([field, label]) => (
            <button key={field} className={"btn " + (sortBy === field ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 10 }} onClick={() => toggleSort(field)}>
              {label} {sortBy === field ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          ))}
        </div>
      </div>

      {/* 3 filters */}
      <div className="filter-row">
        <div className="filter-col">
          <div className="filter-label">Period</div>
          <SelectField
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              setShowCustom(e.target.value === "custom");
            }}
            selectStyle={{ fontSize: 11 }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom</option>
          </SelectField>
        </div>
        <div className="filter-col">
          <div className="filter-label">Status</div>
          <SelectField value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} selectStyle={{ fontSize: 11 }}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </SelectField>
        </div>
        <div className="filter-col">
          <div className="filter-label">Payment</div>
          <SelectField value={payFilter} onChange={(e) => setPayFilter(e.target.value)} selectStyle={{ fontSize: 11 }}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="credit">Credit</option>
          </SelectField>
        </div>
      </div>

      {/* Custom date range */}
      {showCustom && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="filter-label">From</div>
            <input className="input" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ fontSize: 11 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="filter-label">To</div>
            <input className="input" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ fontSize: 11 }} />
          </div>
        </div>
      )}

      {/* Customer cards */}
      <div className="list">
        {filtered.map((c) => {
          const stats = getCustomerStats(c.mobile);
          const age = getCustomerAge(c.joinDate);
          return (
            <div key={c.id} className="list-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                {/* Left */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{c.name}</div>
                  <div className="text-small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="Phone" size={12} />
                    <span>{c.mobile}</span>
                  </div>
                  {c.address && (
                    <div className="text-small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="MapPin" size={12} />
                      <span>{c.address}</span>
                    </div>
                  )}
                  {age && <div className="text-small">Since {age}</div>}
                </div>
                {/* Right */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#475569" }}>
                    Orders: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{stats.totalOrders}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569" }}>
                    Amount: <span style={{ color: "#06d6a0", fontWeight: 600 }}>₹{stats.totalAmount}</span>
                  </div>
                  {(c.totalCredit || 0) > 0 && <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>Credit ₹{c.totalCredit}</div>}

                  <button className="btn btn-outline" style={{ fontSize: 10, padding: "3px 10px", marginTop: 6 }} onClick={() => onViewCustomer(c.id)}>
                    View Orders
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-muted" style={{ marginTop: 12 }}>
            No customers found.
          </div>
        )}
      </div>
      {/* Bottom bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#0a0f18",
          borderTop: "1px solid rgba(0,180,216,0.15)",
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Customers</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>{filtered.length}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Orders</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{totalOrdersCount}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Amount</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#06d6a0" }}>₹{totalAmountSum}</div>
        </div>
      </div>
    </div>
  );
}

export default CustomersList;
