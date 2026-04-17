import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useStore from '../store/useStore';
import ProductCard from '../components/home/ProductCard';

export default function Wishlist() {
  const { wishlist } = useStore();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
            <Heart size={32} className="text-gray-300" strokeWidth={1.5} />
          </div>
          <h2 className="font-playfair text-xl md:text-2xl text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="font-inter text-sm text-gray-400 mb-8 max-w-xs mx-auto">Save your favorite pieces here and find them easily</p>
          <Link to="/shop" className="inline-flex items-center justify-center bg-purple-primary text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-purple-secondary transition-colors">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-clean py-8 md:py-12">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="font-playfair text-2xl md:text-3xl text-purple-primary mb-2">Your Wishlist</h1>
        <p className="font-inter text-sm text-gray-400">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {wishlist.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </div>
  );
}
