import { supabase } from '../supabase'

type DependencyBag = {
  handleError: (error: any, context: string) => any
}

function fromNotificationRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message || '',
    relatedId: r.related_id || r.reference_id,
    relatedType: r.related_type || r.reference_type,
    recipient: r.recipient_email,
    sender: r.sender,
    read: r.is_read || false,
    createdAt: r.created_at_ms || new Date(r.created_at).getTime(),
    metadata: r.metadata,
  }
}

export function createApprovalService(deps: DependencyBag) {
  return {
    async getPending(approverEmail: string) {
      const { data, error } = await supabase
        .from('approval_records')
        .select('*')
        .eq('approver_email', approverEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) return deps.handleError(error, 'getPending approvals')
      return data
    },

    async upsert(record: any) {
      const { data, error } = await supabase
        .from('approval_records')
        .upsert(record, { onConflict: 'id' })
        .select()
        .single()
      if (error) return deps.handleError(error, 'upsert approval')
      return data
    },

    async updateStatus(id: string, status: 'approved' | 'rejected', notes?: string) {
      const { data, error } = await supabase
        .from('approval_records')
        .update({ status, notes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) return deps.handleError(error, 'updateStatus approval')
      return data
    },

    async deleteByTargetId(targetId: string) {
      const { error } = await supabase
        .from('approval_records')
        .delete()
        .eq('target_id', targetId)
      if (error) return deps.handleError(error, 'deleteByTargetId approval')
      return true
    },

    subscribeToChanges(approverEmail: string, callback: (payload: any) => void) {
      return supabase
        .channel(`approval_changes_${approverEmail}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'approval_records',
          filter: `approver_email=eq.${approverEmail}`,
        }, callback)
        .subscribe()
    },
  }
}

export function createNotificationService(deps: DependencyBag) {
  return {
    async getForUser(email: string) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', email)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) return deps.handleError(error, 'getForUser notifications')
      return data
    },

    async send(notification: { recipient_email: string; type: string; title: string; message?: string; data?: any }) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()
      if (error) return deps.handleError(error, 'send notification')
      return data
    },

    async markRead(id: string) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) return deps.handleError(error, 'markRead notification')
      return true
    },

    subscribeToUser(email: string, callback: (payload: any) => void) {
      return supabase
        .channel(`notifications_${email}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_email=eq.${email}`,
        }, callback)
        .subscribe()
    },
  }
}

export function createNotificationSupabaseService(deps: DependencyBag) {
  return {
    async getForUser(email: string) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', email)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) return deps.handleError(error, 'getForUser notifications')
      return (data || []).map(fromNotificationRow)
    },

    async send(notification: {
      recipient_email: string
      type: string
      title: string
      message?: string
      related_id?: string
      related_type?: string
      sender?: string
      metadata?: any
    }) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          is_read: false,
          created_at_ms: Date.now(),
        })
        .select()
        .single()
      if (error) return deps.handleError(error, 'send notification')
      return fromNotificationRow(data)
    },

    async markRead(id: string) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) return deps.handleError(error, 'markRead notification')
      return true
    },

    async markAllRead(recipientEmail: string) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_email', recipientEmail)
      if (error) return deps.handleError(error, 'markAllRead notifications')
      return true
    },

    async delete(id: string) {
      const { error } = await supabase.from('notifications').delete().eq('id', id)
      if (error) return deps.handleError(error, 'delete notification')
      return true
    },

    async deleteAll(recipientEmail: string) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_email', recipientEmail)
      if (error) return deps.handleError(error, 'deleteAll notifications')
      return true
    },

    subscribeToUser(email: string, callback: (payload: any) => void) {
      return supabase
        .channel(`notifications_v2_${email.replace('@', '_').replace('.', '_')}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_email=eq.${email}`,
        }, callback)
        .subscribe()
    },
  }
}
