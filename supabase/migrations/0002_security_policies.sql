create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = required_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin'::public.app_role);
$$;

revoke all on function public.has_role(public.app_role) from public;
revoke all on function public.is_admin() from public;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_admin() to authenticated;

create policy profiles_select_own_or_admin
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_update_own_or_admin
on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy user_roles_select_own_or_admin
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy user_roles_admin_manage
on public.user_roles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy structure_admin_manage
on public.blocos for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy units_admin_manage
on public.unidades for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy residents_admin_manage
on public.moradores for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy residents_own_read
on public.moradores for select to authenticated
using (profile_id = auth.uid());

create policy packages_admin_manage
on public.encomendas for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy packages_portaria_read
on public.encomendas for select to authenticated
using (public.has_role('portaria'::public.app_role));

create policy packages_portaria_insert
on public.encomendas for insert to authenticated
with check (
  public.has_role('portaria'::public.app_role)
  and criado_por = auth.uid()
);

create policy packages_portaria_update
on public.encomendas for update to authenticated
using (public.has_role('portaria'::public.app_role))
with check (public.has_role('portaria'::public.app_role));

create policy packages_resident_read_own
on public.encomendas for select to authenticated
using (
  exists (
    select 1
    from public.moradores m
    where m.id = morador_id
      and m.profile_id = auth.uid()
  )
);

create policy history_admin_read
on public.historico_encomendas for select to authenticated
using (public.is_admin());

create policy history_portaria_read
on public.historico_encomendas for select to authenticated
using (public.has_role('portaria'::public.app_role));

create policy history_admin_insert
on public.historico_encomendas for insert to authenticated
with check (public.is_admin());

comment on function public.has_role(public.app_role) is 'Checks the authenticated user role without trusting client-provided role data.';
comment on function public.is_admin() is 'Checks whether the authenticated user has the admin role.';
