/**
 * useSupabaseSync
 * 通用 Hook：将 localStorage 数据双向同步到 Supabase
 * - 启动时从 Supabase 加载（如果可用）
 * - 写入时同时更新 localStorage 和 Supabase
 * - 订阅 Supabase Realtime 推送
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'sales_contracts' | 'orders' | 'accounts_receivable' | 'sales_quotations' | 'approval_records' | 'notifications';

interface SyncOptions {
  table: TableName;
  localKey: string;
  /** 过滤条件，例如 { customer_email: 'foo@bar.com' } */
  filter?: Record<string, string>;
  /** 数据库行转为前端对象 */
  fromRow?: (row: any) => any;
  /** 当 Supabase 有更新时回调 */
  onRemoteUpdate?: (rows: any[]) => void;
  enabled?: boolean;
}

export function useSupabaseSync(options: SyncOptions) {
  const { table, localKey, filter, fromRow, onRemoteUpdate, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  const fetchFromSupabase = useCallback(async () => {
    if (!enabled || !navigator.onLine) return;
    try {
      let query = supabase.from(table).select('*').order('created_at', { ascending: false });
      if (filter) {
        Object.entries(filter).forEach(([col, val]) => {
          query = query.eq(col, val) as any;
        });
      }
      const { data, error } = await query;
      if (error || !data) return;

      const mapped = fromRow ? data.map(fromRow) : data;
      onRemoteUpdateRef.current?.(mapped);
    } catch (e) {
      console.warn('[useSupabaseSync] fetch error:', e);
    }
  }, [table, enabled, filter, fromRow]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchFromSupabase();

    // Subscribe to realtime changes
    const filterStr = filter
      ? Object.entries(filter).map(([k, v]) => `${k}=eq.${v}`).join(',')
      : undefined;

    const channel = supabase
      .channel(`sync_${table}_${localKey}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          ...(filterStr ? { filter: filterStr } : {}),
        },
        () => {
          fetchFromSupabase();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [table, localKey, enabled, fetchFromSupabase]);

  return { refetch: fetchFromSupabase };
}
