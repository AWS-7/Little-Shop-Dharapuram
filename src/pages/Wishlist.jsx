import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useStore from '../store/useStore';
import ProductCard from '../components/home/ProductCard';

export default function Wishlist() {
  const { wishlist } = useStore();

  if (wishlist.length === 0) {
    return (
      <div className="container-luxury section-spacing text-center">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
        <h2 className="font-playfair text-2xl text-gray-400 mb-2">Your wishlist is empty</h2>
        <p className="font-inter text-sm text-gray-400 mb-8">Save your favorite pieces here</p>
        <Link to="/shop" className="btn-primary inline-block">Explore Collection</Link>
      </div>
    );
  }

  return (
    <div className="container-luxury section-spacing">
      <div className="text-center mb-12">
        <h1 className="font-playfair text-3xl md:text-4xl text-purple-primary mb-2">Your Wishlist</h1>
        <p className="font-inter text-sm text-gray-400">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {wishlist.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </div>
  );
}
