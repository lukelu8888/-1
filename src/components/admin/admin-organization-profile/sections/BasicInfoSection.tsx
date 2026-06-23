import React from 'react';
import { FileText } from 'lucide-react';

import type { AdminOrgProfile } from '../../../../contexts/AdminOrganizationContext';
import { DualRow, Section } from '../components';
import { INPUT, MONO, NONE, VAL } from '../sharedStyles';

type BasicFieldKey =
  | 'nameCN'
  | 'nameEN'
  | 'descriptionCN'
  | 'descriptionEN'
  | 'addressCN'
  | 'addressEN'
  | 'taxId'
  | 'phone'
  | 'email'
  | 'contactPerson'
  | 'website'
  | 'defaultCurrencyCN'
  | 'defaultCurrencyEN'
  | 'timezone';

export function BasicInfoSection({
  isEdit,
  adminOrg,
  draft,
  tf,
  onFieldChange,
}: {
  isEdit: boolean;
  adminOrg: AdminOrgProfile;
  draft: AdminOrgProfile;
  tf: (
    value: string,
    onChange: (v: string) => void,
    placeholder?: string,
    type?: 'input' | 'textarea',
  ) => React.ReactNode;
  onFieldChange: (key: BasicFieldKey, value: string) => void;
}) {
  return (
    <>
      <Section title="基本信息" titleEN="Basic Information" icon={<FileText className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-1 pb-2 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">🇨🇳 中文信息</p>
          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">🇺🇸 English Information</p>
        </div>

        <DualRow
          labelCN="公司名称"
          labelEN="Company Name"
          leftNode={tf(draft.nameCN, (v) => onFieldChange('nameCN', v), '请输入公司中文名称')}
          rightNode={tf(draft.nameEN, (v) => onFieldChange('nameEN', v), 'Enter company name in English')}
        />
        <DualRow
          labelCN="公司简介"
          labelEN="Company Description"
          leftNode={tf(draft.descriptionCN, (v) => onFieldChange('descriptionCN', v), '专注建材供应链…', 'textarea')}
          rightNode={tf(draft.descriptionEN, (v) => onFieldChange('descriptionEN', v), 'Focused on building materials supply chain…', 'textarea')}
        />
        <DualRow
          labelCN="公司地址"
          labelEN="Company Address"
          leftNode={tf(draft.addressCN, (v) => onFieldChange('addressCN', v), '福建省厦门市思明区…')}
          rightNode={tf(draft.addressEN, (v) => onFieldChange('addressEN', v), 'Siming District, Xiamen, Fujian, China')}
        />
        <DualRow
          labelCN="统一社会信用代码"
          labelEN="Tax ID"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.taxId} onChange={(e) => onFieldChange('taxId', e.target.value)} placeholder="9135XXXXXXXXXXXXXX" />
          ) : adminOrg.taxId ? <span className={MONO}>{adminOrg.taxId}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.taxId} onChange={(e) => onFieldChange('taxId', e.target.value)} placeholder="9135XXXXXXXXXXXXXX" />
          ) : adminOrg.taxId ? <span className={MONO}>{adminOrg.taxId}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="联系电话"
          labelEN="Phone"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.phone} onChange={(e) => onFieldChange('phone', e.target.value)} placeholder="+86 592 1234567" />
          ) : draft.phone ? <span className={VAL}>{adminOrg.phone}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.phone} onChange={(e) => onFieldChange('phone', e.target.value)} placeholder="+86 592 1234567" />
          ) : draft.phone ? <span className={VAL}>{adminOrg.phone}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="邮箱"
          labelEN="Email"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.email} onChange={(e) => onFieldChange('email', e.target.value)} placeholder="purchase@example.com" type="email" />
          ) : adminOrg.email ? <span className={VAL}>{adminOrg.email}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.email} onChange={(e) => onFieldChange('email', e.target.value)} placeholder="purchase@example.com" type="email" />
          ) : adminOrg.email ? <span className={VAL}>{adminOrg.email}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="联系人"
          labelEN="Contact Person"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.contactPerson} onChange={(e) => onFieldChange('contactPerson', e.target.value)} placeholder="请输入联系人" />
          ) : adminOrg.contactPerson ? <span className={VAL}>{adminOrg.contactPerson}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.contactPerson} onChange={(e) => onFieldChange('contactPerson', e.target.value)} placeholder="Enter contact person" />
          ) : adminOrg.contactPerson ? <span className={VAL}>{adminOrg.contactPerson}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="官网"
          labelEN="Website"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.website} onChange={(e) => onFieldChange('website', e.target.value)} placeholder="https://www.example.com" type="url" />
          ) : adminOrg.website ? (
            <a href={adminOrg.website} target="_blank" rel="noreferrer" className="text-[13px] text-blue-600 hover:underline underline-offset-2">
              {adminOrg.website}
            </a>
          ) : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.website} onChange={(e) => onFieldChange('website', e.target.value)} placeholder="https://www.example.com" type="url" />
          ) : adminOrg.website ? (
            <a href={adminOrg.website} target="_blank" rel="noreferrer" className="text-[13px] text-blue-600 hover:underline underline-offset-2">
              {adminOrg.website}
            </a>
          ) : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="默认结算币种"
          labelEN="Default Currency"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.defaultCurrencyCN} onChange={(e) => onFieldChange('defaultCurrencyCN', e.target.value.toUpperCase())} placeholder="CNY" />
          ) : adminOrg.defaultCurrencyCN ? <span className={VAL}>{adminOrg.defaultCurrencyCN}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.defaultCurrencyEN} onChange={(e) => onFieldChange('defaultCurrencyEN', e.target.value.toUpperCase())} placeholder="USD" />
          ) : adminOrg.defaultCurrencyEN ? <span className={VAL}>{adminOrg.defaultCurrencyEN}</span> : <span className={NONE}>—</span>}
        />
        <DualRow
          labelCN="时区"
          labelEN="Timezone"
          leftNode={isEdit ? (
            <input className={INPUT} value={draft.timezone} onChange={(e) => onFieldChange('timezone', e.target.value)} placeholder="Asia/Shanghai" />
          ) : adminOrg.timezone ? <span className={VAL}>{adminOrg.timezone}</span> : <span className={NONE}>—</span>}
          rightNode={isEdit ? (
            <input className={INPUT} value={draft.timezone} onChange={(e) => onFieldChange('timezone', e.target.value)} placeholder="Asia/Shanghai" />
          ) : adminOrg.timezone ? <span className={VAL}>{adminOrg.timezone}</span> : <span className={NONE}>—</span>}
        />
      </Section>
    </>
  );
}
