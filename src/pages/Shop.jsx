import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Palette, Sparkles, Loader2 } from 'lucide-react';
import ProductCard from '../components/home/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { LogoPulse } from '../components/layout/PageTransition';
import { PLACEHOLDER_PRODUCTS, CATEGORIES } from '../lib/constants';
import { getAllProducts } from '../lib/products';

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
  const [showFilters, setShowFilters] = useState(false);

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
  }, []);

  const categories = ALL_CATEGORIES;

  const filtered = useMemo(() => {
    let items = [...allProducts];
    if (selectedCategory !== 'All') {
      // Match exact or partial (e.g., "Silk Sarees" matches products with category containing "Sarees")
      items = items.filter((p) => p.category === selectedCategory || p.category?.includes(selectedCategory.split(' ').pop()));
    }
    if (selectedOccasion !== 'All') {
      items = items.filter((p) => p.occasion === selectedOccasion || p.tags?.includes(selectedOccasion));
    }
    if (selectedColor !== 'All') {
      items = items.filter((p) => p.color === selectedColor || p.name.toLowerCase().includes(selectedColor.toLowerCase()));
    }
    if (priceRange !== 'All') {
      const [min, max] = priceRange.split('-').map(Number);
      items = items.filter((p) => p.price >= min && (max ? p.price <= max : true));
    }
    if (sortBy === 'price-asc') items.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') items.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'newest') items.sort((a, b) => (b.id > a.id ? 1 : -1));
    return items;
  }, [allProducts, selectedCategory, selectedOccasion, selectedColor, priceRange, sortBy]);

  return (
    <>
      {/* Logo Pulse for slow loading */}
      <LogoPulse show={showSlowLoading} />
      
      <div className="container-luxury section-spacing">
      {/* Page Header */}
      <div className="text-center mb-12">
        <p className="font-inter text-xs tracking-[0.3em] uppercase text-rose-gold mb-3">
          Browse
        </p>
        <h1 className="font-playfair text-3xl md:text-5xl text-purple-primary mb-4">
          All Products
        </h1>
        <div className="divider-luxury" />
      </div>

      {/* Smart Filters */}
      <div className="mb-8 space-y-4">
        {/* Category Filter */}
        <div className="hidden md:flex items-center gap-3 flex-wrap">
          <span className="font-inter text-[10px] tracking-wider uppercase text-gray-400 mr-2">Category</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`font-inter text-xs tracking-wider uppercase px-4 py-2 transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-primary text-white'
                  : 'border border-gray-200 text-gray-500 hover:border-purple-primary hover:text-purple-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Occasion & Color Filters */}
        <div className="hidden md:flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-rose-gold" />
            <span className="font-inter text-[10px] tracking-wider uppercase text-gray-400">Shop by Occasion</span>
            {OCCASIONS.map((occ) => (
              <button
                key={occ}
                onClick={() => setSelectedOccasion(occ)}
                className={`font-inter text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-colors ${
                  selectedOccasion === occ
                    ? 'bg-rose-gold text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-rose-gold/10 hover:text-rose-gold'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Palette size={14} className="text-purple-primary" />
            <span className="font-inter text-[10px] tracking-wider uppercase text-gray-400">Shop by Color</span>
            {COLORS.map((col) => (
              <button
                key={col}
                onClick={() => setSelectedColor(col)}
                className={`font-inter text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-colors ${
                  selectedColor === col
                    ? 'bg-purple-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-primary/10 hover:text-purple-primary'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button
          onClick={() => setShowFilters(true)}
          className="md:hidden flex items-center gap-2 font-inter text-xs tracking-wider uppercase text-gray-600 border border-gray-200 px-4 py-2"
        >
          <SlidersHorizontal size={14} /> Filters
        </button>

        <div className="flex items-center gap-2">
          {(selectedCategory !== 'All' || selectedOccasion !== 'All' || selectedColor !== 'All') && (
            <button
              onClick={() => { setSelectedCategory('All'); setSelectedOccasion('All'); setSelectedColor('All'); }}
              className="font-inter text-xs text-rose-gold hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="font-inter text-xs tracking-wider uppercase bg-transparent border border-gray-200 px-4 py-2 outline-none"
        >
          <option value="default">Sort By</option>
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Results count - hide when loading */}
      {!loadingProducts && (
        <p className="font-inter text-xs text-gray-400 mb-6">
          Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Product Grid or Skeleton */}
      {loadingProducts ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-4 md:gap-x-6 md:gap-y-10">
          {filtered.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}

      {!loadingProducts && filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="font-playfair text-xl text-gray-400">No products found</p>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setShowFilters(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-cream p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-playfair text-lg text-purple-primary">Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              {/* Category */}
              <div>
                <h4 className="font-inter text-xs tracking-wider uppercase text-gray-400 mb-3">Category</h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); }}
                      className={`block w-full text-left font-inter text-sm px-4 py-2 transition-colors ${
                        selectedCategory === cat
                          ? 'bg-purple-primary text-white'
                          : 'text-gray-600 hover:text-purple-primary'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div>
                <h4 className="font-inter text-xs tracking-wider uppercase text-gray-400 mb-3 flex items-center gap-2">
                  <Sparkles size={12} /> Shop by Occasion
                </h4>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ}
                      onClick={() => { setSelectedOccasion(occ); }}
                      className={`font-inter text-xs px-3 py-1.5 rounded-full transition-colors ${
                        selectedOccasion === occ
                          ? 'bg-rose-gold text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <h4 className="font-inter text-xs tracking-wider uppercase text-gray-400 mb-3 flex items-center gap-2">
                  <Palette size={12} /> Shop by Color
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((col) => (
                    <button
                      key={col}
                      onClick={() => { setSelectedColor(col); }}
                      className={`font-inter text-xs px-3 py-1.5 rounded-full transition-colors ${
                        selectedColor === col
                          ? 'bg-purple-primary text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full btn-primary py-3 text-sm"
              >
                Show {filtered.length} Results
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
    </>
  );
}
