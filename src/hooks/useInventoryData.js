import { useEffect, useState, useMemo } from "react";
import { MASTER_PRODUCTS } from "../utils/mockData";
import { MOCK_INVENTORY } from "../utils/mockData";

const STORAGE_KEY = "nomad_inventory_products_v1";
const CATALOG_KEY = "nomad_catalog_v1";
const PROCUREMENT_KEY = "nomad_procurement_v1";

const loadFromStorage = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

// Remove deleted product from Catalog localStorage
const removeFromCatalog = (id) => {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const strId = String(id);
    if (data.selected) delete data.selected[strId];
    // Also clean draft by saving same selected
    localStorage.setItem(CATALOG_KEY, JSON.stringify(data));
  } catch {}
};

// Remove deleted product from Procurement localStorage by product name
const removeFromProcurement = (productName) => {
  try {
    const raw = localStorage.getItem(PROCUREMENT_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;
    const filtered = data.filter((i) => i.productName?.toLowerCase() !== productName?.toLowerCase());
    localStorage.setItem(PROCUREMENT_KEY, JSON.stringify(filtered));
  } catch {}
};

let nextId = 1;

export function useInventoryData() {
  const [items, setItems] = useState(() => {
    const existing = loadFromStorage();
    if (existing.length > 0) {
      nextId = Math.max(...existing.map((i) => (typeof i.id === "number" ? i.id : 0))) + 1;
      return existing;
    }

    const sample = MOCK_INVENTORY.map((p) => ({ ...p }));
    nextId = Math.max(...sample.map((p) => p.id)) + 1;
    saveToStorage(sample);
    return sample;
  });

  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  const combinedOptions = useMemo(() => {
    const all = [...MASTER_PRODUCTS, ...items];
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
    return {
      names: uniq(all.map((i) => i.name)),
      brands: uniq(all.map((i) => i.brand)),
      categories: uniq(all.map((i) => i.category)),
      subCategories: uniq(all.map((i) => i.subCategory)),
      variants1: uniq(all.map((i) => i.variant1)),
      variants2: uniq(all.map((i) => i.variant2)),
    };
  }, [items]);

  const upsertProduct = (product) => {
    setItems((prev) => {
      if (product.id) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      const newItem = { ...product, id: nextId++ };
      return [...prev, newItem];
    });
  };

  const deleteProduct = (id) => {
    // Find product name before deleting (needed for procurement cleanup)
    const product = items.find((p) => p.id === id);
    if (product) {
      removeFromCatalog(id);
      removeFromProcurement(product.name);
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = (id, delta) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, currStock: Math.max(0, (p.currStock || 0) + delta) } : p)));
  };

  const getProductById = (id) => items.find((p) => p.id === id) || null;

  return {
    items,
    upsertProduct,
    deleteProduct,
    adjustStock,
    getProductById,
    combinedOptions,
  };
}
