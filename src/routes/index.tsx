import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { PackageCheck, Package, Clock, Building2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrega Fácil — Res. Formoso" },
      {
        name: "description",
        content:
          "Controle seguro de encomendas do Residencial Formoso.",
      },
    ],
  }),
  component: Index,
});

type Encomenda = {
  id: string;
  morador: string;
  apartamento: string;
  descricao: string | null;
  recebida_em: string;
  retirada_em: string | null;
  retirada_por: string | null;
};

function formatarData(valor: string) {
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEntrando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      toast.error("Não foi possível entrar. Confira e-mail e senha.");
    }

    setEntrando(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Entrega Fácil</h1>
            <p className="text-sm text-muted-foreground">Residencial Formoso</p>
          </div>

          <form className="space-y-4" onSubmit={entrar}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={entrando}>
              {entrando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Acesso restrito a usuários cadastrados no sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Index() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [selecionada, setSelecionada] = useState<Encomenda | null>(null);
  const [nomeRetirada, setNomeRetirada] = useState("");

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (ativo) {
        setSession(data.session);
        setCarregandoSessao(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao);
      setCarregandoSessao(false);
    });

    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const { data: encomendas, isLoading } = useQuery({
    queryKey: ["encomendas"],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encomendas")
        .select("*")
        .order("recebida_em", { ascending: false });
      if (error) throw error;
      return data as Encomenda[];
    },
  });

  const retirar = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("encomendas")
        .update({ retirada_em: new Date().toISOString(), retirada_por: nome })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encomendas"] });
      toast.success("Retirada registrada!");
      setSelecionada(null);
      setNomeRetirada("");
    },
    onError: () => toast.error("Não foi possível registrar a retirada."),
  });

  async function sair() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  if (carregandoSessao) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  if (!session) {
    return <Login />;
  }

  const pendentes = (encomendas ?? []).filter((e) => !e.retirada_em);
  const retiradas = (encomendas ?? []).filter((e) => e.retirada_em);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Entrega Fácil</h1>
              <p className="text-sm text-muted-foreground">Res. Formoso — portaria</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={sair}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Encomendas na portaria</h2>
            <Badge variant="secondary">{pendentes.length} aguardando</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : pendentes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <PackageCheck className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">Nenhuma encomenda pendente</p>
                <p className="text-sm text-muted-foreground">Tudo já foi retirado pelos moradores.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendentes.map((e) => (
                <Card key={e.id}>
                  <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {e.morador}
                          <span className="ml-2 text-sm font-normal text-muted-foreground">Apto {e.apartamento}</span>
                        </p>
                        {e.descricao && <p className="text-sm text-muted-foreground">{e.descricao}</p>}
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> Recebida em {formatarData(e.recebida_em)}
                        </p>
                      </div>
                    </div>
                    <Button className="sm:w-auto" onClick={() => { setSelecionada(e); setNomeRetirada(e.morador); }}>
                      Retirar encomenda
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {retiradas.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Retiradas recentes</h2>
            <div className="space-y-2">
              {retiradas.map((e) => (
                <Card key={e.id} className="bg-muted/40">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.morador} — Apto {e.apartamento}</p>
                      <p className="text-xs text-muted-foreground">Retirada por {e.retirada_por} em {e.retirada_em ? formatarData(e.retirada_em) : ""}</p>
                    </div>
                    <PackageCheck className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <Dialog open={selecionada !== null} onOpenChange={(aberto) => { if (!aberto) setSelecionada(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar retirada</DialogTitle>
            <DialogDescription>
              {selecionada ? `Encomenda de ${selecionada.morador}, apto ${selecionada.apartamento}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nome">Quem está retirando</Label>
            <Input id="nome" value={nomeRetirada} onChange={(event) => setNomeRetirada(event.target.value)} placeholder="Nome de quem retira" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelecionada(null)}>Cancelar</Button>
            <Button disabled={!nomeRetirada.trim() || retirar.isPending} onClick={() => selecionada && retirar.mutate({ id: selecionada.id, nome: nomeRetirada.trim() })}>
              {retirar.isPending ? "Registrando..." : "Confirmar retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
