import { useState } from 'react';
import { Lock, User, Mail, Building2, Ship, Shield, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { authenticateUser, saveSession, type AuthorizedUser } from '../data/authorizedUsers';
import { toast } from 'sonner@2.0.3';

interface ContainerTrackingLoginProps {
  onLoginSuccess: (user: AuthorizedUser) => void;
}

export function ContainerTrackingLogin({ onLoginSuccess }: ContainerTrackingLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const user = authenticateUser(username, password);
      
      if (user) {
        saveSession(user);
        toast.success(`Welcome back, ${user.company}!`);
        onLoginSuccess(user);
      } else {
        toast.error('Invalid username or password');
      }
      
      setIsLoading(false);
    }, 800);
  };

  const quickLogin = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    
    // Automatically submit after a short delay
    setTimeout(() => {
      const user = authenticateUser(demoUsername, demoPassword);
      if (user) {
        saveSession(user);
        toast.success(`Welcome back, ${user.company}!`);
        onLoginSuccess(user);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Ship className="w-12 h-12" />
              <h1 className="text-4xl">Container Tracking Portal</h1>
            </div>
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Secure access for authorized customers and partners
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Login Form */}
          <div>
            <Card className="border-2 border-red-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-6 h-6 text-red-600" />
                  Customer Login
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Please sign in to access container tracking services
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="pl-10 h-12"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-12"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-gray-700">Remember me</span>
                    </label>
                    <a href="#" className="text-sm text-red-600 hover:text-red-700 hover:underline">
                      Forgot password?
                    </a>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">
                        Don't have an account?
                      </span>
                    </div>
                  </div>

                  {/* Register Link */}
                  <div className="text-center">
                    <a href="#" className="text-red-600 hover:text-red-700 hover:underline font-medium">
                      Request Access →
                    </a>
                    <p className="text-xs text-gray-500 mt-2">
                      Contact our sales team to create an account
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      Secure Connection
                    </p>
                    <p className="text-xs text-blue-800">
                      Your login credentials are encrypted and protected. Sessions expire after 24 hours of inactivity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Demo Accounts & Features */}
          <div className="space-y-6">
            {/* Demo Accounts */}
            {showDemoAccounts && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-green-900">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      Demo Accounts
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800">
                      For Testing
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Click any account below for quick login
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Admin Account */}
                  <button
                    onClick={() => quickLogin('admin', 'admin123')}
                    className="w-full p-4 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">Administrator</div>
                        <div className="text-sm text-gray-600">COSUN Building Materials</div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Admin</Badge>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Username: <span className="font-mono font-semibold">admin</span></div>
                      <div>Password: <span className="font-mono font-semibold">admin123</span></div>
                    </div>
                  </button>

                  {/* Demo Customer */}
                  <button
                    onClick={() => quickLogin('demo', 'demo123')}
                    className="w-full p-4 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">Demo Customer</div>
                        <div className="text-sm text-gray-600">ABC Trading Co.</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Customer</Badge>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Username: <span className="font-mono font-semibold">demo</span></div>
                      <div>Password: <span className="font-mono font-semibold">demo123</span></div>
                    </div>
                  </button>

                  {/* John Doe */}
                  <button
                    onClick={() => quickLogin('johndoe', 'john123')}
                    className="w-full p-4 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">John Doe</div>
                        <div className="text-sm text-gray-600">BuildMart USA</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Customer</Badge>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Username: <span className="font-mono font-semibold">johndoe</span></div>
                      <div>Password: <span className="font-mono font-semibold">john123</span></div>
                    </div>
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      ✓ Has 8 orders • Can track containers
                    </div>
                  </button>

                  {/* New User - No Orders */}
                  <button
                    onClick={() => quickLogin('newuser', 'new123')}
                    className="w-full p-4 bg-white rounded-lg border-2 border-orange-200 hover:border-orange-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">New Customer</div>
                        <div className="text-sm text-gray-600">New Customer Ltd.</div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">Customer</Badge>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Username: <span className="font-mono font-semibold">newuser</span></div>
                      <div>Password: <span className="font-mono font-semibold">new123</span></div>
                    </div>
                    <div className="mt-2 text-xs text-orange-600 font-medium">
                      ⊗ No orders yet • Cannot track containers
                    </div>
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-red-600" />
                  Member Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Ship className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Real-Time Container Tracking</div>
                    <div className="text-sm text-gray-600">
                      Track all your shipments with live updates and ETA predictions
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Freight Rate Quotes</div>
                    <div className="text-sm text-gray-600">
                      Get instant quotes from multiple carriers and compare prices
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Automatic Notifications</div>
                    <div className="text-sm text-gray-600">
                      Receive email alerts for important shipment milestones
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Document Management</div>
                    <div className="text-sm text-gray-600">
                      Access all shipping documents and customs forms online
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-2">Need Help?</div>
                    <p className="text-sm text-gray-600 mb-3">
                      If you're having trouble logging in or need to request access, please contact our support team.
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-700">
                        Email: <a href="mailto:support@cosun.com" className="text-red-600 hover:underline">support@cosun.com</a>
                      </div>
                      <div className="text-gray-700">
                        Phone: <a href="tel:+86-123-4567-8900" className="text-red-600 hover:underline">+86-123-4567-8900</a>
                      </div>
                      <div className="text-gray-700">
                        Hours: Monday - Friday, 9:00 AM - 6:00 PM (CST)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}