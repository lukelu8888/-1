import { useLanguage } from '../contexts/LanguageContext';
import { useState } from 'react';
import { CheckCircle2, Package, Truck, FileCheck, Users, Globe2, Clock, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { ImageWithFallback } from './figma/ImageWithFallback';
import processDiagram from 'figma:asset/d05a768ad03cf9724be73608024eaea836fca1a8.png';

export function ProjectSolution() {
  const { t } = useLanguage();
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const projects = [
    {
      title: t.projectSolution.projects.cannabis,
      image: 'https://images.unsplash.com/photo-1741471598347-b1bfbccf184b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW5uYWJpcyUyMGZhY2lsaXR5JTIwcHJvZHVjdGlvbnxlbnwxfHx8fDE3NjA3ODQ1OTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: t.projectSolution.projects.warehouse,
      subtitle: 'Disposable Nitrile Glove Production Line',
      image: 'https://images.unsplash.com/photo-1759310347581-b3eb0a385ef9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwd2FyZWhvdXNlJTIwZmFjaWxpdHl8ZW58MXx8fHwxNzYwNzczNzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: t.projectSolution.projects.manufacturing,
      image: 'https://images.unsplash.com/photo-1722842895153-ba7bf9d53dfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW51ZmFjdHVyaW5nJTIwcGxhbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NjA3NzM3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const services = [
    {
      icon: Package,
      title: t.projectSolution.services.procurement,
      description: t.projectSolution.services.procurementDesc,
    },
    {
      icon: FileCheck,
      title: t.projectSolution.services.quality,
      description: t.projectSolution.services.qualityDesc,
    },
    {
      icon: Truck,
      title: t.projectSolution.services.logistics,
      description: t.projectSolution.services.logisticsDesc,
    },
    {
      icon: Shield,
      title: t.projectSolution.services.compliance,
      description: t.projectSolution.services.complianceDesc,
    },
  ];

  const benefits = [
    t.projectSolution.benefits.costReduction,
    t.projectSolution.benefits.timeEfficiency,
    t.projectSolution.benefits.qualityAssurance,
    t.projectSolution.benefits.riskMitigation,
    t.projectSolution.benefits.singleContact,
    t.projectSolution.benefits.expertiseAccess,
  ];

  const process = [
    {
      step: '01',
      title: t.projectSolution.process.consultation,
      description: t.projectSolution.process.consultationDesc,
    },
    {
      step: '02',
      title: t.projectSolution.process.contract,
      description: t.projectSolution.process.contractDesc,
    },
    {
      step: '03',
      title: t.projectSolution.process.engineering,
      description: t.projectSolution.process.engineeringDesc,
    },
    {
      step: '04',
      title: t.projectSolution.process.fabricating,
      description: t.projectSolution.process.fabricatingDesc,
    },
    {
      step: '05',
      title: t.projectSolution.process.quality,
      description: t.projectSolution.process.qualityDesc,
    },
    {
      step: '06',
      title: t.projectSolution.process.logistics,
      description: t.projectSolution.process.logisticsDesc,
    },
    {
      step: '07',
      title: t.projectSolution.process.delivery,
      description: t.projectSolution.process.deliveryDesc,
    },
  ];

  return (
    <section id="project-solution" className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full mb-4">
            <span className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              Project Solution
            </span>
          </div>
          <h1 className="text-gray-900 mb-4">
            {t.projectSolution.title}
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {t.projectSolution.subtitle}
          </p>
        </div>

        {/* Project Portfolio Carousel */}
        <div className="mb-16">
          <h2 className="text-gray-900 text-center mb-12">
            {t.projectSolution.projectsTitle}
          </h2>
          <div className="relative px-12">
            <Carousel className="w-full">
              <CarouselContent>
                {projects.map((project, index) => (
                  <CarouselItem key={index}>
                    <div className="relative">
                      <div className="aspect-video overflow-hidden rounded-2xl shadow-2xl relative">
                        <ImageWithFallback
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                          <h3 className="text-white text-2xl">{project.title}</h3>
                          {project.subtitle && (
                            <p className="text-white/90 mt-2">{project.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>
        </div>

        {/* Cannabis Project Details */}
        <div className="mb-16 bg-white rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-8 md:p-12">
            <h2 className="text-gray-900 mb-4">
              {t.projectSolution.cannabisTitle}
            </h2>
            <p className="text-gray-600 mb-8">
              {t.projectSolution.cannabisDesc}
            </p>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-gray-900 mb-6 text-center">
                {t.projectSolution.processDiagram}
              </h3>
              <div className="bg-white rounded-lg p-4 overflow-auto">
                <img
                  src={processDiagram}
                  alt="Cannabis Production Process Diagram"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key Services */}
        <div className="mb-16">
          <h2 className="text-gray-900 text-center mb-12">
            {t.projectSolution.servicesTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-2 hover:border-orange-500 transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16 bg-white rounded-2xl shadow-sm border p-8 md:p-12">
          <h2 className="text-gray-900 text-center mb-12">
            {t.projectSolution.benefitsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="mb-16">
          <h2 className="text-gray-900 text-center mb-12">
            {t.projectSolution.processTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
            {process.map((item, index) => {
              const isSelected = selectedStep === index;
              return (
                <div key={index} className="relative">
                  <div 
                    onClick={() => setSelectedStep(index)}
                    className={`rounded-xl border-2 p-6 transition-all duration-300 h-full min-h-[280px] flex flex-col cursor-pointer
                      ${isSelected 
                        ? 'bg-orange-500 border-orange-500 shadow-lg' 
                        : 'bg-white border-gray-200 hover:bg-orange-500 hover:border-orange-500 hover:shadow-lg'
                      } group`}
                  >
                    <div className={`text-5xl mb-4 transition-colors duration-300
                      ${isSelected 
                        ? 'text-white opacity-30' 
                        : 'text-orange-500 opacity-20 group-hover:text-white group-hover:opacity-30'
                      }`}>
                      {item.step}
                    </div>
                    <h3 className={`mb-3 transition-colors duration-300
                      ${isSelected 
                        ? 'text-white' 
                        : 'text-gray-900 group-hover:text-white'
                      }`}>
                      {item.title}
                    </h3>
                    <p className={`text-sm leading-relaxed flex-grow transition-colors duration-300
                      ${isSelected 
                        ? 'text-white/90' 
                        : 'text-gray-600 group-hover:text-white/90'
                      }`}>
                      {item.description}
                    </p>
                  </div>
                  {index < process.length - 1 && (
                    <div className="hidden xl:block absolute top-1/2 -right-3 w-6 h-0.5 bg-orange-300 z-10"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 md:p-12 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-white mb-6">
                {t.projectSolution.whyChooseTitle}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  <span>{t.projectSolution.whyChoose.experience}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6" />
                  <span>{t.projectSolution.whyChoose.turnkeyExperience}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe2 className="h-6 w-6" />
                  <span>{t.projectSolution.whyChoose.network}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6" />
                  <span>{t.projectSolution.whyChoose.efficiency}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6" />
                  <span>{t.projectSolution.whyChoose.reliability}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white mb-4">{t.projectSolution.contactTitle}</h3>
              <p className="text-white/90 mb-6">
                {t.projectSolution.contactDesc}
              </p>
              <Button 
                size="lg" 
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                {t.projectSolution.contactButton}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
