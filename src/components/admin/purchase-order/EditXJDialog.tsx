import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { EditableSelect } from '../../ui/editable-select';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { TERMS_OPTIONS } from './purchaseOrderConstants';
import { authorizedUsers } from '../../../data/authorizedUsers';

// Derive supplier company names from authorised users list
const SUPPLIER_COMPANY_OPTIONS: string[] = Array.from(
  new Set(
    authorizedUsers
      .filter((u: any) => u.role === 'supplier' && u.company)
      .map((u: any) => u.company as string)
  )
).sort();

type EditXJDialogProps = {
  showEditXJDialog: boolean;
  setShowEditXJDialog: React.Dispatch<React.SetStateAction<boolean>>;
  editXJData: any;
  setEditXJData: React.Dispatch<React.SetStateAction<any>>;
  handleSaveEditXJ: () => void;
};

export const EditXJDialog: React.FC<EditXJDialogProps> = ({
  showEditXJDialog,
  setShowEditXJDialog,
  editXJData,
  setEditXJData,
  handleSaveEditXJ,
}) => {
  return (
    <Dialog open={showEditXJDialog} onOpenChange={setShowEditXJDialog}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontSize: '16px' }}>✏️ 编辑询价单 - {editXJData?.xjNo}</DialogTitle>
          <DialogDescription style={{ fontSize: '12px' }}>Edit Procurement Inquiry - All fields are editable</DialogDescription>
        </DialogHeader>

        {editXJData && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-blue-900 mb-2">基本信息</h4>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px] text-gray-600">询价单号</Label>
                  <Input value={editXJData.xjNo || ''} onChange={(e) => setEditXJData({ ...editXJData, xjNo: e.target.value })} className="text-xs h-7" readOnly />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">询价日期</Label>
                  <Input type="date" value={editXJData.xjDate || ''} onChange={(e) => setEditXJData({ ...editXJData, xjDate: e.target.value })} className="text-xs h-7" />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">要求回复日期</Label>
                  <Input type="date" value={editXJData.requiredResponseDate || ''} onChange={(e) => setEditXJData({ ...editXJData, requiredResponseDate: e.target.value })} className="text-xs h-7" />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">要求交货日期</Label>
                  <Input type="date" value={editXJData.requiredDeliveryDate || ''} onChange={(e) => setEditXJData({ ...editXJData, requiredDeliveryDate: e.target.value })} className="text-xs h-7" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-green-900 mb-2">🏭 供应商信息</h4>
              <div className="grid grid-cols-2 gap-2">
                <EditableSelect
                  label="公司名称"
                  value={editXJData.supplier?.companyName || ''}
                  onChange={(val) => setEditXJData({ ...editXJData, supplier: { ...editXJData.supplier, companyName: val } })}
                  options={SUPPLIER_COMPANY_OPTIONS}
                  placeholder="搜索或输入供应商名称..."
                  searchable
                />
                <div>
                  <Label className="text-[10px] text-gray-600">联系人</Label>
                    <Input
                    value={editXJData.supplier?.contactPerson || ''}
                    onChange={(e) => setEditXJData({ ...editXJData, supplier: { ...editXJData.supplier, contactPerson: e.target.value } })}
                    className="text-xs h-7"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">地址</Label>
                    <Input
                    value={editXJData.supplier?.address || ''}
                    onChange={(e) => setEditXJData({ ...editXJData, supplier: { ...editXJData.supplier, address: e.target.value } })}
                    className="text-xs h-7"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-gray-600">电话</Label>
                    <Input
                      value={editXJData.supplier?.tel || ''}
                      onChange={(e) => setEditXJData({ ...editXJData, supplier: { ...editXJData.supplier, tel: e.target.value } })}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-600">邮箱</Label>
                    <Input
                      value={editXJData.supplier?.email || ''}
                      onChange={(e) => setEditXJData({ ...editXJData, supplier: { ...editXJData.supplier, email: e.target.value } })}
                      className="text-xs h-7"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-orange-900 mb-2">📋 询价说明</h4>
              <div>
                <Textarea
                  value={editXJData.inquiryDescription || ''}
                  onChange={(e) => setEditXJData({ ...editXJData, inquiryDescription: e.target.value })}
                  className="text-xs min-h-[60px]"
                  placeholder="例如：请贵司根据以下产品清单和要求提供详细报价，包括单价、总价、交货期等信息。请在 2025-12-21 前将报价单回复至采购联系人邮箱。"
                />
                <p className="text-[10px] text-gray-500 mt-1">💡 提示：如不填写将使用默认说明（包含回复截止日期）</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-900">📦 产品清单</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newProduct = {
                      no: (editXJData.products?.length || 0) + 1,
                      modelNo: '',
                      description: '',
                      specification: '',
                      quantity: 1,
                      unit: 'pcs',
                      targetPrice: '',
                      remarks: '',
                    };
                    setEditXJData({
                      ...editXJData,
                      products: [...(editXJData.products || []), newProduct],
                    });
                  }}
                  className="h-6 text-[10px] px-2 border-green-300 text-green-600 hover:bg-green-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加产品
                </Button>
              </div>
              <div className="border border-gray-200 rounded overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-[10px]">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-10">#</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">型号</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">产品名称</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">规格</th>
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700">数量</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">单位</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">目标价</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">备注</th>
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-16">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editXJData.products?.map((product: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-1 px-2 text-gray-500">{product.no}</td>
                        <td className="py-1 px-1">
                          <Input
                            value={product.modelNo || ''}
                            onChange={(e) => {
                              const newProducts = [...editXJData.products];
                              newProducts[idx].modelNo = e.target.value;
                              setEditXJData({ ...editXJData, products: newProducts });
                            }}
                            className="text-[10px] h-6 px-1"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            value={product.description || ''}
                            onChange={(e) => {
                              const newProducts = [...editXJData.products];
                              newProducts[idx].description = e.target.value;
                              setEditXJData({ ...editXJData, products: newProducts });
                            }}
                            className="text-[10px] h-6 px-1"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            value={product.specification || ''}
                            onChange={(e) => {
                              const newProducts = [...editXJData.products];
                              newProducts[idx].specification = e.target.value;
                              setEditXJData({ ...editXJData, products: newProducts });
                            }}
                            className="text-[10px] h-6 px-1"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            type="number"
                            value={product.quantity || ''}
                            onChange={(e) => {
                              const newProducts = [...editXJData.products];
                              newProducts[idx].quantity = parseInt(e.target.value) || 0;
                              setEditXJData({ ...editXJData, products: newProducts });
                            }}
                            className="text-[10px] h-6 px-1 text-center"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            value={product.unit || ''}
                            onChange={(e) => {
                              const newProducts = [...editXJData.products];
                              newProducts[idx].unit = e.target.value;
                              setEditXJData({ ...editXJData, products: newProducts });
                            }}
                            className="text-[10px] h-6 px-1"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            value={product.targetPrice || ''}
                            onChange={(e) => {
                              const newProducts = [...editXJData.products];
                              newProducts[idx].targetPrice = e.target.value;
                              setEditXJData({ ...editXJData, products: newProducts });
                            }}
                            className="text-[10px] h-6 px-1"
                            placeholder="选填"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Input
                            value={product.remarks || ''}
                            onChange={(e) => {
                              const newProducts = [...editXJData.products];
                              newProducts[idx].remarks = e.target.value;
                              setEditXJData({ ...editXJData, products: newProducts });
                            }}
                            className="text-[10px] h-6 px-1"
                            placeholder="选填"
                          />
                        </td>
                        <td className="py-1 px-1 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newProducts = editXJData.products.filter((_: any, i: number) => i !== idx);
                              newProducts.forEach((p: any, i: number) => (p.no = i + 1));
                              setEditXJData({ ...editXJData, products: newProducts });
                            }}
                            className="h-5 w-5 p-0 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-yellow-900 mb-3">📜 报价条款（16条）</h4>
              <div className="grid grid-cols-2 gap-3">
                <EditableSelect label="1. 报价币种" value={editXJData.terms?.currency || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, currency: val } })} options={TERMS_OPTIONS.currency} placeholder="选择或输入币种..." />
                <EditableSelect label="2. 付款方式" value={editXJData.terms?.paymentTerms || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, paymentTerms: val } })} options={TERMS_OPTIONS.paymentTerms} placeholder="选择或输入付款方式..." />
                <EditableSelect label="3. 交货条款" value={editXJData.terms?.deliveryTerms || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, deliveryTerms: val } })} options={TERMS_OPTIONS.deliveryTerms} placeholder="选择或输入交货条款..." />
                <EditableSelect label="4. 交货地址" value={editXJData.terms?.deliveryAddress || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, deliveryAddress: val } })} options={TERMS_OPTIONS.deliveryAddress} placeholder="选择或输入交货地址..." />
                <EditableSelect label="5. 交货时间" value={editXJData.terms?.deliveryRequirement || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, deliveryRequirement: val } })} options={TERMS_OPTIONS.deliveryRequirement} placeholder="选择或输入交货时间..." />
                <EditableSelect label="6. 产品质量标准" value={editXJData.terms?.qualityStandard || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, qualityStandard: val } })} options={TERMS_OPTIONS.qualityStandard} placeholder="选择或输入质量标准..." />
                <EditableSelect label="7. 验收标准" value={editXJData.terms?.inspectionMethod || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, inspectionMethod: val } })} options={TERMS_OPTIONS.inspectionMethod} placeholder="选择或输入验收标准..." />
                <EditableSelect label="8. 包装要求" value={editXJData.terms?.packaging || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, packaging: val } })} options={TERMS_OPTIONS.packaging} placeholder="选择或输入包装要求..." />
                <EditableSelect label="9. 唛头要求" value={editXJData.terms?.shippingMarks || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, shippingMarks: val } })} options={TERMS_OPTIONS.shippingMarks} placeholder="选择或输入唛头要求..." />
                <EditableSelect label="10. 验货要求" value={editXJData.terms?.inspectionRequirement || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, inspectionRequirement: val } })} options={TERMS_OPTIONS.inspectionRequirement} placeholder="选择或输入验货要求..." />
                <EditableSelect label="11. 技术文件" value={editXJData.terms?.technicalDocuments || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, technicalDocuments: val } })} options={TERMS_OPTIONS.technicalDocuments} placeholder="选择或输入技术文件要求..." />
                <EditableSelect label="12. 知识产权" value={editXJData.terms?.ipRights || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, ipRights: val } })} options={TERMS_OPTIONS.ipRights} placeholder="选择或输入知识产权要求..." />
                <EditableSelect label="13. 保密条款" value={editXJData.terms?.confidentiality || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, confidentiality: val } })} options={TERMS_OPTIONS.confidentiality} placeholder="选择或输入保密条款..." />
                <EditableSelect label="14. 样品要求" value={editXJData.terms?.sampleRequirement || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, sampleRequirement: val } })} options={TERMS_OPTIONS.sampleRequirement} placeholder="选择或输入样品要求..." />
                <EditableSelect label="15. 最小起订量（MOQ）" value={editXJData.terms?.moq || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, moq: val } })} options={TERMS_OPTIONS.moq} placeholder="选择或输入MOQ..." />
                <div className="col-span-2">
                  <EditableSelect label="16. 其他说明" value={editXJData.terms?.remarks || ''} onChange={(val) => setEditXJData({ ...editXJData, terms: { ...editXJData.terms, remarks: val } })} options={TERMS_OPTIONS.remarks} placeholder="选择或输入其他说明..." />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowEditXJDialog(false);
              setEditXJData(null);
            }}
            className="text-xs"
          >
            取消
          </Button>
          <Button onClick={handleSaveEditXJ} className="text-xs bg-[#F96302] hover:bg-[#E05502]">
            💾 保存修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
