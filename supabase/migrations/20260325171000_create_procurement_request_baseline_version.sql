do $$
declare
  v_template_id uuid;
  v_version_id uuid;
begin
  select id into v_template_id
  from public.document_templates
  where template_code = 'tpl_pr'
  limit 1;

  if v_template_id is null then
    raise notice 'tpl_pr not found, skip baseline version creation';
    return;
  end if;

  if exists (
    select 1
    from public.document_template_versions
    where template_id = v_template_id
  ) then
    raise notice 'tpl_pr already has version rows, skip baseline version creation';
    return;
  end if;

  insert into public.document_template_versions (
    template_id,
    version_no,
    version_label,
    status,
    schema_json,
    layout_json,
    style_tokens,
    sample_data,
    renderer_component,
    change_summary,
    published_at
  ) values (
    v_template_id,
    1,
    'v1.0.0',
    'published',
    jsonb_build_object(
      'mode', 'template-center-workspace',
      'documentCode', 'PR'
    ),
    '{}'::jsonb,
    '{}'::jsonb,
    jsonb_build_object(
      'requirementNo', 'PR-NA-260325-0001',
      'requirementDate', '2026-03-25',
      'sourceInquiryNo', 'SC-NA-260320-0008',
      'requiredResponseDate', '2026-03-27',
      'requiredDeliveryDate', '2026-04-18',
      'customer', jsonb_build_object(
        'companyName', 'North America Key Account A',
        'contactPerson', 'Account Owner',
        'email', 'sales.masked@cosun.example',
        'phone', '+1-000-***-****',
        'address', 'Destination market: Los Angeles, CA / Customer detail masked',
        'region', 'North America',
        'businessType', '建材渠道客户（脱敏）'
      ),
      'products', jsonb_build_array(
        jsonb_build_object(
          'no', 1,
          'modelNo', 'SC-LINE-001',
          'productName', 'GFCI Outlet Main Housing',
          'specification', '客户订单主产品，建议分配给 Supplier A，承担 3,000 PCS',
          'quantity', 3000,
          'unit', 'PCS',
          'unitPrice', 0,
          'totalPrice', 0,
          'remarks', '拟分配供应商：Supplier A / 目标CG：CG-A'
        ),
        jsonb_build_object(
          'no', 2,
          'modelNo', 'SC-LINE-002',
          'productName', 'Weather-Resistant Cover',
          'specification', '配件产品，建议分配给 Supplier B，承担 2,000 PCS',
          'quantity', 2000,
          'unit', 'PCS',
          'unitPrice', 0,
          'totalPrice', 0,
          'remarks', '拟分配供应商：Supplier B / 目标CG：CG-B'
        )
      ),
      'customerRequirements', jsonb_build_object(
        'deliveryTerms', '分配完成后按供应商分别生成 CG，并同步交期承诺',
        'paymentTerms', '沿用 SC 已确认付款框架，采购侧按供应商单独执行',
        'qualityStandard', '不得降低 SC 约定质量标准，分供应商执行统一验收口径',
        'packaging', '按客户订单要求执行，PR 中仅保留分配与协同所需摘要',
        'specialRequirements', '允许一单多供应商，必须标明每个供应商负责的产品、数量和目标交付节点。'
      ),
      'conditionGroups', jsonb_build_array(
        jsonb_build_object(
          'key', 'procurement-allocation',
          'title', '采购分配原则',
          'titleEn', 'PROCUREMENT ALLOCATION RULES',
          'items', jsonb_build_array(
            jsonb_build_object('key', 'split', 'label', '1. 拆分原则', 'value', '按产品线、供应商专长、交期风险和起订量综合拆分，不要求单一供应商全包。'),
            jsonb_build_object('key', 'supplier', 'label', '2. 供应商策略', 'value', '同一客户订单可对应多个供应商，优先保障交期、质量稳定性与历史履约表现。'),
            jsonb_build_object('key', 'contract', 'label', '3. 合同输出', 'value', 'PR 完成分配后，应按供应商生成对应采购合同 CG，每个供应商一份。'),
            jsonb_build_object('key', 'privacy', 'label', '4. 脱敏要求', 'value', 'PR 仅暴露采购分配所需的订单摘要与脱敏客户信息，不展示终端客户敏感资料。')
          )
        )
      ),
      'salesDeptNotes', E'1. Procurement Allocation Goal / 采购分配目标\n将销售合同中的产品拆分给最合适的供应商，并形成后续采购合同。\n\n2. Supplier Split Logic / 供应商拆分逻辑\n同一订单允许拆分给多个供应商，按产品专长、MOQ、交期和历史履约表现综合判断。\n\n3. CG Output Rule / 采购合同输出规则\n每个被选定供应商最终生成一份对应的采购合同 CG。',
      'purchaseDeptFeedback', '此区域用于回写采购分配结果，如：已分配 2 家供应商，待生成 2 份 CG。',
      'urgency', 'high',
      'createdBy', '采购管理员'
    ),
    'src/components/documents/templates/QuoteRequirementDocument.tsx',
    'PR baseline seed',
    now()
  )
  returning id into v_version_id;

  update public.document_templates
  set
    current_version_id = v_version_id,
    status = 'published',
    updated_at = now()
  where id = v_template_id;
end $$;
