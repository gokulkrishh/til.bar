-- Add label column to api_keys for identifying keys
alter table public.api_keys add column label text not null default 'Default';
