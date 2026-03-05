-- Migration 032: Replace browser localStorage with Supabase-backed KV
-- Principle: Supabase-first for persisted client data

CREATE TABLE IF NOT EXISTS public.client_kv_store (
  scope_id   TEXT        NOT NULL,
  k          TEXT        NOT NULL,
  v          TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope_id, k)
);

CREATE INDEX IF NOT EXISTS idx_client_kv_store_scope_updated
  ON public.client_kv_store (scope_id, updated_at DESC);

ALTER TABLE public.client_kv_store ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'client_kv_store'
      AND policyname = 'auth_own_client_kv_store'
  ) THEN
    CREATE POLICY auth_own_client_kv_store
      ON public.client_kv_store
      FOR ALL TO authenticated
      USING (scope_id = auth.uid()::text)
      WITH CHECK (scope_id = auth.uid()::text);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_client_kv_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_kv_store_updated_at ON public.client_kv_store;
CREATE TRIGGER trg_client_kv_store_updated_at
BEFORE UPDATE ON public.client_kv_store
FOR EACH ROW
EXECUTE FUNCTION public.set_client_kv_updated_at();
