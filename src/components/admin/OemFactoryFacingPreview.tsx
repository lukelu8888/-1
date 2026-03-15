import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { adaptInquiryToFactoryFacingOemDocument } from '../../utils/documentDataAdapters';
import { normalizeOemData } from '../../types/oem';
import { OemFactoryFacingDocument } from '../documents/templates/OemFactoryFacingDocument';

interface OemFactoryFacingPreviewProps {
  inquiry: any;
  oemDraft?: any;
}

const formatMoldLifetime = (value?: string) => {
  if (!value) return 'Not specified';
  if (value === '10000') return '10k cycles';
  if (value === '100000') return '100k cycles';
  if (value === '300000') return '300k cycles';
  return value;
};

export function OemFactoryFacingPreview({ inquiry, oemDraft }: OemFactoryFacingPreviewProps) {
  const nextInquiry = {
    ...inquiry,
    oem: normalizeOemData(oemDraft || inquiry?.oem || inquiry?.documentDataSnapshot?.oem || inquiry?.document_data_snapshot?.oem),
  };
  const savedFactoryFacing =
    inquiry?.oemFactoryDispatch?.payload || null;
  const factoryFacing = savedFactoryFacing || adaptInquiryToFactoryFacingOemDocument(nextInquiry);

  if (!factoryFacing) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
          Preview Factory Version
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>OEM Factory-Facing Preview</DialogTitle>
          <DialogDescription>
            Internal-only Mainline B preview. Factory-facing output hides customer identity and replaces customer part
            numbers with internal MODEL# / SKU.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => {
                document.body.classList.add('printing-inq');
                window.print();
                setTimeout(() => {
                  document.body.classList.remove('printing-inq');
                }, 1000);
              }}
            >
              Print Factory Document
            </Button>
          </div>

          <OemFactoryFacingDocument data={factoryFacing} />

          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg text-slate-900">Factory-Facing Header</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Inquiry {factoryFacing.inquiryNumber} · {factoryFacing.issueDate}
                  </p>
                </div>
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                  {factoryFacing.ownerDepartment}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Internal Company</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>{factoryFacing.internalCompany.companyName}</p>
                  <p>Brand: {factoryFacing.internalCompany.brandName}</p>
                  <p>Contact: {factoryFacing.internalCompany.contactPerson}</p>
                  <p>Email: {factoryFacing.internalCompany.email}</p>
                  <p>Phone: {factoryFacing.internalCompany.phone}</p>
                  <p>Address: {factoryFacing.internalCompany.address}</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Factory-Facing Project</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>{factoryFacing.internalCompany.projectName}</p>
                  <p>Owner Department: Procurement Department</p>
                  <p>Customer Identity: Hidden from factory-facing version</p>
                  <p>Part Number Rule: Replace customer PN with internal MODEL# / SKU</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900">Replacement Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {factoryFacing.redactionSummary.map((item) => (
                <div key={item.field} className="grid gap-2 rounded-lg border border-slate-200 p-4 md:grid-cols-[180px_1fr_1fr]">
                  <p className="text-sm font-medium text-slate-900">{item.field}</p>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Original</p>
                    <p className="mt-1 text-sm text-slate-600">{item.originalValue || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Factory Version</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{item.replacementValue}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900">OEM Files and Part Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {factoryFacing.files.map((file) => (
                <div key={file.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{file.factoryFacingCode}</p>
                      <p className="mt-1 text-sm text-slate-600">{file.fileName}</p>
                    </div>
                    <Badge className="border border-indigo-200 bg-indigo-50 text-indigo-700">
                      {file.factoryFacingPartNumber}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Description</p>
                      <p className="mt-1">{file.description || 'No description'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Customer PN</p>
                      <p className="mt-1">{file.customerPartNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Internal MODEL#</p>
                      <p className="mt-1">{file.internalModelNumber || 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Internal SKU</p>
                      <p className="mt-1">{file.internalSku || 'Pending'}</p>
                    </div>
                  </div>
                  {file.storageUrl ? (
                    <a
                      href={file.storageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Open stored attachment
                    </a>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900">Factory-Facing Business Requirement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {factoryFacing.businessRequirementNote || 'No OEM requirement note provided.'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900">Tooling / Mold</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Tooling Cost Involved</span>
                  <Badge className={factoryFacing.tooling.toolingCostInvolved ? 'border border-amber-200 bg-amber-50 text-amber-700' : 'border border-slate-200 bg-slate-50 text-slate-600'}>
                    {factoryFacing.tooling.toolingCostInvolved ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>First Order Quantity</span>
                  <span>{factoryFacing.tooling.firstOrderQuantity || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Annual Quantity</span>
                  <span>{factoryFacing.tooling.annualQuantity || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quantity Within 3 Years</span>
                  <span>{factoryFacing.tooling.quantityWithinThreeYears || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mold Lifetime</span>
                  <span>{formatMoldLifetime(factoryFacing.tooling.moldLifetime)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900">Factory-Facing Payload Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {JSON.stringify(factoryFacing, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
