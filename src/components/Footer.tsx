import { Facebook, Instagram, Linkedin, Smartphone } from 'lucide-react';
import { useRouter } from '../contexts/RouterContext';

const footerGroups = [
  ['Shop', 'All Departments', 'Deals & Offers', 'New Arrivals', 'Best Sellers', 'Brands', 'Clearance'],
  ['Services', 'Sourcing Solutions', 'Request a Quote', 'Trade Services', 'Quality Assurance', 'Logistics & Shipping', 'Inspection Services'],
  ['Company', 'About Us', 'Our Suppliers', 'Careers', 'News & Media', 'Sustainability', 'Contact Us'],
  ['Help', 'Help Center', 'Order Tracking', 'Returns & Refunds', 'Shipping Info', 'Payment Options', 'FAQs'],
];

export function Footer() {
  const { navigateTo } = useRouter();

  return (
    <footer className="cosun-footer text-white">
      <div className="cosun-shell py-12 lg:py-14">
        <div className="cosun-footer-grid">
          <div>
            <button onClick={() => navigateTo('home')} className="text-left">
              <div className="font-serif text-xl font-black leading-none tracking-normal text-red-600">COSUN</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/80">Global Trade & Supply</div>
            </button>
            <p className="mt-6 max-w-[260px] text-sm leading-6 text-white/70">
              Your global partner for building materials and industrial supplies. Source smarter. Build better.
            </p>
            <div className="mt-6 flex gap-3">
              {[Linkedin, Facebook, Instagram].map((Icon, index) => (
                <span key={index} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70">
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {footerGroups.map(([title, ...links]) => (
            <div key={title}>
              <h3 className="text-sm font-black uppercase text-white">{title}</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/65">
                {links.map((link) => (
                  <li key={link}>
                    <button onClick={() => navigateTo(link.includes('Quote') ? 'login' : 'catalog')} className="hover:text-white">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="cosun-footer-app">
            <h3 className="text-sm font-black uppercase">Get the App</h3>
            <p className="mt-4 text-sm text-white/65">Scan to download Cosun App</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-[88px] w-[88px] grid-cols-5 grid-rows-5 gap-1 bg-white p-2">
                {Array.from({ length: 25 }).map((_, index) => (
                  <span key={index} className={(index * 7) % 5 < 3 ? 'bg-gray-900' : 'bg-white'} />
                ))}
              </div>
              <div className="space-y-2">
                {['App Store', 'Google Play'].map((store) => (
                  <div key={store} className="flex h-9 w-32 items-center gap-2 rounded-sm border border-white/25 px-3 text-xs text-white/75">
                    <Smartphone className="h-4 w-4" />
                    {store}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/45">
          <p>© 2025 COSUN Global Trade & Supply. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => navigateTo('privacy-policy')}>Privacy Policy</button>
            <button onClick={() => navigateTo('terms-of-service')}>Terms of Use</button>
            <button onClick={() => navigateTo('about')}>Cookies Policy</button>
            <span>United States (English / USD)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
