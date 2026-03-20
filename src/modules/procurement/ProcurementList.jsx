import React, { useState, useMemo } from "react";
import { useProcurementData } from "../../hooks/useProcurementData";
import { useInventory } from "../../context/InventoryContext";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { getStockStatus, STOCK_STATUS_COLORS, STOCK_STATUS_LABELS } from "../../utils/inventoryUtils";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import SelectField from "../../components/common/SelectField";
import Icon from "../../components/common/Icon";

// ── Sort Modal ──
function SortModal({ sortBy, arrange, onApply, onClose }) {
  const [localSort, setLocalSort] = useState(sortBy);
  const [localArrange, setLocalArrange] = useState(arrange);
  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>Sort & Arrange</div>
          <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>Sort By</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {[
            ["stock-asc", "Low Stock First"],
            ["stock-desc", "High Stock First"],
            ["fast-first", "Fast Moving First"],
            ["name-asc", "Name A–Z"],
          ].map(([val, label]) => (
            <button key={val} className={"btn " + (localSort === val ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => setLocalSort(val)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>Group By</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {[
            ["none", "No Grouping"],
            ["brand", "Brand"],
            ["supplier", "Supplier"],
            ["category", "Category"],
            ["subCategory", "Sub Category"],
          ].map(([val, label]) => (
            <button key={val} className={"btn " + (localArrange === val ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => setLocalArrange(val)}>
              {label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onApply(localSort, localArrange)}>
          Apply
        </button>
      </div>
    </div>
  );
}

// ── Supplier Modal ──
function SupplierModal({ suppliers, selected, onApply, onClose }) {
  const [localSelected, setLocalSelected] = useState(selected || []);
  const [search, setSearch] = useState("");
  const filtered = suppliers.filter((s) => s.toLowerCase().includes(search.toLowerCase()));
  const toggle = (s) => setLocalSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>Filter by Supplier</div>
          <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={onClose}>
            Close
          </button>
        </div>
        <input className="input" placeholder="Search supplier…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto", marginBottom: 12 }}>
          <button className={"btn " + (localSelected.length === 0 ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => setLocalSelected([])}>
            All Suppliers
          </button>
          <button className={"btn " + (localSelected.includes("none") ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => toggle("none")}>
            None (No Supplier)
          </button>
          {filtered
            .filter((s) => s && s !== "none")
            .map((s) => (
              <button key={s} className={"btn " + (localSelected.includes(s) ? "btn-primary" : "btn-outline")} style={{ fontSize: 11, textAlign: "left" }} onClick={() => toggle(s)}>
                {s}
              </button>
            ))}
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => onApply(localSelected)}>
          Apply
        </button>
      </div>
    </div>
  );
}

// ── Filter Modal ──
function FilterModal({ items, filters, onApply, onClose }) {
  const [local, setLocal] = useState({ ...filters });
  const all = (field) => [...new Set(items.map((p) => p[field]).filter(Boolean))].sort();
  const toggle = (field, value) =>
    setLocal((prev) => {
      const current = prev[field] || [];
      return { ...prev, [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
    });
  const Section = ({ label, field }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {all(field).map((v) => (
          <button key={v} className={"btn " + ((local[field] || []).includes(v) ? "btn-primary" : "btn-outline")} style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => toggle(field, v)}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>Filters</div>
          <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={onClose}>
            Close
          </button>
        </div>
        <Section label="Category" field="category" />
        <Section label="Sub Category" field="subCategory" />
        <Section label="Brand" field="brand" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setLocal({})}>
            Clear All
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onApply(local)}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function ProcurementList({ mode, onBack, sheetData, onGoToInventory }) {
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    markOrdered,
    markReceived,
    addFromInventory,
    markAddedToOrder,
    removeFromOrder,
    savedOrders,
    saveOrder,
    deleteSavedOrder,
    removeItemFromSavedOrder,
    pendingCount,
    orderedCount,
    addedToOrderCount,
  } = useProcurementData();
  const { items: inventoryItems, adjustStock } = useInventory();

  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [selectedOrderNum, setSelectedOrderNum] = useState("new");
  const [filterMode, setFilterMode] = useState("all");
  const [sortBy, setSortBy] = useState("stock-asc");
  const [arrange, setArrange] = useState("none");
  const [filters, setFilters] = useState({});
  const [supplierFilter, setSupplierFilter] = useState([]);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showViewOrder, setShowViewOrder] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewOrderSource, setViewOrderSource] = useState("list");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  // Saved lists state
  const [savedSearch, setSavedSearch] = useState("");
  const [savedFilterMode, setSavedFilterMode] = useState("all");
  const [savedSortBy, setSavedSortBy] = useState("recent");
  const [savedSortDir, setSavedSortDir] = useState("desc");
  const [savedPeriod, setSavedPeriod] = useState("all");
  const [savedCustomFrom, setSavedCustomFrom] = useState("");
  const [savedCustomTo, setSavedCustomTo] = useState("");
  const [showSavedSupplier, setShowSavedSupplier] = useState(false);
  const [savedSupplierFilter, setSavedSupplierFilter] = useState([]);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newNote, setNewNote] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const { listening, start, stop } = useVoiceInput({
    onResult: (text) => setSearch(text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  const outOfStockCount = useMemo(() => inventoryItems.filter((p) => getStockStatus(p.currStock, p.reorderLevel) === "outOfStock").length, [inventoryItems]);
  const lowStockCount = useMemo(() => inventoryItems.filter((p) => getStockStatus(p.currStock, p.reorderLevel) === "low").length, [inventoryItems]);
  const fastMovingCount = useMemo(() => inventoryItems.filter((p) => p.fastSelling).length, [inventoryItems]);

  const allSuppliers = useMemo(() => {
    const s = new Set();
    items.forEach((i) => {
      if (i.supplier) s.add(i.supplier);
    });
    return Array.from(s).sort();
  }, [items]);

  const enrichedItems = useMemo(
    () =>
      items.map((item) => {
        const inv = inventoryItems.find((p) => p.name?.toLowerCase() === item.productName?.toLowerCase());
        return {
          ...item,
          category: inv?.category || "",
          subCategory: inv?.subCategory || "",
          brand: item.brand || inv?.brand || "",
          currStock: inv?.currStock ?? 0,
          reorderLevel: inv?.reorderLevel ?? 0,
          fastSelling: inv?.fastSelling || false,
        };
      }),
    [items, inventoryItems]
  );

  const newOrderNum = useMemo(() => {
    const seq = savedOrders.length + 1;
    return "PO-" + String(seq).padStart(3, "0") + "-" + new Date().toISOString().slice(2, 7).replace("-", "");
  }, [savedOrders.length]);

  const currentOrderNum = selectedOrderNum === "new" ? newOrderNum : selectedOrderNum;

  const orderItems = useMemo(() => enrichedItems.filter((i) => i.addedToOrder && i.orderNum === currentOrderNum), [enrichedItems, currentOrderNum]);

  const filtered = useMemo(() => {
    let list = [...enrichedItems];
    if (selectedOrderNum !== "new") {
      const savedOrder = savedOrders.find((o) => o.orderNum === selectedOrderNum);
      if (savedOrder) list = list.filter((i) => savedOrder.items?.some((si) => si.productName === i.productName));
    }
    if (filterMode === "addedToOrder") list = list.filter((i) => i.addedToOrder && i.orderNum === currentOrderNum);
    else if (filterMode === "pending") list = list.filter((i) => !i.addedToOrder);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => [i.productName, i.brand, i.supplier, i.category, i.subCategory].join(" ").toLowerCase().includes(q));
    }
    if (supplierFilter.length > 0) list = list.filter((i) => (supplierFilter.includes("none") ? !i.supplier : supplierFilter.includes(i.supplier)));
    if ((filters.category || []).length) list = list.filter((i) => filters.category.includes(i.category));
    if ((filters.subCategory || []).length) list = list.filter((i) => filters.subCategory.includes(i.subCategory));
    if ((filters.brand || []).length) list = list.filter((i) => filters.brand.includes(i.brand));
    if (sortBy === "stock-asc") list.sort((a, b) => (a.currStock || 0) - (b.currStock || 0));
    else if (sortBy === "stock-desc") list.sort((a, b) => (b.currStock || 0) - (a.currStock || 0));
    else if (sortBy === "fast-first") list.sort((a, b) => (b.fastSelling ? 1 : 0) - (a.fastSelling ? 1 : 0));
    else if (sortBy === "name-asc") list.sort((a, b) => (a.productName || "").localeCompare(b.productName || ""));
    return list;
  }, [enrichedItems, selectedOrderNum, savedOrders, filterMode, search, supplierFilter, filters, sortBy, currentOrderNum]);

  const grouped = useMemo(() => {
    if (arrange === "none") return [{ key: null, items: filtered }];
    const groups = {};
    filtered.forEach((item) => {
      const key = item[arrange] || "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.keys(groups)
      .sort()
      .map((key) => ({ key, items: groups[key] }));
  }, [filtered, arrange]);

  const handleAddManual = () => {
    if (!newName.trim()) {
      setModal({ type: "warning", title: "Name Required", message: "Please enter a product name.", onConfirm: () => setModal(null) });
      return;
    }
    addItem({ productName: newName.trim(), brand: newBrand.trim(), qty: Number(newQty) || 1, supplier: newSupplier.trim(), note: newNote.trim() });
    setNewName("");
    setNewBrand("");
    setNewQty("");
    setNewSupplier("");
    setNewNote("");
    setShowAdd(false);
    showToast("Item added to procurement.");
  };

  const handleSaveOrder = () => {
    if (orderItems.length === 0) {
      setModal({ type: "warning", title: "No Items", message: "Add items to order first.", onConfirm: () => setModal(null) });
      return;
    }
    saveOrder({ orderNum: currentOrderNum, items: orderItems, supplierNames: [...new Set(orderItems.map((i) => i.supplier || "General"))] });
    showToast("Order " + currentOrderNum + " saved.");
    setSelectedOrderNum(currentOrderNum);
  };

  const handleDownloadCSV = (orderNum, orderItemsList) => {
    const date = new Date().toISOString().slice(0, 10);
    const headers = ["Order No", "Product", "Brand", "Category", "Supplier", "Order Qty"];
    const rows = (orderItemsList || []).map((i) => [orderNum, i.productName, i.brand, i.category, i.supplier || "General", i.qty || ""]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Procurement_" + orderNum + "_" + date + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSavedOrders = useMemo(() => {
    let list = [...savedOrders];
    if (savedFilterMode === "ordered") list = list.filter((o) => o.status === "ordered");
    else if (savedFilterMode === "pending") list = list.filter((o) => o.status !== "ordered");
    if (savedSearch.trim()) {
      const q = savedSearch.trim().toLowerCase();
      list = list.filter((o) => o.orderNum?.toLowerCase().includes(q) || o.supplierNames?.join(" ").toLowerCase().includes(q));
    }
    if (savedSupplierFilter.length > 0) {
      list = list.filter((o) => o.supplierNames?.some((s) => savedSupplierFilter.includes(s)));
    }
    if (savedSortBy === "recent") list.sort((a, b) => (savedSortDir === "desc" ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)));
    else if (savedSortBy === "items") list.sort((a, b) => (savedSortDir === "desc" ? (b.items?.length || 0) - (a.items?.length || 0) : (a.items?.length || 0) - (b.items?.length || 0)));
    return list;
  }, [savedOrders, savedFilterMode, savedSearch, savedSupplierFilter, savedSortBy, savedSortDir]);

  const PROC_STATUS = {
    pending: { bg: "rgba(245,158,11,0.12)", color: "#fde68a", border: "#f59e0b" },
    ordered: { bg: "rgba(129,140,248,0.12)", color: "#c7d2fe", border: "#818cf8" },
    received: { bg: "rgba(6,214,160,0.12)", color: "#06d6a0", border: "#06d6a0" },
  };
  return (
    <div style={{ paddingBottom: 80 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} confirmLabel={modal.confirmLabel || "OK"} />}

      {toast && <div className="toast">{toast}</div>}

      {/* Row 3 — Back arrow + KPIs (scrollable) */}
      <div className="page-header-row">
        <span className="back-arrow-gradient" onClick={onBack}>
          <BackIcon size={20} strokeWidth={3} />
        </span>
        <div style={{ display: "flex", gap: 6, flex: 1, overflowX: "auto" }}>
          {[
            { label: "Products", value: items.length, color: "#00b4d8" },
            { label: "Low Stock", value: lowStockCount, color: "#f59e0b" },
            { label: "Out of Stock", value: outOfStockCount, color: "#ef4444" },
            { label: "Fast Moving", value: fastMovingCount, color: "#06d6a0" },
          ].map((k) => (
            <div key={k.label} style={{ flexShrink: 0, background: "#111827", border: "1px solid " + k.color + "44", borderRadius: 8, padding: "4px 10px", textAlign: "center", minWidth: 64 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 9, color: "#475569" }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4 — Tabs (sticky start) */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "#0d1117", paddingTop: 4 }}>
        <div className="tab-bar" style={{ marginBottom: 0 }}>
          <button className={"tab-btn" + (tab === "list" ? " active" : "")} onClick={() => setTab("list")}>
            Procurement List
          </button>
          <button className={"tab-btn" + (tab === "saved" ? " active" : "")} onClick={() => setTab("saved")}>
            Saved Lists {savedOrders.length > 0 ? "(" + savedOrders.length + ")" : ""}
          </button>
        </div>

        {/* ── PROCUREMENT LIST sticky rows 5+6 ── */}
        {tab === "list" && (
          <div style={{ background: "#0d1117", borderBottom: "1px solid rgba(0,180,216,0.1)", paddingBottom: 8 }}>
            {/* Row 5 — Search + Mic + Order No */}
            <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 6 }}>
              <input className="input" style={{ flex: 1 }} placeholder="Search product, supplier…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className={"mic-btn" + (listening ? " listening" : "")} onClick={listening ? stop : start}>
                <Icon name="Mic" size={16} />
              </button>
              <SelectField
                value={selectedOrderNum}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOrderNum(val);
                  setFilterMode(val === "new" ? "all" : "addedToOrder");
                }}
                selectStyle={{ width: "auto", minWidth: 110, fontSize: 11 }}
              >
                <option value="new">New Order</option>
                {savedOrders.map((o) => (
                  <option key={o.orderNum} value={o.orderNum}>
                    {o.orderNum}
                  </option>
                ))}
              </SelectField>
            </div>

            {/* Row 6 — Filter + Sort + Supplier + View mode */}
            <div style={{ display: "flex", gap: 6 }}>
              <button className={"btn " + (Object.keys(filters).length > 0 ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 10 }} onClick={() => setShowFilter(true)}>
                Filter
              </button>
              <button className="btn btn-outline" style={{ flex: 1, fontSize: 10 }} onClick={() => setShowSort(true)}>
                Sort
              </button>
              <button className={"btn " + (supplierFilter.length > 0 ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 10 }} onClick={() => setShowSupplier(true)}>
                Supplier
              </button>
              <SelectField value={filterMode} onChange={(e) => setFilterMode(e.target.value)} selectStyle={{ flex: 1, fontSize: 10 }}>
                <option value="all">All</option>
                <option value="addedToOrder">In Order</option>
                <option value="pending">Pending</option>
              </SelectField>
            </div>
          </div>
        )}

        {/* ── SAVED LISTS sticky rows 5+6 ── */}
        {tab === "saved" && (
          <div style={{ background: "#0d1117", borderBottom: "1px solid rgba(0,180,216,0.1)", paddingBottom: 8 }}>
            {/* Row 5 — Search + Mic + Status filter */}
            <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 6 }}>
              <input className="input" style={{ flex: 1 }} placeholder="Search order no, supplier…" value={savedSearch} onChange={(e) => setSavedSearch(e.target.value)} />
              <button className={"mic-btn"} onClick={() => {}}>
                <Icon name="Mic" size={16} />
              </button>
              <SelectField value={savedFilterMode} onChange={(e) => setSavedFilterMode(e.target.value)} selectStyle={{ width: "auto", minWidth: 90, fontSize: 11 }}>
                <option value="all">All</option>
                <option value="ordered">Ordered</option>
                <option value="pending">Pending</option>
              </SelectField>
            </div>

            {/* Row 6 — Period + Sort + Supplier */}
            <div style={{ display: "flex", gap: 6 }}>
              <SelectField value={savedPeriod} onChange={(e) => setSavedPeriod(e.target.value)} selectStyle={{ flex: 1.5, fontSize: 10 }}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </SelectField>
              <button
                className={"btn " + (savedSortBy === "recent" ? "btn-primary" : "btn-outline")}
                style={{ flex: 1, fontSize: 10 }}
                onClick={() => {
                  setSavedSortBy("recent");
                  setSavedSortDir((d) => (d === "asc" ? "desc" : "asc"));
                }}
              >
                Recent {savedSortBy === "recent" ? (savedSortDir === "asc" ? "↑" : "↓") : ""}
              </button>
              <button
                className={"btn " + (savedSortBy === "items" ? "btn-primary" : "btn-outline")}
                style={{ flex: 1, fontSize: 10 }}
                onClick={() => {
                  setSavedSortBy("items");
                  setSavedSortDir((d) => (d === "asc" ? "desc" : "asc"));
                }}
              >
                Items {savedSortBy === "items" ? (savedSortDir === "asc" ? "↑" : "↓") : ""}
              </button>
              <button className={"btn " + (savedSupplierFilter.length > 0 ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 10 }} onClick={() => setShowSavedSupplier(true)}>
                Supplier
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── PROCUREMENT LIST CONTENT ── */}
      {tab === "list" && (
        <div style={{ marginTop: 8 }}>
          {/* Add form */}
          {showAdd && (
            <div style={{ background: "#111827", borderRadius: 10, padding: 12, marginBottom: 8, border: "1px solid rgba(0,180,216,0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#00b4d8", marginBottom: 8 }}>Add Item</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input className="input" placeholder="Product Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <input className="input" placeholder="Brand" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
                <input className="input" placeholder="Qty to Order" type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
                <input className="input" placeholder="Supplier" value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} />
                <input className="input" placeholder="Note (optional)" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddManual}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#475569" }}>
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Product cards */}
          {grouped.map((group) => (
            <div key={group.key || "all"}>
              {group.key && (
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "rgba(0,180,216,0.1)",
                    border: "1px solid rgba(0,180,216,0.2)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#00b4d8",
                    marginBottom: 6,
                    marginTop: 4,
                  }}
                >
                  {group.key}
                </div>
              )}
              {group.items.map((item) => {
                const sc = PROC_STATUS[item.status] || PROC_STATUS.pending;
                const stockStatus = getStockStatus(item.currStock, item.reorderLevel);
                const ssc = STOCK_STATUS_COLORS[stockStatus];
                const isAdded = item.addedToOrder && item.orderNum === currentOrderNum;
                const canAddToOrder = !!item.qty;
                const canUpdateStock = !!item.actualQty;
                const canRemoveFromList = !isAdded;

                return (
                  <div key={item.id} className="list-card" style={{ marginBottom: 8 }}>
                    {/* Card top */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      {/* Left */}
                      <div style={{ flex: 1.5 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{item.productName}</div>
                        <div className="text-small">{item.brand}</div>
                        <div className="text-small">{item.packingQty}</div>
                        <div className="text-small">{item.category}</div>
                        <div className="text-small">{item.subCategory}</div>
                        {item.variant1 && <div className="text-small">{item.variant1}</div>}
                        {item.variant2 && <div className="text-small">{item.variant2}</div>}
                      </div>
                      {/* Centre */}
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{item.currStock}</div>
                        <span style={{ background: ssc.bg, color: ssc.color, border: "1px solid " + ssc.border, padding: "1px 6px", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>
                          {STOCK_STATUS_LABELS[stockStatus]}
                        </span>
                        {item.fastSelling && (
                          <div style={{ marginTop: 4 }}>
                            <span className="badge badge-info" style={{ fontSize: 9 }}>
                              Fast
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Right */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        {/* Supplier */}
                        {(() => {
                          const product = inventoryItems.find((p) => p.name?.toLowerCase() === item.productName?.toLowerCase());
                          const suppliers = Array.isArray(product?.suppliers) ? product.suppliers.filter(Boolean) : [];

                          // Fallback: no supplier metadata – keep existing free-text input.
                          if (suppliers.length === 0) {
                            return (
                              <input
                                className="input"
                                style={{ fontSize: 10 }}
                                placeholder="Supplier"
                                value={item.supplier || ""}
                                onChange={(e) => updateItem({ ...item, supplier: e.target.value })}
                              />
                            );
                          }

                          const currentSupplier = item.supplier || suppliers[0];

                          // Exactly one supplier – show as read-only text (no dropdown).
                          if (suppliers.length === 1) {
                            return (
                              <div
                                style={{
                                  fontSize: 10,
                                  padding: "6px 8px",
                                  borderRadius: 6,
                                  background: "#0a0f18",
                                  border: "1px solid rgba(148,163,184,0.45)",
                                  color: "#e2e8f0",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {currentSupplier}
                              </div>
                            );
                          }

                          // Multiple suppliers – use dropdown selector.
                          return (
                            <SelectField
                              value={currentSupplier}
                              onChange={(e) => updateItem({ ...item, supplier: e.target.value })}
                              selectStyle={{ fontSize: 10 }}
                            >
                              {suppliers.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </SelectField>
                          );
                        })()}
                        {/* Order Qty */}
                        <input
                          className="input"
                          style={{ fontSize: 10, textAlign: "center" }}
                          type="number"
                          min="0"
                          placeholder="Order Qty"
                          value={item.qty || ""}
                          onChange={(e) => updateItem({ ...item, qty: Number(e.target.value) || 0 })}
                        />
                        {/* Received Qty */}
                        <input
                          className="input"
                          style={{ fontSize: 10, textAlign: "center" }}
                          type="number"
                          min="0"
                          placeholder="Received Qty"
                          value={item.actualQty || ""}
                          onChange={(e) => updateItem({ ...item, actualQty: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    {/* Card bottom actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {/* Remove from List */}
                      <button
                        className={"btn btn-danger" + (!canRemoveFromList ? " btn-disabled" : "")}
                        style={{ flex: 1, fontSize: 9 }}
                        onClick={() => {
                          if (!canRemoveFromList) return;
                          setModal({
                            type: "confirm",
                            title: "Remove from List",
                            message: "Remove " + item.productName + " from procurement list?",
                            confirmLabel: "Remove",
                            onConfirm: () => {
                              setModal(null);
                              deleteItem(item.id);
                              showToast(item.productName + " removed from procurement.");
                            },
                            onCancel: () => setModal(null),
                          });
                        }}
                      >
                        Remove from List
                      </button>

                      {/* Add to Order / Remove from Order */}
                      <button
                        className={"btn " + (isAdded ? "btn-primary" : "btn-outline") + (!canAddToOrder && !isAdded ? " btn-disabled" : "")}
                        style={{ flex: 1.2, fontSize: 9 }}
                        onClick={() => {
                          if (!canAddToOrder && !isAdded) return;
                          if (isAdded) {
                            removeFromOrder(item.id);
                            showToast(item.productName + " removed from order.");
                          } else {
                            markAddedToOrder(item.id, currentOrderNum);
                            showToast(item.productName + " added to order.");
                          }
                        }}
                      >
                        {isAdded ? "Remove from Order" : "Add to Order"}
                      </button>

                      {/* Update Stock */}
                      <button
                        className={"btn btn-success" + (!canUpdateStock ? " btn-disabled" : "")}
                        style={{ flex: 1, fontSize: 9 }}
                        onClick={() => {
                          if (!canUpdateStock) return;
                          const actual = Number(item.actualQty);
                          const inv = inventoryItems.find((p) => p.name?.toLowerCase() === item.productName?.toLowerCase());
                          if (inv) {
                            adjustStock(inv.id, actual);
                            updateItem({ ...item, actualQty: 0 });
                            showToast(item.productName + ": +" + actual + " added to stock.");
                          } else {
                            setModal({ type: "warning", title: "Not Found", message: item.productName + " not found in inventory.", onConfirm: () => setModal(null) });
                          }
                        }}
                      >
                        Update Stock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-muted" style={{ marginTop: 12 }}>
              No procurement items found.
            </div>
          )}
        </div>
      )}
      {/* ── SAVED LISTS CONTENT ── */}
      {tab === "saved" && (
        <div style={{ marginTop: 8 }}>
          {filteredSavedOrders.length === 0 && (
            <div className="text-muted" style={{ marginTop: 12 }}>
              No saved orders yet.
            </div>
          )}
          {filteredSavedOrders.map((order) => (
            <div key={order.orderNum} className="list-card" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                {/* Left */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>{order.orderNum}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{order.date}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{order.items?.length || 0} items</div>
                </div>
                {/* Centre */}
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Suppliers</div>
                  {(order.supplierNames || ["General"]).map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#e2e8f0" }}>
                      {s}
                    </div>
                  ))}
                </div>
                {/* Right */}
                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Mark as Ordered */}
                  {order.status !== "ordered" && (
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: 10, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}
                      onClick={() => {
                        setModal({
                          type: "confirm",
                          title: "Mark as Ordered",
                          message: "Mark order " + order.orderNum + " as ordered?",
                          confirmLabel: "Mark Ordered",
                          onConfirm: () => {
                            setModal(null);
                            saveOrder({ ...order, status: "ordered" });
                            showToast(order.orderNum + " marked as ordered.");
                          },
                          onCancel: () => setModal(null),
                        });
                      }}
                    >
                      Mark as Ordered
                    </button>
                  )}
                  {order.status === "ordered" && <span style={{ background: "rgba(129,140,248,0.15)", color: "#c7d2fe", padding: "2px 8px", borderRadius: 999, fontSize: 10 }}>Ordered</span>}
                  {/* View/Edit */}
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 10, padding: "3px 10px" }}
                    onClick={() => {
                      setViewingOrder(order);
                      setViewOrderSource("saved");
                      setShowViewOrder(true);
                    }}
                  >
                    View / Edit Order
                  </button>
                  {/* Update Stock — active only if ordered */}
                  <button
                    className={"btn btn-success" + (order.status !== "ordered" ? " btn-disabled" : "")}
                    style={{ fontSize: 10, padding: "3px 10px" }}
                    onClick={() => {
                      if (order.status !== "ordered") return;
                      setSelectedOrderNum(order.orderNum);
                      setFilterMode("addedToOrder");
                      setTab("list");
                      showToast("Switched to " + order.orderNum + " in Procurement List.");
                    }}
                  >
                    Update Stock
                  </button>
                  {/* Delete */}
                  <button
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, cursor: "pointer", textAlign: "right", display: "inline-flex", alignItems: "center", gap: 4 }}
                    onClick={() => {
                      setModal({
                        type: "confirm",
                        title: "Delete Order",
                        message: "Delete order " + order.orderNum + "? All items will revert to 'Add to Order'.",
                        confirmLabel: "Delete",
                        onConfirm: () => {
                          setModal(null);
                          deleteSavedOrder(order.orderNum);
                          showToast(order.orderNum + " deleted.");
                        },
                        onCancel: () => setModal(null),
                      });
                    }}
                  >
                    <Icon name="Trash2" size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Saved Lists bottom KPIs */}
          <div style={{ height: 80 }} />
        </div>
      )}

      {/* Saved Lists fixed bottom */}
      {tab === "saved" && (
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
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Total</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>{savedOrders.length}</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Ordered</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{savedOrders.filter((o) => o.status === "ordered").length}</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Pending</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{savedOrders.filter((o) => o.status !== "ordered").length}</div>
            </div>
          </div>
        </div>
      )}
      {/* ── VIEW ORDER PAGE ── */}
      {showViewOrder && viewingOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#0d1117",
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              border: "1px solid rgba(0,180,216,0.3)",
            }}
          >
            {/* Sticky top card */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f1923, #1a2535)",
                borderBottom: "1px solid rgba(0,180,216,0.2)",
                padding: "12px 16px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                {/* Left — shop + order info */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{sheetData?.shopName || "My Shop"}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{sheetData?.ownerName || ""}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#00b4d8", marginTop: 4 }}>{viewingOrder.orderNum}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{viewingOrder.date}</div>
                </div>
                {/* Right — supplier + actions */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Suppliers</div>
                  <div style={{ fontSize: 11, color: "#e2e8f0", marginBottom: 8 }}>{(viewingOrder.supplierNames || ["General"]).join(", ")}</div>
                  {/* Action buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: 10, padding: "3px 10px" }}
                      onClick={() => {
                        setShowViewOrder(false);
                        setTab(viewOrderSource === "saved" ? "saved" : "list");
                      }}
                    >
                      <Icon name="X" size={14} />
                      <span>Close</span>
                    </button>
                    {viewingOrder.status !== "ordered" && (
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 10, padding: "3px 10px" }}
                        onClick={() => {
                          setModal({
                            type: "confirm",
                            title: "Mark as Ordered",
                            message: "Mark " + viewingOrder.orderNum + " as ordered?",
                            confirmLabel: "Mark Ordered",
                            onConfirm: () => {
                              setModal(null);
                              saveOrder({ ...viewingOrder, status: "ordered" });
                              setViewingOrder((prev) => ({ ...prev, status: "ordered" }));
                              showToast(viewingOrder.orderNum + " marked as ordered.");
                            },
                            onCancel: () => setModal(null),
                          });
                        }}
                      >
                        Mark as Ordered
                      </button>
                    )}
                    {viewingOrder.status === "ordered" && <span style={{ background: "rgba(129,140,248,0.15)", color: "#c7d2fe", padding: "2px 8px", borderRadius: 999, fontSize: 10 }}>✓ Ordered</span>}
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: 10, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}
                      onClick={() => {
                        setModal({
                          type: "confirm",
                          title: "Delete Order",
                          message: "Delete " + viewingOrder.orderNum + "? Cannot be undone.",
                          confirmLabel: "Delete",
                          onConfirm: () => {
                            setModal(null);
                            deleteSavedOrder(viewingOrder.orderNum);
                            setShowViewOrder(false);
                            showToast(viewingOrder.orderNum + " deleted.");
                          },
                          onCancel: () => setModal(null),
                        });
                      }}
                    >
                      <Icon name="Trash2" size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable product cards */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", paddingBottom: 100 }}>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>{viewingOrder.items?.length || 0} products</div>

              {(viewingOrder.items || []).map((item, idx) => (
                <div key={idx} className="list-card" style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{item.productName}</div>
                      <div className="text-small">
                        {item.brand} · {item.packingQty}
                      </div>
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Supplier</div>
                      <div style={{ fontSize: 11, color: "#e2e8f0" }}>{item.supplier || "General"}</div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Order Qty</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#00b4d8" }}>{item.qty}</div>
                    </div>
                  </div>
                  {/* Remove */}
                    <button
                      style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, cursor: "pointer", marginTop: 6, display: "block", width: "100%", textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}
                    onClick={() => {
                      setModal({
                        type: "confirm",
                        title: "Remove Item",
                        message: "Remove " + item.productName + " from this order?",
                        confirmLabel: "Remove",
                        onConfirm: () => {
                          setModal(null);
                          removeItemFromSavedOrder(viewingOrder.orderNum, item.productName);
                          setViewingOrder((prev) => ({ ...prev, items: prev.items.filter((i) => i.productName !== item.productName) }));
                          showToast(item.productName + " removed from order.");
                        },
                        onCancel: () => setModal(null),
                      });
                    }}
                    >
                    <Icon name="X" size={14} />
                    <span>Remove</span>
                    </button>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "#0f1520",
                borderTop: "1px solid rgba(0,180,216,0.4)",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.4)",
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: 11 }}
                  onClick={() => {
                    setShowViewOrder(false);
                    setTab("list");
                  }}
                >
                  <BackIcon size={16} strokeWidth={3} /> Add/Edit
                </button>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#475569" }}>Products</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>{viewingOrder.items?.length || 0}</div>
                </div>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: 11 }} onClick={handleSaveOrder}>
                  Save
                </button>
                <button
                  className={"btn btn-outline" + (!savedOrders.find((o) => o.orderNum === viewingOrder.orderNum) ? " btn-disabled" : "")}
                  style={{ flex: 1, fontSize: 11 }}
                  onClick={() => handleDownloadCSV(viewingOrder.orderNum, viewingOrder.items || [])}
                >
                  ↓ CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── PROCUREMENT LIST BOTTOM BAR ── */}
      {tab === "list" && !showViewOrder && (
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-outline" style={{ flex: 1, fontSize: 11 }} onClick={onGoToInventory}>
              + Add More
            </button>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase" }}>Total</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>{filtered.length}</div>
              <div style={{ fontSize: 9, color: "#06d6a0" }}>{orderItems.length} in order</div>
            </div>
            <button
              className={"btn btn-primary" + (orderItems.length === 0 ? " btn-disabled" : "")}
              style={{ flex: 1, fontSize: 11 }}
              onClick={() => {
                if (orderItems.length === 0) {
                  setModal({ type: "warning", title: "No Items", message: "Add items to order first.", onConfirm: () => setModal(null) });
                  return;
                }
                setViewingOrder({
                  orderNum: currentOrderNum,
                  date: new Date().toISOString().slice(0, 10),
                  items: orderItems,
                  supplierNames: [...new Set(orderItems.map((i) => i.supplier || "General"))],
                  status: savedOrders.find((o) => o.orderNum === currentOrderNum)?.status || "pending",
                });
                setViewOrderSource("list");
                setShowViewOrder(true);
              }}
            >
              View Order
            </button>
          </div>
        </div>
      )}

      {/* ── ALL MODALS ── */}
      {showSort && (
        <SortModal
          sortBy={sortBy}
          arrange={arrange}
          onApply={(s, a) => {
            setSortBy(s);
            setArrange(a);
            setShowSort(false);
          }}
          onClose={() => setShowSort(false)}
        />
      )}

      {showFilter && (
        <FilterModal
          items={enrichedItems}
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setShowFilter(false);
          }}
          onClose={() => setShowFilter(false)}
        />
      )}

      {showSupplier && (
        <SupplierModal
          suppliers={allSuppliers}
          selected={supplierFilter}
          onApply={(s) => {
            setSupplierFilter(s);
            setShowSupplier(false);
          }}
          onClose={() => setShowSupplier(false)}
        />
      )}

      {showSavedSupplier && (
        <SupplierModal
          suppliers={[...new Set(savedOrders.flatMap((o) => o.supplierNames || []))]}
          selected={savedSupplierFilter}
          onApply={(s) => {
            setSavedSupplierFilter(s);
            setShowSavedSupplier(false);
          }}
          onClose={() => setShowSavedSupplier(false)}
        />
      )}
    </div>
  );
}

export default ProcurementList;
