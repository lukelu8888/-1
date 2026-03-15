import React from 'react';
import { Eye } from 'lucide-react';
import { PurchaseOrder as PurchaseOrderType } from '../../../contexts/PurchaseOrderContext';
import { getFormalBusinessModelNo } from '../../../utils/productModelDisplay';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { extractProjectExecutionBaseline } from './purchaseOrderUtils';

type PurchaseOrderDetailDialogProps = {
  showOrderDialog: boolean;
  setShowOrderDialog: React.Dispatch<React.SetStateAction<boolean>>;
  viewOrder: PurchaseOrderType | null;
  normalizeCGNumberForDisplay: (value: string) => string;
  resolveInquirySourceRef: (po: PurchaseOrderType) => string;
  handleViewPODocument: (po: PurchaseOrderType) => void;
};

export const PurchaseOrderDetailDialog: React.FC<PurchaseOrderDetailDialogProps> = ({
  showOrderDialog,
  setShowOrderDialog,
  viewOrder,
  normalizeCGNumberForDisplay,
  resolveInquirySourceRef,
  handleViewPODocument,
}) => {
  const projectBaseline = viewOrder ? extractProjectExecutionBaseline(viewOrder) : null;
  return (
    <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontSize: '15px' }}>采购订单详情 - {viewOrder?.poNumber}</DialogTitle>
          <DialogDescription style={{ fontSize: '12px' }}>Purchase Order Details</DialogDescription>
        </DialogHeader>

        {viewOrder && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-blue-900 mb-2">📋 基本信息</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">采购单号：</span>
                  <span className="font-semibold ml-2 text-purple-600">{normalizeCGNumberForDisplay(viewOrder.poNumber)}</span>
                </div>
                {resolveInquirySourceRef(viewOrder) && (
                  <div>
                    <span className="text-gray-600">来源单号：</span>
                    <span className="ml-2 text-blue-600">{resolveInquirySourceRef(viewOrder)}</span>
                  </div>
                )}
                {viewOrder.requirementNo && (
                  <div>
                    <span className="text-gray-600">关联需求：</span>
                    <span className="ml-2">{viewOrder.requirementNo}</span>
                  </div>
                )}
                {viewOrder.xjNumber && (
                  <div>
                    <span className="text-gray-600">关联询价：</span>
                    <span className="ml-2">{viewOrder.xjNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">订单日期：</span>
                  <span className="ml-2">{viewOrder.orderDate}</span>
                </div>
                <div>
                  <span className="text-gray-600">要求交期：</span>
                  <span className="ml-2">{viewOrder.expectedDate}</span>
                </div>
                {viewOrder.region && (
                  <div>
                    <span className="text-gray-600">区域：</span>
                    <span className="ml-2">{viewOrder.region}</span>
                  </div>
                )}
                {projectBaseline && (
                  <>
                    <div>
                      <span className="text-gray-600">项目：</span>
                      <span className="ml-2">{projectBaseline.projectCode ? `${projectBaseline.projectCode} · ` : ''}{projectBaseline.projectName || 'Project'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">执行版本：</span>
                      <span className="ml-2">Rev {projectBaseline.projectRevisionCode || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">最终报价：</span>
                      <span className="ml-2">{projectBaseline.finalQuotationNumber || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-orange-900 mb-2">🏢 供应商信息（溯源结果）</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">供应商名称：</span>
                  <span className="font-semibold ml-2">{viewOrder.supplierName}</span>
                </div>
                <div>
                  <span className="text-gray-600">供应商代码：</span>
                  <span className="ml-2">{viewOrder.supplierCode}</span>
                </div>
                {viewOrder.supplierContact && (
                  <div>
                    <span className="text-gray-600">联系人：</span>
                    <span className="ml-2">{viewOrder.supplierContact}</span>
                  </div>
                )}
                {viewOrder.supplierPhone && (
                  <div>
                    <span className="text-gray-600">电话：</span>
                    <span className="ml-2">{viewOrder.supplierPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-3">
              <h4 className="font-semibold mb-2 text-xs">📦 产品清单（溯源价格）</h4>
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">序号</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">产品名称</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-700">型号</th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700">数量</th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700">单价</th>
                      <th className="text-right py-2 px-2 font-medium text-gray-700">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items && viewOrder.items.length > 0 ? (
                      viewOrder.items.map((item, idx) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-600">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <div className="font-medium">{item.productName}</div>
                            {item.specification && <div className="text-[11px] text-gray-500">{item.specification}</div>}
                          </td>
                          <td className="py-2 px-2 text-gray-600">{getFormalBusinessModelNo(item)}</td>
                          <td className="py-2 px-2 text-right font-medium">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {item.currency} {item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right font-semibold">
                            {item.currency} {item.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-400">
                          暂无产品信息
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={5} className="py-2 px-2 text-right font-semibold">
                        总计：
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-[#F96302]">
                        {viewOrder.currency} {viewOrder.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded">
              <div>
                <span className="text-gray-600">付款条款：</span>
                <span className="ml-2">{viewOrder.paymentTerms}</span>
              </div>
              <div>
                <span className="text-gray-600">交货条款：</span>
                <span className="ml-2">{viewOrder.deliveryTerms}</span>
              </div>
            </div>

            {viewOrder.remarks && (
              <div className="text-xs">
                <span className="text-gray-600">备注：</span>
                <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 text-gray-700 whitespace-pre-wrap">{viewOrder.remarks}</div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowOrderDialog(false)} className="text-xs">
            关闭
          </Button>
          <Button
            onClick={() => {
              if (viewOrder) {
                handleViewPODocument(viewOrder);
                setShowOrderDialog(false);
              }
            }}
            className="bg-[#F96302] hover:bg-[#E05502] text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            查看PDF文档
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
