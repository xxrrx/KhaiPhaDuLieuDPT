import { create } from 'zustand';

const useTryonStore = create((set) => ({
  history: [],
  currentResult: null,
  isProcessing: false,

  setHistory: (history) => set({ history }),
  setCurrentResult: (result) => set({ currentResult: result }),
  setProcessing: (val) => set({ isProcessing: val }),
  addToHistory: (item) => set((s) => ({ history: [item, ...s.history] })),
  removeFromHistory: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
}));

export default useTryonStore;
