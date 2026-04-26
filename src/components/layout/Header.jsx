import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Heart, User, Menu, X, Package, LogOut, ChevronDown } from 'lucide-react';
import useStore from '../../store/useStore';
import { getAllProducts, subscribeToProducts } from '../../lib/products';
import { CURRENCY, ADMIN_EMAIL, CATEGORIES } from '../../lib/constants';
import { isAuthenticated, logoutUser, getCurrentUser } from '../../lib/firebaseAuth';

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
        if (user && user.email) {
          setIsAdmin(user.email === ADMIN_EMAIL);
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
    let subscription;

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

      // Real-time update for search products
      subscription = subscribeToProducts((payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      });
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
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

  const SearchSuggestions = () => (
    <AnimatePresence>
      {showSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute left-0 right-0 top-full bg-white shadow-2xl rounded-b-lg border-t border-gray-100 overflow-hidden z-[9999] mt-2 mx-2 sm:mx-0"
        >
          <div className="max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSearchSelect(product.id)}
                className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
              >
                <img
                  src={product.image_url || product.image || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded bg-gray-50"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                <p className="text-sm font-black text-gray-900">
                  {CURRENCY}{product.price?.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-purple-primary text-white shadow-md">
      {/* Top Strip — Flipkart Style */}
      <div className="container-clean h-16 md:h-20 flex items-center gap-4 md:gap-8">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <button
            className="lg:hidden p-1 hover:bg-white/10 rounded transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Center: Logo */}
        <Link to="/" className="flex-shrink-0">
          <img 
            src="/lll.png" 
            alt="Little Shop" 
            className="h-10 md:h-16 w-auto object-contain rounded-full"
          />
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4 md:gap-8 flex-1 justify-end">
          {/* Login Button */}
          {isLoggedIn ? (
            <div className="relative group">
              <Link 
                to={isAdmin ? "/admin/dashboard" : "/account"} 
                className="flex items-center gap-1 font-bold hover:text-purple-accent transition-colors py-2"
              >
                <User size={20} />
                <span className="hidden lg:block">Account</span>
              </Link>
              {/* Dropdown can be added here */}
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-white text-purple-primary px-8 py-1.5 rounded-sm font-bold text-sm hover:bg-gray-100 transition-colors hidden sm:block"
            >
              Login
            </Link>
          )}

          {/* Wishlist */}
          <Link to="/wishlist" className="relative font-bold hover:text-purple-accent transition-colors flex items-center gap-2">
            <Heart size={20} />
            <span className="hidden lg:block">Wishlist</span>
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button 
            onClick={openCartDrawer}
            className="relative font-bold hover:text-purple-accent transition-colors flex items-center gap-2"
          >
            <ShoppingBag size={20} />
            <span className="hidden lg:block">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search — Visible only on Mobile */}
      <div className="container-clean pb-3 sm:hidden relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!searchOpen) setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search for products..."
            className="w-full bg-white text-gray-900 h-9 px-4 pr-10 rounded-sm shadow-inner text-sm"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <SearchSuggestions />
      </div>

      {/* Category Bar — Product Categories */}
      <div className="bg-white border-b border-gray-200 hidden lg:block">
        <div className="container-clean flex items-center justify-center gap-8 py-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              to={`/shop?category=${encodeURIComponent(category.name)}`}
              className="text-gray-900 text-sm font-bold hover:text-purple-primary transition-colors flex items-center gap-1"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 top-0 bg-white z-[70] w-[80%] max-w-xs shadow-2xl flex flex-col"
          >
            <div className="bg-purple-primary p-6 text-white flex items-center gap-4">
              <User size={24} />
              <p className="font-bold">Welcome, {currentUser?.displayName || 'Guest'}</p>
              <button onClick={() => setMobileMenuOpen(false)} className="ml-auto">
                <X size={24} />
              </button>
            </div>
            
            <nav className="flex flex-col p-4 gap-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Categories</p>
              {CATEGORIES.map((category) => (
                <Link
                  key={category.name}
                  to={`/shop?category=${encodeURIComponent(category.name)}`}
                  className="flex items-center gap-4 p-3 text-gray-900 font-bold hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package size={20} className="text-gray-400" />
                  {category.name}
                </Link>
              ))}

              <div className="h-px bg-gray-100 my-2" />

              {isLoggedIn ? (
                <>
                  <Link
                    to="/my-orders"
                    className="flex items-center gap-4 p-3 text-gray-900 font-bold hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package size={20} className="text-gray-400" /> My Orders
                  </Link>
                  <button
                    onClick={async () => {
                      await logoutUser();
                      setIsLoggedIn(false);
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="flex items-center gap-4 p-3 text-red-500 font-bold hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={20} /> Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-4 p-3 text-purple-primary font-bold hover:bg-purple-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={20} /> Login / Register
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
