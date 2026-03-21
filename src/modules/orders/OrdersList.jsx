import React, { useState, useMemo } from "react";
import { useOrderData } from "../../hooks/useOrderData";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { filterByDateRange, sortOrders, getOrderTotals } from "../../utils/ordersUtils";
import AppModal from "../../components/common/AppModal";
import { useCustomersData } from "../../hooks/useCustomersData";
import BackIcon from "../../components/common/BackIcon";
import SelectField from "../../components/common/SelectField";
import Icon from "../../components/common/Icon";

function OrdersList({ mode, onBack, onAddOrder, onViewOrder, onViewCustomer }) {
  const { orders } = useOrderData();
  const [tab, setTab] = useState("live");

  // Live tab state
  const [liveSearch, setLiveSearch] = useState("");
  const [liveSortBy, setLiveSortBy] = useState("recent");
  const [liveSortDir, setLiveSortDir] = useState("desc");

  // History tab state
  const [histSearch, setHistSearch] = useState("");
  const [histSortBy, setHistSortBy] = useState("recent");
  const [histSortDir, setHistSortDir] = useState("desc");
  const [histPeriod, setHistPeriod] = useState("month");
  const [histStatus, setHistStatus] = useState("all");
  const [histPay, setHistPay] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [modal, setModal] = useState(null);
  const { customers } = useCustomersData();

  const {
    listening: liveListening,
    start: liveStart,
    stop: liveStop,
  } = useVoiceInput({
    onResult: (text) => setLiveSearch(text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  const {
    listening: histListening,
    start: histStart,
    stop: histStop,
  } = useVoiceInput({
    onResult: (text) => setHistSearch(text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const monthName = now.toLocaleString("en-IN", { month: "long" });
  const day1 = "1 " + now.toLocaleString("en-IN", { month: "short" });
  const dayNow = now.getDate() + " " + now.toLocaleString("en-IN", { month: "short" });

  // Live orders — today's pending only
  const liveOrders = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let list = orders.filter((o) => {
      if (o.status !== "pending") return false;
      return new Date(o.date) >= todayStart;
    });
    if (liveSearch.trim()) {
      const q = liveSearch.trim().toLowerCase();
      list = list.filter((o) => o.customerName?.toLowerCase().includes(q) || o.mobile?.includes(q));
    }
    return sortOrders(list, liveSortBy, liveSortDir);
  }, [orders, liveSearch, liveSortBy, liveSortDir]);

  // Today all orders KPIs
  const todayAllOrders = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return orders.filter((o) => new Date(o.date) >= todayStart);
  }, [orders]);

  // History orders
  const histOrders = useMemo(() => {
    let list = [...orders];
    if (histPeriod === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      list = list.filter((o) => new Date(o.date) >= todayStart);
    } else if (histPeriod === "week") {
      list = list.filter((o) => new Date(o.date) >= new Date(now.getTime() - 7 * 86400000));
    } else if (histPeriod === "month") {
      list = list.filter((o) => {
        const d = new Date(o.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (histPeriod === "year") {
      list = list.filter((o) => new Date(o.date).getFullYear() === now.getFullYear());
    } else if (histPeriod === "custom" && customFrom && customTo) {
      list = filterByDateRange(list, customFrom, customTo);
    }
    if (histStatus !== "all") list = list.filter((o) => o.status === histStatus);
    if (histPay !== "all") list = list.filter((o) => o.paymentStatus === histPay);
    if (histSearch.trim()) {
      const q = histSearch.trim().toLowerCase();
      list = list.filter((o) => o.customerName?.toLowerCase().includes(q) || o.mobile?.includes(q));
    }
    return sortOrders(list, histSortBy, histSortDir);
  }, [orders, histPeriod, histStatus, histPay, histSearch, histSortBy, histSortDir, customFrom, customTo]);

  // KPI calculations
  const todayTotals = useMemo(() => {
    const t = todayAllOrders;
    return {
      orders: t.length,
      ordersAmt: t.reduce((s, o) => s + (o.total || 0), 0),
      cancelled: t.filter((o) => o.status === "cancelled").length,
      cancelledAmt: t.filter((o) => o.status === "cancelled").reduce((s, o) => s + (o.total || 0), 0),
      pending: t.filter((o) => o.status === "pending").length,
      pendingAmt: t.filter((o) => o.status === "pending").reduce((s, o) => s + (o.total || 0), 0),
      completed: t.filter((o) => o.status === "completed").length,
      completedAmt: t.filter((o) => o.status === "completed").reduce((s, o) => s + (o.total || 0), 0),
      paid: t.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + (o.total || 0), 0),
      credit: t.filter((o) => o.paymentStatus === "credit").reduce((s, o) => s + (o.total || 0), 0),
    };
  }, [todayAllOrders]);

  const histTotals = useMemo(() => {
    const t = histOrders;
    return {
      orders: t.length,
      ordersAmt: t.reduce((s, o) => s + (o.total || 0), 0),
      cancelled: t.filter((o) => o.status === "cancelled").length,
      cancelledAmt: t.filter((o) => o.status === "cancelled").reduce((s, o) => s + (o.total || 0), 0),
      completed: t.filter((o) => o.status === "completed").length,
      completedAmt: t.filter((o) => o.status === "completed").reduce((s, o) => s + (o.total || 0), 0),
      paid: t.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + (o.total || 0), 0),
      credit: t.filter((o) => o.paymentStatus === "credit").reduce((s, o) => s + (o.total || 0), 0),
    };
  }, [histOrders]);

  const toggleLiveSort = (field) => {
    if (liveSortBy === field) setLiveSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setLiveSortBy(field);
      setLiveSortDir("desc");
    }
  };

  const toggleHistSort = (field) => {
    if (histSortBy === field) setHistSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setHistSortBy(field);
      setHistSortDir("desc");
    }
  };

  // KPI pill component — compact to fit within viewport
  const KpiPill = ({ label, count, amt, countColor }) => (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "#111827",
        border: "1px solid rgba(0,180,216,0.2)",
        borderRadius: 8,
        padding: "4px 6px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: countColor || "#00b4d8" }}>{count}</div>
      {amt !== undefined && <div style={{ fontSize: 9, color: "#334155" }}>₹{amt}</div>}
    </div>
  );
  // Order card
  const OrderCard = ({ o, showViewCustomer = false }) => {
    const sc = {
      pending: { bg: "rgba(245,158,11,0.12)", color: "#fde68a", border: "#f59e0b" },
      completed: { bg: "rgba(6,214,160,0.12)", color: "#06d6a0", border: "#06d6a0" },
      cancelled: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "#ef4444" },
    }[o.status] || { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "#475569" };

    const pc = {
      paid: { bg: "rgba(6,214,160,0.12)", color: "#06d6a0", border: "#06d6a0" },
      credit: { bg: "rgba(245,158,11,0.12)", color: "#fde68a", border: "#f59e0b" },
      unpaid: { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "#475569" },
    }[o.paymentStatus || "unpaid"] || { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "#475569" };

    return (
      <div className="list-card" style={{ cursor: "pointer", marginBottom: 8 }} onClick={() => onViewOrder(o.id)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* Left */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{o.customerName}</div>
            <div className="text-small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="Phone" size={12} />
              <span>{o.mobile}</span>
            </div>
            {(o.credit || 0) > 0 && <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>Credit: ₹{o.credit}</div>}
          </div>
          {/* Centre — status pills for history */}
          {showViewCustomer && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", padding: "0 8px" }}>
              <span style={{ background: sc.bg, color: sc.color, border: "1px solid " + sc.border, padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>{o.status}</span>
              <span style={{ background: pc.bg, color: pc.color, border: "1px solid " + pc.border, padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>
                {o.paymentStatus || "unpaid"}
              </span>
            </div>
          )}
          {/* Right */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {o.orderNumber && <div style={{ fontSize: 10, color: "#00b4d8" }}>{o.orderNumber}</div>}
            <div style={{ fontSize: 10, color: "#475569" }}>{o.date}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>₹{o.total}</div>
            <div style={{ fontSize: 10, color: "#475569" }}>{o.items?.length} items</div>
            {o.sellerCreated && <span style={{ background: "rgba(129,140,248,0.15)", color: "#c7d2fe", padding: "1px 6px", borderRadius: 999, fontSize: 9 }}>Seller</span>}
          </div>
        </div>
        {showViewCustomer && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1, fontSize: 10 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onViewCustomer) {
                  const cust = customers?.find((c) => c.mobile === o.mobile);
                  if (cust) onViewCustomer(cust.id);
                }
              }}
            >
              View Customer
            </button>
            <button
              className="btn btn-outline"
              style={{ flex: 1, fontSize: 10 }}
              onClick={(e) => {
                e.stopPropagation();
                onViewOrder(o.id);
              }}
            >
              View Order
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: 70 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel="OK" />}

      {/* Sticky: tabs + header + KPIs + search + filters — only order list scrolls */}
      <div className="sticky-header" style={{ marginBottom: 8 }}>
        <div className="tab-bar" style={{ marginBottom: 8 }}>
          <button className={"tab-btn" + (tab === "live" ? " active" : "")} onClick={() => setTab("live")}>
            Today (Live)
          </button>
          <button className={"tab-btn" + (tab === "history" ? " active" : "")} onClick={() => setTab("history")}>
            History
          </button>
        </div>

        {/* ── LIVE TAB content in sticky ── */}
        {tab === "live" && (
          <>
            {/* Single row: back + date + KPI pills — all fit within width */}
            <div style={{ display: "flex", alignItems: "stretch", gap: 6, marginBottom: 8 }}>
              <span className="back-arrow-gradient" style={{ flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center" }} onClick={onBack}>
                <BackIcon size={18} strokeWidth={3} />
              </span>
              <div style={{ flexShrink: 0, background: "#111827", border: "1px solid rgba(0,180,216,0.25)", borderRadius: 8, padding: "4px 8px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#00b4d8" }}>Today</div>
                <div style={{ fontSize: 8, color: "#64748b" }}>{todayStr}</div>
              </div>
              <div style={{ display: "flex", flex: 1, minWidth: 0, gap: 6 }}>
                <KpiPill label="Orders" count={todayTotals.orders} amt={todayTotals.ordersAmt} />
                <KpiPill label="Cancelled" count={todayTotals.cancelled} amt={todayTotals.cancelledAmt} countColor="#ef4444" />
                <KpiPill label="Pending" count={todayTotals.pending} amt={todayTotals.pendingAmt} countColor="#f59e0b" />
                <KpiPill label="Completed" count={todayTotals.completed} amt={todayTotals.completedAmt} countColor="#06d6a0" />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "#111827",
                    border: "1px solid rgba(0,180,216,0.2)",
                    borderRadius: 8,
                    padding: "4px 6px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.03em" }}>Paid/Credit</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#06d6a0" }}>₹{todayTotals.paid}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b" }}>₹{todayTotals.credit}</div>
                </div>
              </div>
            </div>

            <div className="search-row" style={{ marginBottom: 8 }}>
              <input className="input" style={{ flex: 1 }} placeholder="Name or mobile…" value={liveSearch} onChange={(e) => setLiveSearch(e.target.value)} />
              <button className={"mic-btn" + (liveListening ? " listening" : "")} onClick={liveListening ? liveStop : liveStart}>
                <Icon name="Mic" size={16} />
              </button>
              <button className="btn btn-primary" style={{ fontSize: 11, borderRadius: 8 }} onClick={onAddOrder}>
                + New
              </button>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                ["recent", "Recent"],
                ["items", "Item No"],
                ["amount", "Amount"],
              ].map(([field, label]) => (
                <button key={field} className={"btn " + (liveSortBy === field ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 10 }} onClick={() => toggleLiveSort(field)}>
                  {label} {liveSortBy === field ? (liveSortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── HISTORY TAB content in sticky ── */}
        {tab === "history" && (
          <>
            {/* Single row: back + date + KPI pills — all fit within width */}
            <div style={{ display: "flex", alignItems: "stretch", gap: 6, marginBottom: 8 }}>
              <span className="back-arrow-gradient" style={{ flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center" }} onClick={onBack}>
                <BackIcon size={18} strokeWidth={3} />
              </span>
              <div style={{ flexShrink: 0, background: "#111827", border: "1px solid rgba(0,180,216,0.25)", borderRadius: 8, padding: "4px 8px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#00b4d8" }}>{monthName}</div>
                <div style={{ fontSize: 8, color: "#64748b" }}>{day1}–{dayNow}</div>
              </div>
              <div style={{ display: "flex", flex: 1, minWidth: 0, gap: 6 }}>
                <KpiPill label="Orders" count={histTotals.orders} amt={histTotals.ordersAmt} />
                <KpiPill label="Cancelled" count={histTotals.cancelled} amt={histTotals.cancelledAmt} countColor="#ef4444" />
                <KpiPill label="Completed" count={histTotals.completed} amt={histTotals.completedAmt} countColor="#06d6a0" />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "#111827",
                    border: "1px solid rgba(0,180,216,0.2)",
                    borderRadius: 8,
                    padding: "4px 6px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.03em" }}>Paid/Credit</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#06d6a0" }}>₹{histTotals.paid}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b" }}>₹{histTotals.credit}</div>
                </div>
              </div>
            </div>

            <div className="search-row" style={{ marginBottom: 8 }}>
              <input className="input" style={{ flex: 1 }} placeholder="Name or mobile…" value={histSearch} onChange={(e) => setHistSearch(e.target.value)} />
              <button className={"mic-btn" + (histListening ? " listening" : "")} onClick={histListening ? histStop : histStart}>
                <Icon name="Mic" size={16} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {[
                ["recent", "Recent"],
                ["items", "Item No"],
                ["amount", "Amount"],
              ].map(([field, label]) => (
                <button key={field} className={"btn " + (histSortBy === field ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 10 }} onClick={() => toggleHistSort(field)}>
                  {label} {histSortBy === field ? (histSortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              ))}
            </div>

            <div className="filter-row">
              <div className="filter-col">
                <div className="filter-label">Period</div>
                <SelectField
                  value={histPeriod}
                  onChange={(e) => {
                    setHistPeriod(e.target.value);
                    setShowCustom(e.target.value === "custom");
                  }}
                  selectStyle={{ fontSize: 11 }}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom</option>
                  <option value="all">All Time</option>
                </SelectField>
              </div>
              <div className="filter-col">
                <div className="filter-label">Status</div>
                <SelectField value={histStatus} onChange={(e) => setHistStatus(e.target.value)} selectStyle={{ fontSize: 11 }}>
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </SelectField>
              </div>
              <div className="filter-col">
                <div className="filter-label">Payment</div>
                <SelectField value={histPay} onChange={(e) => setHistPay(e.target.value)} selectStyle={{ fontSize: 11 }}>
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="credit">Credit</option>
                </SelectField>
              </div>
            </div>

            {showCustom && (
              <div style={{ display: "flex", gap: 8 }}>
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
          </>
        )}
      </div>

      {/* ── LIVE TAB list (scrollable) ── */}
      {tab === "live" && (
        <div>
          <div style={{ fontSize: 11, color: "#475569", margin: "8px 0" }}>
            {liveOrders.length} pending order{liveOrders.length !== 1 ? "s" : ""}
          </div>

          <div className="list">
            {liveOrders.map((o) => (
              <OrderCard key={o.id} o={o} />
            ))}
            {liveOrders.length === 0 && (
              <div className="text-muted" style={{ marginTop: 12 }}>
                No pending orders today.
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── HISTORY TAB list (scrollable) ── */}
      {tab === "history" && (
        <div>
          <div style={{ fontSize: 11, color: "#475569", margin: "8px 0" }}>
            {histOrders.length} order{histOrders.length !== 1 ? "s" : ""}
          </div>

          <div className="list">
            {histOrders.map((o) => (
              <OrderCard key={o.id} o={o} showViewCustomer={true} />
            ))}
            {histOrders.length === 0 && (
              <div className="text-muted" style={{ marginTop: 12 }}>
                No orders found.
              </div>
            )}
          </div>
        </div>
      )}
      {/* Bottom bar */}
      <div
        className="fixed-bottom-bar compact-bottom-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {tab === "live" ? (
          <>
            <div style={{ fontSize: 11, color: "#475569" }}>{liveOrders.length} pending</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>₹{liveOrders.reduce((s, o) => s + (o.total || 0), 0)}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: "#475569" }}>{histOrders.length} orders</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>₹{histTotals.ordersAmt}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default OrdersList;
