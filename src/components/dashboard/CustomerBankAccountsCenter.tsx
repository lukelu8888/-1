import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Languages, Lock, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerMasterDataCopy } from './customerEnterpriseMasterDataI18n';
import { CustomerMasterSection, CustomerSingleRow, CustomerValue } from './customerEnterpriseMasterDataLayout';

type BankAccountRecord = {
  id: 'primary' | 'alternate' | 'private';
  accountType: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  iban: string;
  currency: string;
  branchAddress: string;
  primaryUse: string;
  paymentNote: string;
  remark: string;
};

type CustomerBankAccountsState = {
  legalCompanyName: string;
  billingAddress: string;
  taxId: string;
  accounts: BankAccountRecord[];
};

const STORAGE_KEY = 'cosun_customer_bank_accounts_v1';

type CountryBankContext = {
  countryCode: string;
  countryName: string;
  flag: string;
  localCurrency: string;
};

const COUNTRY_BANK_CONTEXT_MAP: Array<{
  matches: string[];
  context: CountryBankContext;
}> = [
  { matches: ['liberia'], context: { countryCode: 'LR', countryName: 'Liberia', flag: '🇱🇷', localCurrency: 'LRD' } },
  { matches: ['china', '中国'], context: { countryCode: 'CN', countryName: 'China', flag: '🇨🇳', localCurrency: 'CNY' } },
  { matches: ['united states', 'usa', 'u.s.a.', 'america'], context: { countryCode: 'US', countryName: 'United States', flag: '🇺🇸', localCurrency: 'USD' } },
  { matches: ['brazil', 'brasil'], context: { countryCode: 'BR', countryName: 'Brazil', flag: '🇧🇷', localCurrency: 'BRL' } },
  { matches: ['spain', 'españa'], context: { countryCode: 'ES', countryName: 'Spain', flag: '🇪🇸', localCurrency: 'EUR' } },
  { matches: ['portugal'], context: { countryCode: 'PT', countryName: 'Portugal', flag: '🇵🇹', localCurrency: 'EUR' } },
  { matches: ['saudi arabia', 'saudi', 'السعودية'], context: { countryCode: 'SA', countryName: 'Saudi Arabia', flag: '🇸🇦', localCurrency: 'SAR' } },
];

const DEFAULT_COUNTRY_BANK_CONTEXT: CountryBankContext = {
  countryCode: 'US',
  countryName: 'United States',
  flag: '🇺🇸',
  localCurrency: 'USD',
};

function resolveCustomerCountryBankContext(): CountryBankContext {
  if (typeof window === 'undefined') return DEFAULT_COUNTRY_BANK_CONTEXT;
  try {
    const raw = localStorage.getItem('cosun_customer_profile');
    if (!raw) return DEFAULT_COUNTRY_BANK_CONTEXT;
    const parsed = JSON.parse(raw) as { address?: string | null };
    const address = (parsed.address || '').trim().toLowerCase();
    if (!address) return DEFAULT_COUNTRY_BANK_CONTEXT;
    const matched = COUNTRY_BANK_CONTEXT_MAP.find(({ matches }) => matches.some((token) => address.includes(token)));
    return matched?.context || DEFAULT_COUNTRY_BANK_CONTEXT;
  } catch {
    return DEFAULT_COUNTRY_BANK_CONTEXT;
  }
}

const buildDefaultState = (copy: CustomerMasterDataCopy, countryContext: CountryBankContext): CustomerBankAccountsState => ({
  legalCompanyName: '',
  billingAddress: '',
  taxId: '',
  accounts: [
    {
      id: 'primary',
      accountType: copy.bank.localPublicAccount,
      bankName: '',
      accountName: '',
      accountNumber: '',
      swiftCode: '',
      iban: '',
      currency: countryContext.localCurrency,
      branchAddress: '',
      primaryUse: copy.bank.localIncomingUse,
      paymentNote: '',
      remark: '',
    },
    {
      id: 'alternate',
      accountType: copy.bank.usdPublicAccount,
      bankName: '',
      accountName: '',
      accountNumber: '',
      swiftCode: '',
      iban: '',
      currency: 'USD',
      branchAddress: '',
      primaryUse: copy.bank.usdIncomingUse,
      paymentNote: '',
      remark: '',
    },
    {
      id: 'private',
      accountType: copy.bank.localPrivateAccount,
      bankName: '',
      accountName: '',
      accountNumber: '',
      swiftCode: '',
      iban: '',
      currency: countryContext.localCurrency,
      branchAddress: '',
      primaryUse: copy.bank.localPrivateUse,
      paymentNote: '',
      remark: '',
    },
  ],
});

