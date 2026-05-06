alter table public.order_items
drop constraint if exists order_items_product_id_fkey;

alter table public.products
alter column id drop default,
alter column id type text using id::text,
alter column id set default gen_random_uuid()::text;

alter table public.order_items
alter column product_id type text using product_id::text;

alter table public.order_items
add constraint order_items_product_id_fkey
foreign key (product_id) references public.products(id);

notify pgrst, 'reload schema';
