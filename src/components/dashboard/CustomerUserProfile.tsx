import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Mail, Pencil, Shield, Tag, User } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../contexts/UserContext';
import { customerPortalProfileService } from '../../lib/supabaseService';

type Mode = 'view' | 'edit';

interface CustomerPortalProfileState {
  displayName: string;
  loginEmail: string;
  portalRole: string;
  avatarUrl: string | null;
}

const CACHE_KEY = 'cosun_customer_portal_profile';

const editCls =
  'w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ' +
  'transition-colors placeholder:text-slate-300 bg-white';

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

function FieldRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 items-center py-3.5 border-b border-slate-50 last:border-0">
      <div className="w-24 flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
        {icon && <span className="text-slate-300">{icon}</span>}
        {label}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function ReadonlyBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
      {text}
    </span>
  );
}

function CustomerAvatar({
  avatarUrl,
  name,
  size = 64,
}: {
  avatarUrl: string | null;
  name: string;
  size?: number;
}) {
  const initials =
    name
      .split(/\s+/)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'CU';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-slate-200"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.32) }}
      className="rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold border border-blue-100"
    >
      {initials}
    </div>
  );
}

export default function CustomerUserProfile({ embedded = false }: { embedded?: boolean }) {
  const { user, setUser } = useUser();
  const [mode, setMode] = useState<Mode>('view');
  const [profile, setProfile] = useState<CustomerPortalProfileState>({
    displayName: '',
    loginEmail: '',
    portalRole: 'customer',
    avatarUrl: null,
  });
  const [draft, setDraft] = useState<CustomerPortalProfileState>({
    displayName: '',
    loginEmail: '',
    portalRole: 'customer',
    avatarUrl: null,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CustomerPortalProfileState;
        setProfile(parsed);
        setDraft(parsed);
        setAvatarPreview(parsed.avatarUrl || null);
      } catch {
        // ignore malformed cache
      }
    } else if (user) {
      const seeded: CustomerPortalProfileState = {
        displayName: user.name || user.email?.split('@')[0] || '',
        loginEmail: user.email || '',
        portalRole: 'customer',
        avatarUrl: null,
      };
      setProfile(seeded);
      setDraft(seeded);
      setAvatarPreview(null);
    }

    if (!user?.id || user.type !== 'customer') return undefined;

    void (async () => {
      try {
        const remote = await customerPortalProfileService.getByAuthUser(user.id);
        if (cancelled) return;

        const nextProfile: CustomerPortalProfileState = remote
          ? {
              displayName: remote.displayName || user.name || user.email?.split('@')[0] || '',
              loginEmail: remote.loginEmail || user.email || '',
              portalRole: remote.portalRole || 'customer',
              avatarUrl: remote.avatarUrl || null,
            }
          : {
              displayName: user.name || user.email?.split('@')[0] || '',
              loginEmail: user.email || '',
              portalRole: 'customer',
              avatarUrl: null,
            };

        if (!remote) {
          await customerPortalProfileService.saveByAuthUser(user.id, nextProfile);
        }

        if (cancelled) return;
        setProfile(nextProfile);
        setDraft(nextProfile);
        setAvatarPreview(nextProfile.avatarUrl);
        localStorage.setItem(CACHE_KEY, JSON.stringify(nextProfile));
      } catch (error) {
        console.warn('[CustomerUserProfile] Failed to hydrate customer portal profile:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.type]);

  useEffect(() => {
    if (mode === 'view') {
      setDraft(profile);
      setAvatarPreview(profile.avatarUrl);
    }
  }, [profile, mode]);

  const enterEdit = () => {
    setDraft(profile);
    setAvatarPreview(profile.avatarUrl);
    setAvatarFile(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setDraft(profile);
    setAvatarPreview(profile.avatarUrl);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMode('view');
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2 MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!draft.displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setSaving(true);
    try {
      let nextAvatar = avatarPreview;

      if (avatarFile) {
        nextAvatar = await new Promise<string | null>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
          reader.onerror = () => reject(new Error('avatar read failed'));
          reader.readAsDataURL(avatarFile);
        });
      }

      const nextProfile: CustomerPortalProfileState = {
        displayName: draft.displayName.trim(),
        loginEmail: profile.loginEmail || user?.email || '',
        portalRole: 'customer',
        avatarUrl: nextAvatar || null,
      };

      if (user?.id && user.type === 'customer') {
        await customerPortalProfileService.saveByAuthUser(user.id, nextProfile);
      }

      setProfile(nextProfile);
      setDraft(nextProfile);
      setAvatarPreview(nextProfile.avatarUrl);
      setAvatarFile(null);
      localStorage.setItem(CACHE_KEY, JSON.stringify(nextProfile));

      if (user) {
        setUser({
          ...user,
          name: nextProfile.displayName,
        });
      }

      setMode('view');
      toast.success('Account profile saved');
    } catch (error) {
      toast.error('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <div className={`${embedded ? 'space-y-0' : 'max-w-2xl mx-auto space-y-0'}`}>
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-slate-800 leading-tight">Account Profile</h1>
              <p className="text-[11px] text-slate-400">Portal Account Profile</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEdit ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={enterEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-end gap-2 mb-6">
          {isEdit ? (
            <>
              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={enterEdit}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Account Profile
            </button>
          )}
        </div>
      )}

      <Section title="Portal Identity">
        <div className="py-5 flex items-center gap-5 border-b border-slate-50">
          <div className="relative">
            <CustomerAvatar avatarUrl={avatarPreview} name={draft.displayName || profile.displayName || 'Customer'} />
            {isEdit && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-slate-500" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-slate-800">
              {profile.displayName || user?.name || 'Customer User'}
            </div>
            <div className="text-[12px] text-slate-400 mt-1">
              This section manages only the currently signed-in portal account.
            </div>
          </div>
        </div>

        <FieldRow label="Name" icon={<User className="w-3.5 h-3.5" />}>
          {isEdit ? (
            <input
              className={editCls}
              value={draft.displayName}
              onChange={(event) => setDraft((prev) => ({ ...prev, displayName: event.target.value }))}
              placeholder="Enter display name"
            />
          ) : (
            <span className={`text-[13px] ${profile.displayName ? 'text-slate-800' : 'text-slate-300'}`}>
              {profile.displayName || '—'}
            </span>
          )}
        </FieldRow>

        <FieldRow label="Login Email" icon={<Mail className="w-3.5 h-3.5" />}>
          <span className="text-[13px] text-slate-800">{profile.loginEmail || user?.email || '—'}</span>
        </FieldRow>

        <FieldRow label="Portal Role" icon={<Shield className="w-3.5 h-3.5" />}>
          <ReadonlyBadge text="Customer Portal" />
        </FieldRow>

        <FieldRow label="Account Type" icon={<Tag className="w-3.5 h-3.5" />}>
          <ReadonlyBadge text="Customer" />
        </FieldRow>
      </Section>
    </div>
  );
}
