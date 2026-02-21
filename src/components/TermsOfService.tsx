import React from 'react';
import { FileText, AlertTriangle, Scale, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Scale className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">
            Last Updated: November 18, 2025
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <h3 className="text-gray-900 mb-4">Agreement to Terms</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                These Terms of Service ("Terms") govern your access to and use of the website, services, and 
                products provided by <strong>FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.</strong> ("Cosun," "we," "our," or "us").
              </p>
              <p>
                By accessing or using our services, you agree to be bound by these Terms. If you do not agree, 
                please do not use our services.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Services Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Our Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>Cosun provides the following services:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>B2B building materials trading platform</li>
                <li>Product catalog and information</li>
                <li>Online inquiry and quotation system</li>
                <li>Order management and tracking</li>
                <li>Customer account portal</li>
                <li>Quality control and inspection services</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Account Registration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>To use certain features, you must create an account:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be at least 18 years old and represent a legitimate business</li>
                <li>One account per business entity</li>
                <li>You must notify us of any unauthorized use</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Orders and Payments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Orders and Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <h4 className="font-semibold text-gray-900">Quotations</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Quotations are valid for 30 days unless otherwise stated</li>
                <li>Prices are subject to change without notice</li>
                <li>Quotations are not binding until confirmed by both parties</li>
              </ul>
              
              <h4 className="font-semibold text-gray-900">Orders</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>All orders are subject to acceptance by Cosun</li>
                <li>Minimum order quantities may apply</li>
                <li>Custom orders may require deposits</li>
              </ul>
              
              <h4 className="font-semibold text-gray-900">Payments</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payment terms will be specified in the sales contract</li>
                <li>Accepted payment methods: T/T, L/C, or as agreed</li>
                <li>Late payments may incur interest charges</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Shipping and Delivery */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipping and Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Delivery terms will be specified in the sales contract (FOB, CIF, etc.)</li>
                <li>Delivery times are estimates and not guaranteed</li>
                <li>Risk of loss transfers upon delivery as per Incoterms</li>
                <li>Buyer is responsible for customs clearance and duties</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quality and Returns */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quality Assurance and Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <h4 className="font-semibold text-gray-900">Quality Assurance</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>All products meet specified quality standards</li>
                <li>Third-party inspection services available upon request</li>
                <li>Quality certificates provided with shipment</li>
              </ul>
              
              <h4 className="font-semibold text-gray-900">Returns and Claims</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Defective products must be reported within 7 days of receipt</li>
                <li>Claims must include photographic evidence</li>
                <li>Return shipping costs depend on fault determination</li>
                <li>Custom or special orders are non-returnable</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Intellectual Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                All content on this website, including text, graphics, logos, images, and software, is owned by 
                Cosun or its licensors and protected by copyright and trademark laws.
              </p>
              
              <p className="mt-4">You may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Reproduce, modify, or distribute our content without permission</li>
                <li>Use our trademarks or branding without authorization</li>
                <li>Reverse engineer or decompile our software</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Prohibited Use */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Prohibited Use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>You agree not to:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use our services for any illegal purpose</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Scrape or harvest data from our website</li>
                <li>Impersonate another person or entity</li>
                <li>Interfere with other users' use of the service</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                To the maximum extent permitted by law, Cosun shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including loss of profits, data, or business opportunities.
              </p>
              
              <p className="mt-4">
                Our total liability for any claims shall not exceed the amount paid by you for the specific 
                product or service giving rise to the claim.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                Our services are provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either 
                express or implied, including but not limited to warranties of merchantability, fitness for a 
                particular purpose, or non-infringement.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the People's 
                Republic of China, without regard to conflict of law principles.
              </p>
              
              <p className="mt-4">
                Any disputes shall be resolved through arbitration in Fujian Province, China, or as mutually agreed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                We reserve the right to modify these Terms at any time. Changes will be effective immediately 
                upon posting to the website. Your continued use of our services constitutes acceptance of the updated Terms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                If you have questions about these Terms, please contact us:
              </p>
              
              <div className="space-y-2">
                <p><strong>FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.</strong></p>
                <p>Email: <a href="mailto:services@cosunchina.com" className="text-green-600 hover:underline">services@cosunchina.com</a></p>
                <p>Phone: <a href="tel:+8613799993509" className="text-green-600 hover:underline">+86 13799993509</a></p>
                <p>Address: Fujian Province, China</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceptance */}
        <Card className="bg-gray-100 border-gray-300">
          <CardContent className="p-6">
            <p className="text-gray-700 text-center">
              <strong>By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
