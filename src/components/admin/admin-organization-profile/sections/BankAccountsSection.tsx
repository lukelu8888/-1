import React from 'react';
import { CreditCard, Languages } from 'lucide-react';

import type {
  AdminOrgProfile,
  BankAccountPrivate,
  BankAccountRMB,
  BankAccountUSD,
} from '../../../../contexts/AdminOrganizationContext';
import { BankCard, BankRow, MonoField, Section } from '../components';
import { INPUT, MONO, NONE } from '../sharedStyles';

export function BankAccountsSection({
  isEdit,
  adminOrg,
  draft,
  tf,
  setRMB,
  setUSD,
  setPriv,
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
  setRMB: (key: keyof BankAccountRMB, value: string) => void;
  setUSD: (key: keyof BankAccountUSD, value: string) => void;
  setPriv: (key: keyof BankAccountPrivate, value: string) => void;
}) {
  return (
    <>
      <Section title="银行账户信息" titleEN="Bank Accounts" icon={<CreditCard className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <BankCard flag="🇨🇳" title="公账 — 人民币" subtitle="CNY · 国内付款" accentColor="red">
            <BankRow label="开户行">
              {tf(draft.bankRMB.bankName, (v) => setRMB('bankName', v), '中国工商银行厦门分行')}
            </BankRow>
            <BankRow label="银行地址">
              {tf(draft.bankRMB.bankAddress, (v) => setRMB('bankAddress', v), '福建省厦门市思明区…')}
            </BankRow>
            <BankRow label="账户名称">
              {tf(draft.bankRMB.accountName, (v) => setRMB('accountName', v), '请输入人民币账户名称')}
            </BankRow>
            <BankRow label="银行账号">
              <MonoField
                isEdit={isEdit}
                value={draft.bankRMB.accountNumber}
                onChange={(v) => setRMB('accountNumber', v)}
                placeholder="1234 5678 9012 3456"
              />
            </BankRow>
            <BankRow label="SWIFT Code（可选）">
              {isEdit ? (
                <input
                  className={INPUT}
                  value={draft.bankRMB.swift}
                  onChange={(e) => setRMB('swift', e.target.value)}
                  placeholder="ICBKCNBJXMN"
                />
              ) : draft.bankRMB.swift ? (
                <span className={MONO}>{adminOrg.bankRMB.swift}</span>
              ) : (
                <span className={NONE}>—</span>
              )}
            </BankRow>
            <BankRow label="收款备注">
              {tf(draft.bankRMB.paymentNote, (v) => setRMB('paymentNote', v), '例：付款时请备注合同号 / 发票号')}
            </BankRow>
          </BankCard>

          <BankCard flag="🇺🇸" title="USD Public Account" subtitle="USD · International" accentColor="blue">
            <BankRow label="Bank Name">
              {tf(draft.bankUSD.bankName, (v) => setUSD('bankName', v), 'Bank of China Xiamen Branch')}
            </BankRow>
            <BankRow label="Bank Address">
              {tf(draft.bankUSD.bankAddress, (v) => setUSD('bankAddress', v), 'Xiamen, Fujian, China')}
            </BankRow>
            <BankRow label="Account Name">
              {tf(draft.bankUSD.accountName, (v) => setUSD('accountName', v), 'Enter USD account name')}
            </BankRow>
            <BankRow label="Account Number">
              <MonoField
                isEdit={isEdit}
                value={draft.bankUSD.accountNumber}
                onChange={(v) => setUSD('accountNumber', v)}
                placeholder="USD account number"
              />
            </BankRow>
            <BankRow label="SWIFT Code">
              {isEdit ? (
                <input
                  className={INPUT}
                  value={draft.bankUSD.swift}
                  onChange={(e) => setUSD('swift', e.target.value)}
                  placeholder="BKCHCNBJ820"
                />
              ) : draft.bankUSD.swift ? (
                <span className={MONO}>{adminOrg.bankUSD.swift}</span>
              ) : (
                <span className={NONE}>—</span>
              )}
            </BankRow>
            <BankRow label="Payment Note">
              {tf(draft.bankUSD.paymentNote, (v) => setUSD('paymentNote', v), 'Please mention QT / invoice number in remittance')}
            </BankRow>
          </BankCard>
        </div>

        <BankCard flag="🔒" title="私人账户" subtitle="内部使用 · Internal Only" accentColor="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <BankRow label="账户姓名">
                {tf(draft.bankPrivate.accountName, (v) => setPriv('accountName', v), '张三')}
              </BankRow>
              <BankRow label="开户银行">
                {tf(draft.bankPrivate.bankName, (v) => setPriv('bankName', v), '招商银行')}
              </BankRow>
              <BankRow label="银行地址">
                {tf(draft.bankPrivate.bankAddress, (v) => setPriv('bankAddress', v), '福建省福州市…')}
              </BankRow>
            </div>
            <div>
              <BankRow label="银行账号">
                <MonoField
                  isEdit={isEdit}
                  value={draft.bankPrivate.accountNumber}
                  onChange={(v) => setPriv('accountNumber', v)}
                  placeholder="个人银行卡号"
                />
              </BankRow>
              <BankRow label="备注">
                {tf(draft.bankPrivate.remark, (v) => setPriv('remark', v), '例：日常采购付款专用')}
              </BankRow>
              <BankRow label="收款备注">
                {tf(draft.bankPrivate.paymentNote, (v) => setPriv('paymentNote', v), '例：转账时请备注用途')}
              </BankRow>
            </div>
          </div>
        </BankCard>
      </Section>

      <div className="flex items-start gap-2 text-[11px] text-slate-400 px-1">
        <Languages className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-300" />
        <span>
          中文报价单自动读取人民币公账字段；英文报价单自动读取 USD Public Account 字段。
          CN quotations use RMB account · EN quotations use USD account.
        </span>
      </div>
    </>
  );
}
