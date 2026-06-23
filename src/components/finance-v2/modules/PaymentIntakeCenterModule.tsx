import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, LoaderCircle, Mic, PenLine, Plus, ScanSearch, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../../ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { FinanceStatStrip } from '../components/FinanceStatStrip';
import { loadFinanceV2Intake, loadFinanceV2Payables, loadFinanceV2PayeeMasters, loadFinanceV2Payments, saveFinanceV2Intake, saveFinanceV2Payables, saveFinanceV2PayeeMasters, saveFinanceV2Payments } from '../data/financeV2FinanceStorage';
import {
  financeBusinessExpenseSubjects,
  financeManagementExpenseSubjects,
  getFinancePayeeApprovalStatusLabel,
  getFinancePayeeCategoryLabel,
  getFinancePayeeEntityTypeLabel,
  getFinancePayeePartySideLabel,
  type FinancePayeeApprovalStatus,
  type FinancePayeeEntityType,
  type FinancePayeeMasterRecord,
  type FinancePayeeCategory,
  type FinancePayeePartySide,
} from '../data/financePayeeMasterData';
import { scanPaymentSlip, type PaymentSlipScanExtracted } from '../../../lib/services/paymentSlipRecognizerService';
import { getSupplierMasterRequests, markSupplierMasterRequestFinanceNotified, upsertSupplierMasterRequest } from '../../../lib/supplier-store';
import type { PayableRecord, PaymentExecutionRecord, PaymentIntakeRecord, WorkbenchStatItem } from '../types/financeV2';

type IntakeTab = 'manual' | 'file' | 'ocr' | 'voice' | 'review' | 'dispatched' | 'master';
type PayeeMatchStatus = 'matched' | 'suspected' | 'unmatched';
type AssignmentLine = NonNullable<PaymentIntakeRecord['assignmentLine']>;
type AssignmentType = NonNullable<PaymentIntakeRecord['assignmentType']>;
type AllocationStatus = NonNullable<PaymentIntakeRecord['allocationStatus']>;

type IntakeFormState = {
  sourceMode: PaymentIntakeRecord['sourceMode'];
  expenseScope: PaymentIntakeRecord['expenseScope'];
  expenseSubject: string;
  selectedPayeeMasterId: string;
  payee: string;
  amount: string;
  currency: string;
  method: string;
  apNo: string;
  region: 'NA' | 'EA' | 'SA';
  department: string;
  costCenter: string;
  assignmentLine: AssignmentLine;
  assignmentType: AssignmentType;
  assignmentTarget: string;
  allocationStatus: AllocationStatus;
  expensePeriod: string;
  remarks: string;
  slipFileName: string;
  paidAt: string;
};

type PayeeMasterCreateState = {
  name: string;
  partySide: FinancePayeePartySide;
  entityType: FinancePayeeEntityType;
  category: FinancePayeeCategory;
  expenseScope: 'business' | 'management';
  expenseSubject: string;
  requiresRegion: boolean;
  department: string;
  costCenter: string;
  routingNote: string;
};

const financeDepartmentOptions = ['财务部', '行政部', '人力行政部', '采购部', '业务部'] as const;
const financeCostCenterOptions = ['财务中心', '行政中心', '人力中心', '采购中心', '总部共享'] as const;
const financePaymentMethodOptions = ['T/T', 'L/C', 'BANK', 'CASH'] as const;
const financeBusinessAttributionTypeOptions: AssignmentType[] = ['purchase_order', 'contract', 'project', 'customer', 'region', 'unassigned'];
const financeManagementAttributionTypeOptions: AssignmentType[] = ['department', 'cost_center', 'shared_pool', 'project', 'customer', 'unassigned'];
const supplierSideCategoryOptions: FinancePayeeCategory[] = ['supplier'];
const thirdPartyCategoryOptions: FinancePayeeCategory[] = [
  'trucking',
  'freight_forwarder',
  'inspection_authority',
  'customs_broker',
  'testing_agency',
  'inspection_service',
  'landlord',
  'property_management',
  'social_security',
  'housing_fund',
  'tax_authority',
  'air_ticket_service',
  'train_ticket_service',
  'hotel',
  'other',
];

const tabItems: { id: IntakeTab; label: string }[] = [
  { id: 'manual', label: '手动录入' },
  { id: 'file', label: '批量导入' },
  { id: 'ocr', label: '票据识别' },
  { id: 'voice', label: '语音录入' },
  { id: 'review', label: '待校对' },
  { id: 'dispatched', label: '已分发' },
  { id: 'master', label: '主档管理' },
];

