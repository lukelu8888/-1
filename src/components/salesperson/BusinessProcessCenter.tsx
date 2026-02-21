/**
 * 🔥 业务流程中心 - 业务员端
 * 
 * 整合4个核心模块：
 * 1. 订单全流程 - 查看完整的订单流转状态
 * 2. 询价管理 - 客户询价单管理
 * 3. 成本询报 - 采购需求单管理（QR）
 * 4. 报价管理 - 业务员销售报价单管理（QT）
 * 5. 合同管理 - 业务员销售合同管理（SO）
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Workflow, 
  FileText, 
  Package, 
  TrendingUp,
  FileSignature
} from 'lucide-react';
import { AdminInquiryManagementNew } from '../admin/AdminInquiryManagementNew'; // 询价管理
import { CostInquiryQuotationManagement } from '../admin/CostInquiryQuotationManagement'; // 成本询报
import { SalesQuotationManagement } from './SalesQuotationManagement'; // 报价管理
import { SalesContractManagement } from './SalesContractManagement'; // 🔥 合同管理
import { usePurchaseRequirements } from '../../contexts/PurchaseRequirementContext';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext';
import { useSalesContracts } from '../../contexts/SalesContractContext'; // 🔥 销售合同Context
import { useInquiry } from '../../contexts/InquiryContext';
import { getCurrentUser } from '../../utils/dataIsolation';

export function BusinessProcessCenter() {
  const [activeTab, setActiveTab] = useState('inquiry-management');
  const [highlightQtNumber, setHighlightQtNumber] = useState<string | undefined>(undefined); // 🔥 高亮报价单号
  const [highlightScNumber, setHighlightScNumber] = useState<string | undefined>(undefined); // 🔥 高亮销售合同号
  const currentUser = getCurrentUser();
  
  // 获取数据用于显示Badge数量
  const { inquiries } = useInquiry();
  const { requirements } = usePurchaseRequirements();
  const { quotations } = useSalesQuotations();
  const { contracts } = useSalesContracts(); // 🔥 销售合同
  
  // 统计业务员相关的数据
  const myInquiries = inquiries.filter(inq => 
    inq.salesRepEmail === currentUser?.email || inq.assignedTo === currentUser?.email
  );
  
  const myRequirements = requirements.filter(qr => 
    qr.createdBy === currentUser?.email
  );
  
  const myQuotations = quotations.filter(qt => 
    qt.salesPerson === currentUser?.email
  );
  
  const myContracts = contracts.filter(contract => 
    contract.salesPerson === currentUser?.email
  );
  
  return (
    <div className="space-y-4">
      {/* 🔥 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Workflow className="h-7 w-7" style={{ color: '#F96302' }} />
              业务流程中心
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              询价 → 成本询报 → 报价 → 成交 全流程管理
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">
              业务员: {currentUser?.name || currentUser?.email}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* 🔥 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200">
          <TabsTrigger 
            value="full-process" 
            className="flex items-center gap-2 data-[state=active]:bg-orange-50"
            style={{ 
              color: activeTab === 'full-process' ? '#F96302' : undefined 
            }}
          >
            <Workflow className="h-4 w-4" />
            订单全流程
            <Badge variant="secondary" className="ml-1">NEW</Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="inquiry-management" 
            className="flex items-center gap-2 data-[state=active]:bg-orange-50"
            style={{ 
              color: activeTab === 'inquiry-management' ? '#F96302' : undefined 
            }}
          >
            <FileText className="h-4 w-4" />
            询价管理
            {myInquiries.length > 0 && (
              <Badge variant="secondary" className="ml-1">{myInquiries.length}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="cost-inquiry" 
            className="flex items-center gap-2 data-[state=active]:bg-orange-50"
            style={{ 
              color: activeTab === 'cost-inquiry' ? '#F96302' : undefined 
            }}
          >
            <Package className="h-4 w-4" />
            成本询报
            {myRequirements.length > 0 && (
              <Badge variant="secondary" className="ml-1">{myRequirements.length}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="quotation-management"
            className="flex items-center gap-2 data-[state=active]:bg-orange-50"
            style={{ 
              color: activeTab === 'quotation-management' ? '#F96302' : undefined 
            }}
          >
            <TrendingUp className="h-4 w-4" />
            报价管理
          </TabsTrigger>
          
          <TabsTrigger 
            value="contract-management"
            className="flex items-center gap-2 data-[state=active]:bg-orange-50"
            style={{ 
              color: activeTab === 'contract-management' ? '#F96302' : undefined 
            }}
          >
            <FileSignature className="h-4 w-4" />
            订单管理
            {myContracts.length > 0 && (
              <Badge variant="secondary" className="ml-1">{myContracts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          <TabsContent value="full-process" className="mt-0">
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Workflow className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">订单全流程看板</h3>
              <p className="text-sm text-gray-500">
                该功能正在开发中，敬请期待...
              </p>
              <p className="text-xs text-gray-400 mt-2">
                将展示：INQ → QR → XJ → BJ → QT → SO → PO 完整流转链路
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="inquiry-management" className="mt-0">
            <AdminInquiryManagementNew 
              onSwitchToCostInquiry={() => setActiveTab('cost-inquiry')} // 🔥 下推成本询报后自动切换标签页
            />
          </TabsContent>
          
          <TabsContent value="cost-inquiry" className="mt-0">
            <CostInquiryQuotationManagement 
              onSwitchToQuotationManagement={(qtNumber) => {
                // 🔥 下推报价管理：切换到报价管理页面并高亮指定QT
                setHighlightQtNumber(qtNumber);
                setActiveTab('quotation-management');
                // 3秒后清除高亮参数
                setTimeout(() => setHighlightQtNumber(undefined), 3500);
              }}
            />
          </TabsContent>
          
          <TabsContent value="quotation-management" className="mt-4">
            <SalesQuotationManagement 
              highlightQtNumber={highlightQtNumber} 
              onNavigateToOrders={() => setActiveTab('contract-management')} 
              onNavigateToOrdersWithHighlight={(scNumber) => {
                // 🔥 下推生成销售合同：切换到订单管理并高亮指定SC
                setHighlightScNumber(scNumber);
                setActiveTab('contract-management');
                // 3秒后清除高亮参数
                setTimeout(() => setHighlightScNumber(undefined), 3500);
              }}
            />
          </TabsContent>
          
          <TabsContent value="contract-management" className="mt-0">
            <SalesContractManagement 
              highlightScNumber={highlightScNumber} 
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}