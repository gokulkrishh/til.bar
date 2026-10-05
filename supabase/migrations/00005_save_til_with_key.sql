-- =============================================================
-- Save a link by API key in one round trip.
--
-- /api/save and MCP save_link used to look up the key, then insert: two
-- sequential round trips before responding. This does both in one call.
-- Runs as the caller (security invoker) and only service_role may execute
-- it, so it grants nothing the server's service-role client didn't have.
-- =============================================================

create or replace function public.save_til_with_key(p_key_hash text, p_url text)
returns public.tils
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_til public.tils;
begin
  select user_id into v_user_id
  from public.api_keys
  where key_hash = p_key_hash;

  if v_user_id is null then
    raise exception 'invalid api key' using errcode = '28000';
  end if;

  insert into public.tils (user_id, url)
  values (v_user_id, p_url)
  returning * into v_til;

  return v_til;
end;
$$;

revoke execute on function public.save_til_with_key(text, text) from public, anon, authenticated;
grant execute on function public.save_til_with_key(text, text) to service_role;
