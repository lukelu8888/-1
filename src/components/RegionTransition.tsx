import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRegion, getRegionName, getCountryFlag } from '../contexts/RegionContext';
import { Loader2 } from 'lucide-react';

interface RegionTransitionProps {
  children: ReactNode;
}

export function RegionTransition({ children }: RegionTransitionProps) {
  const { region, isChangingRegion, locationInfo } = useRegion();

  // Get the appropriate flag - use country flag if available, otherwise region flag
  const displayFlag = locationInfo?.countryCode 
    ? getCountryFlag(locationInfo.countryCode) 
    : '🌍';

  return (
    <>
      {/* Region Change Overlay */}
      <AnimatePresence>
        {isChangingRegion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/90 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-6xl animate-bounce">
                {displayFlag}
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                <p className="text-gray-900 font-medium">
                  Switching to {getRegionName(region)}...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content with Transition */}
      <motion.div
        key={region || 'no-region'}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </>
  );
}