import { BILLING } from "../config/billingConfig";

// ── Calculate amount for a pack ──
export const calculateAmount = (slots, days) => {
  // ₹1 per slot per 28 days
  // Longer validity = discount
  const discounts = { 28: 0, 56: 0.05, 84: 0.1, 168: 0.15, 252: 0.2, 336: 0.25 };
  const units = days / 28;
  const discount = discounts[days] || 0;
  return Math.round(slots * units * (1 - discount));
};

// ── Central validation for slot purchase ──
export const isSlotPurchaseValid = (totalSlots, termsAccepted) => {
  const slots = Number(totalSlots) || 0;
  return slots >= 100 && !!termsAccepted;
};

// ── Get active packs (non-expired) ──
export const getActivePacks = (packs = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return packs.filter((p) => {
    if (!p.expiry) return false;
    const expiry = new Date(p.expiry);
    expiry.setHours(0, 0, 0, 0);
    return expiry >= today;
  });
};

// ── Get total active slots ──
export const getTotalActiveSlots = (packs = []) => {
  return getActivePacks(packs).reduce((sum, p) => sum + (p.slots || 0), 0);
};

// ── Get nearest expiry pack ──
export const getNearestExpiry = (packs = []) => {
  const active = getActivePacks(packs);
  if (!active.length) return null;
  return active.sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0];
};

// ── Get days remaining for a pack ──
export const getDaysRemaining = (expiry) => {
  if (!expiry) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry);
  exp.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((exp - today) / (1000 * 60 * 60 * 24)));
};

// ── Format expiry date ──
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// ── Generate UPI payment URL ──
export const generateUPIUrl = (amount, note) => {
  const { upiId, upiName } = BILLING;
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(note || "Nomad GroceryApp Slots")}`;
};

// ── Generate WhatsApp message URL ──
export const generateWhatsAppUrl = (slots, days, amount) => {
  const { whatsappNumber, whatsappMessage } = BILLING;
  const msg = whatsappMessage.replace("{slots}", slots).replace("{days}", days).replace("{amount}", amount);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
};

// ── Check if seller is new (no active packs) ──
export const isNewSeller = (packs = []) => {
  return getActivePacks(packs).length === 0;
};

// ── Get slot status ──
export const getSlotStatus = (productsAdded, totalSlots) => {
  const remaining = totalSlots - productsAdded;
  if (remaining <= 0) return "overLimit";
  if (remaining <= 10) return "nearLimit";
  return "ok";
};
