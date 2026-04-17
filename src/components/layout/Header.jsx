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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm py-2'
          : 'bg-white border-b border-transparent py-4'
      }`}
    >
      <div className="container-clean flex items-center justify-between">
        {/* Left Nav — Desktop */}
        <nav className="hidden lg:flex items-center gap-10">
          <Link to="/shop" className="text-sm font-medium text-gray-600 hover:text-purple-primary transition-colors">
            Shop
          </Link>
          <Link to="/collections" className="text-sm font-medium text-gray-600 hover:text-purple-primary transition-colors">
            Collections
          </Link>
          <Link to="/new-arrivals" className="text-sm font-medium text-gray-600 hover:text-purple-primary transition-colors">
            New Arrivals
          </Link>
        </nav>

        {/* Mobile — Hamburger (left) */}
        <button
          className="lg:hidden p-2 text-gray-900 hover:text-purple-primary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo — centered */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl md:text-2xl font-bold text-purple-primary tracking-tight uppercase">
            Little Shop
          </h1>
        </Link>

        {/* Right Icons */}
        <div className="flex items-center gap-1 md:gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-gray-900 hover:text-purple-primary transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          <Link to="/wishlist" className="relative p-2 text-gray-900 hover:text-purple-primary transition-colors hidden sm:block" aria-label="Wishlist">
            <Heart size={20} />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-purple-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {wishlist.length}
              </span>
            )}
          </Link>

          <button 
            onClick={openCartDrawer}
            className="relative p-2 text-gray-900 hover:text-purple-primary transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-purple-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {isLoggedIn ? (
            <div className="hidden sm:flex items-center gap-1">
              <Link to={isAdmin ? "/admin/dashboard" : "/account"} className="p-2 text-gray-900 hover:text-purple-primary transition-colors flex items-center gap-2">
                <User size={20} />
              </Link>
              <button
                onClick={async () => {
                  await logoutUser();
                  setIsLoggedIn(false);
                  setIsAdmin(false);
                  setCurrentUser(null);
                  navigate('/login');
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden sm:block p-2 text-gray-900 hover:text-purple-primary transition-colors" aria-label="Login">
              <User size={20} />
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
            className="border-t border-gray-100 bg-white shadow-lg overflow-hidden"
          >
            <div className="container-clean py-8">
              <div className="flex items-center gap-4 max-w-3xl mx-auto border-b border-gray-200 focus-within:border-purple-primary transition-colors py-3">
                <Search size={22} className="text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full bg-transparent text-lg outline-none placeholder:text-gray-400"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }} 
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full bg-white shadow-xl border-t border-gray-100 z-50"
                >
                  <div className="container-clean py-4">
                    <div className="max-h-96 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSearchSelect(product.id)}
                          className="w-full flex items-center gap-4 p-3 hover:bg-purple-light transition-colors rounded-xl text-left"
                        >
                          <img
                            src={product.image_url || product.image || '/placeholder.jpg'}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-lg bg-gray-50"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                          <p className="font-bold text-purple-primary">
                            {CURRENCY}{product.price?.toLocaleString()}
                          </p>
                        </button>
                      ))}
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
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 top-[61px] bg-white z-40 md:hidden border-t border-gray-100"
          >
            <nav className="flex flex-col p-6 gap-6">
              {['Shop', 'Collections', 'New Arrivals'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-xl font-bold text-gray-900 hover:text-purple-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}

              <div className="h-px bg-gray-100" />

              <div className="flex flex-col gap-4">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/my-orders"
                      className="flex items-center gap-3 text-base font-medium text-gray-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package size={20} /> My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-3 text-base font-medium text-purple-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User size={20} /> Admin Dashboard
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
                      className="flex items-center gap-3 text-base font-medium text-red-500"
                    >
                      <LogOut size={20} /> Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-3 text-base font-medium text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={20} /> Login / Register
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
