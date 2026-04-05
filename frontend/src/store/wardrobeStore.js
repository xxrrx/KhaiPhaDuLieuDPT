import { create } from 'zustand';

const useWardrobeStore = create((set) => ({
  items: [],
  outfits: [],
  totalItems: 0,

  setItems: (items) => set({ items }),
  setOutfits: (outfits) => set({ outfits }),
  setTotalItems: (n) => set({ totalItems: n }),
  addItem: (item) => set((s) => ({ items: [item, ...s.items], totalItems: s.totalItems + 1 })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id), totalItems: Math.max(0, s.totalItems - 1) })),
  addOutfit: (outfit) => set((s) => ({ outfits: [outfit, ...s.outfits] })),
  removeOutfit: (id) => set((s) => ({ outfits: s.outfits.filter((o) => o.id !== id) })),
}));

export default useWardrobeStore;
