import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Heart, User, Menu, X, Package, LogOut } from 'lucide-react';
import useStore from '../../store/useStore';
import { getAllProducts } from '../../lib/products';
import { CURRENCY, ADMIN_MOBILE_NUMBER } from '../../lib/constants';
import { isAuthenticated, logoutUser, getCurrentUser, formatPhoneForDisplay } from '../../lib/firebaseAuth';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const { cart, wishlist, mobileMenuOpen, setMobileMenuOpen, openCartDrawer } = useStore();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      
      if (authenticated) {
        const user = getCurrentUser();
        setCurrentUser(user);
        
        // Check if admin
        if (user && user.phoneNumber) {
          const userPhone = user.phoneNumber.replace('+91', '');
          setIsAdmin(userPhone === ADMIN_MOBILE_NUMBER);
        }
      }
    };

    checkAuth();
    
    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch products for search (including placeholders as fallback)
  useEffect(() => {
    if (searchOpen) {
      getAllProducts().then(({ data, error }) => {
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          // Fallback to placeholder products if no database products
          import('../../lib/constants').then(({ PLACEHOLDER_PRODUCTS }) => {
            setProducts(PLACEHOLDER_PRODUCTS.map(p => ({
              ...p,
              image_url: p.image,
              original_price: p.originalPrice
            })));
          });
        }
      });
    }
  }, [searchOpen]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6); // Limit to 6 suggestions
      setFilteredProducts(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredProducts([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, products]);

  const handleSearchSelect = (productId) => {
    setSearchOpen(false);
    setSearchQuery('');
    setShowSuggestions(false);
    navigate(`/product/${productId}`);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl py-3 border-gray-100'
          : 'bg-white/80 backdrop-blur-md py-3 border-gray-100/60 md:bg-transparent md:backdrop-blur-none md:py-5 md:border-transparent'
      }`}
    >
      <div className="container-luxury flex items-center justify-between">
        {/* Left Nav — Desktop (hidden on tablet, use hamburger) */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link to="/shop" className="font-inter text-xs tracking-[0.2em] uppercase text-gray-700 hover:text-purple-primary transition-colors">
            Shop
          </Link>
          <Link to="/collections" className="font-inter text-xs tracking-[0.2em] uppercase text-gray-700 hover:text-purple-primary transition-colors">
            Collections
          </Link>
          <Link to="/new-arrivals" className="font-inter text-xs tracking-[0.2em] uppercase text-gray-700 hover:text-purple-primary transition-colors">
            New Arrivals
          </Link>
        </nav>

        {/* Mobile/Tablet — Hamburger (left) */}
        <button
          className="lg:hidden p-1 text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>

        {/* Logo — always centered */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="font-playfair text-lg md:text-3xl font-semibold text-purple-primary tracking-wide whitespace-nowrap">
            Little Shop
          </h1>
        </Link>

        {/* Right Icons */}
        <div className="flex items-center gap-3 md:gap-5">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-gray-700 hover:text-purple-primary transition-colors"
          >
            <Search size={18} />
          </button>

          <Link to="/wishlist" className="relative text-gray-700 hover:text-rose-gold transition-colors hidden lg:block">
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-gold text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                {wishlist.length}
              </span>
            )}
          </Link>

          <button 
            onClick={openCartDrawer}
            className="relative text-gray-700 hover:text-purple-primary transition-colors hidden lg:block"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {isLoggedIn ? (
            <div className="hidden lg:flex items-center gap-3">
              <Link to={isAdmin ? "/admin/dashboard" : "/account"} className="text-gray-700 hover:text-purple-primary transition-colors">
                <div className="flex items-center gap-2">
                  <User size={18} />
                  {currentUser && (
                    <span className="text-xs text-gray-500">
                      {formatPhoneForDisplay(currentUser.phoneNumber)}
                    </span>
                  )}
                </div>
              </Link>
              <button
                onClick={async () => {
                  await logoutUser();
                  setIsLoggedIn(false);
                  setIsAdmin(false);
                  setCurrentUser(null);
                  navigate('/login');
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden lg:block text-gray-700 hover:text-purple-primary transition-colors">
              <User size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-white relative z-50"
          >
            <div className="container-luxury py-4">
              {/* Search Input */}
              <div className="flex items-center gap-3">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for sarees, kurtas, accessories..."
                  className="w-full bg-transparent font-inter text-sm outline-none placeholder:text-gray-400"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Search Suggestions Dropdown - Outside container to avoid clipping */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 right-0 top-full bg-white shadow-lg border-t border-gray-100 overflow-hidden z-50"
                >
                  <div className="container-luxury">
                    <div className="max-h-80 overflow-y-auto py-2">
                      {filteredProducts.map((product, idx) => (
                        <motion.button
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSearchSelect(product.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left rounded-lg"
                        >
                          {/* Product Thumbnail */}
                          <img
                            src={product.image_url || product.image || '/placeholder.jpg'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md bg-gray-100 flex-shrink-0"
                            onError={(e) => e.target.src = '/placeholder.jpg'}
                          />
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-inter text-sm text-gray-800 truncate">{product.name}</p>
                            <p className="font-inter text-xs text-gray-400">{product.category}</p>
                          </div>
                          
                          {/* Price */}
                          <p className="font-playfair text-sm text-emerald-primary">
                            {CURRENCY}{product.price?.toLocaleString()}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                    
                    {/* View All Results Link */}
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <button
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                          setSearchQuery('');
                          setShowSuggestions(false);
                        }}
                        className="w-full text-center font-inter text-xs text-gray-500 hover:text-emerald-primary transition-colors"
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 top-[49px] bg-cream z-40 md:hidden"
          >
            <nav className="flex flex-col p-8 gap-5">
              {['Shop', 'Collections', 'New Arrivals'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="font-playfair text-2xl text-emerald-primary hover:text-rose-gold transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}

              <div className="border-t border-gray-200 my-2" />

              {isLoggedIn ? (
                <>
                  <Link
                    to="/my-orders"
                    className="flex items-center gap-3 font-inter text-sm tracking-wider uppercase text-gray-600 hover:text-emerald-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package size={16} /> My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 font-inter text-sm tracking-wider uppercase text-purple-600 hover:text-purple-800 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={16} /> Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      await logoutUser();
                      setIsLoggedIn(false);
                      setIsAdmin(false);
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="flex items-center gap-3 font-inter text-sm tracking-wider uppercase text-red-500 hover:text-red-700 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-3 font-inter text-sm tracking-wider uppercase text-gray-600 hover:text-emerald-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={16} /> Sign In
                </Link>
              )}
              <Link
                to="/track-order"
                className="flex items-center gap-3 font-inter text-sm tracking-wider uppercase text-gray-600 hover:text-emerald-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Package size={16} /> Track Order
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
