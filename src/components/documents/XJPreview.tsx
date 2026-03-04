import React, { useRef } from 'react';
import { XJDocument, XJData } from './templates/XJDocument';
import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToPDF, exportToPDFPrint } from '../../utils/pdfExport';
import { toast } from 'sonner@2.0.3';

/**
 * 📋 采购询价单预览页面
 * 用于测试和展示询价单模板
 */

// 示例数据
const sampleRFQData: XJData = {
  rfqNo: 'XJ-251218-1001',
  xjDate: '2025-12-18',
  requiredResponseDate: '2025-12-25',
  requiredDeliveryDate: '2026-01-15',
  
  buyer: {
    name: '福建高盛达富建材有限公司',
    nameEn: 'FUJIAN GOSUNDA FU BUILDING MATERIALS CO., LTD.',
    address: '福建省福州市仓山区金山工业区',
    addressEn: 'Jinshan Industrial Zone, Cangshan District, Fuzhou, Fujian, China',
    tel: '+86-591-8888-8888',
    email: 'purchasing@gosundafu.com',
    contactPerson: '张采购'
  },
  
  supplier: {
    companyName: '深圳市优质五金制品有限公司',
    address: '广东省深圳市宝安区西乡工业园',
    contactPerson: '李经理',
    tel: '+86-755-2888-8888',
    email: 'sales@supplier.com',
    supplierCode: 'SUP-ELEC-001'
  },
  
  products: [
    {
      no: 1,
      modelNo: 'WJ-2024-001',
      description: '不锈钢门锁',
      specification: '304不锈钢材质，带钥匙3把，表面拉丝处理',
      quantity: 1000,
      unit: '套',
      targetPrice: 'USD 12.50',
      remarks: '需配备安装说明书'
    },
    {
      no: 2,
      modelNo: 'WJ-2024-002',
      description: '铝合金门把手',
      specification: '6063铝合金，长度150mm，银色阳极氧化',
      quantity: 2000,
      unit: '个',
      targetPrice: 'USD 3.80',
      remarks: ''
    },
    {
      no: 3,
      modelNo: 'WJ-2024-003',
      description: '铜合金铰链',
      specification: '4寸静音铰链，承重80kg，镀铬处理',
      quantity: 3000,
      unit: '个',
      targetPrice: 'USD 2.20'
    }
  ],
  
  terms: {
    currency: 'USD',
    paymentTerms: 'T/T 30% 预付，70% 发货前付清',
    deliveryTerms: 'EXW 工厂交货',
    deliveryAddress: '福建省福州市仓山区金山工业区',
    
    qualityStandard: '产品需符合国家GB/T 27922-2011标准，如有国际标准（ISO 9001、CE认证）请提供相关认证证书',
    inspectionMethod: '到货后进行外观和功能检测，抽检率5%，不合格品按比例扣款或退换货处理',
    
    deliveryRequirement: '要求交货日期：2026-01-15，如无法按期交货需提前7天告知并说明原因',
    packaging: '标准出口包装，内层气泡膜，外层纸箱+木托盘，需防潮防震，适合长途运输和集装箱装运',
    shippingMarks: '中性唛头，不显示最终客户信息，或根据我司要求定制唛头（具体要求在订单确认后提供）',
    
    inspectionRequirement: '出货前需提供产品照片和装箱照片，如需第三方检验由我司指定检验机构（费用由供应商承担）',
    technicalDocuments: '需提供产品说明书（中英文）、材质检测报告、RoHS检测报告、CE认证证书（如有）',
    
    ipRights: '供应商确认所供产品不侵犯任何第三方知识产权，如因产品设计、商标、专利等引发纠纷，由供应商承担全部法律责任和经济损失',
    confidentiality: '双方对本次询价的价格信息、技术资料、客户信息、商业机密等保密，未经对方书面同意不得向第三方透露或用于其他用途',
    
    sampleRequirement: '首次合作需提供2-3个样品供我司质量确认，样品费用由我司承担（正式订单后可抵扣），往返快递费由我司承担',
    moq: '请在报价中注明最小起订量（MOQ）要求，如有阶梯价格请一并说明',
    remarks: '报价有效期请不少于30天，交货周期请明确标注（从收到订单和预付款开始计算）'
  }
};

export function XJPreview() {
  const docRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!docRef.current) return;
    
    try {
      await exportToPDF(docRef.current, `采购询价单_${sampleRFQData.rfqNo}_${sampleRFQData.supplier.companyName}.pdf`);
      toast.success('询价单已下载为PDF');
    } catch (error) {
      toast.error('导出PDF失败');
      console.error(error);
    }
  };

  const handlePrint = async () => {
    if (!docRef.current) return;
    
    try {
      await exportToPDFPrint(docRef.current);
    } catch (error) {
      toast.error('打印预览失败');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部操作栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[210mm] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">采购询价单预览</h1>
            <p className="text-xs text-gray-500 mt-1">Procurement Inquiry Document Preview</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              打印预览
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              className="bg-[#F96302] hover:bg-[#E05502] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下载PDF
            </Button>
          </div>
        </div>
      </div>

      {/* 文档预览区域 */}
      <div className="py-8">
        <XJDocument ref={docRef} data={sampleRFQData} />
      </div>

      {/* 底部说明 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="max-w-[210mm] mx-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 询价单说明</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• 本询价单用于采购询价，不包含供应商收款信息和正式采购合同条款</p>
            <p>• 包含产品质量、交货时间、验收标准、付款方式、包装唛头、验货技术文件、知识产权、保密条款等核心要求</p>
            <p>• 询价单编号格式：XJ-YYMMDD-XXXX（XJ = 询价，后续为日期和流水号）</p>
            <p>• 供应商应在要求的回复截止日期前提交正式报价单</p>
          </div>
        </div>
      </div>
    </div>
  );
}
