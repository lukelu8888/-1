/**
 * OrganizationProfile
 * ─────────────────────────────────────────────────────────────────────────────
 * State machine:  'view' → 'edit' → save → 'view'
 *                                  → cancel → 'view'
 *
 * Permission:
 *   admin  – can enter edit mode, upload logo, save changes
 *   others – view-only; logo upload button hidden; Save/Edit hidden
 *
 * Logo:
 *   File is converted to data-URI and stored in OrganizationContext.
 *   Header logo re-renders immediately via React context (no page reload).
 *   PDF / print exports pick up the same data-URI.
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, Camera, Check, Globe,
  MapPin, Pencil, Phone, Upload, User, FileText, X,
} from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────
type Mode = 'view' | 'edit';

// ─── Shared input styles ─────────────────────────────────────────────────────
const viewCls =
  'w-full px-0 py-1 text-[13px] text-slate-800 bg-transparent border-none outline-none cursor-default select-text';
const editCls =
  'w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ' +
  'transition-colors placeholder:text-slate-300 bg-white';

// ─── Logo placeholder ────────────────────────────────────────────────────────
function LogoPlaceholder({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'CO';
  return (
    <div className="w-20 h-20 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center select-none">
      <span className="text-xl font-bold text-slate-400">{initials}</span>
      <span className="text-[9px] text-slate-400 mt-0.5">暂无LOGO</span>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

// ─── Field row ───────────────────────────────────────────────────────────────
function FieldRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 items-start py-3 border-b border-slate-50 last:border-0">
      <div className="w-28 flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-slate-400 pt-2">
        <span className="text-slate-300">{icon}</span>
        {label}
      </div>
      <div className="flex-1 min-w-0 pt-1">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface OrganizationProfileProps {
  onBack?: () => void;
}

export default function OrganizationProfile({ onBack }: OrganizationProfileProps) {
  const { org, updateOrg, uploadOrgLogo } = useOrganization();
  const { user } = useUser();

  const isAdmin =
    user?.role === 'admin' ||
    user?.type === 'admin' ||
    user?.userRole === 'admin' ||
    user?.userRole === 'company_admin';

  // ── State machine ────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('view');

  // Draft mirrors the context. Initialised fresh each time we open edit mode.
  const [draft, setDraft] = useState({ ...org });
  const [logoPreview, setLogoPreview] = useState<string | null>(org.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep view mode in sync when context changes (e.g., another tab)
  useEffect(() => {
    if (mode === 'view') {
      setDraft({ ...org });
      setLogoPreview(org.logoUrl);
    }
  }, [org, mode]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const set = (key: keyof typeof draft, val: string) =>
    setDraft(prev => ({ ...prev, [key]: val }));

  const enterEdit = () => {
    setDraft({ ...org });
    setLogoPreview(org.logoUrl);
    setLogoFile(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setDraft({ ...org });
    setLogoPreview(org.logoUrl);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMode('view');
  };

  // ── Logo handlers ─────────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2 MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('公司名称不能为空');
      return;
    }
    setSaving(true);
    try {
      if (logoFile) {
        await uploadOrgLogo(logoFile);   // converts file → data-URI → context + localStorage
      }
      updateOrg({
        name:          draft.name,
        nameEn:        draft.nameEn,
        description:   draft.description,
        phone:         draft.phone,
        address:       draft.address,
        website:       draft.website,
        contactPerson: draft.contactPerson,
        // If logo was removed in edit mode and no new file chosen
        ...(!logoFile ? { logoUrl: logoPreview } : {}),
      });
      setLogoFile(null);
      setMode('view');
      toast.success('公司信息已保存');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const isEdit = mode === 'edit';

  const textInput = (
    key: keyof typeof draft,
    placeholder = ''
  ) =>
    isEdit ? (
      <input
        className={editCls}
        value={draft[key] as string}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <span className={viewCls + (!(org as any)[key] ? ' text-slate-300' : '')}>
        {(org as any)[key] || '—'}
      </span>
    );

  const textArea = (key: keyof typeof draft, placeholder = '') =>
    isEdit ? (
      <textarea
        className={`${editCls} resize-none h-20`}
        value={draft[key] as string}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <span className={viewCls + (!org.description ? ' text-slate-300' : '')}>
        {org.description || '—'}
      </span>
    );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-0">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        {/* Back */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              返回
            </button>
          )}
          {onBack && <div className="w-px h-4 bg-slate-200" />}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-slate-800 leading-tight">公司信息</h1>
              <p className="text-[11px] text-slate-400">Organization Profile</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            {isEdit ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? '保存中…' : '保存'}
                </button>
              </>
            ) : (
              <button
                onClick={enterEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                编辑
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Section 1: Logo ───────────────────────────────────────────────── */}
      <Section title="公司标识 · Logo">
        <div className="py-4 flex items-start gap-5">
          {/* Logo image / placeholder */}
          <div className="relative flex-shrink-0">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Company Logo"
                className="w-20 h-20 rounded-lg object-contain border border-slate-200 bg-slate-50"
              />
            ) : (
              <LogoPlaceholder name={draft.name || org.name} />
            )}

            {/* Upload button – edit mode + admin only */}
            {isEdit && isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="上传LOGO"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow transition-colors"
                    title="移除LOGO"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </>
            )}
          </div>

          {/* Hint text */}
          <div className="pt-1">
            {isEdit && isAdmin ? (
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-slate-700">点击相机图标上传新LOGO</p>
                <p className="text-[12px] text-slate-400">支持 PNG / JPG / WebP / SVG，最大 2 MB</p>
                <p className="text-[12px] text-slate-400">建议尺寸：200 × 200 px 以上，方形图片效果最佳</p>
                <p className="text-[11px] text-blue-500 mt-1 flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  上传后将自动同步至报价单文档与PDF导出
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[13px] font-medium text-slate-700">{org.name}</p>
                <p className="text-[12px] text-slate-400">{org.nameEn || 'Company Logo'}</p>
                {!isAdmin && (
                  <p className="text-[11px] text-slate-300 mt-2">仅管理员可修改公司标识</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Section>

      <div className="h-4" />

      {/* ── Section 2: Basic info ─────────────────────────────────────────── */}
      <Section title="基本信息">
        <FieldRow label="公司中文名" icon={<Building2 className="w-3.5 h-3.5" />}>
          {textInput('name', '广东五金制造厂')}
        </FieldRow>
        <FieldRow label="英文名称" icon={<Building2 className="w-3.5 h-3.5" />}>
          {textInput('nameEn', 'Guangdong Hardware Factory')}
        </FieldRow>
        <FieldRow label="公司简介" icon={<FileText className="w-3.5 h-3.5" />}>
          {textArea('description', '专注五金制造20年，ISO认证工厂…')}
        </FieldRow>
        <FieldRow label="联系人" icon={<User className="w-3.5 h-3.5" />}>
          {textInput('contactPerson', '张经理')}
        </FieldRow>
        <FieldRow label="联系电话" icon={<Phone className="w-3.5 h-3.5" />}>
          {textInput('phone', '+86 20 8888 8888')}
        </FieldRow>
        <FieldRow label="地址" icon={<MapPin className="w-3.5 h-3.5" />}>
          {textInput('address', '广东省广州市番禺区…')}
        </FieldRow>
        <FieldRow label="官网" icon={<Globe className="w-3.5 h-3.5" />}>
          {isEdit ? (
            <input
              className={editCls}
              value={draft.website}
              onChange={e => set('website', e.target.value)}
              placeholder="https://www.example.com"
              type="url"
            />
          ) : org.website ? (
            <a
              href={org.website}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] text-blue-600 hover:underline underline-offset-2"
            >
              {org.website}
            </a>
          ) : (
            <span className="text-[13px] text-slate-300">—</span>
          )}
        </FieldRow>
      </Section>

      {/* ── Non-admin notice ─────────────────────────────────────────────── */}
      {!isAdmin && (
        <p className="text-center text-[12px] text-slate-400 pt-4">
          仅组织管理员可编辑公司信息。如需修改，请联系管理员。
        </p>
      )}
    </div>
  );
}
