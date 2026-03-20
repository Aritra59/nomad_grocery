import { useState, useEffect } from "react";
import { useAppMode } from "../context/AppModeContext";
import { readJson, writeJson } from "../utils/scopedStorage";
import { useInventory } from "../context/InventoryContext";
import { findProductInInventory } from "../utils/inventoryLookup";

const STORAGE_KEY = "nomad_procurement_v1";
const SAVED_ORDERS_KEY = "nomad_procurement_saved_v1";

const getNextId = (list) => (list.length ? Math.max(...list.map((i) => i.id || 0)) + 1 : 1);

export function useProcurementData() {
  const { mode, shopId } = useAppMode();
  const { items: inventoryItems } = useInventory();
  const [items, setItems] = useState(() => {
    const stored = readJson(STORAGE_KEY, mode, shopId);
    return Array.isArray(stored) ? stored : [];
  });
  const [savedOrders, setSavedOrders] = useState(() => {
    const stored = readJson(SAVED_ORDERS_KEY, mode, shopId);
    return Array.isArray(stored) ? stored : [];
  });

  // Centralized cleanup: inventory deletes should remove related procurement items/orders.
  useEffect(() => {
    const handler = (evt) => {
      const detail = evt?.detail || {};
      const deletedName = detail.name ? String(detail.name).toLowerCase() : null;
      const deletedProductId = detail.productId || null;

      if (!deletedName && !deletedProductId) return;

      setItems((prev) =>
        prev.filter((i) => {
          // Prefer ID match when present
          if (deletedProductId && i.productId) {
            return i.productId !== deletedProductId;
          }
          // Fallback to productName match for legacy data
          if (deletedName && i.productName) {
            return String(i.productName).toLowerCase() !== deletedName;
          }
          return true;
        })
      );

      setSavedOrders((prev) =>
        prev
          .map((o) => {
            const nextItems = (o.items || []).filter((i) => {
              if (deletedProductId && i.productId) {
                return i.productId !== deletedProductId;
              }
              if (deletedName && i.productName) {
                return String(i.productName).toLowerCase() !== deletedName;
              }
              return true;
            });
            return { ...o, items: nextItems };
          })
          .filter((o) => (o.items || []).length > 0)
      );
    };

    window.addEventListener("nomad:productDeleted", handler);
    return () => window.removeEventListener("nomad:productDeleted", handler);
  }, []);

  useEffect(() => {
    if (!Array.isArray(items)) return;
    writeJson(STORAGE_KEY, mode, shopId, items);
  }, [items, mode, shopId]);
  useEffect(() => {
    if (!Array.isArray(savedOrders)) return;
    writeJson(SAVED_ORDERS_KEY, mode, shopId, savedOrders);
  }, [savedOrders, mode, shopId]);

  // Cleanup procurement on load: remove items that no longer match any inventory product.
  useEffect(() => {
    // Only run cleanup when inventory items are available (including empty array)
    const cleanedItems = items.filter((pi) => {
      const product = findProductInInventory(inventoryItems, {
        productId: pi.productId,
        productNumericId: pi.productNumericId,
        productName: pi.productName,
      });
      return !!product;
    });

    const cleanedSavedOrders = savedOrders
      .map((o) => {
        const nextItems = (o.items || []).filter((pi) => {
          const product = findProductInInventory(inventoryItems, {
            productId: pi.productId,
            productNumericId: pi.productNumericId,
            productName: pi.productName,
          });
          return !!product;
        });
        return { ...o, items: nextItems };
      })
      .filter((o) => (o.items || []).length > 0);

    const changed = cleanedItems.length !== items.length || cleanedSavedOrders.length !== savedOrders.length;
    if (changed) {
      setItems(cleanedItems);
      setSavedOrders(cleanedSavedOrders);
    }
  }, [inventoryItems]);

  // ── Procurement items ──
  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productName?.toLowerCase() === item.productName?.toLowerCase());
      if (existing) {
        return prev.map((i) => (i.id === existing.id ? { ...i, qty: (i.qty || 0) + (item.qty || 1), note: item.note || i.note } : i));
      }
      return [...prev, { ...item, id: getNextId(prev), status: "pending", addedToOrder: false, addedDate: new Date().toISOString().slice(0, 10) }];
    });
  };

  const updateItem = (item) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...item } : i)));
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const markOrdered = (id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "ordered", orderedDate: new Date().toISOString().slice(0, 10) } : i)));
  };

  const markReceived = (id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "received", receivedDate: new Date().toISOString().slice(0, 10) } : i)));
  };

  const addFromInventory = (product) => {
    addItem({
      productName: product.name,
      brand: product.brand,
      packingQty: product.packingQty,
      qty: 1,
      supplier: product.suppliers?.[0] || "",
      note: "Low stock reorder",
    });
  };

  // ── Mark item as added to order ──
  const markAddedToOrder = (id, orderNum) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, addedToOrder: true, orderNum } : i)));
  };

  // ── Remove item from order (revert) ──
  const removeFromOrder = (id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, addedToOrder: false, orderNum: null } : i)));
  };

  // ── Saved Orders ──
  const saveOrder = (order) => {
    setSavedOrders((prev) => {
      const existing = prev.find((o) => o.orderNum === order.orderNum);
      if (existing) {
        // Update existing — same order number, new date
        return prev.map((o) => (o.orderNum === order.orderNum ? { ...o, ...order, date: new Date().toISOString().slice(0, 10) } : o));
      }
      return [...prev, { ...order, id: getNextId(prev), date: new Date().toISOString().slice(0, 10) }];
    });
  };

  const deleteSavedOrder = (orderNum) => {
    // Revert all items in this order back to "Add to Order"
    setItems((prev) => prev.map((i) => (i.orderNum === orderNum ? { ...i, addedToOrder: false, orderNum: null } : i)));
    setSavedOrders((prev) => prev.filter((o) => o.orderNum !== orderNum));
  };

  const removeItemFromSavedOrder = (orderNum, productName) => {
    setSavedOrders((prev) =>
      prev.map((o) => {
        if (o.orderNum !== orderNum) return o;
        return { ...o, items: o.items.filter((i) => i.productName !== productName) };
      })
    );
    // Revert item state
    setItems((prev) => prev.map((i) => (i.productName === productName && i.orderNum === orderNum ? { ...i, addedToOrder: false, orderNum: null } : i)));
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const orderedCount = items.filter((i) => i.status === "ordered").length;
  const addedToOrderCount = items.filter((i) => i.addedToOrder).length;

  return {
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
  };
}
