// 🔥 供应商采购询价数据流转调试工具
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Bug, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useXJs } from '../../contexts/XJContext';

export function XJDebugger() {
  const { user } = useUser();
  const { xjs, getXJsBySupplier } = useXJs();
  const [debugData, setDebugData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const runDiagnostics = () => {
    console.log('🔍 ==================== 供应商采购询价诊断开始 ====================');
    
    // 1. 检查当前登录用户
    console.log('📌 步骤1: 检查当前登录用户');
    console.log('  - user对象:', user);
    console.log('  - user.email:', user?.email);
    console.log('  - user.name:', user?.name);
    console.log('  - user.company:', user?.company);
    
    // 2. 检查localStorage中的supplierRFQs
    console.log('\n📌 步骤2: 检查localStorage中的supplierRFQs');
    const supplierRFQsRaw = localStorage.getItem('supplierRFQs');
    console.log('  - supplierRFQs原始数据:', supplierRFQsRaw);
    
    let supplierRFQs = [];
    if (supplierRFQsRaw) {
      try {
        supplierRFQs = JSON.parse(supplierRFQsRaw);
        console.log('  - supplierRFQs解析后:', supplierRFQs);
        console.log('  - supplierRFQs数量:', supplierRFQs.length);
        
        if (supplierRFQs.length > 0) {
          console.log('  - supplierRFQs详细信息:');
          supplierRFQs.forEach((xj: any, idx: number) => {
            console.log(`    ${idx + 1}. 采购询价ID: ${xj.id}`);
            console.log(`       - xjNumber: ${xj.xjNumber}`);
            console.log(`       - supplierXjNo: ${xj.supplierXjNo}`);
            console.log(`       - supplierCode: ${xj.supplierCode}`);
            console.log(`       - supplierEmail: ${xj.supplierEmail}`);
            console.log(`       - supplierName: ${xj.supplierName}`);
            console.log(`       - status: ${xj.status}`);
            console.log(`       - productName: ${xj.productName}`);
          });
        }
      } catch (e) {
        console.error('  ❌ supplierRFQs解析失败:', e);
      }
    } else {
      console.log('  ⚠️ localStorage中没有supplierRFQs（采购询价）数据');
    }
    
    // 3. 检查XJContext中的所有采购询价
    console.log('\n📌 步骤3: 检查XJContext中的所有采购询价');
    console.log('  - rfqs总数:', xjs.length);
    if (xjs.length > 0) {
      console.log('  - rfqs详细信息:');
      xjs.forEach((xj: any, idx: number) => {
        console.log(`    ${idx + 1}. 采购询价ID: ${xj.id}`);
        console.log(`       - xjNumber: ${xj.xjNumber}`);
        console.log(`       - supplierXjNo: ${xj.supplierXjNo}`);
        console.log(`       - supplierCode: ${xj.supplierCode}`);
        console.log(`       - supplierEmail: ${xj.supplierEmail}`);
        console.log(`       - supplierName: ${xj.supplierName}`);
        console.log(`       - status: ${xj.status}`);
      });
    } else {
      console.log('  ⚠️ XJContext中没有采购询价数据');
    }
    
    // 4. 测试getRFQsBySupplier（获取供应商采购询价）函数
    console.log('\n📌 步骤4: 测试getRFQsBySupplier（获取供应商采购询价）函数');
    if (user?.email) {
      console.log('  - 查询参数:', user.email);
      const myRFQs = getXJsBySupplier(user.email);
      console.log('  - 返回结果数量:', myRFQs.length);
      console.log('  - 返回结果:', myRFQs);
      
      // 5. 手动过滤验证
      console.log('\n📌 步骤5: 手动过滤验证');
      const manualFiltered = xjs.filter(xj => 
        xj.supplierCode === user.email || 
        xj.supplierEmail === user.email
      );
      console.log('  - 手动过滤结果数量:', manualFiltered.length);
      console.log('  - 手动过滤结果:', manualFiltered);
      
      // 6. 检查匹配失败的原因
      console.log('\n📌 步骤6: 检查匹配失败的原因');
      if (manualFiltered.length === 0 && supplierRFQs.length > 0) {
        console.log('  ⚠️ supplierRFQs中有数据，但过滤结果为空');
        console.log('  - 可能原因分析:');
        supplierRFQs.forEach((xj: any, idx: number) => {
          const codeMatch = xj.supplierCode === user.email;
          const emailMatch = xj.supplierEmail === user.email;
          console.log(`    采购询价 ${idx + 1}:`);
          console.log(`      - supplierCode匹配: ${codeMatch} (${xj.supplierCode} === ${user.email})`);
          console.log(`      - supplierEmail匹配: ${emailMatch} (${xj.supplierEmail} === ${user.email})`);
        });
      }
      
      // 保存诊断结果
      setDebugData({
        user: {
          email: user?.email,
          name: user?.name,
          company: user?.company
        },
        localStorageSupplierRFQs: supplierRFQs,
        contextRFQs: xjs,
        getRFQsBySupplierResult: myRFQs,
        manualFilterResult: manualFiltered,
        issues: []
      });
      
      // 7. 总结
      console.log('\n📌 步骤7: 诊断总结');
      if (myRFQs.length === 0 && supplierRFQs.length > 0) {
        console.log('  ❌ 问题确认: 数据存在但无法正确过滤');
        console.log('  - 建议: 检查supplierEmail和supplierCode字段是否与登录用户email匹配');
      } else if (myRFQs.length > 0) {
        console.log('  ✅ 数据正常: 成功获取到', myRFQs.length, '个采购询价');
      } else {
        console.log('  ⚠️ 没有数据: supplierRFQs为空或未提交任何询价单');
      }
      
    } else {
      console.log('  ❌ 用户未登录');
    }
    
    console.log('\n🔍 ==================== 诊断结束 ====================\n');
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen, xjs, user]);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 gap-2 bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
      >
        <Bug className="w-4 h-4" />
        采购询价调试工具
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-orange-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Bug className="w-5 h-5" />
              供应商采购询价数据流转诊断工具
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={runDiagnostics}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重新诊断
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                关闭
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* 当前登录用户 */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              当前登录用户
            </h3>
            <div className="bg-slate-50 rounded p-3 text-sm font-mono space-y-1">
              <div><span className="text-slate-600">Email:</span> {user?.email || '未登录'}</div>
              <div><span className="text-slate-600">Name:</span> {user?.name || 'N/A'}</div>
              <div><span className="text-slate-600">Company:</span> {user?.company || 'N/A'}</div>
            </div>
          </div>

          {/* localStorage中的supplierRFQs */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              localStorage.supplierRFQs
            </h3>
            <div className="bg-slate-50 rounded p-3 text-sm">
              {(() => {
                const data = localStorage.getItem('supplierRFQs');
                if (!data) return <p className="text-slate-500">无数据</p>;
                try {
                  const parsed = JSON.parse(data);
                  return (
                    <div>
                      <Badge variant="outline" className="mb-2">
                        共 {parsed.length} 条记录
                      </Badge>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {parsed.map((xj: any, idx: number) => (
                          <div key={idx} className="bg-white border rounded p-2 text-xs font-mono">
                            <div className="grid grid-cols-2 gap-1">
                              <div><span className="text-slate-600">ID:</span> {xj.id}</div>
                              <div><span className="text-slate-600">询价单号:</span> {xj.supplierXjNo || xj.xjNumber}</div>
                              <div><span className="text-slate-600">supplierEmail:</span> {xj.supplierEmail}</div>
                              <div><span className="text-slate-600">supplierCode:</span> {xj.supplierCode}</div>
                              <div className="col-span-2"><span className="text-slate-600">supplierName:</span> {xj.supplierName}</div>
                              <div><span className="text-slate-600">status:</span> <Badge variant="outline">{xj.status}</Badge></div>
                              <div><span className="text-slate-600">产品:</span> {xj.productName}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch (e) {
                  return <p className="text-red-500">解析失败: {String(e)}</p>;
                }
              })()}
            </div>
          </div>

          {/* XJContext中的rfqs */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              XJContext.xjs
            </h3>
            <div className="bg-slate-50 rounded p-3 text-sm">
              <Badge variant="outline" className="mb-2">
                共 {xjs.length} 条记录
              </Badge>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {xjs.map((xj: any, idx: number) => (
                  <div key={idx} className="bg-white border rounded p-2 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-1">
                      <div><span className="text-slate-600">ID:</span> {xj.id}</div>
                      <div><span className="text-slate-600">询价单号:</span> {xj.supplierXjNo || xj.xjNumber}</div>
                      <div><span className="text-slate-600">supplierEmail:</span> {xj.supplierEmail}</div>
                      <div><span className="text-slate-600">supplierCode:</span> {xj.supplierCode}</div>
                      <div className="col-span-2"><span className="text-slate-600">supplierName:</span> {xj.supplierName}</div>
                      <div><span className="text-slate-600">status:</span> <Badge variant="outline">{xj.status}</Badge></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* getRFQsBySupplier结果 */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              getXJsBySupplier('{user?.email}') 结果
            </h3>
            <div className="bg-slate-50 rounded p-3 text-sm">
              {(() => {
                if (!user?.email) return <p className="text-slate-500">用户未登录</p>;
                const myRFQs = getXJsBySupplier(user.email);
                return (
                  <div>
                    <Badge variant="outline" className="mb-2">
                      共 {myRFQs.length} 条记录
                    </Badge>
                    {myRFQs.length === 0 && xjs.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                          <div className="text-xs text-red-900">
                            <p className="font-semibold mb-1">⚠️ 数据匹配失败</p>
                            <p>XJ Context中有 {xjs.length} 条采购询价，但过滤结果为0</p>
                            <p className="mt-1">可能原因：supplierEmail/supplierCode 与登录用户email不匹配</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {myRFQs.map((xj: any, idx: number) => (
                        <div key={idx} className="bg-white border rounded p-2 text-xs font-mono">
                          <div className="grid grid-cols-2 gap-1">
                            <div><span className="text-slate-600">ID:</span> {xj.id}</div>
                            <div><span className="text-slate-600">询价单号:</span> {xj.supplierXjNo || xj.xjNumber}</div>
                            <div className="col-span-2"><span className="text-slate-600">产品:</span> {xj.productName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.clear();
                runDiagnostics();
              }}
              className="gap-2"
            >
              清空控制台并重新诊断
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const data = {
                  localStorage_supplierRFQs: JSON.parse(localStorage.getItem('supplierRFQs') || '[]'),
                  contextRFQs: xjs,
                  user: user
                };
                console.log('📋 导出诊断数据:', data);
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                alert('诊断数据已复制到剪贴板');
              }}
            >
              导出诊断数据
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
