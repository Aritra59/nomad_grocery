import React, { useState, useMemo } from "react";
import { useOrderData } from "../../hooks/useOrderData";
import { useInventory } from "../../context/InventoryContext";
import { useCustomersData } from "../../hooks/useCustomersData";
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "../../utils/ordersUtils";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import Icon from "../../components/common/Icon";

function CreditStatus({ mobile }) {
  const { getCustomerByMobile } = useCustomersData();
  const customer = getCustomerByMobile(mobile);
  if (!customer) return null;
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>
        Orders: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{customer.totalOrders || 0}</span>
      </div>
      {(customer.totalCredit || 0) > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>Credit ₹{customer.totalCredit}</div>}
    </div>
  );
}

function OrderDetail({ mode, onBack, orderId }) {
  const { getOrderById, updateOrder, deleteOrder } = useOrderData();
  const { items, adjustStock } = useInventory();
  const { upsertFromOrder } = useCustomersData();

  const order = getOrderById(orderId);
  const [paymentStatus, setPaymentStatus] = useState(order?.paymentStatus || "unpaid");
  const [checkedItems, setCheckedItems] = useState({});
  const [modal, setModal] = useState(null);
  const [inlineError, setInlineError] = useState("");

  if (!order) {
    return (
      <div>
        <span className="back-row" onClick={onBack}>
          <BackIcon size={18} strokeWidth={3} /> Back
        </span>
        <div className="text-muted">Order not found.</div>
      </div>
    );
  }

  const isPending = order.status === "pending";
  const isDone = order.status === "completed" || order.status === "cancelled";

  // All items checked?
  const allChecked = useMemo(() => order.items.length > 0 && order.items.every((_, i) => !!checkedItems[i]), [checkedItems, order.items]);

  const toggleCheck = (i) => {
    if (isDone) return;
    setCheckedItems((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const handlePaymentToggle = (type) => {
    if (isDone) return;
    const newStatus = paymentStatus === type ? "unpaid" : type;
    setPaymentStatus(newStatus);
    updateOrder({ ...order, paymentStatus: newStatus });
    setInlineError("");
  };

  const handleComplete = () => {
    if (isDone) return;
    if (!allChecked) {
      setInlineError("Please tick all items before completing the order.");
      return;
    }
    if (paymentStatus === "unpaid") {
      setInlineError("Please select Paid or Credit before completing.");
      return;
    }
    setModal({
      type: "confirm",
      title: "Complete Order",
      message: "Mark this order as Completed?",
      confirmLabel: "Complete",
      onConfirm: () => {
        setModal(null);
        order.items.forEach((oi) => {
          const found = items.find((p) => p.name.toLowerCase() === oi.name.toLowerCase());
          if (found) adjustStock(found.id, -(oi.qty || 0));
        });
        upsertFromOrder({ ...order, paymentStatus, credit: paymentStatus === "credit" ? order.total : 0 });
        updateOrder({
          ...order,
          status: "completed",
          paymentStatus,
          credit: paymentStatus === "credit" ? order.total : 0,
          paid: paymentStatus === "paid" ? order.total : 0,
        });
        setTimeout(() => onBack(), 100);
      },
      onCancel: () => setModal(null),
    });
  };

  const handleCancel = () => {
    if (isDone) return;
    if (paymentStatus !== "unpaid") {
      setInlineError("Cannot cancel a paid or credit order.");
      return;
    }
    setModal({
      type: "confirm",
      title: "Cancel Order",
      message: "Cancel this order? This cannot be undone.",
      confirmLabel: "Cancel Order",
      onConfirm: () => {
        setModal(null);
        updateOrder({ ...order, status: "cancelled" });
        setTimeout(() => onBack(), 100);
      },
      onCancel: () => setModal(null),
    });
  };

  const sc = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending;
  const pc = PAYMENT_STATUS_COLORS[paymentStatus] || PAYMENT_STATUS_COLORS.unpaid;

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
    <div style={{ paddingBottom: 20 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} confirmLabel={modal.confirmLabel || "OK"} />}

      {/* Header row */}
      <div className="page-header-row">
        <span className="back-row" style={{ margin: 0 }} onClick={onBack}>
          <BackIcon size={18} strokeWidth={3} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Order #{order.id}</span>
            {order.orderNumber && <span style={{ fontSize: 10, color: "#00b4d8" }}>{order.orderNumber}</span>}
            {order.sellerCreated && <span style={{ background: "rgba(129,140,248,0.15)", color: "#c7d2fe", padding: "1px 6px", borderRadius: 999, fontSize: 9 }}>Seller</span>}
          </div>
          <div style={{ fontSize: 10, color: "#475569" }}>{order.date}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <span style={{ background: sc.bg, color: sc.color, border: "1px solid " + sc.border, padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>{order.status}</span>
          <span style={{ background: pc.bg, color: pc.color, border: "1px solid " + pc.border, padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>{paymentStatus}</span>
        </div>
      </div>

      {/* Customer card */}
      <div className="list-card" style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{order.customerName}</div>
            <div className="text-small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="Phone" size={12} />
              <span>{order.mobile}</span>
            </div>
            {order.address && (
              <div className="text-small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="MapPin" size={12} />
                <span>{order.address}</span>
              </div>
            )}
            {order.note && (
              <div className="text-small" style={{ color: "#67e8f9", display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="FileText" size={12} />
                <span>{order.note}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <CreditStatus mobile={order.mobile} />
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{order.items?.length} items</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#00b4d8" }}>₹{order.total}</div>
          </div>
        </div>
      </div>

      {/* Items with checkboxes */}
      <SH t="Items — Tick when packed" />
      <div className="list-card" style={{ marginBottom: 10 }}>
        {order.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: i < order.items.length - 1 ? "1px solid rgba(0,180,216,0.08)" : "none",
              cursor: isDone ? "default" : "pointer",
              opacity: isDone ? 0.7 : 1,
            }}
            onClick={() => toggleCheck(i)}
          >
            {!isDone && <div className={"app-checkbox" + (checkedItems[i] ? " checked" : "")}>{checkedItems[i] && <span style={{ color: "#0d1117", fontSize: 11, fontWeight: 700 }}>✓</span>}</div>}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: checkedItems[i] ? "#06d6a0" : "#f1f5f9" }}>{item.name}</div>
              <div className="text-small">
                {item.brand} · {item.packingQty}
              </div>
              <div className="text-small">
                MRP ₹{item.mrp} × {item.qty}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>₹{(item.qty * item.mrp).toFixed(0)}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="list-card" style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span className="text-small">Total Items</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{order.items.length}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span className="text-small">Total Value</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#00b4d8" }}>₹{order.total}</span>
        </div>
        {order.paid > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="text-small">Paid</span>
            <span style={{ fontSize: 12, color: "#06d6a0" }}>₹{order.paid}</span>
          </div>
        )}
        {order.credit > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="text-small">Credit</span>
            <span style={{ fontSize: 12, color: "#ef4444" }}>₹{order.credit}</span>
          </div>
        )}
      </div>
      {/* Inline error */}
      {inlineError && (
        <div
          style={{
            fontSize: 11,
            color: "#fca5a5",
            marginBottom: 10,
            padding: "7px 10px",
            background: "rgba(239,68,68,0.08)",
            borderRadius: 6,
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="AlertTriangle" size={12} />
          <span>{inlineError}</span>
        </div>
      )}

      {/* Items tick progress */}
      {isPending && (
        <div style={{ fontSize: 11, color: allChecked ? "#06d6a0" : "#475569", marginBottom: 10, textAlign: "center" }}>
          {Object.values(checkedItems).filter(Boolean).length} of {order.items.length} items ticked
          {allChecked && (
            <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="CheckCircle2" size={12} />
            </span>
          )}
        </div>
      )}

      {/* Payment + Action CTAs */}
      {isPending && (
        <div style={{ marginBottom: 10 }}>
          <SH t="Status" />
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            {/* Cancel — left */}
            <button
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border: "1px solid rgba(239,68,68,0.4)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: "transparent",
                color: paymentStatus === "unpaid" ? "#fca5a5" : "#334155",
                opacity: paymentStatus === "unpaid" ? 1 : 0.35,
              }}
              onClick={handleCancel}
            >
              Cancel
            </button>

            {/* Paid + Credit — centre */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <button
                style={{
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "1px solid #06d6a0",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: paymentStatus === "paid" ? "#06d6a0" : "transparent",
                  color: paymentStatus === "paid" ? "#0d1117" : "#06d6a0",
                }}
                onClick={() => handlePaymentToggle("paid")}
              >
                Paid
              </button>
              <button
                style={{
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "1px solid #f59e0b",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: paymentStatus === "credit" ? "#f59e0b" : "transparent",
                  color: paymentStatus === "credit" ? "#0d1117" : "#f59e0b",
                }}
                onClick={() => handlePaymentToggle("credit")}
              >
                Credit
              </button>
            </div>

            {/* Complete — right */}
            <button
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border: "none",
                fontSize: 11,
                fontWeight: 700,
                cursor: allChecked && paymentStatus !== "unpaid" ? "pointer" : "not-allowed",
                background: allChecked && paymentStatus !== "unpaid" ? "linear-gradient(135deg, #00b4d8, #06d6a0)" : "#111827",
                color: allChecked && paymentStatus !== "unpaid" ? "#0d1117" : "#334155",
              }}
              onClick={handleComplete}
            >
              Complete
            </button>
          </div>
        </div>
      )}

      {isDone && (
        <div
          style={{ textAlign: "center", padding: 12, borderRadius: 8, background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)", fontSize: 12, color: "#475569", marginBottom: 10 }}
        >
          This order is <strong style={{ color: order.status === "completed" ? "#06d6a0" : "#ef4444" }}>{order.status}</strong>. No further actions.
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
