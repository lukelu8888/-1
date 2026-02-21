import React from 'react';
import { Shield, Lock, Eye, Users, FileText, Globe, Mail, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">
            Last Updated: November 18, 2025
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <h3 className="text-gray-900 mb-4">Introduction</h3>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.</strong> ("we," "our," or "us") 
                respects your privacy and is committed to protecting your personal data. This privacy policy 
                explains how we collect, use, disclose, and safeguard your information when you visit our 
                website, use our services, or interact with us through social media platforms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-gray-900 mb-3">1. Personal Information</h4>
              <p className="text-gray-700 mb-3">We may collect the following personal information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Contact Information:</strong> Name, email address, phone number, company name, job title</li>
                <li><strong>Business Information:</strong> Company address, industry, purchasing needs</li>
                <li><strong>Account Information:</strong> Username, password (encrypted), account preferences</li>
                <li><strong>Transaction Information:</strong> Order history, quotation requests, payment information</li>
              </ul>
            </div>

            {/* Technical Information */}
            <div>
              <h4 className="text-gray-900 mb-3">2. Technical Information</h4>
              <p className="text-gray-700 mb-3">We automatically collect certain technical information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, click patterns, referring websites</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, analytics cookies, marketing cookies</li>
                <li><strong>UTM Parameters:</strong> Marketing campaign tracking data (source, medium, campaign)</li>
              </ul>
            </div>

            {/* Social Media Information */}
            <div>
              <h4 className="text-gray-900 mb-3">3. Social Media Information</h4>
              <p className="text-gray-700 mb-3">When you interact with us on social media platforms:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Profile Information:</strong> Public profile data from LinkedIn, Facebook, Instagram, etc.</li>
                <li><strong>Engagement Data:</strong> Likes, comments, shares, messages</li>
                <li><strong>Click-through Data:</strong> Links clicked from social media posts</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>We use your information for the following purposes:</p>
              
              <div className="space-y-3 ml-4">
                <div className="flex gap-3">
                  <span className="text-blue-600 flex-shrink-0">✓</span>
                  <div>
                    <strong>Business Operations:</strong> Process inquiries, quotations, orders, and provide customer service
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-blue-600 flex-shrink-0">✓</span>
                  <div>
                    <strong>Communication:</strong> Send order updates, product information, and respond to your requests
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-blue-600 flex-shrink-0">✓</span>
                  <div>
                    <strong>Marketing:</strong> Send newsletters, promotional offers, and product announcements (with your consent)
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-blue-600 flex-shrink-0">✓</span>
                  <div>
                    <strong>Analytics:</strong> Understand website usage, improve user experience, and optimize marketing campaigns
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-blue-600 flex-shrink-0">✓</span>
                  <div>
                    <strong>Personalization:</strong> Customize content and product recommendations based on your preferences
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-blue-600 flex-shrink-0">✓</span>
                  <div>
                    <strong>Legal Compliance:</strong> Comply with legal obligations and protect our rights
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Information Sharing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>We may share your information with:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our business (e.g., payment processors, shipping companies, IT services)</li>
                <li><strong>Business Partners:</strong> Suppliers and manufacturers (with your consent)</li>
                <li><strong>Social Media Platforms:</strong> LinkedIn, Facebook, Instagram, YouTube (for marketing purposes)</li>
                <li><strong>Analytics Providers:</strong> Google Analytics, Facebook Pixel (to understand user behavior)</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <strong>Important:</strong> We never sell your personal information to third parties.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>We implement appropriate security measures to protect your data:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission, encrypted storage for sensitive data</li>
                <li><strong>Access Control:</strong> Limited access to personal data, role-based permissions</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Secure Infrastructure:</strong> Protected servers, firewalls, intrusion detection</li>
              </ul>
              
              <p className="mt-4">
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>Under applicable data protection laws (GDPR, CCPA, etc.), you have the following rights:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Objection:</strong> Object to processing of your data for marketing purposes</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
              </ul>
              
              <p className="mt-4">
                To exercise these rights, please contact us at: <a href="mailto:privacy@cosunchina.com" className="text-blue-600 hover:underline">privacy@cosunchina.com</a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cookies and Tracking Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>We use cookies and similar tracking technologies:</p>
              
              <div className="space-y-3 ml-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Essential Cookies</h4>
                  <p className="text-sm">Required for website functionality (login, shopping cart, preferences)</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                  <p className="text-sm">Track website usage and performance (Google Analytics)</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900">Marketing Cookies</h4>
                  <p className="text-sm">Track effectiveness of marketing campaigns (UTM parameters, Facebook Pixel)</p>
                </div>
              </div>
              
              <p className="mt-4">
                You can control cookies through your browser settings. However, disabling cookies may affect website functionality.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>We retain your personal data for as long as necessary:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Active customers: Duration of business relationship + 7 years (legal requirement)</li>
                <li>Inactive accounts: 3 years of inactivity, then deleted</li>
                <li>Marketing data: Until you opt-out or request deletion</li>
                <li>Analytics data: Aggregated and anonymized after 26 months</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* International Transfers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                As a global B2B company, we may transfer your data internationally. We ensure appropriate safeguards are in place:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Standard Contractual Clauses (SCC) with service providers</li>
                <li>Compliance with GDPR for EU data subjects</li>
                <li>Compliance with CCPA for California residents</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                Our services are intended for business professionals. We do not knowingly collect information from children under 16.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                We may update this privacy policy from time to time. We will notify you of significant changes by email or website notice.
              </p>
              <p className="mt-4">
                Last updated: November 18, 2025
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Us */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                If you have questions about this privacy policy or wish to exercise your rights, please contact us:
              </p>
              
              <div className="space-y-2">
                <p><strong>FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.</strong></p>
                <p>Email: <a href="mailto:privacy@cosunchina.com" className="text-blue-600 hover:underline">privacy@cosunchina.com</a></p>
                <p>Phone: <a href="tel:+8613799993509" className="text-blue-600 hover:underline">+86 13799993509</a></p>
                <p>Address: Fujian Province, China</p>
              </div>
              
              <p className="text-sm text-gray-600 mt-4">
                We will respond to your request within 30 days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
