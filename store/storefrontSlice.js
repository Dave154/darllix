// store/storefrontSlice.js
export const createStorefrontSlice = (set, get) => ({
  owner_id : '',

  setId:(id) => {
    set((state) => ({
      owner_id: id
    }));
  },
  cart: [],

  addToCart: (product) => {
    set((state) => {
      const maxQty = product.available;
      const existing = state.cart.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= maxQty) return state;
        return {
          cart: state.cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    });
  },

  incrementQuantity: (productId) => {
    set((state) => {
      const product = state.cart.find((item) => item.id === productId);
     
      if (!product) return state;

      const maxQty = product.available;
      
      if (product.quantity >= maxQty) return state;

      return {
        cart: state.cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    });
  },

  decrementQuantity: (productId) => {
    set((state) => {
      const item = state.cart.find((p) => p.id === productId);
      if (!item) return state;

      if (item.quantity <= 1) {
        return { cart: state.cart.filter((p) => p.id !== productId) };
      }

      return {
        cart: state.cart.map((p) =>
          p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
        ),
      };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    }));
  },

  cartCount: () =>
    get().cart.reduce((total, item) => total + item.quantity, 0),

  cartTotal: () =>
    get().cart.reduce(
      (total, item) => total + (item.price || 0) * item.quantity,
      0
    ),

  checkoutData: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    country: "",
    zip: "",
    billingSame: true,
    newsletter: true,
    shipping: 0,
    paymentMethod: "darllix",
  },

  setCheckoutData: (data) =>
    set((state) => ({
      checkoutData: { ...state.checkoutData, ...data },
    })),

  clearCart: () => set({ cart: [] }),

  resetCheckout: () =>
    set({
      checkoutData: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        state: "",
        country: "",
        zip: "",
        billingSame: true,
        newsletter: true,
        shipping: "",
        paymentMethod: "darllix",
      },
    }),
});
