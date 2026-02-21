import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import logo from 'figma:asset/262d7b2c13569c77ce921a39b3150003bd6f7975.png';
import { useRouter } from '../contexts/RouterContext';

export function Footer() {
  const { navigateTo } = useRouter();
  
  return (
    <footer className="bg-white px-4 py-12 text-gray-600 border-t border-gray-200">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <img src={logo} alt="福建高盛达富建材有限公司" className="h-10 w-10 object-contain" />
              <div className="text-gray-900">FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.</div>
            </div>
            <p className="mb-4 text-sm">
              Leading manufacturer of premium building materials with over 15 years of experience. Serving clients worldwide.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-blue-600 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-blue-600 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-blue-600 hover:text-white"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-blue-600 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-gray-900">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => navigateTo('catalog')} className="transition-colors hover:text-blue-600 text-left">
                  Products
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('services')} className="transition-colors hover:text-blue-600 text-left">
                  Services
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('projectsolution')} className="transition-colors hover:text-blue-600 text-left">
                  Cases
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="transition-colors hover:text-blue-600 text-left">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('socialmedia')} className="transition-colors hover:text-blue-600 text-left">
                  Our Social Media
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('news')} className="transition-colors hover:text-blue-600 text-left">
                  News
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-gray-900">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <a href="tel:+8613799993509" className="hover:text-blue-600">
                    +86 13799993509
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href="mailto:services@cosunchina.com" className="hover:text-blue-600">
                    services@cosunchina.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p>Fujian Province, China</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="mb-4 text-gray-900">Follow Us</h3>
            <p className="mb-4 text-sm">
              Stay updated with our latest news and products
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm">
          <p>
            © 2025 FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD. All rights reserved.
          </p>
          <div className="mt-3 flex justify-center gap-6 text-xs">
            <button 
              onClick={() => navigateTo('privacy-policy')} 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-gray-400">•</span>
            <button 
              onClick={() => navigateTo('terms-of-service')} 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </button>
            <span className="text-gray-400">•</span>
            <button 
              onClick={() => navigateTo('about')} 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Contact Us
            </button>
            <span className="text-gray-400">•</span>
            {/* 🔥 内部员工登录入口 */}
            <button 
              onClick={() => navigateTo('admin-login')} 
              className="text-gray-400 hover:text-red-600 transition-colors text-[10px]"
              title="Internal Staff Only"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}