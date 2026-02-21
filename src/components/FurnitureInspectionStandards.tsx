import { ArrowLeft, Shield, FileCheck, Download, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useRouter } from '../contexts/RouterContext';
import furnitureChecklistImg from 'figma:asset/449e8b06677bf9fe72121dddbf7d74e0acb94025.png';

export function FurnitureInspectionStandards() {
  const { navigateTo } = useRouter();

  const standards = [
    {
      code: 'EN 12520',
      description: 'Furniture - Strength, durability and safety - Requirements for domestic seating',
    },
    {
      code: 'ASTM F2057',
      description: 'Standard Safety Specification for Clothing Storage Units',
    },
  ];

  const inspectionPoints = [
    'Structural Stability & Safety',
    'Surface Finish & Appearance',
    'Hardware & Fasteners Quality',
    'Dimensional Accuracy',
    'Material Compliance',
    'Packaging & Labeling',
    'Assembly Instructions',
    'Load Bearing Capacity',
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
          <div className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full mb-4">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Furniture Inspection Standards
            </span>
          </div>
          <h1 className="text-gray-900 mb-4">
            Furniture Quality Inspection Standards
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Our comprehensive furniture inspection follows international standards to ensure safety, durability, and quality compliance for all furniture products.
          </p>
        </div>

        {/* Standards Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {standards.map((standard, index) => (
            <Card key={index} className="border-2 border-emerald-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
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

        {/* Key Inspection Points */}
        <div className="mb-12">
          <h2 className="text-gray-900 text-center mb-8">
            Key Inspection Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inspectionPoints.map((point, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-emerald-400 transition-all flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Checklist Section */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-gray-900 mb-4">
                Detailed Furniture Inspection Checklist
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our comprehensive checklist covers every aspect of furniture quality, from structural integrity to surface finishing. Click to view or download the full checklist.
              </p>
            </div>

            {/* Checklist Image */}
            <div className="relative bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 mb-6">
              <img
                src={furnitureChecklistImg}
                alt="Furniture Inspection Checklist"
                className="w-full h-auto"
              />
            </div>

            {/* Download Button */}
            <div className="text-center">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6"
                onClick={() => {
                  // In a real application, this would trigger a download
                  window.open(furnitureChecklistImg, '_blank');
                }}
              >
                <Download className="h-5 w-5 mr-2" />
                Download Full Checklist (PDF)
              </Button>
            </div>
          </div>
        </div>

        {/* Inspection Process Overview */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 rounded-2xl shadow-lg border-2 border-emerald-100 p-8 md:p-12 mb-12">
          <h2 className="text-gray-900 text-center mb-8">
            Our Inspection Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">1</span>
              </div>
              <h3 className="text-gray-900 mb-3">Pre-Inspection Review</h3>
              <p className="text-gray-600 text-sm">
                Review product specifications, purchase orders, and technical drawings before on-site inspection
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">2</span>
              </div>
              <h3 className="text-gray-900 mb-3">On-Site Inspection</h3>
              <p className="text-gray-600 text-sm">
                Conduct comprehensive checks following AQL standards and furniture-specific requirements
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">3</span>
              </div>
              <h3 className="text-gray-900 mb-3">Detailed Reporting</h3>
              <p className="text-gray-600 text-sm">
                Provide comprehensive reports with photos, measurements, and recommendations within 24 hours
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-white mb-4">
            Need Furniture Quality Inspection?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Our certified QC team is ready to help ensure your furniture products meet all quality and safety standards. Get in touch for a consultation.
          </p>
          <Button
            size="lg"
            className="bg-white text-emerald-600 hover:bg-gray-100"
            onClick={() => navigateTo('qcmaster')}
          >
            Request QC Service
          </Button>
        </div>
      </div>
    </section>
  );
}
