import { createWorker } from 'tesseract.js';

export type SupplierDocumentExtracted = {
  name: string | null;
  nameEn: string | null;
  businessLicense: string | null;
  address: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  certifications: string | null;
  warnings: string[];
};

export type SupplierDocumentScanResult = {
  success: boolean;
  fileName: string;
  model?: string;
  confidence?: number;
  extracted: SupplierDocumentExtracted;
};

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

function normalizeWhitespace(value: string) {
  return value
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function compactChineseSpacing(value: string) {
  return value.replace(/(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '');
}

function sanitizeFieldValue(value: string | null) {
  if (!value) return null;
  const cleaned = compactChineseSpacing(
    value
      .replace(/^[\s:：;；,.，·•-]+/g, '')
      .replace(/[|｜]{2,}/g, ' ')
      .trim(),
  );
  return cleaned || null;
}

function normalizeLabel(value: string) {
  return value.replace(/[（）()]/g, '').replace(/\s+/g, '');
}

function looksLikeAddressLine(value: string) {
  const text = compactChineseSpacing(String(value || '').trim());
  if (!text || text.length < 6) return false;
  return /(省|市|区|县|镇|乡|街道|路|街|号|村|工业园|开发区|大厦|广场|楼|层|室|园区)/.test(text);
}

function looksLikeLabelOnlyLine(value: string) {
  const text = normalizeLabel(String(value || '').trim());
  if (!text) return false;
  return /^(名称|企业名称|公司名称|英文名称|英文名|法定代表人|联系人|负责人|联系电话|电话|手机|联系方式|统一社会信用代码|营业执照号|注册号|住所|地址|营业场所|经营场所|注册地址|月产能|认证资质)$/.test(text);
}

function extractLabeledValue(text: string, labels: string[]) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const normalizedLine = normalizeLabel(rawLine);
    for (const label of labels) {
      const normalizedLabel = normalizeLabel(label);
      if (!normalizedLine.includes(normalizedLabel)) continue;

      const sameLineMatch = rawLine.match(
        new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:：]?\\s*(.+)$`),
      );
      if (sameLineMatch?.[1]) {
        return sanitizeFieldValue(sameLineMatch[1]);
      }

      const index = normalizedLine.indexOf(normalizedLabel);
      if (index === 0) {
        const candidate = rawLine.replace(/^[^:：]*[:：]?/, '').trim();
        const sanitized = sanitizeFieldValue(candidate);
        if (sanitized && sanitized !== rawLine) return sanitized;

        const nextLine = lines[lineIndex + 1];
        if (nextLine) {
          const nextSanitized = sanitizeFieldValue(nextLine);
          if (nextSanitized && !labels.some((item) => normalizeLabel(nextSanitized).includes(normalizeLabel(item)))) {
            return nextSanitized;
          }
        }
      }
    }
  }

  return null;
}

function extractByRegex(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return sanitizeFieldValue(match?.[1]?.trim() || null);
}

function detectSupplierName(text: string) {
  const labeled = extractLabeledValue(text, ['名称', '企业名称', '公司名称', '名称Name', '商户名称']);
  if (labeled) return labeled.replace(/^收款人名称[:：]?\s*/i, '').trim();

  const match = text.match(/([\u4e00-\u9fffA-Za-z（）()·\s]{4,}(?:公司|工厂|厂|集团|中心|商行|事务所|门市部))/);
  return sanitizeFieldValue(match?.[1] || null);
}

function detectEnglishName(text: string) {
  const labeled = extractLabeledValue(text, ['英文名称', '英文名', 'Name']);
  if (labeled) return labeled;

  const lines = text.split('\n').map((line) => line.trim());
  const englishLine = lines.find((line) =>
    /[A-Za-z]/.test(line) &&
    /(CO\.?,?\s*LTD|LIMITED|COMPANY|FACTORY|INDUSTRIAL|TRADING|ELECTRICAL)/i.test(line),
  );

  return sanitizeFieldValue(englishLine || null);
}

function detectBusinessLicense(text: string) {
  const labeled = extractLabeledValue(text, ['统一社会信用代码', '营业执照号', '注册号']);
  const normalizedLabeled = labeled?.replace(/[^0-9A-Z]/gi, '').toUpperCase() || null;
  if (normalizedLabeled && normalizedLabeled.length >= 15) return normalizedLabeled;

  const regexMatch = text.match(/\b([0-9A-Z]{18})\b/);
  return regexMatch?.[1] || null;
}

function detectAddress(text: string) {
  const labels = ['住所', '地址', '营业场所', '经营场所', '注册地址'];
  const labeled =
    extractLabeledValue(text, labels) ||
    extractByRegex(text, /(?:住所|地址|营业场所|经营场所|注册地址)\s*[:：]?\s*([^\n]+)/) ||
    extractByRegex(text, /(?:住所|地址|营业场所|经营场所|注册地址)\s*[:：]?\s*\n\s*([^\n]+)/);
  if (labeled) return labeled;

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!labels.some((label) => normalizeLabel(line).includes(normalizeLabel(label)))) continue;

    const collected: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = sanitizeFieldValue(lines[cursor]);
      if (!candidate) continue;
      if (looksLikeLabelOnlyLine(candidate)) break;
      if (!looksLikeAddressLine(candidate) && collected.length === 0) continue;
      collected.push(candidate);
      if (collected.length >= 2) break;
    }

    if (collected.length > 0) {
      return sanitizeFieldValue(collected.join(' '));
    }
  }

  const addressLine = lines.find((line) => looksLikeAddressLine(line));
  return sanitizeFieldValue(addressLine || null);
}

function detectContact(text: string) {
  return (
    extractLabeledValue(text, ['法定代表人', '联系人', '负责人']) ||
    extractByRegex(text, /(?:法定代表人|联系人|负责人)\s*[:：]?\s*([^\n]+)/)
  );
}

function detectPhone(text: string, businessLicense?: string | null) {
  const normalizePhoneCandidate = (value: string | null) => {
    if (!value) return null;
    const compact = value.replace(/\s+/g, '').trim();

    if (/^[0-9A-Z]{15,18}$/i.test(compact)) return null;
    if (/^\d{15,18}$/.test(compact)) return null;

    const normalizedBusinessLicense = String(businessLicense || '').replace(/[^0-9A-Z]/gi, '').toUpperCase();
    const upperCompact = compact.replace(/[^0-9A-Z]/gi, '').toUpperCase();
    if (normalizedBusinessLicense && upperCompact && (
      upperCompact === normalizedBusinessLicense ||
      normalizedBusinessLicense.startsWith(upperCompact) ||
      upperCompact.startsWith(normalizedBusinessLicense)
    )) {
      return null;
    }

    const mobile = compact.match(/(?:\+?86[-\s]?)?(1[3-9]\d{9})/);
    if (mobile?.[1]) return mobile[1];

    const landline = compact.match(/((?:0\d{2,4}[-\s]?)\d{7,8})/);
    if (landline?.[1]) return landline[1].replace(/\s+/g, '');

    return null;
  };

  const labeled = extractLabeledValue(text, ['联系电话', '电话', '手机', '联系方式']);
  const normalizedLabeled = normalizePhoneCandidate(labeled);
  if (normalizedLabeled) return normalizedLabeled;

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (!/(电话|手机|联系方式|TEL|Tel|tel|Mobile|MOB|mob)/.test(line) && !/[-+()]/.test(line)) {
      continue;
    }
    const normalized = normalizePhoneCandidate(line);
    if (normalized) return normalized;
  }

  return null;
}

function detectEmail(text: string) {
  return text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] || null;
}

function detectCertifications(text: string) {
  const tokens = ['ISO9001', 'ISO14001', 'ISO45001', 'CE', 'ROHS', 'ROHS2', 'FCC', 'UL'];
  const found = tokens.filter((token) => new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text));
  return found.length ? found.join(', ') : null;
}

function buildWarnings(confidence: number, extracted: Omit<SupplierDocumentExtracted, 'warnings'>) {
  const warnings: string[] = [];

  if (confidence < 55) {
    warnings.push('图片识别置信度偏低，请重点核对供应商名称、营业执照号和地址。');
  }
  if (!extracted.name) warnings.push('未稳定识别到供应商名称，请人工补充。');
  if (!extracted.businessLicense) warnings.push('未稳定识别到营业执照号，请人工补充。');
  if (!extracted.address) warnings.push('未稳定识别到地址，请人工补充。');
  if (!extracted.phone) warnings.push('未稳定识别到联系电话，请人工补充。');

  return warnings;
}

async function recognizeTextFromImage(file: File) {
  const worker = await withTimeout(createWorker('chi_sim+eng'), 15000, 'OCR 引擎初始化超时，请稍后重试');
  const objectUrl = URL.createObjectURL(file);

  try {
    const result = await withTimeout(worker.recognize(objectUrl), 45000, '本地 OCR 识别超时，请换一张更清晰的营业执照或企业资料图');
    return {
      text: normalizeWhitespace(String(result.data.text || '')),
      confidence: Number(result.data.confidence || 0),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
    await worker.terminate();
  }
}

export async function scanSupplierDocument(file: File): Promise<SupplierDocumentScanResult> {
  const normalizedType = String(file.type || '').toLowerCase();
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024;

  if (!supportedTypes.includes(normalizedType)) {
    throw new Error('当前 OCR 仅支持 JPG、PNG、WebP 格式的营业执照或供应商资料截图');
  }

  if (file.size > maxFileSize) {
    throw new Error('识别图片请控制在 5MB 以内，便于本地快速识别');
  }

  const { text, confidence } = await recognizeTextFromImage(file);
  if (!text) {
    throw new Error('未识别到可用文字，请换一张更清晰的营业执照或供应商资料图');
  }

  const businessLicense = detectBusinessLicense(text);
  const extractedBase = {
    name: detectSupplierName(text),
    nameEn: detectEnglishName(text),
    businessLicense,
    address: detectAddress(text),
    contact: detectContact(text),
    phone: detectPhone(text, businessLicense),
    email: detectEmail(text),
    certifications: detectCertifications(text),
  };

  return {
    success: true,
    fileName: file.name,
    model: 'local-tesseract',
    confidence,
    extracted: {
      ...extractedBase,
      warnings: buildWarnings(confidence, extractedBase),
    },
  };
}
