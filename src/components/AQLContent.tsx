// AQL (Acceptable Quality Limit) Content Component for QCMaster
// All "QIMA" references replaced with "COSUN"
// Enhanced with visual hierarchy, interactive elements, and improved layout

import { Calculator, AlertCircle, TrendingUp, List, CheckCircle2, Shield, ArrowRight, Package, Search, BarChart3, ClipboardCheck, XCircle, Sparkles, Info, ChevronRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AQLCalculator } from './AQLCalculator';
import { useState } from 'react';

export function AQLContent() {
  const [selectedLotSize, setSelectedLotSize] = useState<number | null>(null);
  const [hoveredDefectType, setHoveredDefectType] = useState<string | null>(null);
  const [hoveredColIndexTableA, setHoveredColIndexTableA] = useState<number | null>(null);
  const [hoveredAQLGroupTableB, setHoveredAQLGroupTableB] = useState<number | null>(null);
  const [hoveredRowIndexTableA, setHoveredRowIndexTableA] = useState<number | null>(null);
  const [hoveredRowIndexTableB, setHoveredRowIndexTableB] = useState<number | null>(null);

  // Sample size calculator helper
  const getSampleInfo = (lotSize: number) => {
    if (lotSize <= 8) return { code: 'A', sample: 2, major: '0/1', minor: '0/1' };
    if (lotSize <= 15) return { code: 'B', sample: 3, major: '0/1', minor: '0/1' };
    if (lotSize <= 25) return { code: 'C', sample: 5, major: '0/1', minor: '0/1' };
    if (lotSize <= 50) return { code: 'D', sample: 8, major: '0/1', minor: '0/1' };
    if (lotSize <= 90) return { code: 'E', sample: 13, major: '0/1', minor: '0/1' };
    if (lotSize <= 150) return { code: 'F', sample: 20, major: '0/1', minor: '1/2' };
    if (lotSize <= 280) return { code: 'G', sample: 32, major: '1/2', minor: '2/3' };
    if (lotSize <= 500) return { code: 'H', sample: 50, major: '1/2', minor: '3/4' };
    if (lotSize <= 1200) return { code: 'J', sample: 80, major: '2/3', minor: '5/6' };
    if (lotSize <= 3200) return { code: 'K', sample: 125, major: '3/4', minor: '7/8' };
    if (lotSize <= 10000) return { code: 'L', sample: 200, major: '5/6', minor: '10/11' };
    if (lotSize <= 35000) return { code: 'M', sample: 315, major: '7/8', minor: '14/15' };
    if (lotSize <= 150000) return { code: 'N', sample: 500, major: '10/11', minor: '21/22' };
    if (lotSize <= 500000) return { code: 'P', sample: 800, major: '14/15', minor: '21/22' };
    return { code: 'Q', sample: 1250, major: '21/22', minor: '21/22' };
  };

  return (
    <div className="mb-16">
      {/* AQL Hero Section with Enhanced Visual Hierarchy */}
      <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50 rounded-2xl shadow-xl border-2 border-orange-200 overflow-hidden mb-8">
        <div className="p-8 md:p-12">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full mb-6 shadow-lg">
              <Calculator className="h-5 w-5" />
              <span className="font-semibold">AQL Quality Standard</span>
            </div>
            <h2 className="text-gray-900 mb-6">Understanding AQL (Acceptable Quality Limit)</h2>
            <p className="text-gray-700 max-w-4xl mx-auto leading-relaxed text-lg">
              The Acceptable Quality Limit (AQL) is a critical statistical tool used in quality control to determine the maximum number of defective units that can be considered acceptable during random sampling inspection.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">COSUN strictly adheres to ISO 2859-1 AQL standards</span>
            </div>
          </div>

          {/* Visual Process Flow - Enhanced with Icons and Arrows */}
          <div className="mb-12">
            <div className="bg-white rounded-xl p-6 md:p-8 border-2 border-gray-200 shadow-sm">
              <h3 className="text-gray-900 mb-8 text-center flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                AQL Inspection Process
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-xs font-medium text-gray-900 mb-1">Step 1</div>
                  <div className="text-xs text-gray-600">Determine Lot Size</div>
                </div>

                <div className="hidden md:flex justify-center">
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-xs font-medium text-gray-900 mb-1">Step 2</div>
                  <div className="text-xs text-gray-600">Select Level (II)</div>
                </div>

                <div className="hidden md:flex justify-center">
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                    <List className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-xs font-medium text-gray-900 mb-1">Step 3</div>
                  <div className="text-xs text-gray-600">Define AQL</div>
                </div>

                <div className="hidden md:flex justify-center">
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>

                {/* Step 4 */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-xs font-medium text-gray-900 mb-1">Step 4</div>
                  <div className="text-xs text-gray-600">Inspect Samples</div>
                </div>
              </div>

              {/* Detailed Steps Below */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1 text-sm">Determine the Lot Size</h4>
                      <p className="text-xs text-gray-700">Count total units in the production batch or shipment</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1 text-sm">Select Inspection Level</h4>
                      <p className="text-xs text-gray-700">Choose Level I, II (standard), or III based on risk</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1 text-sm">Define AQL Levels</h4>
                      <p className="text-xs text-gray-700">Set AQL values for Critical (0), Major (2.5), Minor (4.0)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1 text-sm">Inspect & Apply Criteria</h4>
                      <p className="text-xs text-gray-700">Random sampling, classify defects, compare to Ac/Re numbers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What is AQL - Enhanced with Tabs */}
          <div className="mb-10">
            <Card className="border-2 border-gray-200 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-white mb-1">What is AQL?</h3>
                      <p className="text-white/90 text-sm">Understanding the fundamentals of Acceptable Quality Limit</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <Tabs defaultValue="definition" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="definition">Definition</TabsTrigger>
                      <TabsTrigger value="benefits">Benefits</TabsTrigger>
                      <TabsTrigger value="standards">Standards</TabsTrigger>
                    </TabsList>

                    <TabsContent value="definition" className="space-y-4">
                      <p className="text-gray-700 leading-relaxed">
                        AQL stands for <span className="font-semibold text-orange-600">"Acceptable Quality Limit"</span> and is defined as the worst tolerable quality level. It represents the maximum percentage of defective items that can be found in a lot while still being considered acceptable.
                      </p>
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-900 font-medium mb-1">Important Note</p>
                            <p className="text-sm text-gray-700">
                              If the AQL is set at 2.5%, it does NOT mean you'll receive 2.5% defective goods. It's a statistical measure used to determine sampling size and acceptance/rejection criteria.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="benefits" className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1 text-sm">Cost-Effective Quality Control</h4>
                          <p className="text-sm text-gray-700">Inspect representative samples instead of 100% inspection, reducing time and costs</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1 text-sm">Statistical Accuracy</h4>
                          <p className="text-sm text-gray-700">Uses statistical probability to determine optimal sample sizes and acceptance criteria</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1 text-sm">Global Standard</h4>
                          <p className="text-sm text-gray-700">Universally recognized across industries and accepted by retailers worldwide</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="standards" className="space-y-3">
                      <p className="text-gray-700 text-sm mb-4">AQL is standardized across multiple international frameworks:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <p className="font-medium text-gray-900 text-sm">ISO 2859-1</p>
                          <p className="text-xs text-gray-600 mt-1">International</p>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <p className="font-medium text-gray-900 text-sm">ANSI/ASQ Z1.4</p>
                          <p className="text-xs text-gray-600 mt-1">USA</p>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <p className="font-medium text-gray-900 text-sm">BS 6001</p>
                          <p className="text-xs text-gray-600 mt-1">British</p>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <p className="font-medium text-gray-900 text-sm">DIN 40080</p>
                          <p className="text-xs text-gray-600 mt-1">German</p>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <p className="font-medium text-gray-900 text-sm">NFX 06-022</p>
                          <p className="text-xs text-gray-600 mt-1">French</p>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <p className="font-medium text-gray-900 text-sm">GB/T 2828</p>
                          <p className="text-xs text-gray-600 mt-1">Chinese</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Defect Classification - Enhanced with Interactive Hover */}
          <div className="mb-10">
            <div className="text-center mb-8">
              <h3 className="text-gray-900 mb-3 flex items-center justify-center gap-2">
                <List className="h-6 w-6 text-red-600" />
                Three Types of Defects in AQL
              </h3>
              <p className="text-gray-600 max-w-3xl mx-auto">
                COSUN inspectors classify every defect into one of three categories based on severity and impact
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Critical Defects */}
              <Card 
                className={`border-2 transition-all cursor-pointer overflow-hidden ${
                  hoveredDefectType === 'critical' 
                    ? 'border-red-500 shadow-xl scale-105' 
                    : 'border-red-200 shadow-lg hover:border-red-400'
                }`}
                onMouseEnter={() => setHoveredDefectType('critical')}
                onMouseLeave={() => setHoveredDefectType(null)}
              >
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <XCircle className="h-6 w-6" />
                        </div>
                        <h4 className="text-white font-semibold">Critical Defects</h4>
                      </div>
                      <Badge className="bg-white text-red-600 hover:bg-white">AQL 0</Badge>
                    </div>
                    <p className="text-white/90 text-sm">Zero Tolerance Policy</p>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-700 mb-4">
                      Defects that pose safety hazards or violate mandatory regulations. Products cannot be sold.
                    </p>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <p className="text-xs font-medium text-gray-900 mb-2">Examples:</p>
                      <ul className="space-y-1.5 text-xs text-gray-700">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>Sharp edges on toys</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>Electrical safety failures</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>Toxic materials</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>Choking hazards</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Major Defects */}
              <Card 
                className={`border-2 transition-all cursor-pointer overflow-hidden ${
                  hoveredDefectType === 'major' 
                    ? 'border-orange-500 shadow-xl scale-105' 
                    : 'border-orange-200 shadow-lg hover:border-orange-400'
                }`}
                onMouseEnter={() => setHoveredDefectType('major')}
                onMouseLeave={() => setHoveredDefectType(null)}
              >
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <AlertCircle className="h-6 w-6" />
                        </div>
                        <h4 className="text-white font-semibold">Major Defects</h4>
                      </div>
                      <Badge className="bg-white text-orange-600 hover:bg-white">AQL 2.5</Badge>
                    </div>
                    <p className="text-white/90 text-sm">Standard Quality Level</p>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-700 mb-4">
                      Significantly impact functionality, usability, or salability. Product can't serve intended purpose.
                    </p>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-xs font-medium text-gray-900 mb-2">Examples:</p>
                      <ul className="space-y-1.5 text-xs text-gray-700">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span>Product doesn't work</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span>Wrong size/dimensions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span>Missing parts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span>Broken fasteners</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Minor Defects */}
              <Card 
                className={`border-2 transition-all cursor-pointer overflow-hidden ${
                  hoveredDefectType === 'minor' 
                    ? 'border-yellow-500 shadow-xl scale-105' 
                    : 'border-yellow-200 shadow-lg hover:border-yellow-400'
                }`}
                onMouseEnter={() => setHoveredDefectType('minor')}
                onMouseLeave={() => setHoveredDefectType(null)}
              >
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <h4 className="text-white font-semibold">Minor Defects</h4>
                      </div>
                      <Badge className="bg-white text-yellow-600 hover:bg-white">AQL 4.0</Badge>
                    </div>
                    <p className="text-white/90 text-sm">Cosmetic Quality Level</p>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-700 mb-4">
                      Cosmetic or aesthetic defects that don't affect functionality but may reduce perceived value.
                    </p>
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <p className="text-xs font-medium text-gray-900 mb-2">Examples:</p>
                      <ul className="space-y-1.5 text-xs text-gray-700">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span>Small scratches</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span>Slight color variation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span>Minor packaging defects</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span>Crooked labels</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Interactive AQL Level Comparison */}
          <div className="mb-10">
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-gray-900 mb-6 text-center">Common AQL Levels Comparison</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">AQL Level</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Defect Type</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Tolerance</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-red-50 transition-colors">
                        <td className="border border-gray-300 px-4 py-3">
                          <Badge variant="destructive">AQL 0</Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">Critical</td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className="font-semibold text-red-600">Zero Tolerance</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-gray-700">Safety & regulatory compliance</td>
                      </tr>
                      <tr className="hover:bg-purple-50 transition-colors">
                        <td className="border border-gray-300 px-4 py-3">
                          <Badge className="bg-purple-600">AQL 0.065</Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">Major/Minor</td>
                        <td className="border border-gray-300 px-4 py-3">Very Strict</td>
                        <td className="border border-gray-300 px-4 py-3 text-gray-700">Luxury products, medical devices</td>
                      </tr>
                      <tr className="hover:bg-blue-50 transition-colors">
                        <td className="border border-gray-300 px-4 py-3">
                          <Badge className="bg-blue-600">AQL 1.0</Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">Major/Minor</td>
                        <td className="border border-gray-300 px-4 py-3">Strict</td>
                        <td className="border border-gray-300 px-4 py-3 text-gray-700">Premium products</td>
                      </tr>
                      <tr className="bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-colors">
                        <td className="border border-gray-300 px-4 py-3">
                          <Badge className="bg-orange-600">AQL 2.5</Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-semibold">Major</td>
                        <td className="border border-gray-300 px-4 py-3 font-semibold">Standard</td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-gray-900">COSUN Default - Most common</span>
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 transition-colors">
                        <td className="border border-gray-300 px-4 py-3">
                          <Badge className="bg-yellow-600">AQL 4.0</Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-semibold">Minor</td>
                        <td className="border border-gray-300 px-4 py-3 font-semibold">Standard</td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-gray-900">COSUN Default - Cosmetic defects</span>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-300 px-4 py-3">
                          <Badge variant="outline">AQL 6.5</Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">Minor</td>
                        <td className="border border-gray-300 px-4 py-3">Relaxed</td>
                        <td className="border border-gray-300 px-4 py-3 text-gray-700">Budget products, hidden components</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">COSUN Standard Recommendation</p>
                      <p className="text-sm text-gray-700">
                        We recommend the <span className="font-semibold">0/2.5/4.0</span> combination for most products: 
                        <span className="font-medium"> AQL 0</span> for Critical, 
                        <span className="font-medium"> AQL 2.5</span> for Major, and 
                        <span className="font-medium"> AQL 4.0</span> for Minor defects.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AQL Sampling Simulator - Interactive Calculator */}
          <AQLCalculator />

          {/* TABLE 1: Sample Size Code Letters */}
          <div className="mb-10">
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6 md:p-8">
                {/* Table A Header */}
                <div className="mb-6">
                  <h3 className="text-gray-900 mb-3">Table A</h3>
                  <p className="text-gray-700 mb-3">
                    Find the respective Lot Size (quantity) and general inspection level: Code letter L{' '}
                    <span className="italic">Note: The AQL tables below are based on the ANSI/ASQ Standard Z1.4 – 2008</span>
                  </p>
                </div>

                {/* Sample Size Code Letters Badge */}
                <div className="flex justify-center mb-6">
                  <div className="inline-block bg-red-600 text-white px-8 py-3 rounded-full">
                    <span className="font-semibold">Sample size code letters</span>
                  </div>
                </div>
                
                {/* Mobile-Friendly: Scrollable table */}
                <div className="overflow-x-auto -mx-6 md:mx-0">
                  <div className="inline-block min-w-full align-middle px-6 md:px-0">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-white border-b-2 border-gray-300">
                          <th rowSpan={2} className="border border-gray-300 px-4 py-1 text-left font-semibold text-gray-900 align-middle">Lot Size</th>
                          <th colSpan={3} className="border border-gray-300 px-4 py-1 text-center font-semibold text-gray-900">General Inspection Levels</th>
                          <th colSpan={4} className="border border-gray-300 px-4 py-1 text-center font-semibold text-gray-900">Special Inspection Levels</th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th 
                            className={`border border-gray-300 px-3 py-0.5 text-center font-semibold transition-all duration-200 cursor-pointer ${hoveredColIndexTableA === 0 ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            onMouseEnter={() => setHoveredColIndexTableA(0)}
                            onMouseLeave={() => setHoveredColIndexTableA(null)}
                          >I</th>
                          <th 
                            className={`border border-gray-300 px-3 py-0.5 text-center font-semibold transition-all duration-200 cursor-pointer ${hoveredColIndexTableA === 1 ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            onMouseEnter={() => setHoveredColIndexTableA(1)}
                            onMouseLeave={() => setHoveredColIndexTableA(null)}
                          >II</th>
                          <th 
                            className={`border border-gray-300 px-3 py-0.5 text-center font-semibold transition-all duration-200 cursor-pointer ${hoveredColIndexTableA === 2 ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            onMouseEnter={() => setHoveredColIndexTableA(2)}
                            onMouseLeave={() => setHoveredColIndexTableA(null)}
                          >III</th>
                          <th 
                            className={`border border-gray-300 px-3 py-0.5 text-center font-semibold transition-all duration-200 cursor-pointer ${hoveredColIndexTableA === 3 ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            onMouseEnter={() => setHoveredColIndexTableA(3)}
                            onMouseLeave={() => setHoveredColIndexTableA(null)}
                          >S1</th>
                          <th 
                            className={`border border-gray-300 px-3 py-0.5 text-center font-semibold transition-all duration-200 cursor-pointer ${hoveredColIndexTableA === 4 ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            onMouseEnter={() => setHoveredColIndexTableA(4)}
                            onMouseLeave={() => setHoveredColIndexTableA(null)}
                          >S2</th>
                          <th 
                            className={`border border-gray-300 px-3 py-0.5 text-center font-semibold transition-all duration-200 cursor-pointer ${hoveredColIndexTableA === 5 ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            onMouseEnter={() => setHoveredColIndexTableA(5)}
                            onMouseLeave={() => setHoveredColIndexTableA(null)}
                          >S3</th>
                          <th 
                            className={`border border-gray-300 px-3 py-0.5 text-center font-semibold transition-all duration-200 cursor-pointer ${hoveredColIndexTableA === 6 ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            onMouseEnter={() => setHoveredColIndexTableA(6)}
                            onMouseLeave={() => setHoveredColIndexTableA(null)}
                          >S4</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {[
                          { lot: '2 to 8', i: 'A', ii: 'A', iii: 'B', s1: 'A', s2: 'A', s3: 'A', s4: 'A' },
                          { lot: '9 to 15', i: 'A', ii: 'B', iii: 'C', s1: 'A', s2: 'A', s3: 'A', s4: 'A' },
                          { lot: '16 to 25', i: 'B', ii: 'C', iii: 'D', s1: 'A', s2: 'A', s3: 'B', s4: 'B' },
                          { lot: '26 to 50', i: 'C', ii: 'D', iii: 'E', s1: 'A', s2: 'B', s3: 'B', s4: 'C' },
                          { lot: '51 to 90', i: 'C', ii: 'E', iii: 'F', s1: 'B', s2: 'B', s3: 'C', s4: 'C' },
                          { lot: '91 to 150', i: 'D', ii: 'F', iii: 'G', s1: 'B', s2: 'B', s3: 'C', s4: 'D' },
                          { lot: '151 to 280', i: 'E', ii: 'G', iii: 'H', s1: 'B', s2: 'C', s3: 'D', s4: 'E' },
                          { lot: '281 to 500', i: 'F', ii: 'H', iii: 'J', s1: 'B', s2: 'C', s3: 'D', s4: 'E' },
                          { lot: '501 to 1,200', i: 'G', ii: 'J', iii: 'K', s1: 'C', s2: 'C', s3: 'E', s4: 'F' },
                          { lot: '1,201 to 3,200', i: 'H', ii: 'K', iii: 'L', s1: 'C', s2: 'D', s3: 'E', s4: 'G' },
                          { lot: '3,201 to 10,000', i: 'J', ii: 'L', iii: 'M', s1: 'C', s2: 'D', s3: 'F', s4: 'G' },
                          { lot: '10,001 to 35,000', i: 'K', ii: 'M', iii: 'N', s1: 'C', s2: 'D', s3: 'F', s4: 'H' },
                          { lot: '35,001 to 150,000', i: 'L', ii: 'N', iii: 'P', s1: 'D', s2: 'E', s3: 'G', s4: 'J' },
                          { lot: '150,001 to 500,000', i: 'M', ii: 'P', iii: 'Q', s1: 'D', s2: 'E', s3: 'G', s4: 'J' },
                          { lot: '500,001 and over', i: 'N', ii: 'Q', iii: 'R', s1: 'D', s2: 'E', s3: 'H', s4: 'K' },
                        ].map((row, index) => (
                          <tr 
                            key={index}
                            className={`${Math.floor(index / 3) % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
                            onMouseEnter={() => setHoveredRowIndexTableA(index)}
                            onMouseLeave={() => setHoveredRowIndexTableA(null)}
                          >
                            <td className={`border border-gray-300 px-4 py-1 transition-all duration-200 ${hoveredRowIndexTableA === index ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}>{row.lot}</td>
                            <td 
                              className={`border border-gray-300 px-3 py-1 text-center font-mono transition-all duration-200 ${hoveredColIndexTableA === 0 || hoveredRowIndexTableA === index ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            >{row.i}</td>
                            <td 
                              className={`border border-gray-300 px-3 py-1 text-center font-mono transition-all duration-200 ${hoveredColIndexTableA === 1 || hoveredRowIndexTableA === index ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            >{row.ii}</td>
                            <td 
                              className={`border border-gray-300 px-3 py-1 text-center font-mono transition-all duration-200 ${hoveredColIndexTableA === 2 || hoveredRowIndexTableA === index ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            >{row.iii}</td>
                            <td 
                              className={`border border-gray-300 px-3 py-1 text-center font-mono transition-all duration-200 ${hoveredColIndexTableA === 3 || hoveredRowIndexTableA === index ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            >{row.s1}</td>
                            <td 
                              className={`border border-gray-300 px-3 py-1 text-center font-mono transition-all duration-200 ${hoveredColIndexTableA === 4 || hoveredRowIndexTableA === index ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            >{row.s2}</td>
                            <td 
                              className={`border border-gray-300 px-3 py-1 text-center font-mono transition-all duration-200 ${hoveredColIndexTableA === 5 || hoveredRowIndexTableA === index ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            >{row.s3}</td>
                            <td 
                              className={`border border-gray-300 px-3 py-1 text-center font-mono transition-all duration-200 ${hoveredColIndexTableA === 6 || hoveredRowIndexTableA === index ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                            >{row.s4}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TABLE B: Single Sampling Plans for Normal Inspection */}
          <div className="mb-10">
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6 md:p-8">
                {/* Table B Header */}
                <div className="mb-6">
                  <h3 className="text-gray-900 mb-3">Table B</h3>
                  <p className="text-gray-700 mb-3">
                    Locate Row L (the required sample size of 200) In compliance with AQL 2.5, no more than 10 units from a sample size of 200 may fail the inspection.
                  </p>
                </div>

                {/* Single Sampling Plans Badge */}
                <div className="flex justify-center mb-6">
                  <div className="inline-block bg-red-600 text-white px-8 py-3 rounded-full">
                    <span className="font-semibold">Single sampling plans for normal inspection</span>
                  </div>
                </div>
                
                {/* Mobile-Friendly: Scrollable table */}
                <div className="overflow-x-auto -mx-6 md:mx-0">
                  <div className="inline-block min-w-full align-middle px-6 md:px-0">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-white border-b-2 border-gray-300">
                          <th rowSpan={2} className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-900 align-middle leading-tight">Sample<br/>Size<br/>Code<br/>Letter</th>
                          <th rowSpan={2} className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-900 align-middle leading-tight">Sample<br/>Size</th>
                          <th colSpan={22} className="border border-gray-300 px-3 py-1 text-center font-semibold text-gray-900 bg-gray-50 leading-tight">Acceptable Quality Levels (Normal Inspection)</th>
                        </tr>
                        <tr className="bg-white">
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 0 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(0)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >0.065</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 1 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(1)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >0.10</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 2 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(2)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >0.15</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 3 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(3)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >0.25</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 4 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(4)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >0.40</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 5 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(5)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >0.65</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 6 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(6)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >1.0</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 7 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(7)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >1.5</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 8 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(8)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >2.5</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 9 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(9)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >4.0</th>
                          <th 
                            colSpan={2} 
                            className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 cursor-pointer ${hoveredAQLGroupTableB === 10 ? 'bg-red-600 text-white scale-105' : 'text-red-600'}`}
                            onMouseEnter={() => setHoveredAQLGroupTableB(10)}
                            onMouseLeave={() => setHoveredAQLGroupTableB(null)}
                          >6.5</th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-0.5"></th>
                          <th className="border border-gray-300 px-3 py-0.5"></th>
                          {Array.from({ length: 22 }, (_, i) => {
                            const aqlGroup = Math.floor(i / 2);
                            const isHovered = hoveredAQLGroupTableB === aqlGroup;
                            return (
                              <th 
                                key={i}
                                className={`border border-gray-300 px-2 py-0.5 text-center transition-all duration-200 ${isHovered ? 'bg-red-600 text-white scale-105' : 'text-gray-700'}`}
                              >
                                {i % 2 === 0 ? 'Ac' : 'Re'}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {(() => {
                          // Helper function to render table cells with colspan support for arrows
                          const renderCells = (cells: Array<{type: 'gray-arrow'|'arrow'|'num', val?: string, colspan?: number}>, rowIdx: number) => {
                            let colIndex = 0;
                            return cells.map((cell, idx) => {
                              const currentColIndex = colIndex;
                              const aqlGroup = Math.floor(currentColIndex / 2);
                              const isHovered = hoveredAQLGroupTableB === aqlGroup || hoveredRowIndexTableB === rowIdx;
                              
                              if (cell.colspan && cell.colspan > 1) {
                                colIndex += cell.colspan;
                              } else {
                                colIndex += 1;
                              }
                              
                              if (cell.type === 'arrow') {
                                return (
                                  <td 
                                    key={idx}
                                    colSpan={cell.colspan || 2}
                                    className={`border border-gray-300 px-2 py-1 text-center text-lg transition-all duration-200 ${isHovered ? 'bg-red-600 text-white scale-105' : 'text-gray-400'}`}
                                  >
                                    {cell.val}
                                  </td>
                                );
                              } else if (cell.type === 'gray-arrow') {
                                return (
                                  <td 
                                    key={idx}
                                    colSpan={cell.colspan || 2}
                                    className={`border border-gray-300 px-2 py-1 text-center text-lg transition-all duration-200 ${isHovered ? 'bg-red-600 text-white scale-105' : 'text-gray-400'}`}
                                  >
                                    {cell.val}
                                  </td>
                                );
                              } else {
                                return (
                                  <td 
                                    key={idx}
                                    className={`border border-gray-300 px-2 py-1 text-center transition-all duration-200 ${isHovered ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}
                                  >
                                    {cell.val}
                                  </td>
                                );
                              }
                            });
                          };

                          // Table data with colspan arrows spanning Ac/Re columns
                          const tableData = [
                            { code: 'A', size: 2, cells: [...Array(9).fill({type: 'gray-arrow', val: '↓', colspan: 2}), {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}] },
                            { code: 'B', size: 3, cells: [...Array(8).fill({type: 'gray-arrow', val: '↓', colspan: 2}), {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}] },
                            { code: 'C', size: 5, cells: [...Array(7).fill({type: 'gray-arrow', val: '↓', colspan: 2}), {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'gray-arrow', val: '↓', colspan: 2}] },
                            { code: 'D', size: 8, cells: [...Array(6).fill({type: 'gray-arrow', val: '↓', colspan: 2}), {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'gray-arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}] },
                            { code: 'E', size: 13, cells: [...Array(5).fill({type: 'gray-arrow', val: '↓', colspan: 2}), {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}] },
                            { code: 'F', size: 20, cells: [...Array(4).fill({type: 'gray-arrow', val: '↓', colspan: 2}), {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}] },
                            { code: 'G', size: 32, cells: [...Array(3).fill({type: 'gray-arrow', val: '↓', colspan: 2}), {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}] },
                            { code: 'H', size: 50, cells: [...Array(2).fill({type: 'gray-arrow', val: '↓', colspan: 2}), {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}] },
                            { code: 'J', size: 80, cells: [{type: 'gray-arrow', val: '↓', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}, {type: 'num', val: '10'}, {type: 'num', val: '11'}] },
                            { code: 'K', size: 125, cells: [{type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}, {type: 'num', val: '10'}, {type: 'num', val: '11'}, {type: 'num', val: '14'}, {type: 'num', val: '15'}] },
                            { code: 'L', size: 200, cells: [{type: 'num', val: '0'}, {type: 'num', val: '1'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}, {type: 'num', val: '10'}, {type: 'num', val: '11'}, {type: 'num', val: '14'}, {type: 'num', val: '15'}, {type: 'num', val: '21'}, {type: 'num', val: '22'}] },
                            { code: 'M', size: 315, cells: [{type: 'arrow', val: '↑', colspan: 2}, {type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}, {type: 'num', val: '10'}, {type: 'num', val: '11'}, {type: 'num', val: '14'}, {type: 'num', val: '15'}, {type: 'num', val: '21'}, {type: 'num', val: '22'}, {type: 'arrow', val: '↑', colspan: 2}] },
                            { code: 'N', size: 500, cells: [{type: 'arrow', val: '↓', colspan: 2}, {type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}, {type: 'num', val: '10'}, {type: 'num', val: '11'}, {type: 'num', val: '14'}, {type: 'num', val: '15'}, {type: 'num', val: '21'}, {type: 'num', val: '22'}, {type: 'arrow', val: '↑', colspan: 2}, {type: 'gray-arrow', val: '↑', colspan: 2}] },
                            { code: 'P', size: 800, cells: [{type: 'num', val: '1'}, {type: 'num', val: '2'}, {type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}, {type: 'num', val: '10'}, {type: 'num', val: '11'}, {type: 'num', val: '14'}, {type: 'num', val: '15'}, {type: 'num', val: '21'}, {type: 'num', val: '22'}, {type: 'arrow', val: '↑', colspan: 2}, ...Array(2).fill({type: 'gray-arrow', val: '↑', colspan: 2})] },
                            { code: 'Q', size: 1250, cells: [{type: 'num', val: '2'}, {type: 'num', val: '3'}, {type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}, {type: 'num', val: '10'}, {type: 'num', val: '11'}, {type: 'num', val: '14'}, {type: 'num', val: '15'}, {type: 'num', val: '21'}, {type: 'num', val: '22'}, {type: 'arrow', val: '↑', colspan: 2}, ...Array(3).fill({type: 'gray-arrow', val: '↑', colspan: 2})] },
                            { code: 'R', size: 2000, cells: [{type: 'num', val: '3'}, {type: 'num', val: '4'}, {type: 'num', val: '5'}, {type: 'num', val: '6'}, {type: 'num', val: '7'}, {type: 'num', val: '8'}, {type: 'num', val: '10'}, {type: 'num', val: '11'}, {type: 'num', val: '14'}, {type: 'num', val: '15'}, {type: 'num', val: '21'}, {type: 'num', val: '22'}, {type: 'arrow', val: '↑', colspan: 2}, ...Array(4).fill({type: 'gray-arrow', val: '↑', colspan: 2})] }
                          ];

                          return tableData.map((row, rowIdx) => (
                            <tr 
                              key={rowIdx} 
                              className={`${Math.floor(rowIdx / 3) % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
                              onMouseEnter={() => setHoveredRowIndexTableB(rowIdx)}
                              onMouseLeave={() => setHoveredRowIndexTableB(null)}
                            >
                              <td className={`border border-gray-300 px-3 py-1 text-center font-mono font-semibold transition-all duration-200 ${hoveredRowIndexTableB === rowIdx ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}>{row.code}</td>
                              <td className={`border border-gray-300 px-3 py-1 text-center transition-all duration-200 ${hoveredRowIndexTableB === rowIdx ? 'bg-red-600 text-white scale-105' : 'text-gray-900'}`}>{row.size}</td>
                              {renderCells(row.cells, rowIdx)}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Arrow Rules Explanation */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-2xl flex-shrink-0">↓</span>
                      <div>
                        <p className="text-sm text-gray-900">
                          Use first sampling plan <span className="font-semibold">below arrow</span>, if sample size equals or exceeds lot or batch size, do 100 percent inspection.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-2xl flex-shrink-0">↑</span>
                      <div>
                        <p className="text-sm text-gray-900">
                          Use first sampling plan <span className="font-semibold">above arrow</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ac/Re Explanation */}
                <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">AC:</span> Acceptance number&nbsp;&nbsp;&nbsp;&nbsp;
                        <span className="font-semibold">Re:</span> Rejection number
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section - Already using Accordion */}
          <div className="mb-10">
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
                
                <Accordion type="single" collapsible className="space-y-3">
                  <AccordionItem value="item-1" className="border-2 border-gray-200 rounded-lg px-4 hover:border-blue-400 transition-colors">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium text-gray-900">Does AQL guarantee I won't receive any defective products?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 leading-relaxed pt-2">
                      No. AQL is a statistical sampling method, not a 100% guarantee. It determines the maximum acceptable defect rate in a batch. However, because COSUN uses random sampling, the actual defect rate in your shipment is typically much lower than the AQL level. For zero-defect requirements, 100% inspection would be needed, which significantly increases costs and time.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border-2 border-gray-200 rounded-lg px-4 hover:border-blue-400 transition-colors">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium text-gray-900">Can I choose a stricter AQL level for better quality?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 leading-relaxed pt-2">
                      Yes! COSUN can apply stricter AQL levels like 1.0 or 0.65 for major and minor defects if you require higher quality standards. This is common for luxury brands or products with demanding quality requirements. However, stricter AQL levels mean larger sample sizes and may increase inspection costs.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border-2 border-gray-200 rounded-lg px-4 hover:border-blue-400 transition-colors">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium text-gray-900">What happens if my shipment fails the AQL inspection?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 leading-relaxed pt-2">
                      <p className="mb-3">If the number of defects exceeds the rejection number, COSUN will issue a detailed report. You have several options:</p>
                      <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><span className="font-medium">Re-inspection:</span> Request supplier to sort/rework defective products</li>
                        <li><span className="font-medium">Partial shipment:</span> Accept only non-defective portions</li>
                        <li><span className="font-medium">Negotiation:</span> Use the report to negotiate credits or discounts</li>
                        <li><span className="font-medium">Rejection:</span> Refuse the entire shipment</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border-2 border-gray-200 rounded-lg px-4 hover:border-blue-400 transition-colors">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium text-gray-900">Can AQL levels be customized for different product components?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 leading-relaxed pt-2">
                      Absolutely. COSUN often applies different AQL levels to different aspects of the same product. For example, for an electronic device: AQL 0 for electrical safety, AQL 1.5 for screen defects, AQL 2.5 for functional buttons, and AQL 4.0 for minor cosmetic issues on the back cover.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="border-2 border-gray-200 rounded-lg px-4 hover:border-blue-400 transition-colors">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium text-gray-900">How does COSUN ensure random sampling is truly random?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 leading-relaxed pt-2">
                      COSUN inspectors follow strict random sampling protocols. They select products from different cartons, production dates/batches, and positions (top, middle, bottom). This prevents suppliers from hiding defective products. Our inspectors also arrive unannounced when possible.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6" className="border-2 border-gray-200 rounded-lg px-4 hover:border-blue-400 transition-colors">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium text-gray-900">How long does an AQL inspection take?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 leading-relaxed pt-2">
                      <p className="mb-2">Duration depends on sample size and product complexity:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                        <li>Sample 32-80 units: 4-6 hours (half-day)</li>
                        <li>Sample 125-200 units: 6-8 hours (full-day)</li>
                        <li>Sample 315+ units: 1.5-2 days</li>
                      </ul>
                      <p className="mt-2">Complex products requiring functional testing may need additional time. COSUN provides preliminary results on-site and detailed reports within 24 hours.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Why Choose COSUN - Enhanced with Visual Cards */}
          <div>
            <Card className="border-2 border-blue-500 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 p-8 text-white text-center">
                <h3 className="text-white mb-3">Why Choose COSUN for AQL Inspections?</h3>
                <p className="text-white/90 max-w-2xl mx-auto">
                  Industry-leading quality control services backed by certified inspectors and comprehensive reporting
                </p>
              </div>
              
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">ISO Certified Inspectors</h4>
                        <p className="text-sm text-gray-700">All inspectors certified in ISO 2859 AQL methodology and international standards</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Detailed Photo Reports</h4>
                        <p className="text-sm text-gray-700">Every defect documented with clear photos, measurements, and explanations</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Unbiased Third-Party</h4>
                        <p className="text-sm text-gray-700">Independent operation with no supplier ties ensures objective assessments</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Fast Turnaround</h4>
                        <p className="text-sm text-gray-700">Preliminary results on-site, detailed PDF reports within 24 hours</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 border-2 border-pink-200 hover:border-pink-400 transition-all hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Customizable Criteria</h4>
                        <p className="text-sm text-gray-700">Adapt AQL levels and checklists to match your specific brand standards</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border-2 border-teal-200 hover:border-teal-400 transition-all hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">China Coverage</h4>
                        <p className="text-sm text-gray-700">Professional QC inspectors available across all provinces in China for comprehensive quality control services</p>
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
