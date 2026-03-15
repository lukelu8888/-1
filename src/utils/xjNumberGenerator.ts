/**
 * Document Number Generator for B2B Trade System
 * Supports: INQ, QUO, SC, CI, PL, YS, SK, QR, XJ, BJ, QT, SO, PO
 * Format: {TYPE}-{REGION}-YYMMDD-XXXX
 *
 * Preferred: Use async RPC variants (nextQRNumber, nextXJNumber, nextBJNumber…)
 * which call next_number_ex on Supabase for concurrent-safe numbering.
 * Legacy sync functions remain for backward compatibility only.
 */
import { supabase } from '../lib/supabase';

// ========== Supabase RPC — async number generators ==========

function localFallback(prefix: string, region?: string): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString().slice(-2)
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return region ? `${prefix}-${region}-${dateStr}-${rand}` : `${prefix}-${dateStr}-${rand}`;
}

export async function nextQRNumber(region = 'NA'): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('next_number_ex', { p_doc_type: 'QR', p_region_code: region, p_customer_id: null });
    if (error) throw error;
    return data as string;
  } catch (e) {
    console.error('[xjNumberGenerator] nextQRNumber RPC failed:', e);
    return localFallback('QR');
  }
}

export async function nextXJNumber(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('next_number_ex', { p_doc_type: 'XJ', p_region_code: 'GLOBAL', p_customer_id: null });
    if (error) throw error;
    return data as string;
  } catch (e) {
    console.error('[xjNumberGenerator] nextXJNumber RPC failed:', e);
    return localFallback('XJ');
  }
}

export async function nextBJNumber(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('next_number_ex', { p_doc_type: 'BJ', p_region_code: 'GLOBAL', p_customer_id: null });
    if (error) throw error;
    return data as string;
  } catch (e) {
    console.error('[xjNumberGenerator] nextBJNumber RPC failed:', e);
    return localFallback('BJ');
  }
}

export async function nextCGNumber(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('next_number_ex', { p_doc_type: 'CG', p_region_code: 'UNKNOWN', p_customer_id: null });
    if (error) throw error;
    return data as string;
  } catch (e) {
    console.error('[xjNumberGenerator] nextCGNumber RPC failed:', e);
    return localFallback('CG');
  }
}

export async function nextQTNumber(region = 'NA'): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('next_number_ex', { p_doc_type: 'QT', p_region_code: region, p_customer_id: null });
    if (error) throw error;
    return data as string;
  } catch (e) {
    console.error('[xjNumberGenerator] nextQTNumber RPC failed:', e);
    return localFallback('QT', region);
  }
}

export async function nextPRNumber(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('next_number_ex', { p_doc_type: 'PR', p_region_code: 'UNKNOWN', p_customer_id: null });
    if (error) throw error;
    return data as string;
  } catch (e) {
    console.error('[xjNumberGenerator] nextPRNumber RPC failed:', e);
    return localFallback('PR');
  }
}

const DOCUMENT_COUNTER_KEY = 'document_counter_data';

// 🌍 Region code mapping
export type RegionType = 'North America' | 'South America' | 'Europe & Africa';

export const REGION_CODES: Record<RegionType, string> = {
  'North America': 'NA',
  'South America': 'SA',
  'Europe & Africa': 'EA'  // Changed from EU to EA for better representation
};

// 📋 Document types
export type DocumentType = 'XJ' | 'QT' | 'SC' | 'CI' | 'PL' | 'YS' | 'SK' | 'ING' | 'QR' | 'BJ' | 'SO' | 'PO';

interface DocumentCounterData {
  counters: {
    [key: string]: number; // Key format: "{TYPE}-{REGION}" (e.g., "ING-NA", "QT-EA", "PO-SA")
    // Each counter is cumulative and never resets
  };
}

/**
 * Get current date in YYMMDD format
 */
function getCurrentDateString(): string {
  const now = new Date();
  // Use local time fields explicitly (NOT toISOString which is UTC)
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const result = `${year}${month}${day}`;
  console.log(`📅 [documentNumberGenerator] getCurrentDateString → ${result} (local: ${now.toLocaleString()}, UTC: ${now.toUTCString()})`);
  return result;
}

/**
 * @deprecated 旧本地计数器，仅供 generateDocumentNumber（同步旧函数）使用。
 * 新编号一律走 Supabase RPC（nextQRNumber/nextXJNumber/nextBJNumber 等）。
 * 请勿在新代码中调用此函数。
 */
function getCounterData(): DocumentCounterData {
  try {
    const stored = localStorage.getItem(DOCUMENT_COUNTER_KEY);
    if (stored) {
      const data: DocumentCounterData = JSON.parse(stored);
      return data;
    }
  } catch (error) {
    console.error('Error reading document counter data:', error);
  }
  
  // Initialize if not found
  return {
    counters: {}
  };
}

