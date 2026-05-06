alter table public.orders
add column if not exists remise numeric(12, 2) not null default 0;
