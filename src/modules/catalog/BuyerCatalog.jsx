import React, { useState, useMemo, useRef, useEffect } from "react";
import { useCatalog } from "../../context/CatalogContext";
import { useInventory } from "../../context/InventoryContext";
import { useOrderData } from "../../hooks/useOrderData";
import { useCustomersData } from "../../hooks/useCustomersData";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { generateOrderNumber, getCustomerSequence } from "../../utils/ordersUtils";
import { getShopDataFromUrl } from "../../utils/catalogUtils";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import Icon from "../../components/common/Icon";

function BuyerCatalog({ sheetData: propSheetData, onClose, previewMode, onSaveCatalog, sellerMode, onOrderCreated }) {
  const { draft, savedIds } = useCatalog();
  const { items } = useInventory();
  const { addOrder, orders } = useOrderData();
  const { getCustomerByMobile, upsertFromOrder, customers } = useCustomersData();

  // Read shop data from URL if opened as buyer link
  const urlShopData = useMemo(() => getShopDataFromUrl(), []);
  const sheetData = previewMode ? propSheetData : urlShopData.mobile ? urlShopData : propSheetData;
  const sharedPayload = !previewMode ? urlShopData?.payload : null;

  const [mobile, setMobile] = useState("");
  const [custName, setCustName] = useState("");
  const [address, setAddress] = useState("");
  const [cart, setCart] = useState({});
  const [view, setView] = useState("catalog");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState(null);
  const searchRef = useRef(null);
  const [searchSticky, setSearchSticky] = useState(false);

  const activeIds = previewMode ? Object.keys(draft).filter((id) => !!draft[id]) : savedIds.map(String);

  const catalogItems = useMemo(() => {
    if (!previewMode && Array.isArray(sharedPayload?.items) && sharedPayload.items.length > 0) {
      return sharedPayload.items.map((p, idx) => ({
        id: p.id || `shared-${idx}`,
        name: p.name || "",
        brand: p.brand || "",
        category: p.category || "",
        packingQty: p.packingQty || "",
        mrp: Number(p.mrp) || 0,
        currStock: Number(p.currStock) || 0,
      }));
    }
    return items.filter((p) => activeIds.includes(String(p.id)));
  }, [items, activeIds, previewMode, sharedPayload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogItems;
    return catalogItems.filter((p) => [p.name, p.brand, p.category].join(" ").toLowerCase().includes(q));
  }, [catalogItems, search]);

  const cartItems = useMemo(() => catalogItems.filter((p) => (cart[p.id] || 0) > 0), [catalogItems, cart]);

  const totalProducts = cartItems.length;
  const totalAmount = cartItems.reduce((sum, p) => sum + (cart[p.id] || 0) * (p.mrp || 0), 0);

  const creditOutstanding = useMemo(() => {
    if (!mobile.trim()) return 0;
    const existing = customers?.find((c) => c.mobile === mobile.trim());
    return existing?.totalCredit || 0;
  }, [mobile, customers]);

  // Generate order number once — stable
  const orderNumber = useMemo(() => {
    if (!custName.trim() && !mobile.trim()) return null;
    const seq = getCustomerSequence(orders, mobile.trim()) + 1;
    return generateOrderNumber(sheetData?.shopName || "SH", custName || "GU", seq);
  }, [custName, mobile, sheetData]);

  const { listening, start, stop } = useVoiceInput({
    onResult: (text) => setSearch(text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  // Sticky search on scroll
  useEffect(() => {
    const handleScroll = (e) => {
      if (!searchRef.current) return;
      const rect = searchRef.current.getBoundingClientRect();
      setSearchSticky(rect.top <= 0);
    };
    const container = document.querySelector(".buyer-scroll");
    if (container) container.addEventListener("scroll", handleScroll);
    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleMobileBlur = () => {
    if (mobile.trim().length >= 10) {
      const existing = getCustomerByMobile(mobile.trim());
      if (existing) {
        setCustName(existing.name);
        setAddress(existing.address || "");
      }
    }
  };

  const setQty = (id, qty) => {
    const item = catalogItems.find((p) => p.id === id);
    const max = item?.currStock || 0;
    const clamped = Math.max(0, Math.min(qty, max));
    setCart((prev) => ({ ...prev, [id]: clamped }));
  };

  const removeFromCart = (id) => setCart((prev) => ({ ...prev, [id]: 0 }));

  const handleSendOrder = () => {
    if (previewMode) return;
    if (!mobile.trim()) {
      setModal({ type: "warning", title: "Mobile Required", message: "Please enter your mobile number.", onConfirm: () => setModal(null) });
      return;
    }
    if (cartItems.length === 0) {
      setModal({ type: "warning", title: "Cart Empty", message: "Add at least one item to your cart.", onConfirm: () => setModal(null) });
      return;
    }
    const errs = [];
    cartItems.forEach((p) => {
      const fresh = catalogItems.find((i) => i.id === p.id);
      const requested = cart[p.id] || 0;
      const available = fresh?.currStock || 0;
      if (requested > available) errs.push(p.name + ": requested " + requested + ", available " + available);
    });
    if (errs.length > 0) {
      setModal({ type: "error", title: "Stock Issue", message: "Please adjust:\n" + errs.join("\n"), confirmLabel: "Adjust Cart", onConfirm: () => setModal(null) });
      return;
    }
    const finalOrderNumber = orderNumber;
    const order = {
      customerName: custName.trim() || "Guest",
      mobile: mobile.trim(),
      address: address.trim(),
      orderNumber: finalOrderNumber,
      items: cartItems.map((p) => ({ name: p.name, brand: p.brand, packingQty: p.packingQty, mrp: p.mrp, qty: cart[p.id] || 0 })),
      total: totalAmount,
      paid: 0,
      credit: 0,
      status: "pending",
      paymentStatus: "unpaid",
      sellerCreated: sellerMode ? true : false,
      date: new Date().toISOString().slice(0, 10),
    };
    addOrder(order);
    upsertFromOrder(order);
    setPlacedOrderNumber(finalOrderNumber);
    if (sellerMode) {
      setShowThankYou(true);
    } else {
      setShowThankYou(true);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    setCart({});
    setView("catalog");
    setSearch("");
  };

  const handleClose = () => {
    // Customer (buyer) close UX:
    // - If opened via shared catalog link (urlShopData.mobile present), customer must never see seller app.
    // - Confirm and then try to exit the tab or go back, without falling back into seller shell.
    if (!sellerMode && urlShopData?.mobile) {
      const ok = window.confirm("Are you sure you want to exit?");
      if (!ok) return;
      try {
        window.close();
        return;
      } catch {
        // ignore
      }
      if (window.history.length > 1) {
        window.history.back();
      }
      return;
    }

    // Embedded inside seller app (sellerMode=true) or preview/embedded usage:
    // delegate to parent when provided, otherwise use current fallback behaviour.
    if (onClose) {
      onClose();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  };

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", maxWidth: 480, margin: "0 auto" }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel={modal.confirmLabel || "OK"} />}

      {/* Top seller card */}
      <div style={{ background: "linear-gradient(135deg, #0f1923, #1a2535)", padding: "10px 16px", borderBottom: "1px solid rgba(0,180,216,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{sheetData?.shopName || "Shop"}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{sheetData?.ownerName || ""}</div>
            {sheetData?.mobile && (
              <div style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="Phone" size={12} />
                <span>{sheetData.mobile}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#475569" }}>{today}</div>
            {orderNumber && <div style={{ fontSize: 10, color: "#00b4d8", fontWeight: 600 }}>{orderNumber}</div>}
            {creditOutstanding > 0 && (
              <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                <Icon name="AlertTriangle" size={12} />
                <span>Credit Due: ₹{creditOutstanding}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
              {previewMode && (
                <span className="pill" style={{ background: "rgba(245,158,11,0.15)", color: "#fde68a", fontSize: 9 }}>
                  Preview
                </span>
              )}
              <button className="btn btn-outline" style={{ fontSize: 10, padding: "3px 8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }} onClick={handleClose}>
                <Icon name="X" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable area */}
      <div className="buyer-scroll" style={{ overflowY: "auto", height: "calc(100vh - 120px)", paddingBottom: 120 }}>
        {/* Customer details — scrolls away */}
        {!previewMode && (
          <div style={{ padding: "12px 16px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              <input className="input" placeholder="Mobile Number" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} onBlur={handleMobileBlur} />
              <input className="input" placeholder="Your Name" value={custName} onChange={(e) => setCustName(e.target.value)} />
              <input className="input" placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
        )}

        {previewMode && (
          <div style={{ padding: "8px 16px" }}>
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", fontSize: 11, color: "#fde68a" }}>
              Preview Mode — this is what your customers will see. Tap Save Catalog to publish.
            </div>
          </div>
        )}

        {/* Search + mic — becomes sticky */}
        <div
          ref={searchRef}
          style={{
            position: searchSticky ? "fixed" : "relative",
            top: searchSticky ? 0 : "auto",
            left: 0,
            right: 0,
            zIndex: searchSticky ? 50 : "auto",
            background: "#0d1117",
            padding: searchSticky ? "8px 16px" : "0 16px 8px",
            maxWidth: 480,
            margin: "0 auto",
            borderBottom: searchSticky ? "1px solid rgba(0,180,216,0.15)" : "none",
          }}
        >
          <div className="search-row">
            <input className="input" style={{ flex: 1 }} placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className={"mic-btn" + (listening ? " listening" : "")} onClick={listening ? stop : start}>
              <Icon name="Mic" size={16} />
            </button>
          </div>
        </div>

        {/* Spacer when sticky */}
        {searchSticky && <div style={{ height: 52 }} />}

        {/* Product list */}
        <div className="list" style={{ padding: "0 16px" }}>
          {(view === "catalog" ? filtered : cartItems).map((p) => {
            const qty = cart[p.id] || 0;
            const maxStock = p.currStock || 0;
            const isCartView = view === "cart";
            return (
              <div key={p.id} className="list-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{p.name}</div>
                    <div className="text-small">
                      {p.brand} · {p.packingQty}
                    </div>
                    <div style={{ fontSize: 12, color: "#00b4d8", fontWeight: 600 }}>₹{p.mrp}</div>
                    {isCartView && <div style={{ fontSize: 11, color: "#475569" }}>Subtotal ₹{(qty * p.mrp).toFixed(0)}</div>}
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    {qty === 0 ? (
                      <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={() => !previewMode && maxStock > 0 && setQty(p.id, 1)} disabled={maxStock === 0 || previewMode}>
                        {maxStock === 0 ? "Out of Stock" : "Add"}
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="btn btn-outline" style={{ fontSize: 14, padding: "2px 10px" }} onClick={() => setQty(p.id, qty - 1)}>
                          −
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{qty}</span>
                        <button className="btn btn-outline" style={{ fontSize: 14, padding: "2px 10px" }} onClick={() => setQty(p.id, qty + 1)} disabled={qty >= maxStock}>
                          +
                        </button>
                      </div>
                    )}
                    {isCartView && qty > 0 && (
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 11,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        onClick={() => removeFromCart(p.id)}
                      >
                        <Icon name="X" size={14} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {view === "catalog" && filtered.length === 0 && (
            <div className="text-muted" style={{ marginTop: 12 }}>
              No products in catalog.
            </div>
          )}
          {view === "cart" && cartItems.length === 0 && (
            <div className="text-muted" style={{ marginTop: 12 }}>
              No items in cart yet.
            </div>
          )}
        </div>
      </div>
      {/* Bottom bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#0f1520",
          borderTop: "1px solid rgba(0,180,216,0.4)",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.4)",
          padding: "10px 12px",
          zIndex: 100,
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {!previewMode && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, color: "#e2e8f0" }}>
            <span>
              {totalProducts} item{totalProducts !== 1 ? "s" : ""}
            </span>
            <span style={{ fontWeight: 700, color: "#00b4d8" }}>₹{totalAmount.toFixed(0)}</span>
          </div>
        )}

        {previewMode ? (
          <button className="btn btn-primary" style={{ width: "100%", fontSize: 13 }} onClick={onSaveCatalog}>
            Save Catalog
          </button>
        ) : view === "catalog" ? (
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setView("cart")}>
            View Cart {totalProducts > 0 ? "(" + totalProducts + ")" : ""}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setView("catalog")}>
              <BackIcon size={18} strokeWidth={3} /> Add More
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSendOrder}>
              {sellerMode ? "Create Order" : "Send Order"}
            </button>
          </div>
        )}
      </div>

      {/* Thank You dialog */}
      {showThankYou && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#1a1f2e", borderRadius: 16, padding: 28, width: "100%", maxWidth: 320, textAlign: "center", border: "1px solid rgba(6,214,160,0.3)" }}>
            <div style={{ fontSize: 36, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="PartyPopper" size={32} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#f1f5f9" }}>Thank you{custName ? ", " + custName : ""}!</div>
            {placedOrderNumber && <div style={{ fontSize: 11, color: "#00b4d8", marginBottom: 6 }}>Order {placedOrderNumber}</div>}
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>
              {sellerMode ? (
                <>
                  <strong style={{ color: "#00b4d8" }}>{placedOrderNumber}</strong> created successfully for <strong style={{ color: "#e2e8f0" }}>{custName || "customer"}</strong> and added to Pending
                  Orders.
                </>
              ) : (
                <>
                  Your order has been received by <strong style={{ color: "#e2e8f0" }}>{sheetData?.shopName || "the shop"}</strong> and will be processed soon.
                </>
              )}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => {
                handleThankYouClose();
                if (sellerMode && onOrderCreated) onOrderCreated();
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyerCatalog;
