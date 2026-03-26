import type { TemplatePreviewContentProps } from './TemplatePreviewContent';

export function buildTemplatePreviewContentProps(source: any): TemplatePreviewContentProps {
  return {
    mode: source.mode,
    activeTemplate: source.activeTemplate,
    qrTemplateData: source.qrTemplateData,
    qrTemplateTextOverrides: source.qrTemplateTextOverrides,
    prTemplateData: source.prTemplateData,
    prTemplateTextOverrides: source.prTemplateTextOverrides,
    xjTemplateData: source.xjTemplateData,
    scTemplateData: source.scTemplateData,
    cgTemplateData: source.cgTemplateData,
    bjTemplateData: source.bjTemplateData,
    piTemplateData: source.piTemplateData,
    ciTemplateData: source.ciTemplateData,
    plTemplateData: source.plTemplateData,
    soaTemplateData: source.soaTemplateData,
    inquiryTemplateData: source.inquiryTemplateData,
    quotationTemplateData: source.quotationTemplateData,
    quotationTemplateLayout: source.quotationTemplateLayout,
    resolvedActiveTemplateMeta: source.resolvedActiveTemplateMeta,
    publishStatusLabel: source.publishStatusLabel,
  };
}
