alter table public.products
add column if not exists color_image_map jsonb not null default '{}'::jsonb;

comment on column public.products.color_image_map is
  'Maps each product color name to an ordered array of image URLs used by the storefront.';
