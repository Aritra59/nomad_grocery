const DEMO_PREFIX = "demo_";
const LIVE_PREFIX = "live_";

// Domain keys we want to isolate by mode/tenant
const DEMO_DOMAIN_BASE_KEYS = [
  "nomad_inventory_v1",
  "nomad_orders_v1",
  "nomad_customers_v1",
  "nomad_procurement_v1",
  "nomad_procurement_saved_v1",
  "nomad_catalog_v1",
];

/**
 * Compute scoped key:
 * - demo => demo_<baseKey>
 * - live => live_<shopId>_<baseKey>
 */
export function getScopedKey(baseKey, mode, shopId) {
  if (mode === "demo" || mode === "explore") return `${DEMO_PREFIX}${baseKey}`;
  if (mode === "live") {
    const sid = shopId || "unknown_shop";
    return `${LIVE_PREFIX}${sid}_${baseKey}`;
  }
  return `${DEMO_PREFIX}${baseKey}`;
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Read JSON from the scoped key, with one-time migration from legacy baseKey.
 * Returns parsed value (or null when missing/invalid).
 */
export function readJson(baseKey, mode, shopId) {
  const scopedKey = getScopedKey(baseKey, mode, shopId);

  // 1) Scoped read
  const scopedRaw = localStorage.getItem(scopedKey);
  if (scopedRaw) {
    const parsed = safeParseJson(scopedRaw);
    return parsed;
  }

  // 2) One-time migrate legacy unscoped key => scoped key
  const legacyRaw = localStorage.getItem(baseKey);
  if (legacyRaw) {
    try {
      localStorage.setItem(scopedKey, legacyRaw);
      localStorage.removeItem(baseKey);
    } catch {
      // ignore migration failure; still return parsed legacy
    }
    return safeParseJson(legacyRaw);
  }

  return null;
}

/**
 * Write JSON to scoped key only.
 */
export function writeJson(baseKey, mode, shopId, value) {
  const scopedKey = getScopedKey(baseKey, mode, shopId);
  localStorage.setItem(scopedKey, JSON.stringify(value));
}

/**
 * Clear all demo_* domain keys to ensure demo starts fresh.
 */
export function clearDemoDomainData() {
  try {
    for (const baseKey of DEMO_DOMAIN_BASE_KEYS) {
      localStorage.removeItem(`${DEMO_PREFIX}${baseKey}`);
    }
  } catch {
    // ignore
  }
}

