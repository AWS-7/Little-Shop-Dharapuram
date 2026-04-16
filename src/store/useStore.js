import { create } from 'zustand';
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '../lib/constants';

const MAX_RECENTLY_VIEWED = 10;

// Load recently viewed from localStorage
const loadRecentlyViewed = () => {
  try {
    return JSON.parse(localStorage.getItem('ls_recently_viewed') || '[]');
  } catch { return []; }
};

const useStore = create((set, get) => ({
  // ── Cart ──
  cart: [],
  addToCart: (product, quantity = 1) =>
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity }] };
    }),
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      ),
    })),
  clearCart: () => set({ cart: [] }),
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
