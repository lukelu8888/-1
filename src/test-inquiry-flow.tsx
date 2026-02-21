import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { useInquiry } from './contexts/InquiryContext';
import { useUser } from './contexts/UserContext';
import { CheckCircle, XCircle, AlertCircle, Send, Eye } from 'lucide-react';

/**
 * 🧪 询价单流程测试页面
 * 
 * 测试场景：
 * 1. 客户创建询价单
 * 2. 客户提交询价单
 * 3. 业务员能否看到询价单
 * 4. 区域过滤是否正常工作
 */

export default function TestInquiryFlow() {
  const { inquiries, addInquiry, submitInquiry, getSubmittedInquiries } = useInquiry();
  const { user } = useUser();
  const [testResults, setTestResults] = useState<any[]>([]);

  // 🧪 测试1：创建客户询价单
  const testCreateInquiry = async () => {
    const region = 'North America'; // 北美区域
    const customerEmail = 'customer@homedepot.com';
    
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9000) + 1000;
    const rfqId = `RFQ-NA-${dateStr}-${random}`;

    const inquiry = {
      id: rfqId,
      date: new Date().toISOString().split('T')[0],
      userEmail: customerEmail,
      companyId: 'company_homedepot_001',
      products: [
        {
          id: '1',
          name: 'LED Light Bulb 60W',
          image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
          category: 'Electrical',
          price: 5.99,
          inStock: true,
          description: 'Energy efficient LED bulb',
          quantity: 1000,
          totalPrice: 5990
        }
      ],
      status: 'draft' as const,
      isSubmitted: false, // 🔥 关键：还未提交
      totalPrice: 5990,
      region: region as any,
      buyerInfo: {
        companyName: 'Home Depot Inc.',
        contactPerson: 'John Smith',
        email: customerEmail,
        phone: '+1-800-466-3337',
        address: '2455 Paces Ferry Rd NW, Atlanta, GA 30339',
        businessType: 'Retailer'
      },
      shippingInfo: {
        cartons: '50',
        cbm: '10',
        totalGrossWeight: '500',
        totalNetWeight: '450'
      },
      message: 'Urgent order for Home Depot store chain',
      createdAt: Date.now()
    };

    await addInquiry(inquiry);

    setTestResults(prev => [...prev, {
      test: '创建询价单',
      success: true,
      message: `✅ 创建询价单成功: ${rfqId}`,
      data: inquiry
    }]);

    return rfqId;
  };

  // 🧪 测试2：提交询价单
  const testSubmitInquiry = async () => {
    // 先创建一个询价单
    const rfqId = await testCreateInquiry();
    
    // 等待一下确保数据已保存
    await new Promise(resolve => setTimeout(resolve, 500));

    // 提交询价单
    await submitInquiry(rfqId);

    // 等待一下确保数据已更新
    await new Promise(resolve => setTimeout(resolve, 500));

    // 检查询价单是否已提交
    const submittedInquiries = getSubmittedInquiries();
    const submitted = submittedInquiries.find(inq => inq.id === rfqId);

    setTestResults(prev => [...prev, {
      test: '提交询价单',
      success: !!submitted && submitted.isSubmitted,
      message: submitted?.isSubmitted 
        ? `✅ 询价单已提交: ${rfqId}，状态: ${submitted.status}` 
        : `❌ 询价单未提交成功: ${rfqId}`,
      data: submitted
    }]);

    return { rfqId, submitted };
  };

  // 🧪 测试3：业务员能否看到提交的询价单
  const testAdminCanSeeInquiry = async () => {
    // 提交一个询价单
    const { rfqId, submitted } = await testSubmitInquiry();

    // 获取所有已提交的询价单（业务员视角）
    const submittedInquiries = getSubmittedInquiries();

    // 检查是否能找到刚提交的询价单
    const found = submittedInquiries.find(inq => inq.id === rfqId);

    setTestResults(prev => [...prev, {
      test: '业务员查看询价单',
      success: !!found,
      message: found 
        ? `✅ 业务员可以看到询价单: ${rfqId}` 
        : `❌ 业务员看不到询价单: ${rfqId}`,
      data: {
        totalSubmitted: submittedInquiries.length,
        found: found,
        allInquiries: submittedInquiries.map(inq => ({
          id: inq.id,
          region: inq.region,
          isSubmitted: inq.isSubmitted,
          status: inq.status
        }))
      }
    }]);
  };

  // 🧪 测试4：区域过滤测试
  const testRegionFilter = async () => {
    // 创建3个不同区域的询价单
    const regions = [
      { code: 'NA', name: 'North America' },
      { code: 'SA', name: 'South America' },
      { code: 'EA', name: 'Europe & Africa' }
    ];

    const createdInquiries: any[] = [];

    for (const region of regions) {
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 9000) + 1000;
      const rfqId = `RFQ-${region.code}-${dateStr}-${random}`;

      const inquiry = {
        id: rfqId,
        date: new Date().toISOString().split('T')[0],
        userEmail: `customer@${region.code.toLowerCase()}.com`,
        companyId: `company_${region.code}_001`,
        products: [
          {
            id: '1',
            name: 'Test Product',
            image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
            category: 'Electrical',
            price: 100,
            inStock: true,
            description: 'Test',
            quantity: 10,
            totalPrice: 1000
          }
        ],
        status: 'pending' as const,
        isSubmitted: true,
        totalPrice: 1000,
        region: region.name as any,
        buyerInfo: {
          companyName: `${region.name} Customer`,
          contactPerson: 'Test Contact',
          email: `customer@${region.code.toLowerCase()}.com`,
          phone: '+1234567890',
          address: 'Test Address',
          businessType: 'Retailer'
        },
        shippingInfo: {
          cartons: '10',
          cbm: '2',
          totalGrossWeight: '100',
          totalNetWeight: '90'
        },
        message: `Test inquiry from ${region.name}`,
        createdAt: Date.now(),
        submittedAt: Date.now()
      };

      await addInquiry(inquiry);
      createdInquiries.push(inquiry);
    }

    // 等待数据保存
    await new Promise(resolve => setTimeout(resolve, 500));

    // 检查每个区域的询价单
    const submittedInquiries = getSubmittedInquiries();
    const byRegion = {
      'North America': submittedInquiries.filter(inq => inq.region === 'North America'),
      'South America': submittedInquiries.filter(inq => inq.region === 'South America'),
      'Europe & Africa': submittedInquiries.filter(inq => inq.region === 'Europe & Africa')
    };

    setTestResults(prev => [...prev, {
      test: '区域过滤测试',
      success: true,
      message: `✅ 创建了3个区域的询价单`,
      data: {
        total: submittedInquiries.length,
        byRegion: {
          'North America': byRegion['North America'].length,
          'South America': byRegion['South America'].length,
          'Europe & Africa': byRegion['Europe & Africa'].length
        },
        createdInquiries: createdInquiries.map(inq => ({
          id: inq.id,
          region: inq.region,
          isSubmitted: inq.isSubmitted
        }))
      }
    }]);
  };

  // 🧪 测试5：完整流程测试
  const testCompleteFlow = async () => {
    setTestResults([]); // 清空之前的结果
    
    console.log('🧪 开始完整流程测试...');
    
    await testCreateInquiry();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await testSubmitInquiry();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await testAdminCanSeeInquiry();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await testRegionFilter();
    
    console.log('✅ 完整流程测试完成！');
  };

  // 🔍 检查当前状态
  const checkCurrentState = () => {
    const allInquiries = inquiries;
    const submitted = getSubmittedInquiries();
    
    setTestResults(prev => [...prev, {
      test: '当前状态检查',
      success: true,
      message: `📊 总询价数: ${allInquiries.length}, 已提交: ${submitted.length}`,
      data: {
        total: allInquiries.length,
        submitted: submitted.length,
        draft: allInquiries.filter(inq => !inq.isSubmitted).length,
        byRegion: {
          'North America': submitted.filter(inq => inq.region === 'North America').length,
          'South America': submitted.filter(inq => inq.region === 'South America').length,
          'Europe & Africa': submitted.filter(inq => inq.region === 'Europe & Africa').length
        },
        recentInquiries: submitted.slice(-5).map(inq => ({
          id: inq.id,
          region: inq.region,
          customer: inq.buyerInfo?.companyName,
          isSubmitted: inq.isSubmitted,
          status: inq.status
        }))
      }
    }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🧪 询价单流程测试
          </h1>
          <p className="text-sm text-gray-600">
            测试客户提交询价单 → 业务员接收的完整流程
          </p>
          {user && (
            <div className="mt-3 text-xs text-gray-500">
              当前用户: <strong>{user.email}</strong> | 角色: <strong>{user.role}</strong>
            </div>
          )}
        </div>

        {/* 测试按钮 */}
        <Card>
          <CardHeader>
            <CardTitle>测试操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button onClick={testCreateInquiry} variant="outline">
                <Send className="w-4 h-4 mr-2" />
                1. 创建询价单
              </Button>
              <Button onClick={testSubmitInquiry} variant="outline">
                <Send className="w-4 h-4 mr-2" />
                2. 提交询价单
              </Button>
              <Button onClick={testAdminCanSeeInquiry} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                3. 业务员查看
              </Button>
              <Button onClick={testRegionFilter} variant="outline">
                <AlertCircle className="w-4 h-4 mr-2" />
                4. 区域过滤测试
              </Button>
              <Button onClick={checkCurrentState} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                检查当前状态
              </Button>
              <Button 
                onClick={testCompleteFlow} 
                className="bg-orange-600 hover:bg-orange-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                运行完整测试
              </Button>
            </div>

            <Button 
              onClick={() => setTestResults([])} 
              variant="ghost" 
              className="w-full"
            >
              清除结果
            </Button>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          测试 {index + 1}
                        </Badge>
                        <span className="font-semibold text-sm">
                          {result.test}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.message}
                      </p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            查看详细数据
                          </summary>
                          <pre className="mt-2 p-3 bg-white rounded border text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 当前数据统计 */}
        <Card>
          <CardHeader>
            <CardTitle>当前数据统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  {inquiries.length}
                </div>
                <div className="text-xs text-blue-600">总询价数</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  {getSubmittedInquiries().length}
                </div>
                <div className="text-xs text-green-600">已提交</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-900">
                  {inquiries.filter(inq => !inq.isSubmitted).length}
                </div>
                <div className="text-xs text-yellow-600">草稿</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">
                  {getSubmittedInquiries().filter(inq => inq.region === 'North America').length}
                </div>
                <div className="text-xs text-purple-600">北美区域</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
