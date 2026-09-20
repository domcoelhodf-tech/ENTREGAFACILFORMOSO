CREATE TABLE public.encomendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morador text NOT NULL,
  apartamento text NOT NULL,
  descricao text,
  recebida_em timestamptz NOT NULL DEFAULT now(),
  retirada_em timestamptz,
  retirada_por text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.encomendas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.encomendas TO authenticated;
GRANT ALL ON public.encomendas TO service_role;

ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Encomendas visiveis para todos" ON public.encomendas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Qualquer um pode cadastrar encomenda" ON public.encomendas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Qualquer um pode retirar encomenda" ON public.encomendas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.encomendas (morador, apartamento, descricao, recebida_em) VALUES
  ('Maria Souza', '101', 'Caixa média - Mercado Livre', now() - interval '2 hours'),
  ('João Pereira', '204', 'Envelope - Correios', now() - interval '5 hours'),
  ('Ana Lima', '307', 'Caixa grande - Amazon', now() - interval '1 day'),
  ('Carlos Dias', '402', 'Sacola - iFood Mercado', now() - interval '3 hours');

INSERT INTO public.encomendas (morador, apartamento, descricao, recebida_em, retirada_em, retirada_por) VALUES
  ('Beatriz Alves', '502', 'Caixa pequena - Shopee', now() - interval '3 days', now() - interval '2 days', 'Beatriz Alves');