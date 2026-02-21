import { Heart, TrendingUp, Users, Award, Skull } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../contexts/LanguageContext';

export function News() {
  const { t } = useLanguage();

  const successStories = [
    {
      title: t.news.success1.title,
      description: t.news.success1.description,
      impact: t.news.success1.impact,
      image: 'https://images.unsplash.com/photo-1758691737138-7b9b1884b1db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHN1Y2Nlc3MlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjA3ODQ3Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      icon: TrendingUp,
    },
    {
      title: t.news.success2.title,
      description: t.news.success2.description,
      impact: t.news.success2.impact,
      image: 'https://images.unsplash.com/photo-1610208033812-c0d714ad9b5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b21lciUyMHNhdGlzZmFjdGlvbiUyMGhhcHB5fGVufDF8fHx8MTc2MDc4NDczOXww&ixlib=rb-4.1.0&q=80&w=1080',
      icon: Heart,
    },
    {
      title: t.news.success3.title,
      description: t.news.success3.description,
      impact: t.news.success3.impact,
      image: 'https://images.unsplash.com/photo-1758599543157-bc1a94fec33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJ0bmVyc2hpcCUyMGhhbmRzaGFrZSUyMHN1Y2Nlc3N8ZW58MXx8fHwxNzYwNzg0NzQyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      icon: Users,
    },
    {
      title: t.news.success4.title,
      description: t.news.success4.description,
      impact: t.news.success4.impact,
      image: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGdyb3d0aCUyMGNoYXJ0fGVufDF8fHx8MTc2MDcwMzAxNnww&ixlib=rb-4.1.0&q=80&w=1080',
      icon: Award,
    },
  ];

  return (
    <section id="news" className="bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-7xl">
        {/* Hero Statement */}
        <div className="mb-16 text-center">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full mb-6">
            <span className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {t.news.badge}
            </span>
          </div>
          <h1 className="text-gray-900 mb-6">
            {t.news.title}
          </h1>
          <p className="text-gray-600 text-xl max-w-4xl mx-auto">
            {t.news.subtitle}
          </p>
        </div>

        {/* Success Stories Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">
              {t.news.successTitle}
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              {t.news.successSubtitle}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {successStories.map((story, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all border-2 border-transparent hover:border-green-500">
                <div className="aspect-video overflow-hidden">
                  <ImageWithFallback
                    src={story.image}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <story.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-gray-900">{story.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {story.description}
                  </p>
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                    <p className="text-green-900">
                      <span className="block mb-1">{t.news.impactLabel}</span>
                      <span className="italic">{story.impact}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-16 border-t-4 border-gray-300"></div>

        {/* Obituary Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black text-white border-4 border-gray-800 shadow-2xl">
            <CardContent className="p-12">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Skull className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-white mb-4">
                  {t.news.obituaryTitle}
                </h2>
                <div className="w-32 h-1 bg-gray-600 mx-auto mb-6"></div>
              </div>

              <div className="space-y-6 text-gray-300 leading-relaxed">
                <p className="text-center text-lg">
                  {t.news.obituaryIntro}
                </p>
                
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <p className="italic text-center">
                    {t.news.obituaryBody1}
                  </p>
                </div>

                <p className="text-center">
                  {t.news.obituaryBody2}
                </p>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <p className="text-center">
                    {t.news.obituaryBody3}
                  </p>
                </div>

                <p className="text-center text-lg">
                  {t.news.obituaryClosing}
                </p>

                <div className="border-t border-gray-700 pt-6 mt-8">
                  <p className="text-center text-sm text-gray-500">
                    {t.news.obituaryDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final Statement */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-white mb-4">
              {t.news.finalTitle}
            </h2>
            <p className="text-white/90 text-xl max-w-3xl mx-auto">
              {t.news.finalMessage}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
