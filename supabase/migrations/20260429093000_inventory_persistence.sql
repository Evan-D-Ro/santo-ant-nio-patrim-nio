-- Inventory tables backed by Supabase.
-- Read access stays available to authenticated users.
-- Write access is restricted to users whose app_metadata.access_level is "admin".

create or replace function public.inventory_is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'access_level', 'admin') = 'admin';
$$;

create table if not exists public.categorias (
  id text primary key,
  nome text not null,
  descricao text
);

create table if not exists public.itens (
  id text primary key,
  nome text not null,
  descricao text,
  categoria_id text not null references public.categorias(id) on delete restrict,
  quantidade integer not null default 1,
  numero_patrimonio text,
  data_registro date not null,
  valor_aproximado numeric(12,2) not null default 0,
  estado_conservacao text not null,
  status text not null,
  marca text,
  modelo text,
  equipamento_geral boolean not null default false,
  local_atual text not null,
  foto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_documentos (
  id text primary key,
  item_id text not null references public.itens(id) on delete cascade,
  tipo text not null,
  nome text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.item_historico (
  id text primary key,
  item_id text not null references public.itens(id) on delete cascade,
  data timestamptz not null,
  acao text not null,
  responsavel text not null,
  observacao text
);

create table if not exists public.movimentacoes (
  id text primary key,
  item_id text not null references public.itens(id) on delete cascade,
  data timestamptz not null,
  origem text not null,
  destino text not null,
  responsavel text not null,
  motivo text not null
);

create table if not exists public.manutencoes (
  id text primary key,
  item_id text not null references public.itens(id) on delete cascade,
  tipo text not null,
  descricao text not null,
  data date not null,
  custo numeric(12,2) not null default 0,
  fornecedor text not null,
  status text not null
);

alter table public.categorias enable row level security;
alter table public.itens enable row level security;
alter table public.item_documentos enable row level security;
alter table public.item_historico enable row level security;
alter table public.movimentacoes enable row level security;
alter table public.manutencoes enable row level security;

drop policy if exists "Public can view item files" on storage.objects;
drop policy if exists "Authenticated users can upload item files" on storage.objects;
drop policy if exists "Authenticated users can update item files" on storage.objects;
drop policy if exists "Authenticated users can delete item files" on storage.objects;

create policy "Public can view item files"
on storage.objects
for select
using (bucket_id = 'item-files');

create policy "Admins can upload item files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'item-files' and public.inventory_is_admin());

create policy "Admins can update item files"
on storage.objects
for update
to authenticated
using (bucket_id = 'item-files' and public.inventory_is_admin())
with check (bucket_id = 'item-files' and public.inventory_is_admin());

create policy "Admins can delete item files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'item-files' and public.inventory_is_admin());

create policy "Authenticated users can read categorias"
on public.categorias
for select
to authenticated
using (true);

create policy "Admins can write categorias"
on public.categorias
for insert
to authenticated
with check (public.inventory_is_admin());

create policy "Admins can update categorias"
on public.categorias
for update
to authenticated
using (public.inventory_is_admin())
with check (public.inventory_is_admin());

create policy "Admins can delete categorias"
on public.categorias
for delete
to authenticated
using (public.inventory_is_admin());

create policy "Authenticated users can read itens"
on public.itens
for select
to authenticated
using (true);

create policy "Admins can write itens"
on public.itens
for insert
to authenticated
with check (public.inventory_is_admin());

create policy "Admins can update itens"
on public.itens
for update
to authenticated
using (public.inventory_is_admin())
with check (public.inventory_is_admin());

create policy "Admins can delete itens"
on public.itens
for delete
to authenticated
using (public.inventory_is_admin());

create policy "Authenticated users can read item documents"
on public.item_documentos
for select
to authenticated
using (true);

create policy "Admins can write item documents"
on public.item_documentos
for insert
to authenticated
with check (public.inventory_is_admin());

create policy "Admins can update item documents"
on public.item_documentos
for update
to authenticated
using (public.inventory_is_admin())
with check (public.inventory_is_admin());

create policy "Admins can delete item documents"
on public.item_documentos
for delete
to authenticated
using (public.inventory_is_admin());

create policy "Authenticated users can read item history"
on public.item_historico
for select
to authenticated
using (true);

create policy "Admins can write item history"
on public.item_historico
for insert
to authenticated
with check (public.inventory_is_admin());

create policy "Authenticated users can read movimentacoes"
on public.movimentacoes
for select
to authenticated
using (true);

create policy "Admins can write movimentacoes"
on public.movimentacoes
for insert
to authenticated
with check (public.inventory_is_admin());

create policy "Admins can update movimentacoes"
on public.movimentacoes
for update
to authenticated
using (public.inventory_is_admin())
with check (public.inventory_is_admin());

create policy "Admins can delete movimentacoes"
on public.movimentacoes
for delete
to authenticated
using (public.inventory_is_admin());

create policy "Authenticated users can read manutencoes"
on public.manutencoes
for select
to authenticated
using (true);

create policy "Admins can write manutencoes"
on public.manutencoes
for insert
to authenticated
with check (public.inventory_is_admin());

create policy "Admins can update manutencoes"
on public.manutencoes
for update
to authenticated
using (public.inventory_is_admin())
with check (public.inventory_is_admin());

create policy "Admins can delete manutencoes"
on public.manutencoes
for delete
to authenticated
using (public.inventory_is_admin());

insert into public.categorias (id, nome, descricao) values
  ('c1', 'Litúrgicos', 'Objetos sagrados e paramentos'),
  ('c2', 'Móveis', 'Mobiliário em geral'),
  ('c3', 'Eletrônicos', 'Áudio, vídeo, projetores'),
  ('c4', 'Informática', 'Computadores e periféricos'),
  ('c5', 'Instrumentos Musicais', 'Instrumentos da pastoral')
on conflict (id) do nothing;

insert into public.itens (
  id, nome, descricao, categoria_id, quantidade, numero_patrimonio, data_registro,
  valor_aproximado, estado_conservacao, status, marca, modelo, equipamento_geral, local_atual, foto_url
) values
  ('i1', 'Cálice em prata', 'Cálice usado nas celebrações dominicais', 'c1', 2, 'PSA-0001', '2023-03-12', 4500, 'Bom', 'Em uso', '—', '—', false, 'Sacristia', null),
  ('i2', 'Projetor Epson', 'Projetor para eventos no salão', 'c3', 1, 'PSA-0014', '2024-06-01', 3200, 'Novo', 'Em uso', 'Epson', 'PowerLite X49', true, 'Salão Paroquial', null),
  ('i3', 'Notebook Dell', 'Uso administrativo da secretaria', 'c4', 1, 'PSA-0021', '2024-01-20', 4800, 'Bom', 'Em manutenção', 'Dell', 'Inspiron 15', false, 'Secretaria Paroquial', null),
  ('i4', 'Bancos de madeira', 'Bancos longos da nave central', 'c2', 24, 'PSA-0030', '2020-11-05', 18000, 'Regular', 'Em uso', null, null, false, 'Igreja Matriz', null),
  ('i5', 'Violão acústico', 'Pastoral da Música', 'c5', 1, 'PSA-0042', '2023-09-15', 1200, 'Bom', 'Em uso', 'Yamaha', 'C40', true, 'Salão Paroquial', null)
on conflict (id) do nothing;

insert into public.item_historico (id, item_id, data, acao, responsavel, observacao) values
  ('h1', 'i1', '2023-03-12T10:00:00Z', 'Cadastro inicial', 'Pe. João', null),
  ('h2', 'i2', '2024-06-01T09:00:00Z', 'Cadastro inicial', 'Secretaria', null),
  ('h3', 'i3', '2024-01-20T08:00:00Z', 'Cadastro inicial', 'Maria', null),
  ('h4', 'i3', '2025-02-10T14:00:00Z', 'Enviado para manutenção', 'Maria', null),
  ('h5', 'i4', now(), 'Cadastro inicial', 'Sistema', null),
  ('h6', 'i5', now(), 'Cadastro inicial', 'Sistema', null)
on conflict (id) do nothing;

insert into public.movimentacoes (id, item_id, data, origem, destino, responsavel, motivo) values
  ('m1', 'i2', '2025-04-20T10:00:00Z', 'Almoxarifado', 'Salão Paroquial', 'Diác. Carlos', 'Encontro de catequistas'),
  ('m2', 'i5', '2025-04-22T18:30:00Z', 'Casa Paroquial', 'Salão Paroquial', 'Ana (Pastoral Música)', 'Ensaio do coral')
on conflict (id) do nothing;

insert into public.manutencoes (id, item_id, tipo, descricao, data, custo, fornecedor, status) values
  ('mt1', 'i3', 'Corretiva', 'Tela apresentando linhas verticais', '2025-02-10', 450, 'Tech Rancharia', 'Em andamento'),
  ('mt2', 'i4', 'Preventiva', 'Lustração e reaperto', '2025-05-05', 0, 'Mutirão paroquial', 'Pendente')
on conflict (id) do nothing;
