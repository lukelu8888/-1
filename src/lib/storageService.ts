import { supabase } from './supabase'

// ============================================================
// Supabase Storage Service
// 替代 Base64 / 本地 URL 的文件存储方案
// Bucket: payment-proofs (付款凭证)
// Bucket: contract-attachments (合同附件)
// ============================================================

const BUCKET_PAYMENT = 'payment-proofs'
const BUCKET_CONTRACTS = 'contract-attachments'

export type UploadResult = {
  url: string
  path: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

// ============================================================
// 核心上传函数
// ============================================================
async function uploadFile(
  bucket: string,
  file: File,
  pathPrefix: string,
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'bin'
  const timestamp = Date.now()
  const safePrefix = pathPrefix.replace(/[^a-zA-Z0-9_\-/]/g, '_')
  const path = `${safePrefix}/${timestamp}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

  return {
    url: urlData.publicUrl,
    path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
  }
}

// ============================================================
// 删除文件
// ============================================================
async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) console.warn(`[Storage] delete failed:`, error.message)
}

// ============================================================
// 付款凭证上传（客户门户 & 管理后台）
// ============================================================
export const paymentProofStorage = {
  /**
   * 上传付款凭证
   * @param file - File 对象
   * @param orderNumber - 订单号（用于路径组织）
   * @param type - 'deposit' | 'balance'
   * @param uploaderEmail - 上传人邮箱
   */
  async upload(
    file: File,
    orderNumber: string,
    type: 'deposit' | 'balance',
    uploaderEmail: string,
  ): Promise<UploadResult> {
    const safeOrder = orderNumber.replace(/[^a-zA-Z0-9_\-]/g, '_')
    const safeEmail = uploaderEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')
    const pathPrefix = `${safeOrder}/${type}/${safeEmail}`
    return uploadFile(BUCKET_PAYMENT, file, pathPrefix)
  },

  async delete(path: string) {
    return deleteFile(BUCKET_PAYMENT, path)
  },

  getPublicUrl(path: string) {
    const { data } = supabase.storage.from(BUCKET_PAYMENT).getPublicUrl(path)
    return data.publicUrl
  },
}

// ============================================================
// 合同附件上传
// ============================================================
export const contractAttachmentStorage = {
  async upload(
    file: File,
    contractNumber: string,
    uploaderEmail: string,
  ): Promise<UploadResult> {
    const safeContract = contractNumber.replace(/[^a-zA-Z0-9_\-]/g, '_')
    const safeEmail = uploaderEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')
    const pathPrefix = `${safeContract}/${safeEmail}`
    return uploadFile(BUCKET_CONTRACTS, file, pathPrefix)
  },

  async delete(path: string) {
    return deleteFile(BUCKET_CONTRACTS, path)
  },

  getPublicUrl(path: string) {
    const { data } = supabase.storage.from(BUCKET_CONTRACTS).getPublicUrl(path)
    return data.publicUrl
  },
}

// ============================================================
// 工具函数：把旧的 base64 dataURL 转成 File 对象
// ============================================================
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], fileName, { type: mime })
}

// ============================================================
// 工具函数：检查是否是 base64 dataURL
// ============================================================
export function isDataUrl(value: string): boolean {
  return typeof value === 'string' && value.startsWith('data:')
}

// ============================================================
// 初始化 Buckets（在 Supabase Dashboard 手动创建，或用此函数检查）
// ============================================================
export async function ensureBucketsExist() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const existing = new Set((buckets || []).map((b) => b.name))

  for (const bucketName of [BUCKET_PAYMENT, BUCKET_CONTRACTS]) {
    if (!existing.has(bucketName)) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'],
      })
      if (error) {
        console.warn(`[Storage] Cannot create bucket "${bucketName}":`, error.message)
      } else {
        console.log(`[Storage] Bucket "${bucketName}" created.`)
      }
    }
  }
}
