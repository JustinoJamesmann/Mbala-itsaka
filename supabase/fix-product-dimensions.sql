alter table public.products
add column if not exists width_cm numeric(10, 2),
add column if not exists height_cm numeric(10, 2);

notify pgrst, 'reload schema';
