CREATE TABLE IF NOT EXISTS public.encomendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morador text NOT NULL,
  apartamento text NOT NULL,
  descricao text,
  recebida_em timestamptz NOT NULL DEFAULT now(),
  retirada_em timestamptz,
  retirada_por text,
  morador_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  apartment text,
  role text NOT NULL DEFAULT 'morador' CHECK (role IN ('sindico','colaborador','morador')),
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_sindico()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'sindico' AND approval_status = 'approved'); $$;

CREATE OR REPLACE FUNCTION public.is_operador()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('sindico','colaborador') AND approval_status = 'approved'); $$;

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
REVOKE ALL ON public.encomendas FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.encomendas TO authenticated;

DROP POLICY IF EXISTS "Profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "Sindico manages profiles" ON public.profiles;
CREATE POLICY "Profiles self read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_sindico());
CREATE POLICY "Sindico manages profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_sindico()) WITH CHECK (public.is_sindico());

DROP POLICY IF EXISTS "Role based view encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Operators insert encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Operators or owner update encomendas" ON public.encomendas;
CREATE POLICY "Role based view encomendas" ON public.encomendas FOR SELECT TO authenticated USING (public.is_operador() OR morador_user_id = auth.uid());
CREATE POLICY "Operators insert encomendas" ON public.encomendas FOR INSERT TO authenticated WITH CHECK (public.is_operador());
CREATE POLICY "Operators or owner update encomendas" ON public.encomendas FOR UPDATE TO authenticated USING (public.is_operador() OR morador_user_id = auth.uid()) WITH CHECK (public.is_operador() OR morador_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN INSERT INTO public.profiles (id, full_name, approval_status) VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', new.email), 'pending') ON CONFLICT (id) DO NOTHING; RETURN new; END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
