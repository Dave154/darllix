// import { create } from 'zustand'
// import { createStorefrontSlice } from './storefrontSlice'
// // import { createAuthSlice } from './authSlice'

// export const useStore = create((set, get) => ({
//   ...createStorefrontSlice(set, get),
// //   ...createAuthSlice(set, get),
// }))
import { create } from "zustand"
import { createStorefrontSlice } from "./storefrontSlice"

export const useStore = create(createStorefrontSlice)
