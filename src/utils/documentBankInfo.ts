type LooseBankInfo = {
  bankName?: string;
  bankNameEN?: string;
  bankNameCN?: string;
  accountName?: string;
  accountNameEN?: string;
  accountNameCN?: string;
  accountNumber?: string;
  swift?: string;
  swiftCode?: string;
  bankAddress?: string;
  currency?: string;
  paymentNote?: string;
  routingNumber?: string;
  iban?: string;
} | null | undefined;

type LooseAdminOrg = {
  bankUSD?: LooseBankInfo;
} | null | undefined;

export function resolveUsdSellerBankInfo(
  adminOrg: LooseAdminOrg,
  existingBankInfo?: LooseBankInfo,
  fallbackAccountName = '',
) {
  const usdBank = adminOrg?.bankUSD;
  return {
    bankName: String(
      usdBank?.bankName ||
        usdBank?.bankNameEN ||
        usdBank?.bankNameCN ||
        existingBankInfo?.bankName ||
        existingBankInfo?.bankNameEN ||
        existingBankInfo?.bankNameCN ||
        '',
    ),
    accountName: String(
      usdBank?.accountName ||
        usdBank?.accountNameEN ||
        usdBank?.accountNameCN ||
        existingBankInfo?.accountName ||
        existingBankInfo?.accountNameEN ||
        existingBankInfo?.accountNameCN ||
        fallbackAccountName ||
        '',
    ),
    accountNumber: String(usdBank?.accountNumber || existingBankInfo?.accountNumber || ''),
    swiftCode: String(usdBank?.swift || usdBank?.swiftCode || existingBankInfo?.swiftCode || existingBankInfo?.swift || ''),
    bankAddress: String(usdBank?.bankAddress || existingBankInfo?.bankAddress || ''),
    currency: String(existingBankInfo?.currency || 'USD'),
    paymentNote: String(existingBankInfo?.paymentNote || usdBank?.paymentNote || ''),
    routingNumber: String(existingBankInfo?.routingNumber || ''),
    iban: String(existingBankInfo?.iban || ''),
  };
}
