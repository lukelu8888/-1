import { ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AuthUser } from '../../contexts/UserContext';

interface MobileNavigationProps {
  isOpen: boolean;
  user: AuthUser | null;
  currentPage: string;
  region: string | null;
  logout: () => Promise<void>;
  navigationItems: { name: string; page: string }[];
  onNavigateTo: (page: string) => void;
  onSetShowRegionSelector: (show: boolean) => void;
  onOpenMobileDept: () => void;
  onClose: () => void;
}

export function MobileNavigation({
  isOpen,
  user,
  currentPage,
  region,
  logout,
  navigationItems,
  onNavigateTo,
  onSetShowRegionSelector,
  onOpenMobileDept,
  onClose,
}: MobileNavigationProps) {
  if (!isOpen) return null;

  return (
    <div className="border-t bg-white px-4 py-4 lg:hidden">
      <nav className="flex flex-col gap-2">
        {/* Shop by Department Button */}
        <button
          className={`rounded-lg px-4 py-3 text-left transition-colors flex items-center justify-between ${
            currentPage === 'catalog'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
          }`}
          onClick={() => {
            if (!region) {
              onSetShowRegionSelector(true);
              onClose();
              return;
            }
            onOpenMobileDept();
            onClose();
          }}
        >
          Shop by Department
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </button>

        {navigationItems.map((item) => (
          <button
            key={item.name}
            className={`rounded-lg px-4 py-3 text-left transition-colors ${
              currentPage === item.page
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            }`}
            onClick={() => {
              onNavigateTo(item.page);
              onClose();
            }}
          >
            {item.name}
          </button>
        ))}
        <div className="border-t my-2"></div>
        {user ? (
          <>
            <div className="px-4 py-2 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
              <p className="text-xs text-gray-500">Customer Account</p>
            </div>
            <button
              className="rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-600 flex items-center gap-2"
              onClick={() => {
                onNavigateTo('dashboard');
                onClose();
              }}
            >
              <LayoutDashboard className="h-4 w-4" />
              My Dashboard
            </button>
            <button
              className="rounded-lg px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
              onClick={async () => {
                await logout();
                onNavigateTo('home');
                onClose();
                toast.success('Logged out successfully');
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        ) : (
          <button
            className="rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-600"
            onClick={() => {
              onNavigateTo('login');
              onClose();
            }}
          >
            Login
          </button>
        )}
      </nav>
    </div>
  );
}
