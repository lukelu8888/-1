-- Migration 044: Align template center inquiry code from INQ to ING
-- 目标：
-- 1. 模板中心主表正式使用 ING，而不是 INQ
-- 2. 默认绑定节点从 inq-create 改为 ing-create
-- 3. 保持既有模板版本与业务绑定关系不丢失

BEGIN;

DO $$
DECLARE
  v_inq_template_id UUID;
  v_ing_template_id UUID;
  v_current_version_id UUID;
BEGIN
  SELECT id, current_version_id
    INTO v_inq_template_id, v_current_version_id
    FROM public.document_templates
   WHERE template_code = 'tpl_inq'
      OR document_code = 'INQ'
   ORDER BY created_at
   LIMIT 1;

  SELECT id
    INTO v_ing_template_id
    FROM public.document_templates
   WHERE template_code = 'tpl_ing'
      OR document_code = 'ING'
   ORDER BY created_at
   LIMIT 1;

  IF v_inq_template_id IS NOT NULL AND v_ing_template_id IS NULL THEN
    UPDATE public.document_templates
       SET template_code = 'tpl_ing',
           document_code = 'ING',
           template_name_cn = '客户询价单',
           template_name_en = 'Customer Inquiry',
           business_stage = 'source',
           description = '客户原始询价源头',
           updated_at = NOW()
     WHERE id = v_inq_template_id;
    v_ing_template_id := v_inq_template_id;
  ELSIF v_ing_template_id IS NULL THEN
    INSERT INTO public.document_templates (
      template_code,
      document_code,
      template_name_cn,
      template_name_en,
      business_stage,
      renderer_type,
      current_version_id,
      status,
      description,
      is_active
    ) VALUES (
      'tpl_ing',
      'ING',
      '客户询价单',
      'Customer Inquiry',
      'source',
      'legacy-react',
      v_current_version_id,
      'published',
      '客户原始询价源头',
      TRUE
    )
    RETURNING id INTO v_ing_template_id;
  END IF;

  IF v_inq_template_id IS NOT NULL AND v_ing_template_id IS NOT NULL AND v_inq_template_id <> v_ing_template_id THEN
    UPDATE public.document_template_versions
       SET template_id = v_ing_template_id
     WHERE template_id = v_inq_template_id;

    UPDATE public.document_templates
       SET current_version_id = COALESCE(current_version_id, v_current_version_id),
           updated_at = NOW()
     WHERE id = v_ing_template_id;

    UPDATE public.document_template_bindings
       SET template_id = v_ing_template_id
     WHERE template_id = v_inq_template_id;

    UPDATE public.document_template_publish_logs
       SET template_id = v_ing_template_id
     WHERE template_id = v_inq_template_id;

    UPDATE public.inquiries
       SET template_id = v_ing_template_id
     WHERE template_id = v_inq_template_id;

    DELETE FROM public.document_templates
     WHERE id = v_inq_template_id;
  END IF;

  DELETE FROM public.document_template_bindings
   WHERE document_code = 'ING'
     AND node_code = 'ing-create'
     AND template_id = v_ing_template_id
     AND id NOT IN (
       SELECT id
         FROM public.document_template_bindings
        WHERE document_code = 'ING'
          AND node_code = 'ing-create'
          AND template_id = v_ing_template_id
        ORDER BY created_at
        LIMIT 1
     );

  UPDATE public.document_template_bindings
     SET node_code = 'ing-create',
         document_code = 'ING'
   WHERE template_id = v_ing_template_id
     AND (node_code = 'inq-create' OR document_code = 'INQ');

  UPDATE public.document_templates
     SET document_code = 'ING',
         template_code = 'tpl_ing',
         updated_at = NOW()
   WHERE id = v_ing_template_id;

  UPDATE public.document_template_versions
     SET schema_json = jsonb_set(
       COALESCE(schema_json, '{}'::jsonb),
       '{documentCode}',
       to_jsonb('ING'::text),
       true
     ),
         updated_at = NOW()
   WHERE template_id = v_ing_template_id;
END;
$$;

COMMIT;
