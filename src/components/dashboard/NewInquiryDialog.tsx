import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Globe, Boxes } from 'lucide-react';

interface NewInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'website' | 'manual') => void;
}

export function NewInquiryDialog({ isOpen, onClose, onSelectMethod }: NewInquiryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" style={{ fontFamily: 'var(--hd-font)' }}>
        <DialogHeader>
          <DialogTitle className="text-gray-900 uppercase tracking-wide" style={{ fontSize: '18px', fontWeight: 700 }}>
            CREATE NEW INQUIRY
          </DialogTitle>
          <DialogDescription style={{ fontSize: '13px', fontWeight: 400 }}>
            Choose how you want to create your inquiry
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Select from Website */}
          <button
            onClick={() => {
              onSelectMethod('website');
              onClose();
            }}
            className="group p-6 border-2 border-gray-200 rounded-sm hover:border-[#F96302] hover:bg-[#FFF4ED] transition-all"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-[#0D3B66] group-hover:bg-[#F96302] rounded-sm flex items-center justify-center transition-colors">
                <Globe className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-gray-900 uppercase tracking-wide mb-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                  SELECT FROM WEBSITE
                </h3>
                <p className="text-gray-600" style={{ fontSize: '12px', fontWeight: 400 }}>
                  Browse and select products
                </p>
              </div>
            </div>
          </button>

          {/* My Products */}
          <button
            onClick={() => {
              onSelectMethod('manual');
              onClose();
            }}
            className="group p-6 border-2 border-gray-200 rounded-sm hover:border-[#F96302] hover:bg-[#FFF4ED] transition-all"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-[#0D3B66] group-hover:bg-[#F96302] rounded-sm flex items-center justify-center transition-colors">
                <Boxes className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-gray-900 uppercase tracking-wide mb-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                  MY PRODUCTS
                </h3>
                <p className="text-gray-600" style={{ fontSize: '12px', fontWeight: 400 }}>
                  Select from saved product packages
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-gray-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            CANCEL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
