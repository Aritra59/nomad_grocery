// ── Generate Catalog Link — includes shop + owner in URL ──
const encodeSharePayload = (payload) => {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  } catch {
    return "";
  }
};

const decodeSharePayload = (encoded) => {
  if (!encoded) return null;
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const generateCatalogLink = (mobile, shopName, ownerName, payload, shopId) => {
  const base = window.location.origin;
  const params = new URLSearchParams();
  // Wrapper param so the receiver lands in the correct UI state
  params.set("share", "catalog");
  if (mobile) params.set("catalog", mobile);
  if (shopName) params.set("shop", shopName);
  if (ownerName) params.set("owner", ownerName);
  if (shopId) params.set("shopId", shopId);
  if (payload) {
    const encoded = encodeSharePayload(payload);
    if (encoded) params.set("payload", encoded);
  }
  return `${base}?${params.toString()}`;
};

// ── Read shop data from URL params (for buyer catalog) ──
export const getShopDataFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    mobile: params.get("catalog") || "",
    shopName: params.get("shop") || "Shop",
    ownerName: params.get("owner") || "",
    shopId: params.get("shopId") || "",
    payload: decodeSharePayload(params.get("payload") || ""),
  };
};

// ── Generate Customer History Link ──
export const generateHistoryLink = (customerId) => {
  const base = window.location.origin;
  return `${base}?share=customer&customerId=${customerId}`;
};

export const generateCustomerHistoryLink = (customerId, payload) => {
  const base = window.location.origin;
  const params = new URLSearchParams();
  params.set("share", "customer");
  if (customerId !== undefined && customerId !== null) params.set("customerId", String(customerId));
  if (payload) {
    const encoded = encodeSharePayload(payload);
    if (encoded) params.set("payload", encoded);
  }
  return `${base}?${params.toString()}`;
};

export const getCustomerHistoryFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    customerId: params.get("customerId") || "",
    payload: decodeSharePayload(params.get("payload") || ""),
  };
};

// ── Copy to clipboard ──
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
};

// ── Filter Catalog Products ──
export const filterCatalogProducts = (items, { search, category, brand, stockFilter }) => {
  let result = [...items];
  if (search) {
    const q = search.trim().toLowerCase();
    result = result.filter((p) => [p.name, p.brand, p.category, p.subCategory].join(" ").toLowerCase().includes(q));
  }
  if (category) result = result.filter((p) => p.category === category);
  if (brand) result = result.filter((p) => p.brand === brand);
  if (stockFilter === "inStock") result = result.filter((p) => (p.currStock || 0) > 0);
  if (stockFilter === "outOfStock") result = result.filter((p) => (p.currStock || 0) === 0);
  return result;
};

// ── Sort Catalog Products ──
export const sortCatalogProducts = (list, sortBy, sortDir) => {
  return [...list].sort((a, b) => {
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
      case "mrp":
        valA = a.mrp || 0;
        valB = b.mrp || 0;
        break;
      case "stock":
        valA = a.currStock || 0;
        valB = b.currStock || 0;
        break;
      default:
        valA = a.name || "";
        valB = b.name || "";
    }
    if (typeof valA === "string") {
      return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === "asc" ? valA - valB : valB - valA;
  });
};

// ── Get catalog stats ──
export const getCatalogStats = (items, draft) => {
  const selectedIds = Object.keys(draft).filter((id) => !!draft[id]);
  const selectedItems = items.filter((p) => selectedIds.includes(String(p.id)));
  const inStockSelected = selectedItems.filter((p) => (p.currStock || 0) > 0);
  return {
    total: items.length,
    selected: selectedIds.length,
    inStockSelected: inStockSelected.length,
  };
};

// ── Get profile initials ──
// Rule: 2-word name → first letter of each word
// 1-word name → first + last letter
export const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return (words[0][0] + words[0][words[0].length - 1]).toUpperCase();
  }
  return (words[0] || "N").toUpperCase();
};

// ── Generate Shop ID ──
// Format: initials(shopName) + initials(ownerName) + sequence (00001)
export const generateShopId = (shopName, ownerName, sequence = 1) => {
  return getInitials(shopName) + getInitials(ownerName) + String(sequence).padStart(5, "0");
};
