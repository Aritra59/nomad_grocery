import React, { useMemo, useEffect, useState } from "react";
import { useInventory } from "../../context/InventoryContext";
import { useCatalog } from "../../context/CatalogContext";
import { useProcurementData } from "../../hooks/useProcurementData";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { getStockStatus, STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from "../../utils/inventoryUtils";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";
import Icon from "../../components/common/Icon";

function FiltersModal({ items, filters, onApply, onClose }) {
  const [local, setLocal] = useState({ ...filters });
  const all = (field) => [...new Set(items.map((p) => p[field]).filter(Boolean))].sort();
  const toggle = (field, value) => {
    setLocal((prev) => {
      const current = prev[field] || [];
      return { ...prev, [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
    });
  };
  const Section = ({ label, field }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "#64748b" }}>{label}</div>
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
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "#64748b" }}>Stock Status</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "inStock", "low", "outOfStock"].map((v) => (
              <button
                key={v}
                className={"btn " + (local.stockStatus === v ? "btn-primary" : "btn-outline")}
                style={{ fontSize: 10, padding: "2px 8px" }}
                onClick={() => setLocal((p) => ({ ...p, stockStatus: v }))}
              >
                {v === "all" ? "All" : v === "inStock" ? "In Stock" : v === "low" ? "Low" : "Out of Stock"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "#64748b" }}>Movement</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "fast", "normal"].map((v) => (
              <button
                key={v}
                className={"btn " + (local.movement === v ? "btn-primary" : "btn-outline")}
                style={{ fontSize: 10, padding: "2px 8px" }}
                onClick={() => setLocal((p) => ({ ...p, movement: v }))}
              >
                {v === "all" ? "All" : v === "fast" ? "Fast Selling" : "Normal"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setLocal({ stockStatus: "all", movement: "all" })}>
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

function SortModal({ sortBy, sortDir, fastFirst, onApply, onClose }) {
  const [localBy, setLocalBy] = useState(sortBy);
  const [localDir, setLocalDir] = useState(sortDir);
  const [localFast, setLocalFast] = useState(fastFirst);
  const options = [
    { value: "default", label: "Default (Cat→SubCat→Brand→Name)" },
    { value: "name", label: "Name" },
    { value: "brand", label: "Brand" },
    { value: "category", label: "Category" },
    { value: "subCategory", label: "Sub Category" },
    { value: "stock", label: "Stock" },
  ];
  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#00b4d8" }}>Sort</div>
          <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Sort By</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {options.map((o) => (
            <button key={o.value} className={"btn " + (localBy === o.value ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => setLocalBy(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        {localBy !== "default" && (
          <>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Direction</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <button className={"btn " + (localDir === "asc" ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 11 }} onClick={() => setLocalDir("asc")}>
                ↑ A → Z / Low → High
              </button>
              <button className={"btn " + (localDir === "desc" ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 11 }} onClick={() => setLocalDir("desc")}>
                ↓ Z → A / High → Low
              </button>
            </div>
          </>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }} onClick={() => setLocalFast(!localFast)}>
          <div className={"app-checkbox" + (localFast ? " checked" : "")}>{localFast && <span style={{ color: "#0d1117", fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
          <span style={{ fontSize: 12, color: "#cbd5e1" }}>Fast Moving on Top</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={() => {
              setLocalBy("default");
              setLocalDir("asc");
              setLocalFast(false);
            }}
          >
            Clear All
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onApply(localBy, localDir, localFast)}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI Row component ──
function KpiRow({ label, count, low, outOfStock, fast, borderColor }) {
  const pills = [
    { key: "count", label: "Products", value: count, color: borderColor },
    { key: "low", label: "Low Stock", value: low, color: "#f59e0b" },
    { key: "out", label: "Out of Stock", value: outOfStock, color: "#ef4444" },
    { key: "fast", label: "Fast Moving", value: fast, color: "#06d6a0" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
      <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 56 }}>{label}</div>
      {pills.map((p) => (
        <div
          key={p.key}
          style={{
            flex: 1,
            textAlign: "center",
            background: "#0a0f18",
            borderRadius: 6,
            padding: "3px 2px",
            border: "1px solid " + p.color + "44",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.value}</div>
          <div style={{ fontSize: 8, color: "#334155", lineHeight: 1 }}>{p.label}</div>
        </div>
      ))}
    </div>
  );
}
function InventoryList({ mode, onBack, onAddProduct, onEditProduct, isOverLimit, setProductsAdded, onViewCatalog }) {
  const { items } = useInventory();
  const { draft, savedIds } = useCatalog();
  const { addFromInventory, items: procItems, deleteItem: deleteProcItem } = useProcurementData();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [sortDir, setSortDir] = useState("asc");
  const [fastFirst, setFastFirst] = useState(false);
  const [filters, setFilters] = useState({ stockStatus: "all", movement: "all" });
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [modal, setModal] = useState(null);
  const [viewMode, setViewMode] = useState("inventory"); // "inventory" | "catalog"

  const { listening, start, stop } = useVoiceInput({
    onResult: (text) => setSearch(text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  useEffect(() => {
    setProductsAdded(items.length);
  }, [items.length, setProductsAdded]);

  // Catalog items
  const catalogIds = savedIds.map(String);
  const catalogItems = useMemo(() => items.filter((p) => catalogIds.includes(String(p.id))), [items, catalogIds]);

  // Source list based on view mode
  const sourceItems = viewMode === "catalog" ? catalogItems : items;

  // KPI calculations
  const invKpi = useMemo(
    () => ({
      count: items.length,
      low: items.filter((p) => getStockStatus(p.currStock, p.reorderLevel) === "low").length,
      outOfStock: items.filter((p) => getStockStatus(p.currStock, p.reorderLevel) === "outOfStock").length,
      fast: items.filter((p) => p.fastSelling).length,
    }),
    [items]
  );

  const catKpi = useMemo(
    () => ({
      count: catalogItems.length,
      low: catalogItems.filter((p) => getStockStatus(p.currStock, p.reorderLevel) === "low").length,
      outOfStock: catalogItems.filter((p) => getStockStatus(p.currStock, p.reorderLevel) === "outOfStock").length,
      fast: catalogItems.filter((p) => p.fastSelling).length,
    }),
    [catalogItems]
  );

  const inProcurement = (productName) => procItems.some((i) => i.productName?.toLowerCase() === productName?.toLowerCase());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = sourceItems.filter((p) => {
      if (q && ![p.name, p.brand, p.category, p.subCategory, p.variant1, p.variant2].join(" ").toLowerCase().includes(q)) return false;
      const status = getStockStatus(p.currStock, p.reorderLevel);
      if (filters.stockStatus !== "all" && status !== filters.stockStatus) return false;
      if (filters.movement === "fast" && !p.fastSelling) return false;
      if (filters.movement === "normal" && p.fastSelling) return false;
      if ((filters.category || []).length && !(filters.category || []).includes(p.category)) return false;
      if ((filters.subCategory || []).length && !(filters.subCategory || []).includes(p.subCategory)) return false;
      if ((filters.brand || []).length && !(filters.brand || []).includes(p.brand)) return false;
      return true;
    });

    // Default sort: Category → SubCategory → Brand → Name
    if (sortBy === "default") {
      return list.sort(
        (a, b) =>
          (a.category || "").localeCompare(b.category || "") ||
          (a.subCategory || "").localeCompare(b.subCategory || "") ||
          (a.brand || "").localeCompare(b.brand || "") ||
          (a.name || "").localeCompare(b.name || "")
      );
    }

    return list.sort((a, b) => {
      if (fastFirst && a.fastSelling !== b.fastSelling) return a.fastSelling ? -1 : 1;
      let valA, valB;
      if (sortBy === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (sortBy === "brand") {
        valA = a.brand || "";
        valB = b.brand || "";
      } else if (sortBy === "category") {
        valA = a.category || "";
        valB = b.category || "";
      } else if (sortBy === "subCategory") {
        valA = a.subCategory || "";
        valB = b.subCategory || "";
      } else if (sortBy === "stock") {
        valA = a.currStock || 0;
        valB = b.currStock || 0;
      }
      if (typeof valA === "string") return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
  }, [sourceItems, search, sortBy, sortDir, fastFirst, filters]);

  const activeFilterCount = [
    (filters.category || []).length,
    (filters.subCategory || []).length,
    (filters.brand || []).length,
    filters.stockStatus !== "all" ? 1 : 0,
    filters.movement !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);
  return (
    <div style={{ paddingBottom: 70 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} confirmLabel={modal.confirmLabel || "OK"} />}

      {/* Sticky: KPIs + search + tabs + filter/sort — only product list scrolls */}
      <div className="sticky-header">
        {/* KPI Row 1 — Inventory */}
        <div style={{ marginBottom: 4 }}>
          <KpiRow label="Inventory" count={invKpi.count} low={invKpi.low} outOfStock={invKpi.outOfStock} fast={invKpi.fast} borderColor="#00b4d8" />
        </div>

        {/* KPI Row 2 — Catalog */}
        <div style={{ marginBottom: 8 }}>
          <KpiRow label="Catalog" count={catKpi.count} low={catKpi.low} outOfStock={catKpi.outOfStock} fast={catKpi.fast} borderColor="#818cf8" />
        </div>

        {/* Search + mic row */}
        <div className="search-row" style={{ marginBottom: 6 }}>
          <span
            style={{
              fontSize: 18,
              cursor: "pointer",
              color: "#00b4d8",
              fontWeight: 900,
              marginRight: 4,
              background: "linear-gradient(135deg, #00b4d8, #06d6a0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            onClick={onBack}
          >
            <BackIcon size={20} strokeWidth={3} />
          </span>
          <input className="input" style={{ flex: 1 }} placeholder="Name, brand, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className={"mic-btn" + (listening ? " listening" : "")} onClick={listening ? stop : start}>
            <Icon name="Mic" size={16} />
          </button>
        </div>

        {/* Inventory / Catalog segmented toggle */}
        <div
          style={{
            display: "flex",
            background: "#0a0f18",
            borderRadius: 10,
            padding: 3,
            marginBottom: 6,
            border: "1px solid rgba(0,180,216,0.15)",
          }}
        >
          <button
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: viewMode === "inventory" ? "linear-gradient(135deg, #00b4d8, #06d6a0)" : "transparent",
              color: viewMode === "inventory" ? "#0d1117" : "#475569",
              transition: "all 0.15s",
            }}
            onClick={() => setViewMode("inventory")}
          >
            Inventory ({items.length})
          </button>
          <button
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: viewMode === "catalog" ? "linear-gradient(135deg, #818cf8, #c7d2fe)" : "transparent",
              color: viewMode === "catalog" ? "#0d1117" : "#475569",
              transition: "all 0.15s",
            }}
            onClick={() => setViewMode("catalog")}
          >
            Catalog ({catalogItems.length})
          </button>
        </div>

        {/* Filter + Sort + Add row */}
        <div style={{ display: "flex", gap: 6 }}>
          <button className={"btn " + (activeFilterCount > 0 ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 11 }} onClick={() => setShowFilters(true)}>
            Filter {activeFilterCount > 0 ? "(" + activeFilterCount + ")" : ""}
          </button>
          <button className="btn btn-outline" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowSort(true)}>
            Sort
          </button>
          <button
            className={"btn btn-primary" + (isOverLimit ? " btn-disabled" : "")}
            style={{ flex: 1, fontSize: 11 }}
            onClick={isOverLimit ? () => setModal({ type: "warning", title: "Slot Limit", message: "Over slot limit. Buy more slots.", onConfirm: () => setModal(null) }) : onAddProduct}
          >
            + Add
          </button>
        </div>

        {/* Count */}
        <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
          {filtered.length} of {sourceItems.length} {viewMode === "catalog" ? "catalog" : ""} product{sourceItems.length !== 1 ? "s" : ""}
        </div>
      </div>
      {/* Product list — scrollable */}
      <div className="list" style={{ marginTop: 8 }}>
        {filtered.map((p) => {
          const status = getStockStatus(p.currStock, p.reorderLevel);
          const sc = STOCK_STATUS_COLORS[status];
          const isInProc = inProcurement(p.name);

          return (
            <div key={p.id} className="list-card">
              <div style={{ display: "flex", gap: 8 }}>
                {/* Left */}
                <div style={{ flex: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{p.name}</div>
                  <div className="text-small">{p.brand}</div>
                  <div className="text-small">{p.packingQty}</div>
                  <div style={{ fontSize: 12, color: "#00b4d8", fontWeight: 600 }}>₹{p.mrp}</div>
                </div>

                {/* Centre */}
                <div style={{ flex: 1 }}>
                  <div className="text-small">{p.category}</div>
                  <div className="text-small">{p.subCategory}</div>
                  {p.variant1 ? <div className="text-small">{p.variant1}</div> : null}
                  {p.variant2 ? <div className="text-small">{p.variant2}</div> : null}
                </div>

                {/* Right */}
                <div style={{ flex: 0.8, textAlign: "right" }}>
                  <div className="text-small">Stock</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{p.currStock ?? 0}</div>
                  <span
                    style={{
                      background: sc.bg,
                      color: sc.color,
                      border: "1px solid " + sc.border,
                      padding: "2px 6px",
                      borderRadius: 999,
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  >
                    {STOCK_STATUS_LABELS[status]}
                  </span>
                  {p.fastSelling && (
                    <div style={{ marginTop: 4 }}>
                      <span className="badge badge-info" style={{ fontSize: 9 }}>
                        Fast
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card actions */}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button className="btn btn-outline" style={{ flex: 1, fontSize: 11 }} onClick={() => onEditProduct(p.id)}>
                  Edit / Delete
                </button>
                <button
                  className={"btn " + (isInProc ? "btn-warning" : "btn-outline")}
                  style={{ flex: 1.4, fontSize: 10 }}
                  onClick={() => {
                    if (isInProc) {
                      setModal({
                        type: "confirm",
                        title: "Remove from Procurement",
                        message: p.name + " is in Procurement. Remove it?",
                        confirmLabel: "Remove",
                  onConfirm: () => {
                    setModal(null);
                    // Remove all procurement items matching this product
                    procItems
                      .filter((i) => i.productName?.toLowerCase() === p.name?.toLowerCase())
                      .forEach((i) => deleteProcItem(i.id));
                  },
                        onCancel: () => setModal(null),
                      });
                    } else {
                      addFromInventory(p);
                      setModal({
                        type: "success",
                        title: "Added",
                        message: p.name + " added to Procurement.",
                        onConfirm: () => setModal(null),
                      });
                    }
                  }}
                >
                  {isInProc ? "Remove from Procurement" : "Add to Procurement"}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-muted" style={{ marginTop: 12 }}>
            No products found.
          </div>
        )}
      </div>
      {/* Bottom bar — fixed */}
      <div
        className="fixed-bottom-bar compact-bottom-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>
          Total: {viewMode === "catalog" ? catalogItems.length : items.length} {viewMode === "catalog" ? "catalog" : "inventory"} products
        </div>
        <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={onViewCatalog}>
          Create Catalog
        </button>
      </div>

      {showFilters && (
        <FiltersModal
          items={items}
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setShowFilters(false);
          }}
          onClose={() => setShowFilters(false)}
        />
      )}

      {showSort && (
        <SortModal
          sortBy={sortBy}
          sortDir={sortDir}
          fastFirst={fastFirst}
          onApply={(by, dir, fast) => {
            setSortBy(by);
            setSortDir(dir);
            setFastFirst(fast);
            setShowSort(false);
          }}
          onClose={() => setShowSort(false)}
        />
      )}
    </div>
  );
}

export default InventoryList;
