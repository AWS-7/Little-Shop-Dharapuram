export const SHIPPING_THRESHOLD = 1500;
export const SHIPPING_COST = 100;
export const CURRENCY = '₹';

// Admin mobile number for role-based access (without +91 prefix)
export const ADMIN_MOBILE_NUMBER = '9876543210';

export const BRAND = {
  name: 'Little Shop',
  tagline: 'Curated Luxury for the Modern Woman',
  description: 'Handpicked designer pieces that celebrate elegance, craftsmanship, and individuality.',
};

export const POLICIES = {
  payment: 'Online Payment Only',
  returns: 'No Returns / No Exchanges',
  cod: 'Cash on Delivery not available',
};

export const ORDER_STATUSES = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

export const PLACEHOLDER_PRODUCTS = [
  {
    id: '1',
    name: 'Silk Organza Saree',
    price: 4500,
    originalPrice: 6000,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=800&fit=crop',
    ],
    video: null,
    category: 'Sarees',
    badge: 'New',
    inStock: true,
    stockCount: 12,
    rating: 4.8,
    reviewCount: 124,
    fabric: { material: 'Kanchipuram Silk Organza', care: 'Dry clean only', origin: 'Kanchipuram, Tamil Nadu' },
    description: 'A breathtaking Kanchipuram silk organza saree with intricate gold zari work along the border and pallu. The lightweight drape and lustrous sheen make it perfect for weddings, festive celebrations, and elegant evening gatherings.',
  },
  {
    id: '2',
    name: 'Embroidered Anarkali Set',
    price: 3200,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
    ],
    video: null,
    category: 'Kurtas',
    badge: null,
    inStock: true,
    stockCount: 8,
    rating: 4.5,
    reviewCount: 89,
    fabric: { material: 'Georgette with Thread Embroidery', care: 'Hand wash cold, dry in shade', origin: 'Lucknow, Uttar Pradesh' },
    description: 'Elegant floor-length Anarkali suit featuring delicate chikankari-inspired thread embroidery on premium georgette. Comes with a matching dupatta and palazzo pants for a complete, graceful look.',
  },
  {
    id: '3',
    name: 'Pashmina Shawl — Ivory',
    price: 2800,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1617627143233-46e3a5f5d5b6?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=800&fit=crop',
    ],
    video: null,
    category: 'Accessories',
    badge: 'Sale',
    inStock: true,
    stockCount: 5,
    rating: 4.9,
    reviewCount: 67,
    fabric: { material: '100% Pure Pashmina Wool', care: 'Dry clean only', origin: 'Kashmir, India' },
    description: 'Luxuriously soft handwoven Pashmina shawl in a timeless ivory hue. Each piece takes artisans over two weeks to create, featuring subtle self-patterns that catch the light beautifully.',
  },
  {
    id: '4',
    name: 'Block Print Palazzo Set',
    price: 1800,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1583391733975-991c5a64c6a5?w=600&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1583391733975-991c5a64c6a5?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1617627143233-46e3a5f5d5b6?w=600&h=800&fit=crop',
    ],
    video: null,
    category: 'Co-ords',
    badge: 'New',
    inStock: true,
    stockCount: 15,
    rating: 4.3,
    reviewCount: 52,
    fabric: { material: 'Hand Block Printed Cotton', care: 'Machine wash cold, tumble dry low', origin: 'Jaipur, Rajasthan' },
    description: 'A breezy block-printed co-ord set featuring traditional Rajasthani motifs on airy cotton. The relaxed palazzo silhouette pairs effortlessly with the matching kurta for everyday elegance.',
  },
  {
    id: '5',
    name: 'Chanderi Cotton Dupatta',
    price: 950,
    originalPrice: 1200,
    image: 'https://images.unsplash.com/photo-1617627143233-46e3a5f5d5b6?w=600&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1617627143233-46e3a5f5d5b6?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
    ],
    video: null,
    category: 'Accessories',
    badge: null,
    inStock: true,
    stockCount: 20,
    rating: 4.6,
    reviewCount: 38,
    fabric: { material: 'Chanderi Cotton-Silk Blend', care: 'Hand wash cold, air dry', origin: 'Chanderi, Madhya Pradesh' },
    description: 'Lightweight Chanderi cotton-silk dupatta with a delicate gold tissue border. Its translucent weave and subtle shimmer add an instant touch of sophistication to any outfit.',
  },
  {
    id: '6',
    name: 'Banarasi Silk Lehenga',
    price: 8500,
    originalPrice: 12000,
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
    ],
    video: null,
    category: 'Lehengas',
    badge: 'Sale',
    inStock: true,
    stockCount: 3,
    rating: 4.9,
    reviewCount: 203,
    fabric: { material: 'Pure Banarasi Silk with Zari', care: 'Dry clean only', origin: 'Varanasi, Uttar Pradesh' },
    description: 'A showstopping Banarasi silk lehenga adorned with intricate gold and silver zari jaal work. This heirloom-quality piece features a fully lined cancan skirt, embroidered blouse, and matching dupatta — the ultimate bridal statement.',
  },
  {
    id: '7',
    name: 'Zari Work Clutch',
    price: 1400,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1617627143233-46e3a5f5d5b6?w=600&h=800&fit=crop',
    ],
    video: null,
    category: 'Accessories',
    badge: null,
    inStock: true,
    stockCount: 10,
    rating: 4.4,
    reviewCount: 45,
    fabric: { material: 'Silk with Gold Zari Embroidery', care: 'Spot clean only', origin: 'Surat, Gujarat' },
    description: 'A handcrafted zari-embroidered clutch that pairs perfectly with ethnic wear. Features a magnetic snap closure, interior pocket, and a detachable chain strap for versatile styling.',
  },
  {
    id: '8',
    name: 'Sequin Georgette Gown',
    price: 5600,
    originalPrice: 7000,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583391733975-991c5a64c6a5?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=800&fit=crop',
    ],
    video: null,
    category: 'Gowns',
    badge: 'New',
    inStock: true,
    stockCount: 6,
    rating: 4.7,
    reviewCount: 91,
    fabric: { material: 'Sequin-Embellished Georgette', care: 'Dry clean only', origin: 'Mumbai, Maharashtra' },
    description: 'A glamorous floor-length gown in flowing georgette, adorned with hand-sewn sequin clusters that catch every flicker of light. The flattering A-line silhouette and subtle trail make it ideal for cocktail parties and receptions.',
  },
];

