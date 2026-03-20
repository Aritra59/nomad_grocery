export function findProductInInventory(inventoryItems, ref) {
  if (!Array.isArray(inventoryItems) || !ref) return null;

  const productId = ref.productId;
  const productNumericId = ref.productNumericId ?? ref.id;
  const name = ref.productName || ref.name;

  if (productId !== undefined && productId !== null) {
    const byId = inventoryItems.find((p) => p.productId === productId);
    if (byId) return byId;
  }

  if (productNumericId !== undefined && productNumericId !== null) {
    const byNumericId = inventoryItems.find((p) => p.id === productNumericId);
    if (byNumericId) return byNumericId;
  }

  if (typeof name === "string" && name.trim()) {
    const needle = name.toLowerCase();
    return inventoryItems.find((p) => typeof p.name === "string" && p.name.toLowerCase() === needle) || null;
  }

  return null;
}

