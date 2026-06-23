import React from 'react';
import { FileBadge2 } from 'lucide-react';

import type { AdminOrgProfile } from '../../../../contexts/AdminOrganizationContext';
import { Section } from '../components';
import { INPUT, NONE, TEXTAREA, VAL } from '../sharedStyles';

type DocumentDefaults = AdminOrgProfile['documentDefaults'];

export function DocumentDefaultsSection({
  isEdit,
  documentDefaults,
  onChange,
}: {
  isEdit: boolean;
  documentDefaults: DocumentDefaults;
  onChange: (key: keyof DocumentDefaults, value: string) => void;
}) {
  return (
    <Section title="文档默认信息" titleEN="Document Defaults" icon={<FileBadge2 className="w-3.5 h-3.5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认签字人</p>
          {isEdit ? (
            <input className={INPUT} value={documentDefaults.defaultSignatory} onChange={(e) => onChange('defaultSignatory', e.target.value)} placeholder="张明" />
          ) : documentDefaults.defaultSignatory ? <span className={VAL}>{documentDefaults.defaultSignatory}</span> : <span className={NONE}>—</span>}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认邮箱</p>
          {isEdit ? (
            <input className={INPUT} value={documentDefaults.defaultEmail} onChange={(e) => onChange('defaultEmail', e.target.value)} placeholder="docs@example.com" />
          ) : documentDefaults.defaultEmail ? <span className={VAL}>{documentDefaults.defaultEmail}</span> : <span className={NONE}>—</span>}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认电话</p>
          {isEdit ? (
            <input className={INPUT} value={documentDefaults.defaultPhone} onChange={(e) => onChange('defaultPhone', e.target.value)} placeholder="+86 591..." />
          ) : documentDefaults.defaultPhone ? <span className={VAL}>{documentDefaults.defaultPhone}</span> : <span className={NONE}>—</span>}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认币种</p>
          {isEdit ? (
            <input className={INPUT} value={documentDefaults.defaultCurrency} onChange={(e) => onChange('defaultCurrency', e.target.value.toUpperCase())} placeholder="CNY" />
          ) : documentDefaults.defaultCurrency ? <span className={VAL}>{documentDefaults.defaultCurrency}</span> : <span className={NONE}>—</span>}
        </div>
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认页脚说明</p>
          {isEdit ? (
            <textarea className={TEXTAREA} rows={3} value={documentDefaults.defaultFooterNote} onChange={(e) => onChange('defaultFooterNote', e.target.value)} placeholder="Thank you for your business." />
          ) : documentDefaults.defaultFooterNote ? <span className={VAL}>{documentDefaults.defaultFooterNote}</span> : <span className={NONE}>—</span>}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">默认时区</p>
          {isEdit ? (
            <input className={INPUT} value={documentDefaults.defaultTimezone} onChange={(e) => onChange('defaultTimezone', e.target.value)} placeholder="Asia/Shanghai" />
          ) : documentDefaults.defaultTimezone ? <span className={VAL}>{documentDefaults.defaultTimezone}</span> : <span className={NONE}>—</span>}
        </div>
      </div>
    </Section>
  );
}
