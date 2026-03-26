alter table if exists public.container_load_plans
  add column if not exists loading_pool_id uuid references public.loading_pools(id) on delete set null,
  add column if not exists solution_id uuid references public.container_loading_solutions(id) on delete set null,
  add column if not exists solution_container_id uuid references public.container_loading_solution_containers(id) on delete set null;

alter table if exists public.loading_tasks
  add column if not exists solution_id uuid references public.container_loading_solutions(id) on delete set null,
  add column if not exists solution_container_id uuid references public.container_loading_solution_containers(id) on delete set null;

create index if not exists idx_container_load_plans_loading_pool_id
  on public.container_load_plans(loading_pool_id);

create index if not exists idx_container_load_plans_solution_id
  on public.container_load_plans(solution_id);

create unique index if not exists uq_container_load_plans_solution_container_id
  on public.container_load_plans(solution_container_id)
  where solution_container_id is not null;

create index if not exists idx_loading_tasks_solution_id
  on public.loading_tasks(solution_id);

create index if not exists idx_loading_tasks_solution_container_id
  on public.loading_tasks(solution_container_id);
