export const BILLING = {
  upiId: "ar353@ptyes",
  upiName: "Nomad GroceryApp",
  whatsappNumber: "919625737715",
  whatsappMessage:
    "Hi, I have paid for Nomad GroceryApp slots.\n\nSlots: {slots}\nValidity: {days} days\nAmount: ₹{amount}\n\nMy Details:\nName:\nShop Name:\nMobile:\nUPI Transaction ID:\n\nPlease activate my account.",

  validityOptions: [
    { days: 28, label: "28 days  (1 month)" },
    { days: 56, label: "56 days  (2 months)" },
    { days: 84, label: "84 days  (3 months)" },
    { days: 168, label: "168 days (6 months)" },
    { days: 252, label: "252 days (9 months)" },
    { days: 336, label: "336 days (12 months)" },
  ],

  // First time starter pack — minimum 100 slots
  starterPack: { slots: 100, days: 28, price: 299, label: "100 Slots" },

  // Add-on packs — for existing + new sellers
  addOnPacks: [
    { id: 1, slots: 50, price: 149, label: "50 Slots", newUserDisabled: true },
    { id: 2, slots: 100, price: 299, label: "100 Slots", newUserDisabled: false },
    { id: 3, slots: 500, price: 999, label: "500 Slots", newUserDisabled: false },
    { id: 4, slots: 1000, price: 1799, label: "1000 Slots", newUserDisabled: false },
  ],

  // Free trial options — activated by you manually
  trialOptions: [
    { id: 1, slots: 100, days: 15, price: 0, label: "15-day Trial" },
    { id: 2, slots: 100, days: 28, price: 0, label: "28-day Trial" },
  ],

  currency: "₹",
  slotsUnit: "products",
};
