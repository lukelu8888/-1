import { ShoppingCart, Search, Truck, ClipboardCheck, Building2, Package, ChevronLeft, ChevronRight, Award, Users, Globe, TrendingUp, Store, Briefcase, HardHat, Boxes, Tag, Zap, Bell, LineChart, Ship, Container, Handshake } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { ImageWithFallback } from './figma/ImageWithFallback';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useEffect, useState } from 'react';
import type { CarouselApi } from './ui/carousel';

export function Services() {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  // State for carousel API access
  const [api, setApi] = useState<CarouselApi>();
  const carouselContainerRef = useRef<HTMLDivElement>(null);

  // Piano sound effects for 6 cards - Do, Re, Mi, Fa, Sol, La
  const playPianoNote = (frequency: number) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Piano-like sound with sine wave
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // ADSR envelope for piano-like sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // Decay & Release

    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Complete octave - 8 piano notes: Do, Re, Mi, Fa, Sol, La, Xi, Do
  const playDo = () => playPianoNote(261.63);   // C4 - Do
  const playRe = () => playPianoNote(293.66);   // D4 - Re
  const playMi = () => playPianoNote(329.63);   // E4 - Mi
  const playFa = () => playPianoNote(349.23);   // F4 - Fa
  const playSol = () => playPianoNote(392.00);  // G4 - Sol
  const playLa = () => playPianoNote(440.00);   // A4 - La
  const playXi = () => playPianoNote(493.88);   // B4 - Xi (Si)
  const playDo2 = () => playPianoNote(523.25);  // C5 - Do (High octave)

  // Text-to-Speech for Retailers card
  const speakRetailersText = () => {
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const text = "We partner with chain supermarkets and retailers of all sizes. We excel at empowering small retailers with cost-effective quality products, helping them grow into mid-sized retail businesses with strong market presence.";
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings for a deeper, more authoritative tone
    utterance.rate = 0.9;  // Slightly slower for emphasis
    utterance.pitch = 0.8; // Lower pitch for authoritative tone
    utterance.volume = 1.0; // Full volume
    
    // Try to find an English male voice
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('Daniel'))
    ) || voices.find(voice => voice.lang.startsWith('en-US'));
    
    if (maleVoice) {
      utterance.voice = maleVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech when mouse leaves
  const stopSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  // Load voices when component mounts
  useEffect(() => {
    // Some browsers need this to load voices
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Add wheel event listener for horizontal scrolling with mouse
  useEffect(() => {
    if (!api || !carouselContainerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if there's horizontal scroll (deltaX) - Apple Magic Mouse horizontal swipe
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        
        if (e.deltaX > 10) {
          // Scroll right - go to next slide
          api.scrollNext();
        } else if (e.deltaX < -10) {
          // Scroll left - go to previous slide
          api.scrollPrev();
        }
      }
    };

    const container = carouselContainerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [api]);

  const serviceBanners = [
    {
      title: 'Professional Procurement Services',
      subtitle: '20 Years of Sourcing Excellence in China',
      description: 'With two decades of industry expertise, we handle all your purchasing needs with unmatched efficiency. Our seasoned procurement specialists source quality products at competitive prices, ensuring the best value for your investment across all product categories.',
      image: 'https://images.unsplash.com/photo-1739204618173-3e89def7140f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9jdXJlbWVudCUyMHdhcmVob3VzZSUyMGxvZ2lzdGljc3xlbnwxfHx8fDE3NjE0NjM5Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      gradient: 'from-blue-900/90 to-blue-700/80',
    },
    {
      title: 'Comprehensive Supplier Sourcing',
      subtitle: 'Two Decades of Building Trusted Partnerships',
      description: 'Leveraging 20 years of established relationships, we provide access to our extensive network of vetted suppliers across China. We identify, evaluate, and connect you with trustworthy manufacturers who meet your specific requirements, quality standards, and budget constraints.',
      image: 'https://images.unsplash.com/photo-1740478871010-124bae18a362?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXBwbGllciUyMGZhY3RvcnklMjBzb3VyY2luZ3xlbnwxfHx8fDE3NjE0NjM5Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      gradient: 'from-green-900/90 to-green-700/80',
    },
    {
      title: 'End-to-End Shipment Solutions',
      subtitle: 'Seamless Logistics Backed by 20 Years of Experience',
      description: 'Our logistics expertise, refined over two decades, ensures complete coordination and management services. We arrange international shipping, handle customs clearance, and provide real-time tracking, guaranteeing your products arrive safely and on schedule.',
      image: 'https://images.unsplash.com/photo-1657782099123-56bc04f8c537?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJnbyUyMHNoaXBwaW5nJTIwY29udGFpbmVyfGVufDF8fHx8MTc2MTQ2MzkyOHww&ixlib=rb-4.1.0&q=80&w=1080',
      gradient: 'from-purple-900/90 to-purple-700/80',
    },
    {
      title: 'Professional Quality Inspection',
      subtitle: '20 Years of Quality Assurance Excellence',
      description: 'Our certified professionals bring 20 years of quality control expertise to every inspection. We verify product specifications, conduct comprehensive factory audits, and provide detailed inspection reports to ensure compliance with international standards.',
      image: 'https://images.unsplash.com/photo-1758873263563-5ba4aa330799?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWFsaXR5JTIwY29udHJvbCUyMGluc3BlY3Rpb258ZW58MXx8fHwxNzYxNDYzOTI5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      gradient: 'from-orange-900/90 to-orange-700/80',
    },
    {
      title: 'Comprehensive Supplier Network',
      subtitle: 'Two Decades of Industry Connections',
      description: 'Built over 20 years of dedicated service, our network provides access to qualified suppliers across all product categories. From construction materials to specialized components and custom solutions, we connect you with the right manufacturers for any project requirement.',
      image: 'https://images.unsplash.com/photo-1760045788252-d8d386ea1d12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdpbmVlcmluZyUyMGNvbnN0cnVjdGlvbiUyMHN1cHBsaWVyfGVufDF8fHx8MTc2MTQ2MzkyOXww&ixlib=rb-4.1.0&q=80&w=1080',
      gradient: 'from-pink-900/90 to-pink-700/80',
    },
  ];

  const services = [
    {
      icon: ShoppingCart,
      title: 'Procurement Services',
      description: 'Professional purchasing services for clients - sourcing quality products at competitive prices',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Search,
      title: 'Supplier Sourcing',
      description: 'Finding and vetting reliable suppliers across China to meet your specific needs',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Truck,
      title: 'Shipment Arrangement',
      description: 'Complete logistics coordination - from factory to your doorstep with full tracking',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: ClipboardCheck,
      title: 'Product Inspection',
      description: 'Comprehensive quality control and inspection services ensuring products meet your standards',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: Building2,
      title: 'Comprehensive Supplier Network',
      description: 'Access to qualified suppliers across all product categories for any project requirement',
      color: 'bg-pink-100 text-pink-600',
    },
    {
      icon: Package,
      title: 'One-Stop Solution',
      description: 'Complete procurement to delivery service - your trusted sourcing partner in China',
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  return (
    <section id="services" className="bg-white">
      {/* Hero Banner Carousel */}
      <div className="relative w-full bg-gray-50" ref={carouselContainerRef}>
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          setApi={setApi}
        >
          <CarouselContent>
            {serviceBanners.map((banner, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full overflow-hidden">
                  <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                      {/* Left Side - Image */}
                      <div className="relative">
                        <div className={`absolute -inset-4 bg-gradient-to-r ${banner.gradient.replace('/90', '/30').replace('/80', '/20')} rounded-3xl blur-2xl`}></div>
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                          <ImageWithFallback
                            src={banner.image}
                            alt={banner.title}
                            className="w-full h-[300px] object-cover"
                          />
                        </div>
                      </div>

                      {/* Right Side - Content */}
                      <div className="text-left">
                        <h1 className="mb-6 text-gray-900">
                          {banner.title}
                        </h1>
                        <p className="mb-6 text-2xl font-semibold text-red-600">
                          {banner.subtitle}
                        </p>
                        <p className="text-lg leading-relaxed text-gray-700">
                          {banner.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 h-12 w-12 border-2 border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700" />
          <CarouselNext className="right-4 h-12 w-12 border-2 border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700" />
        </Carousel>
      </div>

      {/* Client Types & OEM/ODM Services Section - WHO WE SERVE */}
      <div className="px-4 pt-16 pb-1.5 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-5">
            <h2 className="mb-4 text-gray-900 font-bold text-4xl">Who We Serve</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              We partner with diverse business clients worldwide, providing customized solutions to strengthen their market competitiveness
            </p>
          </div>

          {/* Client Types - Single Row Layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-16">
            <Card 
              className="border-2 border-gray-200 hover:border-red-600 transition-all overflow-hidden cursor-pointer" 
              onMouseEnter={() => {
                playDo();
                speakRetailersText();
              }}
              onMouseLeave={stopSpeech}
              onClick={speakRetailersText}
            >
              <div className="bg-red-600 p-2 text-center">
                <div className="mb-1.5 inline-flex items-center justify-center rounded-full bg-white p-2">
                  <Store className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-white m-0">Retailers</h3>
              </div>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  We partner with <strong>chain supermarkets</strong> and retailers of all sizes. We excel at <strong className="text-red-600">empowering small retailers</strong> with <strong>cost-effective quality products</strong>, helping them grow into mid-sized retail businesses with strong market presence.
                </p>
                <p className="text-xs text-gray-600 italic">
                  Unified brand quality • Competitive pricing • Growth partnership
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-red-600 transition-all overflow-hidden" onMouseEnter={playRe}>
              <div className="bg-red-600 p-2 text-center">
                <div className="mb-1.5 inline-flex items-center justify-center rounded-full bg-white p-2">
                  <Container className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-white m-0">Inspection & Shipment Clients</h3>
              </div>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  Professional inspection and shipment arrangement services for clients with their own suppliers. With <strong>20 years of container loading expertise</strong>, we specialize in <strong>consolidated mixed cargo</strong> services, integrating multiple sources into efficient shipments.
                </p>
                <p className="text-xs text-gray-600 italic">
                  Expert inspection • Professional loading • Multi-source consolidation
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-red-600 transition-all overflow-hidden" onMouseEnter={playMi}>
              <div className="bg-red-600 p-2 text-center">
                <div className="mb-1.5 inline-flex items-center justify-center rounded-full bg-white p-2">
                  <Handshake className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-white m-0">Agent-Seeking Buyers</h3>
              </div>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  We are <strong>the ideal choice for buyers seeking a China procurement agent</strong>. We handle everything from <strong>supplier sourcing to final shipment</strong>, serving as your dedicated local partner with full authority to manage your entire China procurement journey.
                </p>
                <p className="text-xs text-gray-600 italic">
                  Your ideal agent • Complete procurement service • Full representation in China
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-red-600 transition-all overflow-hidden" onMouseEnter={playFa}>
              <div className="bg-red-600 p-2 text-center">
                <div className="mb-1.5 inline-flex items-center justify-center rounded-full bg-white p-2">
                  <HardHat className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-white m-0">Project Contractors</h3>
              </div>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Comprehensive material sourcing for all your project needs. We <strong>match you with qualified suppliers across all industries</strong> - from construction materials to specialized components, ensuring on-time delivery and budget control.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-red-600 transition-all overflow-hidden" onMouseEnter={playSol}>
              <div className="bg-red-600 p-2 text-center">
                <div className="mb-1.5 inline-flex items-center justify-center rounded-full bg-white p-2">
                  <Ship className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-white m-0">Importers</h3>
              </div>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Professional import solutions with complete documentation support, customs clearance assistance, and reliable shipping coordination to ensure smooth cross-border trade operations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-red-600 transition-all overflow-hidden" onMouseEnter={playLa}>
              <div className="bg-red-600 p-2 text-center">
                <div className="mb-1.5 inline-flex items-center justify-center rounded-full bg-white p-2">
                  <Boxes className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-white m-0">Wholesalers</h3>
              </div>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Bulk procurement solutions with competitive pricing, consistent quality, and reliable delivery schedules to support your distribution business and supply chain needs.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* OEM/ODM Services Banner */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
              <div className="text-white">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full mb-4">
                    <Boxes className="h-5 w-5" />
                    <span className="font-semibold">OEM Services</span>
                  </div>
                  <h3 className="mb-4">Original Equipment Manufacturing</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    We manufacture products according to your exact specifications and designs. Your brand, your requirements, our manufacturing expertise.
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✓</span>
                      <span>Custom specifications and designs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✓</span>
                      <span>Your branding and packaging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✓</span>
                      <span>Quality control throughout production</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-white">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 bg-orange-600 px-4 py-2 rounded-full mb-4">
                    <Tag className="h-5 w-5" />
                    <span className="font-semibold">ODM Services</span>
                  </div>
                  <h3 className="mb-4">Original Design Manufacturing</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Leverage our design capabilities and manufacturing network. We provide ready-to-market products that you can brand as your own.
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">✓</span>
                      <span>Pre-designed quality products</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">✓</span>
                      <span>Faster time-to-market</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">✓</span>
                      <span>Customizable branding options</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm px-8 py-6 border-t border-white/20">
              <div className="flex items-center justify-center gap-3 text-white">
                <TrendingUp className="h-6 w-6 text-red-500" />
                <p className="text-lg">
                  <span className="font-semibold">Unified Brand Quality:</span> We provide consistent, high-quality branded products to wholesalers and retailers, empowering you with strong competitive advantages in your local markets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 20 Years Experience Statistics Section */}
      <div className="bg-white pt-12 pb-2 mb-1.5 border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-4">
          {/* Main Section Title */}
          <div className="text-center mb-4">
            <h2 className="text-gray-900 font-bold text-4xl mb-6">What We Have</h2>
          </div>

          <div className="text-center mb-12">
            <h2 className="mb-4 text-gray-900">20 Years of Excellence in China Sourcing</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Since 2005, we have been helping international buyers navigate China's manufacturing landscape with confidence and success.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-4">
                <Award className="h-10 w-10 text-red-600" />
              </div>
              <div className="mb-2 text-4xl font-bold text-red-600">20+</div>
              <div className="text-gray-700">Years of Experience</div>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-orange-100 p-4">
                <Users className="h-10 w-10 text-orange-600" />
              </div>
              <div className="mb-2 text-4xl font-bold text-orange-600">5,000+</div>
              <div className="text-gray-700">Satisfied Clients Worldwide</div>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-blue-100 p-4">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              <div className="mb-2 text-4xl font-bold text-blue-600">10,000+</div>
              <div className="text-gray-700">Verified Suppliers Network</div>
            </div>
            
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-100 p-4">
                <Globe className="h-10 w-10 text-green-600" />
              </div>
              <div className="mb-2 text-4xl font-bold text-green-600">80+</div>
              <div className="text-gray-700">Countries Served</div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-gray-50 border-l-4 border-red-600 p-6 rounded-lg max-w-2xl mx-auto">
              <p className="text-gray-900 text-lg italic">
                "Two decades of expertise means we know exactly how to source, inspect, and deliver quality products that meet your exact specifications."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Intelligence & Latest Products - Core Competitive Advantage */}
      <div className="relative overflow-hidden bg-white pt-12 pb-1.5">
        <div className="mx-auto max-w-7xl px-4">
          {/* Main Section Title */}
          <div className="text-center mb-8">
            <h2 className="text-gray-900 font-bold text-4xl mb-6">Empowering Your Competitive Advantage</h2>
            <h2 className="mb-6 text-gray-900">
              Market Intelligence & Latest Product Updates
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Stay ahead of your competition with our dedicated market monitoring service. We continuously track the latest product trends and innovations across China's manufacturing landscape.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl opacity-20 blur-2xl"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1748609379330-db65f1354c6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXQlMjB0cmVuZHMlMjBkYXRhJTIwYW5hbHlzaXN8ZW58MXx8fHwxNzYxNDY0Njk1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Market Intelligence and Trends Analysis"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                  <Zap className="h-5 w-5" />
                  <span className="font-semibold">Real-Time Updates</span>
                </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <LineChart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Continuous Market Monitoring</h4>
                    <p className="text-sm text-gray-600">
                      Our team actively monitors market trends, new product launches, and emerging innovations across all categories.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">First-to-Market Advantage</h4>
                    <p className="text-sm text-gray-600">
                      Receive instant notifications about the latest products, allowing you to be first to market and ahead of competitors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Personalized Product Alerts</h4>
                    <p className="text-sm text-gray-600">
                      Customized notifications tailored to your business needs, ensuring you only receive relevant market updates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">🎯 Always One Step Ahead</h4>
                    <p className="text-sm text-gray-600">
                      "Our market intelligence service ensures you're always informed about the latest product innovations, giving you the competitive edge to capture market opportunities before your competitors do."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WHAT WE SERVE - Service Modes */}
      <div className="px-4 py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-gray-900 font-bold text-4xl mb-6">
              What We Serve
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-base">
              Four comprehensive service models designed to meet all your China sourcing needs
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
            {/* Service 1: All Kinds of Products Supply */}
            <Card className="border-2 border-gray-200 hover:border-red-600 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-red-100 p-4">
                    <Boxes className="h-10 w-10 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-gray-900 text-xl">All Kinds of Products Supply</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full">Building Materials</span>
                      <span className="text-xs bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full">Home Furnishings</span>
                      <span className="text-xs bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full">Tools & Equipment</span>
                      <span className="text-xs bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full">Outdoor Products</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3 text-sm leading-snug">
                  We supply diverse product categories across all industries - from building materials and home furnishings to tools, equipment, electrical, plumbing, outdoor, and specialized products. Our extensive supplier network ensures we can source virtually any product you need.
                </p>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-0">
                    <strong className="text-red-600">20+ years</strong> of product sourcing expertise across all categories
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service 2: Professional Inspection & Shipment Services */}
            <Card className="border-2 border-gray-200 hover:border-red-600 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-orange-100 p-4">
                    <ClipboardCheck className="h-10 w-10 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-gray-900 text-xl">Professional Inspection & Shipment Services</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full">Quality Inspection</span>
                      <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full">Container Loading</span>
                      <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full">Customs Clearance</span>
                      <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full">Logistics Coordination</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3 text-sm leading-snug">
                  Our certified QC team provides comprehensive pre-shipment inspection services to ensure your products meet quality standards. We also offer expert shipment arrangement services including container loading optimization, customs documentation, and logistics coordination.
                </p>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-0">
                    <strong className="text-orange-600">Expert consolidation</strong> of mixed cargo from multiple suppliers
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service 3: Overseas Client Agency Services */}
            <Card className="border-2 border-gray-200 hover:border-red-600 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-blue-100 p-4">
                    <Handshake className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-gray-900 text-xl">Overseas Client Agency Services</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">Supplier Sourcing</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">Price Negotiation</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">Quality Monitoring</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">Full Representation</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3 text-sm leading-snug">
                  Act as your dedicated procurement agent in China. We handle everything from supplier sourcing and price negotiation to quality control and shipment arrangement. Consider us your local office and trusted partner managing all aspects of your China sourcing operations.
                </p>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-0">
                    <strong className="text-blue-600">Your trusted partner</strong> with complete procurement authority in China
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service 4: One-Stop Project Solutions for Contractors */}
            <Card className="border-2 border-gray-200 hover:border-red-600 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-green-100 p-4">
                    <HardHat className="h-10 w-10 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-gray-900 text-xl">One-Stop Project Solutions for Contractors</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">Material Sourcing</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">Multi-Supplier Coordination</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">Timeline Management</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">Budget Control</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3 text-sm leading-snug">
                  Comprehensive turnkey solutions for project contractors. We source all required materials, coordinate multiple suppliers, ensure timely delivery, and manage quality control - providing complete project support from initial procurement to final delivery.
                </p>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-0">
                    <strong className="text-green-600">Complete project support</strong> ensuring on-time, on-budget delivery
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-600 p-6 rounded-xl max-w-5xl mx-auto shadow-lg">
              <h3 className="text-gray-900 mb-2 text-xl">Flexible Service Models Tailored to Your Needs</h3>
              <p className="text-gray-700 text-base mb-0">
                Whether you need comprehensive product sourcing, professional inspection services, a dedicated China agent, or complete project solutions - we have the expertise and resources to support your business success. Our 20 years of experience ensures reliable, efficient, and professional service delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HOW WE SERVE - Service Process */}
      <div className="px-4 py-16 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center md:mb-0" style={{ marginBottom: '-40px' }}>
            <h2 className="mb-4 text-gray-900 font-bold text-4xl">How We Serve</h2>
            <p className="text-gray-600 max-w-3xl mx-auto mb-0">
              Our proven 6-step process ensures seamless procurement excellence
            </p>
          </div>

          {/* Mobile Version - Vertical Flow (visible on mobile only) */}
          <div className="block lg:hidden mt-12 px-2">
            <div className="space-y-4 max-w-lg mx-auto">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-700 flex-shrink-0">
                  <div className="text-2xl font-bold text-white">1</div>
                </div>
                <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-lg border-2 border-blue-500">
                  <h4 className="font-bold text-gray-900 mb-2 text-base">Requirement Analysis</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Understand your product specs, quality standards, budget constraints, and delivery timeline
                  </p>
                </div>
              </div>

              {/* Connector Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-300 to-orange-300 rounded-full"></div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-700 flex-shrink-0">
                  <div className="text-2xl font-bold text-white">2</div>
                </div>
                <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-lg border-2 border-orange-500">
                  <h4 className="font-bold text-gray-900 mb-2 text-base">Supplier Matching</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Leverage our 10,000+ verified supplier network to find manufacturers matching your needs
                  </p>
                </div>
              </div>

              {/* Connector Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-300 to-green-300 rounded-full"></div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-700 flex-shrink-0">
                  <div className="text-2xl font-bold text-white">3</div>
                </div>
                <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-lg border-2 border-green-600">
                  <h4 className="font-bold text-gray-900 mb-2 text-base">Quotation & Negotiation</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Collect quotes, negotiate best prices and terms, provide comprehensive comparisons
                  </p>
                </div>
              </div>

              {/* Connector Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-6 bg-gradient-to-b from-green-300 to-red-300 rounded-full"></div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-700 flex-shrink-0">
                  <div className="text-2xl font-bold text-white">4</div>
                </div>
                <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-lg border-2 border-red-600">
                  <h4 className="font-bold text-gray-900 mb-2 text-base">Production Monitoring</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    On-site factory visits, progress tracking, ensure adherence to your specifications
                  </p>
                </div>
              </div>

              {/* Connector Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-6 bg-gradient-to-b from-red-300 to-purple-300 rounded-full"></div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-700 flex-shrink-0">
                  <div className="text-2xl font-bold text-white">5</div>
                </div>
                <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-lg border-2 border-purple-600">
                  <h4 className="font-bold text-gray-900 mb-2 text-base">Pre-Shipment Inspection</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Comprehensive quality checks, verify specs, packaging, quantity, detailed reports
                  </p>
                </div>
              </div>

              {/* Connector Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-300 to-pink-300 rounded-full"></div>
              </div>

              {/* Step 6 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-pink-600 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-700 flex-shrink-0">
                  <div className="text-2xl font-bold text-white">6</div>
                </div>
                <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-lg border-2 border-pink-600">
                  <h4 className="font-bold text-gray-900 mb-2 text-base">Logistics & Delivery</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    International shipping, customs handling, real-time tracking, safe delivery on schedule
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Version - U-Shape Track Process Flow (hidden on mobile) */}
          <div className="hidden lg:block relative max-w-7xl mx-auto px-16" style={{ height: '700px' }} key="u-shape-track-v3-force-update">
            {/* SVG U-Shape Track - Centered */}
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="550" height="600" viewBox="0 0 550 600" preserveAspectRatio="xMidYMid meet">
              {/* Outer U-shape track (dark) */}
              <path
                d="M 120,70 L 120,420 Q 120,500 200,500 L 350,500 Q 430,500 430,420 L 430,70"
                fill="none"
                stroke="#3f3f46"
                strokeWidth="35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Inner dashed white line */}
              <path
                d="M 120,70 L 120,420 Q 120,500 200,500 L 350,500 Q 430,500 430,420 L 430,70"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="12,8"
                strokeLinecap="round"
              />
            </svg>

            {/* Step 1 - Top Left - Text box left, circle closer to track */}
            <div className="absolute" style={{ left: '16%', top: '10%' }} key="step-1">
              <div className="flex items-center gap-3">
                <div className="text-right bg-white px-4 py-3 rounded-lg shadow-lg border-2 border-blue-500 w-48">
                  <h4 className="font-bold text-gray-900 mb-2">Requirement Analysis</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Understand your product specs, quality standards, budget constraints, and delivery timeline
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-xl border-3 border-gray-700 hover:scale-110 transition-all duration-300 cursor-pointer flex-shrink-0">
                  <div className="text-xl font-bold text-white">1</div>
                </div>
              </div>
            </div>

            {/* Step 2 - Left Middle - Text box left, circle closer to track */}
            <div className="absolute" style={{ left: '16%', top: '43%' }} key="step-2">
              <div className="flex items-center gap-3">
                <div className="text-right bg-white px-4 py-3 rounded-lg shadow-lg border-2 border-orange-500 w-48">
                  <h4 className="font-bold text-gray-900 mb-2">Supplier Matching</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Leverage our 10,000+ verified supplier network to find manufacturers matching your needs
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-xl border-3 border-gray-700 hover:scale-110 transition-all duration-300 cursor-pointer flex-shrink-0">
                  <div className="text-xl font-bold text-white">2</div>
                </div>
              </div>
            </div>

            {/* Step 3 - Bottom Left - Circle closer to track, text below */}
            <div className="absolute" style={{ left: '32.45%', top: '77%' }} key="step-3-adjusted-17percent">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-xl border-3 border-gray-700 hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="text-xl font-bold text-white">3</div>
                </div>
                <div className="mt-3 text-center bg-white px-4 py-3 rounded-lg shadow-lg border-2 border-green-600 w-56" style={{ transform: 'translateX(-25%)' }}>
                  <h4 className="font-bold text-gray-900 mb-2">Quotation & Negotiation</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Collect quotes, negotiate best prices and terms, provide comprehensive comparisons
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 - Bottom Right - Circle closer to track, text below */}
            <div className="absolute" style={{ left: '50%', top: '77%' }} key="step-4-half-distance-v6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-xl border-3 border-gray-700 hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="text-xl font-bold text-white">4</div>
                </div>
                <div className="mt-3 text-center bg-white px-4 py-3 rounded-lg shadow-lg border-2 border-red-600 w-56" style={{ transform: 'translateX(25%)' }}>
                  <h4 className="font-bold text-gray-900 mb-2">Production Monitoring</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    On-site factory visits, progress tracking, ensure adherence to your specifications
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 - Right Middle - Circle closer to track, text box right */}
            <div className="absolute" style={{ left: '84%', top: '43%', transform: 'translateX(-100%)' }} key="step-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-xl border-3 border-gray-700 hover:scale-110 transition-all duration-300 cursor-pointer flex-shrink-0">
                  <div className="text-xl font-bold text-white">5</div>
                </div>
                <div className="text-left bg-white px-4 py-3 rounded-lg shadow-lg border-2 border-purple-600 w-48">
                  <h4 className="font-bold text-gray-900 mb-2">Pre-Shipment Inspection</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Comprehensive quality checks, verify specs, packaging, quantity, detailed reports
                  </p>
                </div>
              </div>
            </div>

            {/* Step 6 - Top Right - Circle closer to track, text box right */}
            <div className="absolute" style={{ left: '84%', top: '10%', transform: 'translateX(-100%)' }} key="step-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center shadow-xl border-3 border-gray-700 hover:scale-110 transition-all duration-300 cursor-pointer flex-shrink-0">
                  <div className="text-xl font-bold text-white">6</div>
                </div>
                <div className="text-left bg-white px-4 py-3 rounded-lg shadow-lg border-2 border-pink-600 w-48">
                  <h4 className="font-bold text-gray-900 mb-2">Logistics & Delivery</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    International shipping, customs handling, real-time tracking, safe delivery on schedule
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border-l-4 border-red-600 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="text-gray-900 mb-3">Dedicated Support Throughout</h3>
              <p className="text-gray-700">
                Your dedicated account manager provides transparent communication and complete support at every step, ensuring a smooth and successful procurement journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}