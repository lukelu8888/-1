import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Database, Rocket, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useRouter } from '../contexts/RouterContext';

export default function DatabaseInitializer() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { navigateTo } = useRouter();

  const handleInitialize = async () => {
    setIsInitializing(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/init-database`;
      
      console.log('🚀 开始初始化数据库...');
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setStatus('success');
        console.log('✅ 数据库初始化成功！');
      } else {
        throw new Error(result.error || '初始化失败');
      }
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-2xl border-2">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Database className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            数据库初始化
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            COSUN Trading Platform - 首次使用需要初始化数据库
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 三Portal架构说明 */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-blue-900">三Portal架构</h3>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                Customer、Admin、Supplier三大门户，角色权限分明
              </p>
            </div>
            
            <div className="bg-emerald-50 p-5 rounded-xl border-2 border-emerald-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-emerald-900">完整业务闭环</h3>
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed">
                询价→报价→合同→应收→收款，全流程数字化
              </p>
            </div>
            
            <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-purple-900">多区域运营</h3>
              </div>
              <p className="text-sm text-purple-800 leading-relaxed">
                北美、南美、欧非三大市场，多语言多货币
              </p>
            </div>
          </div>

          {/* 初始化内容说明 */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-200">
            <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span>初始化内容</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                <p className="font-semibold mb-2 text-orange-900">👥 角色账号</p>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li>✅ 7个角色测试账号（CEO、CFO、销售主管、业务员、财务、采购、管理员）</li>
                  <li>✅ 3个测试客户账号</li>
                  <li>✅ 2个测试供应商账号</li>
                </ul>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                <p className="font-semibold mb-2 text-orange-900">📊 业务数据</p>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li>✅ 客户、订单、报价单示例</li>
                  <li>✅ 供应商、采购单示例</li>
                  <li>✅ 完整的业务流程数据结构</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 状态显示 */}
          {status === 'success' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-bold text-green-900">初始化成功！</h3>
              </div>
              <p className="text-green-800 mb-4">
                数据库已成功初始化，您现在可以使用测试账号登录系统了。
              </p>
              <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                <p className="font-semibold text-green-900 mb-2">测试账号信息：</p>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• CEO: zhangming / cosun123</p>
                  <p>• CFO: lihua / cosun123</p>
                  <p>• 销售主管: wangqiang / cosun123</p>
                  <p>• 业务员: maria / cosun123</p>
                  <p>• 管理员: admin / admin123</p>
                </div>
              </div>
              <Button
                onClick={() => navigateTo('admin-login')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                前往登录页面
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-bold text-red-900">初始化失败</h3>
              </div>
              <p className="text-red-800 mb-4">
                {errorMessage || '初始化过程中发生错误，请检查网络连接或联系管理员。'}
              </p>
              <Button
                onClick={handleInitialize}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-100"
                size="lg"
              >
                重试
              </Button>
            </div>
          )}

          {/* 初始化按钮 */}
          {status !== 'success' && (
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-8 rounded-xl shadow-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Database className="w-7 h-7" />
                准备开始初始化
              </h3>
              <p className="text-blue-50 mb-6 text-base">
                点击下方按钮开始初始化数据库，系统将自动创建所有必要的测试数据和账号。
              </p>
              
              <Button 
                onClick={handleInitialize}
                disabled={isInitializing}
                size="lg"
                className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg h-16 shadow-2xl hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    正在初始化数据库，请稍候...
                  </>
                ) : (
                  <>
                    <Rocket className="w-6 h-6 mr-3" />
                    开始初始化数据库
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 底部提示 */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            ⏱️ 初始化过程约需2-3分钟，系统将创建完整的三Portal业务闭环测试数据
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
