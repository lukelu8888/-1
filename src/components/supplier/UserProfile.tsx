/**
 * UserProfile
 * ─────────────────────────────────────────────────────────────────────────────
 * State machine:  'view' → 'edit' → save → 'view'
 *                                  → cancel → 'view'
 *
 * Permission:
 *   - Any logged-in user can edit their own name and avatar
 *   - Email, role, account type are always read-only
 *
 * Avatar:
 *   File → data-URI → OrganizationContext.userProfile.avatarUrl
 *   Header UserMenu re-renders immediately via context (no page reload).
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft, Camera, Check, Mail,
  Pencil, Shield, Tag, User, X,
} from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = 'view' | 'edit';

// ─── UserAvatar (also exported for Header usage) ──────────────────────────────
export function UserAvatar({
  avatarUrl,
  name,
  size = 32,
  className = '',
}: {
  avatarUrl: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials =
    name
      .split(/\s+/)
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
      className={`rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 select-none ${className}`}
    >
      {initials}
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

// ─── Read-only badge (for role / type) ───────────────────────────────────────
function ReadonlyBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
      {text}
    </span>
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
    <div className="flex gap-4 items-center py-3.5 border-b border-slate-50 last:border-0">
      <div className="w-24 flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
        <span className="text-slate-300">{icon}</span>
        {label}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

const editCls =
  'w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ' +
  'transition-colors placeholder:text-slate-300 bg-white';

const viewCls = 'text-[13px] text-slate-800';
const viewEmptyCls = 'text-[13px] text-slate-300';

// ─── Main component ───────────────────────────────────────────────────────────
interface UserProfileProps {
  onBack?: () => void;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const { userProfile, updateUserProfile, uploadUserAvatar } = useOrganization();
  const { user } = useUser();

  // ── State machine ────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('view');
  const [draft, setDraft] = useState({ ...userProfile });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep view mode in sync when context changes from outside
  useEffect(() => {
    if (mode === 'view') {
      setDraft({ ...userProfile });
      setAvatarPreview(userProfile.avatarUrl);
    }
  }, [userProfile, mode]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const enterEdit = () => {
    setDraft({ ...userProfile });
    setAvatarPreview(userProfile.avatarUrl);
    setAvatarFile(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setDraft({ ...userProfile });
    setAvatarPreview(userProfile.avatarUrl);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMode('view');
  };

  // ── Avatar handlers ───────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2 MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('显示名称不能为空');
      return;
    }
    setSaving(true);
    try {
      if (avatarFile) {
        // Converts file → data-URI → context → localStorage → Header re-renders
        await uploadUserAvatar(avatarFile);
      }
      updateUserProfile({
        name: draft.name,
        // Only update avatarUrl if no new file (file upload already handled above)
        ...(!avatarFile ? { avatarUrl: avatarPreview } : {}),
      });
      setAvatarFile(null);
      setMode('view');
      toast.success('个人资料已保存');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === 'edit';
  const displayName = userProfile.name || '—';
  const displayEmail = user?.email || userProfile.email || '—';
  const displayRole = user?.role || user?.userRole || userProfile.role || 'Supplier';
  const displayType =
    user?.type === 'supplier' || user?.type === 'manufacturer'
      ? 'Supplier Portal'
      : user?.type || 'Supplier';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">

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
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-slate-800 leading-tight">个人资料</h1>
              <p className="text-[11px] text-slate-400">User Profile</p>
            </div>
          </div>
        </div>

        {/* Actions */}
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
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
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
      </div>

      {/* ── Section 1: Avatar ─────────────────────────────────────────────── */}
      <Section title="头像 · Avatar">
        <div className="py-4 flex items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <UserAvatar
              avatarUrl={avatarPreview}
              name={draft.name || displayName}
              size={72}
            />
            {isEdit && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="上传头像"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow transition-colors"
                    title="移除头像"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          {/* Hint */}
          <div className="space-y-1">
            {isEdit ? (
              <>
                <p className="text-[13px] font-medium text-slate-700">点击相机图标更换头像</p>
                <p className="text-[12px] text-slate-400">支持 PNG / JPG / WebP，最大 2 MB</p>
                <p className="text-[12px] text-slate-400">建议尺寸：200 × 200 px</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-medium text-slate-700">{displayName}</p>
                <p className="text-[12px] text-slate-400">{displayEmail}</p>
              </>
            )}
          </div>
        </div>
      </Section>

      <div className="h-4" />

      {/* ── Section 2: Account info ───────────────────────────────────────── */}
      <Section title="账户信息 · Account">
        {/* Display name – editable */}
        <FieldRow label="显示名称" icon={<User className="w-3.5 h-3.5" />}>
          {isEdit ? (
            <input
              className={editCls}
              value={draft.name}
              onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
              placeholder="张经理"
              autoFocus
            />
          ) : (
            <span className={displayName !== '—' ? viewCls : viewEmptyCls}>{displayName}</span>
          )}
        </FieldRow>

        {/* Email – always read-only */}
        <FieldRow label="邮箱" icon={<Mail className="w-3.5 h-3.5" />}>
          <span className={viewCls}>{displayEmail}</span>
        </FieldRow>

        {/* Role – always read-only */}
        <FieldRow label="角色" icon={<Shield className="w-3.5 h-3.5" />}>
          <ReadonlyBadge text={displayRole} />
        </FieldRow>

        {/* Account type – always read-only */}
        <FieldRow label="账户类型" icon={<Tag className="w-3.5 h-3.5" />}>
          <ReadonlyBadge text={displayType} />
        </FieldRow>
      </Section>
    </div>
  );
}
