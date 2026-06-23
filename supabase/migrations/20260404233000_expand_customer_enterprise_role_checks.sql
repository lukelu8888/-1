alter table if exists public.customer_enterprise_members
  drop constraint if exists customer_enterprise_members_role_check;

alter table if exists public.customer_enterprise_members
  add constraint customer_enterprise_members_role_check
  check (
    role in ('Owner', 'Purchase Manager', 'Purchaser', 'Finance', 'Viewer')
  );

alter table if exists public.customer_enterprise_invitations
  drop constraint if exists customer_enterprise_invitations_role_check;

alter table if exists public.customer_enterprise_invitations
  add constraint customer_enterprise_invitations_role_check
  check (
    role in ('Owner', 'Purchase Manager', 'Purchaser', 'Finance', 'Viewer')
  );
