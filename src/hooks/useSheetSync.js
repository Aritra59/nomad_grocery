const SHEET_STORAGE_KEY = "nomad_sheet_data_v1";

const SELLERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSllyZaqtHEyRuDY7XPz58pkOIpl82CgqRH-Tk80723EfHPRl0qh3T6nALf8GgrMwfuc4WMG7lYeEDl/pub?gid=0&single=true&output=csv";

// Write-back endpoint (deployed separately). This is required because browser-only
// CSV access cannot update Google Sheets.
// Expected: POST JSON { code: string, updates: Record<string, any>, meta?: object }
// Response: either { ok: true } or any JSON.
const SHEET_SLOT_UPDATE_API_URL = process.env.REACT_APP_SHEET_SLOT_UPDATE_URL || "";

const loadSheetData = () => {
  try {
    const raw = localStorage.getItem(SHEET_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveSheetData = (data) => {
  try {
    localStorage.setItem(SHEET_STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const parseCSVLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
};

const parseCSVToRows = (csv) => {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .map((line) => parseCSVLine(line));
  if (lines.length < 2) return [];
  const headers = lines[0].map((h) => String(h || "").toLowerCase().replace(/\s+/g, "_"));
  return lines
    .slice(1)
    .filter((r) => r.some((v) => String(v || "").trim()))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || "";
      });
      return obj;
    });
};

const getPackIdsFromSeller = (seller = {}) => {
  const ids = new Set();
  Object.keys(seller).forEach((key) => {
    const m = String(key || "").toLowerCase().match(/^pack(\d+)_(slots|availed|available|expiry)$/);
    if (m) ids.add(Number(m[1]));
  });
  return Array.from(ids)
    .filter((id) => Number.isFinite(id) && id > 0)
    .sort((a, b) => a - b);
};

// Get initials — same logic as catalogUtils
const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && words[0].length >= 2) return (words[0][0] + words[0][words[0].length - 1]).toUpperCase();
  return (words[0] || "N").toUpperCase();
};

const buildShopId = (shopName, ownerName, sequence) => {
  return getInitials(shopName) + getInitials(ownerName) + String(sequence || 1).padStart(5, "0");
};

export async function syncSheetByCode(code) {
  if (!code || !code.trim()) throw new Error("No code provided");
  const targetCode = code.trim().toUpperCase();

  const res = await fetch(SELLERS_CSV_URL);
  if (!res.ok) throw new Error("Could not reach Sellers sheet.");

  const csv = await res.text();
  if (!csv || csv.includes("<!DOCTYPE")) throw new Error("Sellers sheet not published.");

  const rows = parseCSVToRows(csv);
  // Some sheets use `code`, others may use `shop_id`. Check both.
  const sellerIndex = rows.findIndex((r) => {
    const v1 = (r.code || "").trim().toUpperCase();
    const v2 = (r.shop_id || "").trim().toUpperCase();
    return v1 === targetCode || v2 === targetCode;
  });

  if (sellerIndex === -1) throw new Error("Invalid code. Please check and try again.");

  const seller = rows[sellerIndex];
  const sequence = sellerIndex + 1;

  // Calculate active packs — parse pack1_slots, pack1_availed, pack1_expiry
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const packs = [];

  const packIds = getPackIdsFromSeller(seller);
  for (const i of packIds) {
    const slots = parseInt(seller[`pack${i}_slots`] || "0", 10);
    const availed = seller[`pack${i}_availed`] || seller[`pack${i}_available`] || "";
    const expiry = seller[`pack${i}_expiry`] || "";

    if (slots > 0 && expiry) {
      const expiryDate = new Date(expiry);
      expiryDate.setHours(0, 0, 0, 0);
      if (expiryDate >= today) {
        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        packs.push({
          id: i,
          slots,
          availed,
          expiry,
          daysLeft,
        });
      }
    }
  }

  const shopName = seller.shop_name || "My Shop";
  const ownerName = seller.owner_name || "";
  const shopId = seller.shop_id || buildShopId(shopName, ownerName, sequence);

  const sheetData = {
    shopName,
    ownerName,
    address: seller.address || "",
    mobile: seller.mobile || "",
    shopId,
    sheetCode: code.trim(),
    syncedAt: new Date().toLocaleString("en-IN"),
    packs,
  };

  saveSheetData(sheetData);
  return sheetData;
}

export function getStoredSheetData() {
  return loadSheetData();
}

export function clearSheetData() {
  try {
    localStorage.removeItem(SHEET_STORAGE_KEY);
  } catch {}
}

function toLocalISODate(d = new Date()) {
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysToLocalISODate(isoDate, days) {
  const [y, m, d] = isoDate.split("-").map((x) => Number(x));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + Number(days || 0));
  return toLocalISODate(date);
}

// Update pack slots back into your spreadsheet using your backend endpoint.
export async function updateSheetSlotsByCode({ code, packId, slots, days, transactionId, extraMeta }) {
  if (!SHEET_SLOT_UPDATE_API_URL) {
    throw new Error("Sheet write endpoint not configured. Set REACT_APP_SHEET_SLOT_UPDATE_URL.");
  }
  if (!code || !String(code).trim()) throw new Error("No shop code provided");

  const pid = Number(packId);
  if (!Number.isFinite(pid) || pid <= 0) throw new Error("Invalid packId.");

  const todayISO = toLocalISODate(new Date());
  const expiryISO = addDaysToLocalISODate(todayISO, days);

  const updates = {
    [`pack${pid}_slots`]: Number(slots) || 0,
    [`pack${pid}_availed`]: todayISO,
    [`pack${pid}_expiry`]: expiryISO,
  };

  const payload = {
    code: String(code).trim(),
    updates,
    meta: {
      transactionId: transactionId ? String(transactionId).trim() : "",
      requestedSlots: Number(slots) || 0,
      requestedDays: Number(days) || 0,
      requestedAt: new Date().toISOString(),
      ...extraMeta,
    },
  };

  const res = await fetch(SHEET_SLOT_UPDATE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Sheet update failed (${res.status}).`);
  }

  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}
