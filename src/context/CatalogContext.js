import React, { createContext, useContext, useState, useEffect } from "react";
import { useAppMode } from "./AppModeContext";
import { readJson, writeJson } from "../utils/scopedStorage";
import { useInventory } from "./InventoryContext";

const STORAGE_KEY = "nomad_catalog_v1";

const load = (mode, shopId) => {
  const data = readJson(STORAGE_KEY, mode, shopId);
  return data && typeof data === "object" ? data : { selected: {}, savedAt: null };
};

const save = (data, mode, shopId) => {
  writeJson(STORAGE_KEY, mode, shopId, data);
};

export const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const { mode, shopId } = useAppMode();
  const { items: inventoryItems } = useInventory();
  const loaded = load(mode, shopId);

  const [selected, setSelected] = useState(() => loaded.selected || {});
  const [savedAt, setSavedAt] = useState(() => loaded.savedAt || null);
  const [draft, setDraft] = useState(() => loaded.selected || {});

  useEffect(() => {
    const scoped = load(mode, shopId);
    const nextSelected = scoped.selected && typeof scoped.selected === "object" ? scoped.selected : {};
    setSelected(nextSelected);
    setDraft(nextSelected);
    setSavedAt(scoped.savedAt || null);
  }, [mode, shopId]);

  // Keep catalog selection consistent when products are deleted from inventory.
  useEffect(() => {
    const handler = (evt) => {
      const detail = evt?.detail || {};
      const productNumericId = detail.productNumericId;
      if (productNumericId === undefined || productNumericId === null) return;
      const key = String(productNumericId);

      setDraft((prev) => {
        if (!prev || !Object.prototype.hasOwnProperty.call(prev, key)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSelected((prev) => {
        if (!prev || !Object.prototype.hasOwnProperty.call(prev, key)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };
    window.addEventListener("nomad:productDeleted", handler);
    return () => window.removeEventListener("nomad:productDeleted", handler);
  }, []);

  // Cleanup catalog on load: remove productIds that no longer exist in inventory.
  useEffect(() => {
    const invIdSet = new Set((inventoryItems || []).map((p) => String(p.id)));
    const filterMap = (map) => {
      const next = {};
      if (!map) return next;
      Object.keys(map).forEach((k) => {
        if (invIdSet.has(String(k))) next[k] = map[k];
      });
      return next;
    };

    const cleanedSelected = filterMap(selected);
    const cleanedDraft = filterMap(draft);

    const selectedChanged = JSON.stringify(cleanedSelected) !== JSON.stringify(selected);
    const draftChanged = JSON.stringify(cleanedDraft) !== JSON.stringify(draft);
    if (selectedChanged) setSelected(cleanedSelected);
    if (draftChanged) setDraft(cleanedDraft);

    // Persist cleaned selection so stale IDs don't survive reload.
    if (selectedChanged) {
      try {
        writeJson(STORAGE_KEY, mode, shopId, { selected: cleanedSelected, savedAt });
      } catch {}
    }
  }, [inventoryItems]);

  const toggleItem = (productId) => {
    setDraft((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const selectAll = (productIds) => {
    setDraft((prev) => {
      const next = { ...prev };
      productIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  };

  const deselectAll = (productIds) => {
    setDraft((prev) => {
      const next = { ...prev };
      productIds.forEach((id) => {
        next[id] = false;
      });
      return next;
    });
  };

  const saveCatalog = () => {
    const now = new Date().toLocaleString("en-IN");
    setSelected({ ...draft });
    setSavedAt(now);
    save({ selected: draft, savedAt: now }, mode, shopId);
  };

  const isSelected = (productId) => !!draft[productId];
  const isSaved = (productId) => !!selected[productId];

  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(selected);

  const selectedIds = Object.keys(draft).filter((id) => draft[id]);
  const savedIds = Object.keys(selected).filter((id) => selected[id]);

  return (
    <CatalogContext.Provider
      value={{
        draft,
        selected,
        savedAt,
        toggleItem,
        selectAll,
        deselectAll,
        saveCatalog,
        isSelected,
        isSaved,
        hasUnsavedChanges,
        selectedIds,
        savedIds,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
