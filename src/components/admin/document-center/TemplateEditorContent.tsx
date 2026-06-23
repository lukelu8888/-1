import React from 'react';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { CgTemplateEditorPanel } from './CgTemplateEditorPanel';
import { CiTemplateEditorPanel } from './CiTemplateEditorPanel';
import { IngTemplateEditorPanel } from './IngTemplateEditorPanel';
import { PiTemplateEditorPanel } from './PiTemplateEditorPanel';
import { PlTemplateEditorPanel } from './PlTemplateEditorPanel';
import { PrTemplateEditorPanel } from './PrTemplateEditorPanel';
import { QtTemplateEditorPanel } from './QtTemplateEditorPanel';
import { QrTemplateEditorPanel } from './QrTemplateEditorPanel';
import { ScTemplateEditorPanel } from './ScTemplateEditorPanel';
import { SoaTemplateEditorPanel } from './SoaTemplateEditorPanel';
import { TemplateVersionActionsCard } from './TemplateVersionActionsCard';
import { TemplateVersionHistoryList } from './TemplateVersionHistoryList';
import { WorkspaceLayoutPanel } from './WorkspaceLayoutPanel';
import { XjProductsEditorPanel } from './XjProductsEditorPanel';
import { XjTermsEditorPanel } from './XjTermsEditorPanel';

export interface TemplateEditorContentProps {
  activeTemplate: any;
  activeLoadedVersion: any;
  resolvedActiveTemplateMeta: any;
  publishStatusMeta: Record<string, { label: string }>;
  handleTemplateRestore: () => void;
  renderVersionHistoryPanel: (templateId: string, count: number, content: React.ReactNode) => React.ReactNode;
  qr: any;
  pr: any;
  xj: any;
  bj: any;
  sc: any;
  cg: any;
  pi: any;
  ci: any;
  pl: any;
  soa: any;
  ing: any;
  qt: any;
}

