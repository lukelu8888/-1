import { useState, useEffect } from 'react';
import { FileText, ArrowLeft, ShoppingCart, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface OrderEditingBannerProps {
  onReturnToOrder: () => void;
}

export function OrderEditingBanner({ onReturnToOrder }: OrderEditingBannerProps) {
  const [orderSession, setOrderSession] = useState<any>(null);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    // Load order editing session
    const sessionData = localStorage.getItem('orderEditingSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setOrderSession(session);
        
        // Load draft orders to get product count
        const draftsData = localStorage.getItem('draftOrders');
        if (draftsData) {
          const drafts = JSON.parse(draftsData);
          const currentDraft = drafts.find((d: any) => d.id === session.orderId);
          if (currentDraft) {
            setProductCount(currentDraft.products?.length || 0);
          }
        }
      } catch (error) {
        console.error('Failed to load order session:', error);
      }
    }

    // Listen for localStorage changes (when products are added)
    const handleStorageChange = () => {
      const draftsData = localStorage.getItem('draftOrders');
      const sessionData = localStorage.getItem('orderEditingSession');
      
      if (draftsData && sessionData) {
        try {
          const session = JSON.parse(sessionData);
          const drafts = JSON.parse(draftsData);
          const currentDraft = drafts.find((d: any) => d.id === session.orderId);
          if (currentDraft) {
            setProductCount(currentDraft.products?.length || 0);
          }
        } catch (error) {
          console.error('Failed to update product count:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-window updates
    window.addEventListener('draftOrderUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('draftOrderUpdated', handleStorageChange);
    };
  }, []);

  const handleClose = () => {
    localStorage.removeItem('orderEditingSession');
    setOrderSession(null);
  };

  if (!orderSession) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border-b-4 border-blue-800 animate-slide-down">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-2">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">Editing Order: {orderSession.orderId}</p>
                <Badge className="bg-white text-blue-600">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {productCount} {productCount === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              <p className="text-xs text-blue-100">Add products to your Proforma Invoice</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onReturnToOrder}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Proforma Invoice
            </Button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
