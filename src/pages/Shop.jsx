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
        <div className="bg-white border border-gray-100 shadow-sm mb-8 sticky top-[100px] md:top-[140px] z-30">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Category Filter */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Categories</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap border ${
                      selectedCategory === cat
                        ? 'bg-purple-primary border-purple-primary text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-purple-primary hover:text-purple-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Quick Filters */}
            <div className="flex items-center gap-4 p-4 shrink-0 bg-gray-50 md:bg-white">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-black text-gray-900 outline-none cursor-pointer"
              >
                <option value="default">Sort: Popularity</option>
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              
              <div className="h-4 w-px bg-gray-200" />

              <button
                onClick={() => { setSelectedCategory('All'); setSelectedOccasion('All'); setSelectedColor('All'); }}
                className="text-[10px] font-black text-purple-primary uppercase tracking-widest hover:underline"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid — Clean Flipkart Style */}
        {loadingProducts ? (
          <ProductGridSkeleton count={8} />
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-100 border border-gray-100 shadow-sm overflow-hidden">
            {filtered.map((product, idx) => (
              <div key={product.id} className="bg-white">
                <ProductCard product={product} index={idx} />
              </div>
            ))}
          </div>
        ) : (
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
