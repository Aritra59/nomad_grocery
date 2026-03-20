import { useState, useEffect, useMemo } from "react";
import { MOCK_CUSTOMERS } from "../utils/mockData";
import { useAppMode } from "../context/AppModeContext";
import { readJson, writeJson } from "../utils/scopedStorage";

const STORAGE_KEY = "nomad_customers_v1";
const clone = (arr) => (Array.isArray(arr) ? arr.map((x) => ({ ...x })) : arr);

export function useCustomersData() {
  const { mode, shopId, isDemoMode } = useAppMode();
  const [customers, setCustomers] = useState(() => {
    const stored = readJson(STORAGE_KEY, mode, shopId);
    if (Array.isArray(stored)) return stored;
    return isDemoMode ? clone(MOCK_CUSTOMERS) : [];
  });

  useEffect(() => {
    if (!Array.isArray(customers)) return;
    writeJson(STORAGE_KEY, mode, shopId, customers);
  }, [customers, mode, shopId]);

  const getNextId = (list) => (list.length ? Math.max(...list.map((c) => c.id || 0)) + 1 : 1);

  const addCustomer = (customer) => {
    setCustomers((prev) => [
      ...prev,
      {
        ...customer,
        id: getNextId(prev),
        totalOrders: 0,
        totalCredit: 0,
        joinDate: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const updateCustomer = (customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, ...customer } : c)));
  };

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const getCustomerById = (id) => customers.find((c) => c.id === id) || null;

  const getCustomerByMobile = (mobile) => customers.find((c) => c.mobile === mobile) || null;

  const upsertFromOrder = (order) => {
    setCustomers((prev) => {
      const existing = prev.find((c) => c.mobile === order.mobile);
      if (existing) {
        return prev.map((c) =>
          c.mobile === order.mobile
            ? {
                ...c,
                totalOrders: (c.totalOrders || 0) + 1,
                totalCredit: (c.totalCredit || 0) + (order.credit || 0),
                name: order.customerName || c.name,
              }
            : c
        );
      }
      return [
        ...prev,
        {
          id: getNextId(prev),
          name: order.customerName,
          mobile: order.mobile,
          address: order.address || "",
          totalCredit: order.credit || 0,
          totalOrders: 1,
          joinDate: new Date().toISOString().slice(0, 10),
        },
      ];
    });
  };

  const totalCreditAllCustomers = useMemo(() => customers.reduce((sum, c) => sum + (c.totalCredit || 0), 0), [customers]);

  return {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomerByMobile,
    upsertFromOrder,
    totalCreditAllCustomers,
  };
}