export default function CustomerBankAccountsCenter({
  copy,
  rtl = false,
  forceEditToken,
  forceSaveToken,
  forceCancelToken,
  showActions = true,
  onEditingChange,
}: {
  copy: CustomerMasterDataCopy;
  rtl?: boolean;
  forceEditToken?: number;
  forceSaveToken?: number;
  forceCancelToken?: number;
  showActions?: boolean;
  onEditingChange?: (editing: boolean) => void;
}) {
  const countryContext = useMemo(() => resolveCustomerCountryBankContext(), []);
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState<CustomerBankAccountsState>(() => buildDefaultState(copy, countryContext));
  const [draft, setDraft] = useState<CustomerBankAccountsState>(() => buildDefaultState(copy, countryContext));

  useEffect(() => {
    const defaults = buildDefaultState(copy, countryContext);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setState(defaults);
        setDraft(defaults);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<CustomerBankAccountsState>;
      const nextState: CustomerBankAccountsState = {
        legalCompanyName: parsed.legalCompanyName || '',
        billingAddress: parsed.billingAddress || '',
        taxId: parsed.taxId || '',
        accounts: defaults.accounts.map((account) => {
          const incoming = parsed.accounts?.find((item) => item?.id === account.id);
          return {
            ...account,
            ...incoming,
            accountType: account.accountType,
            currency: incoming?.currency || account.currency,
            primaryUse: account.primaryUse,
          };
        }),
      };
      setState(nextState);
      setDraft(nextState);
    } catch (error) {
      console.warn('[CustomerBankAccountsCenter] Failed to read local cache:', error);
      setState(defaults);
      setDraft(defaults);
    }
  }, [copy, countryContext]);

  useEffect(() => {
    if (forceEditToken) {
      setIsEditing(true);
    }
  }, [forceEditToken]);

  useEffect(() => {
    if (forceSaveToken && isEditing) {
      persist();
    }
  }, [forceSaveToken]);

  useEffect(() => {
    if (forceCancelToken && isEditing) {
      cancel();
    }
  }, [forceCancelToken]);

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  const fieldClass = `w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 ${rtl ? 'text-right' : ''}`;

  const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setState(draft);
    setIsEditing(false);
    toast.success(copy.bank.saveSuccess);
  };

  const cancel = () => {
    setDraft(state);
    setIsEditing(false);
  };

  const updateAccount = (id: BankAccountRecord['id'], key: keyof BankAccountRecord, value: string) => {
    setDraft((prev) => ({
      ...prev,
      accounts: prev.accounts.map((account) => (
        account.id === id ? { ...account, [key]: value } : account
      )),
    }));
  };

  return (
    <div className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
      {showActions && (
        <div className={`flex items-center gap-2 ${rtl ? 'justify-end' : ''}`}>
          {isEditing ? (
            <>
              <button
                onClick={cancel}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                {copy.bank.cancel}
              </button>
              <button
                onClick={persist}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Save className="h-4 w-4" />
                {copy.bank.save}
              </button>
            </>
          ) : showActions ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              {copy.bank.edit}
            </button>
          ) : null}
        </div>
      )}

      <CustomerMasterSection title={copy.bank.sectionSettlement} titleEN="Bank Accounts" icon={<CreditCard className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {draft.accounts.filter((item) => item.id !== 'private').map((account, index) => {
            const current = state.accounts[index] || account;
            const accent = account.id === 'primary'
              ? { card: 'border-red-100', header: 'bg-red-50 text-red-700 border-red-100', badge: 'bg-red-100 text-red-600', flag: countryContext.flag }
              : { card: 'border-blue-100', header: 'bg-blue-50 text-blue-700 border-blue-100', badge: 'bg-blue-100 text-blue-600', flag: '🇺🇸' };
            return (
              <div key={`top-${account.id}`} className={`overflow-hidden rounded-xl border ${accent.card}`}>
                <div className={`flex items-center gap-2 border-b px-4 py-3 ${accent.header}`}>
                  <span className="text-lg leading-none">{accent.flag}</span>
                  <div>
                    <p className="text-[12px] font-bold leading-tight">{current.accountType}</p>
                    <p className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${accent.badge}`}>
                      {current.currency || copy.bank.notSet} · {current.primaryUse || copy.bank.notSet}
                    </p>
                  </div>
                </div>
                <div className="bg-white px-4 py-2">
                  {([
                    ['bankName', copy.bank.bankName, copy.bank.placeholders.bankName],
                    ['branchAddress', copy.bank.branchAddress, copy.bank.placeholders.branchAddress],
                    ['accountName', copy.bank.accountName, copy.bank.placeholders.accountName],
                    ['accountNumber', copy.bank.accountNumber, copy.bank.placeholders.accountNumber],
                    ['swiftCode', copy.bank.swiftCode, copy.bank.placeholders.swiftCode],
                    ['paymentNote', copy.bank.paymentNote, copy.bank.placeholders.paymentNote],
                  ] as Array<[keyof BankAccountRecord, string, string]>).map(([key, label, placeholder]) => (
                    <CustomerSingleRow key={`top-row-${account.id}-${key}`} label={label}>
                      {isEditing ? (
                        <input
                          className={fieldClass}
                          value={account[key]}
                          placeholder={placeholder}
                          onChange={(event) => updateAccount(account.id, key, event.target.value)}
                        />
                      ) : (
                        <CustomerValue value={String(current[key] || copy.bank.notSet)} mono={key === 'accountNumber' || key === 'swiftCode' || key === 'iban'} />
                      )}
                    </CustomerSingleRow>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CustomerMasterSection>

      {(() => {
        const privateDraft = draft.accounts.find((item) => item.id === 'private');
        const privateState = state.accounts.find((item) => item.id === 'private') || privateDraft;
        if (!privateDraft || !privateState) return null;
        return (
          <>
            <div className="flex items-start gap-2 px-1 text-[11px] text-slate-400">
              <Languages className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
              <span>{copy.bank.quotationHint}</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3 text-amber-700">
                <span className="text-lg leading-none">{countryContext.flag}</span>
                <div>
                  <p className="text-[12px] font-bold leading-tight">{privateState.accountType}</p>
                  <p className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                    {privateState.currency || copy.bank.notSet} · {privateState.primaryUse || copy.bank.notSet}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 bg-white px-4 py-2 md:grid-cols-2">
                <div>
                  {([
                    ['accountName', copy.bank.accountName, copy.bank.placeholders.accountName],
                    ['bankName', copy.bank.bankName, copy.bank.placeholders.bankName],
                    ['branchAddress', copy.bank.branchAddress, copy.bank.placeholders.branchAddress],
                  ] as Array<[keyof BankAccountRecord, string, string]>).map(([key, label, placeholder]) => (
                    <CustomerSingleRow key={`private-left-${key}`} label={label}>
                      {isEditing ? (
                        <input
                          className={fieldClass}
                          value={privateDraft[key]}
                          placeholder={placeholder}
                          onChange={(event) => updateAccount(privateDraft.id, key, event.target.value)}
                        />
                      ) : (
                        <CustomerValue value={String(privateState[key] || copy.bank.notSet)} />
                      )}
                    </CustomerSingleRow>
                  ))}
                </div>
                <div>
                  {([
                    ['accountNumber', copy.bank.accountNumber, copy.bank.placeholders.accountNumber],
                    ['remark', copy.bank.remark, copy.bank.placeholders.remark],
                    ['paymentNote', copy.bank.paymentNote, copy.bank.placeholders.paymentNote],
                  ] as Array<[keyof BankAccountRecord, string, string]>).map(([key, label, placeholder]) => (
                    <CustomerSingleRow key={`private-right-${key}`} label={label}>
                      {isEditing ? (
                        <input
                          className={fieldClass}
                          value={privateDraft[key]}
                          placeholder={placeholder}
                          onChange={(event) => updateAccount(privateDraft.id, key, event.target.value)}
                        />
                      ) : (
                        <CustomerValue value={String(privateState[key] || copy.bank.notSet)} mono={key === 'accountNumber'} />
                      )}
                    </CustomerSingleRow>
                  ))}
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
