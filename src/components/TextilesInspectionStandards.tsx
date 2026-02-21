import { ArrowLeft, Shield, FileCheck, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useRouter } from '../contexts/RouterContext';
import textilesChecklistImg from 'figma:asset/abcf1deabe9a15f0256b8fa939bf83b64999e03e.png';

export function TextilesInspectionStandards() {
  const { navigateTo } = useRouter();

  const standards = [
    {
      code: 'ASTM D2054',
      description: 'Standard Test Method for Evaluation of Yarn Defects Using Appearance Boards',
    },
    {
      code: 'AATCC 8',
      description: 'Test Method for Color Fastness to Crocking: AATCC Crockmeter Method',
    },
  ];

  const inspectionPoints = [
    'Fabric Defects Inspection',
    'Color Fastness Testing',
    'Dimensional Stability',
    'Yarn Quality Assessment',
    'Weaving & Knitting Defects',
    'Print Quality & Alignment',
    'Seam Strength & Quality',
    'Care Label Compliance',
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
          <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full mb-4">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Textiles & Garments Inspection Standards
            </span>
          </div>
          <h1 className="text-gray-900 mb-4">
            Textiles & Garments Quality Inspection Standards
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Our comprehensive textiles and garments inspection follows international standards to ensure fabric quality, color fastness, and compliance for all textile products.
          </p>
        </div>

        {/* Standards Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {standards.map((standard, index) => (
            <Card key={index} className="border-2 border-purple-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors group"
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
                className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-400 transition-all flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
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
                Detailed Fabric Faults & Defects Guide
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our comprehensive guide covers fabric defects classification systems including the 4-Point System, defect types identification, and quality assessment criteria. Click to view or download the full guide.
              </p>
            </div>

            {/* Checklist Image */}
            <div className="relative bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 mb-6">
              <img
                src={textilesChecklistImg}
                alt="Textiles & Garments Inspection Standards Guide"
                className="w-full h-auto"
              />
            </div>

            {/* Download Button */}
            <div className="text-center">
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6"
                onClick={() => {
                  // In a real application, this would trigger a download
                  window.open(textilesChecklistImg, '_blank');
                }}
              >
                <Download className="h-5 w-5 mr-2" />
                Download Full Guide (PDF)
              </Button>
            </div>
          </div>
        </div>

        {/* Inspection Process Overview */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-2xl shadow-lg border-2 border-purple-100 p-8 md:p-12 mb-12">
          <h2 className="text-gray-900 text-center mb-8">
            Our Inspection Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">1</span>
              </div>
              <h3 className="text-gray-900 mb-3">Pre-Inspection Review</h3>
              <p className="text-gray-600 text-sm">
                Review fabric specifications, color standards, and purchase orders before conducting the inspection
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">2</span>
              </div>
              <h3 className="text-gray-900 mb-3">On-Site Inspection</h3>
              <p className="text-gray-600 text-sm">
                Conduct fabric roll-by-roll inspection using 4-Point System and industry-standard defect classification
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">3</span>
              </div>
              <h3 className="text-gray-900 mb-3">Detailed Reporting</h3>
              <p className="text-gray-600 text-sm">
                Provide comprehensive reports with defect photos, measurements, and acceptance recommendations within 24 hours
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-white mb-4">
            Need Textiles & Garments Quality Inspection?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Our certified QC team specializes in textile inspection and garment quality control. We ensure your products meet international fabric quality standards. Get in touch for a consultation.
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100"
            onClick={() => navigateTo('qcmaster')}
          >
            Request QC Service
          </Button>
        </div>
      </div>
    </section>
  );
}
