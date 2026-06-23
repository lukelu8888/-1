import React, { useMemo } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { FileText, Printer } from 'lucide-react';
import { useInquiry } from '../../contexts/InquiryContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import { OemFactoryFacingDocument } from '../documents/templates/OemFactoryFacingDocument';
import { aggregateInquiryOemFromProducts, normalizeOemData } from '../../types/oem';
import { resolveSupplierPortalLanguage } from '../../utils/supplierPortalLanguage';

const normalizeRegionLabel = (value?: string | null, language: 'zh' | 'en' = 'en') => {
  if (!value) return language === 'zh' ? '未分配区域' : 'Unassigned';
  if (value === 'NA') return language === 'zh' ? '北美' : 'North America';
  if (value === 'SA') return language === 'zh' ? '南美' : 'South America';
  if (value === 'EA') return language === 'zh' ? '欧洲与非洲' : 'Europe & Africa';
  return value;
};

export default function SupplierOemFactoryReleaseCenter() {
  const { getSubmittedInquiries } = useInquiry();
  const { org } = useOrganization();
  const { user } = useUser();
  const portalLanguage = useMemo<'zh' | 'en'>(() => resolveSupplierPortalLanguage({
    org: {
      name: org?.name,
      nameEn: org?.nameEn,
      address: org?.address,
    },
    user: {
      name: user?.name,
      company: user?.company,
      address: user?.address,
      type: user?.type,
      role: user?.role,
      userRole: user?.userRole,
    },
  }), [org?.address, org?.name, org?.nameEn, user?.address, user?.company, user?.name, user?.role, user?.type, user?.userRole]);
  const releasedPackages = getSubmittedInquiries()
    .map((inquiry) => {
      const productLevelOem = aggregateInquiryOemFromProducts(Array.isArray(inquiry.products) ? inquiry.products : []);
      const oem = productLevelOem.enabled ? productLevelOem : normalizeOemData(inquiry.oem);
      const factoryVersion = inquiry.oemFactoryDispatch
        ? {
            generatedAt: inquiry.oemFactoryDispatch.generatedAt,
            releasedAt: inquiry.oemFactoryDispatch.releasedAt,
            payload: inquiry.oemFactoryDispatch.payload,
          }
        : null;
      const released =
        oem?.internalProcessing?.factoryForwardingStatus === 'released_to_factory' &&
        factoryVersion?.payload;

      if (!released) return null;

      return {
        id: inquiry.id,
        inquiryNumber: inquiry.inquiryNumber || inquiry.id,
        region: normalizeRegionLabel(inquiry.region, portalLanguage),
        issueDate: inquiry.date,
        releasedAt: factoryVersion.releasedAt || factoryVersion.generatedAt || null,
        payload: factoryVersion.payload,
        fileCount: Array.isArray(factoryVersion.payload?.files) ? factoryVersion.payload.files.length : 0,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      inquiryNumber: string;
      region: string;
      issueDate: string;
      releasedAt: string | null;
      payload: any;
      fileCount: number;
    }>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {portalLanguage === 'zh' ? '工厂资料包' : 'Factory Documents'}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            {portalLanguage === 'zh' ? '已下发的 OEM 工厂资料' : 'Released OEM Packages'}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {portalLanguage === 'zh'
              ? '这里仅显示由 COSUN 采购部正式下发给工厂执行的 OEM 资料。客户身份与客户源料号已按规则隐藏。'
              : 'Only factory-facing OEM documents released by COSUN Procurement Department are visible here. Customer identity and customer-origin part numbers are hidden by design.'}
          </p>
        </div>
        <Badge className="border border-indigo-200 bg-indigo-50 text-indigo-700">
          {portalLanguage === 'zh' ? `已下发 ${releasedPackages.length} 份` : `${releasedPackages.length} released`}
        </Badge>
      </div>

      {releasedPackages.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {portalLanguage === 'zh' ? '当前还没有下发到工厂端的 OEM 资料包。' : 'No OEM package has been released to factory yet.'}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {releasedPackages.map((pkg) => (
            <div key={pkg.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{pkg.inquiryNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {portalLanguage === 'zh' ? `区域：${pkg.region} · 下发日期：${pkg.issueDate}` : `Region: ${pkg.region} · Issued: ${pkg.issueDate}`}
                  </p>
                </div>
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                  {portalLanguage === 'zh' ? '采购已下发' : 'Procurement Released'}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{portalLanguage === 'zh' ? '文件数量' : 'Files'}</p>
                  <p className="mt-1 font-medium text-slate-900">{pkg.fileCount}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{portalLanguage === 'zh' ? '下发时间' : 'Released At'}</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {pkg.releasedAt ? new Date(pkg.releasedAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <FileText className="h-4 w-4" />
                      {portalLanguage === 'zh' ? '查看工厂资料' : 'View Factory Document'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{portalLanguage === 'zh' ? '工厂执行版 OEM 资料包' : 'Factory-Facing OEM Package'}</DialogTitle>
                      <DialogDescription>
                        {portalLanguage === 'zh' ? '由 COSUN 采购部下发，供工厂执行使用。' : 'Released by COSUN Procurement Department for factory execution.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          document.body.classList.add('printing-inq');
                          window.print();
                          setTimeout(() => {
                            document.body.classList.remove('printing-inq');
                          }, 1000);
                        }}
                      >
                        <Printer className="h-4 w-4" />
                        {portalLanguage === 'zh' ? '打印' : 'Print'}
                      </Button>
                    </div>
                    <OemFactoryFacingDocument data={pkg.payload} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
