import { useState, useEffect } from 'react';
import { Menu, Search, X, ChevronDown, Shield, Radio } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRouter } from '../contexts/RouterContext';
import { useCart } from '../contexts/CartContext';
import { useRegion } from '../contexts/RegionContext';
import { useOptionalUser } from '../contexts/UserContext';
import { toast } from 'sonner@2.0.3';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import { productDetailsData, ProductDetail } from '../data/productDetailsData';
import { ProductDetailDialog } from './ProductDetailDialog';
import { RegionSwitcher } from './RegionSwitcher';
import { RegionBadge } from './RegionBadge';
import { productRecommendationsMap, defaultProducts } from '../data/header/recommendedProductsData';
import { departments } from '../data/header/departmentsData';
import { HeaderLogo } from './header/HeaderLogo';
import { UserMenu } from './header/UserMenu';
import { CartButton } from './header/CartButton';
import { MobileNavigation } from './header/MobileNavigation';
import { QuantityAlertDialog } from './header/QuantityAlertDialog';
import { DepartmentMegaMenu } from './header/DepartmentMegaMenu';
import { ProductPanel } from './header/ProductPanel';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [isMobileDepartmentOpen, setIsMobileDepartmentOpen] = useState(false);
  const [mobileDeptIndex, setMobileDeptIndex] = useState<number | null>(null);
  const [mobileSubcatName, setMobileSubcatName] = useState<string | null>(null);
  const [hoveredDept, setHoveredDept] = useState<number | null>(null);
  const [hoveredSubcat, setHoveredSubcat] = useState<string | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorQuantities, setColorQuantities] = useState<{ [color: string]: number }>({});
  const [suggestedQuantities, setSuggestedQuantities] = useState<{ qty: number; cartons: number }[]>([]);
  const [showQuantityAlert, setShowQuantityAlert] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<any>(null);
  const [selectedSuggestedQuantity, setSelectedSuggestedQuantity] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const { navigateTo, currentPage } = useRouter();
  const { addToCart, getTotalItems } = useCart();
  const { region, setShowRegionSelector } = useRegion();
  const userContext = useOptionalUser();
  const user = userContext?.user ?? null;
  const logout = userContext?.logout ?? (async () => {});

  // Clear hover states when department menu is closed
  useEffect(() => {
    if (!isDepartmentOpen) {
      setHoveredDept(null);
      setHoveredSubcat(null);
      setHoveredProduct(null);
    }
  }, [isDepartmentOpen]);

  // Update suggested quantities when orderQuantity or hoveredProduct changes
  useEffect(() => {
    if (hoveredProduct && orderQuantity > 0) {
      const product = getProductDetails(hoveredProduct);
      if (!product) {
        setSuggestedQuantities([]);
        return;
      }
      
      const isNotFullCarton = orderQuantity % product.pcsPerCarton !== 0;
      
      if (isNotFullCarton) {
        const suggestedLower = Math.floor(orderQuantity / product.pcsPerCarton) * product.pcsPerCarton;
        const suggestedHigher = Math.ceil(orderQuantity / product.pcsPerCarton) * product.pcsPerCarton;
        
        setSuggestedQuantities([
          { 
            qty: suggestedLower || product.pcsPerCarton, 
            cartons: (suggestedLower || product.pcsPerCarton) / product.pcsPerCarton 
          },
          { 
            qty: suggestedHigher, 
            cartons: suggestedHigher / product.pcsPerCarton 
          }
        ]);
      } else {
        setSuggestedQuantities([]);
      }
    } else {
      setSuggestedQuantities([]);
    }
  }, [orderQuantity, hoveredProduct]);

  // Get product details by product name
  const getProductDetails = (productName: string) => {
    return productDetailsData[productName] || null;
  };

  // Check if region is selected before opening department dropdown
  const handleDepartmentClick = () => {
    if (!region) {
      setShowRegionSelector(true);
      return false;
    }
    return true;
  };

  // Calculate cartons and CBM based on quantity
  const calculateShipping = (quantity: number, productName: string) => {
    const product = getProductDetails(productName);
    if (!product) return { 
      cartons: 0, 
      cbm: 0, 
      totalGrossWeight: 0, 
      totalNetWeight: 0,
      isExactCartons: true,
      suggestedLower: 0,
      suggestedHigher: 0
    };
    
    // Calculate actual cartons (may be decimal)
    const exactCartons = quantity / product.pcsPerCarton;
    const cartons = exactCartons;
    const isExactCartons = Number.isInteger(exactCartons);
    
    // Calculate suggested quantities
    const cartonsLower = Math.floor(exactCartons);
    const cartonsHigher = Math.ceil(exactCartons);
    const suggestedLower = cartonsLower * product.pcsPerCarton;
    const suggestedHigher = cartonsHigher * product.pcsPerCarton;
    
    // Use ceiling for shipping calculations (you need full cartons)
    const fullCartons = Math.ceil(quantity / product.pcsPerCarton);
    const cbm = (fullCartons * product.cbmPerCarton).toFixed(3);
    const totalGrossWeight = (fullCartons * product.cartonGrossWeight).toFixed(2);
    const totalNetWeight = (fullCartons * product.cartonNetWeight).toFixed(2);
    
    return { 
      cartons, 
      cbm, 
      totalGrossWeight, 
      totalNetWeight,
      isExactCartons,
      suggestedLower,
      suggestedHigher
    };
  };

  // Get recommended products based on subcategory
  const getRecommendedProducts = (subcategoryName: string) => {
    return productRecommendationsMap[subcategoryName] || defaultProducts;
  };

  /* 
   * OLD PRODUCT RECOMMENDATIONS DATA REMOVED
   * Data moved to: /data/header/recommendedProductsData.ts
   * This section previously contained ~450 lines of product mapping data (lines 170-622)
   * The data has been extracted to improve file maintainability
   */
  
  const _REMOVED_OLD_FUNCTION = () => {
    // Old implementation with inline productMap data was here
    const productMap_REMOVED: any = {
      // Appliances
      'Appliance Parts & Accessories': [
        { name: 'Water Filter Replacement', price: '$39', image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Appliance Cleaner Kit', price: '$24', image: 'https://images.unsplash.com/photo-1653548147256-f1ba6da5f446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsaWFuY2UlMjBwYXJ0cyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'New' }
      ],
      'Appliance Promotions': [
        { name: 'Kitchen Suite Bundle', price: '$2,499', image: 'https://images.unsplash.com/photo-1708915965975-2a950db0e215?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwYXBwbGlhbmNlJTIwcHJvbW90aW9ufGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Hot Deal' },
        { name: 'Laundry Pair Special', price: '$1,799', image: 'https://images.unsplash.com/photo-1708915965975-2a950db0e215?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwYXBwbGlhbmNlJTIwcHJvbW90aW9ufGVufDF8fHx8MTc2MTIwMjE2N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Limited' }
      ],
      'Cooktops': [
        { name: 'Gas Cooktop 5 Burner', price: '$599', image: 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Induction Cooktop', price: '$799', image: 'https://images.unsplash.com/photo-1739598752069-6806ce5d762a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBjb29rdG9wJTIwc3RvdmV8ZW58MXx8fHwxNzYxMjAyMTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      'Dishwashers': [
        { name: 'Built-In Dishwasher', price: '$649', image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Quiet Dishwasher', price: '$899', image: 'https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaXNod2FzaGVyfGVufDF8fHx8MTc2MTIwMjE2OHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      'Freezers & Ice Makers': [
        { name: 'Chest Freezer 15 Cu Ft', price: '$549', image: 'https://images.unsplash.com/photo-1730000855881-2e0f5705539a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVlemVyJTIwaWNlJTIwbWFrZXJ8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Ice Maker Machine', price: '$299', image: 'https://images.unsplash.com/photo-1730000855881-2e0f5705539a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVlemVyJTIwaWNlJTIwbWFrZXJ8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'New' }
      ],
      'Garbage Disposals & Accessories': [
        { name: 'Continuous Feed Disposal', price: '$149', image: 'https://images.unsplash.com/photo-1706614452471-43b99150df3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJiYWdlJTIwZGlzcG9zYWwlMjBzaW5rfGVufDF8fHx8MTc2MTIwMjE2OXww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Heavy Duty Disposal', price: '$229', image: 'https://images.unsplash.com/photo-1706614452471-43b99150df3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJiYWdlJTIwZGlzcG9zYWwlMjBzaW5rfGVufDF8fHx8MTc2MTIwMjE2OXww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      'Heating, Cooling & Air Quality': [
        { name: 'HEPA Air Purifier', price: '$249', image: 'https://images.unsplash.com/photo-1756575433595-c2f87d10e5f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXIlMjBwdXJpZmllciUyMHF1YWxpdHl8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Smart Dehumidifier', price: '$329', image: 'https://images.unsplash.com/photo-1756575433595-c2f87d10e5f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXIlMjBwdXJpZmllciUyMHF1YWxpdHl8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'New' }
      ],
      'Kitchen Packages': [
        { name: '4-Piece Kitchen Suite', price: '$3,299', image: 'https://images.unsplash.com/photo-1740803292349-c7e53f7125b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcGFja2FnZSUyMGFwcGxpYW5jZXN8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Hot Deal' },
        { name: 'Complete Kitchen Bundle', price: '$4,999', image: 'https://images.unsplash.com/photo-1740803292349-c7e53f7125b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcGFja2FnZSUyMGFwcGxpYW5jZXN8ZW58MXx8fHwxNzYxMjAyMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      'Microwaves': [
        { name: 'Over-Range Microwave', price: '$399', image: 'https://images.unsplash.com/photo-1759398430338-8057876edf61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWNyb3dhdmUlMjBvdmVuJTIwY291bnRlcnRvcHxlbnwxfHx8fDE3NjEyMDIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Countertop Microwave', price: '$149', image: 'https://images.unsplash.com/photo-1759398430338-8057876edf61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWNyb3dhdmUlMjBvdmVuJTIwY291bnRlcnRvcHxlbnwxfHx8fDE3NjEyMDIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' }
      ],
      'Ranges': [
        { name: 'Gas Range 30 inch', price: '$899', image: 'https://images.unsplash.com/photo-1692089913251-445cb32eb8dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcmFuZ2UlMjBzdG92ZXxlbnwxfHx8fDE3NjEyMDIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Dual Fuel Range', price: '$1,599', image: 'https://images.unsplash.com/photo-1692089913251-445cb32eb8dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcmFuZ2UlMjBzdG92ZXxlbnwxfHx8fDE3NjEyMDIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      // Bath
      'Bathtubs & Showers': [
        {
          name: 'Modern Rainfall Shower System',
          price: '$459',
          image: 'https://images.unsplash.com/photo-1682888818696-906287d759f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzaG93ZXIlMjBiYXRocm9vbXxlbnwxfHx8fDE3NjEyMDEyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Hot Deal'
        },
        {
          name: 'Luxury Freestanding Bathtub',
          price: '$1,299',
          image: 'https://images.unsplash.com/photo-1760564019103-81cd3c225cd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiYXRodHViJTIwc3BhfGVufDF8fHx8MTc2MTIwMTIzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'New'
        }
      ],
      'Bathroom Vanities': [
        {
          name: 'Double Sink Vanity Set',
          price: '$899',
          image: 'https://images.unsplash.com/photo-1758548157466-7c454382035a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHZhbml0eSUyMG1vZGVybnxlbnwxfHx8fDE3NjExNDQwMDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Best Seller'
        },
        {
          name: 'Modern Chrome Faucet',
          price: '$189',
          image: 'https://images.unsplash.com/photo-1758548157319-ec649ce00f1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHJvbWUlMjBmYXVjZXQlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjAxMjMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Hot Deal'
        }
      ],
      'Toilets & Bidets': [
        {
          name: 'Smart Toilet with Bidet',
          price: '$1,499',
          image: 'https://images.unsplash.com/photo-1563204719-44395a035bb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0b2lsZXQlMjB3aGl0ZXxlbnwxfHx8fDE3NjEyMDEyMzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Premium'
        },
        {
          name: 'Water-Saving Dual Flush Toilet',
          price: '$329',
          image: 'https://images.unsplash.com/photo-1730635249891-7fead20f92f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2lsZXQlMjBiYXRocm9vbXxlbnwxfHx8fDE3NjExOTg4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Eco-Friendly'
        }
      ],
      'Bathroom Sinks': [
        { name: 'Undermount Sink', price: '$179', image: 'https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHNpbmslMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjAyMTcxfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Vessel Sink', price: '$249', image: 'https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHNpbmslMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjAyMTcxfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Modern' }
      ],
      'Faucets & Fixtures': [
        { name: 'Waterfall Faucet', price: '$199', image: 'https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGZhdWNldCUyMG1vZGVybnxlbnwxfHx8fDE3NjExOTg4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Rainfall Shower Head', price: '$129', image: 'https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGZhdWNldCUyMG1vZGVybnxlbnwxfHx8fDE3NjExOTg4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Hot Deal' }
      ],
      'Shower Doors & Enclosures': [
        { name: 'Frameless Shower Door', price: '$799', image: 'https://images.unsplash.com/photo-1630699144420-d7bc4e2cee8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG93ZXIlMjBkb29yJTIwZ2xhc3N8ZW58MXx8fHwxNzYxMjAyMTcxfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' },
        { name: 'Sliding Shower Door', price: '$549', image: 'https://images.unsplash.com/photo-1630699144420-d7bc4e2cee8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG93ZXIlMjBkb29yJTIwZ2xhc3N8ZW58MXx8fHwxNzYxMjAyMTcxfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' }
      ],
      'Bathroom Accessories': [
        { name: 'Towel Bar Set', price: '$79', image: 'https://images.unsplash.com/photo-1745794524727-5a6b4a8cc4a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGFjY2Vzc29yaWVzJTIwdG93ZWx8ZW58MXx8fHwxNzYxMjAyMTcxfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' },
        { name: 'Shower Caddy', price: '$45', image: 'https://images.unsplash.com/photo-1745794524727-5a6b4a8cc4a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGFjY2Vzc29yaWVzJTIwdG93ZWx8ZW58MXx8fHwxNzYxMjAyMTcxfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' }
      ],
      'Mirrors & Medicine Cabinets': [
        { name: 'LED Lighted Mirror', price: '$349', image: 'https://images.unsplash.com/photo-1721824320387-4ec47af1ea9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMG1pcnJvciUyMGNhYmluZXR8ZW58MXx8fHwxNzYxMjAyMTcyfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Modern' },
        { name: 'Medicine Cabinet', price: '$229', image: 'https://images.unsplash.com/photo-1721824320387-4ec47af1ea9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMG1pcnJvciUyMGNhYmluZXR8ZW58MXx8fHwxNzYxMjAyMTcyfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' }
      ],
      'Bathroom Lighting': [
        { name: 'Vanity Light 3-Light', price: '$139', image: 'https://images.unsplash.com/photo-1758548157466-7c454382035a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGxpZ2h0aW5nJTIwdmFuaXR5fGVufDF8fHx8MTc2MTIwMjE3Mnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Bath Bar Light', price: '$89', image: 'https://images.unsplash.com/photo-1758548157466-7c454382035a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGxpZ2h0aW5nJTIwdmFuaXR5fGVufDF8fHx8MTc2MTIwMjE3Mnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' }
      ],
      'Bathroom Ventilation': [
        { name: 'Exhaust Fan with Light', price: '$179', image: 'https://images.unsplash.com/photo-1611077017686-bcf05c556838?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGV4aGF1c3QlMjBmYW58ZW58MXx8fHwxNzYxMjAyMTcyfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Quiet Ventilation Fan', price: '$129', image: 'https://images.unsplash.com/photo-1611077017686-bcf05c556838?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGV4aGF1c3QlMjBmYW58ZW58MXx8fHwxNzYxMjAyMTcyfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' }
      ],
      // Building Materials
      'Lumber & Composites': [
        {
          name: 'Premium Treated Lumber',
          price: '$45/board',
          image: 'https://images.unsplash.com/photo-1598954385478-53e5b3c970ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdW1iZXIlMjB3b29kJTIwc3RhY2t8ZW58MXx8fHwxNzYxMjAxMjMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Quality'
        },
        {
          name: 'Composite Decking Boards',
          price: '$89/board',
          image: 'https://images.unsplash.com/photo-1586784914382-b48f9a434920?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdW1iZXIlMjB3b29kJTIwbWF0ZXJpYWxzfGVufDF8fHx8MTc2MTE5ODg1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Durable'
        }
      ],
      'Plywood & Sheathing': [
        {
          name: 'Premium Plywood Sheets',
          price: '$39/sheet',
          image: 'https://images.unsplash.com/photo-1681752972950-6229ca099fbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHl3b29kJTIwYm9hcmRzJTIwc3RhY2t8ZW58MXx8fHwxNzYxMjAxMjMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Best Value'
        },
        {
          name: 'OSB Sheathing Panels',
          price: '$29/sheet',
          image: 'https://images.unsplash.com/photo-1586784914382-b48f9a434920?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdW1iZXIlMjB3b29kJTIwbWF0ZXJpYWxzfGVufDF8fHx8MTc2MTE5ODg1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          badge: 'Popular'
        }
      ],
      'Drywall & Accessories': [
        { name: '4x8 Drywall Panels', price: '$12/sheet', image: 'https://images.unsplash.com/photo-1589572394490-771aa22db633?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcnl3YWxsJTIwY29uc3RydWN0aW9uJTIwbWF0ZXJpYWx8ZW58MXx8fHwxNzYxMjAwMDMwfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' },
        { name: 'Joint Compound 5-Gallon', price: '$24', image: 'https://images.unsplash.com/photo-1589572394490-771aa22db633?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcnl3YWxsJTIwY29uc3RydWN0aW9uJTIwbWF0ZXJpYWx8ZW58MXx8fHwxNzYxMjAwMDMwfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' }
      ],
      'Insulation': [
        { name: 'Fiberglass Insulation R-13', price: '$45/roll', image: 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN1bGF0aW9uJTIwbWF0ZXJpYWwlMjBmb2FtfGVufDF8fHx8MTc2MTIwMDAzMHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Foam Board Insulation', price: '$32/sheet', image: 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN1bGF0aW9uJTIwbWF0ZXJpYWwlMjBmb2FtfGVufDF8fHx8MTc2MTIwMDAzMHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Energy Saving' }
      ],
      'Roofing Materials': [
        { name: 'Asphalt Shingles Bundle', price: '$89/bundle', image: 'https://images.unsplash.com/photo-1724806157596-cd7f5d86d7ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb29maW5nJTIwc2hpbmdsZXMlMjBtYXRlcmlhbHN8ZW58MXx8fHwxNzYxMjAwMDMwfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Durable' },
        { name: 'Metal Roofing Panels', price: '$129/panel', image: 'https://images.unsplash.com/photo-1724806157596-cd7f5d86d7ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb29maW5nJTIwc2hpbmdsZXMlMjBtYXRlcmlhbHN8ZW58MXx8fHwxNzYxMjAwMDMwfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Long Lasting' }
      ],
      'Siding & Trim': [
        { name: 'Vinyl Siding Panel', price: '$49/panel', image: 'https://images.unsplash.com/photo-1702308632277-ab0ccf044d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHNpZGluZyUyMGhvdXNlfGVufDF8fHx8MTc2MTIwMjE3NHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Fiber Cement Siding', price: '$79/panel', image: 'https://images.unsplash.com/photo-1702308632277-ab0ccf044d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHNpZGluZyUyMGhvdXNlfGVufDF8fHx8MTc2MTIwMjE3NHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      'Concrete & Cement': [
        { name: 'Ready-Mix Concrete 80lb', price: '$5.99/bag', image: 'https://images.unsplash.com/photo-1633677095081-492aad9530d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jcmV0ZSUyMGNlbWVudCUyMG1peHxlbnwxfHx8fDE3NjEyMDIxNzl8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' },
        { name: 'Mortar Mix 60lb', price: '$8.99/bag', image: 'https://images.unsplash.com/photo-1633677095081-492aad9530d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jcmV0ZSUyMGNlbWVudCUyMG1peHxlbnwxfHx8fDE3NjEyMDIxNzl8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Pro Grade' }
      ],
      'Metal Building Materials': [
        { name: 'Steel Studs 16-Gauge', price: '$12/stud', image: 'https://images.unsplash.com/photo-1758609554541-914a354c1b43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXRhbCUyMGJ1aWxkaW5nJTIwbWF0ZXJpYWxzfGVufDF8fHx8MTc2MTIwMjE3OHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Commercial' },
        { name: 'Corrugated Metal Panels', price: '$45/panel', image: 'https://images.unsplash.com/photo-1758609554541-914a354c1b43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXRhbCUyMGJ1aWxkaW5nJTIwbWF0ZXJpYWxzfGVufDF8fHx8MTc2MTIwMjE3OHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Durable' }
      ],
      'Gutters & Drainage': [
        { name: 'Vinyl Gutter 10ft', price: '$14/section', image: 'https://images.unsplash.com/photo-1758997508217-eec3367c268c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxndXR0ZXIlMjBkcmFpbmFnZSUyMHN5c3RlbXxlbnwxfHx8fDE3NjEyMDIxNzl8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' },
        { name: 'Aluminum Gutter System', price: '$24/section', image: 'https://images.unsplash.com/photo-1758997508217-eec3367c268c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxndXR0ZXIlMjBkcmFpbmFnZSUyMHN5c3RlbXxlbnwxfHx8fDE3NjEyMDIxNzl8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' }
      ],
      'Weatherproofing & Flashing': [
        { name: 'House Wrap Roll', price: '$89/roll', image: 'https://images.unsplash.com/photo-1702308632277-ab0ccf044d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHNpZGluZyUyMGhvdXNlfGVufDF8fHx8MTc2MTIwMjE3NHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Essential' },
        { name: 'Flashing Tape', price: '$24/roll', image: 'https://images.unsplash.com/photo-1702308632277-ab0ccf044d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHNpZGluZyUyMGhvdXNlfGVufDF8fHx8MTc2MTIwMjE3NHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Waterproof' }
      ],
      'Living Room Furniture': [
        { name: 'Modern Sectional Sofa', price: '$1,499', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZpbmclMjByb29tJTIwc29mYXxlbnwxfHx8fDE3NjEyMDAwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Leather Recliner', price: '$799', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZpbmclMjByb29tJTIwc29mYXxlbnwxfHx8fDE3NjEyMDAwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Comfort' }
      ],
      'Bedroom Furniture': [
        { name: 'Queen Platform Bed', price: '$899', image: 'https://images.unsplash.com/photo-1680503146454-04ac81a63550?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWRyb29tJTIwZnVybml0dXJlJTIwYmVkfGVufDF8fHx8MTc2MTE5MzQzNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: '6-Drawer Dresser', price: '$649', image: 'https://images.unsplash.com/photo-1680503146454-04ac81a63550?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWRyb29tJTIwZnVybml0dXJlJTIwYmVkfGVufDF8fHx8MTc2MTE5MzQzNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Value' }
      ],
      'Dining Room Furniture': [
        { name: '7-Piece Dining Set', price: '$1,299', image: 'https://images.unsplash.com/photo-1547062200-f195b1c77e30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaW5pbmclMjB0YWJsZSUyMGNoYWlyc3xlbnwxfHx8fDE3NjExMjgzMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Complete Set' },
        { name: 'Bar Stool Set of 2', price: '$249', image: 'https://images.unsplash.com/photo-1547062200-f195b1c77e30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaW5pbmclMjB0YWJsZSUyMGNoYWlyc3xlbnwxfHx8fDE3NjExMjgzMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Modern' }
      ],
      'Home Decor': [
        { name: 'Decorative Pillows Set', price: '$59', image: 'https://images.unsplash.com/photo-1535056889777-5821f7c5b4ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZGVjb3IlMjB3YWxsfGVufDF8fHx8MTc2MTIwMjE4MHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Trendy' },
        { name: 'Ceramic Vase Collection', price: '$89', image: 'https://images.unsplash.com/photo-1535056889777-5821f7c5b4ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZGVjb3IlMjB3YWxsfGVufDF8fHx8MTc2MTIwMjE4MHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Elegant' }
      ],
      'Rugs & Area Carpets': [
        { name: '8x10 Area Rug', price: '$349', image: 'https://images.unsplash.com/photo-1561578428-5d58d0d965ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmVhJTIwcnVnJTIwY2FycGV0fGVufDF8fHx8MTc2MTIwMDAwMnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Runner Rug 3x10', price: '$149', image: 'https://images.unsplash.com/photo-1561578428-5d58d0d965ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmVhJTIwcnVnJTIwY2FycGV0fGVufDF8fHx8MTc2MTIwMDAwMnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' }
      ],
      'Window Treatments': [
        { name: 'Blackout Curtains Pair', price: '$79', image: 'https://images.unsplash.com/photo-1544279772-ca624c6c6200?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBjdXJ0YWlucyUyMGJsaW5kc3xlbnwxfHx8fDE3NjEyMDIxODF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Energy Saving' },
        { name: 'Cordless Blinds', price: '$99', image: 'https://images.unsplash.com/photo-1544279772-ca624c6c6200?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBjdXJ0YWlucyUyMGJsaW5kc3xlbnwxfHx8fDE3NjEyMDIxODF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Child Safe' }
      ],
      'Wall Art & Mirrors': [
        { name: 'Framed Canvas Art Set', price: '$179', image: 'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWxsJTIwYXJ0JTIwZnJhbWVkfGVufDF8fHx8MTc2MTIwMjE4Mnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Gallery Ready' },
        { name: 'Round Wall Mirror 30"', price: '$129', image: 'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWxsJTIwYXJ0JTIwZnJhbWVkfGVufDF8fHx8MTc2MTIwMjE4Mnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Modern' }
      ],
      'Lighting Fixtures': [
        { name: 'Crystal Chandelier', price: '$499', image: 'https://images.unsplash.com/photo-1711499434981-4ffde8184927?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFuZGVsaWVyJTIwcGVuZGFudCUyMGxpZ2h0c3xlbnwxfHx8fDE3NjEyMDIxODJ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Elegant' },
        { name: 'Modern Pendant Light', price: '$149', image: 'https://images.unsplash.com/photo-1711499434981-4ffde8184927?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFuZGVsaWVyJTIwcGVuZGFudCUyMGxpZ2h0c3xlbnwxfHx8fDE3NjEyMDIxODJ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' }
      ],
      'Decorative Accents': [
        { name: 'Decorative Bowl Set', price: '$69', image: 'https://images.unsplash.com/photo-1535056889777-5821f7c5b4ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZGVjb3IlMjB3YWxsfGVufDF8fHx8MTc2MTIwMjE4MHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Handcrafted' },
        { name: 'Metal Sculpture', price: '$199', image: 'https://images.unsplash.com/photo-1535056889777-5821f7c5b4ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZGVjb3IlMjB3YWxsfGVufDF8fHx8MTc2MTIwMjE4MHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Art Piece' }
      ],
      'Seasonal Decor': [
        { name: 'Holiday Wreath 24"', price: '$49', image: 'https://images.unsplash.com/photo-1535056889777-5821f7c5b4ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZGVjb3IlMjB3YWxsfGVufDF8fHx8MTc2MTIwMjE4MHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Seasonal' },
        { name: 'Outdoor LED Decorations', price: '$89', image: 'https://images.unsplash.com/photo-1535056889777-5821f7c5b4ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZGVjb3IlMjB3YWxsfGVufDF8fHx8MTc2MTIwMjE4MHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' }
      ],
      'Wire & Cable': [
        { name: 'Electrical Wire 250ft', price: '$89', image: 'https://images.unsplash.com/photo-1543006623-e23032c9b70e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyZSUyMGNhYmxlfGVufDF8fHx8MTc2MTEyOTI2Nnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Pro Grade' },
        { name: 'Extension Cord 25ft', price: '$19', image: 'https://images.unsplash.com/photo-1543006623-e23032c9b70e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyZSUyMGNhYmxlfGVufDF8fHx8MTc2MTEyOTI2Nnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' }
      ],
      'Hardwood Flooring': [
        { name: 'Oak Hardwood 20sqft', price: '$89', image: 'https://images.unsplash.com/photo-1633356423472-c5ebc7ea627e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXJkd29vZCUyMGZsb29yaW5nJTIwd29vZHxlbnwxfHx8fDE3NjEyMDMwMTV8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' },
        { name: 'Engineered Hardwood', price: '$65/sqft', image: 'https://images.unsplash.com/photo-1633356423472-c5ebc7ea627e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXJkd29vZCUyMGZsb29yaW5nJTIwd29vZHxlbnwxfHx8fDE3NjEyMDMwMTV8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' }
      ],
      'Laminate Flooring': [
        { name: 'AC4 Laminate 25sqft', price: '$45', image: 'https://images.unsplash.com/photo-1666899950567-224dc84adf89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW1pbmF0ZSUyMGZsb29yaW5nJTIwbW9kZXJufGVufDF8fHx8MTc2MTIwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' },
        { name: 'Waterproof Laminate', price: '$59/sqft', image: 'https://images.unsplash.com/photo-1666899950567-224dc84adf89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW1pbmF0ZSUyMGZsb29yaW5nJTIwbW9kZXJufGVufDF8fHx8MTc2MTIwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Waterproof' }
      ],
      'Vinyl & Resilient Flooring': [
        { name: 'Luxury Vinyl Plank', price: '$39/sqft', image: 'https://images.unsplash.com/photo-1604410880766-737427d11b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMGZsb29yaW5nJTIwcGxhbmt8ZW58MXx8fHwxNzYxMjAzMDE2fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Vinyl Sheet Roll', price: '$29/sqft', image: 'https://images.unsplash.com/photo-1604410880766-737427d11b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMGZsb29yaW5nJTIwcGxhbmt8ZW58MXx8fHwxNzYxMjAzMDE2fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Economic' }
      ],
      'Tile Flooring': [
        { name: 'Ceramic Tile 10sqft', price: '$35', image: 'https://images.unsplash.com/photo-1604589977707-d161da2edb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aWxlJTIwZmxvb3JpbmclMjBjZXJhbWljfGVufDF8fHx8MTc2MTIwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Classic' },
        { name: 'Porcelain Tile', price: '$49/sqft', image: 'https://images.unsplash.com/photo-1604589977707-d161da2edb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aWxlJTIwZmxvb3JpbmclMjBjZXJhbWljfGVufDF8fHx8MTc2MTIwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      'Door Hardware & Locks': [
        { name: 'Smart Door Lock', price: '$199', image: 'https://images.unsplash.com/photo-1758348613707-96ffd2baa14d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwbG9jayUyMGhhcmR3YXJlfGVufDF8fHx8MTc2MTIwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Smart' },
        { name: 'Deadbolt Lock Set', price: '$45', image: 'https://images.unsplash.com/photo-1758348613707-96ffd2baa14d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwbG9jayUyMGhhcmR3YXJlfGVufDF8fHx8MTc2MTIwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Secure' }
      ],
      'Cabinet Hardware': [
        { name: 'Cabinet Pulls 10pk', price: '$29', image: 'https://images.unsplash.com/photo-1729912316735-fbaffc8ccc47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJpbmV0JTIwaGFyZHdhcmUlMjBwdWxsc3xlbnwxfHx8fDE3NjExMTIxMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value Pack' },
        { name: 'Modern Cabinet Knobs', price: '$19', image: 'https://images.unsplash.com/photo-1729912316735-fbaffc8ccc47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJpbmV0JTIwaGFyZHdhcmUlMjBwdWxsc3xlbnwxfHx8fDE3NjExMTIxMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Stylish' }
      ],
      'Thermostats & Controls': [
        { name: 'Smart Thermostat WiFi', price: '$179', image: 'https://images.unsplash.com/photo-1747224317348-887f7ed01d34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHRoZXJtb3N0YXQlMjBob21lfGVufDF8fHx8MTc2MTIwMzAyMnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Smart' },
        { name: 'Programmable Thermostat', price: '$89', image: 'https://images.unsplash.com/photo-1747224317348-887f7ed01d34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHRoZXJtb3N0YXQlMjBob21lfGVufDF8fHx8MTc2MTIwMzAyMnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Energy Saving' }
      ],
      'Ceiling Fans': [
        { name: '52" Modern Ceiling Fan', price: '$149', image: 'https://images.unsplash.com/photo-1659720879195-d5a108231648?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWlsaW5nJTIwZmFuJTIwbW9kZXJufGVufDF8fHx8MTc2MTIwMDAxMHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Smart Ceiling Fan LED', price: '$229', image: 'https://images.unsplash.com/photo-1659720879195-d5a108231648?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWlsaW5nJTIwZmFuJTIwbW9kZXJufGVufDF8fHx8MTc2MTIwMDAxMHww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Smart' }
      ],
      'Kitchen Cabinets': [
        { name: 'Base Cabinet 24"', price: '$299', image: 'https://images.unsplash.com/photo-1686023858213-9653d3248fdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwY2FiaW5ldHMlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMTk4ODU5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Quality' },
        { name: 'Wall Cabinet Set', price: '$449', image: 'https://images.unsplash.com/photo-1686023858213-9653d3248fdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwY2FiaW5ldHMlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMTk4ODU5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Complete' }
      ],
      'Countertops': [
        { name: 'Granite Countertop', price: '$89/sqft', image: 'https://images.unsplash.com/photo-1637271325753-123cd629f148?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFuaXRlJTIwY291bnRlcnRvcCUyMGtpdGNoZW58ZW58MXx8fHwxNzYxMjAwMDAxfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' },
        { name: 'Quartz Countertop', price: '$79/sqft', image: 'https://images.unsplash.com/photo-1637271325753-123cd629f148?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFuaXRlJTIwY291bnRlcnRvcCUyMGtpdGNoZW58ZW58MXx8fHwxNzYxMjAwMDAxfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Durable' }
      ],
      'Kitchen Sinks': [
        { name: 'Stainless Steel Sink', price: '$199', image: 'https://images.unsplash.com/photo-1759691337957-ebc9ed54dc44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwc2luayUyMHN0YWlubGVzc3xlbnwxfHx8fDE3NjEyMDMwMTh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Farmhouse Sink 36"', price: '$449', image: 'https://images.unsplash.com/photo-1759691337957-ebc9ed54dc44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwc2luayUyMHN0YWlubGVzc3xlbnwxfHx8fDE3NjEyMDMwMTh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Stylish' }
      ],
      'Kitchen Faucets': [
        { name: 'Pull-Down Faucet', price: '$159', image: 'https://images.unsplash.com/photo-1759691337957-ebc9ed54dc44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwc2luayUyMHN0YWlubGVzc3xlbnwxfHx8fDE3NjEyMDMwMTh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Touchless Faucet', price: '$249', image: 'https://images.unsplash.com/photo-1759691337957-ebc9ed54dc44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwc2luayUyMHN0YWlubGVzc3xlbnwxfHx8fDE3NjEyMDMwMTh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Smart' }
      ],
      'Lawn Mowers': [
        { name: 'Push Mower 21"', price: '$299', image: 'https://images.unsplash.com/photo-1590820292118-e256c3ac2676?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXduJTIwbW93ZXIlMjBncmFzc3xlbnwxfHx8fDE3NjEyMDAwMTF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Riding Mower 42"', price: '$1,799', image: 'https://images.unsplash.com/photo-1590820292118-e256c3ac2676?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXduJTIwbW93ZXIlMjBncmFzc3xlbnwxfHx8fDE3NjEyMDAwMTF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      'Garden Tools': [
        { name: 'Garden Tool Set 5pc', price: '$49', image: 'https://images.unsplash.com/photo-1624598560850-cea0cb314db8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjB0b29scyUyMHNob3ZlbHxlbnwxfHx8fDE3NjEyMDAwMTN8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Essential' },
        { name: 'Premium Pruning Set', price: '$89', image: 'https://images.unsplash.com/photo-1624598560850-cea0cb314db8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjB0b29scyUyMHNob3ZlbHxlbnwxfHx8fDE3NjEyMDAwMTN8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Professional' }
      ],
      'Pressure Washers': [
        { name: 'Electric Pressure Washer', price: '$199', image: 'https://images.unsplash.com/photo-1718152421680-d1580e843cc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVzc3VyZSUyMHdhc2hlciUyMGNsZWFuaW5nfGVufDF8fHx8MTc2MTIwMzAxOXww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Gas Pressure Washer', price: '$399', image: 'https://images.unsplash.com/photo-1718152421680-d1580e843cc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVzc3VyZSUyMHdhc2hlciUyMGNsZWFuaW5nfGVufDF8fHx8MTc2MTIwMzAxOXww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Heavy Duty' }
      ],
      'Ceiling Lights': [
        { name: 'LED Flush Mount', price: '$79', image: 'https://images.unsplash.com/photo-1700463108432-08a5b79189a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWlsaW5nJTIwbGlnaHQlMjBmaXh0dXJlfGVufDF8fHx8MTc2MTEyMTk4N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Modern' },
        { name: 'Semi-Flush Ceiling Light', price: '$129', image: 'https://images.unsplash.com/photo-1700463108432-08a5b79189a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZWlsaW5nJTIwbGlnaHQlMjBmaXh0dXJlfGVufDF8fHx8MTc2MTEyMTk4N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Elegant' }
      ],
      'Chandeliers & Pendants': [
        { name: 'Crystal Chandelier 6-Light', price: '$499', image: 'https://images.unsplash.com/photo-1711499434981-4ffde8184927?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFuZGVsaWVyJTIwcGVuZGFudCUyMGxpZ2h0c3xlbnwxfHx8fDE3NjEyMDIxODJ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Luxury' },
        { name: 'Modern Pendant 3-Pack', price: '$179', image: 'https://images.unsplash.com/photo-1711499434981-4ffde8184927?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFuZGVsaWVyJTIwcGVuZGFudCUyMGxpZ2h0c3xlbnwxfHx8fDE3NjEyMDIxODJ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Trendy' }
      ],
      'Patio Furniture': [
        { name: '5-Piece Patio Set', price: '$799', image: 'https://images.unsplash.com/photo-1661024768242-5fd7c8f1e3c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwcGF0aW8lMjBmdXJuaXR1cmV8ZW58MXx8fHwxNzYxMjAyNzcyfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Complete Set' },
        { name: 'Lounge Chair Set', price: '$399', image: 'https://images.unsplash.com/photo-1661024768242-5fd7c8f1e3c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwcGF0aW8lMjBmdXJuaXR1cmV8ZW58MXx8fHwxNzYxMjAyNzcyfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Comfort' }
      ],
      'Grills & Outdoor Cooking': [
        { name: 'Gas Grill 4-Burner', price: '$599', image: 'https://images.unsplash.com/photo-1689011266277-f7c82c6f4ce4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBncmlsbCUyMGJicXxlbnwxfHx8fDE3NjExODMzNjZ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Popular' },
        { name: 'Pellet Grill Smoker', price: '$799', image: 'https://images.unsplash.com/photo-1689011266277-f7c82c6f4ce4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXMlMjBncmlsbCUyMGJicXxlbnwxfHx8fDE3NjExODMzNjZ8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' }
      ],
      'Interior Paint': [
        { name: 'Premium Interior Paint', price: '$45/gal', image: 'https://images.unsplash.com/photo-1727786467215-116f0dbb9696?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMHBhaW50JTIwd2FsbHxlbnwxfHx8fDE3NjEyMDMwMjF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Premium' },
        { name: 'One-Coat Paint & Primer', price: '$39/gal', image: 'https://images.unsplash.com/photo-1727786467215-116f0dbb9696?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMHBhaW50JTIwd2FsbHxlbnwxfHx8fDE3NjEyMDMwMjF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' }
      ],
      'Exterior Paint': [
        { name: 'Exterior House Paint', price: '$49/gal', image: 'https://images.unsplash.com/photo-1727786467215-116f0dbb9696?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMHBhaW50JTIwd2FsbHxlbnwxfHx8fDE3NjEyMDMwMjF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Weather Resistant' },
        { name: 'Deck & Fence Stain', price: '$35/gal', image: 'https://images.unsplash.com/photo-1727786467215-116f0dbb9696?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMHBhaW50JTIwd2FsbHxlbnwxfHx8fDE3NjEyMDMwMjF8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Protective' }
      ],
      'Paint Brushes & Rollers': [
        { name: 'Pro Paint Brush Set', price: '$29', image: 'https://images.unsplash.com/photo-1674376360441-356d1d9b48eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludCUyMGJydXNoJTIwcm9sbGVyfGVufDF8fHx8MTc2MTIwMzAyMXww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Professional' },
        { name: 'Paint Roller Kit', price: '$19', image: 'https://images.unsplash.com/photo-1674376360441-356d1d9b48eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludCUyMGJydXNoJTIwcm9sbGVyfGVufDF8fHx8MTc2MTIwMzAyMXww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Complete' }
      ],
      
      // Storage & Organization
      'Shelving Units': [
        { name: 'Wire Shelving 5-Tier', price: '$89', image: 'https://images.unsplash.com/photo-1758609554326-ebf110a4c142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbHZpbmclMjB1bml0fGVufDF8fHx8MTc2MTIwMDAyM3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Versatile' },
        { name: 'Wood Shelving Unit', price: '$129', image: 'https://images.unsplash.com/photo-1758609554326-ebf110a4c142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbHZpbmclMjB1bml0fGVufDF8fHx8MTc2MTIwMDAyM3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Sturdy' }
      ],
      'Storage Cabinets': [
        { name: 'Garage Cabinet Set', price: '$599', image: 'https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJhZ2UlMjBjYWJpbmV0JTIwb3JnYW5pemF0aW9ufGVufDF8fHx8MTc2MTIwNDA3N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Complete' },
        { name: 'Utility Cabinet', price: '$299', image: 'https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJhZ2UlMjBjYWJpbmV0JTIwb3JnYW5pemF0aW9ufGVufDF8fHx8MTc2MTIwNDA3N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Spacious' }
      ],
      'Closet Organizers': [
        { name: 'Closet System Kit', price: '$249', image: 'https://images.unsplash.com/photo-1662986788528-0851badbf423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG9zZXQlMjBvcmdhbml6ZXIlMjBzeXN0ZW18ZW58MXx8fHwxNzYxMjAwMDIzfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Customizable' },
        { name: 'Shoe Rack Organizer', price: '$45', image: 'https://images.unsplash.com/photo-1662986788528-0851badbf423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG9zZXQlMjBvcmdhbml6ZXIlMjBzeXN0ZW18ZW58MXx8fHwxNzYxMjAwMDIzfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Space Saver' }
      ],
      'Garage Storage': [
        { name: 'Overhead Storage Rack', price: '$179', image: 'https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJhZ2UlMjBjYWJpbmV0JTIwb3JnYW5pemF0aW9ufGVufDF8fHx8MTc2MTIwNDA3N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Heavy Duty' },
        { name: 'Wall Storage System', price: '$249', image: 'https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJhZ2UlMjBjYWJpbmV0JTIwb3JnYW5pemF0aW9ufGVufDF8fHx8MTc2MTIwNDA3N3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Versatile' }
      ],
      'Bins & Containers': [
        { name: 'Storage Totes 6pk', price: '$39', image: 'https://images.unsplash.com/photo-1672855493631-f8fb78d8e745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwYmlucyUyMGNvbnRhaW5lcnN8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Stackable' },
        { name: 'Drawer Organizer Set', price: '$24', image: 'https://images.unsplash.com/photo-1672855493631-f8fb78d8e745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwYmlucyUyMGNvbnRhaW5lcnN8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Neat' }
      ],
      'Wall-Mounted Storage': [
        { name: 'Wall Shelf Set', price: '$59', image: 'https://images.unsplash.com/photo-1758609554326-ebf110a4c142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbHZpbmclMjB1bml0fGVufDF8fHx8MTc2MTIwMDAyM3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Modern' },
        { name: 'Pegboard System', price: '$45', image: 'https://images.unsplash.com/photo-1758609554326-ebf110a4c142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbHZpbmclMjB1bml0fGVufDF8fHx8MTc2MTIwMDAyM3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Customizable' }
      ],
      'Hooks & Racks': [
        { name: 'Heavy Duty Hooks 10pk', price: '$19', image: 'https://images.unsplash.com/photo-1758609554326-ebf110a4c142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbHZpbmclMjB1bml0fGVufDF8fHx8MTc2MTIwMDAyM3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Value' },
        { name: 'Coat Rack Wall Mount', price: '$39', image: 'https://images.unsplash.com/photo-1758609554326-ebf110a4c142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbHZpbmclMjB1bml0fGVufDF8fHx8MTc2MTIwMDAyM3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Stylish' }
      ],
      'Tool Storage': [
        { name: 'Rolling Tool Chest', price: '$399', image: 'https://images.unsplash.com/photo-1558906050-d6d6aa390fd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b29sJTIwY2hlc3QlMjB3b3Jrc2hvcHxlbnwxfHx8fDE3NjEyMDQwODB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Professional' },
        { name: 'Tool Cabinet 5-Drawer', price: '$279', image: 'https://images.unsplash.com/photo-1558906050-d6d6aa390fd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b29sJTIwY2hlc3QlMjB3b3Jrc2hvcHxlbnwxfHx8fDE3NjEyMDQwODB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Organized' }
      ],
      'Wire Shelving': [
        { name: 'Wire Shelf 4-Pack', price: '$69', image: 'https://images.unsplash.com/photo-1758609554326-ebf110a4c142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbHZpbmclMjB1bml0fGVufDF8fHx8MTc2MTIwMDAyM3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Adjustable' },
        { name: 'Wire Basket Set', price: '$34', image: 'https://images.unsplash.com/photo-1758609554326-ebf110a4c142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwc2hlbHZpbmclMjB1bml0fGVufDF8fHx8MTc2MTIwMDAyM3ww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Practical' }
      ],
      'Laundry Storage': [
        { name: 'Laundry Hamper 3-Section', price: '$49', image: 'https://images.unsplash.com/photo-1672855493631-f8fb78d8e745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwYmlucyUyMGNvbnRhaW5lcnN8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Sorter' },
        { name: 'Ironing Board Storage', price: '$39', image: 'https://images.unsplash.com/photo-1672855493631-f8fb78d8e745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yYWdlJTIwYmlucyUyMGNvbnRhaW5lcnN8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Compact' }
      ],
      
      // Tools
      'Power Drills': [
        { name: 'Cordless Drill 20V', price: '$129', image: 'https://images.unsplash.com/photo-1622044939413-0b829c342434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGRyaWxsJTIwY29yZGxlc3N8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Best Seller' },
        { name: 'Hammer Drill Kit', price: '$179', image: 'https://images.unsplash.com/photo-1622044939413-0b829c342434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGRyaWxsJTIwY29yZGxlc3N8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Power' }
      ],
      'Saws & Blades': [
        { name: 'Circular Saw 7-1/4"', price: '$149', image: 'https://images.unsplash.com/photo-1760939858984-5dc76f0ea34a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXJjdWxhciUyMHNhdyUyMGN1dHRpbmd8ZW58MXx8fHwxNzYxMjA0MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Professional' },
        { name: 'Miter Saw 10"', price: '$299', image: 'https://images.unsplash.com/photo-1760939858984-5dc76f0ea34a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXJjdWxhciUyMHNhdyUyMGN1dHRpbmd8ZW58MXx8fHwxNzYxMjA0MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Precision' }
      ],
      'Sanders & Grinders': [
        { name: 'Orbital Sander', price: '$79', image: 'https://images.unsplash.com/photo-1622044939413-0b829c342434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGRyaWxsJTIwY29yZGxlc3N8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Smooth' },
        { name: 'Angle Grinder 4-1/2"', price: '$89', image: 'https://images.unsplash.com/photo-1622044939413-0b829c342434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGRyaWxsJTIwY29yZGxlc3N8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Heavy Duty' }
      ],
      'Hammers & Nail Guns': [
        { name: 'Framing Hammer', price: '$29', image: 'https://images.unsplash.com/photo-1750054976309-9164e39cdc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwdG9vbHMlMjBzY3Jld2RyaXZlcnxlbnwxfHx8fDE3NjEyMDQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Durable' },
        { name: 'Brad Nailer Kit', price: '$119', image: 'https://images.unsplash.com/photo-1750054976309-9164e39cdc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwdG9vbHMlMjBzY3Jld2RyaXZlcnxlbnwxfHx8fDE3NjEyMDQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Efficient' }
      ],
      'Wrenches & Sockets': [
        { name: 'Socket Set 42pc', price: '$59', image: 'https://images.unsplash.com/photo-1750054976309-9164e39cdc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwdG9vbHMlMjBzY3Jld2RyaXZlcnxlbnwxfHx8fDE3NjEyMDQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Complete' },
        { name: 'Wrench Set SAE/Metric', price: '$49', image: 'https://images.unsplash.com/photo-1750054976309-9164e39cdc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwdG9vbHMlMjBzY3Jld2RyaXZlcnxlbnwxfHx8fDE3NjEyMDQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Versatile' }
      ],
      'Measuring & Layout Tools': [
        { name: 'Laser Level', price: '$79', image: 'https://images.unsplash.com/photo-1750054976309-9164e39cdc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwdG9vbHMlMjBzY3Jld2RyaXZlcnxlbnwxfHx8fDE3NjEyMDQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Accurate' },
        { name: 'Tape Measure 25ft', price: '$19', image: 'https://images.unsplash.com/photo-1750054976309-9164e39cdc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwdG9vbHMlMjBzY3Jld2RyaXZlcnxlbnwxfHx8fDE3NjEyMDQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Essential' }
      ],
      'Hand Tools': [
        { name: 'Screwdriver Set 10pc', price: '$24', image: 'https://images.unsplash.com/photo-1750054976309-9164e39cdc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwdG9vbHMlMjBzY3Jld2RyaXZlcnxlbnwxfHx8fDE3NjEyMDQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Basic' },
        { name: 'Pliers Set 3pc', price: '$29', image: 'https://images.unsplash.com/photo-1750054976309-9164e39cdc8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwdG9vbHMlMjBzY3Jld2RyaXZlcnxlbnwxfHx8fDE3NjEyMDQwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Quality' }
      ],
      'Tool Sets': [
        { name: 'Power Tool Combo 4pc', price: '$349', image: 'https://images.unsplash.com/photo-1622044939413-0b829c342434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3dlciUyMGRyaWxsJTIwY29yZGxlc3N8ZW58MXx8fHwxNzYxMjAwMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Bundle' },
        { name: 'Mechanic Tool Set 200pc', price: '$199', image: 'https://images.unsplash.com/photo-1558906050-d6d6aa390fd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b29sJTIwY2hlc3QlMjB3b3Jrc2hvcHxlbnwxfHx8fDE3NjEyMDQwODB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Complete' }
      ],
      'Ladders & Scaffolding': [
        { name: '6ft Step Ladder', price: '$79', image: 'https://images.unsplash.com/photo-1558906050-d6d6aa390fd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b29sJTIwY2hlc3QlMjB3b3Jrc2hvcHxlbnwxfHx8fDE3NjEyMDQwODB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Sturdy' },
        { name: 'Extension Ladder 24ft', price: '$199', image: 'https://images.unsplash.com/photo-1558906050-d6d6aa390fd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b29sJTIwY2hlc3QlMjB3b3Jrc2hvcHxlbnwxfHx8fDE3NjEyMDQwODB8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Heavy Duty' }
      ],
      // Windows & Doors
      'Exterior Doors': [
        { name: 'Steel Entry Door', price: '$499', image: 'https://images.unsplash.com/photo-1632752323710-6a73d814bcd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleHRlcmlvciUyMGRvb3IlMjBlbnRyeXxlbnwxfHx8fDE3NjEyMDAwMjh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Secure' },
        { name: 'French Door Set', price: '$899', image: 'https://images.unsplash.com/photo-1632752323710-6a73d814bcd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleHRlcmlvciUyMGRvb3IlMjBlbnRyeXxlbnwxfHx8fDE3NjEyMDAwMjh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Elegant' }
      ],
      'Interior Doors': [
        { name: 'Panel Door 30"', price: '$129', image: 'https://images.unsplash.com/photo-1759262151165-3330c14fd982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRvb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Classic' },
        { name: 'Barn Door Kit', price: '$299', image: 'https://images.unsplash.com/photo-1759262151165-3330c14fd982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRvb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Trendy' }
      ],
      'Windows': [
        { name: 'Double Hung Window', price: '$349', image: 'https://images.unsplash.com/photo-1659720879153-24703db812c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBnbGFzcyUyMGhvbWV8ZW58MXx8fHwxNzYxMjA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Energy Star' },
        { name: 'Sliding Window', price: '$299', image: 'https://images.unsplash.com/photo-1659720879153-24703db812c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBnbGFzcyUyMGhvbWV8ZW58MXx8fHwxNzYxMjA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Versatile' }
      ],
      'Storm Doors': [
        { name: 'Full View Storm Door', price: '$249', image: 'https://images.unsplash.com/photo-1632752323710-6a73d814bcd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleHRlcmlvciUyMGRvb3IlMjBlbnRyeXxlbnwxfHx8fDE3NjEyMDAwMjh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Protective' },
        { name: 'Retractable Screen Door', price: '$199', image: 'https://images.unsplash.com/photo-1632752323710-6a73d814bcd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleHRlcmlvciUyMGRvb3IlMjBlbnRyeXxlbnwxfHx8fDE3NjEyMDAwMjh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Convenient' }
      ],
      'Garage Doors': [
        { name: 'Sectional Garage Door', price: '$899', image: 'https://images.unsplash.com/photo-1760896743981-d25e912e644b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJhZ2UlMjBkb29yJTIwcmVzaWRlbnRpYWx8ZW58MXx8fHwxNzYxMjA0MDgwfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Insulated' },
        { name: 'Garage Door Opener', price: '$299', image: 'https://images.unsplash.com/photo-1760896743981-d25e912e644b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJhZ2UlMjBkb29yJTIwcmVzaWRlbnRpYWx8ZW58MXx8fHwxNzYxMjA0MDgwfDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Smart' }
      ],
      'Door Hardware': [
        { name: 'Door Handle Set', price: '$49', image: 'https://images.unsplash.com/photo-1758348613707-96ffd2baa14d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwbG9jayUyMGhhcmR3YXJlfGVufDF8fHx8MTc2MTIwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Modern' },
        { name: 'Deadbolt Lock', price: '$39', image: 'https://images.unsplash.com/photo-1758348613707-96ffd2baa14d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwbG9jayUyMGhhcmR3YXJlfGVufDF8fHx8MTc2MTIwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Security' }
      ],
      'Window Hardware': [
        { name: 'Window Lock Set 4pk', price: '$19', image: 'https://images.unsplash.com/photo-1659720879153-24703db812c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBnbGFzcyUyMGhvbWV8ZW58MXx8fHwxNzYxMjA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Safety' },
        { name: 'Window Screen Repair Kit', price: '$14', image: 'https://images.unsplash.com/photo-1659720879153-24703db812c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBnbGFzcyUyMGhvbWV8ZW58MXx8fHwxNzYxMjA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Practical' }
      ],
      'Door Frames & Jambs': [
        { name: 'Pre-Hung Door Frame', price: '$179', image: 'https://images.unsplash.com/photo-1759262151165-3330c14fd982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRvb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Easy Install' },
        { name: 'Door Trim Kit', price: '$49', image: 'https://images.unsplash.com/photo-1759262151165-3330c14fd982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRvb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMjA0MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Complete' }
      ],
      'Weather Stripping': [
        { name: 'Door Sweep 36"', price: '$12', image: 'https://images.unsplash.com/photo-1632752323710-6a73d814bcd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleHRlcmlvciUyMGRvb3IlMjBlbnRyeXxlbnwxfHx8fDE3NjEyMDAwMjh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Energy Saving' },
        { name: 'Weather Strip Tape', price: '$8', image: 'https://images.unsplash.com/photo-1632752323710-6a73d814bcd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleHRlcmlvciUyMGRvb3IlMjBlbnRyeXxlbnwxfHx8fDE3NjEyMDAwMjh8MA&ixlib=rb-4.1.0&q=80&w=1080', badge: 'Seal' }
      ]
    };

    // Default products if no specific mapping
    const defaultProducts = [
      {
        name: 'Premium Stainless Steel Refrigerator',
        price: '$899',
        image: 'https://images.unsplash.com/photo-1759691337957-ebc9ed54dc44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZWZyaWdlcmF0b3IlMjBzdGFpbmxlc3N8ZW58MXx8fHwxNzYxMjAwNTM4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        badge: 'Hot Deal'
      },
      {
        name: 'High-Efficiency Washing Machine',
        price: '$649',
        image: 'https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NjExODI1Njd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        badge: 'New'
      }
    ];

    return productMap[subcategoryName] || defaultProducts;
  };

  const navigationItems = [
    { name: 'Project Solution', page: 'projectsolution' as const },
    { name: 'Your QC Expert', page: 'qcmaster' as const },
    { name: 'Special & Offers', page: 'specials' as const },
    { name: 'Become A Supplier', page: 'supplier' as const },
  ];

  /* 
   * DEPARTMENTS DATA REMOVED
   * Data moved to: /data/header/departmentsData.ts
   * This section previously contained ~360 lines of department category data (lines 638-997)
   * The data has been extracted to improve file maintainability
   * The imported 'departments' array from departmentsData.ts is now used throughout the component
   */

  // Using imported departments array from /data/header/departmentsData.ts

  return (
    <>
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Main Header - White Background with Logo, Search, Actions */}
      <div className="px-4 py-4 border-b">
        <div className="mx-auto max-w-7xl">
          {/* Top Row - Logo, Search, Cart */}
          <div className="flex items-end justify-between gap-4">
            {/* Left Side - Logo and Search Area */}
            <div className="flex items-start gap-2 flex-1">
              {/* Logo */}
              <HeaderLogo onNavigateHome={() => navigateTo('home')} />

              {/* Right Side - Text and Search */}
              <div className="hidden md:flex flex-col gap-2 flex-1 max-w-3xl">
                {/* Text */}
                <div className="text-base tracking-wider text-gray-800 font-semibold">
                  YOUR ONE-STOP SOURCING SOLUTION EXPERT IN CHINA
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full">
                  <Input
                    type="text"
                    placeholder="What can we help you find?"
                    className="w-full pr-12 h-8"
                  />
                  <Button
                    size="icon"
                    className="absolute right-0 top-0 h-8 rounded-l-none"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side - Navigation Links + Login/Cart */}
            <div className="hidden lg:flex flex-col gap-2">
              {/* Top Row - Navigation Links */}
              <div className="flex items-center justify-end gap-1 text-sm">
                <RegionBadge />
                <span className="text-gray-400">|</span>
                <RegionSwitcher />
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => navigateTo('live')}
                  className="px-2 py-1 text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 font-semibold animate-pulse"
                  title="Live Stream"
                >
                  <Radio className="h-3 w-3" />
                  LIVE
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => navigateTo('services')}
                  className="px-2 py-1 text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Our Services
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => navigateTo('about')}
                  className="px-2 py-1 text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Our Story
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => navigateTo('shipmenthub')}
                  className="px-2 py-1 text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Shipment Hub
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => navigateTo('failurecases')}
                  className="px-2 py-1 text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Our Failure Cases
                </button>
                <span className="text-gray-400">|</span>
                {/* 🔥 管理员后台入口（固定可见） */}
                <button
                  onClick={() => navigateTo('admin-login')}
                  className="px-2 py-1 text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 font-semibold"
                  title="Admin Portal"
                >
                  <Shield className="h-3 w-3" />
                  Admin Portal
                </button>
              </div>

              {/* Bottom Row - Login/User and Cart */}
              <div className="flex items-center justify-end gap-2">
                {/* User Menu or Login Button + Notification Center */}
                <UserMenu
                  user={user}
                  logout={logout}
                  onNavigateTo={(page) => navigateTo(page)}
                />

                {/* Cart Button */}
                <CartButton
                  totalItems={getTotalItems()}
                  onNavigateToCart={() => navigateTo('cart')}
                />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-4 md:hidden">
            <div className="relative">
              <Input
                type="text"
                placeholder="What can we help you find?"
                className="w-full pr-12"
              />
              <Button
                size="icon"
                className="absolute right-0 top-0 rounded-l-none"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="hidden lg:flex items-center gap-1 py-3">
            {/* Shop by Department — managed by DepartmentMegaMenu */}
            <DepartmentMegaMenu
              isDepartmentOpen={isDepartmentOpen}
              currentPage={currentPage}
              hoveredDept={hoveredDept}
              hoveredSubcat={hoveredSubcat}
              hoveredProduct={hoveredProduct}
              showQuantityAlert={showQuantityAlert}
              departments={departments}
              onOpenChange={(open) => {
                if (open && !region) {
                  setShowRegionSelector(true);
                  return;
                }
                setIsDepartmentOpen(open);
              }}
              onHoverDept={(index) => {
                setHoveredDept(index);
                setHoveredSubcat(null);
              }}
              onHoverSubcat={(name) => setHoveredSubcat(name)}
              onHoverProduct={(name) => {
                setHoveredProduct(name);
                setOrderQuantity(1);
                setSelectedColors([]);
                setColorQuantities({});
                setSuggestedQuantities([]);
              }}
              onNavigateToDept={(categoryName) => {
                const categorySlug = categoryName
                  .toLowerCase()
                  .replace(/&/g, 'and')
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '');
                setHoveredDept(null);
                setHoveredSubcat(null);
                setIsDepartmentOpen(false);
                setTimeout(() => navigateTo(`category-${categorySlug}`, { category: categoryName }), 0);
              }}
              onNavigateToDeptSubcat={(categoryName, subcategoryName) => {
                const categorySlug = categoryName
                  .toLowerCase()
                  .replace(/&/g, 'and')
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '');
                setHoveredDept(null);
                setHoveredSubcat(null);
                setIsDepartmentOpen(false);
                setTimeout(() => navigateTo(`category-${categorySlug}`, { category: categoryName, subcategory: subcategoryName }), 0);
              }}
              onNavigateToCatalog={() => {
                navigateTo('catalog');
                setIsDepartmentOpen(false);
              }}
              onNavigateToSpecials={() => {
                setIsDepartmentOpen(false);
                setHoveredDept(null);
                setHoveredSubcat(null);
                navigateTo('specials');
              }}
              onCloseMenu={() => setIsDepartmentOpen(false)}
              onProductItemClick={(productName) => {
                const product = getProductDetails(productName);
                if (product) {
                  setSelectedProduct(product);
                  setShowProductDetail(true);
                }
              }}
              onMouseLeaveProductArea={() => {
                if (!showQuantityAlert) {
                  setHoveredProduct(null);
                  setSelectedColors([]);
                  setColorQuantities({});
                  setSuggestedQuantities([]);
                }
              }}
              getRecommendedProducts={getRecommendedProducts}
              productPanelNode={
                hoveredProduct && getProductDetails(hoveredProduct) ? (
                  <ProductPanel
                    hoveredProduct={hoveredProduct}
                    orderQuantity={orderQuantity}
                    selectedColors={selectedColors}
                    colorQuantities={colorQuantities}
                    suggestedQuantities={suggestedQuantities}
                    setOrderQuantity={setOrderQuantity}
                    setSelectedColors={setSelectedColors}
                    setColorQuantities={setColorQuantities}
                    setSuggestedQuantities={setSuggestedQuantities}
                    setPendingCartItem={setPendingCartItem}
                    setShowQuantityAlert={setShowQuantityAlert}
                    setIsDepartmentOpen={setIsDepartmentOpen}
                    setHoveredDept={setHoveredDept}
                    setHoveredSubcat={setHoveredSubcat}
                    setHoveredProduct={setHoveredProduct}
                    getProductDetails={getProductDetails}
                    calculateShipping={calculateShipping}
                    addToCart={addToCart}
                  />
                ) : null
              }
            />

            {/* Other Navigation Items */}
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setIsDepartmentOpen(false);
                  setHoveredDept(null);
                  setHoveredSubcat(null);
                  navigateTo(item.page);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === item.page && !isDepartmentOpen
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMenuOpen}
        user={user}
        currentPage={currentPage}
        region={region}
        logout={logout}
        navigationItems={navigationItems}
        onNavigateTo={(page) => navigateTo(page)}
        onSetShowRegionSelector={setShowRegionSelector}
        onOpenMobileDept={() => setIsMobileDepartmentOpen(true)}
        onClose={() => setIsMenuOpen(false)}
      />
    </header>

    {/* Quantity Alert Dialog */}
    <QuantityAlertDialog
      open={showQuantityAlert}
      pendingCartItem={pendingCartItem}
      selectedSuggestedQuantity={selectedSuggestedQuantity}
      onOpenChange={(open) => {
        setShowQuantityAlert(open);
        if (!open) {
          setPendingCartItem(null);
          setSelectedSuggestedQuantity(null);
        }
      }}
      onSelectSuggestedQuantity={setSelectedSuggestedQuantity}
      onConfirm={() => {
        if (selectedSuggestedQuantity !== null) {
          if (pendingCartItem?.color) {
            setColorQuantities({ ...colorQuantities, [pendingCartItem.color]: selectedSuggestedQuantity });
          } else {
            setOrderQuantity(selectedSuggestedQuantity);
          }
          setShowQuantityAlert(false);
          setPendingCartItem(null);
          setSelectedSuggestedQuantity(null);
        }
      }}
      onCancel={() => {
        setPendingCartItem(null);
        setSelectedSuggestedQuantity(null);
      }}
    />

    {/* Mobile Department Sheet */}
    <Sheet open={isMobileDepartmentOpen} onOpenChange={setIsMobileDepartmentOpen}>
      <SheetContent side="left" className="w-[90vw] sm:w-[400px] p-0 overflow-y-auto">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle>Shop by Department</SheetTitle>
          <SheetDescription className="sr-only">
            Browse all product departments and categories
          </SheetDescription>
        </SheetHeader>
        
        <div className="px-4 py-3">
          {/* Department List - First Level */}
          {mobileDeptIndex === null && (
            <div className="space-y-1">
              {departments.map((dept, index) => (
                <button
                  key={index}
                  onClick={() => setMobileDeptIndex(index)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left hover:bg-gray-100 transition-colors"
                >
                  <span>{dept.name}</span>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-gray-400" />
                </button>
              ))}
              
              <div className="border-t my-3 pt-3">
                <button
                  onClick={() => {
                    navigateTo('catalog');
                    setIsMobileDepartmentOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-lg text-left hover:bg-gray-100 transition-colors text-orange-600"
                >
                  All Departments
                </button>
              </div>
            </div>
          )}
          
          {/* Subcategory List - Second Level */}
          {mobileDeptIndex !== null && mobileSubcatName === null && (
            <div className="space-y-2">
              <button
                onClick={() => setMobileDeptIndex(null)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Back to Departments
              </button>
              
              <h3 className="font-medium text-lg mb-3">{departments[mobileDeptIndex].name}</h3>
              
              <div className="space-y-1">
                {departments[mobileDeptIndex].subcategories.map((subcat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMobileSubcatName(subcat.name)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-left hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm">{subcat.name}</span>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Product Items - Third Level */}
          {mobileDeptIndex !== null && mobileSubcatName !== null && (
            <div className="space-y-2">
              <button
                onClick={() => setMobileSubcatName(null)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Back to {departments[mobileDeptIndex].name}
              </button>
              
              <h3 className="font-medium text-lg mb-3">{mobileSubcatName}</h3>
              
              {(() => {
                const subcat = departments[mobileDeptIndex].subcategories.find(s => s.name === mobileSubcatName);
                if (!subcat) return null;
                
                return (
                  <div className="space-y-1">
                    {subcat.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const productDetails = getProductDetails(item);
                          if (productDetails) {
                            setSelectedProduct(productDetails);
                            setShowProductDetail(true);
                            setIsMobileDepartmentOpen(false);
                            setMobileDeptIndex(null);
                            setMobileSubcatName(null);
                          } else {
                            toast.info('Product details coming soon');
                          }
                        }}
                        className="w-full px-4 py-3 rounded-lg text-left hover:bg-gray-100 transition-colors text-sm"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* Product Detail Dialog */}
    <ProductDetailDialog
      product={selectedProduct}
      open={showProductDetail}
      onOpenChange={setShowProductDetail}
      onShowQuantityAlert={(item) => {
        setPendingCartItem(item);
        setShowQuantityAlert(true);
      }}
    />
  </>
  );
}
