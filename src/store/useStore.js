import { create } from 'zustand';
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '../lib/constants';

const MAX_RECENTLY_VIEWED = 10;
const CART_STORAGE_KEY = 'ls_cart';

// Load recently viewed from localStorage
const loadRecentlyViewed = () => {
  try {
    return JSON.parse(localStorage.getItem('ls_recently_viewed') || '[]');
  } catch { return []; }
};

// Load cart from localStorage
const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
  } catch { return []; }
};

const useStore = create((set, get) => ({
  // ── Cart ──
  cart: loadCart(),
  cartError: null,
  setCartError: (error) => set({ cartError: error }),
  clearCartError: () => set({ cartError: null }),

  // Validate stock before adding to cart
  validateStock: (product, quantity = 1) => {
    const stockCount = product.stockCount ?? product.stock_count ?? 0;
    const inStock = product.inStock ?? stockCount > 0;

    if (!inStock || stockCount <= 0) {
      return { valid: false, error: `"${product.name}" is sold out` };
    }

    const cart = get().cart;
    const existing = cart.find((item) => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const totalQty = currentQty + quantity;

    if (totalQty > stockCount) {
      return {
        valid: false,
        error: `Only ${stockCount} units available for "${product.name}". You have ${currentQty} in cart.`
      };
    }

    return { valid: true, availableStock: stockCount };
  },

  addToCart: (product, quantity = 1) => {
    const validation = get().validateStock(product, quantity);

    if (!validation.valid) {
      set({ cartError: validation.error });
      return { success: false, error: validation.error };
    }

    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      let newCart;
      if (existing) {
        newCart = state.cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...state.cart, { ...product, quantity }];
      }
      // Persist to localStorage
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      return { cart: newCart, cartError: null };
    });

    return { success: true };
  },
  removeFromCart: (productId) =>
    set((state) => {
      const newCart = state.cart.filter((item) => item.id !== productId);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      return { cart: newCart };
    }),
  updateQuantity: (productId, quantity) =>
    set((state) => {
      const newCart = state.cart.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      );
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      return { cart: newCart };
    }),
  clearCart: () => {
    localStorage.removeItem(CART_STORAGE_KEY);
    set({ cart: [] });
  },
  getCartTotal: () => {
    const cart = get().cart;
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
  getShipping: () => {
    const total = get().getCartTotal();
    return total >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  },
  getOrderTotal: () => {
    return get().getCartTotal() + get().getShipping();
  },

  // ── Wishlist ──
  wishlist: [],
  toggleWishlist: (product) =>
    set((state) => {
      const exists = state.wishlist.find((item) => item.id === product.id);
      if (exists) {
        return { wishlist: state.wishlist.filter((item) => item.id !== product.id) };
      }
      return { wishlist: [...state.wishlist, product] };
    }),
  isWishlisted: (productId) => {
    return get().wishlist.some((item) => item.id === productId);
  },

  // ── Recently Viewed ──
  recentlyViewed: loadRecentlyViewed(),
  addToRecentlyViewed: (product) =>
    set((state) => {
      const filtered = state.recentlyViewed.filter((p) => p.id !== product.id);
      const updated = [{ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category }, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      localStorage.setItem('ls_recently_viewed', JSON.stringify(updated));
      return { recentlyViewed: updated };
    }),

  // ── Cart Drawer ──
  cartDrawerOpen: false,
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),
  toggleCartDrawer: () => set((state) => ({ cartDrawerOpen: !state.cartDrawerOpen })),

  // ── Auth ──
  user: null,
  setUser: (user) => set({ user }),

  // ── UI ──
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));

export default useStore;
