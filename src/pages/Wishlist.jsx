import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import useStore from '../store/useStore';
import ProductCard from '../components/home/ProductCard';

export default function Wishlist() {
  const { wishlist } = useStore();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="text-center bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-6">
            <Heart size={28} className="text-rose-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-gray-500 mb-8">Save items you love and find them easily anytime.</p>
          <Link 
            to="/shop" 
            className="inline-flex items-center justify-center bg-purple-primary text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-purple-secondary transition-all shadow-sm"
          >
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-clean py-8 md:py-12">
      {/* Header - Modern MNC Style */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
            <Heart size={20} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Your Wishlist</h1>
            <p className="text-sm text-gray-500">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link 
          to="/shop" 
          className="flex items-center gap-2 text-purple-600 text-sm font-medium hover:text-purple-700"
        >
          <ArrowLeft size={16} />
          Continue Shopping
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {wishlist.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </div>
  );
}