export function TemplateEditorContent({
  activeTemplate,
  activeLoadedVersion,
  resolvedActiveTemplateMeta,
  publishStatusMeta,
  handleTemplateRestore,
  renderVersionHistoryPanel,
  qr,
  pr,
  xj,
  bj,
  sc,
  cg,
  pi,
  ci,
  pl,
  soa,
  ing,
  qt,
}: TemplateEditorContentProps) {
  if (activeTemplate.id === 'qr') {
    return (
      <QrTemplateEditorPanel
        publishedVersion={qr.latestPublishedRecord?.version}
        draftVersion={qr.latestDraftRecord?.version}
        qrTemplateVersionNote={qr.versionNote}
        setQrTemplateVersionNote={qr.setVersionNote}
        onRestoreLatest={handleTemplateRestore}
        restoreDisabled={!qr.latestVersionRecord}
        qrTemplateTextOverrides={qr.textOverrides}
        updateQrTemplateText={qr.updateText}
        qrTemplateData={qr.data}
        updateQrTemplateData={qr.updateData}
        qrTemplateLayout={qr.layout}
        updateQrTemplateLayout={qr.updateLayout}
        versionHistoryPanel={renderVersionHistoryPanel('qr', qr.versionHistory.length, (
          <TemplateVersionHistoryList
            records={qr.versionHistory}
            onRestore={(record) => { void qr.restoreAsDraft(record); }}
          />
        ))}
      />
    );
  }

  if (activeTemplate.id === 'pr') {
    return (
      <PrTemplateEditorPanel
        publishedVersion={pr.latestPublishedRecord?.version}
        draftVersion={pr.latestDraftRecord?.version}
        prTemplateVersionNote={pr.versionNote}
        setPrTemplateVersionNote={pr.setVersionNote}
        onRestoreLatest={handleTemplateRestore}
        restoreDisabled={!pr.latestVersionRecord}
        prTemplateTextOverrides={pr.textOverrides}
        updatePrTemplateText={pr.updateText}
        prTemplateData={pr.data}
        updatePrTemplateData={pr.updateData}
        prTemplateLayout={pr.layout}
        updatePrTemplateLayout={pr.updateLayout}
        versionHistoryPanel={renderVersionHistoryPanel('pr', pr.versionHistory.length, (
          <TemplateVersionHistoryList
            records={pr.versionHistory}
            onRestore={(record) => { void pr.restoreAsDraft(record); }}
          />
        ))}
      />
    );
  }

  if (activeTemplate.id === 'xj') {
    return (
      <>
        <TemplateVersionActionsCard
          publishedVersion={xj.latestPublishedRecord?.version}
          draftVersion={xj.latestDraftRecord?.version}
          noteField={(
            <div className="mt-2">
              <Label className="text-[11px] text-violet-700">版本备注</Label>
              <Textarea
                value={xj.versionNote}
                onChange={(e) => xj.setVersionNote(e.target.value)}
                className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
              />
            </div>
          )}
          onRestoreLatest={handleTemplateRestore}
          restoreDisabled={!xj.latestVersionRecord}
        />
        {renderVersionHistoryPanel('xj', xj.versionHistory.length, (
          <TemplateVersionHistoryList
            records={xj.versionHistory}
            onRestore={(record) => { void xj.restoreAsDraft(record); }}
          />
        ))}
        <WorkspaceLayoutPanel layout={xj.layout} onChange={xj.updateLayout} />
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-900 mb-3">单据信息</p>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[11px] text-gray-500">XJ 编号</Label><Input value={xj.data.xjNo} onChange={(e) => xj.updateData('xjNo', e.target.value)} className="mt-1 h-7 text-xs" /></div>
            <div><Label className="text-[11px] text-gray-500">询价日期</Label><Input value={xj.data.xjDate} onChange={(e) => xj.updateData('xjDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
            <div><Label className="text-[11px] text-gray-500">回复截止</Label><Input value={xj.data.requiredResponseDate} onChange={(e) => xj.updateData('requiredResponseDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
            <div><Label className="text-[11px] text-gray-500">要求交期</Label><Input value={xj.data.requiredDeliveryDate} onChange={(e) => xj.updateData('requiredDeliveryDate', e.target.value)} className="mt-1 h-7 text-xs" /></div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-900 mb-3">采购方信息</p>
          <div className="space-y-2">
            <div><Label className="text-[11px] text-gray-500">公司名称</Label><Input value={xj.data.buyer.name} onChange={(e) => xj.updateData('buyer', { ...xj.data.buyer, name: e.target.value })} className="mt-1 h-7 text-xs" /></div>
            <div><Label className="text-[11px] text-gray-500">英文名称</Label><Input value={xj.data.buyer.nameEn} onChange={(e) => xj.updateData('buyer', { ...xj.data.buyer, nameEn: e.target.value })} className="mt-1 h-7 text-xs" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={xj.data.buyer.contactPerson} onChange={(e) => xj.updateData('buyer', { ...xj.data.buyer, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
              <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={xj.data.buyer.email} onChange={(e) => xj.updateData('buyer', { ...xj.data.buyer, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-900 mb-3">供应商信息</p>
          <div className="space-y-2">
            <div><Label className="text-[11px] text-gray-500">供应商名称</Label><Input value={xj.data.supplier.companyName} onChange={(e) => xj.updateData('supplier', { ...xj.data.supplier, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={xj.data.supplier.contactPerson} onChange={(e) => xj.updateData('supplier', { ...xj.data.supplier, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
              <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={xj.data.supplier.email} onChange={(e) => xj.updateData('supplier', { ...xj.data.supplier, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
            </div>
            <div><Label className="text-[11px] text-gray-500">供应商地址</Label><Textarea value={xj.data.supplier.address} onChange={(e) => xj.updateData('supplier', { ...xj.data.supplier, address: e.target.value })} className="mt-1 min-h-[56px] text-xs" /></div>
          </div>
        </div>
        <XjProductsEditorPanel
          products={xj.data.products}
          onUpdateDescription={xj.updateProductDescription}
          onUpdateSpecification={xj.updateProductSpecification}
          onUpdateQuantity={xj.updateProductQuantity}
          onUpdateTargetPrice={xj.updateProductTargetPrice}
        />
        <XjTermsEditorPanel
          presets={xj.termPresets}
          terms={xj.data.terms}
          onApplyPreset={xj.applyTermsPreset}
          onClear={xj.clearTerms}
          onRestoreDefault={xj.restoreDefaultTerms}
          onPatchTerms={(patch) => xj.updateData('terms', { ...xj.data.terms, ...patch })}
        />
      </>
    );
  }

  if (activeTemplate.id === 'bj') {
    return (
      <>
        <TemplateVersionActionsCard
          publishedVersion={bj.latestPublishedRecord?.version}
          draftVersion={bj.latestDraftRecord?.version}
          noteField={(
            <div className="mt-2">
              <Label className="text-[11px] text-violet-700">版本备注</Label>
              <Textarea
                value={bj.versionNote}
                onChange={(e) => bj.setVersionNote(e.target.value)}
                className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
              />
            </div>
          )}
          onRestoreLatest={handleTemplateRestore}
          restoreDisabled={!bj.latestVersionRecord}
        />
        {renderVersionHistoryPanel('bj', bj.versionHistory.length, (
          <TemplateVersionHistoryList
            records={bj.versionHistory}
            onRestore={(record) => { void bj.restoreAsDraft(record); }}
          />
        ))}
        <WorkspaceLayoutPanel layout={bj.layout} onChange={bj.updateLayout} />
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-900 mb-3">供应商信息</p>
          <div className="space-y-2">
            <div><Label className="text-[11px] text-gray-500">公司名称</Label><Input value={bj.data.supplier.companyName} onChange={(e) => bj.updateData('supplier', { ...bj.data.supplier, companyName: e.target.value })} className="mt-1 h-7 text-xs" /></div>
            <div><Label className="text-[11px] text-gray-500">英文名称</Label><Input value={bj.data.supplier.companyNameEn} onChange={(e) => bj.updateData('supplier', { ...bj.data.supplier, companyNameEn: e.target.value })} className="mt-1 h-7 text-xs" /></div>
            <div><Label className="text-[11px] text-gray-500">联系人</Label><Input value={bj.data.supplier.contactPerson} onChange={(e) => bj.updateData('supplier', { ...bj.data.supplier, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" /></div>
            <div><Label className="text-[11px] text-gray-500">邮箱</Label><Input value={bj.data.supplier.email} onChange={(e) => bj.updateData('supplier', { ...bj.data.supplier, email: e.target.value })} className="mt-1 h-7 text-xs" /></div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-900 mb-3">产品清单</p>
          <div className="space-y-3">
            {bj.data.products.map((product: any, index: number) => (
              <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
                <div className="space-y-2">
                  <div><Label className="text-[11px] text-gray-500">品名</Label><Input value={product.description} onChange={(e) => bj.updateData('products', bj.data.products.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, description: e.target.value } : item))} className="mt-1 h-7 text-xs" /></div>
                  <div><Label className="text-[11px] text-gray-500">规格</Label><Textarea value={product.specification} onChange={(e) => bj.updateData('products', bj.data.products.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, specification: e.target.value } : item))} className="mt-1 min-h-[52px] text-xs" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-[11px] text-gray-500">数量</Label><Input type="number" value={product.quantity} onChange={(e) => bj.updateData('products', bj.data.products.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, quantity: Number(e.target.value) || 0 } : item))} className="mt-1 h-7 text-xs" /></div>
                    <div><Label className="text-[11px] text-gray-500">单价</Label><Input type="number" value={product.unitPrice} onChange={(e) => bj.updateData('products', bj.data.products.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, unitPrice: Number(e.target.value) || 0 } : item))} className="mt-1 h-7 text-xs" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (activeTemplate.id === 'sc') return <ScTemplateEditorPanel publishedVersion={sc.latestPublishedRecord?.version} draftVersion={sc.latestDraftRecord?.version} scTemplateVersionNote={sc.versionNote} setScTemplateVersionNote={sc.setVersionNote} onRestoreLatest={handleTemplateRestore} restoreDisabled={!sc.latestVersionRecord} versionHistoryPanel={renderVersionHistoryPanel('sc', sc.versionHistory.length, (<TemplateVersionHistoryList records={sc.versionHistory} onRestore={(record) => { void sc.restoreAsDraft(record); }} />))} scTemplateLayout={sc.layout} updateScTemplateLayout={sc.updateLayout} scTemplateData={sc.data} updateScTemplateData={sc.updateData} productTableColumns={sc.productTableColumns} moveScProductTableColumn={sc.moveProductTableColumn} updateScProductTableColumn={sc.updateProductTableColumn} />;
  if (activeTemplate.id === 'cg') return <CgTemplateEditorPanel publishedVersion={cg.latestPublishedRecord?.version} draftVersion={cg.latestDraftRecord?.version} cgTemplateVersionNote={cg.versionNote} setCgTemplateVersionNote={cg.setVersionNote} onRestoreLatest={handleTemplateRestore} restoreDisabled={!cg.latestVersionRecord} versionHistoryPanel={renderVersionHistoryPanel('cg', cg.versionHistory.length, (<TemplateVersionHistoryList records={cg.versionHistory} onRestore={(record) => { void cg.restoreAsDraft(record); }} />))} cgTemplateLayout={cg.layout} updateCgTemplateLayout={cg.updateLayout} cgTemplateData={cg.data} updateCgTemplateData={cg.updateData} productTableColumns={cg.productTableColumns} moveCgProductTableColumn={cg.moveProductTableColumn} updateCgProductTableColumn={cg.updateProductTableColumn} />;
  if (activeTemplate.id === 'pi') return <PiTemplateEditorPanel publishedVersion={pi.latestPublishedRecord?.version} draftVersion={pi.latestDraftRecord?.version} piTemplateVersionNote={pi.versionNote} setPiTemplateVersionNote={pi.setVersionNote} onRestoreLatest={handleTemplateRestore} restoreDisabled={!pi.latestVersionRecord} versionHistoryPanel={renderVersionHistoryPanel('pi', pi.versionHistory.length, (<TemplateVersionHistoryList records={pi.versionHistory} onRestore={(record) => { void pi.restoreAsDraft(record); }} />))} piTemplateLayout={pi.layout} updatePiTemplateLayout={pi.updateLayout} piTemplateData={pi.data} updatePiTemplateData={pi.updateData} goodsTableColumns={pi.goodsTableColumns} movePiGoodsTableColumn={pi.moveGoodsTableColumn} updatePiGoodsTableColumn={pi.updateGoodsTableColumn} />;
  if (activeTemplate.id === 'ci') return <CiTemplateEditorPanel publishedVersion={ci.latestPublishedRecord?.version} draftVersion={ci.latestDraftRecord?.version} ciTemplateVersionNote={ci.versionNote} setCiTemplateVersionNote={ci.setVersionNote} onRestoreLatest={handleTemplateRestore} restoreDisabled={!ci.latestVersionRecord} versionHistoryPanel={renderVersionHistoryPanel('ci', ci.versionHistory.length, (<TemplateVersionHistoryList records={ci.versionHistory} onRestore={(record) => { void ci.restoreAsDraft(record); }} />))} ciTemplateLayout={ci.layout} updateCiTemplateLayout={ci.updateLayout} ciTemplateData={ci.data} updateCiTemplateData={ci.updateData} goodsTableColumns={ci.goodsTableColumns} moveCiGoodsTableColumn={ci.moveGoodsTableColumn} updateCiGoodsTableColumn={ci.updateGoodsTableColumn} />;
  if (activeTemplate.id === 'pl') return <PlTemplateEditorPanel publishedVersion={pl.latestPublishedRecord?.version} draftVersion={pl.latestDraftRecord?.version} plTemplateVersionNote={pl.versionNote} setPlTemplateVersionNote={pl.setVersionNote} onRestoreLatest={handleTemplateRestore} restoreDisabled={!pl.latestVersionRecord} versionHistoryPanel={renderVersionHistoryPanel('pl', pl.versionHistory.length, (<TemplateVersionHistoryList records={pl.versionHistory} onRestore={(record) => { void pl.restoreAsDraft(record); }} />))} plTemplateLayout={pl.layout} updatePlTemplateLayout={pl.updateLayout} plTemplateData={pl.data} updatePlTemplateData={pl.updateData} />;
  if (activeTemplate.id === 'soa') return <SoaTemplateEditorPanel publishedVersion={soa.latestPublishedRecord?.version} draftVersion={soa.latestDraftRecord?.version} soaTemplateVersionNote={soa.versionNote} setSoaTemplateVersionNote={soa.setVersionNote} onRestoreLatest={handleTemplateRestore} restoreDisabled={!soa.latestVersionRecord} versionHistoryPanel={renderVersionHistoryPanel('soa', soa.versionHistory.length, (<TemplateVersionHistoryList records={soa.versionHistory} onRestore={(record) => { void soa.restoreAsDraft(record); }} />))} soaTemplateLayout={soa.layout} updateSoaTemplateLayout={soa.updateLayout} soaTemplateData={soa.data} updateSoaTemplateData={soa.updateData} />;
  if (activeTemplate.id === 'ing') return <IngTemplateEditorPanel publishedVersion={ing.latestPublishedRecord?.version} draftVersion={ing.latestDraftRecord?.version} currentLoadedText={activeLoadedVersion ? `当前已加载：${activeLoadedVersion.version} · ${activeLoadedVersion.status === 'published' ? '已发布' : '草稿'}` : null} inquiryTemplateVersionNote={ing.versionNote} setInquiryTemplateVersionNote={ing.setVersionNote} onRestoreLatest={handleTemplateRestore} restoreDisabled={!ing.latestVersionRecord} versionHistoryPanel={renderVersionHistoryPanel('ing', ing.versionHistory.length, (<TemplateVersionHistoryList records={ing.versionHistory} onRestore={(record) => { void ing.restoreAsDraft(record); }} activeVersion={activeLoadedVersion?.version} />))} inquiryTemplateLayout={ing.layout} updateInquiryTemplateLayout={ing.updateLayout} inquiryTemplateData={ing.data} updateInquiryTemplateData={ing.updateData} productTableColumns={ing.productTableColumns} moveInquiryProductTableColumn={ing.moveProductTableColumn} updateInquiryProductTableColumn={ing.updateProductTableColumn} requirementFields={ing.requirementFields} activeRequirementField={ing.activeRequirementField} setActiveRequirementField={ing.setActiveRequirementField} publishValidation={ing.publishValidation} />;
  if (activeTemplate.id === 'qt') return <QtTemplateEditorPanel publishedVersion={qt.latestPublishedRecord?.version} draftVersion={qt.latestDraftRecord?.version} quotationTemplateVersionNote={qt.versionNote} setQuotationTemplateVersionNote={qt.setVersionNote} onRestoreLatest={handleTemplateRestore} restoreDisabled={!qt.latestVersionRecord} versionHistoryPanel={renderVersionHistoryPanel('qt', qt.versionHistory.length, (<TemplateVersionHistoryList records={qt.versionHistory} onRestore={(record) => { void qt.restoreAsDraft(record); }} />))} quotationTemplateLayout={qt.layout} updateQuotationTemplateLayout={qt.updateLayout} quotationTemplateData={qt.data} updateQuotationTemplateData={qt.updateData} onUpdateProductName={qt.updateProductName} onUpdateQuantity={qt.updateQuantity} onUpdateUnitPrice={qt.updateUnitPrice} productTableColumns={qt.productTableColumns} moveQuotationProductTableColumn={qt.moveProductTableColumn} updateQuotationProductTableColumn={qt.updateProductTableColumn} />;

  return (
    <>
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
        <p className="text-xs font-semibold text-violet-900">版本操作</p>
        <p className="mt-1 text-[11px] text-violet-700">当前版本：{resolvedActiveTemplateMeta?.currentVersion || 'v1.0.0'}</p>
        <p className="mt-1 text-[11px] text-violet-700">发布状态：{resolvedActiveTemplateMeta ? publishStatusMeta[resolvedActiveTemplateMeta.status].label : '未发布'}</p>
        <div className="mt-2">
          <Label className="text-[11px] text-violet-700">版本备注</Label>
          <Textarea value={`${activeTemplate.name} 模板统一工作台已接入，等待专属字段编辑器。`} readOnly className="mt-1 min-h-[72px] border-violet-200 bg-white text-xs" />
        </div>
        <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={handleTemplateRestore}>恢复最近保存</Button>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">模板基础信息</p>
        <div className="space-y-2 text-[11px] text-gray-600">
          <div className="rounded bg-gray-50 px-3 py-2"><span className="text-gray-400">模板名称：</span>{activeTemplate.name}</div>
          <div className="rounded bg-gray-50 px-3 py-2"><span className="text-gray-400">英文名称：</span>{activeTemplate.nameEn}</div>
          <div className="rounded bg-gray-50 px-3 py-2"><span className="text-gray-400">模板分类：</span>{activeTemplate.categoryName}</div>
          <div className="rounded bg-gray-50 px-3 py-2"><span className="text-gray-400">组件来源：</span>{activeTemplate.component}</div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">业务说明</p>
        <Textarea value={activeTemplate.description} readOnly className="min-h-[96px] text-xs bg-gray-50" />
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">调用节点</p>
        <div className="space-y-2">
          {activeTemplate.usedInModules.length > 0 ? activeTemplate.usedInModules.map((mod: any, idx: number) => {
            const label = typeof mod === 'string' ? mod : mod.description || mod.module || `节点 ${idx + 1}`;
            const key = typeof mod === 'string' ? mod : `${mod.module}-${mod.subModule}-${idx}`;
            return <div key={key} className="rounded bg-gray-50 px-3 py-2 text-[11px] text-gray-600">{label}</div>;
          }) : <div className="rounded bg-gray-50 px-3 py-2 text-[11px] text-gray-400">暂无调用节点</div>}
        </div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs font-semibold text-amber-900">下一步接入</p>
        <p className="mt-1 text-[11px] leading-5 text-amber-800">
          当前已统一接入左右双栏、顶部固定、独立滚动的工作台结构。
          下一步会逐个补齐 {activeTemplate.name} 的专属字段编辑器和真实模板预览组件。
        </p>
      </div>
    </>
  );
}
