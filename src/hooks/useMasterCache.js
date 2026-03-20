const CACHE_KEY = "nomad_master_products_v1";
const CACHE_TS_KEY = "nomad_master_products_ts_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const MASTER_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRNrii7zl86ym2aAIHwXVQLPuikFQ0iyfC69bp6xOc0OygBSKhMGfHxNxyMfptebI6pipbdZkbdKjTs/pub?gid=0&single=true&output=csv";

const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const saveCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {}
};

const isCacheStale = () => {
  try {
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (!ts) return true;
    return Date.now() - parseInt(ts, 10) > CACHE_TTL_MS;
  } catch {
    return true;
  }
};

const parseCSV = (csv) => {
  const lines = csv
    .trim()
    .split("\n")
    .map((l) => l.split(",").map((v) => v.replace(/^"|"$/g, "").trim()));
  if (lines.length < 2) return [];
  const headers = lines[0].map((h) => h.toLowerCase().replace(/\s+/g, ""));
  return lines
    .slice(1)
    .filter((row) => row.some((v) => v))
    .map((row, i) => {
      const obj = { id: "master-" + i };
      headers.forEach((h, idx) => {
        obj[h] = row[idx] || "";
      });
      return {
        id: obj.id,
        name: obj.name || "",
        brand: obj.brand || "",
        packingQty: obj.packingqty || obj.packing_qty || "",
        mrp: parseFloat(obj.mrp) || 0,
        category: obj.category || "",
        subCategory: obj.subcategory || obj.sub_category || "",
        variant1: obj.variant1 || "",
        variant2: obj.variant2 || "",
      };
    })
    .filter((p) => p.name);
};

export async function syncMasterCache() {
  if (!isCacheStale()) {
    const cached = loadCache();
    if (cached && cached.length > 0) return cached;
  }
  try {
    const res = await fetch(MASTER_CSV_URL);
    if (!res.ok) throw new Error("Fetch failed");
    const csv = await res.text();
    if (!csv || csv.includes("<!DOCTYPE")) throw new Error("Not published");
    const products = parseCSV(csv);
    if (products.length > 0) {
      saveCache(products);
      return products;
    }
  } catch {}
  return loadCache() || [];
}

export function getMasterProducts() {
  return loadCache() || [];
}

export function clearMasterCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TS_KEY);
  } catch {}
}
