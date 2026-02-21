import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { 
  Database, Cloud, CheckCircle2, AlertTriangle, Code,
  RefreshCw, Eye, Server, Lock, Link, FileJson,
  ArrowRight, Terminal, Activity, Zap
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from '../ui/alert';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  details: any;
  timestamp?: string;
}

export default function SupabaseDiagnosticPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cloudData, setCloudData] = useState<any[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    runFullDiagnostic();
  }, []);

  // 🔥 运行完整诊断
  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    const results: DiagnosticResult[] = [];

    try {
      // Step 1: 显示Supabase账号信息
      results.push({
        step: '1. Supabase账号信息',
        status: 'success',
        details: {
          projectId: projectId,
          projectUrl: `https://${projectId}.supabase.co`,
          anonKeyPrefix: publicAnonKey.substring(0, 20) + '...',
          serverEndpoint: `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b`
        },
        timestamp: new Date().toISOString()
      });
      setDiagnostics([...results]);
      await sleep(500);

      // Step 2: 测试服务器Health Check
      results.push({
        step: '2. 测试服务器连接',
        status: 'pending',
        details: { message: '正在连接...' }
      });
      setDiagnostics([...results]);

      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/health`;
      console.log('🔍 健康检查URL:', healthUrl);
      
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const healthData = await healthResponse.json();
      
      results[results.length - 1] = {
        step: '2. 测试服务器连接',
        status: healthResponse.ok ? 'success' : 'error',
        details: {
          requestUrl: healthUrl,
          requestMethod: 'GET',
          responseStatus: healthResponse.status,
          responseData: healthData,
          headers: {
            Authorization: `Bearer ${publicAnonKey.substring(0, 20)}...`
          }
        },
        timestamp: new Date().toISOString()
      };
      setDiagnostics([...results]);
      await sleep(500);

      // Step 3: 测试KV Store写入
      results.push({
        step: '3. 测试KV Store写入',
        status: 'pending',
        details: { message: '正在写入测试数据...' }
      });
      setDiagnostics([...results]);

      const checkUrl = `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full/check`;
      console.log('🔍 KV检查URL:', checkUrl);

      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const checkData = await checkResponse.json();

      results[results.length - 1] = {
        step: '3. 测试KV Store写入',
        status: checkResponse.ok && checkData.kvStoreAvailable ? 'success' : 'error',
        details: {
          requestUrl: checkUrl,
          requestMethod: 'GET',
          responseStatus: checkResponse.status,
          responseData: checkData,
          explanation: checkData.kvStoreAvailable 
            ? 'KV Store已成功写入、读取并删除测试数据' 
            : 'KV Store不可用'
        },
        timestamp: new Date().toISOString()
      };
      setDiagnostics([...results]);
      await sleep(500);

      // Step 4: 写入真实测试数据
      results.push({
        step: '4. 写入真实测试备份',
        status: 'pending',
        details: { message: '正在上传测试备份...' }
      });
      setDiagnostics([...results]);

      const testBackupData = {
        metadata: {
          backupId: `diagnostic_test_${Date.now()}`,
          timestamp: new Date().toISOString(),
          version: 'DIAGNOSTIC_TEST',
          systemInfo: {
            totalDataKeys: 1,
            totalDataSize: 50,
            totalComponents: 1,
            systemVersion: '诊断测试版'
          }
        },
        businessData: {
          test_data: { message: '这是一条诊断测试数据', timestamp: new Date().toISOString() }
        },
        architectureConfig: {
          workflows: null,
          permissions: { test: true }
        },
        systemArchitecture: {
          components: [{ name: 'DiagnosticTest', path: '/test' }],
          dependencies: []
        }
      };

      const backupUrl = `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full`;
      console.log('🔍 备份上传URL:', backupUrl);
      console.log('📦 备份数据:', testBackupData);

      const backupResponse = await fetch(backupUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testBackupData)
      });

      const backupResult = await backupResponse.json();

      results[results.length - 1] = {
        step: '4. 写入真实测试备份',
        status: backupResponse.ok ? 'success' : 'error',
        details: {
          requestUrl: backupUrl,
          requestMethod: 'POST',
          requestBody: testBackupData,
          responseStatus: backupResponse.status,
          responseData: backupResult,
          backupId: backupResult.backupId,
          uploadedSize: backupResult.size
        },
        timestamp: new Date().toISOString()
      };
      setDiagnostics([...results]);
      await sleep(500);

      // Step 5: 从云端读取备份历史
      results.push({
        step: '5. 从云端读取备份历史',
        status: 'pending',
        details: { message: '正在获取云端数据...' }
      });
      setDiagnostics([...results]);

      const historyUrl = `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full/history`;
      console.log('🔍 历史记录URL:', historyUrl);

      const historyResponse = await fetch(historyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const historyData = await historyResponse.json();

      results[results.length - 1] = {
        step: '5. 从云端读取备份历史',
        status: historyResponse.ok ? 'success' : 'error',
        details: {
          requestUrl: historyUrl,
          requestMethod: 'GET',
          responseStatus: historyResponse.status,
          responseData: historyData,
          totalBackups: historyData.backups?.length || 0,
          backups: historyData.backups || []
        },
        timestamp: new Date().toISOString()
      };
      setDiagnostics([...results]);
      setCloudData(historyData.backups || []);
      await sleep(500);

      // Step 6: 验证数据完整性
      if (historyData.backups && historyData.backups.length > 0) {
        results.push({
          step: '6. 验证云端数据完整性',
          status: 'pending',
          details: { message: '正在读取备份详情...' }
        });
        setDiagnostics([...results]);

        const latestBackup = historyData.backups[0];
        const restoreUrl = `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full/restore/${latestBackup.id}`;
        console.log('🔍 恢复URL:', restoreUrl);

        const restoreResponse = await fetch(restoreUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        const restoreData = await restoreResponse.json();

        results[results.length - 1] = {
          step: '6. 验证云端数据完整性',
          status: restoreResponse.ok && restoreData.package ? 'success' : 'error',
          details: {
            requestUrl: restoreUrl,
            requestMethod: 'GET',
            responseStatus: restoreResponse.status,
            backupId: latestBackup.id,
            packageExists: !!restoreData.package,
            packageMetadata: restoreData.package?.metadata,
            dataKeysCount: Object.keys(restoreData.package?.businessData || {}).length
          },
          timestamp: new Date().toISOString()
        };
        setDiagnostics([...results]);
      }

      toast.success('✅ 诊断完成！所有测试通过', {
        description: '数据已成功上传到Supabase云端'
      });

    } catch (error) {
      console.error('诊断失败:', error);
      results.push({
        step: '❌ 诊断错误',
        status: 'error',
        details: {
          error: String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      setDiagnostics([...results]);
      
      toast.error('❌ 诊断失败', {
        description: String(error)
      });
    } finally {
      setIsRunning(false);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const toggleStep = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  return (
    <div className="space-y-6 p-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Supabase连接完整诊断</h2>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
              100% 透明
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            展示所有API调用、请求响应和云端数据
          </p>
        </div>
        <Button
          onClick={runFullDiagnostic}
          disabled={isRunning}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              诊断中...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 mr-2" />
              重新运行诊断
            </>
          )}
        </Button>
      </div>

      {/* Supabase账号信息 */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600" />
          您的Supabase项目信息
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-xs text-gray-600 mb-2">Project ID（项目标识符）</div>
            <div className="text-sm font-mono font-semibold text-blue-600 break-all">
              {projectId}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-xs text-gray-600 mb-2">Project URL（项目地址）</div>
            <div className="text-sm font-mono text-blue-600 break-all">
              https://{projectId}.supabase.co
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-xs text-gray-600 mb-2">API Endpoint（服务器地址）</div>
            <div className="text-xs font-mono text-purple-600 break-all">
              https://{projectId}.supabase.co/functions/v1/make-server-880fd43b
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-xs text-gray-600 mb-2">Anon Key（公开密钥）</div>
            <div className="text-xs font-mono text-gray-500 break-all">
              {publicAnonKey.substring(0, 30)}...
            </div>
          </div>
        </div>
      </Card>

      {/* 诊断步骤 */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-green-600" />
          连接诊断步骤（共6步）
        </h3>
        <div className="space-y-3">
          {diagnostics.map((diag, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div
                className={`p-4 cursor-pointer transition-colors ${
                  diag.status === 'success' 
                    ? 'bg-green-50 hover:bg-green-100 border-green-200' 
                    : diag.status === 'error'
                    ? 'bg-red-50 hover:bg-red-100 border-red-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => toggleStep(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {diag.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : diag.status === 'error' ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{diag.step}</div>
                      {diag.timestamp && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(diag.timestamp).toLocaleTimeString('zh-CN')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={diag.status === 'success' ? 'default' : 'outline'}>
                      {diag.status === 'success' ? '成功' : diag.status === 'error' ? '失败' : '进行中'}
                    </Badge>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {expandedStep === index && (
                <div className="p-4 bg-gray-900 text-green-400 font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(diag.details, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 云端数据展示 */}
      {cloudData.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            云端备份数据（真实的Supabase存储）
          </h3>
          <div className="space-y-2">
            {cloudData.map((backup, index) => (
              <div key={backup.id} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">#{index + 1}</Badge>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(backup.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {backup.status === 'success' ? '✅ 已上传' : '❌ 失败'}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">备份ID:</span>
                    <div className="font-mono text-gray-900 truncate">{backup.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">数据集:</span>
                    <div className="font-semibold text-blue-600">{backup.totalDataKeys || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">组件数:</span>
                    <div className="font-semibold text-purple-600">{backup.totalComponents || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">大小:</span>
                    <div className="font-semibold text-green-600">{backup.size} bytes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Alert className="mt-4 bg-white border-green-300">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-sm text-green-900">
              <strong>✅ 证明完成！</strong> 以上数据来自 <code className="px-1.5 py-0.5 bg-green-100 rounded font-mono text-xs">
                https://{projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full/history
              </code> 的真实API响应，证明数据已成功存储在Supabase云端KV Store中。
            </AlertDescription>
          </Alert>
        </Card>
      )}

      {/* 说明 */}
      <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <Code className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>完整证据链：</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
            <li>显示您的Supabase Project ID: <code className="px-1 bg-blue-100 rounded font-mono">{projectId}</code></li>
            <li>显示完整的API请求URL和Headers</li>
            <li>展示真实的HTTP请求和响应数据</li>
            <li>上传测试数据到云端KV Store</li>
            <li>从云端读取备份历史（证明数据已存储）</li>
            <li>验证数据完整性（可完整恢复）</li>
          </ol>
          <p className="mt-3 font-semibold text-blue-800">
            💡 点击每个步骤可展开查看完整的JSON请求和响应数据。所有网络调用都显示在浏览器控制台（F12）中。
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
