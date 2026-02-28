/**
 * AdminOrganizationProfile
 * ─────────────────────────────────────────────────────────────────────────────
 * State machine:
 *   'view' ──[编辑 · Edit]──▶ 'edit' ──[保存 · Save]──▶ 'view'
 *                                      ──[取消 · Cancel]─▶ 'view'  (rollback)
 *
 * Layout:
 *   • Basic Info  — left/right dual-column (CN | EN)
 *   • Bank Accounts — two equal side-by-side cards:
 *       Left  = 公账 人民币 CNY  (Chinese fields only)
 *       Right = USD Public Account (English fields only)
 *   • Private Account — single card below
 *
 * Permission: all internal Admin Portal roles may edit.
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, Camera, Check, Globe,
  MapPin, Pencil, Phone, Upload, FileText, X,
  CreditCard, DollarSign, User, Lock, Languages,
} from 'lucide-react';
import {
  useAdminOrganization,
  type AdminOrgProfile,
  type BankAccountRMB,
  type BankAccountUSD,
  type BankAccountPrivate,
} from '../../contexts/AdminOrganizationContext';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
type Mode = 'view' | 'edit';

const INPUT =
  'w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 ' +
  'transition-colors placeholder:text-slate-300 bg-white';

const TEXTAREA = `${INPUT} resize-none`;
const VAL  = 'text-[13px] text-slate-800 leading-relaxed py-0.5';
const NONE = 'text-[13px] text-slate-300 py-0.5';
const MONO = 'text-[13px] font-mono text-slate-700 tracking-wider py-0.5';

// ─────────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Full-width white card section */
function Section({
  title, titleEN, icon, children,
}: {
  title: string; titleEN?: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
          {titleEN && (
            <span className="ml-2 text-slate-300 font-normal normal-case tracking-normal">
              · {titleEN}
            </span>
          )}
        </span>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

/**
 * Bilingual dual-column row — left = CN label/field, right = EN label/field.
 * Used for company name, description, address.
 */
function DualRow({
  labelCN, labelEN, leftNode, rightNode,
}: {
  labelCN: string; labelEN: string;
  leftNode: React.ReactNode; rightNode: React.ReactNode;
}) {
  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            🇨🇳 {labelCN}
          </p>
          {leftNode}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            🇺🇸 {labelEN}
          </p>
          {rightNode}
        </div>
      </div>
    </div>
  );
}

/** Single-column shared row (phone, website — language-neutral) */
function SingleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * Bank field row — label + value/input, used inside each bank card.
 */
function BankRow({
  label, children,
}: {
  label: string; children: React.ReactNode;
}) {
  return (
    <div className="py-2.5 border-b border-slate-50 last:border-0">
      <p className="text-[11px] font-medium text-slate-400 mb-1">{label}</p>
      {children}
    </div>
  );
}

/**
 * Bank card — a bordered inner card for one bank account block.
 * accent: 'red' for CNY, 'blue' for USD, 'amber' for private
 */
function BankCard({
  flag, title, subtitle, accentColor, children,
}: {
  flag: string; title: string; subtitle: string;
  accentColor: 'red' | 'blue' | 'amber';
  children: React.ReactNode;
}) {
  const headerCls: Record<string, string> = {
    red:   'bg-red-50   border-red-100   text-red-700',
    blue:  'bg-blue-50  border-blue-100  text-blue-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
  };
  const badgeCls: Record<string, string> = {
    red:   'bg-red-100   text-red-600',
    blue:  'bg-blue-100  text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${headerCls[accentColor]}`}>
        <span className="text-lg leading-none">{flag}</span>
        <div>
          <p className="text-[12px] font-bold leading-tight">{title}</p>
          <p className={`text-[10px] font-medium mt-0.5 ${badgeCls[accentColor]} inline-block px-1.5 py-0.5 rounded`}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="px-4 py-2 bg-white">{children}</div>
    </div>
  );
}

/** Mono account number */
function MonoField({
  isEdit, value, onChange, placeholder,
}: {
  isEdit: boolean; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  if (!isEdit) {
    return value ? <span className={MONO}>{value}</span> : <span className={NONE}>—</span>;
  }
  return (
    <input
      className={INPUT}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}

/** Logo placeholder showing company initials */
function LogoPlaceholder({ name }: { name: string }) {
  const initials = (name || 'CO').replace(/\s+/g, '').slice(0, 2).toUpperCase();
  return (
    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-red-50 to-rose-100 border-2 border-dashed border-red-200 flex flex-col items-center justify-center select-none">
      <span className="text-2xl font-bold text-red-400">{initials}</span>
      <span className="text-[9px] text-red-300 mt-0.5">暂无LOGO</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text-field factory (returns view text or edit input/textarea)
// ─────────────────────────────────────────────────────────────────────────────
function useTextField(isEdit: boolean) {
  return function tf(
    value: string,
    onChange: (v: string) => void,
    placeholder = '',
    type: 'input' | 'textarea' = 'input',
  ): React.ReactNode {
    if (!isEdit) {
      return value ? <span className={VAL}>{value}</span> : <span className={NONE}>—</span>;
    }
    if (type === 'textarea') {
      return (
        <textarea
          className={TEXTAREA}
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        className={INPUT}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────────────────
const INTERNAL_ROLES = new Set([
  'Admin', 'CEO', 'CFO',
  'Sales_Director', 'Regional_Manager', 'Sales_Manager', 'Sales_Rep',
  'Finance', 'Procurement', 'Marketing_Ops', 'Documentation_Officer',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface Props { onBack?: () => void; }

export default function AdminOrganizationProfile({ onBack }: Props) {
  const { adminOrg, updateAdminOrg, uploadAdminLogo } = useAdminOrganization();
  const { currentUser } = useAuth();
  const canEdit = !currentUser || INTERNAL_ROLES.has(currentUser.role ?? '');

  // ── State machine ─────────────────────────────────────────────────────────
  const [mode,        setMode]        = useState<Mode>('view');
  const [draft,       setDraft]       = useState<AdminOrgProfile>({ ...adminOrg });
  const [logoPreview, setLogoPreview] = useState<string | null>(adminOrg.logoUrl);
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [saving,      setSaving]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'view') {
      setDraft({ ...adminOrg });
      setLogoPreview(adminOrg.logoUrl);
    }
  }, [adminOrg, mode]);

  // ── Draft field setters ───────────────────────────────────────────────────
  type TopKey = keyof Omit<AdminOrgProfile, 'id' | 'logoUrl' | 'bankRMB' | 'bankUSD' | 'bankPrivate'>;
  const set     = (k: TopKey, v: string)                       => setDraft(p => ({ ...p, [k]: v }));
  const setRMB  = (k: keyof BankAccountRMB, v: string)         => setDraft(p => ({ ...p, bankRMB:     { ...p.bankRMB,     [k]: v } }));
  const setUSD  = (k: keyof BankAccountUSD, v: string)         => setDraft(p => ({ ...p, bankUSD:     { ...p.bankUSD,     [k]: v } }));
  const setPriv = (k: keyof BankAccountPrivate, v: string)     => setDraft(p => ({ ...p, bankPrivate: { ...p.bankPrivate, [k]: v } }));

  // ── Mode transitions ──────────────────────────────────────────────────────
  const enterEdit = () => {
    setDraft({ ...adminOrg });
    setLogoPreview(adminOrg.logoUrl);
    setLogoFile(null);
    setMode('edit');
  };
  const cancelEdit = () => {
    setDraft({ ...adminOrg });
    setLogoPreview(adminOrg.logoUrl);
    setLogoFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setMode('view');
  };

  // ── Logo handlers ─────────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('图片不能超过 3 MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.nameCN.trim()) { toast.error('公司中文名不能为空'); return; }
    setSaving(true);
    try {
      // 1. Upload logo if a new file was selected; returns false on quota exceeded
      let logoQuotaHit = false;
      if (logoFile) {
        const saved = await uploadAdminLogo(logoFile);
        if (!saved) logoQuotaHit = true;
      }

      // 2. Save all text fields (never includes the logo data-URI — stored separately)
      updateAdminOrg({
        nameCN:        draft.nameCN,
        nameEN:        draft.nameEN,
        descriptionCN: draft.descriptionCN,
        descriptionEN: draft.descriptionEN,
        phone:         draft.phone,
        website:       draft.website,
        addressCN:     draft.addressCN,
        addressEN:     draft.addressEN,
        bankRMB:       draft.bankRMB,
        bankUSD:       draft.bankUSD,
        bankPrivate:   draft.bankPrivate,
        // If logo was removed without uploading a new file, clear it explicitly
        ...(!logoFile ? { logoUrl: logoPreview } : {}),
      });

      setLogoFile(null);
      setMode('view');

      if (logoQuotaHit) {
        toast.warning(
          'LOGO 因浏览器存储空间不足无法永久保存（当前会话可见）。其他信息已成功保存。',
          { duration: 6000 }
        );
      } else {
        toast.success('公司信息已保存');
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === 'edit';
  const tf     = useTextField(isEdit);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <>
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                返回
              </button>
              <div className="w-px h-5 bg-slate-200" />
            </>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[15px] font-semibold text-slate-800 leading-tight">公司信息</h1>
                <span className="text-slate-300">·</span>
                <h1 className="text-[15px] font-medium text-slate-500 leading-tight">Company Profile</h1>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Languages className="w-3 h-3 text-slate-300" />
                <p className="text-[11px] text-slate-400">双语 · Bilingual</p>
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {isEdit ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? '保存中…' : '保存'}
                </button>
              </>
            ) : (
              <button
                onClick={enterEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                编辑 · Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Section 1 — Logo
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="公司标识" titleEN="Company Logo" icon={<Building2 className="w-3.5 h-3.5" />}>
        <div className="flex items-start gap-6">
          {/* Logo image + upload controls */}
          <div className="relative flex-shrink-0">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Company Logo"
                className="w-24 h-24 rounded-xl object-contain border border-slate-200 bg-white shadow-sm"
              />
            ) : (
              <LogoPlaceholder name={draft.nameCN} />
            )}
            {isEdit && canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="上传LOGO"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-slate-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow transition-colors"
                    title="移除"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </>
            )}
          </div>

          {/* Info panel */}
          <div className="flex-1 pt-1 space-y-1">
            {isEdit ? (
              <>
                <p className="text-[13px] font-semibold text-slate-700">
                  点击相机图标上传公司LOGO
                </p>
                <p className="text-[12px] text-slate-400">支持 PNG / JPG / WebP / SVG，最大 3 MB</p>
                <p className="text-[12px] text-slate-400">建议正方形 300 × 300 px</p>
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-2">
                  <Upload className="w-3 h-3" />
                  上传后立即同步至导航栏
                </p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-bold text-slate-800">{adminOrg.nameCN}</p>
                <p className="text-[13px] text-slate-500">{adminOrg.nameEN}</p>
                {adminOrg.phone && (
                  <p className="text-[12px] text-slate-400 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {adminOrg.phone}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          Section 2 — Basic Info (dual-column)
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="基本信息" titleEN="Basic Information" icon={<FileText className="w-3.5 h-3.5" />}>

        {/* Column guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-1 pb-2 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">🇨🇳 中文信息</p>
          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">🇺🇸 English Information</p>
        </div>

        <DualRow
          labelCN="公司名称"
          labelEN="Company Name"
          leftNode={tf(draft.nameCN, v => set('nameCN', v), '高盛达富')}
          rightNode={tf(draft.nameEN, v => set('nameEN', v), 'Gaoshengdafu Building Materials Co., Ltd.')}
        />
        <DualRow
          labelCN="公司简介"
          labelEN="Company Description"
          leftNode={tf(draft.descriptionCN, v => set('descriptionCN', v), '专注建材供应链…', 'textarea')}
          rightNode={tf(draft.descriptionEN, v => set('descriptionEN', v), 'Focused on building materials supply chain…', 'textarea')}
        />
        <DualRow
          labelCN="公司地址"
          labelEN="Company Address"
          leftNode={tf(draft.addressCN, v => set('addressCN', v), '福建省厦门市思明区…')}
          rightNode={tf(draft.addressEN, v => set('addressEN', v), 'Siming District, Xiamen, Fujian, China')}
        />
        <SingleRow label="联系电话 · Phone">
          {isEdit ? (
            <input className={INPUT} value={draft.phone} onChange={e => set('phone', e.target.value)} placeholder="+86 592 1234567" />
          ) : draft.phone ? <span className={VAL}>{adminOrg.phone}</span> : <span className={NONE}>—</span>}
        </SingleRow>
        <SingleRow label="官网 · Website">
          {isEdit ? (
            <input className={INPUT} value={draft.website} onChange={e => set('website', e.target.value)} placeholder="https://www.example.com" type="url" />
          ) : adminOrg.website ? (
            <a href={adminOrg.website} target="_blank" rel="noreferrer" className="text-[13px] text-blue-600 hover:underline underline-offset-2">
              {adminOrg.website}
            </a>
          ) : <span className={NONE}>—</span>}
        </SingleRow>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          Section 3 — Bank Accounts
          Two equal-width cards side by side on desktop, stacked on mobile.
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="银行账户信息" titleEN="Bank Accounts" icon={<CreditCard className="w-3.5 h-3.5" />}>

        {/* ── RMB + USD side by side ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* Left: RMB CNY — Chinese fields only */}
          <BankCard flag="🇨🇳" title="公账 — 人民币" subtitle="CNY · 国内付款" accentColor="red">
            <BankRow label="开户行">
              {tf(draft.bankRMB.bankName, v => setRMB('bankName', v), '中国工商银行厦门分行')}
            </BankRow>
            <BankRow label="账户名称">
              {tf(draft.bankRMB.accountName, v => setRMB('accountName', v), '福建高盛达富建材有限公司')}
            </BankRow>
            <BankRow label="银行账号">
              <MonoField
                isEdit={isEdit}
                value={draft.bankRMB.accountNumber}
                onChange={v => setRMB('accountNumber', v)}
                placeholder="1234 5678 9012 3456"
              />
            </BankRow>
            <BankRow label="SWIFT Code（可选）">
              {isEdit ? (
                <input
                  className={INPUT}
                  value={draft.bankRMB.swift}
                  onChange={e => setRMB('swift', e.target.value)}
                  placeholder="ICBKCNBJXMN"
                />
              ) : draft.bankRMB.swift ? (
                <span className={MONO}>{adminOrg.bankRMB.swift}</span>
              ) : (
                <span className={NONE}>—</span>
              )}
            </BankRow>
          </BankCard>

          {/* Right: USD — English fields only */}
          <BankCard flag="🇺🇸" title="USD Public Account" subtitle="USD · International" accentColor="blue">
            <BankRow label="Bank Name">
              {tf(draft.bankUSD.bankName, v => setUSD('bankName', v), 'Bank of China Xiamen Branch')}
            </BankRow>
            <BankRow label="Account Name">
              {tf(draft.bankUSD.accountName, v => setUSD('accountName', v), 'Fujian Gaoshengdafu Building Materials Co., Ltd.')}
            </BankRow>
            <BankRow label="Account Number">
              <MonoField
                isEdit={isEdit}
                value={draft.bankUSD.accountNumber}
                onChange={v => setUSD('accountNumber', v)}
                placeholder="USD account number"
              />
            </BankRow>
            <BankRow label="SWIFT Code">
              {isEdit ? (
                <input
                  className={INPUT}
                  value={draft.bankUSD.swift}
                  onChange={e => setUSD('swift', e.target.value)}
                  placeholder="BKCHCNBJ820"
                />
              ) : draft.bankUSD.swift ? (
                <span className={MONO}>{adminOrg.bankUSD.swift}</span>
              ) : (
                <span className={NONE}>—</span>
              )}
            </BankRow>
          </BankCard>
        </div>

        {/* ── Private Account ─────────────────────────────────────────────── */}
        <BankCard flag="🔒" title="私人账户" subtitle="内部使用 · Internal Only" accentColor="amber">
          <div className="flex items-center gap-2 mb-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            私人账户信息仅限内部管理人员查看，请谨慎填写
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <BankRow label="账户姓名">
                {tf(draft.bankPrivate.accountName, v => setPriv('accountName', v), '张三')}
              </BankRow>
              <BankRow label="开户银行">
                {tf(draft.bankPrivate.bankName, v => setPriv('bankName', v), '招商银行')}
              </BankRow>
            </div>
            <div>
              <BankRow label="银行账号">
                <MonoField
                  isEdit={isEdit}
                  value={draft.bankPrivate.accountNumber}
                  onChange={v => setPriv('accountNumber', v)}
                  placeholder="个人银行卡号"
                />
              </BankRow>
              <BankRow label="备注">
                {tf(draft.bankPrivate.remark, v => setPriv('remark', v), '例：日常采购付款专用')}
              </BankRow>
            </div>
          </div>
        </BankCard>

      </Section>

      {/* Quotation language hint */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 px-1">
        <Languages className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-300" />
        <span>
          中文报价单自动读取人民币公账字段；英文报价单自动读取 USD Public Account 字段。
          CN quotations use RMB account · EN quotations use USD account.
        </span>
      </div>
    </div>
  );
}
