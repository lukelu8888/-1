import { AlertTriangle, CheckCircle, XCircle, Lightbulb, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function FailureCases() {
  const { t } = useLanguage();

  const failureCases = [
    {
      id: 1,
      title: t.failurecases?.cases?.case1?.title || 'Lost Agency Opportunity Due to Language Barrier (2005)',
      problem: t.failurecases?.cases?.case1?.problem || 'In our early entrepreneurial stage in 2005, we lost a valuable customer agency opportunity due to language communication barriers.',
      impact: t.failurecases?.cases?.case1?.impact || 'Lost a significant long-term partnership opportunity that could have accelerated our international business development.',
      lesson: t.failurecases?.cases?.case1?.lesson || 'We should have invested in professional language training and hired multilingual staff earlier.',
      image: 'https://images.unsplash.com/photo-1577415124269-fc1140a69e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbW11bmljYXRpb258ZW58MXx8fHwxNzYwNzAzNzY3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Communication',
      severity: 'High',
      year: '2005',
    },
    {
      id: 2,
      title: t.failurecases?.cases?.case2?.title || 'Even today, we still regret refusing the customer\'s request to cancel the order back in 2006.',
      problem: t.failurecases?.cases?.case2?.problem || 'In 2006, a major Irish customer requested to cancel an order for which they had already paid a deposit. Fearing financial loss, we refused their cancellation request.',
      impact: t.failurecases?.cases?.case2?.impact || 'We permanently lost this important customer and damaged our reputation.',
      lesson: t.failurecases?.cases?.case2?.lesson || 'We should have understood the customer\'s situation and worked together to find a solution.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b21lciUyMHNlcnZpY2UlMjBwcm9ibGVtfGVufDB8fHx8MTczOTMwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Customer Relations',
      severity: 'Critical',
      year: '2006',
    },
    {
      id: 3,
      title: t.failurecases?.cases?.case3?.title || 'Abandoned Long-term Partner During Their Difficulties (2019)',
      problem: t.failurecases?.cases?.case3?.problem || 'In 2019, we noticed a long-term customer\'s orders declining due to market challenges. Instead of reaching out, we chose to discontinue our supply cooperation.',
      impact: t.failurecases?.cases?.case3?.impact || 'We lost a loyal long-term customer and missed the opportunity to help a partner overcome difficulties.',
      lesson: t.failurecases?.cases?.case3?.lesson || 'We should have proactively communicated with the customer and offered support. True partnership means standing together in both good times and bad.',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJ0bmVyc2hpcCUyMGJ1c2luZXNzfGVufDB8fHx8MTczOTMwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Partnership',
      severity: 'High',
      year: '2019',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500';
      case 'High':
        return 'bg-orange-500';
      case 'Medium':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-4">
              <AlertTriangle className="h-5 w-5" />
              <span>{t.failurecases?.heroTag || 'Learning from Failures'}</span>
            </div>
            <h1 className="text-gray-900 mb-4">
              {t.failurecases?.title || 'Our Failure Cases'}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              {t.failurecases?.subtitle || 'Transparency builds trust. We share our mistakes and the valuable lessons learned to help our clients and partners avoid similar pitfalls.'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Why We Share Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">
              {t.failurecases?.whyShareTitle || 'Why We Share Our Failures'}
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              {t.failurecases?.whyShareDesc || 'In the construction industry, failures are costly lessons. By openly discussing our mistakes, we demonstrate our commitment to continuous improvement and help the entire industry grow stronger.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-gray-900 mb-3">{t.failurecases?.values?.transparency || 'Transparency'}</h3>
                <p className="text-gray-600">
                  {t.failurecases?.values?.transparencyDesc || 'We believe in honest communication with our clients and partners.'}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-gray-900 mb-3">{t.failurecases?.values?.improvement || 'Continuous Improvement'}</h3>
                <p className="text-gray-600">
                  {t.failurecases?.values?.improvementDesc || 'Every failure is an opportunity to refine our processes.'}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-gray-900 mb-3">{t.failurecases?.values?.knowledge || 'Knowledge Sharing'}</h3>
                <p className="text-gray-600">
                  {t.failurecases?.values?.knowledgeDesc || 'Our experiences can help others avoid similar mistakes.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Failure Cases */}
        <div className="mb-12">
          <h2 className="text-gray-900 mb-8 text-center">
            {t.failurecases?.casesTitle || 'Case Studies'}
          </h2>
          <div className="space-y-8">
            {failureCases.map((failureCase) => (
              <Card key={failureCase.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  {/* Image Section */}
                  <div className="lg:col-span-1">
                    <div className="relative h-64 lg:h-full">
                      <ImageWithFallback
                        src={failureCase.image}
                        alt={failureCase.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getSeverityColor(failureCase.severity)} text-white border-0`}>
                          {failureCase.severity}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-white text-gray-900 border-0">
                          {failureCase.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="lg:col-span-2 p-8">
                    <h3 className="text-gray-900 mb-6">{failureCase.title}</h3>
                    
                    <div className="space-y-6">
                      {/* Problem */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <h4 className="text-gray-900">{t.failurecases?.problem || 'Problem'}</h4>
                        </div>
                        <p className="text-gray-600 ml-7">{failureCase.problem}</p>
                      </div>

                      {/* Impact */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <h4 className="text-gray-900">{t.failurecases?.impact || 'Impact'}</h4>
                        </div>
                        <p className="text-gray-600 ml-7">{failureCase.impact}</p>
                      </div>

                      {/* Lesson Learned */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="text-gray-900">{t.failurecases?.lesson || 'Lesson Learned'}</h4>
                        </div>
                        <p className="text-gray-700 ml-7">{failureCase.lesson}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Improvements Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-white mb-4">
            {t.failurecases?.improvementsTitle || 'Our Commitment Going Forward'}
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-3xl mx-auto">
            {t.failurecases?.improvementsDesc || 'These failures taught us invaluable lessons. We now prioritize customer empowerment, maintain transparency in all dealings, and actively support our partners through challenges.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div>
              <div className="text-white mb-2">✓</div>
              <p className="text-white/80">{t.failurecases?.stats?.inspection || 'Customer-First Mindset'}</p>
            </div>
            <div>
              <div className="text-white mb-2">✓</div>
              <p className="text-white/80">{t.failurecases?.stats?.verification || 'Transparent Communication'}</p>
            </div>
            <div>
              <div className="text-white mb-2">✓</div>
              <p className="text-white/80">{t.failurecases?.stats?.issues || 'Partnership Support'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}