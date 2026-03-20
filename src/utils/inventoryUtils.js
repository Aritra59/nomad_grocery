// ── Stock Status ──
export const getStockStatus = (currStock, reorderLevel) => {
  const stock = Number(currStock) || 0;
  const reorder = Number(reorderLevel) || 0;
  if (stock <= 0) return "outOfStock";
  if (stock <= reorder) return "low";
  return "inStock";
};

export const STOCK_STATUS_LABELS = {
  inStock: "In Stock",
  low: "Low Stock",
  outOfStock: "Out of Stock",
};

export const STOCK_STATUS_COLORS = {
  inStock: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "#10b981" },
  low: { bg: "rgba(251,191,36,0.15)", color: "#fde68a", border: "#f59e0b" },
  outOfStock: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "#ef4444" },
};

// ── Default Sort ──
// Category → SubCategory → Brand → Name
export const defaultSort = (a, b) => {
  return (
    (a.category || "").localeCompare(b.category || "") ||
    (a.subCategory || "").localeCompare(b.subCategory || "") ||
    (a.brand || "").localeCompare(b.brand || "") ||
    (a.name || "").localeCompare(b.name || "")
  );
};

// ── Sort Products ──
export const sortProducts = (list, sortBy, sortDir, fastFirst) => {
  const sorted = [...list].sort((a, b) => {
    if (fastFirst && a.fastSelling !== b.fastSelling) {
      return a.fastSelling ? -1 : 1;
    }
    let valA, valB;
    switch (sortBy) {
      case "name":
        valA = a.name || "";
        valB = b.name || "";
        break;
      case "brand":
        valA = a.brand || "";
        valB = b.brand || "";
        break;
      case "category":
        valA = a.category || "";
        valB = b.category || "";
        break;
      case "subCategory":
        valA = a.subCategory || "";
        valB = b.subCategory || "";
        break;
      case "stock":
        valA = a.currStock || 0;
        valB = b.currStock || 0;
        break;
      default:
        return defaultSort(a, b);
    }
    if (typeof valA === "string") {
      return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === "asc" ? valA - valB : valB - valA;
  });
  return sorted;
};

// ── Filter Products ──
export const filterProducts = (list, { search, category, brand, stockStatus }) => {
  let result = [...list];
  if (search) {
    const q = search.trim().toLowerCase();
    result = result.filter((p) => [p.name, p.brand, p.category, p.subCategory, p.variant1, p.variant2].join(" ").toLowerCase().includes(q));
  }
  if (category) result = result.filter((p) => p.category === category);
  if (brand) result = result.filter((p) => p.brand === brand);
  if (stockStatus) {
    result = result.filter((p) => getStockStatus(p.currStock, p.reorderLevel) === stockStatus);
  }
  return result;
};
