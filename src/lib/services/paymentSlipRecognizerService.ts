import { createWorker } from 'tesseract.js';

export type PaymentSlipScanExtracted = {
  payee: string | null;
  amount: number | null;
  currency: string | null;
  paidAt: string | null;
  method: string | null;
  bankRef: string | null;
  bankName: string | null;
  accountNumber: string | null;
  remarks: string | null;
  warnings: string[];
};

export type PaymentSlipScanResult = {
  success: boolean;
  extracted: PaymentSlipScanExtracted;
  fileName: string;
  model?: string;
  confidence?: number;
};

type OcrTextPayload = {
  text: string;
  confidence: number;
  model: string;
  extracted?: Partial<PaymentSlipScanExtracted> & {
    payerAccountNumber?: string | null;
    payeeAccountNumber?: string | null;
    payerName?: string | null;
    payeeName?: string | null;
    payerBankName?: string | null;
    payeeBankName?: string | null;
  };
};

function getPaddleOcrEndpoint() {
  const raw = String(import.meta.env.VITE_PADDLE_OCR_ENDPOINT || '').trim();
  return raw || null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function fileToObjectUrl(file: File) {
  return URL.createObjectURL(file);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

function normalizeOcrLabelText(text: string) {
  return text
    .replace(/[（）()]/g, '')
    .replace(/\s+/g, '')
    .replace(/户/g, '户')
    .replace(/賬/g, '账');
}

function sanitizePayeeText(value: string | null) {
  if (!value) return null;

  const cleaned = value
    .replace(/^[\s:：;；,.，·•-]+/g, '')
    .replace(/收\s*款\s*(人|方|单\s*位)?\s*(名\s*称)?\s*[:：]?/g, '')
    .replace(/户\s*名\s*[:：]?/g, '')
    .replace(/^[A-Z\s]+(?=收|福|上|北|广|深)/i, '')
    .replace(/^[\s:：;；,.，·•-]+/g, '')
    .replace(/(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '')
    .trim();

  return cleaned || null;
}

const OCR_FIELD_LABELS = [
  '付款人账号',
  '付款账号',
  '付款人账户',
  '付款账户',
  '收款人账号',
  '收款账号',
  '收款人名称',
  '收款人',
  '收款方名称',
  '收款方',
  '收款单位',
  '付款人名称',
  '付款人开户行',
  '付款开户行',
  '收款人开户行',
  '收款开户行',
  '金额',
  '交易金额',
  '付款金额',
  '日期',
  '付款日期',
  '交易日期',
  '交易流水号',
  '流水号',
  '回单号',
  '参考号',
  '业务种类',
  '业务类型',
  '业务标识号',
  '收支申报号',
  '接收行号',
  '接收行名称',
  '扣账账号',
  '扣账户名',
  '用途',
  '附言',
];

function truncateAtNextLabel(value: string) {
  let nextIndex = value.length;

  for (const label of OCR_FIELD_LABELS) {
    const patterns = [label, `${label}:`, `${label}：`];
    for (const pattern of patterns) {
      const index = value.indexOf(pattern);
      if (index > 0 && index < nextIndex) {
        nextIndex = index;
      }
    }
  }

  return value.slice(0, nextIndex).trim();
}

function extractLabeledValue(text: string, labels: string[]) {
  return extractAllLabeledValues(text, labels)[0] || null;
}

function extractAllLabeledValues(text: string, labels: string[]) {
  const normalizedLines = text.split('\n').map((line) => ({
    raw: line.trim(),
    normalized: normalizeOcrLabelText(line),
  }));
  const values: string[] = [];
  const seen = new Set<string>();

  const pushValue = (value: string | null) => {
    const normalized = truncateAtNextLabel(String(value || '').trim());
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    values.push(normalized);
  };

  for (const { raw, normalized } of normalizedLines) {
    for (const label of labels) {
      const normalizedLabel = normalizeOcrLabelText(label);
      const index = normalized.indexOf(normalizedLabel);
      if (index === -1) continue;

      const rawIndex = raw.indexOf(label.replace(/\s+/g, ''));
      if (rawIndex >= 0) {
        const remainder = raw.slice(rawIndex + label.length);
        const colonMatch = remainder.match(/^\s*[:：]\s*(.*)$/);
        pushValue((colonMatch ? colonMatch[1] : remainder).trim());
      }

      const labelMatch = raw.match(new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:：]\\s*(.+)`));
      if (labelMatch?.[1]) {
        pushValue(labelMatch[1].trim());
      }

      const parts = raw.split(/[:：]/);
      if (parts.length >= 2 && normalized.startsWith(normalizedLabel)) {
        pushValue(parts.slice(1).join(':').trim());
      }

      pushValue(raw.slice(index + normalizedLabel.length).replace(/^[:：\s]*/, '').trim());
    }
  }

  return values;
}

function detectCurrency(text: string, amountLine?: string | null) {
  const priorityText = [amountLine, text].filter(Boolean).join('\n').toUpperCase();
  if (priorityText.includes('CNY') || priorityText.includes('RMB') || priorityText.includes('人民币') || priorityText.includes('¥')) return 'CNY';
  if (priorityText.includes('USD') || priorityText.includes('$')) return 'USD';
  if (priorityText.includes('EUR') || priorityText.includes('€')) return 'EUR';
  if (priorityText.includes('GBP') || priorityText.includes('£')) return 'GBP';
  if (priorityText.includes('HKD')) return 'HKD';
  if (priorityText.includes('JPY') || priorityText.includes('日元')) return 'JPY';

  const upper = text.toUpperCase();
  if (upper.includes('USD') || text.includes('$')) return 'USD';
  if (upper.includes('EUR') || text.includes('€')) return 'EUR';
  if (upper.includes('GBP') || text.includes('£')) return 'GBP';
  if (upper.includes('HKD')) return 'HKD';
  if (upper.includes('JPY') || text.includes('JPY') || text.includes('日元')) return 'JPY';
  if (upper.includes('CNY') || text.includes('RMB') || text.includes('人民币') || text.includes('¥')) return 'CNY';
  return null;
}

function detectMethod(text: string) {
  const upper = text.toUpperCase();
  if (upper.includes('T/T') || upper.includes(' TT ') || text.includes('电汇')) return 'T/T';
  if (upper.includes('L/C') || upper.includes('LC') || text.includes('信用证')) return 'L/C';
  if (upper.includes('CASH') || text.includes('现金')) return 'CASH';
  if (upper.includes('CHEQUE') || text.includes('支票')) return 'CHEQUE';
  return null;
}

function detectBankName(text: string) {
  const payerBank = extractLabeledValue(text, ['付款人开户行', '付款开户行']);
  if (payerBank) return payerBank;

  const bankPatterns = [
    /中国银行[^\n]*/g,
    /工商银行[^\n]*/g,
    /建设银行[^\n]*/g,
    /农业银行[^\n]*/g,
    /交通银行[^\n]*/g,
    /招商银行[^\n]*/g,
    /浦发银行[^\n]*/g,
    /平安银行[^\n]*/g,
    /Bank of China[^\n]*/gi,
    /Industrial and Commercial Bank of China[^\n]*/gi,
    /China Construction Bank[^\n]*/gi,
    /Agricultural Bank of China[^\n]*/gi,
    /Bank of Communications[^\n]*/gi,
  ];

  for (const pattern of bankPatterns) {
    const matched = text.match(pattern)?.[0]?.trim();
    if (matched) return matched;
  }

  return null;
}

function detectBankRef(text: string) {
  const labeledRef = extractLabeledValue(text, ['交易流水号', '流水号', '回单号', '参考号']);
  if (labeledRef) return labeledRef.replace(/[^\dA-Z-]/gi, '').trim();

  const patterns = [
    /\b(?:TXN|REF|TRX)[:：\s-]*([A-Z0-9-]{6,})/i,
    /\b([A-Z]{2,6}\d{6,})\b/,
    /\b(\d{10,})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }

  return null;
}

function detectAccountNumber(text: string) {
  const payerAccount = extractLabeledValue(text, ['付款人账号', '付款账号', '付款人账户', '付款账户']);
  if (payerAccount) {
    const normalized = payerAccount.replace(/[^\d]/g, '').trim();
    if (normalized.length >= 8) return normalized;
  }

  const patterns = [
    /(?:账号|帐户|账户|ACCOUNT(?: NO)?)[^0-9A-Z]*([0-9 ]{8,})/i,
    /\b(\d{10,24})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.replace(/\s+/g, '').trim();
    if (value && value.length >= 8) return value;
  }

  return null;
}

function detectPaidAt(text: string) {
  const labeledDate = extractLabeledValue(text, ['日期', '付款日期', '交易日期']);
  if (labeledDate) {
    const normalizedDate = labeledDate.replace(/[年/.]/g, '-').replace(/月/g, '-').replace(/日/g, '').trim();
    const dateOnlyMatch = normalizedDate.match(/(\d{4}-\d{1,2}-\d{1,2})/);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[1]} 00:00`;
    }
  }

  const normalized = text.replace(/[年/.]/g, '-').replace(/月/g, '-').replace(/日/g, '');
  const patterns = [
    /(\d{4}-\d{1,2}-\d{1,2})\s+(\d{1,2}:\d{2})/,
    /(\d{4}-\d{1,2}-\d{1,2})/,
    /(\d{4})(\d{2})(\d{2})\s*(\d{2}:\d{2})?/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    if (pattern === patterns[0]) {
      return `${match[1]} ${match[2]}`;
    }
    if (pattern === patterns[1]) {
      return `${match[1]} 00:00`;
    }
    return `${match[1]}-${match[2]}-${match[3]} ${match[4] || '00:00'}`;
  }

  return null;
}

function detectAmount(text: string) {
  const amountLine = extractLabeledValue(text, ['金额', '交易金额', '付款金额']);
  if (amountLine) {
    const labeledMatch = amountLine.match(/(?:CNY|USD|EUR|GBP|HKD|JPY|RMB|¥|￥|\$|€|£)?\s*([0-9]{1,3}(?:[,，][0-9]{3})*(?:\.\d{1,2})|[0-9]+(?:\.\d{1,2})?)/i);
    if (labeledMatch?.[1]) {
      const value = Number(labeledMatch[1].replace(/[,，]/g, '').trim());
      if (!Number.isNaN(value) && value > 0) {
        return value;
      }
    }
  }

  const amountRegex = /(?:USD|EUR|GBP|CNY|HKD|JPY|RMB|¥|￥|\$|€|£)?\s*([0-9]{1,3}(?:[,，][0-9]{3})*(?:\.\d{1,2})|[0-9]{4,}(?:\.\d{1,2})?)/g;
  const candidates: number[] = [];

  for (const match of text.matchAll(amountRegex)) {
    const raw = String(match[1] || '').replace(/[,，]/g, '').trim();
    const value = Number(raw);
    if (!Number.isNaN(value) && value > 0) {
      candidates.push(value);
    }
  }

  if (!candidates.length) return null;
  const filtered = candidates.filter((value) => value < 100000000);
  const target = filtered.length ? filtered : candidates;
  return [...target].sort((a, b) => b - a)[0];
}

function looksLikeAccountValue(value: string | null) {
  if (!value) return false;

  const compact = value.replace(/\s+/g, '');
  if (!compact) return false;
  if (/账号|账户|帐户/i.test(compact)) return true;

  const digitsOnly = compact.replace(/[^\d]/g, '');
  if (digitsOnly.length >= 8 && digitsOnly.length >= compact.length * 0.6) return true;

  return false;
}

function looksLikeEntityName(value: string | null) {
  if (!value) return false;

  const compact = sanitizePayeeText(value)?.replace(/\s+/g, '') || '';
  if (!compact || compact.length < 4) return false;
  if (looksLikeAccountValue(compact)) return false;
  if (/[0-9]{6,}/.test(compact)) return false;
  if (/金额|日期|流水|参考号|账号|账户|开户地址|付款|收款|附言|用途|币种|回单|电子回单|交易/i.test(compact)) return false;
  if (/银行|支行|农信|信用社|BANK/i.test(compact)) return false;

  return /公司|集团|工厂|厂|中心|管理处|管理中心|事务所|酒店|学院|学校|超市|商行|门诊|医院|局|所|物业|公积金|税务/.test(compact);
}

function detectPayeeByEntityLines(text: string) {
  const lines = text
    .split('\n')
    .map((line) => sanitizePayeeText(line))
    .filter(Boolean) as string[];

  const candidates = lines.filter((line) => looksLikeEntityName(line));
  if (!candidates.length) return null;

  const ranked = [...candidates].sort((a, b) => {
    const aScore = (a.includes('公司') ? 4 : 0) + (a.includes('物业') ? 2 : 0) + a.length;
    const bScore = (b.includes('公司') ? 4 : 0) + (b.includes('物业') ? 2 : 0) + b.length;
    return bScore - aScore;
  });

  return ranked[0] || null;
}

function detectPayeeByEntityBlocks(text: string) {
  const normalizedText = text
    .replace(/\r/g, '\n')
    .replace(/(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '')
    .replace(/\n+/g, ' ');

  const matches = [
    ...normalizedText.matchAll(/([\u4e00-\u9fffA-Za-z（）()·]{4,40}?(?:有限责任公司|股份有限公司|有限公司|公司|工厂|厂|物业管理处|物业管理中心|物业管理|管理中心|管理处|事务所|酒店|医院|学校|商行|超市|中心|集团|税务局|公积金管理中心))/g),
  ]
    .map((match) => sanitizePayeeText(match[1]))
    .filter((value): value is string => Boolean(value) && looksLikeEntityName(value));

  if (!matches.length) return null;

  return [...matches].sort((a, b) => {
    const aScore = (a.includes('有限公司') ? 5 : 0) + (a.includes('公司') ? 3 : 0) + (a.includes('物业') ? 2 : 0) + a.length;
    const bScore = (b.includes('有限公司') ? 5 : 0) + (b.includes('公司') ? 3 : 0) + (b.includes('物业') ? 2 : 0) + b.length;
    return bScore - aScore;
  })[0];
}

function detectPayee(text: string) {
  const labeledPayees = extractAllLabeledValues(text, [
    '收款人名称',
    '收款方名称',
    '收款单位',
    '收款方',
    '收款人',
    '收款户名',
    '收款人户名',
    '对方户名',
    '对方名称',
    '对方单位',
    '收款对象',
    '户名',
  ]);
  for (const candidate of labeledPayees) {
    const sanitizedCandidate = sanitizePayeeText(candidate);
    if (sanitizedCandidate && !looksLikeAccountValue(sanitizedCandidate)) {
      return sanitizedCandidate;
    }
  }

  const patterns = [
    /(?:收款人名称|收款方名称|收款单位|收款户名|收款人户名|对方户名|对方名称|对方单位|户名|BENEFICIARY NAME)[:：\s]*([^\n]+)/i,
    /(?:收款方|收款对象|PAYEE|BENEFICIARY)[:：\s]*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = sanitizePayeeText(match?.[1]?.trim() || null);
    if (value && value.length >= 2 && !looksLikeAccountValue(value)) return value;
  }

  const looseEntity = detectPayeeByEntityLines(text);
  if (looseEntity) return looseEntity;

  const blockEntity = detectPayeeByEntityBlocks(text);
  if (blockEntity) return blockEntity;

  return null;
}

function buildWarnings(text: string, confidence: number, extracted: Omit<PaymentSlipScanExtracted, 'warnings'>) {
  const warnings: string[] = [];

  if (confidence < 55) {
    warnings.push('图片文字识别置信度较低，请重点核对金额、日期和流水号。');
  }

  if (!extracted.payee) warnings.push('未稳定识别到收款方，请人工补充。');
  if (extracted.amount == null) warnings.push('未稳定识别到付款金额，请人工补充。');
  if (!extracted.paidAt) warnings.push('未稳定识别到付款时间，请人工补充。');
  if (!extracted.bankRef) warnings.push('未稳定识别到流水号/回单号，请人工补充。');
  if (!detectBankName(text)) warnings.push('未稳定识别到银行名称，请人工补充。');

  return warnings;
}

async function recognizeTextFromImage(file: File) {
  const worker = await withTimeout(createWorker('chi_sim+eng'), 15000, 'OCR 引擎初始化超时，请稍后重试');
  const objectUrl = fileToObjectUrl(file);

  try {
    const result = await withTimeout(worker.recognize(objectUrl), 45000, '本地 OCR 识别超时，请换一张更清晰的水单截图');
    return {
      text: normalizeWhitespace(String(result.data.text || '')),
      confidence: Number(result.data.confidence || 0),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
    await worker.terminate();
  }
}

async function recognizeTextViaPaddleApi(file: File): Promise<OcrTextPayload> {
  const endpoint = getPaddleOcrEndpoint();
  if (!endpoint) {
    throw new Error('PaddleOCR 未配置');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await withTimeout(
    fetch(endpoint, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    }),
    120000,
    'PaddleOCR 接口响应超时，请稍后重试',
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        text?: string;
        confidence?: number | null;
        model?: string;
        message?: string;
        details?: string;
        extracted?: OcrTextPayload['extracted'];
      }
    | null;

  if (!response.ok) {
    const message = payload?.message || 'PaddleOCR 接口调用失败';
    const details = payload?.details ? `：${payload.details}` : '';
    throw new Error(`${message}${details}`);
  }

  const text = normalizeWhitespace(String(payload?.text || ''));
  if (!text) {
    throw new Error('PaddleOCR 未返回可用文字，请换一张更清晰的付款水单截图');
  }

  return {
    text,
    confidence: Number(payload?.confidence || 0),
    model: String(payload?.model || 'paddleocr'),
    extracted: payload?.extracted,
  };
}

function buildScanResultFromText(
  fileName: string,
  text: string,
  confidence: number,
  model: string,
  preferredExtracted?: OcrTextPayload['extracted'],
): PaymentSlipScanResult {
  const amountLine = extractLabeledValue(text, ['金额', '交易金额', '付款金额']);
  const payeeFromStructured = preferredExtracted?.payeeName ? sanitizePayeeText(preferredExtracted.payeeName) : null;
  const extractedBase = {
    payee: payeeFromStructured || detectPayee(text),
    amount: preferredExtracted?.amount ?? detectAmount(text),
    currency: preferredExtracted?.currency || detectCurrency(text, amountLine),
    paidAt: preferredExtracted?.paidAt || detectPaidAt(text),
    method: preferredExtracted?.method || detectMethod(text),
    bankRef: preferredExtracted?.bankRef || detectBankRef(text),
    bankName: preferredExtracted?.payeeBankName || preferredExtracted?.bankName || detectBankName(text),
    accountNumber: preferredExtracted?.payeeAccountNumber || preferredExtracted?.accountNumber || detectAccountNumber(text),
    remarks: `${model === 'paddleocr' ? 'PaddleOCR' : '本地 OCR'} 识别完成，置信度 ${Math.round(confidence)}%。`,
  };

  return {
    success: true,
    fileName,
    model,
    confidence,
    extracted: {
      ...extractedBase,
      warnings: buildWarnings(text, confidence, extractedBase),
    },
  };
}

export async function scanPaymentSlip(file: File): Promise<PaymentSlipScanResult> {
  const normalizedType = String(file.type || '').toLowerCase();
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024;

  if (!supportedTypes.includes(normalizedType)) {
    throw new Error('当前免费识别仅支持 JPG、PNG、WebP 格式的付款水单');
  }

  if (file.size > maxFileSize) {
    throw new Error('付款水单图片请控制在 5MB 以内，便于本地识别');
  }

  const paddleEndpoint = getPaddleOcrEndpoint();
  if (paddleEndpoint) {
    try {
      const remote = await recognizeTextViaPaddleApi(file);
      return buildScanResultFromText(file.name, remote.text, remote.confidence, remote.model, remote.extracted);
    } catch (remoteError) {
      const { text, confidence } = await recognizeTextFromImage(file);
      if (!text) {
        throw new Error('未识别到可用文字，请换一张更清晰的付款水单截图');
      }

      const result = buildScanResultFromText(file.name, text, confidence, 'local-tesseract');
      if (remoteError instanceof Error && remoteError.message !== 'PaddleOCR 未配置') {
        result.extracted.warnings.unshift(`PaddleOCR 不可用，已回退本地识别：${remoteError.message}`);
      }
      return result;
    }
  }

  const { text, confidence } = await recognizeTextFromImage(file);
  if (!text) {
    throw new Error('未识别到可用文字，请换一张更清晰的付款水单截图');
  }

  return buildScanResultFromText(file.name, text, confidence, 'local-tesseract');
}
