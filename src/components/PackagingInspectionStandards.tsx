import { ArrowLeft, Shield, FileCheck, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useRouter } from '../contexts/RouterContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function PackagingInspectionStandards() {
  const { navigateTo } = useRouter();

  const standards = [
    {
      code: 'ISO 2248',
      description: 'Packaging - Complete, filled transport packages and unit loads - Vertical impact test by dropping',
    },
    {
      code: 'ASTM D4169',
      description: 'Standard Practice for Performance Testing of Shipping Containers and Systems',
    },
  ];

  const inspectionPoints = [
    'Material Quality',
    'Structural Integrity',
    'Drop Test Performance',
    'Compression Strength',
    'Moisture Resistance',
    'Print Quality',
    'Dimensional Accuracy',
    'Labeling Compliance',
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4">
        {/* Back Button */}
        <button
          onClick={() => navigateTo('qcmaster')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Quality Inspection Framework</span>
        </button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full mb-4">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Packaging Quality Inspection Standards
            </span>
          </div>
          <h1 className="text-gray-900 mb-4">
            Packaging Quality Inspection Standards
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Our comprehensive packaging inspection follows international quality and performance standards to ensure structural integrity, protection capability, and compliance for all packaging products.
          </p>
        </div>

        {/* Standards Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {standards.map((standard, index) => (
            <Card key={index} className="border-2 border-teal-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 mb-2">{standard.code}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {standard.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Click for Detailed Standards Link */}
        <div className="mb-12 text-center">
          <a
            href="#detailed-guide"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors group"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('detailed-guide')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="text-lg">Click for detailed standards</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Key Inspection Points */}
        <div className="mb-12">
          <h2 className="text-gray-900 text-center mb-8">
            Key Inspection Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inspectionPoints.map((point, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-teal-400 transition-all flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Checklist Section */}
        <div className="mb-12" id="detailed-guide">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-gray-900 mb-4">
                Detailed Packaging Testing Guide
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our comprehensive guide covers packaging testing protocols including drop testing, compression testing, material quality assessment, and compliance with international packaging performance standards.
              </p>
            </div>

            {/* Checklist Image */}
            <div className="relative bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 mb-6">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1686632800715-b705ba1b0eb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNrYWdpbmclMjBtYXRlcmlhbHMlMjBjYXJkYm9hcmR8ZW58MXx8fHwxNzYxMDMyMTE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Packaging Quality Inspection Standards Guide"
                className="w-full h-auto"
              />
            </div>

            {/* Download Button */}
            <div className="text-center">
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Full Guide (PDF)
              </Button>
            </div>
          </div>
        </div>

        {/* Inspection Process Overview */}
        <div className="bg-gradient-to-br from-teal-50 via-white to-teal-50 rounded-2xl shadow-lg border-2 border-teal-100 p-8 md:p-12 mb-12">
          <h2 className="text-gray-900 text-center mb-8">
            Our Inspection Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">1</span>
              </div>
              <h3 className="text-gray-900 mb-3">Material Assessment</h3>
              <p className="text-gray-600 text-sm">
                Review packaging specifications, material requirements, and performance criteria before testing
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">2</span>
              </div>
              <h3 className="text-gray-900 mb-3">Performance Testing</h3>
              <p className="text-gray-600 text-sm">
                Conduct comprehensive drop, compression, and durability tests using industry-standard protocols
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">3</span>
              </div>
              <h3 className="text-gray-900 mb-3">Quality Reporting</h3>
              <p className="text-gray-600 text-sm">
                Provide detailed test reports with performance data, compliance status, and recommendations
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-white mb-4">
            Need Packaging Quality Testing?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Our certified QC team specializes in packaging performance testing and quality control. We ensure your packaging meets international standards for product protection. Get in touch for a consultation.
          </p>
          <Button
            size="lg"
            className="bg-white text-teal-600 hover:bg-gray-100"
            onClick={() => navigateTo('qcmaster')}
          >
            Request QC Service
          </Button>
        </div>
      </div>
    </section>
  );
}
