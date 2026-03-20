import React, { useState, useEffect } from "react";
import { useInventory } from "../../context/InventoryContext";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import SuggestInput from "../../components/common/SuggestInput";
import Icon from "../../components/common/Icon";

const FIELD_HINTS = {
  name: "Speak Product Name",
  brand: "Speak Brand",
  packingQty: "Speak Packing Qty",
  mrp: "Speak MRP",
  category: "Speak Category",
  subCategory: "Speak Sub Category",
  variant1: "Speak Variant 1",
  variant2: "Speak Variant 2",
  currStock: "Speak Current Stock",
  reorderLevel: "Speak Re-Order Level",
  supplier0: "Speak Supplier Name",
};

function EditProduct({ mode, onBack, productId }) {
  const { getProductById, updateProduct, deleteProduct, adjustStock, suggestions } = useInventory();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [packingQty, setPackingQty] = useState("");
  const [mrp, setMrp] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [variant1, setVariant1] = useState("");
  const [variant2, setVariant2] = useState("");
  const [currStock, setCurrStock] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [stockDelta, setStockDelta] = useState("");
  const [suppliers, setSuppliers] = useState([""]);
  const [fastSelling, setFastSelling] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeField, setActiveField] = useState("name");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const { listening, start, stop } = useVoiceInput({
    onResult: (text) => applyVoiceToField(activeField, text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  useEffect(() => {
    if (!productId) return;
    const p = getProductById(productId);
    if (!p) return;
    setName(p.name || "");
    setBrand(p.brand || "");
    setPackingQty(p.packingQty || "");
    setMrp(p.mrp != null ? String(p.mrp) : "");
    setCategory(p.category || "");
    setSubCategory(p.subCategory || "");
    setVariant1(p.variant1 || "");
    setVariant2(p.variant2 || "");
    setCurrStock(String(p.currStock || 0));
    setReorderLevel(String(p.reorderLevel || 0));
    setSuppliers(p.suppliers?.length ? p.suppliers : [""]);
    setFastSelling(p.fastSelling || false);
    setLoaded(true);
  }, [productId, getProductById]);

  const applyVoiceToField = (field, value) => {
    if (field === "name") setName(value);
    else if (field === "brand") setBrand(value);
    else if (field === "packingQty") setPackingQty(value);
    else if (field === "mrp") {
      const n = parseFloat(value.replace(/[^\d.]/g, ""));
      if (!isNaN(n)) setMrp(String(n));
    } else if (field === "category") setCategory(value);
    else if (field === "subCategory") setSubCategory(value);
    else if (field === "variant1") setVariant1(value);
    else if (field === "variant2") setVariant2(value);
    else if (field === "currStock") {
      const n = parseInt(value);
      if (!isNaN(n)) setCurrStock(String(n));
    } else if (field === "reorderLevel") {
      const n = parseInt(value);
      if (!isNaN(n)) setReorderLevel(String(n));
    } else if (field === "supplier0")
      setSuppliers((p) => {
        const next = [...p];
        next[0] = value;
        return next;
      });
    showToast(field + ": " + value);
  };

  const fp = (field) => ({
    onFocus: () => setActiveField(field),
    style: activeField === field && listening ? { borderColor: "#00b4d8", background: "rgba(0,180,216,0.06)" } : {},
  });

  const handleStockAdd = () => {
    const n = Number(stockDelta || 0);
    if (!n) return;
    setCurrStock((p) => {
      const next = (Number(p) || 0) + n;
      showToast("Stock: " + next);
      return String(next);
    });
    adjustStock(productId, n);
    setStockDelta("");
  };

  const handleStockRemove = () => {
    const n = Number(stockDelta || 0);
    if (!n) return;
    setCurrStock((p) => {
      const next = Math.max(0, (Number(p) || 0) - n);
      showToast("Stock: " + next);
      return String(next);
    });
    adjustStock(productId, -n);
    setStockDelta("");
  };

  const handleSupplierChange = (i, v) =>
    setSuppliers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });

  const handleSave = () => {
    if (!name.trim()) {
      setModal({ type: "warning", title: "Name Required", message: "Please enter a product name.", onConfirm: () => setModal(null) });
      return;
    }
    if (!mrp) {
      setModal({ type: "warning", title: "MRP Required", message: "Please enter the MRP.", onConfirm: () => setModal(null) });
      return;
    }
    updateProduct({
      id: productId,
      name: name.trim(),
      brand: brand.trim(),
      packingQty: packingQty.trim(),
      mrp: Number(mrp),
      category: category.trim(),
      subCategory: subCategory.trim(),
      variant1: variant1.trim(),
      variant2: variant2.trim(),
      currStock: Number(currStock) || 0,
      reorderLevel: Number(reorderLevel) || 0,
      suppliers: suppliers.map((s) => s.trim()).filter(Boolean),
      fastSelling,
    });
    showToast("Product updated!");
    setTimeout(() => onBack(), 800);
  };

  const handleDelete = () => {
    setModal({
      type: "confirm",
      title: "Delete Product",
      message: name + " will be permanently deleted and removed from Catalog and Procurement. Continue?",
      confirmLabel: "Delete",
      onConfirm: () => {
        setModal(null);
        deleteProduct(productId);
        showToast("Deleted.");
        setTimeout(() => onBack(), 800);
      },
      onCancel: () => setModal(null),
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

  if (!loaded)
    return (
      <div>
        <span className="back-row" onClick={onBack}>
          <BackIcon size={18} strokeWidth={3} /> Back
        </span>
        <div className="text-muted">Loading…</div>
      </div>
    );
  return (
    <div style={{ paddingBottom: 20 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} confirmLabel={modal.confirmLabel || "OK"} />}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f2744",
            color: "#67e8f9",
            padding: "7px 16px",
            borderRadius: 999,
            fontSize: 12,
            zIndex: 2000,
            whiteSpace: "nowrap",
            border: "1px solid rgba(0,180,216,0.3)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Header row — sticky */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#0d1117",
          paddingBottom: 8,
          borderBottom: "1px solid rgba(0,180,216,0.1)",
          marginBottom: 10,
        }}
      >
        <div className="page-header-row">
          <span className="back-row" style={{ margin: 0 }} onClick={onBack}>
            <BackIcon size={18} strokeWidth={3} />
          </span>
          <div className="page-title-pill" style={{ flex: 1, textAlign: "center" }}>
            {name || "Edit Product"}
          </div>
          <button className={"mic-btn" + (listening ? " listening" : "")} onClick={listening ? stop : start} title={listening ? "Listening… tap to stop" : FIELD_HINTS[activeField] || "Voice input"}>
            <Icon name="Mic" size={16} />
          </button>
        </div>

        {listening && (
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#00b4d8",
              padding: "6px 8px",
              background: "rgba(0,180,216,0.08)",
              borderRadius: 6,
              border: "1px solid rgba(0,180,216,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "center",
            }}
          >
            <Icon name="Mic" size={14} />
            <span>Listening… {FIELD_HINTS[activeField] || "Speak now"}</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <section style={{ marginBottom: 10 }}>
        <SH t="Product Details" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} {...fp("name")} />

          <SuggestInput
            value={brand}
            onChange={setBrand}
            placeholder="Brand"
            options={suggestions.brands}
            fieldProps={fp("brand")}
          />

          <input className="input" placeholder="Packing Qty" value={packingQty} onChange={(e) => setPackingQty(e.target.value)} {...fp("packingQty")} />

          <input className="input" placeholder="MRP (₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} {...fp("mrp")} />
        </div>
      </section>

      {/* Grouping Details */}
      <section style={{ marginBottom: 10 }}>
        <SH t="Grouping Details" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SuggestInput
            value={category}
            onChange={setCategory}
            placeholder="Category"
            options={suggestions.categories}
            fieldProps={fp("category")}
          />

          <SuggestInput
            value={subCategory}
            onChange={setSubCategory}
            placeholder="Sub Category"
            options={suggestions.subCategories}
            fieldProps={fp("subCategory")}
          />

          <input className="input" placeholder="Variant 1" value={variant1} onChange={(e) => setVariant1(e.target.value)} {...fp("variant1")} />
          <input className="input" placeholder="Variant 2" value={variant2} onChange={(e) => setVariant2(e.target.value)} {...fp("variant2")} />
        </div>
      </section>
      {/* Stock Details */}
      <section style={{ marginBottom: 12 }}>
        <SH t="Stock Details" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Current stock */}
          <input
            className="input"
            placeholder="Current Stock"
            type="number"
            value={currStock}
            onFocus={() => {
              setActiveField("currStock");
              if (currStock === "0") setCurrStock("");
            }}
            onBlur={() => {
              if (currStock === "") setCurrStock("0");
            }}
            onChange={(e) => setCurrStock(e.target.value)}
            style={activeField === "currStock" && listening ? { borderColor: "#00b4d8" } : {}}
          />

          {/* Stock add/remove */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-success" style={{ flex: 1, fontSize: 11 }} onClick={handleStockAdd}>
              + Add
            </button>
            <input className="input" style={{ flex: 1, textAlign: "center" }} type="number" placeholder="Qty" value={stockDelta} onChange={(e) => setStockDelta(e.target.value)} />
            <button className="btn btn-danger" style={{ flex: 1, fontSize: 11 }} onClick={handleStockRemove}>
              − Remove
            </button>
          </div>

          {/* Reorder limit */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", fontWeight: 600 }}>Reorder Limit</div>
            <input
              className="input"
              style={{ flex: 1, ...(activeField === "reorderLevel" && listening ? { borderColor: "#00b4d8" } : {}) }}
              placeholder="Set your reorder limit"
              type="number"
              value={reorderLevel}
              onFocus={() => {
                setActiveField("reorderLevel");
                if (reorderLevel === "0") setReorderLevel("");
              }}
              onBlur={() => {
                if (reorderLevel === "") setReorderLevel("0");
              }}
              onChange={(e) => setReorderLevel(e.target.value)}
            />
          </div>

          {/* Suppliers */}
          {suppliers.map((s, i) => (
            <input
              key={i}
              className="input"
              placeholder={i === 0 ? "Supplier Name" : "Additional Supplier"}
              value={s}
              onChange={(e) => handleSupplierChange(i, e.target.value)}
              {...fp("supplier" + i)}
            />
          ))}
          <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => setSuppliers((p) => [...p, ""])}>
            + Add Supplier
          </button>

          {/* Fast selling */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setFastSelling((p) => !p)}>
            <div className={"app-checkbox" + (fastSelling ? " checked" : "")}>{fastSelling && <span style={{ color: "#0d1117", fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
            <span style={{ fontSize: 12, color: "#cbd5e1" }}>Fast Selling</span>
          </div>
        </div>
      </section>

      {/* Save + Delete */}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
          Delete
        </button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default EditProduct;
