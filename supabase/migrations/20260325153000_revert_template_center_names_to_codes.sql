update public.document_templates
set
  template_name_cn = case template_code
    when 'tpl_ing' then 'ING'
    when 'tpl_inq' then 'ING'
    when 'tpl_qr' then 'QR'
    when 'tpl_xj' then 'XJ'
    when 'tpl_bj' then 'BJ'
    when 'tpl_qt' then 'QT'
    when 'tpl_sc' then 'SC'
    when 'tpl_cg' then 'CG'
    else template_name_cn
  end,
  template_name_en = case template_code
    when 'tpl_ing' then 'ING'
    when 'tpl_inq' then 'ING'
    when 'tpl_qr' then 'QR'
    when 'tpl_xj' then 'XJ'
    when 'tpl_bj' then 'BJ'
    when 'tpl_qt' then 'QT'
    when 'tpl_sc' then 'SC'
    when 'tpl_cg' then 'CG'
    else template_name_en
  end,
  updated_at = now()
where template_code in ('tpl_ing', 'tpl_inq', 'tpl_qr', 'tpl_xj', 'tpl_bj', 'tpl_qt', 'tpl_sc', 'tpl_cg');
