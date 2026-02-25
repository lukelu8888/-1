import { ChevronRight, TrendingUp, Flame, ArrowDown, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useRouter } from '../contexts/RouterContext';
import { OrderEditingBanner } from './OrderEditingBanner';
import { useUser } from '../contexts/UserContext';
import { useCart } from '../contexts/CartContext';
import { LiveBanner } from './live/LiveBanner';
import { toast } from 'sonner';

export function Home() {
  const { navigateTo } = useRouter();
  const { user } = useUser();
  const { addToCart } = useCart();

  const handleReturnToOrder = () => {
    // Navigate back to dashboard with create-order view
    if (user) {
      localStorage.setItem('dashboardActiveView', 'create-order');
      navigateTo('dashboard');
    } else {
      // If not logged in, prompt to login first
      navigateTo('login');
    }
  };

  // Popular Searches for Fall - 6 product categories by search volume
  const popularSearches = [
    {
      name: 'Faucets & Fixtures',
      image: 'https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGZhdWNldCUyMG1vZGVybnxlbnwxfHx8fDE3NjExOTg4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Bath',
      subcategory: 'Faucets & Fixtures',
    },
    {
      name: 'Power Drills',
      image: 'https://images.unsplash.com/photo-1755168648692-ef8937b7e63e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMHRvb2xzJTIwZHJpbGx8ZW58MXx8fHwxNzYxMTQ1NzAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Tools',
      subcategory: 'Power Drills',
    },
    {
      name: 'Lumber & Composites',
      image: 'https://images.unsplash.com/photo-1598954385478-53e5b3c970ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdW1iZXIlMjB3b29kJTIwc3RhY2t8ZW58MXx8fHwxNzYxMjAxMjMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Building Materials',
      subcategory: 'Lumber & Composites',
    },
    {
      name: 'Kitchen Faucets',
      image: 'https://images.unsplash.com/photo-1758548157319-ec649ce00f1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHJvbWUlMjBmYXVjZXQlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjAxMjMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Kitchen',
      subcategory: 'Kitchen Faucets',
    },
    {
      name: 'Ceiling Lights',
      image: 'https://images.unsplash.com/photo-1534105615256-13940a6faa38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWlsaW5nJTIwbGlnaHQlMjBmaXh0dXJlfGVufDF8fHx8MTc2MTIwMDAwMXww&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Lighting & Fans',
      subcategory: 'Ceiling Lights',
    },
    {
      name: 'Paint & Stains',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludCUyMGNvbG9yJTIwc2FtcGxlc3xlbnwxfHx8fDE3NjEyMDAwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Paint',
      subcategory: 'Interior Paint',
    },
  ];

  // Shop by Department - Main categories (12 departments in 2 rows)
  const departments = [
    {
      name: 'Tools',
      image: 'https://images.unsplash.com/photo-1755168648692-ef8937b7e63e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMHRvb2xzJTIwZHJpbGx8ZW58MXx8fHwxNzYxMTQ1NzAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Outdoors',
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXduJTIwbW93ZXIlMjBnYXJkZW58ZW58MXx8fHwxNzYxNjQwNjI4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Appliances',
      image: 'https://images.unsplash.com/photo-1758488438758-5e2eedf769ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2VzJTIwcmVmcmlnZXJhdG9yfGVufDF8fHx8MTc2MTE3NTQ4OHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Building Materials',
      image: 'https://images.unsplash.com/photo-1598954385478-53e5b3c970ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdW1iZXIlMjB3b29kJTIwc3RhY2t8ZW58MXx8fHwxNzYxMjAxMjMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Lighting & Ceiling Fans',
      image: 'https://images.unsplash.com/photo-1534105615256-13940a6faa38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWlsaW5nJTIwbGlnaHQlMjBmaXh0dXJlfGVufDF8fHx8MTc2MTIwMDAwMXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Lawn & Garden',
      image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBzb2lsJTIwZmVydGlsaXplcnxlbnwxfHx8fDE3NjE2NDA2Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Bath',
      image: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHZhbml0eSUyMHNpbmt8ZW58MXx8fHwxNzYxMTk4ODU3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Floors & Area Rugs',
      image: 'https://images.unsplash.com/photo-1615875474908-f403688c7a76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29kJTIwZmxvb3IlMjBoYXJkd29vZHxlbnwxfHx8fDE3NjExOTM0MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Décor & Furniture',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBiZWQlMjBtb2Rlcm58ZW58MXx8fHwxNzYxNjQwNjI4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Storage & Organization',
      image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3b6f54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbGZpbmclMjBvcmdhbml6YXRpb258ZW58MXx8fHwxNzYxNjQwNjI5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Kitchen',
      image: 'https://images.unsplash.com/photo-1686023858213-9653d3248fdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwY2FiaW5ldHMlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMTk4ODU5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Smart Home',
      image: 'https://images.unsplash.com/photo-1558002038-1055907df827?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGhvbWUlMjBkb29yYmVsbHxlbnwxfHx8fDE3NjE2NDA2Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  // Great Value Products
  const greatValueProducts = [
    {
      name: 'LED Light Bulbs 12-Pack',
      price: '$24.99',
      originalPrice: '$39.99',
      savings: 'Save $15',
      image: 'https://images.unsplash.com/photo-1550985616-10810253b84d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWQlMjBsaWdodCUyMGJ1bGJzfGVufDF8fHx8MTc2MTIwMDAwMnww&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Best Value',
    },
    {
      name: 'Premium Paint Roller Set',
      price: '$19.99',
      originalPrice: '$29.99',
      savings: 'Save $10',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludCUyMGNvbG9yJTIwc2FtcGxlc3xlbnwxfHx8fDE3NjEyMDAwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Hot Deal',
    },
    {
      name: 'Heavy Duty Work Gloves',
      price: '$12.99',
      originalPrice: '$19.99',
      savings: 'Save $7',
      image: 'https://images.unsplash.com/photo-1616401776316-ae601a5f69c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JrJTIwZ2xvdmVzJTIwc2FmZXR5fGVufDF8fHx8MTc2MTIwMDAwM3ww&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Popular',
    },
    {
      name: 'Multi-Purpose Screwdriver Set',
      price: '$34.99',
      originalPrice: '$49.99',
      savings: 'Save $15',
      image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY3Jld2RyaXZlciUyMHNldCUyMHRvb2xzfGVufDF8fHx8MTc2MTIwMDAwM3ww&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Best Seller',
    },
  ];

  // Great Value Categories - Home Depot style themed cards
  const greatValueCategories = [
    {
      name: 'Weekly Cosun Drop',
      link: 'Weekly Depot Drop',
      bgColor: 'bg-gray-800',
      textColor: 'text-white',
      badgeColor: 'bg-orange-600',
      badgeText: 'WEEKLY COSUN DROP',
      badgeRotate: true,
    },
    {
      name: 'Special Buy',
      link: 'Special Buy',
      bgColor: 'bg-gray-800',
      textColor: 'text-white',
      badgeColor: 'bg-red-500',
      badgeText: 'SPECIAL BUY',
    },
    {
      name: 'New Lower Price',
      link: 'New Lower Price',
      bgColor: 'bg-green-600',
      textColor: 'text-white',
      hasIcon: 'arrow',
      mainText: 'NEW LOWER PRICE',
      badgeColor: 'bg-yellow-500',
      badgeShape: 'shield',
    },
    {
      name: 'Fire Safety',
      link: 'Shop Fire Safety',
      bgColor: 'bg-red-800',
      textColor: 'text-white',
      hasIcon: 'flame',
      mainText: 'FIRE SAFETY',
    },
    {
      name: 'Halloween Clearance',
      link: 'Halloween Clearance',
      bgColor: 'bg-yellow-500',
      textColor: 'text-gray-900',
      mainText: 'HALLOWEEN CLEARANCE',
      hasDecor: true,
    },
    {
      name: 'Fall Projects',
      link: 'Fall Projects',
      bgColor: 'bg-orange-600',
      textColor: 'text-white',
      mainText: 'FALL PROJECTS',
    },
  ];

  // Top Flyer Offers - Products with detailed info
  const flyerOffers = [
    {
      name: 'BEHR PREMIUM PLUS Interior Low Odour Eggshell...',
      brand: 'BEHR PREMIUM PLUS',
      price: '$45.97',
      unit: '/ each',
      originalPrice: '$48.47',
      discount: 'Save 5%',
      discountAmount: 'Was $48.47',
      rating: 4.5,
      reviews: 2650,
      image: 'https://images.unsplash.com/photo-1652829069807-95a2f6d1a601?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludCUyMGJ1Y2tldCUyMGludGVyaW9yfGVufDF8fHx8MTc2MTY0MTUzNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'SPECIAL BUY',
      badgeColor: 'bg-green-600',
    },
    {
      name: 'American Standard Mainstream 4.8L Standard Height...',
      brand: 'American Standard',
      price: '$166.00',
      unit: '/ each',
      originalPrice: '$198.00',
      discount: 'Save 16%',
      discountAmount: 'Was $198.00',
      rating: 4,
      reviews: 40,
      image: 'https://images.unsplash.com/photo-1609946860422-5e9cefc924ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2lsZXQlMjBiYXRocm9vbSUyMHdoaXRlfGVufDF8fHx8MTc2MTY0MTUzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'SPECIAL BUY',
      badgeColor: 'bg-green-600',
    },
    {
      name: 'TrafficMaster Regal Black 14-inch x 28-inch Indoor...',
      brand: 'TrafficMaster',
      price: '$6.78',
      unit: '/ each',
      rating: 4.5,
      reviews: 34,
      image: 'https://images.unsplash.com/photo-1708441434493-cadc8b8eb54e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXIlMjBmaWx0ZXIlMjBodmFjfGVufDF8fHx8MTc2MTY0MTUzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'SPECIAL BUY',
      badgeColor: 'bg-red-600',
    },
    {
      name: 'Milwaukee Tool FASTBACK Folding Utility Knife with...',
      brand: 'Milwaukee Tool',
      price: '$19.98',
      unit: '/ each',
      rating: 5,
      reviews: 1060,
      image: 'https://images.unsplash.com/photo-1683115097173-f24516d000c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1dGlsaXR5JTIwa25pZmUlMjB0b29sc3xlbnwxfHx8fDE3NjE2NDE1Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'SPECIAL BUY',
      badgeColor: 'bg-red-600',
    },
    {
      name: 'HDX 16x25x1 Air Filter, Household Allergens, Pleated...',
      brand: 'HDX',
      price: '$13.98',
      unit: '/ each',
      rating: 4.5,
      reviews: 528,
      image: 'https://images.unsplash.com/photo-1634064109846-495fe6bbf71f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXIlMjBmaWx0ZXIlMjBwbGVhdGVkfGVufDF8fHx8MTc2MTY0MTUzOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      badge: 'NEW LOWER PRICE',
      badgeColor: 'bg-yellow-500',
    },
    {
      name: 'GREAT STUFF Window & Door with Reusable Smart...',
      brand: 'GREAT STUFF',
      price: '$19.20',
      unit: '/ each',
      rating: 4,
      reviews: 195,
      image: 'https://images.unsplash.com/photo-1597585079079-e0bc92fdcfa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcHJheSUyMGNhbiUyMGFlcm9zb2x8ZW58MXx8fHwxNzYxNjQxNTQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
  ];

  // Promotional Banners
  const promoBanners = [
    {
      title: 'Fall Home Improvement Event',
      subtitle: 'Get Your Home Ready for the Season',
      image: 'https://images.unsplash.com/photo-1758304481967-9edc1307f9d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBtYXRlcmlhbHMlMjB3YXJlaG91c2V8ZW58MXx8fHwxNzYwNzA2Mjk3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      cta: 'Shop Now',
    },
    {
      title: 'Professional Installation Services',
      subtitle: 'Expert Installation for Your Peace of Mind',
      image: 'https://images.unsplash.com/photo-1689596312367-39a4461504c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMG1hdGVyaWFscyUyMHNpdGV8ZW58MXx8fHwxNzYwNzYzMzAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      cta: 'Learn More',
    },
    {
      title: 'Bulk Order Discounts Available',
      subtitle: 'Special Pricing for Contractors & Bulk Buyers',
      image: 'https://images.unsplash.com/photo-1660592868727-858d28c3ba52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBwcm9qZWN0JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNzYzMzAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      cta: 'Contact Us',
    },
  ];

  // Recommended Products
  const recommendedProducts = [
    {
      name: 'Smart Thermostat',
      price: '$129.99',
      rating: 4.5,
      reviews: 342,
      image: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHRoZXJtb3N0YXR8ZW58MXx8fHwxNzYxMjAwMDA0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Trending',
    },
    {
      name: 'Cordless Drill Kit',
      price: '$99.99',
      rating: 4.8,
      reviews: 567,
      image: 'https://images.unsplash.com/photo-1755168648692-ef8937b7e63e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMHRvb2xzJTIwZHJpbGx8ZW58MXx8fHwxNzYxMTQ1NzAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Best Seller',
    },
    {
      name: 'LED Ceiling Fan with Light',
      price: '$159.99',
      rating: 4.6,
      reviews: 234,
      image: 'https://images.unsplash.com/photo-1534105615256-13940a6faa38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWlsaW5nJTIwbGlnaHQlMjBmaXh0dXJlfGVufDF8fHx8MTc2MTIwMDAwMXww&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Popular',
    },
    {
      name: 'Waterfall Kitchen Faucet',
      price: '$189.99',
      rating: 4.7,
      reviews: 456,
      image: 'https://images.unsplash.com/photo-1758548157319-ec649ce00f1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHJvbWUlMjBmYXVjZXQlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjAxMjMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'New',
    },
    {
      name: 'Vinyl Plank Flooring',
      price: '$2.99/sq.ft',
      rating: 4.4,
      reviews: 189,
      image: 'https://images.unsplash.com/photo-1615875474908-f403688c7a76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29kJTIwZmxvb3IlMjBoYXJkd29vZHxlbnwxfHx8fDE3NjExOTM0MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Hot Deal',
    },
    {
      name: 'Premium Cabinet Pulls Set',
      price: '$49.99',
      rating: 4.9,
      reviews: 678,
      image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJpbmV0JTIwaGFyZHdhcmUlMjBoYW5kbGV8ZW58MXx8fHwxNzYxMjAwMDA0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'Top Rated',
    },
  ];

  return (
    <div className="bg-gray-50">
      {/* Popular Searches for Fall */}
      <section className="bg-white py-8 border-b">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-4">
            <h2 className="text-gray-900">Popular Searches for Fall</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => navigateTo('catalog')}
                className="px-6 py-3 border-2 border-gray-300 rounded bg-white hover:border-orange-600 hover:text-orange-600 transition-colors text-gray-700"
              >
                {search.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Advertisement */}
      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div 
            className="relative w-full h-[200px] md:h-[300px] rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => navigateTo('specials')}
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1701813190168-3fab9a458d49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xpZGF5JTIwc2FsZSUyMGJhbm5lciUyMHByb21vdGlvbnxlbnwxfHx8fDE3NjE2NDAzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Holiday Gifting and Special Offers"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 via-red-800/60 to-transparent">
              <div className="h-full flex items-center px-12">
                <div className="text-white max-w-2xl">
                  <h2 className="text-white mb-3">Put a Bow on Holiday Gifting</h2>
                  <p className="text-xl text-white/95 mb-6">Special offers on top brands - Limited time only!</p>
                  <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
                    Shop Holiday Deals <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Department */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-gray-900">Shop by Department</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map((dept, index) => (
              <button
                key={index}
                onClick={() => navigateTo('catalog')}
                className="group bg-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col justify-between h-[220px]"
              >
                <div className="w-full flex items-center justify-center mb-2">
                  <div className="w-32 h-32 flex items-center justify-center">
                    <ImageWithFallback
                      src={dept.image}
                      alt={dept.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 text-blue-600 group-hover:text-blue-700 mt-auto">
                  <span className="text-sm">{dept.name}</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Shop More Great Value */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-gray-900">Shop More Great Value at The Cosun Mall</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {greatValueCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => navigateTo('specials')}
                className={`${category.bgColor} ${category.textColor} rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col items-center justify-between h-[280px] relative overflow-hidden`}
              >
                {/* Badge for Weekly Drop and Special Buy */}
                {category.badgeText && (
                  <div className={`${category.badgeColor} text-white px-4 py-2 text-xs ${category.badgeRotate ? 'transform -rotate-3' : ''} ${category.badgeShape === 'shield' ? 'clip-path-shield' : 'rounded'}`}>
                    {category.badgeText}
                  </div>
                )}
                
                {/* Icon for Fire Safety and New Lower Price */}
                {category.hasIcon === 'flame' && (
                  <div className="flex-1 flex items-center justify-center">
                    <Flame className="w-16 h-16" />
                  </div>
                )}
                
                {category.hasIcon === 'arrow' && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="bg-yellow-500 text-green-700 px-6 py-3 relative" style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
                      <div className="text-xs">{category.mainText}</div>
                      <ArrowDown className="w-6 h-6 mx-auto mt-1" />
                    </div>
                  </div>
                )}
                
                {/* Main text for other categories */}
                {!category.badgeText && !category.hasIcon && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      {category.hasDecor && (
                        <div className="text-xs mb-2">
                          <div className="border-t-2 border-current w-20 mx-auto mb-1"></div>
                          <div className="text-4xl">🕷️</div>
                          <div className="border-b-2 border-current w-20 mx-auto mt-1"></div>
                        </div>
                      )}
                      <div className={category.hasDecor ? 'text-xl' : 'text-2xl'}>
                        {category.mainText}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bottom link */}
                <div className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm mt-auto">
                  <span>{category.link}</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Top Flyer Offers - With Orange Border */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          {/* Orange bordered container */}
          <div className="border-8 border-orange-600 bg-white p-8 rounded-lg">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-gray-900">Check Out These Top Flyer Offers</h2>
              <button 
                onClick={() => navigateTo('specials')}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                View Our Flyer <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {flyerOffers.map((product, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 导航到产品目录页面，让用户在那里查看产品详情
                    console.log('✅ 点击首页产品:', product.name);
                    navigateTo('catalog');
                  }}
                >
                  {/* Product Image with Badge */}
                  <div className="relative p-4 bg-white">
                    <div className="aspect-square flex items-center justify-center mb-2">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute top-2 left-2">
                        <span className={`${product.badgeColor || 'bg-green-600'} text-white text-xs px-2 py-1 rounded`}>
                          {product.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">{product.brand}</div>
                    <h3 className="text-xs text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < Math.floor(product.rating) ? 'text-orange-500' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({product.reviews})</span>
                    </div>
                    
                    {/* Price */}
                    <div className="mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-gray-900">{product.price}</span>
                        <span className="text-xs text-gray-500">{product.unit}</span>
                      </div>
                      {product.discount && (
                        <div className="text-xs text-green-700">{product.discount}</div>
                      )}
                      {product.discountAmount && (
                        <div className="text-xs text-gray-500">{product.discountAmount}</div>
                      )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // 阻止事件冒泡，避免触发父元素的 onClick
                        // 解析价格（去掉 $ 符号）
                        const priceValue = parseFloat(product.price.replace('$', '').trim());
                        addToCart({
                          productName: product.name,
                          image: product.image,
                          material: product.brand || '',
                          color: '',
                          specification: '',
                          unitPrice: priceValue,
                          quantity: 1,
                          pcsPerCarton: 1,
                          cartonGrossWeight: 0,
                          cartonNetWeight: 0,
                          cartonSize: '',
                          cbmPerCarton: 0,
                        });
                        toast.success('Product added to cart!', {
                          description: `${product.name.substring(0, 30)}...`,
                          action: {
                            label: 'View Cart',
                            onClick: () => navigateTo('cart')
                          },
                        });
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-2 rounded transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              <div className="w-2 h-2 rounded-full bg-orange-600"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 space-y-6">
          {promoBanners.map((banner, index) => (
            <div
              key={index}
              className="relative h-[300px] rounded-lg overflow-hidden shadow-lg cursor-pointer group"
              onClick={() => navigateTo('projectsolution')}
            >
              <ImageWithFallback
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-2xl px-12 text-white">
                  <h2 className="text-white mb-2">{banner.title}</h2>
                  <p className="text-xl text-white/90 mb-6">{banner.subtitle}</p>
                  <Button 
                    size="lg" 
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {banner.cta} <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended For You */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Recommended For You</h2>
            <button 
              onClick={() => navigateTo('catalog')}
              className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm"
            >
              View More <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {recommendedProducts.map((product, index) => (
              <div
                key={index}
                className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('✅ 点击推荐产品:', product.name);
                  navigateTo('catalog');
                }}
              >
                <div className="aspect-square relative overflow-hidden bg-gray-50">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`text-white text-xs px-2 py-1 rounded ${
                      product.badge === 'Trending' ? 'bg-blue-600' :
                      product.badge === 'Best Seller' ? 'bg-yellow-600' :
                      product.badge === 'Popular' ? 'bg-purple-600' :
                      product.badge === 'New' ? 'bg-green-600' :
                      product.badge === 'Hot Deal' ? 'bg-red-600' :
                      'bg-orange-600'
                    }`}>
                      {product.badge}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm mb-2 text-gray-900 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${
                            i < Math.floor(product.rating) ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({product.reviews})</span>
                  </div>
                  <p className="text-orange-600">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Editing Banner */}
      <OrderEditingBanner onReturnToOrder={handleReturnToOrder} />
      {/* Live Banner (temporarily disabled) */}
      {false && <LiveBanner />}
    </div>
  );
}
