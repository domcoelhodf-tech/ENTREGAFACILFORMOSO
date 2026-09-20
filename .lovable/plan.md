# App de Retirada de Encomendas

App simples e mobile-first: uma lista de encomendas pendentes e o botão "Retirar encomenda".

## Funcionamento

1. **Lista de encomendas pendentes** — cada card mostra nome do morador, empresa (Correios, Mercado Livre etc.) e data/hora de chegada.
2. **Adicionar encomenda** — botão "+ Nova encomenda" abre um formulário rápido (nome + empresa, código de rastreio opcional).
3. **Retirar encomenda** — botão "Retirar" em cada card; toca, confirma, e a encomenda sai da lista imediatamente.
4. **Histórico** — seção "Retiradas hoje/retiradas" com tudo que já saiu, com data e hora da retirada.
5. Sem login — pensado para uso em um aparelho só (portaria/síndico).

## Design

- Direção visual única, limpa e amigável: fundo claro quente, cartões grandes com botão de ação bem visível, tipografia arredondada (fonte como Nunito ou similar), destaque em verde para a ação de retirada.
- Otimizado para celular (uso com uma mão), mas funciona bem em desktop.

## Técnico

- **Lovable Cloud** (banco de dados) para guardar as encomendas — nada se perde ao fechar o app.
  - Tabela `packages`: id, resident_name, company, tracking_code (opcional), arrived_at, picked_up_at, created_at.
  - Políticas de acesso liberadas para o app (sem usuários/logins).
  - Migração já com GRANTs e RLS.
- Página única em `src/routes/index.tsx` (substitui o placeholder), com título e descrição próprios no `head()`.
- Server functions (`createServerFn`) para listar, criar e retirar encomendas.

## Etapas

1. Ativar o Lovable Cloud.
2. Criar a migração (tabela + políticas + GRANTs).
3. Construir a página: lista, formulário de nova encomenda, botão de retirada e histórico.
4. Testar no preview: adicionar, retirar e conferir o histórico.
