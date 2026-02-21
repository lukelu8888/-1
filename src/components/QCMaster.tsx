import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from '../contexts/RouterContext';
import { CheckCircle2, Shield, FileCheck, Users, Award, Target, Microscope, ClipboardCheck, Gamepad2, Cpu, Zap, Lightbulb, Shirt, Watch, Armchair, Package, AlertCircle, TrendingUp, Calculator, List, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { QCServiceRequestForm } from './QCServiceRequestForm';
import { AQLContent } from './AQLContent';
import { useState } from 'react';
import qcProductionLineImg from 'figma:asset/96ce897684bf626f176c96b9ce387073b6485b82.png';
import qcPackagingImg from 'figma:asset/26367985c980ce30b777ba7adde790055c901cb7.png';
import qcElectronicsTestImg from 'figma:asset/9f6ce029d040cf60e23a103732b61615c3bba3e2.png';
import qcLabTestImg from 'figma:asset/f3d557c4db1f8e6758ad3b445050bc79712a44d7.png';
import certificateImg from 'figma:asset/10750d4fe5459959d5f7e17851160e90519488f9.png';
import qcHeroImg from 'figma:asset/8b8f9232f60a2046628bfa02ab68d1e507203f48.png';

export function QCMaster() {
  const { t } = useLanguage();
  const { navigateTo } = useRouter();
  const [showAQLTable, setShowAQLTable] = useState(false);

  const features = [
    {
      icon: Shield,
      title: t.qcMaster.features.comprehensive,
      description: t.qcMaster.features.comprehensiveDesc,
    },
    {
      icon: Microscope,
      title: t.qcMaster.features.inspection,
      description: t.qcMaster.features.inspectionDesc,
    },
    {
      icon: FileCheck,
      title: t.qcMaster.features.documentation,
      description: t.qcMaster.features.documentationDesc,
    },
    {
      icon: Users,
      title: t.qcMaster.features.team,
      description: t.qcMaster.features.teamDesc,
    },
  ];

  const services = [
    {
      title: t.qcMaster.services.preProduction,
      items: [
        t.qcMaster.services.preProductionItems.factoryAudit,
        t.qcMaster.services.preProductionItems.sampleApproval,
        t.qcMaster.services.preProductionItems.materialVerification,
      ],
      image: qcElectronicsTestImg,
    },
    {
      title: t.qcMaster.services.duringProduction,
      items: [
        t.qcMaster.services.duringProductionItems.processMonitoring,
        t.qcMaster.services.duringProductionItems.qualityChecks,
        t.qcMaster.services.duringProductionItems.progressReports,
      ],
      image: qcProductionLineImg,
    },
    {
      title: t.qcMaster.services.preShipment,
      items: [
        t.qcMaster.services.preShipmentItems.finalInspection,
        t.qcMaster.services.preShipmentItems.packagingVerification,
        t.qcMaster.services.preShipmentItems.quantityCheck,
      ],
      image: qcPackagingImg,
    },
  ];

  const standards = [
    'ISO 9001',
    'ASTM Standards',
    'EN Standards',
    'GB Standards',
    'ANSI Standards',
    'CE Certification',
  ];

  const benefits = [
    {
      icon: Target,
      title: t.qcMaster.benefits.defectReduction,
      description: t.qcMaster.benefits.defectReductionDesc,
    },
    {
      icon: Award,
      title: t.qcMaster.benefits.compliance,
      description: t.qcMaster.benefits.complianceDesc,
    },
    {
      icon: ClipboardCheck,
      title: t.qcMaster.benefits.transparency,
      description: t.qcMaster.benefits.transparencyDesc,
    },
    {
      icon: Shield,
      title: t.qcMaster.benefits.riskMitigation,
      description: t.qcMaster.benefits.riskMitigationDesc,
    },
  ];

  return (
    <section id="qc-master" className="bg-gradient-to-b from-white to-gray-50">
      {/* Hero Banner with Background Image */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${qcHeroImg})` }}
        >
          {/* Dark Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-white/90 text-red-600 rounded-full mb-6">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                QC Master
              </span>
            </div>
            <h1 className="text-white mb-6 text-4xl md:text-5xl lg:text-6xl">
              {t.qcMaster.title}
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto">
              {t.qcMaster.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* Table of Contents */}
        <div className="mb-16">
          <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <List className="h-6 w-6 text-blue-600" />
                <h2 className="text-gray-900 text-center">Table of Contents</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                <a 
                  href="#qc-services" 
                  className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span>1</span>
                  </div>
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors">Our QC Services</span>
                </a>
                <a 
                  href="#inspection-framework" 
                  className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span>2</span>
                  </div>
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors">Quality Inspection Framework</span>
                </a>
                <a 
                  href="#aql-standards" 
                  className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span>3</span>
                  </div>
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors">AQL Standards & Calculator</span>
                </a>
                <a 
                  href="#why-choose-us" 
                  className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span>4</span>
                  </div>
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors">Why Choose Us</span>
                </a>
                <a 
                  href="#compliance-standards" 
                  className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span>5</span>
                  </div>
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors">Compliance Standards</span>
                </a>
                <a 
                  href="#request-service" 
                  className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-red-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <span>6</span>
                  </div>
                  <span className="text-gray-700 group-hover:text-red-600 transition-colors">Request QC Service</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 1. Our QC Services */}
        <div id="qc-services" className="mb-16 scroll-mt-20">
          <h2 className="text-gray-900 text-center mb-12">
            {t.qcMaster.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-blue-500 transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 2. Quality Inspection Framework Section */}
        <div id="inspection-framework" className="mb-16 scroll-mt-20">
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-100 p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-gray-900 mb-4">Quality Inspection Framework</h2>
              <div className="max-w-4xl mx-auto">
                <p className="text-gray-700 leading-relaxed">
                  COSUN inspection procedures strictly follow the international{' '}
                  <span className="text-blue-600">AQL sampling framework</span>{' '}
                  (ANSI/ASQC Z1.4 / BS 6001 / DIN 40080 / ISO 2859 / NFX 06-022), while product-specific inspections are carried out based on relevant international and regional standards, including but not limited to:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Toys */}
              <Card 
                className="bg-white border-2 border-gray-200 hover:border-pink-400 hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                onClick={() => navigateTo('toysinspection')}
              >
                <CardContent className="p-5 h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h4 className="text-gray-900 mb-2">Toys</h4>
                    <ul className="space-y-0.5 text-sm text-gray-600 mb-3 flex-grow">
                      <li>ASTM F963</li>
                      <li>EN71</li>
                      <li>ISO 8124</li>
                    </ul>
                    <div className="text-xs text-emerald-600 font-medium">
                      Click for detailed standards →
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Electronics */}
              <Card 
                className="bg-white border-2 border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                onClick={() => navigateTo('electronicsinspection')}
              >
                <CardContent className="p-5 h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Cpu className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h4 className="text-gray-900 mb-2">Electronics</h4>
                    <ul className="space-y-0.5 text-sm text-gray-600 mb-3 flex-grow">
                      <li>IEC 60335</li>
                      <li>IEC 60950</li>
                      <li>IEC 62368</li>
                      <li>RoHS</li>
                    </ul>
                    <div className="text-xs text-emerald-600 font-medium">
                      Click for detailed standards →
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appliances */}
              <Card 
                className="bg-white border-2 border-gray-200 hover:border-orange-400 hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                onClick={() => navigateTo('appliancesinspection')}
              >
                <CardContent className="p-5 h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h4 className="text-gray-900 mb-2">Appliances</h4>
                    <ul className="space-y-0.5 text-sm text-gray-600 mb-3 flex-grow">
                      <li>IEC 60335-1</li>
                      <li>GB 4706.1</li>
                    </ul>
                    <div className="text-xs text-emerald-600 font-medium">
                      Click for detailed standards →
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lighting */}
              <Card 
                className="bg-white border-2 border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                onClick={() => navigateTo('lightinginspection')}
              >
                <CardContent className="p-5 h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h4 className="text-gray-900 mb-2">Lighting</h4>
                    <ul className="space-y-0.5 text-sm text-gray-600 mb-3 flex-grow">
                      <li>IEC 60598</li>
                      <li>UL 153</li>
                    </ul>
                    <div className="text-xs text-emerald-600 font-medium">
                      Click for detailed standards →
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Textiles & Garments */}
              <Card 
                className="bg-white border-2 border-gray-200 hover:border-purple-400 hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                onClick={() => navigateTo('textilesinspection')}
              >
                <CardContent className="p-5 h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Shirt className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h4 className="text-gray-900 mb-2">Textiles & Garments</h4>
                    <ul className="space-y-0.5 text-sm text-gray-600 mb-3 flex-grow">
                      <li>ASTM D2054</li>
                      <li>AATCC 8</li>
                    </ul>
                    <div className="text-xs text-emerald-600 font-medium">
                      Click for detailed standards →
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shoes */}
              <Card 
                className="bg-white border-2 border-gray-200 hover:border-cyan-400 hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                onClick={() => navigateTo('shoesinspection')}
              >
                <CardContent className="p-5 h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                        <Watch className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h4 className="text-gray-900 mb-2">Shoes</h4>
                    <ul className="space-y-0.5 text-sm text-gray-600 mb-3 flex-grow">
                      <li>SATRA TM</li>
                      <li>ISO 20871</li>
                    </ul>
                    <div className="text-xs text-emerald-600 font-medium">
                      Click for detailed standards →
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Furniture */}
              <Card 
                className="bg-white border-2 border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer overflow-hidden h-full"
                onClick={() => navigateTo('furnitureinspection')}
              >
                <CardContent className="p-5 h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Armchair className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h4 className="text-gray-900 mb-2">Furniture</h4>
                    <ul className="space-y-0.5 text-sm text-gray-600 mb-3 flex-grow">
                      <li>EN 12520</li>
                      <li>ASTM F2057</li>
                    </ul>
                    <div className="text-xs text-emerald-600 font-medium">
                      Click for detailed standards →
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Packaging */}
              <Card 
                className="bg-white border-2 border-gray-200 hover:border-teal-400 hover:shadow-md transition-all overflow-hidden cursor-pointer h-full"
                onClick={() => navigateTo('packaginginspection')}
              >
                <CardContent className="p-5 h-full">
                  <div className="text-center h-full flex flex-col">
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h4 className="text-gray-900 mb-2">Packaging</h4>
                    <ul className="space-y-0.5 text-sm text-gray-600 mb-3 flex-grow">
                      <li>ISO 2248</li>
                      <li>ASTM D4169</li>
                    </ul>
                    <div className="text-xs text-emerald-600 font-medium">
                      Click for detailed standards →
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Note */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  International Standards Compliance Guaranteed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. AQL (Acceptable Quality Limit) Comprehensive Section */}
        <div id="aql-standards" className="mb-16 scroll-mt-20">
          <AQLContent />
        </div>

        {/* 4. Why Choose Us */}
        <div id="why-choose-us" className="mb-16 scroll-mt-20">
          <h2 className="text-gray-900 text-center mb-12">
            {t.qcMaster.benefitsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border-2 p-6 hover:border-blue-500 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Compliance Standards */}
        <div id="compliance-standards" className="mb-16 scroll-mt-20">
          <div className="bg-white rounded-2xl shadow-sm border p-8 md:p-12">
            <h2 className="text-gray-900 text-center mb-8">
              {t.qcMaster?.standardsTitle || 'Quality Standards We Follow'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {standards.map((standard, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 text-center border-2 border-transparent hover:border-blue-500 transition-all"
                >
                  <p className="text-gray-900">{standard}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. CTA Section */}
        <div id="request-service" className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-white mb-4">
            {t.qcMaster.ctaTitle}
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            {t.qcMaster.ctaDesc}
          </p>
          <QCServiceRequestForm />
        </div>
      </div>
    </section>
  );
}