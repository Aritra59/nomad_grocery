// ── Order Number Generator ──
// Format: ShopCode-BuyerCode-Sequence
// Example: RK-SJ-001
const getInitials = (name = "") => {
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const generateOrderNumber = (shopName, customerName, sequence) => {
  const shopCode = getInitials(shopName || "SH");
  const buyerCode = getInitials(customerName || "GU");
  const seq = String(sequence || 1).padStart(3, "0");
  return `${shopCode}-${buyerCode}-${seq}`;
};

// ── Get sequence for customer ──
export const getCustomerSequence = (orders, customerMobile) => {
  return orders.filter((o) => o.mobile === customerMobile).length + 1;
};

// ── Order Status Colors ──
export const ORDER_STATUS_COLORS = {
  pending: { bg: "rgba(251,191,36,0.15)", color: "#fde68a", border: "#f59e0b" },
  completed: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "#10b981" },
  cancelled: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "#ef4444" },
};

// ── Payment Status Colors ──
export const PAYMENT_STATUS_COLORS = {
  paid: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "#10b981" },
  credit: { bg: "rgba(251,191,36,0.15)", color: "#fde68a", border: "#f59e0b" },
  unpaid: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "#475569" },
};

// ── Filter Orders ──
export const filterOrders = (orders, { search, period, status, payment }) => {
  let result = [...orders];

  if (search) {
    const q = search.trim().toLowerCase();
    result = result.filter((o) => [o.customerName, o.mobile, o.id?.toString()].join(" ").toLowerCase().includes(q));
  }

  if (period && period !== "all") {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    result = result.filter((o) => {
      const d = new Date(o.date);
      if (period === "today") {
        return d.toDateString() === now.toDateString();
      }
      if (period === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (period === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (period === "year") {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  if (status && status !== "all") {
    result = result.filter((o) => o.status === status);
  }

  if (payment && payment !== "all") {
    result = result.filter((o) => o.paymentStatus === payment);
  }

  return result;
};

// ── Filter by custom date range ──
export const filterByDateRange = (orders, from, to) => {
  if (!from && !to) return orders;
  return orders.filter((o) => {
    const d = new Date(o.date);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to)) return false;
    return true;
  });
};

// ── Sort Orders ──
export const sortOrders = (list, sortBy, sortDir) => {
  return [...list].sort((a, b) => {
    let valA, valB;
    switch (sortBy) {
      case "recent":
        valA = new Date(a.date);
        valB = new Date(b.date);
        break;
      case "amount":
        valA = a.total || 0;
        valB = b.total || 0;
        break;
      case "items":
        valA = a.items?.length || 0;
        valB = b.items?.length || 0;
        break;
      default:
        valA = new Date(a.date);
        valB = new Date(b.date);
    }
    if (valA instanceof Date) {
      return sortDir === "asc" ? valA - valB : valB - valA;
    }
    return sortDir === "asc" ? valA - valB : valB - valA;
  });
};

// ── Order totals ──
export const getOrderTotals = (orders) => {
  return {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    totalCredit: orders.reduce((sum, o) => sum + (o.credit || 0), 0),
    pendingCount: orders.filter((o) => o.status === "pending").length,
    completedCount: orders.filter((o) => o.status === "completed").length,
    cancelledCount: orders.filter((o) => o.status === "cancelled").length,
  };
};
