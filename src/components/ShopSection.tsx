'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { useStore } from '../store/useStore';
import { useData } from '../context/DataContext';
import { 
  ShoppingBag, 
  ShoppingCart,
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  Headphones, 
  Heart, 
  ArrowRight, 
  Tag, 
  Check, 
  SlidersHorizontal,
  Flame,
  ArrowUpDown,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ShopSectionProps {
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, selectedColor: string, quantity: number) => void;
  onOpenQuoteForProduct: (product: Product) => void;
  showHero?: boolean;
}

export const ShopSection: React.FC<ShopSectionProps> = ({
  onQuickView,
  onAddToCart,
  onOpenQuoteForProduct,
  showHero = true
}) => {
  // Category & Filter State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price' | 'moq'>('featured');
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [showFullCatalog, setShowFullCatalog] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const catalogRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Global Store Data
  const { products: storeProducts } = useStore();
  const { products: backendProducts } = useData();

  const allProducts = (storeProducts && storeProducts.length > 0)
    ? storeProducts
    : (backendProducts && backendProducts.length > 0 ? backendProducts : PRODUCTS);

  // Live Real-Time Flash Deal Countdown Timer (Hours, Minutes, Seconds, Milliseconds)
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 12,
    seconds: 45,
    milliseconds: 30
  });

  useEffect(() => {
    // 8h 12m 45s countdown anchor
    const targetTime = Date.now() + (8 * 3600 + 12 * 60 + 45) * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const milliseconds = Math.floor((diff % 1000) / 10);

      setTimeLeft({ hours, minutes, seconds, milliseconds });
    }, 42); // 24fps smooth update

    return () => clearInterval(interval);
  }, []);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAdd = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const color = product.availableColors?.[0]?.hex || '#4E9F76';
    const qty = product.moq > 1 ? 10 : 1;
    onAddToCart(product, color, qty);
    setCartToast(`Added "${product.name}" to Cart`);
    setTimeout(() => setCartToast(null), 3000);
  };

  // 5 Signature Categories directly matching user reference design
  const CATEGORY_CARDS = [
    {
      id: 'women',
      title: 'Women',
      image: '/images/cat-women.jpg',
      categoryTag: 'women',
      subtitle: 'Luxury Totes & Boutique Apparel'
    },
    {
      id: 'men',
      title: 'Men',
      image: '/images/cat-men.jpg',
      categoryTag: 'men',
      subtitle: 'Organic Streetwear & Footwear'
    },
    {
      id: 'home',
      title: 'Home & Living',
      image: '/images/cat-home.jpg',
      categoryTag: 'recycled-textiles',
      subtitle: 'Sustainable Home & Circular Fabrics'
    },
    {
      id: 'beauty',
      title: 'Beauty',
      image: '/images/cat-beauty.jpg',
      categoryTag: 'beauty',
      subtitle: 'Clean Botanical Essences'
    },
    {
      id: 'electronics',
      title: 'Electronics',
      image: '/images/cat-electronics.jpg',
      categoryTag: 'electronics',
      subtitle: 'Smart Fitness & Acoustic Gear'
    }
  ];

  // Deal of the Day Product
  const dealProduct: Product = allProducts.find(p => p.id === 'deal-smart-watch-pro') || {
    id: 'deal-smart-watch-pro',
    name: 'Smart Watch Pro',
    category: 'electronics',
    categoryLabel: 'Electronics & Smart Gear',
    subtitle: 'Fitness & Health Tracking',
    pricePerUnit: 59.99,
    moq: 1,
    gsm: 45,
    dimensions: '44mm x 38mm x 10.7mm',
    material: 'Aerospace Aluminum & Fluoroelastomer',
    capacity: 'Water-Resistant 50M',
    certifications: ['CE Certified', 'RoHS Compliant'],
    availableColors: [{ name: 'Midnight Black', hex: '#111827' }],
    description: 'Precision engineered smart watch with high-resolution OLED display, heart rate tracking, oxygen saturation sensors, and 7-day battery life.',
    features: ['24/7 Heart Rate & SpO2', '40+ Sports Modes', 'Ultra-Retina Display', 'Magnetic Wireless Charge'],
    bestFor: 'Everyday fitness tracking, active lifestyles',
    ecoImpact: 'Crafted with 100% recycled aluminum chassis',
    inStock: true,
    leadTime: 'Immediate Dispatch',
    volumeTiers: [{ minQty: 1, price: 59.99 }],
    image: '/images/deal-smart-watch.jpg',
    badge: '50% OFF'
  };

  // 4 New Arrivals matching image
  const featuredArrivals: Product[] = [
    allProducts.find(p => p.id === 'prod-essential-hoodie') || {
      id: 'prod-essential-hoodie',
      name: 'Essential Hoodie',
      category: 'men',
      categoryLabel: 'Organic Cotton Streetwear',
      subtitle: 'Heavyweight organic combed cotton brushed fleece hoodie',
      pricePerUnit: 39.99,
      moq: 1,
      gsm: 450,
      dimensions: 'Unisex S - XXL',
      material: '100% GOTS Certified Organic Combed Cotton',
      capacity: 'Standard Fit',
      certifications: ['GOTS Certified Organic', 'OEKO-TEX Standard 100'],
      availableColors: [{ name: 'Warm Camel Sand', hex: '#c5a074' }],
      description: 'Crafted from sustainable ultra-heavyweight combed organic cotton fleece.',
      features: ['Heavyweight 450 GSM luxury brushed fleece', 'Double-stitched kangaroo pocket', 'Tonal drawstrings'],
      bestFor: 'Daily lifestyle wear, chilly evenings',
      ecoImpact: 'Conserves ~2,100 liters of water vs conventional cotton',
      inStock: true,
      leadTime: 'Immediate Dispatch',
      volumeTiers: [{ minQty: 1, price: 39.99 }],
      image: '/images/essential-hoodie.jpg',
      badge: 'NEW'
    },
    allProducts.find(p => p.id === 'prod-leather-handbag') || {
      id: 'prod-leather-handbag',
      name: 'Leather Handbag',
      category: 'women',
      categoryLabel: 'Luxury Eco-Leather',
      subtitle: 'Structured artisan top-handle tote handbag with removable crossbody strap',
      pricePerUnit: 59.99,
      moq: 1,
      gsm: 280,
      dimensions: '14"W x 10"H x 5"D',
      material: 'Vegetable-Tanned Bio-Based Eco Leather',
      capacity: 'Up to 15 lbs',
      certifications: ['LWG Gold Rated Leather', 'Reach Compliant'],
      availableColors: [{ name: 'Chestnut Brown', hex: '#78350f' }],
      description: 'Timeless luxury tote handbag with golden brass hardware.',
      features: ['Full-grain vegetable tanned finish', 'Reinforced base studs', 'Dedicated padded tech sleeve'],
      bestFor: 'Work, travel, evening events',
      ecoImpact: 'Zero toxic chrome tanning agents used',
      inStock: true,
      leadTime: 'Immediate Dispatch',
      volumeTiers: [{ minQty: 1, price: 59.99 }],
      image: '/images/leather-handbag.jpg',
      badge: 'NEW'
    },
    allProducts.find(p => p.id === 'prod-classic-sneakers') || {
      id: 'prod-classic-sneakers',
      name: 'Classic Sneakers',
      category: 'men',
      categoryLabel: 'Sustainable Footwear',
      subtitle: 'Low-top minimalist tennis sneakers crafted with bio-leather and wild rubber',
      pricePerUnit: 49.99,
      moq: 1,
      gsm: 200,
      dimensions: 'US Men 7 - 13',
      material: 'Certified Vegan Bio-Leather Upper & Natural Wild Rubber Sole',
      capacity: 'All-Day Orthotic Support',
      certifications: ['PETA-Approved Vegan', 'FSC Certified Rubber'],
      availableColors: [{ name: 'Crisp Studio White', hex: '#ffffff' }],
      description: 'Clean, versatile silhouette that effortlessly transitions from suits to casual denim.',
      features: ['Scuff-resistant bio-leather upper', 'Vulcanized natural rubber cupsole', 'Removable orthotic insole'],
      bestFor: 'Urban walking, business casual office',
      ecoImpact: 'Reduces carbon emissions by 65%',
      inStock: true,
      leadTime: 'Immediate Dispatch',
      volumeTiers: [{ minQty: 1, price: 49.99 }],
      image: '/images/classic-sneakers.jpg',
      badge: 'NEW'
    },
    allProducts.find(p => p.id === 'prod-eau-de-parfum') || {
      id: 'prod-eau-de-parfum',
      name: 'Eau de Parfum',
      category: 'beauty',
      categoryLabel: 'Botanical Fine Fragrance',
      subtitle: 'Artisanal organic botanical fragrance with amber, sandalwood and floral notes',
      pricePerUnit: 29.99,
      moq: 1,
      gsm: 100,
      dimensions: '50 ml / 1.7 fl. oz.',
      material: 'Organic Sugar Cane Alcohol & Botanical Extracts',
      capacity: '50 ml Glass Flacon',
      certifications: ['Leaping Bunny Cruelty-Free', 'IFRA Certified'],
      availableColors: [{ name: 'Golden Amber Essence', hex: '#d97706' }],
      description: 'Captivating sensual blend of warm golden amber, bergamot, jasmine petals, and sandalwood.',
      features: ['22% concentrated natural parfum oils', 'Clean formulation', 'Refillable Italian glass flacon'],
      bestFor: 'Signature daily fragrance, luxury gifting',
      ecoImpact: '100% biodegradable botanical essence',
      inStock: true,
      leadTime: 'Immediate Dispatch',
      volumeTiers: [{ minQty: 1, price: 29.99 }],
      image: '/images/eau-de-parfum.jpg',
      badge: 'NEW'
    }
  ];

  // Filtering for full catalog
  const filteredProducts = allProducts.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesQuery = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price') return a.pricePerUnit - b.pricePerUnit;
    if (sortBy === 'moq') return a.moq - b.moq;
    return 0;
  });

  const scrollToCategories = () => {
    categoriesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategorySelect = (categoryTag: string) => {
    setActiveCategory(categoryTag);
    setShowFullCatalog(true);
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="w-full bg-[#f8faf8] text-[#0f172a] font-sans antialiased selection:bg-[#FF5722] selection:text-white">

      {/* Floating Add-to-Cart Toast */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-stone-700 animate-slideUp">
          <div className="w-7 h-7 rounded-full bg-[#22c55e] flex items-center justify-center text-white shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-sm font-semibold">{cartToast}</span>
        </div>
      )}

      {/* ========================================================
          1. FULL-WIDTH EDGE-TO-EDGE HERO BANNER (STARTS AT TOP OF SHOP PAGE)
         ======================================================== */}
      {showHero && (
        <section className="relative w-full bg-gradient-to-r from-[#051a0e] via-[#0a2c17] to-[#04150a] text-white overflow-hidden shadow-xl border-b border-emerald-950/80">
          
          {/* Ambient Studio Lighting Glows */}
          <div className="pointer-events-none absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-600/15 blur-[120px]" />

          {/* Decorative Dot Matrix in top-right corner matching image */}
          <div className="pointer-events-none absolute top-8 right-12 opacity-25 hidden md:grid grid-cols-6 gap-2.5 z-10">
            {[...Array(24)].map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-white block" />
            ))}
          </div>

          {/* Banner Inner Content Container */}
          <div className="w-full max-w-[1560px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-20 py-12 sm:py-16 lg:py-20 xl:py-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
              
              {/* Left Content Column */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center text-left">
                
                {/* Pill Badge: LIMITED TIME ONLY */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a2c16]/90 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold tracking-widest uppercase mb-6 self-start shadow-inner">
                  <span>LIMITED TIME ONLY</span>
                </div>

                {/* Headline: Shop More, Save More! */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[1.06] mb-5">
                  Shop More,<br />
                  <span className="text-[#FF5722]">Save More!</span>
                </h1>

                {/* Subtitle */}
                <p className="text-emerald-100/90 text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg mb-9 font-normal">
                  Discover amazing deals on your favorite sustainable products & eco-friendly essentials.
                </p>

                {/* Value Props Row (3 Rounded Badges) */}
                <div className="flex flex-wrap items-center gap-6 sm:gap-8 mb-10">
                  
                  {/* 1. Best Prices */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0d3419] shadow-sm shrink-0">
                      <Tag className="w-4.5 h-4.5 stroke-[2.5]" />
                    </div>
                    <div className="text-xs leading-tight">
                      <p className="font-bold text-white">Best Prices</p>
                      <p className="text-emerald-200/80 text-[10px]">Guaranteed</p>
                    </div>
                  </div>

                  {/* 2. Secure Payments */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0d3419] shadow-sm shrink-0">
                      <ShieldCheck className="w-4.5 h-4.5 stroke-[2.5]" />
                    </div>
                    <div className="text-xs leading-tight">
                      <p className="font-bold text-white">Secure</p>
                      <p className="text-emerald-200/80 text-[10px]">Payments</p>
                    </div>
                  </div>

                  {/* 3. Fast Delivery */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0d3419] shadow-sm shrink-0">
                      <Truck className="w-4.5 h-4.5 stroke-[2.5]" />
                    </div>
                    <div className="text-xs leading-tight">
                      <p className="font-bold text-white">Fast Delivery</p>
                      <p className="text-emerald-200/80 text-[10px]">Worldwide</p>
                    </div>
                  </div>

                </div>

                {/* CTA Button: EXPLORE COLLECTION -> */}
                <div>
                  <button
                    onClick={scrollToCategories}
                    className="bg-[#FF5722] hover:bg-[#e64a19] text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-8 py-4 rounded-full inline-flex items-center gap-3 shadow-xl shadow-[#FF5722]/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                  >
                    <span>EXPLORE COLLECTION</span>
                    <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                  </button>
                </div>

              </div>

              {/* Right Showcase Podium Column */}
              <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center lg:justify-end">
                
                {/* Product Podium Container (High-Res E-Commerce Banner Image with Seamless Blend) */}
                <div className="relative w-full max-w-[620px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl select-none group">
                  <img
                    src="/images/shop-hero-podium.jpg"
                    alt="Ecotex Signature Collection Podium"
                    className="w-full h-full object-cover object-center transform group-hover:scale-[1.03] transition-transform duration-700 select-none"
                    draggable={false}
                  />

                  {/* Soft Gradient Overlay on left edge for seamless banner integration */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a2c17] to-transparent opacity-75" />

                  {/* Floating Circular Orange Badge: UP TO 50% OFF */}
                  <div className="absolute top-5 right-5 sm:top-7 sm:right-7 w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-[#FF5722] text-white flex flex-col items-center justify-center shadow-2xl shadow-[#FF5722]/50 font-extrabold uppercase text-center border-2 border-white/30 transform hover:scale-110 transition-transform duration-300 pointer-events-none select-none z-20">
                    <span className="text-[10px] sm:text-[11px] tracking-widest text-white/90 leading-none">UP TO</span>
                    <span className="text-2xl sm:text-3xl font-black leading-none my-1">50%</span>
                    <span className="text-[10px] sm:text-[11px] tracking-widest text-white/90 leading-none">OFF</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>
      )}

      {/* Main Container for Catalog, Categories & Deals - Ultra-Wide Responsive (Full Width) */}
      <div className="w-full max-w-[1820px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 sm:py-14">

        {/* ========================================================
            2. TRUST / VALUE PROPOSITIONS BAR (4 ITEMS STRIP)
           ======================================================== */}
        <section className="w-full bg-[#FAF8F5] border border-stone-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 mb-14 sm:mb-18 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80">
            
            {/* 1. Free Shipping */}
            <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:px-5">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                <Truck className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm sm:text-base text-stone-900 leading-tight">Free Shipping</h4>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">On orders over $75</p>
              </div>
            </div>

            {/* 2. Easy Returns */}
            <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:px-5">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                <RotateCcw className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm sm:text-base text-stone-900 leading-tight">Easy Returns</h4>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">30-day returns</p>
              </div>
            </div>

            {/* 3. Premium Quality */}
            <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:px-5">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                <ShieldCheck className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm sm:text-base text-stone-900 leading-tight">Premium Quality</h4>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">100% original products</p>
              </div>
            </div>

            {/* 4. 24/7 Support */}
            <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:px-5">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                <Headphones className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm sm:text-base text-stone-900 leading-tight">24/7 Support</h4>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">We're here to help</p>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            3. SHOP BY CATEGORY (5 CARDS GRID - FULL-WIDTH SPAN)
           ======================================================== */}
        <section ref={categoriesRef} id="shop-categories-section" className="mb-16 sm:mb-20">
          
          {/* Section Heading */}
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
              Shop By Category
            </h2>
          </div>

          {/* 5-Column Full-Width Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6 lg:gap-8">
            {CATEGORY_CARDS.map((cat) => {
              const isActive = activeCategory === cat.categoryTag;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.categoryTag)}
                  className={`group relative flex flex-col bg-[#F9F7F4] rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer ${
                    isActive
                      ? 'border-[#0d3419] ring-2 ring-[#0d3419]/30 shadow-lg'
                      : 'border-stone-200/90 hover:border-stone-300'
                  }`}
                >
                  {/* Category Photo */}
                  <div className="relative w-full aspect-[4/5] bg-stone-100 overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="p-4 sm:p-5 text-center flex flex-col items-center">
                    <h3 className="font-extrabold text-base sm:text-lg text-stone-900 mb-1.5 group-hover:text-[#0d3419] transition-colors">
                      {cat.title}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-500 group-hover:text-[#FF5722] transition-colors">
                      <span>Shop Now</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </section>

        {/* ========================================================
            4. DEAL OF THE DAY (FULL-WIDTH EXPANSIVE SPLIT CARD)
           ======================================================== */}
        <section className="w-full rounded-[32px] sm:rounded-[40px] bg-[#FFF5ED] border border-[#FFE0CC] p-8 sm:p-12 lg:p-16 mb-16 sm:mb-20 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
            
            {/* Left Column: Deal Copy & CTA */}
            <div className="lg:col-span-5 flex flex-col text-left">
              <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-[#FF5722] mb-3 block">
                DEAL OF THE DAY
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.08] mb-4">
                Grab It Before<br />
                It's Gone!
              </h2>
              <p className="text-base sm:text-lg text-stone-600 mb-8 font-medium max-w-md">
                Hurry! Limited stock available.
              </p>
              <div>
                <button
                  onClick={(e) => handleQuickAdd(dealProduct, e)}
                  className="bg-[#FF5722] hover:bg-[#e64a19] text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-8 py-4 rounded-full inline-flex items-center gap-3 shadow-lg shadow-[#FF5722]/35 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                >
                  <span>SHOP THE DEAL</span>
                  <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Right Column: Clean White Product Card with Stock Bar & 4 Timer Boxes */}
            <div className="lg:col-span-7">
              <div 
                onClick={() => onQuickView(dealProduct)}
                className="bg-white rounded-3xl p-7 sm:p-9 lg:p-10 shadow-lg border border-stone-200/70 flex flex-col sm:flex-row items-center gap-8 lg:gap-10 group cursor-pointer hover:shadow-2xl transition-shadow"
              >
                
                {/* Watch Product Thumbnail */}
                <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 bg-stone-50 rounded-2xl flex items-center justify-center p-4 shrink-0 overflow-hidden border border-stone-100">
                  <img
                    src="/images/deal-smart-watch.jpg"
                    alt={dealProduct.name}
                    className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 select-none"
                    draggable={false}
                  />
                </div>

                {/* Details Column */}
                <div className="flex-1 w-full text-left">
                  <h3 className="font-extrabold text-xl sm:text-2xl text-stone-900 mb-1.5 group-hover:text-[#0d3419] transition-colors">
                    {dealProduct.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 mb-4">
                    {dealProduct.subtitle}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="text-3xl sm:text-4xl font-black text-[#FF5722]">
                      $59.99
                    </span>
                    <span className="text-base sm:text-lg font-medium text-stone-400 line-through">
                      $119.99
                    </span>
                  </div>

                  {/* Stock Bar: Only 23 items left! */}
                  <div className="mb-6">
                    <p className="text-xs sm:text-sm font-bold text-stone-700 mb-2">
                      Only 23 items left!
                    </p>
                    <div className="w-full h-2.5 rounded-full bg-stone-100 overflow-hidden">
                      <div className="h-full bg-[#FF5722] rounded-full w-[77%]" />
                    </div>
                  </div>

                  {/* 4 Square Countdown Timer Boxes */}
                  <div className="grid grid-cols-4 gap-3 max-w-sm">
                    
                    {/* HRS */}
                    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-2.5 sm:p-3 text-center">
                      <span className="font-mono font-black text-lg sm:text-xl lg:text-2xl text-stone-900 leading-none block">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mt-1.5">
                        HRS
                      </span>
                    </div>

                    {/* MINS */}
                    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-2.5 sm:p-3 text-center">
                      <span className="font-mono font-black text-lg sm:text-xl lg:text-2xl text-stone-900 leading-none block">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mt-1.5">
                        MINS
                      </span>
                    </div>

                    {/* SECS */}
                    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-2.5 sm:p-3 text-center">
                      <span className="font-mono font-black text-lg sm:text-xl lg:text-2xl text-stone-900 leading-none block">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mt-1.5">
                        SECS
                      </span>
                    </div>

                    {/* MSEC */}
                    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-2.5 sm:p-3 text-center">
                      <span className="font-mono font-black text-lg sm:text-xl lg:text-2xl text-[#FF5722] leading-none block">
                        {String(timeLeft.milliseconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mt-1.5">
                        MSEC
                      </span>
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            5. NEW ARRIVALS (4 PRODUCT CARDS - FULL-WIDTH EXPANSIVE GRID)
           ======================================================== */}
        <section id="new-arrivals-section" className="mb-16 sm:mb-20">
          
          {/* Header Row: Title & View All Link */}
          <div className="flex items-center justify-between mb-10 pb-4 border-b border-stone-200">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
              New Arrivals
            </h2>
            <button
              onClick={() => {
                setShowFullCatalog(!showFullCatalog);
                setActiveCategory('all');
                setTimeout(() => {
                  catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-sm sm:text-base font-bold text-[#FF5722] hover:text-[#e64a19] flex items-center gap-2 transition-colors cursor-pointer group"
            >
              <span>{showFullCatalog ? 'Hide Full Catalog' : 'View All'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* 4 Product Cards Grid - Generous Sizing across 1820px */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
            {featuredArrivals.map((product) => {
              const isWishlisted = !!wishlist[product.id];
              return (
                <div
                  key={product.id}
                  onClick={() => onQuickView(product)}
                  className="group relative flex flex-col bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer"
                >
                  
                  {/* Top Bar inside Card: NEW Badge on left, Heart Icon on right */}
                  <div className="flex items-center justify-between w-full mb-4 relative z-10">
                    <span className="px-3 py-1 rounded-full bg-stone-900 text-white text-[11px] font-black uppercase tracking-wider shadow-2xs">
                      NEW
                    </span>

                    <button
                      onClick={(e) => toggleWishlist(product.id, e)}
                      aria-label="Add to wishlist"
                      className="w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-stone-500 hover:text-red-500 shadow-2xs border border-stone-200/80 transition-transform active:scale-90"
                    >
                      <Heart className={`w-4.5 h-4.5 transition-colors ${
                        isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-600'
                      }`} />
                    </button>
                  </div>

                  {/* Clean Centered Product Image */}
                  <div className="relative w-full aspect-square bg-[#FAF8F5] rounded-2xl flex items-center justify-center p-6 mb-5 overflow-hidden">
                    <img
                      src={product.image || '/images/essential-hoodie.jpg'}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500 select-none"
                      draggable={false}
                    />
                  </div>

                  {/* Bottom Info: Title, Price & Shopping Cart Button */}
                  <div className="mt-auto">
                    <h3 className="font-extrabold text-base sm:text-lg text-stone-900 truncate mb-2 group-hover:text-[#0d3419] transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="font-black text-xl sm:text-2xl text-stone-900">
                        ${product.pricePerUnit.toFixed(2)}
                      </span>

                      {/* Outline Shopping Cart Button */}
                      <button
                        onClick={(e) => handleQuickAdd(product, e)}
                        aria-label={`Add ${product.name} to cart`}
                        className="w-11 h-11 rounded-2xl border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-white text-stone-700 flex items-center justify-center transition-colors shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <ShoppingCart className="w-5 h-5 stroke-[2]" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </section>

        {/* ========================================================
            6. EXPANDED CATALOG & WHOLESALE PACKAGING COLLECTION
               (Appears when "View All" or a specific category is clicked)
           ======================================================== */}
        <div ref={catalogRef} id="catalog-full-section">
          {showFullCatalog && (
            <section className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 mb-12 shadow-sm animate-fadeIn">
              
              {/* Filter & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-stone-200">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                    Full Manufacturing & Retail Catalog
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    Showing {sortedProducts.length} items available for direct retail & wholesale bulk dispatch.
                  </p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search catalog..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d3419]/30"
                    />
                  </div>

                  {/* Sort Pill Buttons */}
                  <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
                    <button
                      onClick={() => setSortBy('featured')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        sortBy === 'featured' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      Featured
                    </button>
                    <button
                      onClick={() => setSortBy('price')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        sortBy === 'price' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      Price
                    </button>
                    <button
                      onClick={() => setSortBy('moq')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        sortBy === 'moq' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      Lowest MOQ
                    </button>
                  </div>

                  {/* Reset Filter Button */}
                  {(activeCategory !== 'all' || searchQuery) && (
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setSearchQuery('');
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-50 text-[#0d3419] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      Reset All
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of All Catalog Products */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedProducts.map((prod) => {
                  const isWishlisted = !!wishlist[prod.id];
                  return (
                    <div
                      key={prod.id}
                      onClick={() => onQuickView(prod)}
                      className="group relative flex flex-col bg-[#FAF8F5] hover:bg-white rounded-2xl border border-stone-200/90 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between w-full mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0d3419] text-white text-[9px] font-black uppercase tracking-wider">
                          {prod.badge || 'FACTORY DIRECT'}
                        </span>
                        <button
                          onClick={(e) => toggleWishlist(prod.id, e)}
                          aria-label="Add to wishlist"
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-stone-500 hover:text-red-500 shadow-2xs border border-stone-200"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-600'}`} />
                        </button>
                      </div>

                      {/* Image */}
                      <div className="relative w-full aspect-square bg-white rounded-xl flex items-center justify-center p-4 mb-3 overflow-hidden border border-stone-100">
                        <img
                          src={prod.image || '/images/bag-green.png'}
                          alt={prod.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
                          draggable={false}
                        />
                      </div>

                      {/* Info */}
                      <h4 className="font-bold text-sm text-stone-900 truncate mb-1">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mb-3">
                        {prod.subtitle}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-stone-200/70">
                        <div>
                          <span className="font-black text-base text-stone-900">
                            ${prod.pricePerUnit.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium ml-1">
                            {prod.moq > 1 ? `(MOQ ${prod.moq})` : '/ unit'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {prod.moq > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenQuoteForProduct(prod);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-[#0d3419] border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                            >
                              Quote
                            </button>
                          )}
                          <button
                            onClick={(e) => handleQuickAdd(prod, e)}
                            className="w-8 h-8 rounded-lg border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-white text-stone-700 flex items-center justify-center transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </section>
          )}
        </div>

      </div>

    </div>
  );
};
