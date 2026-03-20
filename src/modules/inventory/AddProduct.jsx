import React, { useState } from "react";
import { useInventory } from "../../context/InventoryContext";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import SuggestInput from "../../components/common/SuggestInput";
import Icon from "../../components/common/Icon";

const FIELD_ORDER = ["name", "brand", "packingQty", "mrp", "category", "subCategory", "variant1", "variant2", "currStock", "reorderLevel", "supplier0"];

const FIELD_HINTS = {
  name: "Speak Product Name",
  brand: "Speak Brand",
  packingQty: "Speak Packing Qty (e.g. 1 kg)",
  mrp: "Speak MRP amount",
  category: "Speak Category",
  subCategory: "Speak Sub Category",
  variant1: "Speak Variant 1",
  variant2: "Speak Variant 2",
  currStock: "Speak current stock number",
  reorderLevel: "Speak reorder level number",
  supplier0: "Speak supplier name",
};

function AddProduct({ mode, onBack, isOverLimit }) {
  const { addProduct, suggestions, items } = useInventory();
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
  const [activeField, setActiveField] = useState("name");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const { listening, supported, start, stop } = useVoiceInput({
    onResult: (text) => applyVoiceToField(activeField, text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  const tryAutoFill = (val) => {
    if (!val.trim()) {
      setCategory("");
      setSubCategory("");
      setBrand("");
      return;
    }
    const match = (items || []).find((p) => p.name?.toLowerCase() === val.trim().toLowerCase());
    if (match) {
      if (match.category) setCategory(match.category);
      if (match.subCategory) setSubCategory(match.subCategory);
      if (match.brand) setBrand(match.brand);
      if (match.packingQty) setPackingQty(match.packingQty);
      showToast("Auto-filled from: " + match.name);
    }
  };

  const handleNameChange = (val) => {
    setName(val);
    tryAutoFill(val);
  };

  const applyVoiceToField = (field, value) => {
    switch (field) {
      case "name":
        handleNameChange(value);
        break;
      case "brand":
        setBrand(value);
        break;
      case "packingQty":
        setPackingQty(value);
        break;
      case "mrp": {
        const n = parseFloat(value.replace(/[^\d.]/g, ""));
        if (!isNaN(n)) setMrp(String(n));
        break;
      }
      case "category":
        setCategory(value);
        break;
      case "subCategory":
        setSubCategory(value);
        break;
      case "variant1":
        setVariant1(value);
        break;
      case "variant2":
        setVariant2(value);
        break;
      case "currStock": {
        const n = parseInt(value.replace(/[^\d]/g, ""));
        if (!isNaN(n)) setCurrStock(String(n));
        break;
      }
      case "reorderLevel": {
        const n = parseInt(value.replace(/[^\d]/g, ""));
        if (!isNaN(n)) setReorderLevel(String(n));
        break;
      }
      case "supplier0":
        setSuppliers((p) => {
          const next = [...p];
          next[0] = value;
          return next;
        });
        break;
      default:
        break;
    }
    showToast(field + ": " + value);
    const idx = FIELD_ORDER.indexOf(field);
    if (idx >= 0 && idx < FIELD_ORDER.length - 1) setActiveField(FIELD_ORDER[idx + 1]);
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
    setStockDelta("");
  };

  const handleSupplierChange = (i, v) =>
    setSuppliers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });

  const handleSave = () => {
    if (isOverLimit) {
      setModal({ type: "warning", title: "Slot Limit", message: "Over slot limit. Delete products or buy more slots.", onConfirm: () => setModal(null) });
      return;
    }
    if (!name.trim()) {
      setModal({ type: "warning", title: "Name Required", message: "Please enter a product name.", onConfirm: () => setModal(null) });
      return;
    }
    if (!mrp) {
      setModal({ type: "warning", title: "MRP Required", message: "Please enter the MRP.", onConfirm: () => setModal(null) });
      return;
    }
    addProduct({
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
    showToast("Product saved!");
    setTimeout(() => onBack(), 800);
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
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
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
        <div className="page-header-row" style={{ marginBottom: listening ? 0 : 0 }}>
          <span className="back-row" style={{ margin: 0 }} onClick={onBack}>
            <BackIcon size={18} strokeWidth={3} />
          </span>
          <div className="page-title-pill" style={{ flex: 1, textAlign: "center" }}>
            New Product
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
          <SuggestInput value={name} onChange={handleNameChange} placeholder="Name" options={suggestions.names} fieldProps={fp("name")} />

          <SuggestInput value={brand} onChange={setBrand} placeholder="Brand" options={suggestions.brands} fieldProps={fp("brand")} />

          <input className="input" placeholder="Packing Qty (1 kg, 500 g, 1 L…)" value={packingQty} onChange={(e) => setPackingQty(e.target.value)} {...fp("packingQty")} />

          <input className="input" placeholder="MRP (₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} {...fp("mrp")} />
        </div>
      </section>

      {/* Grouping Details */}
      <section style={{ marginBottom: 10 }}>
        <SH t="Grouping Details" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SuggestInput value={category} onChange={setCategory} placeholder="Category" options={suggestions.categories} fieldProps={fp("category")} />

          <SuggestInput value={subCategory} onChange={setSubCategory} placeholder="Sub Category" options={suggestions.subCategories} fieldProps={fp("subCategory")} />

          <SuggestInput value={variant1} onChange={setVariant1} placeholder="Variant 1" options={suggestions.variants1} fieldProps={fp("variant1")} />

          <SuggestInput value={variant2} onChange={setVariant2} placeholder="Variant 2" options={suggestions.variants2} fieldProps={fp("variant2")} />
        </div>
      </section>
      {/* Stock Details */}
      <section style={{ marginBottom: 12 }}>
        <SH t="Stock Details" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Current stock */}
          <input
            className="input"
            placeholder="Opening Stock (0)"
            type="number"
            value={currStock}
            onFocus={(e) => {
              setActiveField("currStock");
              if (e.target.value === "0") setCurrStock("");
            }}
            onBlur={(e) => {
              if (e.target.value === "") setCurrStock("0");
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

      {isOverLimit && (
        <div style={{ fontSize: 11, color: "#fca5a5", marginBottom: 8, padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)" }}>
          Over slot limit. Delete products or buy more slots first.
        </div>
      )}

      <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSave}>
        Save Product
      </button>
    </div>
  );
}

export default AddProduct;
