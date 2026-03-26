-- ============================================================
-- Loading supervision feedback status
-- 范围：给客户侧“第三方监装已安排”回执保留结构化状态
-- ============================================================

alter table public.purchase_order_execution
  add column if not exists loading_supervision_feedback_status text not null default 'pending';

alter table public.purchase_order_execution
  drop constraint if exists chk_purchase_order_execution_loading_supervision_feedback_status;

alter table public.purchase_order_execution
  add constraint chk_purchase_order_execution_loading_supervision_feedback_status check (
    loading_supervision_feedback_status in ('pending', 'confirmed', 'on_site', 'reported')
  );
