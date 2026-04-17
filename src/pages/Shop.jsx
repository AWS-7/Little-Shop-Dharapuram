import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Palette, Sparkles } from 'lucide-react';
import ProductCard from '../components/home/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { LogoPulse } from '../components/layout/PageTransition';
import { PLACEHOLDER_PRODUCTS } from '../lib/constants';
import { getAllProducts, subscribeToProducts } from '../lib/products';

const OCCASIONS = ['All', 'Wedding', 'Party', 'Daily Wear', 'Festive'];
const COLORS = ['All', 'Red', 'Pink', 'Blue', 'Green', 'Gold', 'Black', 'White', 'Purple'];
const ALL_CATEGORIES = [
  'All', 'Silk Sarees', 'Cotton Sarees', 'Designer Sarees', 'Bridal Sarees', 'Festive Sarees',
  'Kurtas', 'Lehengas', 'Gowns', 'Co-ords', 'Jewellery', 'Accessories',
];

export default function Shop() {
  const [allProducts, setAllProducts] = useState(PLACEHOLDER_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showSlowLoading, setShowSlowLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedOccasion, setSelectedOccasion] = useState('All');
  const [selectedColor, setSelectedColor] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  // Show LogoPulse if loading takes more than 500ms
  useEffect(() => {
    let timer;
    if (loadingProducts) {
      timer = setTimeout(() => setShowSlowLoading(true), 500);
    } else {
      setShowSlowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [loadingProducts]);

  // Fetch products from Supabase (fallback to placeholder)
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await getAllProducts();
      if (!error && data && data.length > 0) {
        setAllProducts(data);
      }
      setLoadingProducts(false);
    };
    fetchProducts();

    // Set up real-time subscription
    const subscription = subscribeToProducts((payload) => {
      if (payload.eventType === 'INSERT') {
        setAllProducts(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setAllProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
      } else if (payload.eventType === 'DELETE') {
        setAllProducts(prev => prev.filter(p => p.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const categories = ALL_CATEGORIES;

  const filtered = useMemo(() => {
    let items = [...allProducts];
    if (selectedCategory !== 'All') {
      items = items.filter((p) => p.category === selectedCategory || p.category?.includes(selectedCategory.split(' ').pop()));
    }
    if (selectedOccasion !== 'All') {
      items = items.filter((p) => p.occasion === selectedOccasion || p.tags?.includes(selectedOccasion));
    }
    if (selectedColor !== 'All') {
      items = items.filter((p) => p.color === selectedColor || p.name.toLowerCase().includes(selectedColor.toLowerCase()));
    }
    if (sortBy === 'price-asc') items.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') items.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'newest') items.sort((a, b) => (b.id > a.id ? 1 : -1));
    return items;
  }, [allProducts, selectedCategory, selectedOccasion, selectedColor, sortBy]);

  return (
    <>
      <LogoPulse show={showSlowLoading} />
      
      <div className="container-clean pt-36 md:pt-48 pb-20">
        {/* Page Header — Standard eCommerce */}
        <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-100 mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            All Products
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Explore {filtered.length} items from our premium collection
          </p>
        </div>

        {/* Filter & Sort Row — Flipkart Style */}
        <div className="bg-white border-b border-gray-100 shadow-sm mb-4 sticky top-[64px] md:top-[88px] z-30">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Category Filter */}
            <div className="flex-1 px-4 py-3 overflow-hidden">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <div className="bg-gray-100 p-2 rounded-lg shrink-0 sm:hidden">
                  <SlidersHorizontal size={16} className="text-gray-500" />
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border shadow-sm ${
                      selectedCategory === cat
                        ? 'bg-purple-primary border-purple-primary text-white'
                        : 'bg-white border-gray-100 text-gray-600 hover:border-purple-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Quick Filters */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-gray-400 hidden md:block" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-bold text-gray-900 outline-none cursor-pointer"
                >
                  <option value="default">Popularity</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low-High</option>
                  <option value="price-desc">Price: High-Low</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-4 w-px bg-gray-200" />
                <button
                  onClick={() => { setSelectedCategory('All'); setSelectedOccasion('All'); setSelectedColor('All'); }}
                  className="text-[10px] font-bold text-purple-primary uppercase tracking-wider hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid - Increased gaps for breathing room */}
        {loadingProducts && showSlowLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
            {filtered.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-32 bg-white border border-gray-100 rounded-sm shadow-sm">
            <div className="max-w-xs mx-auto">
              <h3 className="text-xl font-black text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 text-sm mb-8 font-medium">Try adjusting your filters or search criteria.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedOccasion('All'); setSelectedColor('All'); }}
                className="bg-purple-primary text-white px-8 py-3 rounded-sm font-black text-xs uppercase tracking-widest shadow-md"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
