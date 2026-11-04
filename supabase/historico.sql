-- Histórico do gerador de banners (banner.rbitengenharia.com.br).
-- Cole tudo no SQL Editor do Supabase (projeto "ala16's Project") e clique em Run.
-- Só cria tabelas e funções novas com nome banner_*; não mexe em nada que já existe.
-- As tabelas ficam fechadas (RLS sem políticas); o site acessa só pelas funções abaixo,
-- que exigem o token guardado em banner_config.

create table public.banner_historico (
  id bigint primary key,
  cidade text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz,
  dados jsonb not null default '{}',
  arquivo text,
  tipo text not null default 'image/png',
  imagem bytea not null
);
create index banner_historico_cidade_idx on public.banner_historico (cidade, criado_em desc);
alter table public.banner_historico enable row level security;

create table public.banner_config (chave text primary key, valor text not null);
alter table public.banner_config enable row level security;
insert into public.banner_config (chave, valor) values ('token', md5(random()::text || clock_timestamp()::text) || md5(random()::text));

create function public.banner_token_ok(p_token text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from banner_config where chave = 'token' and valor = p_token)
$$;

create function public.banner_listar(p_token text, p_cidade text)
returns table (id bigint, cidade text, criado_em timestamptz, atualizado_em timestamptz, dados jsonb, arquivo text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not banner_token_ok(p_token) then raise exception 'token inválido'; end if;
  return query select h.id, h.cidade, h.criado_em, h.atualizado_em, h.dados, h.arquivo
    from banner_historico h where h.cidade = p_cidade order by h.criado_em desc;
end $$;

-- Com p_id existente, atualiza (banner editado); senão cria.
create function public.banner_salvar(p_token text, p_id bigint, p_cidade text, p_dados jsonb, p_arquivo text, p_tipo text, p_imagem text)
returns table (id bigint, cidade text, criado_em timestamptz, atualizado_em timestamptz, dados jsonb, arquivo text)
language plpgsql security definer set search_path = public as $$
begin
  if not banner_token_ok(p_token) then raise exception 'token inválido'; end if;
  return query
  insert into banner_historico as h (id, cidade, dados, arquivo, tipo, imagem)
  values (p_id, p_cidade, p_dados, p_arquivo, p_tipo, decode(p_imagem, 'base64'))
  on conflict on constraint banner_historico_pkey do update
    set dados = excluded.dados, arquivo = excluded.arquivo, tipo = excluded.tipo,
        imagem = excluded.imagem, atualizado_em = now()
  returning h.id, h.cidade, h.criado_em, h.atualizado_em, h.dados, h.arquivo;
end $$;

create function public.banner_imagem(p_token text, p_id bigint)
returns table (tipo text, arquivo text, imagem text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not banner_token_ok(p_token) then raise exception 'token inválido'; end if;
  return query select h.tipo, h.arquivo, encode(h.imagem, 'base64') from banner_historico h where h.id = p_id;
end $$;

create function public.banner_apagar(p_token text, p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not banner_token_ok(p_token) then raise exception 'token inválido'; end if;
  delete from banner_historico where id = p_id;
end $$;

revoke all on function public.banner_token_ok(text) from public, anon, authenticated;
