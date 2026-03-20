import React, { useState, useMemo } from "react";
import { useOrderData } from "../../hooks/useOrderData";
import { useInventory } from "../../context/InventoryContext";
import { useCustomersData } from "../../hooks/useCustomersData";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { generateOrderNumber, getCustomerSequence } from "../../utils/ordersUtils";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import Icon from "../../components/common/Icon";

function CreateOrder({ mode, onBack, onOrderCreated, sheetData }) {
  const { addOrder, orders } = useOrderData();
  const { items } = useInventory();
  const { getCustomerByMobile, upsertFromOrder } = useCustomersData();

  const [mobile, setMobile] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [orderItems, setOrderItems] = useState([{ name: "", qty: 1, mrp: 0, brand: "", packingQty: "" }]);
  const [search, setSearch] = useState("");
  const [date] = useState(new Date().toISOString().slice(0, 10));
  const [modal, setModal] = useState(null);

  const { listening, start, stop } = useVoiceInput({
    onResult: (text) => setSearch(text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  const total = orderItems.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.mrp) || 0), 0);

  const orderNumber = useMemo(() => {
    if (!customerName.trim()) return null;
    const seq = getCustomerSequence(orders, mobile.trim());
    return generateOrderNumber(sheetData?.shopName || "SH", customerName, seq);
  }, [customerName, mobile, orders, sheetData]);

  const handleMobileBlur = () => {
    if (mobile.trim().length >= 10) {
      const existing = getCustomerByMobile(mobile.trim());
      if (existing) {
        setCustomerName(existing.name);
        setAddress(existing.address || "");
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "name") {
        const found = items.find((p) => p.name.toLowerCase() === value.toLowerCase());
        if (found) {
          next[index].mrp = found.mrp;
          next[index].brand = found.brand;
          next[index].packingQty = found.packingQty;
        }
      }
      return next;
    });
  };

  const getMaxQty = (name) => {
    const found = items.find((p) => p.name.toLowerCase() === name.toLowerCase());
    return found?.currStock || 999;
  };

  const addItem = () => setOrderItems((prev) => [...prev, { name: "", qty: 1, mrp: 0, brand: "", packingQty: "" }]);
  const removeItem = (i) => setOrderItems((prev) => prev.filter((_, idx) => idx !== i));

  const filteredItems = useMemo(() => items.filter((p) => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase())), [items, search]);

  const handleSave = () => {
    if (!mobile.trim()) {
      setModal({ type: "warning", title: "Mobile Required", message: "Please enter customer mobile number.", onConfirm: () => setModal(null) });
      return;
    }
    if (!customerName.trim()) {
      setModal({ type: "warning", title: "Name Required", message: "Please enter customer name.", onConfirm: () => setModal(null) });
      return;
    }
    if (orderItems.some((i) => !i.name.trim())) {
      setModal({ type: "warning", title: "Items Incomplete", message: "All items need a product name.", onConfirm: () => setModal(null) });
      return;
    }
    if (orderItems.some((i) => Number(i.qty) > getMaxQty(i.name))) {
      setModal({ type: "warning", title: "Stock Exceeded", message: "Some items exceed available stock. Please adjust quantities.", onConfirm: () => setModal(null) });
      return;
    }
    const order = {
      customerName: customerName.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      note: note.trim(),
      orderNumber,
      items: orderItems.map((i) => ({ name: i.name.trim(), brand: i.brand, packingQty: i.packingQty, qty: Number(i.qty) || 1, mrp: Number(i.mrp) || 0 })),
      total,
      paid: 0,
      credit: 0,
      status: "pending",
      paymentStatus: "unpaid",
      sellerCreated: true,
      date,
    };
    addOrder(order);
    upsertFromOrder(order);
    setModal({
      type: "success",
      title: "Order Created",
      message: "Order " + (orderNumber || "") + " created successfully.",
      onConfirm: () => {
        setModal(null);
        onOrderCreated ? onOrderCreated() : onBack();
      },
    });
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
    <div style={{ paddingBottom: 20 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel="OK" />}

      {/* Header row */}
      <div className="page-header-row">
        <span className="back-row" style={{ margin: 0 }} onClick={onBack}>
          <BackIcon size={18} strokeWidth={3} />
        </span>
        <div className="page-title-pill" style={{ flex: 1, textAlign: "center" }}>
          New Order
        </div>
        <span style={{ background: "rgba(129,140,248,0.15)", color: "#c7d2fe", padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 600 }}>Seller</span>
      </div>

      {orderNumber && <div style={{ textAlign: "center", fontSize: 10, color: "#00b4d8", marginBottom: 8 }}>Order No: {orderNumber}</div>}

      {/* Customer */}
      <section style={{ marginBottom: 10 }}>
        <SH t="Customer" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input className="input" placeholder="Mobile Number" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} onBlur={handleMobileBlur} />
          <input className="input" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <input className="input" placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </section>

      {/* Items header + View Catalog button */}
      <section style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <SH t="Items" />
          <button
            className="btn btn-outline"
            style={{ fontSize: 10, padding: "3px 10px" }}
            onClick={() =>
              setModal({
                type: "info",
                title: "View Catalog",
                message: "Catalog selection from Create Order will be available in the next update.",
                onConfirm: () => setModal(null),
              })
            }
          >
            View Catalog
          </button>
        </div>

        {/* Search + mic */}
        <div className="search-row" style={{ marginBottom: 8 }}>
          <input className="input" style={{ flex: 1 }} placeholder="Search inventory…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className={"mic-btn" + (listening ? " listening" : "")} onClick={listening ? stop : start}>
            <Icon name="Mic" size={16} />
          </button>
        </div>
        {/* Item rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orderItems.map((item, i) => {
            const maxQty = getMaxQty(item.name);
            const overStock = item.name && Number(item.qty) > maxQty;
            return (
              <div
                key={i}
                style={{
                  background: "#111827",
                  borderRadius: 8,
                  padding: 10,
                  border: overStock ? "1px solid #ef4444" : "1px solid rgba(0,180,216,0.15)",
                }}
              >
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input className="input" style={{ flex: 2 }} placeholder="Product name" value={item.name} onChange={(e) => handleItemChange(i, "name", e.target.value)} />
                  <button className="btn btn-danger" style={{ fontSize: 11, padding: "4px 8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }} onClick={() => removeItem(i)}>
                    <Icon name="X" size={14} />
                  </button>
                </div>

                {item.name && (
                  <div className="text-small" style={{ marginBottom: 6 }}>
                    {item.brand} · {item.packingQty} · MRP ₹{item.mrp}
                    <span style={{ color: overStock ? "#ef4444" : "#475569", marginLeft: 8 }}>Stock: {maxQty}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button className="btn btn-outline" style={{ fontSize: 14, padding: "2px 10px" }} onClick={() => handleItemChange(i, "qty", Math.max(1, Number(item.qty) - 1))}>
                    −
                  </button>
                  <input className="input" style={{ flex: 1, textAlign: "center" }} type="number" min="1" value={item.qty} onChange={(e) => handleItemChange(i, "qty", e.target.value)} />
                  <button className="btn btn-outline" style={{ fontSize: 14, padding: "2px 10px" }} onClick={() => handleItemChange(i, "qty", Math.min(maxQty, Number(item.qty) + 1))}>
                    +
                  </button>
                  <input className="input" style={{ flex: 1 }} placeholder="MRP" type="number" value={item.mrp} onChange={(e) => handleItemChange(i, "mrp", e.target.value)} />
                  <div style={{ fontSize: 12, fontWeight: 600, minWidth: 50, textAlign: "right", color: "#00b4d8" }}>₹{(Number(item.qty) * Number(item.mrp)).toFixed(0)}</div>
                </div>

                {overStock && (
                  <div style={{ fontSize: 10, color: "#fca5a5", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="AlertTriangle" size={12} />
                    <span>Exceeds stock ({maxQty} available)</span>
                  </div>
                )}
              </div>
            );
          })}

          <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={addItem}>
            + Add Item
          </button>
        </div>
      </section>

      {/* Summary + CTA — fixed bottom */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#0a0f18",
          borderTop: "1px solid rgba(0,180,216,0.15)",
          padding: "10px 12px",
          zIndex: 100,
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: "#475569" }}>{orderItems.filter((i) => i.name).length} items</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#00b4d8" }}>₹{total}</div>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={handleSave}>
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateOrder;
