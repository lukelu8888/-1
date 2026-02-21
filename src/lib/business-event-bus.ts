// 🔗 业务事件总线 (Business Event Bus)
// 用于解耦业务模块，实现事件驱动的单证管理系统

import { createClient } from '@supabase/supabase-js';

// ============ 事件类型定义 ============
export type BusinessEvent = 
  | 'CONTRACT_SIGNED'            // 合同签订
  | 'PROCUREMENT_PAID'           // 采购付款
  | 'SHIPPING_NOTICE_ISSUED'     // 出货通知发出
  | 'CUSTOMS_CLEARED'            // 报关完成
  | 'VESSEL_DEPARTED'            // 开船
  | 'PAYMENT_RECEIVED'           // 收汇
  | 'FX_SETTLED'                 // 结汇
  | 'DOCS_READY_FOR_TAX_REFUND'  // 单证齐全可退税
  | 'ORDER_CREATED'              // 订单创建
  | 'ORDER_UPDATED'              // 订单更新
  | 'DOCUMENT_UPLOADED'          // 单证上传
  | 'DOCUMENT_APPROVED'          // 单证审批通过
  | 'DOCUMENT_REJECTED';         // 单证驳回

export interface EventPayload<T = any> {
  eventType: BusinessEvent;
  orderId: string;
  contractNo?: string;
  timestamp: string;
  data: T;
  operator: string;
  metadata?: Record<string, any>;
}

type EventCallback<T = any> = (payload: EventPayload<T>) => void | Promise<void>;

// ============ 事件总线类 ============
class BusinessEventBus {
  private listeners: Map<BusinessEvent, Array<EventCallback>> = new Map();
  private supabase: ReturnType<typeof createClient> | null = null;

  // 初始化Supabase客户端（用于保存事件日志）
  initSupabase(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  subscribe<T = any>(eventType: BusinessEvent, callback: EventCallback<T>) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback as EventCallback);
    
    console.log(`📡 [EventBus] 订阅事件: ${eventType}`);
  }

  /**
   * 取消订阅
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  unsubscribe<T = any>(eventType: BusinessEvent, callback: EventCallback<T>) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback as EventCallback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 发布事件
   * @param payload 事件载荷
   */
  async publish<T = any>(payload: EventPayload<T>) {
    console.log(`📢 [EventBus] 发布事件: ${payload.eventType}`, {
      orderId: payload.orderId,
      operator: payload.operator,
      timestamp: payload.timestamp
    });
    
    // 1. 执行所有监听器
    const callbacks = this.listeners.get(payload.eventType);
    if (callbacks && callbacks.length > 0) {
      console.log(`📋 [EventBus] 执行 ${callbacks.length} 个监听器...`);
      
      for (const callback of callbacks) {
        try {
          await callback(payload);
        } catch (error) {
          console.error(`❌ [EventBus] 监听器执行失败:`, error);
        }
      }
    } else {
      console.warn(`⚠️ [EventBus] 没有监听器订阅事件: ${payload.eventType}`);
    }
    
    // 2. 保存事件日志到数据库
    await this.saveEventLog(payload);
    
    // 3. 触发浏览器自定义事件（用于跨组件通信）
    this.dispatchBrowserEvent(payload);
  }

  /**
   * 保存事件日志到数据库
   * @param payload 事件载荷
   */
  private async saveEventLog<T = any>(payload: EventPayload<T>) {
    if (!this.supabase) {
      console.warn('⚠️ [EventBus] Supabase未初始化，跳过事件日志保存');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('business_event_logs')
        .insert({
          event_type: payload.eventType,
          order_id: payload.orderId,
          contract_no: payload.contractNo,
          timestamp: payload.timestamp,
          data: payload.data as any,
          operator: payload.operator,
          metadata: payload.metadata
        });

      if (error) {
        console.error('❌ [EventBus] 保存事件日志失败:', error);
      } else {
        console.log(`✅ [EventBus] 事件日志已保存: ${payload.eventType}`);
      }
    } catch (error) {
      console.error('❌ [EventBus] 保存事件日志异常:', error);
    }
  }

  /**
   * 触发浏览器自定义事件（用于React组件监听）
   * @param payload 事件载荷
   */
  private dispatchBrowserEvent<T = any>(payload: EventPayload<T>) {
    const event = new CustomEvent('business-event', {
      detail: payload
    });
    window.dispatchEvent(event);
    
    // 同时触发特定事件类型的事件
    const specificEvent = new CustomEvent(`business-event:${payload.eventType}`, {
      detail: payload
    });
    window.dispatchEvent(specificEvent);
  }

  /**
   * 获取所有监听器统计
   */
  getStats() {
    const stats: Record<string, number> = {};
    this.listeners.forEach((callbacks, eventType) => {
      stats[eventType] = callbacks.length;
    });
    return stats;
  }

  /**
   * 清除所有监听器
   */
  clear() {
    this.listeners.clear();
    console.log('🧹 [EventBus] 所有监听器已清除');
  }
}

// ============ 导出单例 ============
export const eventBus = new BusinessEventBus();

// ============ React Hook: 监听业务事件 ============
import { useEffect } from 'react';

export function useBusinessEvent<T = any>(
  eventType: BusinessEvent,
  callback: (payload: EventPayload<T>) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const handler = (event: CustomEvent<EventPayload<T>>) => {
      callback(event.detail);
    };

    window.addEventListener(`business-event:${eventType}` as any, handler as any);

    return () => {
      window.removeEventListener(`business-event:${eventType}` as any, handler as any);
    };
  }, deps);
}

// ============ 辅助函数：创建事件载荷 ============
export function createEventPayload<T = any>(
  eventType: BusinessEvent,
  orderId: string,
  data: T,
  operator: string,
  contractNo?: string,
  metadata?: Record<string, any>
): EventPayload<T> {
  return {
    eventType,
    orderId,
    contractNo,
    timestamp: new Date().toISOString(),
    data,
    operator,
    metadata
  };
}

// ============ 导出类型 ============
export type { EventCallback };
