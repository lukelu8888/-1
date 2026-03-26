import { useEffect, useState } from 'react';
import { FileBadge2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerMasterDataCopy } from './customerEnterpriseMasterDataI18n';
import { CustomerMasterSection } from './customerEnterpriseMasterDataLayout';

type CustomerDocumentDefaultsState = {
  signer: string;
  email: string;
  phone: string;
  currency: string;
  timezone: string;
  footerNote: string;
};

const STORAGE_KEY = 'cosun_customer_document_defaults_v1';

function buildDefaultState(): CustomerDocumentDefaultsState {
  return {
    signer: '',
    email: '',
    phone: '',
    currency: 'USD',
    timezone: 'UTC',
    footerNote: '',
  };
}

export default function CustomerDocumentDefaultsCenter({
  copy,
  rtl = false,
  forceEditToken,
  showActions = true,
}: {
  copy: CustomerMasterDataCopy['documents'];
  rtl?: boolean;
  forceEditToken?: number;
  showActions?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState<CustomerDocumentDefaultsState>(buildDefaultState);
  const [draft, setDraft] = useState<CustomerDocumentDefaultsState>(buildDefaultState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CustomerDocumentDefaultsState>;
      const next = { ...buildDefaultState(), ...parsed };
      setState(next);
      setDraft(next);
    } catch (error) {
      console.warn('[CustomerDocumentDefaultsCenter] Failed to read local cache:', error);
    }
  }, []);

  useEffect(() => {
    if (forceEditToken) setIsEditing(true);
  }, [forceEditToken]);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setState(draft);
    setIsEditing(false);
    toast.success(copy.saveSuccess);
  };

  const cancel = () => {
    setDraft(state);
    setIsEditing(false);
  };

  const inputClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400';

  return (
    <div className="space-y-4" dir={rtl ? 'rtl' : 'ltr'}>
      {(showActions || isEditing) && (
        <div className={`flex items-center gap-2 ${rtl ? 'justify-end' : ''}`}>
          {isEditing ? (
            <>
              <button onClick={cancel} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <X className="h-4 w-4" />
                {copy.cancel}
              </button>
              <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                <Save className="h-4 w-4" />
                {copy.save}
              </button>
            </>
          ) : showActions ? (
            <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {copy.edit}
            </button>
          ) : null}
        </div>
      )}

      <CustomerMasterSection title={copy.title} titleEN="Document Defaults" icon={<FileBadge2 className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            ['signer', copy.fields.signer, copy.placeholders.signer],
            ['email', copy.fields.email, copy.placeholders.email],
            ['phone', copy.fields.phone, copy.placeholders.phone],
            ['currency', copy.fields.currency, copy.placeholders.currency],
            ['timezone', copy.fields.timezone, copy.placeholders.timezone],
          ] as Array<[keyof CustomerDocumentDefaultsState, string, string]>).map(([key, label, placeholder]) => (
            <div key={key}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
              {isEditing ? (
                <input
                  className={inputClass}
                  value={draft[key]}
                  placeholder={placeholder}
                  onChange={(event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }))}
                />
              ) : (
                <span className="text-[13px] text-slate-800 leading-relaxed py-0.5">{state[key] || copy.notSet}</span>
              )}
            </div>
          ))}
          <div className="md:col-span-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{copy.fields.footerNote}</p>
            {isEditing ? (
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                value={draft.footerNote}
                placeholder={copy.placeholders.footerNote}
                onChange={(event) => setDraft((prev) => ({ ...prev, footerNote: event.target.value }))}
              />
            ) : (
              <span className="text-[13px] text-slate-800 leading-relaxed py-0.5">{state.footerNote || copy.notSet}</span>
            )}
          </div>
        </div>
      </CustomerMasterSection>
    </div>
  );
}
