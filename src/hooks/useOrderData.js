import { useState, useEffect } from "react";
import { MOCK_ORDERS } from "../utils/mockData";
import { useAppMode } from "../context/AppModeContext";
import { readJson, writeJson } from "../utils/scopedStorage";

const STORAGE_KEY = "nomad_orders_v1";

const clone = (arr) => (Array.isArray(arr) ? arr.map((x) => ({ ...x })) : arr);
const SAMPLE_ORDER_SIGNATURE = MOCK_ORDERS.map((o) => `${o.id}|${o.orderNumber}`).join("||");
const looksLikeDemoOrders = (arr) => {
  if (!Array.isArray(arr) || arr.length !== MOCK_ORDERS.length) return false;
  const signature = arr.map((o) => `${o?.id}|${o?.orderNumber}`).join("||");
  return signature === SAMPLE_ORDER_SIGNATURE;
};

export function useOrderData() {
  const { mode, shopId, isDemoMode } = useAppMode();
  const [orders, setOrders] = useState(() => {
    const stored = readJson(STORAGE_KEY, mode, shopId);
    if (Array.isArray(stored)) {
      if (!isDemoMode && looksLikeDemoOrders(stored)) return [];
      return stored;
    }
    return isDemoMode ? clone(MOCK_ORDERS) : [];
  });

  useEffect(() => {
    const stored = readJson(STORAGE_KEY, mode, shopId);
    if (Array.isArray(stored)) {
      if (!isDemoMode && looksLikeDemoOrders(stored)) {
        setOrders([]);
        return;
      }
      setOrders(stored);
      return;
    }
    setOrders(isDemoMode ? clone(MOCK_ORDERS) : []);
  }, [mode, shopId, isDemoMode]);

  useEffect(() => {
    if (!Array.isArray(orders)) return;
    writeJson(STORAGE_KEY, mode, shopId, orders);
  }, [orders, mode, shopId]);

  const getNextId = (list) => (list.length ? Math.max(...list.map((o) => o.id || 0)) + 1 : 1);

  const addOrder = (order) => {
    setOrders((prev) => [...prev, { ...order, id: getNextId(prev) }]);
  };

  const updateOrder = (order) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...order } : o)));
  };

  const deleteOrder = (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const getOrderById = (id) => orders.find((o) => o.id === id) || null;

  return { orders, addOrder, updateOrder, deleteOrder, getOrderById };
}