/**
 * @deprecated 旧本地计数器写入，配合 getCounterData 使用。勿在新代码中调用。
 */
function saveCounterData(data: DocumentCounterData): void {
  try {
    localStorage.setItem(DOCUMENT_COUNTER_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving document counter data:', error);
  }
}

/**
 * Generate next document number
 * Format: {TYPE}-{REGION}-YYMMDD-XXXX
 * @param type Document type (e.g., "INQ", "QT", "PO")
 * @param region Region type (e.g., "North America")
 * @returns {string} Generated document number
 */
export function generateDocumentNumber(type: DocumentType, region: RegionType): string {
  const counterData = getCounterData();
  
  // Get region code
  const regionCode = REGION_CODES[region];
  
  // Initialize counter if not exists
  const key = `${type}-${regionCode}`;
  if (!counterData.counters[key]) {
    counterData.counters[key] = 0;
  }
  
  // Increment counter
  counterData.counters[key] += 1;
  
  // Save updated counter
  saveCounterData(counterData);
  
  // Format counter as 4-digit number
  const sequenceNumber = counterData.counters[key].toString().padStart(4, '0');
  
  // Generate document number
  const documentNumber = `${type}-${regionCode}-${getCurrentDateString()}-${sequenceNumber}`;
  
  console.log('✅ Generated Document Number:', documentNumber);
  
  return documentNumber;
}

/**
 * Parse document number to extract type, region, date and sequence
 * @param documentNumber Document number string (e.g., "ING-NA-251120-0001")
 * @returns Parsed data or null if invalid
 */
export function parseDocumentNumber(documentNumber: string): { type: string; region: string; date: string; sequence: number } | null {
  // Try new format first: {TYPE}-{REGION}-YYMMDD-XXXX
  const newFormatMatch = documentNumber.match(/^([A-Z]{2,3})-([A-Z]{2})-(\d{6})-(\d{4})$/);
  if (newFormatMatch) {
    return {
      type: newFormatMatch[1],
      region: newFormatMatch[2],
      date: newFormatMatch[3],
      sequence: parseInt(newFormatMatch[4], 10)
    };
  }
  
  return null;
}

/**
 * Format document date to readable format
 * @param dateString Date in YYMMDD format (e.g., "251101")
 * @returns Formatted date string (e.g., "Nov 01, 2025")
 */
export function formatDocumentDate(dateString: string): string {
  if (dateString.length !== 6) {
    return dateString;
  }
  
  const year = parseInt('20' + dateString.slice(0, 2), 10);
  const month = parseInt(dateString.slice(2, 4), 10) - 1;
  const day = parseInt(dateString.slice(4, 6), 10);
  
  const date = new Date(year, month, day);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

/**
 * Reset counter for testing purposes
 */
export function resetDocumentCounter(): void {
  try {
    localStorage.removeItem(DOCUMENT_COUNTER_KEY);
    console.log('✅ Document counter reset');
  } catch (error) {
    console.error('Error resetting document counter:', error);
  }
}

// ========== Convenience Functions ==========

/**
 * Generate ING (Customer Inquiry) number
 * Format: ING-{REGION}-YYMMDD-XXXX
 * @deprecated Use generateINQNumber instead
 */
export function generateRFQNumber(region: RegionType): string {
  return generateDocumentNumber('XJ', region);
}

/**
 * Generate Quotation number
 * Format: QT-{REGION}-YYMMDD-XXXX
 */
export function generateQuotationNumber(region: RegionType): string {
  return generateDocumentNumber('QT', region);
}

/**
 * Generate Sales Contract number
 * Format: SC-{REGION}-YYMMDD-XXXX
 */
export function generateSalesContractNumber(region: RegionType): string {
  return generateDocumentNumber('SC', region);
}

/**
 * Generate Commercial Invoice number
 * Format: CI-{REGION}-YYMMDD-XXXX
 */
export function generateCommercialInvoiceNumber(region: RegionType): string {
  return generateDocumentNumber('CI', region);
}

/**
 * Generate Packing List number
 * Format: PL-{REGION}-YYMMDD-XXXX
 */
export function generatePackingListNumber(region: RegionType): string {
  return generateDocumentNumber('PL', region);
}

/**
 * Generate Accounts Receivable number
 * Format: YS-{REGION}-YYMMDD-XXXX
 */
export function generateAccountsReceivableNumber(region: RegionType): string {
  return generateDocumentNumber('YS', region);
}

/**
 * Generate Payment Collection number
 * Format: SK-{REGION}-YYMMDD-XXXX
 */
export function generatePaymentCollectionNumber(region: RegionType): string {
  return generateDocumentNumber('SK', region);
}

/**
 * Generate Purchase Order number
 * Format: PO-{REGION}-YYMMDD-XXXX
 * @deprecated Use generateSalesContractNumber instead
 */
export function generatePONumber(region: RegionType): string {
  return generateDocumentNumber('SC', region);
}

// ========== Backward Compatibility ==========

/**
 * Parse INQ number (backward compatible, handles legacy RFQ- prefix)
 * @deprecated Use parseDocumentNumber instead
 */
export function parseRFQNumber(xjNumber: string): { region: string; date: string; sequence: number } | null {
  const parsed = parseDocumentNumber(xjNumber);
  if (parsed && parsed.type === 'XJ') {
    return {
      region: parsed.region,
      date: parsed.date,
      sequence: parsed.sequence
    };
  }
  
  // Fallback to old format: handles legacy RFQ-YYMMDD-XXXX (for backward compatibility)
  const oldFormatMatch = xjNumber.match(/^RFQ-(\d{6})-(\d{4})$/);
  if (oldFormatMatch) {
    return {
      region: 'N/A',
      date: oldFormatMatch[1],
      sequence: parseInt(oldFormatMatch[2], 10)
    };
  }
  
  return null;
}

/**
 * Format document date (backward compatible)
 * @deprecated Use formatDocumentDate instead
 */
export function formatRFQDate(dateString: string): string {
  return formatDocumentDate(dateString);
}

/**
 * Reset document counter (backward compatible)
 * @deprecated Use resetDocumentCounter instead
 */
export function resetRFQCounter(): void {
  resetDocumentCounter();
}

// ========== 7-Level Numbering System Functions ==========

/**
 * Generate ING (Customer Inquiry) number
 * Format: ING-{REGION}-YYMMDD-XXXX
 */
export function generateINQNumber(region: RegionType): string {
  return generateDocumentNumber('ING', region);
}

/**
 * Generate QR (Purchase Requirement) number
 * Format: QR-{REGION}-YYMMDD-XXXX
 */
export function generateQRNumber(region: RegionType): string {
  return generateDocumentNumber('QR', region);
}

/**
 * Generate XJ (Procurement Inquiry to Supplier) number
 * Format: XJ-YYMMDD-XXXX (no region, admin generates it)
 */
export function generateXJNumber(): string {
  const counterData = getCounterData();
  
  // XJ doesn't have region code (similar to BJ)
  const key = 'XJ';
  if (!counterData.counters[key]) {
    counterData.counters[key] = 0;
  }
  
  // Increment counter
  counterData.counters[key] += 1;
  
  // Save updated counter
  saveCounterData(counterData);
  
  // Format counter as 4-digit number
  const sequenceNumber = counterData.counters[key].toString().padStart(4, '0');
  
  // Generate XJ number (no region)
  const xjNumber = `XJ-${getCurrentDateString()}-${sequenceNumber}`;
  
  console.log('✅ Generated XJ Number:', xjNumber);
  
  return xjNumber;
}

/**
 * Generate BJ (Supplier Quotation) number
 * Format: BJ-YYMMDD-XXXX (no region, supplier generates it)
 */
export function generateBJNumber(): string {
  const counterData = getCounterData();
  
  // BJ doesn't have region code
  const key = 'BJ';
  if (!counterData.counters[key]) {
    counterData.counters[key] = 0;
  }
  
  // Increment counter
  counterData.counters[key] += 1;
  
  // Save updated counter
  saveCounterData(counterData);
  
  // Format counter as 4-digit number
  const sequenceNumber = counterData.counters[key].toString().padStart(4, '0');
  
  // Generate BJ number (no region)
  const bjNumber = `BJ-${getCurrentDateString()}-${sequenceNumber}`;
  
  console.log('✅ Generated BJ Number:', bjNumber);
  
  return bjNumber;
}

/**
 * Generate QT (Sales Quotation) number
 * Format: QT-{REGION}-YYMMDD-XXXX
 */
export function generateQTNumber(region: RegionType): string {
  return generateDocumentNumber('QT', region);
}

/**
 * Generate SO (Sales Order) number
 * Format: SO-{REGION}-YYMMDD-XXXX
 */
export function generateSONumber(region: RegionType): string {
  return generateDocumentNumber('SO', region);
}

/**
 * Generate PO (Purchase Order to Supplier) number
 * Format: PO-{REGION}-YYMMDD-XXXX
 */
export function generatePurchaseOrderNumber(region: RegionType): string {
  return generateDocumentNumber('PO', region);
}
