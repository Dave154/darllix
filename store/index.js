// // store/index.js
// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// import { createStorefrontSlice } from "./storefrontSlice";
// import { createDashboardSlice } from "./dashboardSlice";

// export const useStore = create((set, get) => ({
//   // Persisted slice
//   ...persist(createStorefrontSlice, {
//     name: "storefront-storage",
//     getStorage: () => localStorage,
//     partialize: (state) => ({
//       cart: state.cart,
//       checkoutData: state.checkoutData,
//     }),
//   })(set, get),

//   // Non-persisted slice
//   ...createDashboardSlice(set, get),
// }));

// store/index.js
// store/index.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createStorefrontSlice } from "./storefrontSlice";
import { createDashboardSlice } from "./dashboardSlice";

export const useStore = create(
  persist(
    (set, get) => ({
      ...createStorefrontSlice(set, get),
      ...createDashboardSlice(set, get),
    }),
    {
      name: "storefront-storage",
      partialize: (state) => ({
        cart: state.cart,
        checkoutData: state.checkoutData,
      }),
    }
  )
);