function normalizePayeeName(value: string) {
  return value
    .replace(/^[\s:：;；,.，·•-]+/g, '')
    .replace(/收\s*款\s*(人|方|单\s*位)?\s*(名\s*称)?\s*[:：]?/g, '')
    .replace(/户\s*名\s*[:：]?/g, '')
    .replace(/^[\s:：;；,.，·•-]+/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function formatPayeeDisplayName(value: string) {
  return value
    .replace(/^[\s:：;；,.，·•-]+/g, '')
    .replace(/收\s*款\s*(人|方|单\s*位)?\s*(名\s*称)?\s*[:：]?/g, '')
    .replace(/户\s*名\s*[:：]?/g, '')
    .replace(/^[\s:：;；,.，·•-]+/g, '')
    .replace(/(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '')
    .trim();
}

function getMatchStatusLabel(status: PayeeMatchStatus) {
  switch (status) {
    case 'matched':
      return '已匹配';
    case 'suspected':
      return '疑似匹配';
    default:
      return '未匹配';
  }
}

function formatNow() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatDateTimeForRecord(value: string) {
  return value.includes('T') ? value.replace('T', ' ') : value;
}

function getRegionLabel(value: IntakeFormState['region']) {
  switch (value) {
    case 'EA':
      return '欧非';
    case 'SA':
      return '南美';
    default:
      return '北美';
  }
}

function getAssignmentLineLabel(value: AssignmentLine) {
  switch (value) {
    case 'management_line':
      return '管理主线';
    case 'shared_line':
      return '共享主线';
    default:
      return '业务主线';
  }
}

function getAssignmentTypeLabel(value: AssignmentType) {
  switch (value) {
    case 'customer':
      return '客户';
    case 'project':
      return '项目';
    case 'contract':
      return '合同';
    case 'sales_order':
      return '订单';
    case 'quotation':
      return '报价';
    case 'purchase_order':
      return '业务单据';
    case 'region':
      return '责任区域';
    case 'department':
      return '责任部门';
    case 'cost_center':
      return '成本中心';
    case 'shared_pool':
      return '共享池';
    default:
      return '待归属';
  }
}

function getAllocationStatusLabel(value: AllocationStatus) {
  switch (value) {
    case 'auto_assigned':
      return '自动判定';
    case 'manually_confirmed':
      return '人工确认';
    case 'assignment_exception':
      return '归属异常';
    default:
      return '待归属';
  }
}

function getDefaultAssignmentLine(scope: PaymentIntakeRecord['expenseScope'], costCenter = ''): AssignmentLine {
  if (costCenter === '总部共享') return 'shared_line';
  return scope === 'management' ? 'management_line' : 'business_line';
}

function getDefaultAssignmentType(scope: PaymentIntakeRecord['expenseScope'], costCenter = ''): AssignmentType {
  if (costCenter === '总部共享') return 'shared_pool';
  return scope === 'management' ? 'department' : 'region';
}

function getDefaultAssignmentTarget(scope: PaymentIntakeRecord['expenseScope'], region: IntakeFormState['region'], department: string, costCenter: string) {
  if (costCenter === '总部共享') return '总部共享池';
  return scope === 'management' ? department || costCenter || '待补充责任部门' : getRegionLabel(region);
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
  return raw;
}

function buildForm(sourceMode: PaymentIntakeRecord['sourceMode']): IntakeFormState {
  return {
    sourceMode,
    expenseScope: 'business',
    expenseSubject: '',
    selectedPayeeMasterId: '',
    payee: '',
    amount: '',
    currency: 'CNY',
    method: 'T/T',
    apNo: '',
    region: 'NA',
    department: '财务部',
    costCenter: '',
    assignmentLine: 'business_line',
    assignmentType: 'region',
    assignmentTarget: '北美',
    allocationStatus: 'pending_assignment',
    expensePeriod: '',
    remarks: '',
    slipFileName: '',
    paidAt: formatNow(),
  };
}

function buildPayeeMasterForm(): PayeeMasterCreateState {
  const defaults = getDefaultExpenseConfig('supplier');
  return {
    name: '',
    partySide: 'supplier',
    entityType: 'company',
    category: 'supplier',
    expenseScope: defaults.defaultScope,
    expenseSubject: defaults.defaultSubject,
    requiresRegion: defaults.requiresRegion,
    department: defaults.defaultDepartment,
    costCenter: defaults.defaultCostCenter,
    routingNote: defaults.routingNote,
  };
}

function makeIntakeNo(records: PaymentIntakeRecord[]) {
  const count = records.length + 1;
  return `INT-260406-${String(count).padStart(4, '0')}`;
}

function makeApNo(scope: 'business' | 'management', records: PayableRecord[]) {
  const prefix = scope === 'management' ? 'YF-MG-260406-' : 'YF-NA-260406-';
  const count = records.filter((record) => record.apNo.startsWith(prefix)).length + 1;
  return `${prefix}${String(count).padStart(4, '0')}`;
}

function makeFkNo(scope: 'business' | 'management', records: PaymentExecutionRecord[]) {
  const prefix = scope === 'management' ? 'FK-MG-260406-' : 'FK-NA-260406-';
  const count = records.filter((record) => record.fkNo.startsWith(prefix)).length + 1;
  return `${prefix}${String(count).padStart(4, '0')}`;
}

function getTargetModuleLabel(target: PaymentIntakeRecord['targetModule']) {
  return target === 'management_payables' ? '管理类应付账款' : '业务类应付账款';
}

function getReviewStatusLabel(status: PaymentIntakeRecord['reviewStatus']) {
  switch (status) {
    case 'pending_review':
      return '待校对';
    case 'ready_dispatch':
      return '待分发';
    default:
      return '已分发';
  }
}

function isFinanceMaintainedPartySide(partySide: FinancePayeePartySide) {
  return partySide === 'supplier' || partySide === 'third_party';
}

function getAvailableCategoryOptions(partySide: FinancePayeePartySide) {
  return partySide === 'supplier' ? supplierSideCategoryOptions : thirdPartyCategoryOptions;
}

function getDefaultCategoryByPartySide(partySide: FinancePayeePartySide): FinancePayeeCategory {
  return partySide === 'supplier' ? 'supplier' : 'freight_forwarder';
}

function getDefaultExpenseConfig(category: FinancePayeeCategory) {
  const businessCategories: FinancePayeeCategory[] = [
    'supplier',
    'trucking',
    'freight_forwarder',
    'inspection_authority',
    'customs_broker',
    'testing_agency',
    'inspection_service',
  ];
  const defaultScope = businessCategories.includes(category) ? 'business' : 'management';
  const defaultSubject =
    category === 'supplier'
      ? '采购货款'
      : category === 'trucking'
        ? '货代物流'
        : category === 'freight_forwarder'
        ? '货代物流'
        : category === 'inspection_authority'
          ? '报关费'
          : category === 'customs_broker'
            ? '报关费'
            : category === 'testing_agency'
              ? '验货费'
              : category === 'inspection_service'
                ? '验货费'
        : category === 'landlord'
          ? '办公室租金'
          : category === 'property_management'
            ? '物业费'
          : category === 'social_security'
            ? '社保'
            : category === 'medical_insurance'
              ? '社保'
              : category === 'housing_fund'
              ? '公积金'
              : category === 'tax_authority'
                ? '个税'
                : category === 'air_ticket_service'
                  ? '差旅费'
                  : category === 'train_ticket_service'
                    ? '差旅费'
                    : category === 'hotel'
                      ? '差旅费'
                : defaultScope === 'management'
                  ? '其他管理费用'
                  : '其他业务费用';

  const defaultDepartment =
    category === 'landlord' || category === 'property_management'
      ? '行政部'
      : category === 'social_security' || category === 'medical_insurance' || category === 'housing_fund'
        ? '人力行政部'
        : category === 'tax_authority'
          ? '财务部'
          : category === 'air_ticket_service' || category === 'train_ticket_service' || category === 'hotel'
            ? '行政部'
            : '';

  const defaultCostCenter =
    category === 'landlord' || category === 'property_management'
      ? '行政中心'
      : category === 'social_security' || category === 'medical_insurance' || category === 'housing_fund'
        ? '人力中心'
        : category === 'tax_authority'
          ? '财务中心'
          : category === 'air_ticket_service' || category === 'train_ticket_service' || category === 'hotel'
            ? '总部共享'
            : '';

  const defaultTargetModule = defaultScope === 'management' ? 'management_payables' : 'business_payables';
  const routingNote =
    category === 'supplier'
      ? '供应商主档默认进入业务类应付账款，并建议费用科目为采购货款。'
      : category === 'trucking' || category === 'freight_forwarder'
        ? '物流与货代类第三方默认进入业务类应付账款，并建议费用科目为货代物流。'
        : category === 'inspection_authority' || category === 'customs_broker'
          ? '商检局/报关行类第三方默认进入业务类应付账款，并建议费用科目为报关费。'
          : category === 'testing_agency' || category === 'inspection_service'
            ? '检测/验货类第三方默认进入业务类应付账款，并建议费用科目为验货费。'
            : category === 'landlord'
              ? '房东主档默认进入管理类应付账款，并建议费用科目为办公室租金、费用部门为行政部、成本中心为行政中心。'
              : category === 'property_management'
                ? '物业主档默认进入管理类应付账款，并建议费用科目为物业费、费用部门为行政部、成本中心为行政中心。'
                : category === 'social_security' || category === 'medical_insurance'
                  ? '医保和社保机构默认进入管理类应付账款，并建议费用部门为人力行政部、成本中心为人力中心。'
                  : category === 'housing_fund'
                    ? '公积金机构默认进入管理类应付账款，并建议费用部门为人力行政部、成本中心为人力中心。'
                    : category === 'tax_authority'
                      ? '税务机构默认进入管理类应付账款，并建议费用部门为财务部、成本中心为财务中心。'
                      : category === 'air_ticket_service' || category === 'train_ticket_service' || category === 'hotel'
                        ? '差旅服务类第三方默认进入管理类应付账款，并建议费用部门为行政部、成本中心为总部共享。'
                        : defaultScope === 'management'
                          ? '该第三方默认进入管理类应付账款，财务可按实际情况补充费用部门和成本中心。'
                          : '该第三方默认进入业务类应付账款，财务可按实际业务补充区域和业务信息。';

  return {
    defaultScope,
    defaultSubject,
    requiresRegion: defaultScope === 'business',
    defaultDepartment,
    defaultCostCenter,
    defaultTargetModule,
    routingNote,
  } as const;
}

export function PaymentIntakeCenterModule() {
  const createDialogBodyRef = useRef<HTMLDivElement | null>(null);
  const payeeMasterDialogBodyRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<IntakeTab>('manual');
  const [search, setSearch] = useState('');
  const [masterApprovalFilter, setMasterApprovalFilter] = useState<'all' | FinancePayeeApprovalStatus>('all');
  const [masterPartySideFilter, setMasterPartySideFilter] = useState<'all' | 'supplier' | 'third_party'>('all');
  const [masterCategoryFilter, setMasterCategoryFilter] = useState<'all' | FinancePayeeCategory>('all');
  const [masterEntityTypeFilter, setMasterEntityTypeFilter] = useState<'all' | FinancePayeeEntityType>('all');
  const [payeeMasters, setPayeeMasters] = useState<FinancePayeeMasterRecord[]>(() => loadFinanceV2PayeeMasters());
  const [intakeRecords, setIntakeRecords] = useState<PaymentIntakeRecord[]>(() => loadFinanceV2Intake());
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<IntakeFormState>(() => buildForm('manual'));
  const [selectedSlip, setSelectedSlip] = useState<File | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [payeeSelectorOpen, setPayeeSelectorOpen] = useState(false);
  const payeeSelectorRef = useRef<HTMLDivElement | null>(null);
  const [payeeSelectorDirection, setPayeeSelectorDirection] = useState<'down' | 'up'>('down');
  const [payeeSelectorMaxHeight, setPayeeSelectorMaxHeight] = useState(260);
  const [payeeMasterCreateOpen, setPayeeMasterCreateOpen] = useState(false);
  const [payeeMasterForm, setPayeeMasterForm] = useState<PayeeMasterCreateState>(() => buildPayeeMasterForm());
  const [editingPayeeMasterId, setEditingPayeeMasterId] = useState<string | null>(null);
  const [routingOverride, setRoutingOverride] = useState(false);

  const financeVisiblePayeeMasters = useMemo(
    () => payeeMasters.filter((item) => isFinanceMaintainedPartySide(item.partySide)),
    [payeeMasters],
  );

  const activeFinancePayeeMasters = useMemo(
    () => financeVisiblePayeeMasters.filter((item) => item.approvalStatus === 'active'),
    [financeVisiblePayeeMasters],
  );
  const pendingFinancePayeeMasters = useMemo(
    () => financeVisiblePayeeMasters.filter((item) => item.approvalStatus === 'pending_approval'),
    [financeVisiblePayeeMasters],
  );
  const payeeMasterCategoryOptions = useMemo(
    () => getAvailableCategoryOptions(payeeMasterForm.partySide),
    [payeeMasterForm.partySide],
  );

  const payeeResolution = useMemo(() => {
    const selectedProfile = activeFinancePayeeMasters.find((item) => item.id === form.selectedPayeeMasterId);
    if (selectedProfile) {
      return {
        status: 'matched' as PayeeMatchStatus,
        profile: selectedProfile,
        displayName: selectedProfile.name,
      };
    }

    const normalized = normalizePayeeName(form.payee);
    if (!normalized) {
      return {
        status: 'unmatched' as PayeeMatchStatus,
        profile: null,
        displayName: '',
      };
    }

    const exact = activeFinancePayeeMasters.find((item) => normalizePayeeName(item.name) === normalized);
    if (exact) {
      return { status: 'matched' as PayeeMatchStatus, profile: exact, displayName: exact.name };
    }

    const fuzzy = activeFinancePayeeMasters.find((item) => {
      const candidate = normalizePayeeName(item.name);
      return candidate.includes(normalized) || normalized.includes(candidate);
    });

    if (fuzzy) {
      return { status: 'suspected' as PayeeMatchStatus, profile: fuzzy, displayName: fuzzy.name };
    }

    return {
      status: 'unmatched' as PayeeMatchStatus,
      profile: null,
      displayName: normalized,
    };
  }, [activeFinancePayeeMasters, form.payee, form.selectedPayeeMasterId]);

  useEffect(() => {
    if (!payeeSelectorOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (payeeSelectorRef.current && target && !payeeSelectorRef.current.contains(target)) {
        setPayeeSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [payeeSelectorOpen]);

  useLayoutEffect(() => {
    if (!payeeSelectorOpen) return;

    const updatePayeeSelectorLayout = () => {
      const container = payeeSelectorRef.current;
      if (!container) return;

      const dialog = container.closest('[data-slot="dialog-content"]') as HTMLElement | null;
      const containerRect = container.getBoundingClientRect();
      const dialogRect = dialog?.getBoundingClientRect();
      if (!dialogRect) return;

      const gap = 12;
      const availableBelow = Math.max(160, Math.floor(dialogRect.bottom - containerRect.bottom - gap));
      const availableAbove = Math.max(160, Math.floor(containerRect.top - dialogRect.top - gap));
      const shouldOpenUp = availableBelow < 220 && availableAbove > availableBelow;

      setPayeeSelectorDirection(shouldOpenUp ? 'up' : 'down');
      setPayeeSelectorMaxHeight(shouldOpenUp ? availableAbove : availableBelow);
    };

    updatePayeeSelectorLayout();
    window.addEventListener('resize', updatePayeeSelectorLayout);

    return () => {
      window.removeEventListener('resize', updatePayeeSelectorLayout);
    };
  }, [payeeSelectorOpen]);

  const payeeCandidates = useMemo<FinancePayeeMasterRecord[]>(() => {
    const normalized = normalizePayeeName(form.payee);
    if (!normalized) return activeFinancePayeeMasters.slice(0, 12);
    return activeFinancePayeeMasters.filter((item) => {
      const candidate = normalizePayeeName(item.name);
      return candidate.includes(normalized) || normalized.includes(candidate);
    });
  }, [activeFinancePayeeMasters, form.payee]);
  const pendingPayeeCandidates = useMemo<FinancePayeeMasterRecord[]>(() => {
    const normalized = normalizePayeeName(form.payee);
    if (!normalized) return pendingFinancePayeeMasters.slice(0, 12);
    return pendingFinancePayeeMasters.filter((item) => {
      const candidate = normalizePayeeName(item.name);
      return candidate.includes(normalized) || normalized.includes(candidate);
    });
  }, [pendingFinancePayeeMasters, form.payee]);

  const derivedTargetModule = payeeResolution.profile?.targetModule ?? (form.expenseScope === 'management' ? 'management_payables' : 'business_payables');
  const expenseSubjectOptions =
    form.expenseScope === 'management'
      ? [...financeManagementExpenseSubjects]
      : [...financeBusinessExpenseSubjects];
  const hasAuthorizedPayeeProfile = payeeResolution.status === 'matched' && !!payeeResolution.profile;
  const shouldLockRoutingFields = hasAuthorizedPayeeProfile && !routingOverride;

  useEffect(() => {
    if (createOpen) {
      createDialogBodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [createOpen]);

  useEffect(() => {
    if (payeeMasterCreateOpen) {
      payeeMasterDialogBodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [payeeMasterCreateOpen]);

  useEffect(() => {
    saveFinanceV2Intake(intakeRecords);
  }, [intakeRecords]);

  useEffect(() => {
    saveFinanceV2PayeeMasters(payeeMasters);
  }, [payeeMasters]);

  useEffect(() => {
    const approvedRequests = getSupplierMasterRequests().filter(
      (item) =>
        isFinanceMaintainedPartySide(item.partySide) &&
        item.approvalStatus === 'approved' &&
        !item.financeNotifiedAt,
    );

    approvedRequests.forEach((item) => {
      toast.success(`主档 ${item.name} 已审核通过，现在可在统一录入中心使用`, {
        description: item.masterCode ? `系统编号：${item.masterCode}` : '请重新选择该主档后继续分发。',
      });
      markSupplierMasterRequestFinanceNotified(item.id);
    });
  }, []);

  useEffect(() => {
    const profile = payeeResolution.profile;
    if (!profile) {
      setRoutingOverride(false);
      return;
    }

    setRoutingOverride(false);

    setForm((current) => {
      const nextScope = profile.expenseScope;
      const nextDepartment = nextScope === 'management' ? profile.department || current.department : '';
      const nextCostCenter = nextScope === 'management' ? profile.costCenter || current.costCenter : '';
      const next = {
        ...current,
        selectedPayeeMasterId: profile.id,
        payee: profile.name,
        expenseScope: nextScope,
        expenseSubject: profile.expenseSubject,
        department: nextDepartment,
        costCenter: nextCostCenter,
        assignmentLine: getDefaultAssignmentLine(nextScope, nextCostCenter),
        assignmentType: getDefaultAssignmentType(nextScope, nextCostCenter),
        assignmentTarget: getDefaultAssignmentTarget(nextScope, current.region, nextDepartment, nextCostCenter),
        allocationStatus: 'auto_assigned' as AllocationStatus,
      };

      if (nextScope === 'management') {
        next.region = 'NA';
        next.apNo = '';
      }

      const unchanged =
        next.payee === current.payee &&
        next.selectedPayeeMasterId === current.selectedPayeeMasterId &&
        next.expenseScope === current.expenseScope &&
        next.expenseSubject === current.expenseSubject &&
        next.department === current.department &&
        next.costCenter === current.costCenter &&
        next.assignmentLine === current.assignmentLine &&
        next.assignmentType === current.assignmentType &&
        next.assignmentTarget === current.assignmentTarget &&
        next.allocationStatus === current.allocationStatus &&
        next.apNo === current.apNo &&
        next.region === current.region;

      return unchanged ? current : next;
    });
  }, [payeeResolution]);

  const stats = useMemo<WorkbenchStatItem[]>(() => {
    const pendingReview = intakeRecords.filter((item) => item.reviewStatus === 'pending_review');
    const readyDispatch = intakeRecords.filter((item) => item.reviewStatus === 'ready_dispatch');
    const business = intakeRecords.filter((item) => item.targetModule === 'business_payables');
    const management = intakeRecords.filter((item) => item.targetModule === 'management_payables');
    return [
      { id: 'pi-s1', label: '待校对录入', value: `${pendingReview.length}`, sub: '笔', tone: 'warn' },
      { id: 'pi-s2', label: '待分发录入', value: `${readyDispatch.length}`, sub: '笔', tone: 'default' },
      { id: 'pi-s3', label: '业务类分发', value: `${business.length}`, sub: '笔', tone: 'ok' },
      { id: 'pi-s4', label: '管理类分发', value: `${management.length}`, sub: '笔', tone: 'ok' },
    ];
  }, [intakeRecords]);

  const filteredRecords = useMemo(() => {
    return intakeRecords.filter((record) => {
      const keyword = search.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        record.intakeNo.toLowerCase().includes(keyword) ||
        record.payee.toLowerCase().includes(keyword) ||
        record.expenseSubject.toLowerCase().includes(keyword) ||
        (record.apNo || '').toLowerCase().includes(keyword);

      if (tab === 'review') return matchesKeyword && record.reviewStatus !== 'dispatched';
      if (tab === 'dispatched') return matchesKeyword && record.reviewStatus === 'dispatched';
      if (tab === 'manual' || tab === 'file' || tab === 'ocr' || tab === 'voice') {
        return matchesKeyword && record.sourceMode === tab;
      }
      return matchesKeyword;
    });
  }, [intakeRecords, search, tab]);

  const filteredPayeeMasters = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return financeVisiblePayeeMasters.filter((record) => {
      const matchesApproval = masterApprovalFilter === 'all' || record.approvalStatus === masterApprovalFilter;
      const matchesPartySide = masterPartySideFilter === 'all' || record.partySide === masterPartySideFilter;
      const matchesCategory = masterCategoryFilter === 'all' || record.category === masterCategoryFilter;
      const matchesEntityType = masterEntityTypeFilter === 'all' || record.entityType === masterEntityTypeFilter;
      if (!keyword) return matchesApproval && matchesPartySide && matchesCategory && matchesEntityType;
      return (
        matchesApproval &&
        matchesPartySide &&
        matchesCategory &&
        matchesEntityType &&
        (
        (record.masterCode || '').toLowerCase().includes(keyword) ||
        record.name.toLowerCase().includes(keyword) ||
        getFinancePayeePartySideLabel(record.partySide).toLowerCase().includes(keyword) ||
        getFinancePayeeApprovalStatusLabel(record.approvalStatus).toLowerCase().includes(keyword) ||
        getFinancePayeeCategoryLabel(record.category).toLowerCase().includes(keyword) ||
        getFinancePayeeEntityTypeLabel(record.entityType).toLowerCase().includes(keyword) ||
        record.expenseSubject.toLowerCase().includes(keyword) ||
        (record.department || '').toLowerCase().includes(keyword) ||
        (record.costCenter || '').toLowerCase().includes(keyword)
        )
      );
    });
  }, [financeVisiblePayeeMasters, masterApprovalFilter, masterPartySideFilter, masterCategoryFilter, masterEntityTypeFilter, search]);

  const resetForm = (sourceMode: PaymentIntakeRecord['sourceMode']) => {
    setForm(buildForm(sourceMode));
    setRoutingOverride(false);
    setSelectedSlip(null);
    setScanWarnings([]);
  };

  const openDialog = (sourceMode: PaymentIntakeRecord['sourceMode']) => {
    resetForm(sourceMode);
    setCreateOpen(true);
  };

  const resetPayeeMasterForm = () => {
    setPayeeMasterForm(buildPayeeMasterForm());
    setEditingPayeeMasterId(null);
  };

  const updateFormField = <K extends keyof IntakeFormState>(field: K, value: IntakeFormState[K]) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'expenseScope') {
        next.assignmentLine = getDefaultAssignmentLine(next.expenseScope, next.costCenter);
        next.assignmentType = getDefaultAssignmentType(next.expenseScope, next.costCenter);
        next.assignmentTarget = getDefaultAssignmentTarget(next.expenseScope, next.region, next.department, next.costCenter);
      }

      if (field === 'region' || field === 'department' || field === 'costCenter') {
        next.assignmentLine = getDefaultAssignmentLine(next.expenseScope, next.costCenter);
        next.assignmentType = getDefaultAssignmentType(next.expenseScope, next.costCenter);
        next.assignmentTarget = getDefaultAssignmentTarget(next.expenseScope, next.region, next.department, next.costCenter);
      }

      if (field === 'assignmentType') {
        if (next.assignmentType === 'shared_pool') {
          next.assignmentLine = 'shared_line';
          next.assignmentTarget = '总部共享池';
        } else if (next.assignmentType === 'department') {
          next.assignmentLine = 'management_line';
          next.assignmentTarget = next.department || '待补充责任部门';
        } else if (next.assignmentType === 'cost_center') {
          next.assignmentLine = next.costCenter === '总部共享' ? 'shared_line' : 'management_line';
          next.assignmentTarget = next.costCenter || '待补充成本中心';
        } else if (next.assignmentType === 'region') {
          next.assignmentLine = 'business_line';
          next.assignmentTarget = getRegionLabel(next.region);
        } else if (!next.assignmentTarget.trim()) {
          next.assignmentTarget = next.expenseScope === 'management' ? next.department || '待补充归属对象' : getRegionLabel(next.region);
        }
      }

      if (field === 'assignmentLine' && next.assignmentLine === 'shared_line') {
        next.assignmentType = 'shared_pool';
        next.assignmentTarget = next.assignmentTarget.trim() || '总部共享池';
      }

      if (field === 'assignmentTarget' && next.assignmentTarget.trim()) {
        next.allocationStatus = routingOverride ? 'manually_confirmed' : current.allocationStatus;
      }

      return next;
    });
  };

  const handleSlipSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    setSelectedSlip(nextFile);
    setForm((current) => ({
      ...current,
      slipFileName: nextFile?.name || '',
      sourceMode: 'ocr',
    }));
    setScanWarnings([]);
  };

  const applyScan = (extracted: PaymentSlipScanExtracted, fileName: string, confidence = 0) => {
    setForm((current) => {
      const nextPayee = extracted.payee ? normalizePayeeName(extracted.payee) : '';
      const currentPayee = normalizePayeeName(current.payee);
      const shouldProtectMatchedPayee =
        Boolean(current.selectedPayeeMasterId || hasAuthorizedPayeeProfile) &&
        confidence > 0 &&
        confidence < 75 &&
        Boolean(nextPayee) &&
        Boolean(currentPayee) &&
        nextPayee !== currentPayee;

      return {
        ...current,
        sourceMode: 'ocr',
        payee: shouldProtectMatchedPayee ? current.payee : (extracted.payee ? formatPayeeDisplayName(extracted.payee) : current.payee),
        amount: extracted.amount != null ? String(extracted.amount) : current.amount,
        currency: extracted.currency || current.currency,
        paidAt: extracted.paidAt ? extracted.paidAt.replace(' ', 'T').slice(0, 16) : current.paidAt,
        method: normalizeMethod(extracted.method) || current.method,
        remarks: extracted.remarks || current.remarks,
        slipFileName: fileName,
      };
    });

    const warnings = [...extracted.warnings];
    if (confidence > 0 && confidence < 75 && (form.selectedPayeeMasterId || hasAuthorizedPayeeProfile)) {
      warnings.unshift('当前 OCR 置信度偏低，系统已保留已命中的主档收款方，避免弱识别覆盖正确结果。');
    }
    setScanWarnings(warnings);
  };

  const handleScanSlip = async () => {
    if (!selectedSlip) {
      toast.error('请先上传付款水单');
      return;
    }
    try {
      setScanBusy(true);
      const result = await scanPaymentSlip(selectedSlip);
      applyScan(result.extracted, result.fileName, result.confidence || 0);
      toast.success('票据已识别，可在统一入口校对后分发');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '票据识别失败');
    } finally {
      setScanBusy(false);
    }
  };

  const handleCreate = () => {
    if (!form.expenseSubject.trim()) {
      toast.error('请填写费用科目');
      return;
    }
    if (!form.payee.trim()) {
      toast.error('请填写收款方');
      return;
    }
    if (!form.amount.trim() || Number.isNaN(Number(form.amount))) {
      toast.error('请填写有效的金额');
      return;
    }
    if (form.expenseScope === 'management' && !form.department.trim()) {
      toast.error('请填写费用部门');
      return;
    }

    const normalizedPayee = normalizePayeeName(form.payee);
    const currentPayables = loadFinanceV2Payables();
    const currentPayments = loadFinanceV2Payments();
    const intakeNo = makeIntakeNo(intakeRecords);
    const targetModule = derivedTargetModule;
    const canDispatch = payeeResolution.status === 'matched' && !!payeeResolution.profile && payeeResolution.profile.approvalStatus === 'active';
    const apNo = canDispatch
      ? form.expenseScope === 'business'
        ? (form.apNo.trim() || makeApNo('business', currentPayables))
        : makeApNo('management', currentPayables)
      : undefined;
    const fkNo = canDispatch ? makeFkNo(form.expenseScope, currentPayments) : undefined;
    const assignmentLine =
      form.assignmentType === 'shared_pool'
        ? 'shared_line'
        : form.assignmentLine || getDefaultAssignmentLine(form.expenseScope, form.costCenter);
    const assignmentType = form.assignmentType || getDefaultAssignmentType(form.expenseScope, form.costCenter);
    const assignmentTarget =
      form.assignmentTarget.trim() ||
      getDefaultAssignmentTarget(form.expenseScope, form.region, form.department, form.costCenter) ||
      undefined;
    const allocationStatus: AllocationStatus = routingOverride
      ? 'manually_confirmed'
      : hasAuthorizedPayeeProfile
        ? 'auto_assigned'
        : form.allocationStatus;
    const allocationReason = routingOverride
      ? `财务手动改判，原建议来自 ${payeeResolution.displayName || '系统默认规则'}`
      : payeeResolution.profile?.routingNote || '未匹配到 ERP 主档时，需财务人工确认费用归属、科目与承接模块。';

    const intakeRecord: PaymentIntakeRecord = {
      id: `intake-${Date.now()}`,
      intakeNo,
      sourceMode: form.sourceMode,
      reviewStatus: canDispatch ? 'dispatched' : 'pending_review',
      targetModule,
      expenseScope: form.expenseScope,
      expenseSubject: form.expenseSubject.trim(),
      payee: normalizedPayee,
      payeeMasterId: payeeResolution.profile?.id,
      payeeMatchStatus: payeeResolution.status,
      payeeCategory: payeeResolution.profile?.category,
      payeeEntityType: payeeResolution.profile?.entityType,
      payeeRoutingNote: payeeResolution.profile?.routingNote,
      amount: Number(form.amount),
      currency: form.currency,
      method: normalizeMethod(form.method) || 'T/T',
      createdAt: formatDateTimeForRecord(form.paidAt),
      operator: '赵敏',
      apNo,
      region: form.region,
      department: form.department.trim() || undefined,
      costCenter: form.costCenter.trim() || undefined,
      expensePeriod: form.expensePeriod.trim() || undefined,
      fileName: form.slipFileName || undefined,
      remarks: form.remarks.trim() || undefined,
      assignmentLine,
      assignmentType,
      assignmentTarget,
      allocationStatus,
      allocationReason,
    };

    const payableRecord: PayableRecord = {
      id: `payable-${Date.now()}`,
      apNo: apNo || '',
      scope: form.expenseScope,
      vendor: normalizedPayee,
      sourceDoc:
        form.expenseScope === 'business'
          ? (form.apNo.trim() ? `统一入口/${form.apNo.trim()}` : '统一入口录入')
          : `${form.expensePeriod.trim() || '费用期间待补'} / ${form.costCenter.trim() || '成本中心待补'}`,
      openAmount: Number(form.amount),
      currency: form.currency,
      dueDate: formatDateTimeForRecord(form.paidAt).slice(0, 10),
      status: '待付款',
      subject: form.expenseSubject.trim(),
      department: form.department.trim() || undefined,
      costCenter: form.costCenter.trim() || undefined,
      region: form.expenseScope === 'business' ? form.region : undefined,
      assignmentLine,
      assignmentType,
      assignmentTarget,
      allocationStatus,
    };

    const paymentRecord: PaymentExecutionRecord = {
      id: `payment-${Date.now()}`,
      fkNo: fkNo || '',
      apNo: apNo || '',
      expenseScope: form.expenseScope,
      expenseSubject: form.expenseSubject.trim(),
      payee: normalizedPayee,
      payeeType:
        payeeResolution.profile?.category === 'supplier'
          ? 'supplier'
          : (
              payeeResolution.profile?.category === 'trucking' ||
              payeeResolution.profile?.category === 'freight_forwarder' ||
              payeeResolution.profile?.category === 'inspection_authority' ||
              payeeResolution.profile?.category === 'customs_broker' ||
              payeeResolution.profile?.category === 'testing_agency' ||
              payeeResolution.profile?.category === 'inspection_service'
            )
            ? 'customs'
            : form.expenseScope === 'management'
              ? 'other_service'
              : 'supplier',
      amount: Number(form.amount),
      currency: form.currency,
      region: form.region,
      paidAt: formatDateTimeForRecord(form.paidAt),
      method: normalizeMethod(form.method) || 'T/T',
      bankRef: '',
      bankName: '统一入口待补录',
      accountMask: '',
      status: '待确认',
      operator: '赵敏',
      department: form.department.trim() || undefined,
      costCenter: form.costCenter.trim() || undefined,
      expensePeriod: form.expensePeriod.trim() || undefined,
      intakeSource: form.sourceMode,
      assignmentLine,
      assignmentType,
      assignmentTarget,
      allocationStatus,
    };

    const nextIntake = [intakeRecord, ...intakeRecords];
    setIntakeRecords(nextIntake);
    if (canDispatch) {
      const nextPayables = [payableRecord, ...currentPayables];
      const nextPayments = [paymentRecord, ...currentPayments];
      saveFinanceV2Payables(nextPayables);
      saveFinanceV2Payments(nextPayments);
    }
    setCreateOpen(false);
    resetForm(form.sourceMode);
    toast.success(canDispatch ? '统一录入已完成，系统已自动分发到目标模块' : '统一录入已保存到待校对池，需使用已授权主档后才能分发');
  };

  const handleCreatePayeeMaster = () => {
    if (!payeeMasterForm.name.trim()) {
      toast.error('请填写主档名称');
      return;
    }
    if (!payeeMasterForm.expenseSubject.trim()) {
      toast.error('请填写默认费用科目');
      return;
    }
    if (!isFinanceMaintainedPartySide(payeeMasterForm.partySide)) {
      toast.error('财务仅可提交供应商或第三方主档申请');
      return;
    }

    const targetModule = payeeMasterForm.expenseScope === 'management' ? 'management_payables' : 'business_payables';
    const nextRecord: FinancePayeeMasterRecord = {
      id: editingPayeeMasterId || `pm-local-${Date.now()}`,
      name: payeeMasterForm.name.trim(),
      partySide: payeeMasterForm.partySide,
      entityType: payeeMasterForm.entityType,
      category: payeeMasterForm.category,
      approvalStatus: 'pending_approval',
      expenseScope: payeeMasterForm.expenseScope,
      expenseSubject: payeeMasterForm.expenseSubject.trim(),
      targetModule,
      requiresRegion: payeeMasterForm.expenseScope === 'business' ? payeeMasterForm.requiresRegion : false,
      department: payeeMasterForm.expenseScope === 'management' ? (payeeMasterForm.department.trim() || undefined) : undefined,
      costCenter: payeeMasterForm.expenseScope === 'management' ? (payeeMasterForm.costCenter.trim() || undefined) : undefined,
      routingNote:
        payeeMasterForm.routingNote.trim() ||
        `财务新增主档，默认归属${payeeMasterForm.expenseScope === 'management' ? '管理费用' : '业务费用'}并分发到${targetModule === 'management_payables' ? '管理类应付账款' : '业务类应付账款'}。`,
    };

    upsertSupplierMasterRequest({
      id: nextRecord.id,
      name: nextRecord.name,
      partySide: nextRecord.partySide,
      entityType: nextRecord.entityType,
      category: nextRecord.category,
      expenseScope: nextRecord.expenseScope,
      expenseSubject: nextRecord.expenseSubject,
      department: nextRecord.department,
      costCenter: nextRecord.costCenter,
      routingNote: nextRecord.routingNote,
      approvalStatus: 'pending_approval',
      submittedBy: '赵敏',
    });

    setPayeeMasters((current) => {
      if (!editingPayeeMasterId) return [nextRecord, ...current];
      return current.map((item) => (item.id === editingPayeeMasterId ? nextRecord : item));
    });
    setForm((current) => ({
      ...current,
      selectedPayeeMasterId: '',
      payee: nextRecord.name,
    }));
    setPayeeMasterCreateOpen(false);
    setPayeeSelectorOpen(false);
    resetPayeeMasterForm();
    const approvalTargetLabel = nextRecord.partySide === 'supplier' ? '供应商管理模块' : '服务商管理模块';
    toast.success(
      editingPayeeMasterId
        ? `主档申请已更新，已重新送审到${approvalTargetLabel}，审核通过后才能使用`
        : `主档申请已提交，已送审到${approvalTargetLabel}，审核通过后才能使用`,
    );
  };

  const openPayeeMasterRequest = (partySide: Extract<FinancePayeePartySide, 'supplier' | 'third_party'>) => {
    resetPayeeMasterForm();
    const seedName = normalizePayeeName(form.payee);
    const defaultCategory = getDefaultCategoryByPartySide(partySide);
    const defaults = getDefaultExpenseConfig(defaultCategory);
    setPayeeMasterForm({
      name: seedName,
      partySide,
      entityType: 'company',
      category: defaultCategory,
      expenseScope: defaults.defaultScope,
      expenseSubject: defaults.defaultSubject,
      requiresRegion: defaults.requiresRegion,
      department: defaults.defaultDepartment,
      costCenter: defaults.defaultCostCenter,
      routingNote: defaults.routingNote,
    });
    setPayeeMasterCreateOpen(true);
  };

  const openEditPayeeMaster = (record: FinancePayeeMasterRecord) => {
    setEditingPayeeMasterId(record.id);
    setPayeeMasterForm({
      name: record.name,
      entityType: record.entityType,
      category: record.category,
      expenseScope: record.expenseScope,
      expenseSubject: record.expenseSubject,
      requiresRegion: record.requiresRegion,
      department: record.department || '',
      costCenter: record.costCenter || '',
      routingNote: record.routingNote || '',
      partySide: record.partySide,
    });
    setPayeeMasterCreateOpen(true);
  };

  const helperPanel = (() => {
    if (tab === 'file') {
      return '结构化文件入口：支持 CSV / Excel 批量导入，导入后进入待校对池再分发。';
    }
    if (tab === 'ocr') {
      return '票据识别入口：支持 PDF / PNG / JPG / JPEG，适合历史水单集中补录。当前已先接入图片识别。';
    }
    if (tab === 'voice') {
      return '语音入口：财务口述付款信息后转结构化表单，再进入待校对与分发。';
    }
    if (tab === 'review') {
      return '待校对池：统一录入后的识别结果、导入结果先在这里复核，再决定是否分发。';
    }
    if (tab === 'dispatched') {
      return '已分发池：已写入业务类应付或管理类应付的记录，保留来源和分发日志。';
    }
    if (tab === 'master') {
      return 'ERP 主档管理：统一维护公司与个人名单，供统一录入中心自动匹配费用归属、科目和目标模块。';
    }
    return '统一录入入口：财务可在这里先录入，再由系统自动分发到业务类或管理类应付模块。';
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="px-2 pb-2 pt-1.5">
        <FinanceStatStrip items={stats} />
        <div className="mt-1.5 flex flex-wrap gap-0.5 border border-slate-300 bg-slate-200 p-0.5">
          {tabItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold leading-[1.4] ${
                tab === item.id
                  ? 'border border-slate-300 bg-white text-slate-900 shadow-sm'
                  : 'border border-transparent text-slate-700 hover:border-slate-200 hover:bg-white/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-1.5 flex items-center justify-between border border-slate-300 bg-slate-50 px-3 py-2">
          <div className="text-[12px] font-semibold text-slate-600">{helperPanel}</div>
          <div className="flex items-center gap-2">
            {tab === 'manual' ? (
              <Button type="button" variant="outline" className="h-8 border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700" onClick={() => openDialog('manual')}>
                <Plus className="h-4 w-4" />
                新增录入
              </Button>
            ) : null}
            {tab === 'ocr' ? (
              <Button type="button" variant="outline" className="h-8 border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700" onClick={() => openDialog('ocr')}>
                <ScanSearch className="h-4 w-4" />
                新建识别
              </Button>
            ) : null}
            {tab === 'voice' ? (
              <Button type="button" variant="outline" className="h-8 border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700" onClick={() => openDialog('voice')}>
                <Mic className="h-4 w-4" />
                新建语音录入
              </Button>
            ) : null}
            {tab === 'master' ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700"
                onClick={() => {
                  resetPayeeMasterForm();
                  setPayeeMasterCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                新增主档
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-1.5">
          {tab === 'master' ? (
            <div className="flex flex-wrap items-center gap-2 border border-slate-300 bg-white px-3 py-2">
              <div className="min-w-[280px] flex-1">
                <FinanceFilterBar placeholder="系统编号 / 主档名称 / 属性 / 名单侧别 / 成本中心…" value={search} onChange={setSearch} onReset={() => setSearch('')} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-500">名单侧别</span>
                <Select value={masterPartySideFilter} onValueChange={(value) => setMasterPartySideFilter(value as 'all' | 'supplier' | 'third_party')}>
                  <SelectTrigger className="h-9 w-[120px] border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部侧别</SelectItem>
                    <SelectItem value="supplier">供应商</SelectItem>
                    <SelectItem value="third_party">第三方</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-500">主档类型</span>
                <Select value={masterEntityTypeFilter} onValueChange={(value) => setMasterEntityTypeFilter(value as 'all' | FinancePayeeEntityType)}>
                  <SelectTrigger className="h-9 w-[120px] border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="company">公司</SelectItem>
                    <SelectItem value="person">个人</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-500">收款方属性</span>
                <Select value={masterCategoryFilter} onValueChange={(value) => setMasterCategoryFilter(value as 'all' | FinancePayeeCategory)}>
                  <SelectTrigger className="h-9 w-[160px] border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部属性</SelectItem>
                    <SelectItem value="supplier">供应商</SelectItem>
                    <SelectItem value="trucking">拖车公司</SelectItem>
                    <SelectItem value="freight_forwarder">货代</SelectItem>
                    <SelectItem value="inspection_authority">商检局</SelectItem>
                    <SelectItem value="customs_broker">报关行</SelectItem>
                    <SelectItem value="testing_agency">检测机构</SelectItem>
                    <SelectItem value="inspection_service">验货服务商</SelectItem>
                    <SelectItem value="landlord">房东</SelectItem>
                    <SelectItem value="property_management">物业</SelectItem>
                    <SelectItem value="social_security">医保和社保机构</SelectItem>
                    <SelectItem value="housing_fund">公积金机构</SelectItem>
                    <SelectItem value="tax_authority">税务机构</SelectItem>
                    <SelectItem value="air_ticket_service">机票服务商</SelectItem>
                    <SelectItem value="train_ticket_service">车票服务商</SelectItem>
                    <SelectItem value="hotel">饭店/酒店</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-500">授权状态</span>
                <Select value={masterApprovalFilter} onValueChange={(value) => setMasterApprovalFilter(value as 'all' | FinancePayeeApprovalStatus)}>
                  <SelectTrigger className="h-9 w-[140px] border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="active">已生效</SelectItem>
                    <SelectItem value="pending_approval">待管理员授权</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <FinanceFilterBar placeholder="录入号 / 收款方 / 科目 / 应付号…" value={search} onChange={setSearch} onReset={() => setSearch('')} />
          )}
        </div>

        <div className="mt-1.5 overflow-auto border border-slate-300 bg-white">
          {tab === 'master' ? (
            <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">主档名称</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">系统编号</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">名单侧别</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">类型</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">收款方属性</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">授权状态</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">费用归属</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">默认费用科目</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">成本中心</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">目标模块</th>
                  <th className="px-2 py-2.5 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayeeMasters.map((record) => (
                  <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-800">{record.name}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono text-slate-600">{record.masterCode || '待授权后生成'}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{getFinancePayeePartySideLabel(record.partySide)}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{getFinancePayeeEntityTypeLabel(record.entityType)}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{getFinancePayeeCategoryLabel(record.category)}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{getFinancePayeeApprovalStatusLabel(record.approvalStatus)}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{record.expenseScope === 'management' ? '管理费用' : '业务费用'}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{record.expenseSubject}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 text-slate-600">{record.costCenter || '-'}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{record.targetModule === 'management_payables' ? '管理类应付账款' : '业务类应付账款'}</td>
                    <td className="px-2 py-2.5">
                      <Button type="button" variant="outline" disabled={record.partySide === 'internal'} className="h-7 border-slate-300 bg-white px-2 text-[12px] font-semibold text-slate-700 disabled:opacity-50" onClick={() => openEditPayeeMaster(record)}>
                        <PenLine className="h-3.5 w-3.5" />
                        编辑
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredPayeeMasters.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-10 text-center text-[13px] font-semibold text-slate-500">
                      当前条件下暂无 ERP 主档。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">录入号</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">来源</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">费用归属</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">费用科目</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">主档匹配</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">收款方</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">金额</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">目标模块</th>
                  <th className="border-r border-slate-200 px-2 py-2.5 font-semibold">校对状态</th>
                  <th className="px-2 py-2.5 font-semibold">录入时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal">{record.intakeNo}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{record.sourceMode.toUpperCase()}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{record.expenseScope === 'management' ? '管理费用' : '业务费用'}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{record.expenseSubject}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5">
                      <div className="font-semibold text-slate-700">{getMatchStatusLabel(record.payeeMatchStatus || 'unmatched')}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {record.payeeCategory ? getFinancePayeeCategoryLabel(record.payeeCategory as FinancePayeeCategory) : '待人工归类'}
                      </div>
                    </td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{record.payee}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal tabular-nums text-slate-800">{record.amount.toLocaleString()} {record.currency}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{getTargetModuleLabel(record.targetModule)}</td>
                    <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{getReviewStatusLabel(record.reviewStatus)}</td>
                    <td className="px-2 py-2.5">
                      <div className="font-mono font-normal text-slate-800">{record.createdAt}</div>
                      {record.fileName ? <div className="mt-0.5 text-[11px] text-slate-500">{record.fileName}</div> : null}
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-[13px] font-semibold text-slate-500">
                      当前入口下暂无记录。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent safeViewport className="grid-rows-[auto_minmax(0,1fr)_auto] w-[min(64rem,calc(100vw-2rem))] overflow-hidden border-slate-300 bg-slate-50 p-0 sm:rounded-lg">
          <DialogHeader className="shrink-0 border-b border-slate-300 bg-white px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-900">付款录入中心</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              统一入口录入后，系统会按费用归属自动分发到业务类应付或管理类应付。
            </DialogDescription>
          </DialogHeader>
          <div ref={createDialogBodyRef} className="min-h-0 overflow-y-auto overflow-x-hidden px-6 py-5 overscroll-contain">
            <div className="space-y-4">
            <div className="border border-slate-300 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">来源方式</div>
                  <div className="mt-1 text-[12px] text-slate-500">当前录入方式：{form.sourceMode.toUpperCase()}。票据识别会优先回填金额、日期、收款方等字段。</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {hasAuthorizedPayeeProfile ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 border-slate-300 bg-white text-[12px] font-semibold text-slate-700"
                      onClick={() => setRoutingOverride((current) => !current)}
                    >
                      {routingOverride ? '恢复主档建议' : '手动改判'}
                    </Button>
                  ) : null}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-white">
                    <Upload className="h-4 w-4" />
                    上传文件
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleSlipSelected} />
                  </label>
                  <Button type="button" variant="outline" className="h-9 border-slate-300 bg-white text-[12px] font-semibold text-slate-700" onClick={handleScanSlip} disabled={!selectedSlip || scanBusy}>
                    {scanBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                    上传并识别
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-[12px] text-slate-600">
                <span className="font-semibold">已选文件：</span>
                {form.slipFileName || '未上传'}
              </div>
              {scanWarnings.length > 0 ? (
                <div className="mt-3 border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
                  {scanWarnings.map((warning, index) => (
                    <div key={`${warning}-${index}`}>{warning}</div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="border border-slate-300 bg-white p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">付款对象</div>
                    <div className="mt-1 text-[12px] text-slate-500">统一维护收款方、ERP 主档和匹配状态，作为后续归属与分发的基础对象。</div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>收款方</Label>
                    <Input
                      value={form.payee}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          payee: event.target.value,
                          selectedPayeeMasterId: '',
                          allocationStatus: 'pending_assignment',
                        }))
                      }
                      className="border-slate-300 bg-white"
                      placeholder="优先匹配 ERP 里的公司或个人主档"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>收款方匹配</Label>
                    <Input value={getMatchStatusLabel(payeeResolution.status)} readOnly className="border-slate-300 bg-slate-100 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>主档类型</Label>
                    <Input
                      value={payeeResolution.profile ? getFinancePayeeEntityTypeLabel(payeeResolution.profile.entityType) : '待匹配'}
                      readOnly
                      className="border-slate-300 bg-slate-100 text-slate-700"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-4">
                    <Label>ERP 主档候选</Label>
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                      <div ref={payeeSelectorRef} className="relative min-w-0 w-full">
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={payeeSelectorOpen}
                          onClick={() => setPayeeSelectorOpen((current) => !current)}
                          className="h-10 w-full min-w-0 justify-between border-slate-300 bg-white px-3 text-left font-normal text-slate-700 hover:bg-white"
                        >
                          <span className="truncate">
                            {form.selectedPayeeMasterId
                              ? `${payeeResolution.displayName} / ${payeeResolution.profile ? getFinancePayeeCategoryLabel(payeeResolution.profile.category) : '主档'}`
                              : '从 ERP 公司或个人名单中选择'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                        </Button>
                        {payeeSelectorOpen ? (
                          <div
                            className={`absolute left-0 z-50 min-w-full max-w-[calc(100vw-3rem)] overflow-hidden rounded-md border border-slate-300 bg-white shadow-lg ${
                              payeeSelectorDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
                            }`}
                            style={{
                              width: 'min(calc(100vw - 3rem), max(100%, 28rem))',
                              maxHeight: `${payeeSelectorMaxHeight}px`,
                            }}
                          >
                            <Command className="bg-white">
                              <CommandInput placeholder="搜索 ERP 公司、个人、收款方属性…" />
                              <CommandList
                                className="overscroll-contain"
                                style={{ maxHeight: `${Math.max(120, payeeSelectorMaxHeight - 56)}px` }}
                                onWheel={handlePayeeListWheel}
                              >
                                <CommandEmpty className="px-3 py-6 text-[12px] text-slate-500">未找到匹配主档，可点击右侧“新增主档”。</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="__none__"
                                    onSelect={() => {
                                      updateFormField('selectedPayeeMasterId', '');
                                      setPayeeSelectorOpen(false);
                                    }}
                                    className="text-[13px]"
                                  >
                                    <Check className={`h-4 w-4 ${!form.selectedPayeeMasterId ? 'opacity-100' : 'opacity-0'}`} />
                                    不指定，按识别文本匹配
                                  </CommandItem>
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup>
                                  {payeeCandidates.map((item) => (
                                    <CommandItem
                                      key={item.id}
                                      value={`${item.name} ${getFinancePayeeCategoryLabel(item.category)} ${getFinancePayeeEntityTypeLabel(item.entityType)}`}
                                      onSelect={() => {
                                        updateFormField('selectedPayeeMasterId', item.id);
                                        setPayeeSelectorOpen(false);
                                      }}
                                      className="items-start py-2"
                                    >
                                      <Check className={`mt-0.5 h-4 w-4 ${form.selectedPayeeMasterId === item.id ? 'opacity-100' : 'opacity-0'}`} />
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[13px] font-semibold text-slate-800">{item.name}</span>
                                        <span className="text-[11px] text-slate-500">
                                          {getFinancePayeeCategoryLabel(item.category)} / {getFinancePayeeEntityTypeLabel(item.entityType)}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                {pendingPayeeCandidates.length > 0 ? (
                                  <>
                                    <CommandSeparator />
                                    <CommandGroup heading="待管理员授权">
                                      {pendingPayeeCandidates.map((item) => (
                                        <CommandItem
                                          key={item.id}
                                          value={`${item.name} ${getFinancePayeeCategoryLabel(item.category)} ${getFinancePayeeEntityTypeLabel(item.entityType)} 待管理员授权`}
                                          disabled
                                          className="items-start py-2 opacity-70"
                                        >
                                          <Check className="mt-0.5 h-4 w-4 opacity-0" />
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-[13px] font-semibold text-slate-700">{item.name}</span>
                                            <span className="text-[11px] text-slate-500">
                                              {getFinancePayeeCategoryLabel(item.category)} / {getFinancePayeeEntityTypeLabel(item.entityType)} / {getFinancePayeeApprovalStatusLabel(item.approvalStatus)}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                ) : null}
                              </CommandList>
                            </Command>
                          </div>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full shrink-0 border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 md:w-auto"
                        onClick={() => {
                          openPayeeMasterRequest('supplier');
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        新增主档
                      </Button>
                    </div>
                    {payeeResolution.status === 'unmatched' && form.payee.trim() ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-[12px] font-semibold text-amber-900">当前收款方尚未建立 ERP 主档</div>
                        <div className="mt-1 text-[12px] leading-[1.5] text-amber-800">
                          保存统一录入只会进入待校对池，不会自动送审主档。若要进入管理员审核，请先按实际对象提交主档申请。
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 border-amber-300 bg-white px-3 text-[12px] font-semibold text-amber-900 hover:bg-amber-100"
                            onClick={() => openPayeeMasterRequest('supplier')}
                          >
                            提交为供应商主档申请
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 border-amber-300 bg-white px-3 text-[12px] font-semibold text-amber-900 hover:bg-amber-100"
                            onClick={() => openPayeeMasterRequest('third_party')}
                          >
                            提交为第三方主档申请
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2 md:col-span-1 xl:col-span-1">
                    <Label>收款方属性</Label>
                    <Input
                      value={payeeResolution.profile ? getFinancePayeeCategoryLabel(payeeResolution.profile.category as FinancePayeeCategory) : '待匹配'}
                      readOnly
                      className="border-slate-300 bg-slate-100 text-slate-700"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1 xl:col-span-3">
                    <Label>主档名称</Label>
                    <Input
                      value={payeeResolution.displayName || '未匹配到 ERP 主档'}
                      readOnly
                      className="border-slate-300 bg-slate-100 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-300 bg-white p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-900">财务归类</div>
                  <div className="mt-1 text-[12px] text-slate-500">用于确定这笔费用如何入账、进入哪个应付模块，以及后续付款执行的基础口径。</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label>费用归属</Label>
                    <Select value={form.expenseScope} onValueChange={(value) => updateFormField('expenseScope', value as IntakeFormState['expenseScope'])} disabled={shouldLockRoutingFields}>
                      <SelectTrigger className="border-slate-300 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">业务费用</SelectItem>
                        <SelectItem value="management">管理费用</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasAuthorizedPayeeProfile ? (
                      <div className="text-[11px] leading-[1.4] text-slate-500">
                        {shouldLockRoutingFields ? '当前按已授权主档自动锁定；如需改判请点上方“手动改判”。' : `已解除锁定，原建议来自已授权主档：${payeeResolution.displayName}`}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>{form.expenseScope === 'management' ? '管理费用科目' : '费用科目'}</Label>
                    <Select value={form.expenseSubject} onValueChange={(value) => updateFormField('expenseSubject', value)} disabled={shouldLockRoutingFields}>
                      <SelectTrigger className="border-slate-300 bg-white">
                        <SelectValue placeholder={form.expenseScope === 'management' ? '选择管理费用科目' : '选择业务费用科目'} />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseSubjectOptions.map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasAuthorizedPayeeProfile ? (
                      <div className="text-[11px] leading-[1.4] text-slate-500">
                        {shouldLockRoutingFields ? '已按主档默认科目带出并锁定。' : '已解除锁定，财务可按实际情况调整。'}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>关联应付</Label>
                    <Input value={form.apNo} onChange={(event) => updateFormField('apNo', event.target.value)} className="border-slate-300 bg-white" placeholder={form.expenseScope === 'management' ? '管理费用可留空，系统自动生成' : 'YF-NA-260322-0007'} />
                  </div>
                  <div className="space-y-2">
                    <Label>付款时间</Label>
                    <Input type="datetime-local" value={form.paidAt} onChange={(event) => updateFormField('paidAt', event.target.value)} className="border-slate-300 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>付款金额</Label>
                    <Input value={form.amount} onChange={(event) => updateFormField('amount', event.target.value)} className="border-slate-300 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>币种</Label>
                    <Select value={form.currency} onValueChange={(value) => updateFormField('currency', value)}>
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
                    <Label>付款方式</Label>
                    <Select value={form.method} onValueChange={(value) => updateFormField('method', value)}>
                      <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {financePaymentMethodOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>目标模块</Label>
                    <Input value={getTargetModuleLabel(derivedTargetModule)} readOnly className="border-slate-300 bg-slate-100 text-slate-700" />
                    {hasAuthorizedPayeeProfile ? (
                      <div className="text-[11px] leading-[1.4] text-slate-500">根据已授权主档自动建议分发目标</div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="border border-slate-300 bg-white p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-900">经营归属</div>
                  <div className="mt-1 text-[12px] text-slate-500">无论采购、管理还是共享费用，都要最终落到某个责任链节点上，作为后续经营分析和 BI 统计的基础。</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label>归属主线</Label>
                    <Select value={form.assignmentLine} onValueChange={(value) => updateFormField('assignmentLine', value as AssignmentLine)}>
                      <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business_line">业务主线</SelectItem>
                        <SelectItem value="management_line">管理主线</SelectItem>
                        <SelectItem value="shared_line">共享主线</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>归属对象类型</Label>
                    <Select value={form.assignmentType} onValueChange={(value) => updateFormField('assignmentType', value as AssignmentType)}>
                      <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(form.expenseScope === 'management' ? financeManagementAttributionTypeOptions : financeBusinessAttributionTypeOptions).map((option) => (
                          <SelectItem key={option} value={option}>{getAssignmentTypeLabel(option)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>归属对象</Label>
                    <Input
                      value={form.assignmentTarget}
                      onChange={(event) => updateFormField('assignmentTarget', event.target.value)}
                      className="border-slate-300 bg-white"
                      placeholder="例如北美区域、采购部、总部共享池、客户项目或合同编号"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>责任区域</Label>
                    {form.expenseScope === 'business' && (payeeResolution.profile?.requiresRegion ?? true) ? (
                      <Select value={form.region} onValueChange={(value) => updateFormField('region', value as IntakeFormState['region'])}>
                        <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NA">北美</SelectItem>
                          <SelectItem value="EA">欧非</SelectItem>
                          <SelectItem value="SA">南美</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={form.expenseScope === 'management' ? '管理主线通常不按区域自动分发' : '该收款方无需区域维度'}
                        readOnly
                        className="border-slate-300 bg-slate-100 text-slate-500"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>责任部门</Label>
                    <Select value={form.department || '__empty__'} onValueChange={(value) => updateFormField('department', value === '__empty__' ? '' : value)} disabled={shouldLockRoutingFields}>
                      <SelectTrigger className="border-slate-300 bg-white"><SelectValue placeholder="选择责任部门" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">未指定</SelectItem>
                        {financeDepartmentOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasAuthorizedPayeeProfile && payeeResolution.profile?.department ? (
                      <div className="text-[11px] leading-[1.4] text-slate-500">默认值来自已授权主档：{payeeResolution.profile.department}</div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>成本中心</Label>
                    <Select value={form.costCenter || '__empty__'} onValueChange={(value) => updateFormField('costCenter', value === '__empty__' ? '' : value)} disabled={shouldLockRoutingFields}>
                      <SelectTrigger className="border-slate-300 bg-white"><SelectValue placeholder="选择成本中心" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">未指定</SelectItem>
                        {financeCostCenterOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-[11px] leading-[1.4] text-slate-500">成本中心表示这笔费用最终归集到公司内部哪个费用单元，例如行政中心、财务中心、总部共享。</div>
                  </div>

                  <div className="space-y-2">
                    <Label>费用期间</Label>
                    <Input value={form.expensePeriod} onChange={(event) => updateFormField('expensePeriod', event.target.value)} className="border-slate-300 bg-white" placeholder="2026-04 / 2026Q2" />
                  </div>
                </div>
              </div>

              <div className="border border-slate-300 bg-white p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-900">判定与分发</div>
                  <div className="mt-1 text-[12px] text-slate-500">系统会结合 ERP 主档、费用性质和经营归属做自动判断；如需修正，请通过上方“手动改判”完成。</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label>归属状态</Label>
                    <Input value={getAllocationStatusLabel(routingOverride ? 'manually_confirmed' : form.allocationStatus)} readOnly className="border-slate-300 bg-slate-100 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>当前主线</Label>
                    <Input value={getAssignmentLineLabel(form.assignmentLine)} readOnly className="border-slate-300 bg-slate-100 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>当前归属类型</Label>
                    <Input value={getAssignmentTypeLabel(form.assignmentType)} readOnly className="border-slate-300 bg-slate-100 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>系统建议目标</Label>
                    <Input value={form.assignmentTarget || '待补充归属对象'} readOnly className="border-slate-300 bg-slate-100 text-slate-700" />
                  </div>
                  <div className="space-y-2 md:col-span-4">
                    <Label>归属判定依据</Label>
                    <Textarea
                      value={
                        routingOverride
                          ? `财务已手动改判。当前仍保留原主档建议：${payeeResolution.profile?.routingNote || '未匹配到 ERP 主档时，需财务人工确认费用归属、科目与承接模块。'}`
                          : payeeResolution.profile?.routingNote || '未匹配到 ERP 主档时，需财务人工确认费用归属、科目与承接模块。'
                      }
                      readOnly
                      className="min-h-[88px] border-slate-300 bg-slate-100 text-slate-600"
                    />
                  </div>
                </div>
              </div>
            </div>

              <div className="border border-slate-300 bg-white p-4">
                <div className="space-y-2">
                  <Label>备注</Label>
                  <Textarea value={form.remarks} onChange={(event) => updateFormField('remarks', event.target.value)} className="min-h-[88px] border-slate-300 bg-white" placeholder="补充统一入口识别未覆盖的信息，例如用途、审批单号、校对说明。" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-slate-300 bg-white px-6 py-4">
            <Button type="button" variant="outline" className="border-slate-300 bg-white text-slate-700" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button type="button" className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleCreate}>
              保存并自动分发
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payeeMasterCreateOpen} onOpenChange={setPayeeMasterCreateOpen}>
        <DialogContent safeViewport className="grid-rows-[auto_minmax(0,1fr)_auto] w-[min(48rem,calc(100vw-2rem))] overflow-hidden border-slate-300 bg-slate-50 p-0 sm:rounded-lg">
          <DialogHeader className="shrink-0 border-b border-slate-300 bg-white px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-900">{editingPayeeMasterId ? '编辑 ERP 主档' : '新增 ERP 主档'}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {editingPayeeMasterId
                ? '更新供应商/第三方主档申请后，仍需管理员按类别在供应商管理或服务商管理模块审核后才能生效。'
                : '财务只可提交供应商或第三方主档申请，支持公司和个人两种类型；保存后需管理员按类别在供应商管理或服务商管理模块审核通过才可使用。'}
            </DialogDescription>
          </DialogHeader>
          <div ref={payeeMasterDialogBodyRef} className="grid min-h-0 gap-4 overflow-y-auto overflow-x-hidden px-6 py-5 overscroll-contain md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>主档名称</Label>
              <Input
                value={payeeMasterForm.name}
                onChange={(event) => setPayeeMasterForm((current) => ({ ...current, name: event.target.value }))}
                className="border-slate-300 bg-white"
                placeholder="公司名称或个人姓名"
              />
            </div>
            <div className="space-y-2">
              <Label>名单侧别</Label>
                  <Select
                    value={payeeMasterForm.partySide}
                    onValueChange={(value) => {
                      const partySide = value as FinancePayeePartySide;
                      const category = getDefaultCategoryByPartySide(partySide);
                      const defaults = getDefaultExpenseConfig(category);
                      setPayeeMasterForm((current) => ({
                        ...current,
                        partySide,
                        category,
                        expenseScope: defaults.defaultScope,
                        expenseSubject: defaults.defaultSubject,
                        requiresRegion: defaults.requiresRegion,
                        department: defaults.defaultScope === 'management' ? defaults.defaultDepartment : '',
                        costCenter: defaults.defaultScope === 'management' ? defaults.defaultCostCenter : '',
                        routingNote: defaults.routingNote,
                      }));
                    }}
                  >
                    <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">供应商</SelectItem>
                      <SelectItem value="third_party">第三方</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            <div className="space-y-2">
              <Label>主档类型</Label>
              <Select value={payeeMasterForm.entityType} onValueChange={(value) => setPayeeMasterForm((current) => ({ ...current, entityType: value as FinancePayeeEntityType }))}>
                <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">公司</SelectItem>
                  <SelectItem value="person">个人</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>收款方属性</Label>
              <Select
                value={payeeMasterForm.category}
                onValueChange={(value) => {
                  const category = value as FinancePayeeCategory;
                  const defaults = getDefaultExpenseConfig(category);
                  setPayeeMasterForm((current) => ({
                    ...current,
                    category,
                    expenseScope: defaults.defaultScope,
                    expenseSubject: defaults.defaultSubject,
                    requiresRegion: defaults.requiresRegion,
                    department: defaults.defaultScope === 'management' ? defaults.defaultDepartment : '',
                    costCenter: defaults.defaultScope === 'management' ? defaults.defaultCostCenter : '',
                    routingNote: defaults.routingNote,
                  }));
                }}
              >
                <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {payeeMasterCategoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>{getFinancePayeeCategoryLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>费用归属</Label>
              <Select
                value={payeeMasterForm.expenseScope}
                onValueChange={(value) =>
                  setPayeeMasterForm((current) => ({
                    ...current,
                    expenseScope: value as 'business' | 'management',
                    expenseSubject:
                      value === 'management'
                        ? financeManagementExpenseSubjects.includes(current.expenseSubject as never)
                          ? current.expenseSubject
                          : '其他管理费用'
                        : financeBusinessExpenseSubjects.includes(current.expenseSubject as never)
                          ? current.expenseSubject
                          : '其他业务费用',
                    requiresRegion: value === 'business',
                  }))
                }
              >
                <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">业务费用</SelectItem>
                  <SelectItem value="management">管理费用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>默认费用科目</Label>
              <Select value={payeeMasterForm.expenseSubject} onValueChange={(value) => setPayeeMasterForm((current) => ({ ...current, expenseSubject: value }))}>
                <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(payeeMasterForm.expenseScope === 'management' ? financeManagementExpenseSubjects : financeBusinessExpenseSubjects).map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>业务区域维度</Label>
              <Select
                value={payeeMasterForm.requiresRegion ? 'yes' : 'no'}
                onValueChange={(value) => setPayeeMasterForm((current) => ({ ...current, requiresRegion: value === 'yes' }))}
              >
                <SelectTrigger className="border-slate-300 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">需要区域</SelectItem>
                  <SelectItem value="no">无需区域</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {payeeMasterForm.expenseScope === 'management' ? (
              <>
                <div className="space-y-2">
                  <Label>默认费用部门</Label>
                  <Select value={payeeMasterForm.department || '__empty__'} onValueChange={(value) => setPayeeMasterForm((current) => ({ ...current, department: value === '__empty__' ? '' : value }))}>
                    <SelectTrigger className="border-slate-300 bg-white"><SelectValue placeholder="选择费用部门" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">未指定</SelectItem>
                      {financeDepartmentOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>默认成本中心</Label>
                  <Select value={payeeMasterForm.costCenter || '__empty__'} onValueChange={(value) => setPayeeMasterForm((current) => ({ ...current, costCenter: value === '__empty__' ? '' : value }))}>
                    <SelectTrigger className="border-slate-300 bg-white"><SelectValue placeholder="选择成本中心" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">未指定</SelectItem>
                      {financeCostCenterOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}
            <div className="space-y-2 md:col-span-2 xl:col-span-4">
              <Label>自动判定依据</Label>
              <Textarea
                value={payeeMasterForm.routingNote}
                onChange={(event) => setPayeeMasterForm((current) => ({ ...current, routingNote: event.target.value }))}
                className="min-h-[88px] border-slate-300 bg-white"
                placeholder="例如：房东/物业主档，默认判定为管理费用并建议成本中心为行政中心。"
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-slate-300 bg-white px-6 py-4">
            <Button type="button" variant="outline" className="border-slate-300 bg-white text-slate-700" onClick={() => setPayeeMasterCreateOpen(false)}>取消</Button>
            <Button type="button" className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleCreatePayeeMaster}>
              {editingPayeeMasterId ? '保存主档更新' : '保存主档并回填'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  const handlePayeeListWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const listEl = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = listEl;
    const scrollingDown = event.deltaY > 0;
    const scrollingUp = event.deltaY < 0;
    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

    if ((scrollingDown && !atBottom) || (scrollingUp && !atTop)) {
      event.stopPropagation();
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  };
