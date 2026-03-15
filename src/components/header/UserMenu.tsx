import { User, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';
import { CustomerNotificationCenter } from '../CustomerNotificationCenter';
import { AuthUser } from '../../contexts/UserContext';

interface UserMenuProps {
  user: AuthUser | null;
  logout: () => Promise<void>;
  onNavigateTo: (page: string) => void;
}

export function UserMenu({ user, logout, onNavigateTo }: UserMenuProps) {
  return (
    <>
      {/* User Menu or Login Button */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="hidden xl:flex flex-col items-start">
                <span className="text-xs text-gray-500">Welcome</span>
                <span className="text-sm font-medium">{user.email.split('@')[0]}</span>
              </div>
              <ChevronDown className="h-4 w-4 hidden xl:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2 border-b">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-gray-500">Customer Account</p>
            </div>
            <DropdownMenuItem onClick={() => onNavigateTo('dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>My Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={async () => {
              await logout();
              onNavigateTo('home');
              toast.success('Logged out successfully');
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          onClick={() => onNavigateTo('login')}
          variant="ghost"
          className="flex items-center gap-1"
        >
          <User className="h-5 w-5" />
          <span className="hidden xl:inline">Login</span>
        </Button>
      )}

      {/* 🔔 Notification Center - Only show when logged in */}
      {user && <CustomerNotificationCenter />}
    </>
  );
}
