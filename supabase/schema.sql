create extension if not exists "pgcrypto";

create type app_role as enum ('admin', 'worker');
create type order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role app_role not null default 'worker',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

create table public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  sku text not null unique,
  category text not null,
  buying_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  quantity integer not null default 0 check (quantity >= 0),
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

create table public.orders (
  id text primary key,
  customer text not null,
  phone text,
  address text,
  subtotal numeric(12, 2) not null default 0,
  delivery_cost numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  status order_status not null default 'pending',
  order_date date not null default current_date,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  price numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_username text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_products_category on public.products(category);
create index idx_products_name on public.products using gin (to_tsvector('simple', name));
create index idx_orders_date on public.orders(order_date);
create index idx_activity_logs_created_at on public.activity_logs(created_at desc);

create or replace function public.current_user_role()
returns app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.activity_logs enable row level security;

create policy "profiles read authenticated" on public.profiles
for select to authenticated using (true);

create policy "profiles update self" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "categories read authenticated" on public.categories
for select to authenticated using (true);

create policy "categories admin write" on public.categories
for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "products read authenticated" on public.products
for select to authenticated using (true);

create policy "products admin write" on public.products
for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "orders read authenticated" on public.orders
for select to authenticated using (true);

create policy "orders insert authenticated" on public.orders
for insert to authenticated with check (auth.uid() is not null);

create policy "orders worker limited update" on public.orders
for update to authenticated using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'worker' and status in ('pending', 'confirmed'))
) with check (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'worker' and status in ('pending', 'confirmed'))
);

create policy "orders admin delete" on public.orders
for delete to authenticated using (public.current_user_role() = 'admin');

create policy "order_items read authenticated" on public.order_items
for select to authenticated using (true);

create policy "order_items insert authenticated" on public.order_items
for insert to authenticated with check (auth.uid() is not null);

create policy "order_items admin delete" on public.order_items
for delete to authenticated using (public.current_user_role() = 'admin');

create policy "activity logs admin read" on public.activity_logs
for select to authenticated using (public.current_user_role() = 'admin');

create policy "activity logs insert authenticated" on public.activity_logs
for insert to authenticated with check (auth.uid() is not null);
