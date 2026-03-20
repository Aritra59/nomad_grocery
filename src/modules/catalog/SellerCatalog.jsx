import React, { useState, useMemo } from "react";
import { useInventory } from "../../context/InventoryContext";
import { useCatalog } from "../../context/CatalogContext";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { copyToClipboard, generateCatalogLink } from "../../utils/catalogUtils";
import AppModal from "../../components/common/AppModal";
import BuyerCatalog from "./BuyerCatalog";
import BackIcon from "../../components/common/BackIcon";
import SelectField from "../../components/common/SelectField";
import Icon from "../../components/common/Icon";

function SellerCatalog({ mode, onBack, sheetData }) {
  const { items } = useInventory();
  const { draft, toggleItem, selectAll, deselectAll, saveCatalog, hasUnsavedChanges, savedAt, selectedIds } = useCatalog();

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [previewMode, setPreviewMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modal, setModal] = useState(null);

  const catalogLink = generateCatalogLink(sheetData?.mobile, sheetData?.shopName, sheetData?.ownerName);

  const { listening, start, stop } = useVoiceInput({
    onResult: (text) => setSearch(text),
    onError: (msg) => setModal({ type: "error", title: "Voice Error", message: msg, onConfirm: () => setModal(null) }),
  });

  const categories = useMemo(() => [...new Set(items.map((p) => p.category).filter(Boolean))].sort(), [items]);
  const brands = useMemo(() => [...new Set(items.map((p) => p.brand).filter(Boolean))].sort(), [items]);
  const activeFilterCount = [filterCategory, filterBrand, filterStock].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...items];
    if (q) list = list.filter((p) => [p.name, p.brand, p.category, p.subCategory].join(" ").toLowerCase().includes(q));
    if (viewMode === "selected") list = list.filter((p) => !!draft[p.id]);
    if (viewMode === "notSelected") list = list.filter((p) => !draft[p.id]);
    if (filterCategory) list = list.filter((p) => p.category === filterCategory);
    if (filterBrand) list = list.filter((p) => p.brand === filterBrand);
    if (filterStock === "inStock") list = list.filter((p) => (p.currStock || 0) > 0);
    if (filterStock === "outOfStock") list = list.filter((p) => (p.currStock || 0) === 0);
    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (sortBy === "mrp") {
        valA = a.mrp || 0;
        valB = b.mrp || 0;
      } else if (sortBy === "stock") {
        valA = a.currStock || 0;
        valB = b.currStock || 0;
      } else if (sortBy === "brand") {
        valA = a.brand || "";
        valB = b.brand || "";
      } else if (sortBy === "category") {
        valA = a.category || "";
        valB = b.category || "";
      }
      if (typeof valA === "string") return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
    return list;
  }, [items, search, viewMode, draft, filterCategory, filterBrand, filterStock, sortBy, sortDir]);

  const allFilteredIds = filtered.map((p) => p.id);
  const allFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => !!draft[id]);

  const handleSelectAll = () => {
    if (allFilteredSelected) deselectAll(allFilteredIds);
    else selectAll(allFilteredIds);
  };

  const handleCopyLink = async () => {
    if (!isCatalogSaved) {
      setModal({
        type: "warning",
        title: "Save Catalog First",
        message: "Please save your catalog selection before sharing.",
        onConfirm: () => setModal(null),
      });
      return;
    }
    const ok = await copyToClipboard(catalogLink);
    try {
      window.open(catalogLink, "_blank", "noopener,noreferrer");
    } catch {}
    setModal({
      type: ok ? "success" : "info",
      title: ok ? "Catalog Link Ready" : "Catalog Link",
      message: ok ? "Catalog link copied and opened." : "Catalog opened.",
      onConfirm: () => setModal(null),
    });
  };

  const clearFilters = () => {
    setFilterCategory("");
    setFilterBrand("");
    setFilterStock("");
  };

  const isCatalogSaved = !!savedAt && !hasUnsavedChanges;

  if (previewMode) {
    return (
      <BuyerCatalog
        sheetData={sheetData}
        previewMode={true}
        onClose={() => setPreviewMode(false)}
        onSaveCatalog={() => {
          saveCatalog();
          setPreviewMode(false);
          setSaveSuccess(true);
        }}
      />
    );
  }
  return (
    <div style={{ paddingBottom: 120 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel="OK" />}

      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#0d1117",
          paddingBottom: 8,
          borderBottom: "1px solid rgba(0,180,216,0.1)",
          marginBottom: 8,
        }}
      >
        <div className="page-header-row">
          <span className="back-row" style={{ margin: 0 }} onClick={onBack}>
            <BackIcon size={18} strokeWidth={3} />
          </span>
          <div className="page-title-pill">Customer Catalog</div>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            <button
              className={"btn " + (activeFilterCount > 0 ? "btn-primary" : "btn-outline")}
              style={{ fontSize: 10, padding: "4px 10px", position: "relative" }}
              onClick={() => setShowFilters(true)}
            >
              Filter {activeFilterCount > 0 ? "(" + activeFilterCount + ")" : ""}
            </button>
            <button className="btn btn-outline" style={{ fontSize: 10, padding: "3px 10px" }} onClick={handleSelectAll}>
              {allFilteredSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>
      </div>

      {/* Save success banner */}
      {saveSuccess && (
        <div
          style={{
            background: "rgba(6,214,160,0.1)",
            border: "1px solid #06d6a0",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="CheckCircle2" size={16} strokeWidth={2.4} style={{ color: "#06d6a0" }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#06d6a0" }}>Catalog Saved</div>
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>{selectedIds.length} products visible to customers</div>
          </div>
          <button style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSaveSuccess(false)}>
            <Icon name="X" size={16} />
          </button>
        </div>
      )}

      {/* Search row + view toggle pill */}
      <div className="search-row">
        <input className="input" style={{ flex: 1 }} placeholder="Name, brand, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className={"mic-btn" + (listening ? " listening" : "")} onClick={listening ? stop : start}>
          <Icon name="Mic" size={16} />
        </button>
        <SelectField
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          selectStyle={{ width: "auto", minWidth: 90, fontSize: 11 }}
        >
          <option value="all">All</option>
          <option value="selected">Selected</option>
          <option value="notSelected">Not Selected</option>
        </SelectField>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          {filterCategory && <span className="badge badge-info">{filterCategory}</span>}
          {filterBrand && <span className="badge badge-info">{filterBrand}</span>}
          {filterStock && <span className="badge badge-info">{filterStock === "inStock" ? "In Stock" : "Out of Stock"}</span>}
          <button style={{ background: "none", border: "none", color: "#475569", fontSize: 10, cursor: "pointer" }} onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* Stats + Select All */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#475569" }}>
          {filtered.length} shown · {selectedIds.length} selected
        </div>
        <button className="btn btn-outline" style={{ fontSize: 10, padding: "3px 10px" }} onClick={handleSelectAll}>
          {allFilteredSelected ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Product list */}
      <div className="list">
        {filtered.map((p) => {
          const sel = !!draft[p.id];
          return (
            <div key={p.id} className="list-card" style={{ cursor: "pointer", borderLeft: sel ? "3px solid #00b4d8" : "3px solid transparent" }} onClick={() => toggleItem(p.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{p.name}</div>
                  <div className="text-small">
                    {p.brand} · {p.packingQty}
                  </div>
                  <div className="text-small">
                    {p.category} · {p.subCategory}
                  </div>
                  <div className="text-small">
                    MRP ₹{p.mrp} · Stock: {p.currStock || 0}
                  </div>
                </div>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    flexShrink: 0,
                    border: "2px solid " + (sel ? "#00b4d8" : "#334155"),
                    background: sel ? "#00b4d8" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0d1117",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {sel ? "✓" : ""}
                </div>
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
          zIndex: 100,
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>Total: {items.length} products</div>
          <div style={{ fontSize: 10, color: hasUnsavedChanges ? "#f59e0b" : "#475569", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
            {hasUnsavedChanges && <Icon name="AlertTriangle" size={12} style={{ color: "#f59e0b" }} />}
            <span>{hasUnsavedChanges ? "Unsaved changes" : savedAt ? "Saved " + savedAt : "Not saved yet"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={"btn btn-outline" + (!isCatalogSaved ? " btn-disabled" : "")}
            style={{ flex: 2, fontSize: 10, overflow: "hidden", display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}
            onClick={isCatalogSaved ? handleCopyLink : undefined}
          >
            <Icon name="Link2" size={14} />
            <span>Share Catalog</span>
          </button>
          <button
            className={"btn btn-primary" + (selectedIds.length === 0 ? " btn-disabled" : "")}
            style={{ flex: 1, fontSize: 11, flexShrink: 0 }}
            onClick={selectedIds.length === 0 ? undefined : () => setPreviewMode(true)}
          >
            View ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Filter modal */}
      {showFilters && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowFilters(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#00b4d8" }}>Filter Products</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Category</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {categories.map((c) => (
                  <button key={c} className={"btn " + (filterCategory === c ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => setFilterCategory(filterCategory === c ? "" : c)}>
                    {c}
                  </button>
                ))}
                {categories.length === 0 && <span style={{ fontSize: 11, color: "#475569" }}>No categories yet</span>}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Brand</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {brands.map((b) => (
                  <button key={b} className={"btn " + (filterBrand === b ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => setFilterBrand(filterBrand === b ? "" : b)}>
                    {b}
                  </button>
                ))}
                {brands.length === 0 && <span style={{ fontSize: 11, color: "#475569" }}>No brands yet</span>}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Stock Status</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  ["inStock", "In Stock"],
                  ["outOfStock", "Out of Stock"],
                ].map(([val, label]) => (
                  <button key={val} className={"btn " + (filterStock === val ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => setFilterStock(filterStock === val ? "" : val)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={clearFilters}>
                Clear All
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowFilters(false)}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort modal */}
      {showSort && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowSort(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#00b4d8" }}>Sort Products</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Sort By</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  ["name", "Name"],
                  ["brand", "Brand"],
                  ["category", "Category"],
                  ["mrp", "MRP"],
                  ["stock", "Stock"],
                ].map(([val, label]) => (
                  <button key={val} className={"btn " + (sortBy === val ? "btn-primary" : "btn-outline")} style={{ fontSize: 11 }} onClick={() => setSortBy(val)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Direction</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className={"btn " + (sortDir === "asc" ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 11 }} onClick={() => setSortDir("asc")}>
                  ↑ Ascending
                </button>
                <button className={"btn " + (sortDir === "desc" ? "btn-primary" : "btn-outline")} style={{ flex: 1, fontSize: 11 }} onClick={() => setSortDir("desc")}>
                  ↓ Descending
                </button>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowSort(false)}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerCatalog;
