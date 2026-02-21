import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../contexts/LanguageContext';

export function Cases() {
  const { t } = useLanguage();

  const cases = [
    {
      title: t.cases.case1.title,
      description: t.cases.case1.desc,
      image: 'https://images.unsplash.com/photo-1758304481967-9edc1307f9d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBtYXRlcmlhbHMlMjB3YXJlaG91c2V8ZW58MXx8fHwxNzYwNzA2Mjk3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: t.cases.case2.title,
      description: t.cases.case2.desc,
      image: 'https://images.unsplash.com/photo-1689596312367-39a4461504c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMG1hdGVyaWFscyUyMHNpdGV8ZW58MXx8fHwxNzYwNzYzMzAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: t.cases.case3.title,
      description: t.cases.case3.desc,
      image: 'https://images.unsplash.com/photo-1660592868727-858d28c3ba52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBwcm9qZWN0JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNzYzMzAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: t.cases.case4.title,
      description: t.cases.case4.desc,
      image: 'https://images.unsplash.com/photo-1758304481967-9edc1307f9d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBtYXRlcmlhbHMlMjB3YXJlaG91c2V8ZW58MXx8fHwxNzYwNzA2Mjk3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: t.cases.case5.title,
      description: t.cases.case5.desc,
      image: 'https://images.unsplash.com/photo-1689596312367-39a4461504c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMG1hdGVyaWFscyUyMHNpdGV8ZW58MXx8fHwxNzYwNzYzMzAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: t.cases.case6.title,
      description: t.cases.case6.desc,
      image: 'https://images.unsplash.com/photo-1660592868727-858d28c3ba52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBwcm9qZWN0JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNzYzMzAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  return (
    <section id="cases" className="bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-gray-900">{t.cases.title}</h2>
          <p className="text-gray-600">{t.cases.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem, index) => (
            <Card key={index} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="aspect-video overflow-hidden">
                <ImageWithFallback
                  src={caseItem.image}
                  alt={caseItem.title}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="mb-2 text-gray-900">{caseItem.title}</h3>
                <p className="mb-4 text-sm text-gray-600">{caseItem.description}</p>
                <Button variant="outline" size="sm">
                  {t.cases.viewMore}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
