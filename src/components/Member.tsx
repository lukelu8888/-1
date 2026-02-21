import { useState } from 'react';
import { Award, Gift, Headphones, Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '../contexts/LanguageContext';

export function Member() {
  const { t } = useLanguage();
  const [rememberMe, setRememberMe] = useState(false);

  const benefits = [
    {
      icon: Star,
      title: t.member.benefits.benefit1,
      description: t.member.benefits.benefit1Desc,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      icon: Award,
      title: t.member.benefits.benefit2,
      description: t.member.benefits.benefit2Desc,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Gift,
      title: t.member.benefits.benefit3,
      description: t.member.benefits.benefit3Desc,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Headphones,
      title: t.member.benefits.benefit4,
      description: t.member.benefits.benefit4Desc,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <section id="member" className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-gray-900">{t.member.title}</h2>
          <p className="text-gray-600">{t.member.subtitle}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Login/Register Form */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t.member.login}</TabsTrigger>
                  <TabsTrigger value="register">{t.member.register}</TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login" className="mt-6">
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t.member.email}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t.member.password}</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) =>
                            setRememberMe(checked as boolean)
                          }
                        />
                        <Label htmlFor="remember" className="cursor-pointer">
                          {t.member.rememberMe}
                        </Label>
                      </div>
                      <a
                        href="#"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {t.member.forgotPassword}
                      </a>
                    </div>
                    <Button className="w-full">{t.member.login}</Button>
                    <p className="text-center text-sm text-gray-600">
                      {t.member.noAccount}{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        {t.member.registerNow}
                      </a>
                    </p>
                  </form>
                </TabsContent>

                {/* Register Form */}
                <TabsContent value="register" className="mt-6">
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">{t.member.username}</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">{t.member.email}</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">{t.member.phone}</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="+86 138 0000 0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">{t.member.password}</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        {t.member.confirmPassword}
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <Button className="w-full">{t.member.register}</Button>
                    <p className="text-center text-sm text-gray-600">
                      {t.member.hasAccount}{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        {t.member.loginNow}
                      </a>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Member Benefits */}
          <div>
            <h3 className="mb-6 text-gray-900">{t.member.benefits.title}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <Card key={index} className="transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div
                      className={`mb-4 inline-flex rounded-lg p-3 ${benefit.color}`}
                    >
                      <benefit.icon className="h-6 w-6" />
                    </div>
                    <h4 className="mb-2 text-gray-900">{benefit.title}</h4>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
