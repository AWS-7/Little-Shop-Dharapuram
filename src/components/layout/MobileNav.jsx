import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, User, Store, Heart } from 'lucide-react';
import useStore from '../../store/useStore';

export default function MobileNav() {
  const location = useLocation();
  const { cart, wishlist, openCartDrawer } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Layout: Home | Shop | [Cart] | Wishlist | Profile
  const leftItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Store, label: 'Shop', path: '/shop' },
  ];

  const rightItems = [
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: User, label: 'Profile', path: '/account' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Bottom Nav Bar — Glassmorphism */}
      <div className="bg-white/85 backdrop-blur-md border-t border-gray-100 rounded-t-2xl shadow-[0_-2px_15px_rgba(0,0,0,0.04)]">
        <div
          className="flex items-center justify-around py-2"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
        >
          {/* Left items: Home, Shop */}
          {leftItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={label}
                to={path}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                  isActive ? 'text-purple-primary' : 'text-gray-400'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="font-inter text-[10px] tracking-wide">{label}</span>
              </Link>
            );
          })}

          {/* Center: Prominent Cart - Opens Drawer */}
          <button
            onClick={openCartDrawer}
            className="relative flex flex-col items-center justify-center -mt-4"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors bg-white text-purple-primary border-2 border-purple-primary shadow-gray-200"
            >
              <ShoppingBag size={24} strokeWidth={2} />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-0 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span className="font-inter text-[10px] tracking-wide mt-0.5 text-gray-400">
              Cart
            </span>
          </button>

          {/* Right items: Wishlist, Profile */}
          {rightItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            const isWishlist = label === 'Wishlist';
            return (
              <Link
                key={label}
                to={path}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors relative ${
                  isActive ? 'text-purple-primary' : 'text-gray-400'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {isWishlist && wishlistCount > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white">
                    {wishlistCount}
                  </span>
                )}
                <span className="font-inter text-[10px] tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
