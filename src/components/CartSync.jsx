import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { useAuth } from '../context/AuthContext';
import { syncCartToSupabase } from '../lib/carts';

export default function CartSync() {
  const { cart, getCartTotal } = useStore();
  const { user } = useAuth();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Debounce: sync after 2s of no cart changes
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const total = getCartTotal();
      const items = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));
      syncCartToSupabase(user.id, user.email, user.user_metadata?.full_name || '', items, total).catch(() => {});
    }, 2000);

    return () => clearTimeout(debounceRef.current);
  }, [cart, user]);

  return null; // No UI — purely a side-effect component
}
