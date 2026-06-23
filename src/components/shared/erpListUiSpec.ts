export const ERP_LIST_UI_SPEC_V1 = {
  searchTextClass: 'text-sm',
  buttonTextClass: 'text-[12px]',
  headerTextClass: 'text-[13px] font-semibold leading-4 tracking-[0.01em]',
  primaryTextClass: 'text-[12px]',
  secondaryTextClass: 'text-[11px]',
} as const;

export const ERP_LIST_ACTIVE_PILL_COLOR = '#F5222D';
export const ERP_LIST_DELETE_PILL_COLOR = '#F5222D';

export const ERP_LIST_FILTER_PILL_BASE_CLASS =
  'h-9 shrink-0 whitespace-nowrap rounded-xl px-4 shadow-sm transition-colors text-[12px]';

export const ERP_LIST_FILTER_PILL_INACTIVE_CLASS =
  'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

export const ERP_LIST_DELETE_BUTTON_CLASS =
  'h-9 shrink-0 whitespace-nowrap gap-1 rounded-xl border px-3 text-[12px] font-semibold shadow-sm text-white hover:text-white disabled:opacity-100';

export const getErpListFilterPillClass = (active: boolean) =>
  `${ERP_LIST_FILTER_PILL_BASE_CLASS} ${
    active
      ? 'border-[#F5222D] bg-[#F5222D] !text-white hover:bg-[#d71922]'
      : ERP_LIST_FILTER_PILL_INACTIVE_CLASS
  }`;

export const getErpListFilterPillStyle = (active: boolean) =>
  active
    ? {
        backgroundColor: ERP_LIST_ACTIVE_PILL_COLOR,
        borderColor: ERP_LIST_ACTIVE_PILL_COLOR,
        color: '#ffffff',
      }
    : undefined;

export const ERP_LIST_DELETE_BUTTON_STYLE = {
  backgroundColor: ERP_LIST_DELETE_PILL_COLOR,
  borderColor: ERP_LIST_DELETE_PILL_COLOR,
  color: '#ffffff',
} as const;

export const getErpListBatchDeletePillClass = (enabled: boolean) =>
  `${getErpListFilterPillClass(enabled)
    .replace('rounded-xl', '!rounded-full')
    .replace('text-slate-700', 'text-slate-900')} disabled:opacity-100 disabled:border-slate-200 disabled:bg-white disabled:text-slate-900`;

export const getErpListBatchDeletePillStyle = (enabled: boolean) =>
  enabled
    ? {
        ...getErpListFilterPillStyle(true),
        borderRadius: '9999px',
      }
    : {
        borderRadius: '9999px',
      };

export const ERP_LIST_TOOL_PILL_CLASS =
  'h-8 shrink-0 whitespace-nowrap !rounded-full border border-slate-200 bg-white px-3 text-[12px] font-semibold leading-[1.35] text-slate-900 shadow-sm hover:bg-slate-50';

export const ERP_LIST_PRIMARY_PILL_CLASS =
  'h-8 shrink-0 whitespace-nowrap !rounded-full bg-slate-900 px-3 text-[12px] font-semibold leading-[1.35] text-white shadow-sm hover:bg-slate-800';

export const ERP_LIST_PILL_STYLE = {
  borderRadius: '9999px',
} as const;
