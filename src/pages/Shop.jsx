import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Palette, Sparkles } from 'lucide-react';
import ProductCard from '../components/home/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { LogoPulse } from '../components/layout/PageTransition';
import { PLACEHOLDER_PRODUCTS } from '../lib/constants';
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
      
      <div className="container-clean section-spacing pt-32">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Shop All
          </h1>
          <p className="text-gray-500 max-w-2xl text-lg">
            Explore our curated collection of premium essentials. 
            Filtered by quality, designed for longevity.
          </p>
        </div>

        {/* Top Filters Section */}
        <div className="bg-white border-y border-gray-100 py-6 mb-10 sticky top-[64px] md:top-[80px] z-30">
          <div className="flex flex-col gap-6">
            {/* Category Pills */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2 flex-shrink-0">Categories</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-purple-primary text-white shadow-md'
                      : 'bg-gray-50 text-gray-500 hover:bg-purple-light hover:text-purple-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Other Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Occasion Dropdown */}
                <div className="relative">
                  <select
                    value={selectedOccasion}
                    onChange={(e) => setSelectedOccasion(e.target.value)}
                    className="appearance-none bg-gray-50 border-none text-xs font-bold text-gray-700 px-5 py-3 pr-10 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-purple-primary/10"
                  >
                    <option value="All">All Occasions</option>
                    {OCCASIONS.filter(o => o !== 'All').map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Sparkles size={12} />
                  </div>
                </div>

                {/* Color Dropdown */}
                <div className="relative">
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="appearance-none bg-gray-50 border-none text-xs font-bold text-gray-700 px-5 py-3 pr-10 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-purple-primary/10"
                  >
                    <option value="All">All Colors</option>
                    {COLORS.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Palette size={12} />
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedCategory !== 'All' || selectedOccasion !== 'All' || selectedColor !== 'All') && (
                  <button
                    onClick={() => { setSelectedCategory('All'); setSelectedOccasion('All'); setSelectedColor('All'); }}
                    className="flex items-center gap-2 text-xs font-bold text-purple-primary hover:text-purple-dark transition-colors"
                  >
                    <X size={14} /> Clear All
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-gray-900 outline-none cursor-pointer py-2"
                >
                  <option value="default">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        {!loadingProducts && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="text-gray-900 font-bold">{filtered.length}</span> results
            </p>
          </div>
        )}

        {/* Product Grid */}
        {loadingProducts ? (
          <ProductGridSkeleton count={8} />
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-16">
            {filtered.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50 rounded-3xl">
            <div className="max-w-xs mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-8">Try adjusting your filters or search criteria.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedOccasion('All'); setSelectedColor('All'); }}
                className="btn-primary w-full"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