export const HERO_SLIDES = [
  {
    id: 1,
    title: 'The Summer Edit',
    subtitle: 'Effortless Elegance, Redefined',
    cta: 'Shop Collection',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1440&h=700&fit=crop',
    hotspots: [
      { x: 35, y: 45, productId: '1', label: 'Silk Organza Saree — ₹4,500' },
      { x: 65, y: 60, productId: '3', label: 'Pashmina Shawl — ₹2,800' },
    ],
  },
  {
    id: 2,
    title: 'Bridal Luxe',
    subtitle: 'For Your Most Cherished Moments',
    cta: 'Explore Bridal',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1440&h=700&fit=crop',
    hotspots: [
      { x: 45, y: 50, productId: '6', label: 'Banarasi Silk Lehenga — ₹8,500' },
    ],
  },
  {
    id: 3,
    title: 'Everyday Grace',
    subtitle: 'Handcrafted Pieces for Daily Luxury',
    cta: 'Shop Now',
    image: 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=1440&h=700&fit=crop',
    hotspots: [
      { x: 40, y: 55, productId: '4', label: 'Block Print Palazzo Set — ₹1,800' },
    ],
  },
];

// Firebase Auth storage keys
export const AUTH_STORAGE_KEYS = {
  USER: 'firebase_auth_user',
  TOKEN: 'firebase_auth_token',
  TEMP_PHONE: 'firebase_temp_phone'
};

export const CATEGORIES = [
  { name: 'Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop', featured: true },
  { name: 'Silk Sarees', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=800&fit=crop' },
  { name: 'Chudi Materials', image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=800&fit=crop' },
  { name: 'Imitation Jewellery', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=800&fit=crop' },
  { name: 'Bangles', image: 'https://images.unsplash.com/photo-1617627143233-46e3a5f5d5b6?w=600&h=800&fit=crop' },
  { name: 'Bags', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop' },
];
