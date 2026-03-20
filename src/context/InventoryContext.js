import React, { createContext, useContext, useState, useEffect } from "react";
import { MASTER_PRODUCTS, MOCK_INVENTORY } from "../utils/mockData";
import { useAppMode } from "./AppModeContext";
import { readJson, writeJson } from "../utils/scopedStorage";

const STORAGE_KEY = "nomad_inventory_v1";

const SAMPLE_ITEMS = MOCK_INVENTORY;
const cloneSample = (arr) => (Array.isArray(arr) ? arr.map((i) => ({ ...i })) : arr);

export const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { mode, shopId, isDemoMode } = useAppMode();
  const [items, setItems] = useState(() => {
    const stored = readJson(STORAGE_KEY, mode, shopId);
    if (stored !== null) return stored;
    return isDemoMode ? cloneSample(SAMPLE_ITEMS) : [];
  });

  useEffect(() => {
    // Always persist into the scoped key; demo keys are cleared on reset.
    if (!Array.isArray(items)) return;
    try {
      writeJson(STORAGE_KEY, mode, shopId, items);
    } catch {}
  }, [items, mode, shopId]);

  const getNextId = (list) => {
    if (!list.length) return 1;
    return Math.max(...list.map((i) => i.id || 0)) + 1;
  };

  const addProduct = (product) => {
    setItems((prev) => {
      const newItem = { ...product, id: getNextId(prev) };
      return [...prev, newItem];
    });
  };

  const updateProduct = (product) => {
    setItems((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...product } : p)));
  };

  const deleteProduct = (id) => {
    const toDelete = items.find((p) => p.id === id);
    setItems((prev) => prev.filter((p) => p.id !== id));

    // Inform other in-memory domains to clean up immediately.
    // (Inventory ↔ Procurement ↔ Catalog consistency)
    try {
      window.dispatchEvent(
        new CustomEvent("nomad:productDeleted", {
          detail: {
            productNumericId: id,
            productId: toDelete?.productId || null,
            name: toDelete?.name || null,
          },
        })
      );
    } catch {
      // ignore
    }

    // Also clean persisted storage for consistency even when screens aren't mounted.
    try {
      const deletedName = toDelete?.name ? String(toDelete.name).toLowerCase() : null;
      const deletedProductId = toDelete?.productId || null;

      const PROCUREMENT_KEY = "nomad_procurement_v1";
      const SAVED_ORDERS_KEY = "nomad_procurement_saved_v1";
      const CATALOG_KEY = "nomad_catalog_v1";

      // Procurement items
      const procStored = readJson(PROCUREMENT_KEY, mode, shopId);
      if (Array.isArray(procStored)) {
        const cleaned = procStored.filter((item) => {
          if (deletedProductId && item.productId) {
            return item.productId !== deletedProductId;
          }
          if (deletedName && item.productName) {
            return String(item.productName).toLowerCase() !== deletedName;
          }
          return true;
        });
        writeJson(PROCUREMENT_KEY, mode, shopId, cleaned);
      }

      // Saved procurement orders
      const savedStored = readJson(SAVED_ORDERS_KEY, mode, shopId);
      if (Array.isArray(savedStored)) {
        const cleanedSaved = savedStored
          .map((o) => {
            const nextItems = (o.items || []).filter((item) => {
              if (deletedProductId && item.productId) {
                return item.productId !== deletedProductId;
              }
              if (deletedName && item.productName) {
                return String(item.productName).toLowerCase() !== deletedName;
              }
              return true;
            });
            return { ...o, items: nextItems };
          })
          .filter((o) => (o.items || []).length > 0);
        writeJson(SAVED_ORDERS_KEY, mode, shopId, cleanedSaved);
      }

      // Catalog selection (stored selected map)
      const catalogStored = readJson(CATALOG_KEY, mode, shopId);
      if (catalogStored && typeof catalogStored === "object" && catalogStored.selected) {
        const selectedMap = { ...catalogStored.selected };
        delete selectedMap[String(id)];
        writeJson(CATALOG_KEY, mode, shopId, { ...catalogStored, selected: selectedMap });
      }
    } catch {
      // ignore storage cleanup failures
    }
  };

  const adjustStock = (id, delta) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, currStock: Math.max(0, (p.currStock || 0) + delta) } : p)));
  };

  const getProductById = (id) => items.find((p) => p.id === id) || null;

  const allForSuggestions = [...MASTER_PRODUCTS, ...items];
  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));

  const suggestions = {
    names: uniq(allForSuggestions.map((i) => i.name)),
    brands: uniq(allForSuggestions.map((i) => i.brand)),
    categories: uniq(allForSuggestions.map((i) => i.category)),
    subCategories: uniq(allForSuggestions.map((i) => i.subCategory)),
    variants1: uniq(allForSuggestions.map((i) => i.variant1)),
    variants2: uniq(allForSuggestions.map((i) => i.variant2)),
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        getProductById,
        suggestions,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
