import { supabase } from '../supabase'

export const internalInquiryRoutingService = {
  async syncRoutingArtifacts(inquiryId: string) {
    const normalizedInquiryId = String(inquiryId || '').trim()
    if (!normalizedInquiryId) return null

    const { data, error } = await supabase.rpc('sync_ing_routing_artifacts', {
      p_inquiry_id: normalizedInquiryId,
    })

    if (error) throw error
    return data
  },
}
