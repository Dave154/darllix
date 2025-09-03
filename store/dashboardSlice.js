export const createDashboardSlice = (set, get) => ({
  hasStore: false,
  store: null,
  sidebarOpen: true,
  loading: false,
  error: null,

  setHasStore: (has) => set({ hasStore: has }),
  setStore: (store) =>
    set({
      store,
      hasStore: !!store,
    }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  resetDashboard: () =>
    set({
      hasStore: false,
      store: null,
      sidebarOpen: true,
      loading: false,
      error: null,
    }),
});
