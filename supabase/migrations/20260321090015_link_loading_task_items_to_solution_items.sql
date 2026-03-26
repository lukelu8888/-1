alter table if exists public.loading_task_items
  add column if not exists solution_item_id uuid references public.container_loading_solution_items(id) on delete set null;

create index if not exists idx_loading_task_items_solution_item_id
  on public.loading_task_items(solution_item_id);

create unique index if not exists uq_loading_task_items_task_solution_item
  on public.loading_task_items(loading_task_id, solution_item_id)
  where solution_item_id is not null;
