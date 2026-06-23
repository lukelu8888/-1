import React, { useEffect, useMemo, useState } from 'react';
import { Eye, FileText, LoaderCircle, PencilLine, Plus, ScanSearch, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { payableRecords, paymentExecutionRecords, workbenchStats } from '../data/financeV2MockData';
import { loadFinanceV2Payables, loadFinanceV2Payments, saveFinanceV2Payables, saveFinanceV2Payments } from '../data/financeV2FinanceStorage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { scanPaymentSlip, type PaymentSlipScanExtracted } from '../../../lib/services/paymentSlipRecognizerService';
import type { PaymentExecutionRecord, WorkbenchStatItem } from '../types/financeV2';

type PayablesSubTab = 'business_ledger' | 'management_ledger' | 'payments';
type PayableRecordFormState = {
  scope: 'business' | 'management';
  apNo: string;
  vendor: string;
  sourceDoc: string;
  openAmount: string;
  currency: string;
  dueDate: string;
  status: string;
  subject: string;
  department: string;
  costCenter: string;
  region: 'NA' | 'EA' | 'SA';
};

const managementExpenseSubjects = [
  '工资薪酬',
  '社保公积金',
  '办公室租金',
  '办公室维护',
  '办公设备采购',
  '办公设备维护',
  '电费',
  '饮用水费',
  '团建费用',
  '奖金福利',
  '差旅费',
  '招待费',
  '其他管理费用',
];

type PaymentRecordFormState = {
  expenseScope: 'business' | 'management';
  expenseSubject: string;
  department: string;
  costCenter: string;
  expensePeriod: string;
  fkNo: string;
  apNo: string;
  payee: string;
  payeeType: PaymentExecutionRecord['payeeType'];
  amount: string;
  currency: string;
  region: PaymentExecutionRecord['region'];
  paidAt: string;
  method: string;
  bankRef: string;
  bankName: string;
  accountMask: string;
  status: string;
  operator: string;
  remarks: string;
  slipFileName: string;
};

function getPaymentTypeLabel(type: string) {
  switch (type) {
    case 'supplier':
      return '供应商货款';
    case 'customs':
      return '报关服务';
    case 'inspection':
      return '验货服务';
    case 'forwarder':
      return '货代物流';
    default:
      return '其他服务';
  }
}

function getRegionLabel(region: string) {
  switch (region) {
    case 'NA':
      return '北美';
    case 'EA':
      return '欧非';
    case 'SA':
      return '南美';
    default:
      return region;
  }
}

function getStatusTone(status: string) {
  if (status === '已完成') return 'text-slate-800';
  if (status === '待确认') return 'text-slate-800';
  if (status === '失败') return 'text-slate-800';
  return 'text-slate-700';
}

function formatDateTimeForInput(value: string) {
  return value.includes(' ') ? value.replace(' ', 'T').slice(0, 16) : value;
}

function formatDateTimeForRecord(value: string) {
  return value.includes('T') ? value.replace('T', ' ') : value;
}

function formatNowForInput() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function maskAccountNumber(value: string | null | undefined) {
  const digits = String(value || '').replace(/\s+/g, '');
  if (!digits) return '';
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} **** ${digits.slice(-4)}`;
}

function normalizeMethod(value: string | null | undefined) {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'TT' || raw === 'T/T' || raw.includes('电汇')) return 'T/T';
  if (raw === 'LC' || raw === 'L/C' || raw.includes('信用证')) return 'L/C';
  if (raw === 'CASH') return 'CASH';
  if (raw === 'CHEQUE') return 'CHEQUE';
  return raw;
}

function generateFkNo(region: PaymentExecutionRecord['region'], existingRecords: PaymentExecutionRecord[]) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `FK-${region}-${yy}${mm}${dd}-`;
  const sameDayCount = existingRecords.filter((item) => item.fkNo.startsWith(prefix)).length + 1;
  return `${prefix}${String(sameDayCount).padStart(4, '0')}`;
}

function buildPaymentForm(existingRecords: PaymentExecutionRecord[]): PaymentRecordFormState {
  return {
    expenseScope: 'business',
    expenseSubject: '',
    department: '财务部',
    costCenter: '',
    expensePeriod: '',
    fkNo: generateFkNo('NA', existingRecords),
    apNo: '',
    payee: '',
    payeeType: 'supplier',
    amount: '',
    currency: 'USD',
    region: 'NA',
    paidAt: formatNowForInput(),
    method: 'T/T',
    bankRef: '',
    bankName: '',
    accountMask: '',
    status: '待确认',
    operator: '赵敏',
    remarks: '',
    slipFileName: '',
  };
}

function generateApNo(scope: 'business' | 'management', existingRecords: { apNo: string }[]) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const regionToken = scope === 'management' ? 'MG' : 'NA';
  const prefix = `YF-${regionToken}-${yy}${mm}${dd}-`;
  const sameDayCount = existingRecords.filter((item) => item.apNo.startsWith(prefix)).length + 1;
  return `${prefix}${String(sameDayCount).padStart(4, '0')}`;
}

function buildPayableForm(existingRecords: { apNo: string }[], scope: 'business' | 'management'): PayableRecordFormState {
  return {
    scope,
    apNo: generateApNo(scope, existingRecords),
    vendor: '',
    sourceDoc: '',
    openAmount: '',
    currency: scope === 'management' ? 'CNY' : 'USD',
    dueDate: new Date().toISOString().slice(0, 10),
    status: '待付款',
    subject: '',
    department: scope === 'management' ? '财务部' : '',
    costCenter: '',
    region: 'NA',
  };
}

function SummaryStrip({ items }: { items: WorkbenchStatItem[] }) {
  return (
    <div className="border border-slate-300 bg-slate-100 px-3 py-2">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const accentClass =
            item.tone === 'warn'
              ? 'border-amber-300'
              : item.tone === 'danger'
                ? 'border-slate-300'
                : 'border-slate-300';

          return (
            <div key={item.id} className={`bg-white px-3 py-2.5 border ${accentClass}`}>
              <div className="text-[12px] font-semibold leading-[1.35] text-slate-700">{item.label}</div>
              <div className="mt-1 text-[15px] font-semibold leading-[1.35] tabular-nums text-slate-900 sm:text-[16px]">
                {item.value}
              </div>
              {item.sub ? (
                <div className="mt-1 text-[11px] leading-[1.35] tabular-nums text-slate-500">{item.sub}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PayablesModule() {
  const [sub, setSub] = useState<PayablesSubTab>('business_ledger');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [payableRecordsState, setPayableRecordsState] = useState(() => loadFinanceV2Payables());
  const [paymentRecords, setPaymentRecords] = useState(() => loadFinanceV2Payments());
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentRecordFormState>(() => buildPaymentForm(paymentExecutionRecords));
  const [createPayableOpen, setCreatePayableOpen] = useState(false);
  const [payableForm, setPayableForm] = useState<PayableRecordFormState>(() => buildPayableForm(payableRecords, 'business'));
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [scanBusy, setScanBusy] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<File | null>(null);

  useEffect(() => {
    saveFinanceV2Payables(payableRecordsState);
  }, [payableRecordsState]);

  useEffect(() => {
    saveFinanceV2Payments(paymentRecords);
  }, [paymentRecords]);

  const businessPayables = useMemo(
    () => payableRecordsState.filter((record) => record.scope === 'business'),
    [payableRecordsState],
  );

  const managementPayables = useMemo(
    () => payableRecordsState.filter((record) => record.scope === 'management'),
    [payableRecordsState],
  );

  const businessLedgerStats = useMemo<WorkbenchStatItem[]>(() => {
    const totalOpen = businessPayables.reduce((sum, item) => sum + item.openAmount, 0);
    const dueSoon = businessPayables.filter((item) => item.status !== '已完成').length;
    return [
      { id: 'bp1', label: '业务应付敞口', value: `USD ${totalOpen.toLocaleString()}`, sub: `${businessPayables.length} 笔`, tone: 'default' },
      { id: 'bp2', label: '业务待付款', value: `${dueSoon}`, sub: '笔', tone: 'warn' },
    ];
  }, [businessPayables]);

  const managementLedgerStats = useMemo<WorkbenchStatItem[]>(() => {
    const totalOpen = managementPayables.reduce((sum, item) => sum + item.openAmount, 0);
    const hrAdmin = managementPayables.filter((item) => item.department).length;
    return [
      { id: 'mp1', label: '管理应付敞口', value: `CNY ${totalOpen.toLocaleString()}`, sub: `${managementPayables.length} 笔`, tone: 'default' },
      { id: 'mp2', label: '管理费用承接', value: `${hrAdmin}`, sub: '部门待处理', tone: 'warn' },
    ];
  }, [managementPayables]);

  const paymentStats = useMemo<WorkbenchStatItem[]>(() => {
    const total = paymentRecords.reduce((sum, item) => sum + item.amount, 0);
    const completedItems = paymentRecords.filter((item) => item.status === '已完成');
    const pendingItems = paymentRecords.filter((item) => item.status === '待确认');
    const completed = completedItems.reduce((sum, item) => sum + item.amount, 0);
    const pending = pendingItems.reduce((sum, item) => sum + item.amount, 0);

    return [
      {
        id: 'payment-total',
        label: '付款总额',
        value: `USD ${total.toLocaleString()}`,
        sub: `${paymentRecords.length} 笔`,
        tone: 'default',
      },
      {
        id: 'payment-completed',
        label: '已完成付款',
        value: `USD ${completed.toLocaleString()}`,
        sub: `${completedItems.length} 笔`,
        tone: 'ok',
      },
      {
        id: 'payment-pending',
        label: '待确认付款',
        value: `USD ${pending.toLocaleString()}`,
        sub: `${pendingItems.length} 笔`,
        tone: 'warn',
      },
      {
        id: 'payment-count',
        label: '付款笔数',
        value: `${paymentRecords.length}`,
        sub: '对外付款流水',
        tone: 'default',
      },
    ];
  }, [paymentRecords]);

  const filteredPayments = useMemo(() => {
    return paymentRecords.filter((record) => {
      const keyword = search.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        record.fkNo.toLowerCase().includes(keyword) ||
        record.apNo.toLowerCase().includes(keyword) ||
        record.payee.toLowerCase().includes(keyword) ||
        record.bankRef.toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesType = typeFilter === 'all' || record.payeeType === typeFilter;
      const matchesMethod = methodFilter === 'all' || record.method === methodFilter;
      const matchesRegion = regionFilter === 'all' || record.region === regionFilter;

      return matchesKeyword && matchesStatus && matchesType && matchesMethod && matchesRegion;
    });
  }, [methodFilter, paymentRecords, regionFilter, search, statusFilter, typeFilter]);

  const paymentFilterExtra = (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-10 w-[120px] border-slate-300 text-[13px] font-semibold leading-[1.35] text-slate-700">
          <SelectValue placeholder="全部状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="已完成">已完成</SelectItem>
          <SelectItem value="待确认">待确认</SelectItem>
          <SelectItem value="失败">失败</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="h-10 w-[120px] border-slate-300 text-[13px] font-semibold leading-[1.35] text-slate-700">
          <SelectValue placeholder="全部类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部类型</SelectItem>
          <SelectItem value="supplier">供应商货款</SelectItem>
          <SelectItem value="customs">报关服务</SelectItem>
          <SelectItem value="inspection">验货服务</SelectItem>
          <SelectItem value="forwarder">货代物流</SelectItem>
          <SelectItem value="other_service">其他服务</SelectItem>
        </SelectContent>
      </Select>
      <Select value={methodFilter} onValueChange={setMethodFilter}>
        <SelectTrigger className="h-10 w-[110px] border-slate-300 text-[13px] font-semibold leading-[1.35] text-slate-700">
          <SelectValue placeholder="全部方式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部方式</SelectItem>
          <SelectItem value="T/T">T/T</SelectItem>
          <SelectItem value="L/C">L/C</SelectItem>
          <SelectItem value="CASH">CASH</SelectItem>
          <SelectItem value="CHEQUE">CHEQUE</SelectItem>
          <SelectItem value="OTHER">OTHER</SelectItem>
        </SelectContent>
      </Select>
      <Select value={regionFilter} onValueChange={setRegionFilter}>
        <SelectTrigger className="h-10 w-[110px] border-slate-300 text-[13px] font-semibold leading-[1.35] text-slate-700">
          <SelectValue placeholder="全部区域" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部区域</SelectItem>
          <SelectItem value="NA">北美</SelectItem>
          <SelectItem value="EA">欧非</SelectItem>
          <SelectItem value="SA">南美</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const resetPaymentForm = () => {
    setPaymentForm(buildPaymentForm(paymentRecords));
    setSelectedSlip(null);
    setScanWarnings([]);
  };

  const resetPayableForm = (scope: 'business' | 'management') => {
    setPayableForm(buildPayableForm(payableRecordsState, scope));
  };

  const openCreateDialog = () => {
    resetPaymentForm();
    setCreateOpen(true);
  };

  const openCreatePayableDialog = (scope: 'business' | 'management') => {
    resetPayableForm(scope);
    setCreatePayableOpen(true);
  };

  const updateFormField = <K extends keyof PaymentRecordFormState>(field: K, value: PaymentRecordFormState[K]) => {
    setPaymentForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'region') {
        next.fkNo = generateFkNo(value as PaymentExecutionRecord['region'], paymentRecords);
      }
      return next;
    });
  };

  const applyScanToForm = (extracted: PaymentSlipScanExtracted, fileName: string) => {
    setPaymentForm((current) => ({
      ...current,
      payee: extracted.payee || current.payee,
      amount: extracted.amount != null ? String(extracted.amount) : current.amount,
      currency: extracted.currency || current.currency,
      paidAt: extracted.paidAt ? formatDateTimeForInput(extracted.paidAt) : current.paidAt,
      method: normalizeMethod(extracted.method) || current.method,
      bankRef: extracted.bankRef || current.bankRef,
      bankName: extracted.bankName || current.bankName,
      accountMask: extracted.accountNumber ? maskAccountNumber(extracted.accountNumber) : current.accountMask,
      remarks: extracted.remarks
        ? current.remarks.includes(extracted.remarks)
          ? current.remarks
          : [current.remarks, extracted.remarks].filter(Boolean).join('\n')
        : current.remarks,
      slipFileName: fileName,
    }));
    setScanWarnings(extracted.warnings);
  };

  const handleSlipSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    setSelectedSlip(nextFile);
    setPaymentForm((current) => ({
      ...current,
      slipFileName: nextFile?.name || '',
    }));
    setScanWarnings([]);
  };

  const handleScanSlip = async () => {
    if (!selectedSlip) {
      toast.error('请先上传付款水单');
      return;
    }

    try {
      setScanBusy(true);
      const result = await scanPaymentSlip(selectedSlip);
      applyScanToForm(result.extracted, result.fileName);
      toast.success('付款水单已识别，相关字段已预填');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '付款水单识别失败');
    } finally {
      setScanBusy(false);
    }
  };

  const handleCreatePayment = () => {
    if (!paymentForm.expenseSubject.trim()) {
      toast.error(`请选择${paymentForm.expenseScope === 'management' ? '管理费用科目' : '费用科目'}`);
      return;
    }

    if (paymentForm.expenseScope === 'management' && !paymentForm.department.trim()) {
      toast.error('请填写费用部门');
      return;
    }

    if (!paymentForm.payee.trim()) {
      toast.error('请填写收款方');
      return;
    }

    if (!paymentForm.amount.trim() || Number.isNaN(Number(paymentForm.amount))) {
      toast.error('请填写有效的付款金额');
      return;
    }

    if (!paymentForm.paidAt.trim()) {
      toast.error('请填写付款时间');
      return;
    }

    const nextRecord: PaymentExecutionRecord = {
      id: `payment-${Date.now()}`,
      fkNo: paymentForm.fkNo.trim(),
      apNo:
        paymentForm.expenseScope === 'management'
          ? `管理费用/${paymentForm.expenseSubject.trim()}`
          : paymentForm.apNo.trim() || '待关联',
      payee: paymentForm.payee.trim(),
      payeeType: paymentForm.expenseScope === 'management' ? 'other_service' : paymentForm.payeeType,
      amount: Number(paymentForm.amount),
      currency: paymentForm.currency.trim().toUpperCase() || 'USD',
      region: paymentForm.region,
      paidAt: formatDateTimeForRecord(paymentForm.paidAt),
      method: normalizeMethod(paymentForm.method) || 'T/T',
      bankRef: paymentForm.bankRef.trim(),
      bankName: paymentForm.bankName.trim() || '待补录银行',
      accountMask: paymentForm.accountMask.trim() || '待补录账号',
      status: paymentForm.status.trim() || '待确认',
      operator: paymentForm.operator.trim() || '财务',
    };

    setPaymentRecords((current) => [nextRecord, ...current]);
    setCreateOpen(false);
    resetPaymentForm();
    toast.success('付款记录已新增');
  };

  const handleCreatePayable = () => {
    if (!payableForm.subject.trim()) {
      toast.error(`请填写${payableForm.scope === 'management' ? '管理费用科目' : '费用科目'}`);
      return;
    }
    if (!payableForm.vendor.trim()) {
      toast.error('请填写往来单位');
      return;
    }
    if (!payableForm.openAmount.trim() || Number.isNaN(Number(payableForm.openAmount))) {
      toast.error('请填写有效的应付金额');
      return;
    }
    if (payableForm.scope === 'management' && !payableForm.department.trim()) {
      toast.error('请填写费用部门');
      return;
    }

    const nextRecord = {
      id: `payable-${Date.now()}`,
      apNo: payableForm.apNo.trim(),
      scope: payableForm.scope,
      vendor: payableForm.vendor.trim(),
      sourceDoc:
        payableForm.scope === 'management'
          ? `${payableForm.sourceDoc.trim() || '管理费用单'} / ${payableForm.costCenter.trim() || '成本中心待补'}`
          : payableForm.sourceDoc.trim() || '业务单据待补',
      openAmount: Number(payableForm.openAmount),
      currency: payableForm.currency.trim().toUpperCase(),
      dueDate: payableForm.dueDate,
      status: payableForm.status.trim() || '待付款',
      subject: payableForm.subject.trim(),
      department: payableForm.department.trim() || undefined,
      costCenter: payableForm.costCenter.trim() || undefined,
      region: payableForm.scope === 'business' ? payableForm.region : undefined,
    };

    setPayableRecordsState((current) => [nextRecord, ...current]);
    setCreatePayableOpen(false);
    resetPayableForm(payableForm.scope);
    toast.success(payableForm.scope === 'management' ? '管理类应付已新增' : '业务类应付已新增');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="px-2 pb-2 pt-1.5">
        <SummaryStrip
          items={
            sub === 'business_ledger'
              ? businessLedgerStats
              : sub === 'management_ledger'
                ? managementLedgerStats
                : paymentStats
          }
        />
        <div className="mt-1.5 flex flex-wrap gap-0.5 border border-slate-300 bg-slate-200 p-0.5">
          <button
            type="button"
            onClick={() => setSub('business_ledger')}
            className={`rounded-md px-3 py-1.5 text-[12px] font-semibold leading-[1.4] ${
              sub === 'business_ledger'
                ? 'border border-slate-300 bg-white text-slate-900 shadow-sm'
                : 'border border-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70'
            }`}
          >
            业务应付
          </button>
          <button
            type="button"
            onClick={() => setSub('management_ledger')}
            className={`rounded-md px-3 py-1.5 text-[12px] font-semibold leading-[1.4] ${
              sub === 'management_ledger'
                ? 'border border-slate-300 bg-white text-slate-900 shadow-sm'
                : 'border border-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70'
            }`}
          >
            管理应付
          </button>
          <button
            type="button"
            onClick={() => setSub('payments')}
            className={`rounded-md px-3 py-1.5 text-[12px] font-semibold leading-[1.4] ${
              sub === 'payments'
                ? 'border border-slate-300 bg-white text-slate-900 shadow-sm'
                : 'border border-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70'
            }`}
          >
            付款记录
          </button>
        </div>
        {sub === 'payments' ? (
          <div className="mt-1.5 flex items-center justify-between border border-slate-300 bg-slate-50 px-3 py-2">
            <div className="text-[12px] font-semibold text-slate-600">
              手动录入付款记录，支持上传付款水单后自动识别并预填表单。
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-8 border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700"
              onClick={openCreateDialog}
            >
              <Plus className="h-4 w-4" />
              新增付款
            </Button>
          </div>
        ) : (
          <div className="mt-1.5 flex items-center justify-between border border-slate-300 bg-slate-50 px-3 py-2">
            <div className="text-[12px] font-semibold text-slate-600">
              {sub === 'management_ledger'
                ? '管理费用应付由统一入口自动分发承接，也支持末级模块直接录入。'
                : '业务类应付承接采购、物流、报关、验货等对外应付，也支持直接录入。'}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-8 border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700"
              onClick={() => openCreatePayableDialog(sub === 'management_ledger' ? 'management' : 'business')}
            >
              <Plus className="h-4 w-4" />
              {sub === 'management_ledger' ? '新增管理应付' : '新增业务应付'}
            </Button>
          </div>
        )}
        <div className="mt-1.5">
          <FinanceFilterBar
            placeholder={sub === 'payments' ? '付款号 / 收款方 / 应付号 / 银行流水…' : '应付号 / 往来单位 / 科目…'}
            value={sub === 'payments' ? search : undefined}
            onChange={sub === 'payments' ? setSearch : undefined}
            onReset={
              sub === 'payments'
                ? () => {
                    setSearch('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setMethodFilter('all');
                    setRegionFilter('all');
                  }
                : undefined
            }
            extra={sub === 'payments' ? paymentFilterExtra : undefined}
          />
        </div>
        <div className="mt-1.5 overflow-auto border border-slate-300 bg-white">
          {sub === 'business_ledger' ? (
            <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">应付号</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">往来单位</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">费用科目</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">来源单</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">未付</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">到期日</th>
                  <th className="px-2 py-2.5 font-semibold">状态</th>
                </tr>
              </thead>
              <tbody>
                {businessPayables.map((r) => (
                  <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{r.apNo}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.vendor}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.subject || '—'}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{r.sourceDoc}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">
                      {r.openAmount.toLocaleString()} {r.currency}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{r.dueDate}</td>
                    <td className="px-2 py-2.5 font-semibold text-slate-700">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : sub === 'management_ledger' ? (
            <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">应付号</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">收款方</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">管理费用科目</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">费用部门</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">成本中心</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">未付</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">到期日</th>
                  <th className="px-2 py-2.5 font-semibold">状态</th>
                </tr>
              </thead>
              <tbody>
                {managementPayables.map((r) => (
                  <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{r.apNo}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.vendor}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.subject || '—'}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.department || '—'}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{r.costCenter || '—'}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">
                      {r.openAmount.toLocaleString()} {r.currency}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums">{r.dueDate}</td>
                    <td className="px-2 py-2.5 font-semibold text-slate-700">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">付款号</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">收款方</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">关联应付</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">付款金额</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">付款方式</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">银行 / 账户</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">付款日期</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">状态</th>
                  <th className="px-2 py-2.5 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((r) => (
                  <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                      <div className="font-mono font-semibold text-slate-900">{r.fkNo}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{getRegionLabel(r.region)}</div>
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                      <div className="font-semibold text-slate-800">{r.payee}</div>
                      <div className="mt-0.5 inline-flex border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                        {getPaymentTypeLabel(r.payeeType)}
                      </div>
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                      <div className="font-mono font-semibold text-slate-800">{r.apNo}</div>
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                      <div className="font-mono text-[11px] text-slate-500">{r.currency}</div>
                      <div className="font-mono text-[16px] font-semibold tabular-nums text-slate-900">{r.amount.toLocaleString()}</div>
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                      <div className="inline-flex border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700">
                        {r.method}
                      </div>
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                      <div className="font-semibold text-slate-700">{r.bankName}</div>
                      <div className="text-[11px] text-slate-500">{r.accountMask}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {r.bankRef || '待补录流水号'}
                      </div>
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                      <div className="font-mono text-slate-800">{r.paidAt}</div>
                      {r.operator ? <div className="mt-0.5 text-[11px] text-slate-500">{r.operator}</div> : null}
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 align-top">
                      <span className={`inline-flex border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold ${getStatusTone(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 align-top">
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600">
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-[13px] font-semibold text-slate-500">
                      当前筛选条件下暂无付款记录。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl border-slate-300 bg-slate-50 p-0">
          <DialogHeader className="border-b border-slate-300 bg-white px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-900">新增付款记录</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              支持上传付款水单自动识别，系统会先预填表单，最终仍由财务人工确认后保存。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="border border-slate-300 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">付款水单上传</div>
                  <div className="mt-1 text-[12px] text-slate-500">当前支持 JPG、PNG、WebP；识别后会自动回填收款方、金额、日期、银行等字段。</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-white">
                    <Upload className="h-4 w-4" />
                    上传水单
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleSlipSelected} />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-slate-300 bg-white text-[12px] font-semibold text-slate-700"
                    onClick={handleScanSlip}
                    disabled={!selectedSlip || scanBusy}
                  >
                    {scanBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                    上传并识别
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
                <span className="font-semibold">已选文件:</span>
                <span>{paymentForm.slipFileName || '未上传'}</span>
              </div>
              {scanWarnings.length > 0 ? (
                <div className="mt-3 border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
                  <div className="font-semibold">识别提醒</div>
                  {scanWarnings.map((warning, index) => (
                    <div key={`${warning}-${index}`}>{warning}</div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>费用归属</Label>
                <Select value={paymentForm.expenseScope} onValueChange={(value) => updateFormField('expenseScope', value as PaymentRecordFormState['expenseScope'])}>
                  <SelectTrigger className="border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">业务费用</SelectItem>
                    <SelectItem value="management">管理费用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{paymentForm.expenseScope === 'management' ? '管理费用科目' : '费用科目'}</Label>
                {paymentForm.expenseScope === 'management' ? (
                  <Select value={paymentForm.expenseSubject} onValueChange={(value) => updateFormField('expenseSubject', value)}>
                    <SelectTrigger className="border-slate-300 bg-white">
                      <SelectValue placeholder="选择管理费用科目" />
                    </SelectTrigger>
                    <SelectContent>
                      {managementExpenseSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={paymentForm.expenseSubject}
                    onChange={(event) => updateFormField('expenseSubject', event.target.value)}
                    className="border-slate-300 bg-white"
                    placeholder="如：采购货款、海运费、报关费"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fkNo">付款号</Label>
                <Input id="fkNo" value={paymentForm.fkNo} onChange={(event) => updateFormField('fkNo', event.target.value)} className="border-slate-300 bg-white" />
              </div>
              {paymentForm.expenseScope === 'business' ? (
                <div className="space-y-2">
                  <Label htmlFor="apNo">关联应付</Label>
                  <Input id="apNo" value={paymentForm.apNo} onChange={(event) => updateFormField('apNo', event.target.value)} className="border-slate-300 bg-white" placeholder="YF-NA-260322-0007" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="department">费用部门</Label>
                  <Input id="department" value={paymentForm.department} onChange={(event) => updateFormField('department', event.target.value)} className="border-slate-300 bg-white" placeholder="财务部 / 行政部 / 总经办" />
                </div>
              )}
              {paymentForm.expenseScope === 'business' ? (
                <div className="space-y-2">
                  <Label>区域</Label>
                  <Select value={paymentForm.region} onValueChange={(value) => updateFormField('region', value as PaymentExecutionRecord['region'])}>
                    <SelectTrigger className="border-slate-300 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NA">北美</SelectItem>
                      <SelectItem value="EA">欧非</SelectItem>
                      <SelectItem value="SA">南美</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="costCenter">成本中心</Label>
                  <Input id="costCenter" value={paymentForm.costCenter} onChange={(event) => updateFormField('costCenter', event.target.value)} className="border-slate-300 bg-white" placeholder="行政中心 / 总部共享 / 财务中心" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="paidAt">付款时间</Label>
                <Input id="paidAt" type="datetime-local" value={paymentForm.paidAt} onChange={(event) => updateFormField('paidAt', event.target.value)} className="border-slate-300 bg-white" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="payee">收款方</Label>
                <Input id="payee" value={paymentForm.payee} onChange={(event) => updateFormField('payee', event.target.value)} className="border-slate-300 bg-white" />
              </div>
              {paymentForm.expenseScope === 'business' ? (
                <div className="space-y-2">
                  <Label>付款类型</Label>
                  <Select value={paymentForm.payeeType} onValueChange={(value) => updateFormField('payeeType', value as PaymentExecutionRecord['payeeType'])}>
                    <SelectTrigger className="border-slate-300 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">供应商货款</SelectItem>
                      <SelectItem value="customs">报关服务</SelectItem>
                      <SelectItem value="inspection">验货服务</SelectItem>
                      <SelectItem value="forwarder">货代物流</SelectItem>
                      <SelectItem value="other_service">其他服务</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="expensePeriod">费用期间</Label>
                  <Input id="expensePeriod" value={paymentForm.expensePeriod} onChange={(event) => updateFormField('expensePeriod', event.target.value)} className="border-slate-300 bg-white" placeholder="2026-04 / 2026Q2" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="operator">录入人</Label>
                <Input id="operator" value={paymentForm.operator} onChange={(event) => updateFormField('operator', event.target.value)} className="border-slate-300 bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">付款金额</Label>
                <Input id="amount" value={paymentForm.amount} onChange={(event) => updateFormField('amount', event.target.value)} className="border-slate-300 bg-white" placeholder="20000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">币种</Label>
                <Select value={paymentForm.currency} onValueChange={(value) => updateFormField('currency', value)}>
                  <SelectTrigger id="currency" className="border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="HKD">HKD</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">付款方式</Label>
                <Input id="method" value={paymentForm.method} onChange={(event) => updateFormField('method', event.target.value.toUpperCase())} className="border-slate-300 bg-white" placeholder="T/T" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Input id="status" value={paymentForm.status} onChange={(event) => updateFormField('status', event.target.value)} className="border-slate-300 bg-white" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bankName">银行名称</Label>
                <Input id="bankName" value={paymentForm.bankName} onChange={(event) => updateFormField('bankName', event.target.value)} className="border-slate-300 bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountMask">银行账户</Label>
                <Input id="accountMask" value={paymentForm.accountMask} onChange={(event) => updateFormField('accountMask', event.target.value)} className="border-slate-300 bg-white" placeholder="6214 **** 8821" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankRef">流水号 / 回单号</Label>
                <Input id="bankRef" value={paymentForm.bankRef} onChange={(event) => updateFormField('bankRef', event.target.value)} className="border-slate-300 bg-white" />
              </div>
            </div>

            <div className="border border-slate-300 bg-white p-4">
              <div className="space-y-2">
                <Label htmlFor="remarks">备注</Label>
                <Textarea
                  id="remarks"
                  value={paymentForm.remarks}
                  onChange={(event) => updateFormField('remarks', event.target.value)}
                  className="min-h-[88px] border-slate-300 bg-white"
                  placeholder="可补充识别未覆盖的信息，例如用途、备注、复核说明。"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-300 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 bg-white text-slate-700"
              onClick={() => {
                setCreateOpen(false);
                resetPaymentForm();
              }}
            >
              取消
            </Button>
            <Button type="button" className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleCreatePayment}>
              保存付款记录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createPayableOpen} onOpenChange={setCreatePayableOpen}>
        <DialogContent className="max-w-3xl border-slate-300 bg-slate-50 p-0">
          <DialogHeader className="border-b border-slate-300 bg-white px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {payableForm.scope === 'management' ? '新增管理类应付' : '新增业务类应付'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {payableForm.scope === 'management'
                ? '管理费用末级模块也支持直接录入，后续由付款记录与银行流水继续承接。'
                : '业务类应付支持采购、物流、报关、验货等业务型应付的直接录入。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>费用归属</Label>
                <Select value={payableForm.scope} onValueChange={(value) => setPayableForm(buildPayableForm(payableRecordsState, value as 'business' | 'management'))}>
                  <SelectTrigger className="border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">业务费用</SelectItem>
                    <SelectItem value="management">管理费用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{payableForm.scope === 'management' ? '管理费用科目' : '费用科目'}</Label>
                {payableForm.scope === 'management' ? (
                  <Select value={payableForm.subject} onValueChange={(value) => setPayableForm((current) => ({ ...current, subject: value }))}>
                    <SelectTrigger className="border-slate-300 bg-white">
                      <SelectValue placeholder="选择管理费用科目" />
                    </SelectTrigger>
                    <SelectContent>
                      {managementExpenseSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={payableForm.subject} onChange={(event) => setPayableForm((current) => ({ ...current, subject: event.target.value }))} className="border-slate-300 bg-white" placeholder="如：采购货款、海运费、报关费" />
                )}
              </div>
              <div className="space-y-2">
                <Label>应付号</Label>
                <Input value={payableForm.apNo} onChange={(event) => setPayableForm((current) => ({ ...current, apNo: event.target.value }))} className="border-slate-300 bg-white" />
              </div>
              <div className="space-y-2">
                <Label>到期日</Label>
                <Input type="date" value={payableForm.dueDate} onChange={(event) => setPayableForm((current) => ({ ...current, dueDate: event.target.value }))} className="border-slate-300 bg-white" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>往来单位</Label>
                <Input value={payableForm.vendor} onChange={(event) => setPayableForm((current) => ({ ...current, vendor: event.target.value }))} className="border-slate-300 bg-white" />
              </div>
              {payableForm.scope === 'business' ? (
                <div className="space-y-2">
                  <Label>区域</Label>
                  <Select value={payableForm.region} onValueChange={(value) => setPayableForm((current) => ({ ...current, region: value as 'NA' | 'EA' | 'SA' }))}>
                    <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NA">北美</SelectItem>
                      <SelectItem value="EA">欧非</SelectItem>
                      <SelectItem value="SA">南美</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>费用部门</Label>
                  <Input value={payableForm.department} onChange={(event) => setPayableForm((current) => ({ ...current, department: event.target.value }))} className="border-slate-300 bg-white" />
                </div>
              )}
              {payableForm.scope === 'business' ? (
                <div className="space-y-2">
                  <Label>来源单</Label>
                  <Input value={payableForm.sourceDoc} onChange={(event) => setPayableForm((current) => ({ ...current, sourceDoc: event.target.value }))} className="border-slate-300 bg-white" placeholder="CG / SHIP / INS 单号" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>成本中心</Label>
                  <Input value={payableForm.costCenter} onChange={(event) => setPayableForm((current) => ({ ...current, costCenter: event.target.value }))} className="border-slate-300 bg-white" />
                </div>
              )}
              <div className="space-y-2">
                <Label>应付金额</Label>
                <Input value={payableForm.openAmount} onChange={(event) => setPayableForm((current) => ({ ...current, openAmount: event.target.value }))} className="border-slate-300 bg-white" />
              </div>
              <div className="space-y-2">
                <Label>币种</Label>
                <Select value={payableForm.currency} onValueChange={(value) => setPayableForm((current) => ({ ...current, currency: value }))}>
                  <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="HKD">HKD</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Input value={payableForm.status} onChange={(event) => setPayableForm((current) => ({ ...current, status: event.target.value }))} className="border-slate-300 bg-white" />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-300 bg-white px-6 py-4">
            <Button type="button" variant="outline" className="border-slate-300 bg-white text-slate-700" onClick={() => setCreatePayableOpen(false)}>
              取消
            </Button>
            <Button type="button" className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleCreatePayable}>
              保存应付
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
