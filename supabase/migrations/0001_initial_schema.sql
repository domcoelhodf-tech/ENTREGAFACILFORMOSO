create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'portaria', 'morador');
create type public.package_status as enum ('pendente', 'retirada', 'rejeitada');
create type public.package_event as enum ('registro', 'edicao', 'retirada', 'rejeicao', 'exclusao');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  cpf text,
  telefone text,
  email text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.blocos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid not null references public.blocos(id),
  numero text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bloco_id, numero)
);

create table public.moradores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  unidade_id uuid not null references public.unidades(id),
  cpf text not null,
  nome text not null,
  telefone text,
  email text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.encomendas (
  id uuid primary key default gen_random_uuid(),
  morador_id uuid not null references public.moradores(id),
  unidade_id uuid not null references public.unidades(id),
  numero_encomenda text not null,
  origem text not null,
  codigo_retirada varchar(8) not null unique,
  status public.package_status not null default 'pendente',
  recebido_em timestamptz not null default now(),
  criado_por uuid not null references public.profiles(id),
  retirado_em timestamptz,
  retirado_por uuid references public.profiles(id),
  rejeitado_em timestamptz,
  rejeitado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint codigo_retirada_formato check (codigo_retirada ~ '^[A-Z]{4}[0-9]{4}$')
);

create table public.historico_encomendas (
  id uuid primary key default gen_random_uuid(),
  encomenda_id uuid not null references public.encomendas(id) on delete cascade,
  acao public.package_event not null,
  data_hora timestamptz not null default now(),
  usuario_id uuid references public.profiles(id),
  dados_anteriores jsonb,
  dados_posteriores jsonb
);

create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_unidades_bloco_id on public.unidades(bloco_id);
create index idx_moradores_unidade_id on public.moradores(unidade_id);
create index idx_encomendas_morador_id on public.encomendas(morador_id);
create index idx_encomendas_status on public.encomendas(status);
create index idx_historico_encomenda_id on public.historico_encomendas(encomenda_id);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.blocos enable row level security;
alter table public.unidades enable row level security;
alter table public.moradores enable row level security;
alter table public.encomendas enable row level security;
alter table public.historico_encomendas enable row level security;

-- Policies and privileged operations will be added in incremental migrations
-- after the authorization model is reviewed and validated.
