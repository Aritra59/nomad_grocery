import React, { useState, useMemo } from "react";
import { useCustomersData } from "../../hooks/useCustomersData";
import { useOrderData } from "../../hooks/useOrderData";
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS, sortOrders, filterByDateRange } from "../../utils/ordersUtils";
import { generateCustomerHistoryLink, copyToClipboard } from "../../utils/catalogUtils";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import Icon from "../../components/common/Icon";
import SelectField from "../../components/common/SelectField";

function CreditModal({ customer, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const newCredit = Math.max(0, (customer.totalCredit || 0) - (Number(amount) || 0));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#1a1f2e", borderRadius: 14, padding: 20, width: "100%", maxWidth: 340, border: "1px solid rgba(0,180,216,0.2)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#00b4d8" }}>Credit Payment Update</div>
        <div className="list-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="text-small">Outstanding Credit</span>
            <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>₹{customer.totalCredit || 0}</span>
          </div>
          {customer.lastPaymentDate && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="text-small">Last Payment</span>
              <span style={{ fontSize: 12 }}>{customer.lastPaymentDate}</span>
            </div>
          )}
          {customer.lastPaymentAmount && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-small">Last Amount</span>
              <span style={{ fontSize: 12, color: "#06d6a0" }}>₹{customer.lastPaymentAmount}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="input" placeholder="Pay Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid rgba(0,180,216,0.1)" }}>
            <span className="text-small">New Outstanding</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: newCredit > 0 ? "#ef4444" : "#06d6a0" }}>₹{newCredit}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => {
              if (!amount || Number(amount) <= 0) return;
              onSave({ amount: Number(amount), date, newCredit });
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetail({ mode, onBack, customerId, onViewOrder }) {
  const { getCustomerById, updateCustomer, deleteCustomer } = useCustomersData();
  const { orders } = useOrderData();
  const [editing, setEditing] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [sortDir, setSortDir] = useState("desc");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [modal, setModal] = useState(null);

  const customer = getCustomerById(customerId);
  const [name, setName] = useState(customer?.name || "");
  const [editMobile, setEditMobile] = useState(customer?.mobile || "");
  const [address, setAddress] = useState(customer?.address || "");

  const customerAge = useMemo(() => {
    if (!customer?.joinDate) return null;
    return new Date(customer.joinDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }, [customer]);

  const customerOrders = useMemo(() => {
    if (!customer) return [];
    let list = orders.filter((o) => o.mobile === customer.mobile);
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
    } else if (periodFilter === "custom" && customFrom && customTo) {
      list = filterByDateRange(list, customFrom, customTo);
    }
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (payFilter !== "all") list = list.filter((o) => o.paymentStatus === payFilter);
    return sortOrders(list, sortBy, sortDir);
  }, [orders, customer, periodFilter, statusFilter, payFilter, sortBy, sortDir, customFrom, customTo]);

  if (!customer)
    return (
      <div className="list-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              flexShrink: 0,
              padding: 4,
              margin: -4,
              background: "none",
              border: "none",
              cursor: "pointer",
              lineHeight: 0,
            }}
            aria-label="Back to list"
          >
            <span className="back-arrow-gradient" style={{ display: "inline-flex" }}>
              <BackIcon size={20} strokeWidth={2.5} />
            </span>
          </button>
          <div className="text-muted">Customer not found.</div>
        </div>
      </div>
    );

  const totalAmountFiltered = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const historyOrders = useMemo(() => orders.filter((o) => o.mobile === customer.mobile), [orders, customer.mobile]);
  const sharePayload = useMemo(
    () => ({
      customer: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address || "",
        joinDate: customer.joinDate || "",
      },
      orders: historyOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        date: o.date,
        total: o.total || 0,
        paymentStatus: o.paymentStatus || "unpaid",
        items: Array.isArray(o.items)
          ? o.items.map((i) => ({
              name: i.name,
              qty: i.qty,
            }))
          : [],
      })),
      generatedAt: new Date().toISOString(),
    }),
    [customer, historyOrders]
  );
  const shareLink = useMemo(() => generateCustomerHistoryLink(customer.id, sharePayload), [customer.id, sharePayload]);

  const handleSaveEdit = () => {
    updateCustomer({ ...customer, name: name.trim(), mobile: editMobile.trim(), address: address.trim() });
    setEditing(false);
    setModal({ type: "success", title: "Updated", message: "Customer details saved.", onConfirm: () => setModal(null) });
  };

  const handleDelete = () => {
    setModal({
      type: "confirm",
      title: "Delete Customer",
      message: "Delete " + customer.name + "? This cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: () => {
        setModal(null);
        deleteCustomer(customerId);
        onBack();
      },
      onCancel: () => setModal(null),
    });
  };

  const handleCreditSave = ({ amount, date, newCredit }) => {
    updateCustomer({ ...customer, totalCredit: newCredit, lastPaymentDate: date, lastPaymentAmount: amount });
    setShowCreditModal(false);
    setModal({ type: "success", title: "Payment Recorded", message: "₹" + amount + " payment recorded.", onConfirm: () => setModal(null) });
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(shareLink);
    setModal({
      type: ok ? "success" : "info",
      title: ok ? "History Link Ready" : "History Link",
      message: ok ? "Customer history link copied." : "Could not copy automatically. Please copy manually.",
      onConfirm: () => setModal(null),
    });
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const SH = ({ t }) => (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "#334155",
        padding: "3px 8px",
        background: "#0a0f18",
        borderRadius: 4,
        borderLeft: "2px solid #00b4d8",
        marginBottom: 8,
      }}
    >
      {t}
    </div>
  );
  return (
    <div style={{ paddingBottom: 120 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} confirmLabel={modal.confirmLabel || "OK"} />}
      {showCreditModal && <CreditModal customer={customer} onClose={() => setShowCreditModal(false)} onSave={handleCreditSave} />}

      {/* Customer card — back icon integrated, no separate row */}
      <div className="list-card" style={{ marginBottom: 10 }}>
        {/* Top row: back | name + edit | orders/credit */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: editing ? 10 : 2 }}>
          <button
            onClick={onBack}
            style={{
              flexShrink: 0,
              padding: 4,
              margin: -4,
              background: "none",
              border: "none",
              cursor: "pointer",
              lineHeight: 0,
            }}
            aria-label="Back to list"
          >
            <span className="back-arrow-gradient" style={{ display: "inline-flex" }}>
              <BackIcon size={20} strokeWidth={2.5} />
            </span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{customer.name}</div>
              <button
                className="btn btn-outline"
                style={{ padding: "4px 8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setEditing(!editing)}
                title={editing ? "Cancel" : "Edit"}
              >
                <Icon name={editing ? "X" : "Pencil"} size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", marginTop: 6 }}>
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
              {customerAge && <div className="text-small">Since {customerAge}</div>}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#475569" }}>
              Orders: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{customer.totalOrders || 0}</span>
            </div>
            {(customer.totalCredit || 0) > 0 && (
              <>
                <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 2 }}>Credit ₹{customer.totalCredit}</div>
                <button className="btn btn-outline" style={{ fontSize: 10, padding: "3px 8px", marginTop: 4 }} onClick={() => setShowCreditModal(true)}>
                  Update
                </button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,180,216,0.1)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="input" placeholder="Mobile" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} />
              <input className="input" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-danger" style={{ flex: 1, fontSize: 11 }} onClick={handleDelete}>
                  Delete
                </button>
                <button className="btn btn-primary" style={{ flex: 2, fontSize: 11 }} onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order History */}
      <div style={{ marginBottom: 10 }}>
        <SH t="Order History" />
      </div>

      {/* Sort pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[
          ["recent", "Recent"],
          ["items", "Items"],
          ["amount", "Amount"],
        ].map(([field, label]) => (
          <button key={field} className={"btn " + (sortBy === field ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 10 }} onClick={() => toggleSort(field)}>
            {label} {sortBy === field ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
        ))}
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
            <option value="pending">Pending</option>
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

      {/* Order cards */}
      <div className="list" style={{ marginBottom: 10 }}>
        {customerOrders.map((o) => {
          const sc = ORDER_STATUS_COLORS[o.status] || ORDER_STATUS_COLORS.pending;
          const pc = PAYMENT_STATUS_COLORS[o.paymentStatus || "unpaid"];
          return (
            <div key={o.id} className="list-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{o.orderNumber || "#" + o.id}</div>
                    {o.sellerCreated && <span style={{ background: "rgba(129,140,248,0.15)", color: "#c7d2fe", padding: "1px 6px", borderRadius: 999, fontSize: 9 }}>Seller</span>}
                  </div>
                  <div className="text-small">{o.date}</div>
                  <div className="text-small">{o.items?.map((i) => i.name).join(", ")}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", padding: "0 8px" }}>
                  <span style={{ background: sc.bg, color: sc.color, border: "1px solid " + sc.border, padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>{o.status}</span>
                  <span style={{ background: pc.bg, color: pc.color, border: "1px solid " + pc.border, padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>
                    {o.paymentStatus || "unpaid"}
                  </span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>₹{o.total}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{o.items?.length} items</div>
                  {onViewOrder && (
                    <button className="btn btn-outline" style={{ fontSize: 10, padding: "3px 8px", marginTop: 4 }} onClick={() => onViewOrder(o.id)}>
                      View Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {customerOrders.length === 0 && (
          <div className="text-muted" style={{ marginTop: 12 }}>
            No orders found.
          </div>
        )}
      </div>
      {/* Fixed bottom bar */}
      <div
        className="fixed-bottom-bar compact-bottom-bar"
        style={{
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Orders</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{customerOrders.length}</div>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Amount</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#06d6a0" }}>₹{totalAmountFiltered}</div>
          </div>
          {(customer.totalCredit || 0) > 0 && (
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Credit</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>₹{customer.totalCredit}</div>
            </div>
          )}
        </div>
        <button
          className="btn btn-outline"
          style={{ width: "100%", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}
          onClick={handleCopyLink}
        >
          <Icon name="Link2" size={14} />
          <span>Share History</span>
        </button>
      </div>
    </div>
  );
}

export default CustomerDetail;
