import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, LayoutGrid, List, Columns2, Columns3, Columns4 } from 'lucide-react';
import ProductCard from '../components/home/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { LogoPulse } from '../components/layout/PageTransition';
import { PLACEHOLDER_PRODUCTS } from '../lib/constants';
import { getAllProducts, subscribeToProducts, resolveImageUrl } from '../lib/products';

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
  const [gridCols, setGridCols] = useState('auto'); // 'auto', '2', '3', '4'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'compact', 'list'

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
        const productWithImage = {
          ...payload.new,
          image: resolveImageUrl(payload.new.image_url || payload.new.image)
        };
        setAllProducts(prev => [productWithImage, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        const productWithImage = {
          ...payload.new,
          image: resolveImageUrl(payload.new.image_url || payload.new.image)
        };
        setAllProducts(prev => prev.map(p => p.id === payload.new.id ? productWithImage : p));
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
      
      <div className="container-clean pt-4 md:pt-6 pb-10">
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

        {/* Grid View Controls */}
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-sm font-semibold text-gray-700">
            {filtered.length} Products
          </span>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-md transition-all ${viewMode === 'compact' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Compact View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Grid View"
              >
                <Columns2 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
            
            {/* Column Count (Grid mode only) */}
            {viewMode === 'grid' && (
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setGridCols('2')}
                  className={`p-2 rounded-md transition-all ${gridCols === '2' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
                >
                  <Columns2 size={16} />
                </button>
                <button
                  onClick={() => setGridCols('3')}
                  className={`p-2 rounded-md transition-all ${gridCols === '3' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
                >
                  <Columns3 size={16} />
                </button>
                <button
                  onClick={() => setGridCols('4')}
                  className={`p-2 rounded-md transition-all ${gridCols === '4' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
                >
                  <Columns4 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Grid - Modern Layouts */}
        {loadingProducts && showSlowLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + gridCols}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`
                ${viewMode === 'list' 
                  ? 'flex flex-col gap-4' 
                  : viewMode === 'compact'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
                    : gridCols === '2'
                      ? 'grid grid-cols-2 gap-4 md:gap-6'
                      : gridCols === '3'
                        ? 'grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5'
                        : gridCols === '4'
                          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'
                          : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5'
                }
              `}
            >
              {filtered.map((product, idx) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={idx} 
                  variant={viewMode}
                />
              ))}
            </motion.div>
          </AnimatePresence>
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
