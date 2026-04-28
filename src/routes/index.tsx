import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, formatBRL, formatDateTime } from "@/lib/store";
import { Boxes, Wrench, PauseCircle, Coins, ArrowRight } from "lucide-react";
import { ManutencaoStatusBadge } from "@/components/Badges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard • Patrimônio Paroquial" },
      { name: "description", content: "Visão geral do patrimônio da Paróquia Santo Antônio." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { itens, manutencoes, movimentacoes } = useStore();

  const total = itens.reduce((s, i) => s + i.quantidade, 0);
  const emManutencao = itens.filter((i) => i.status === "Em manutenção").length;
  const inativos = itens.filter((i) => i.status === "Inativo" || i.status === "Baixado").length;
  const valorTotal = itens.reduce((s, i) => s + i.valorAproximado * i.quantidade, 0);

  const cards = [
    { label: "Total de Itens", value: total, icon: Boxes, hint: `${itens.length} registros` },
    { label: "Em Manutenção", value: emManutencao, icon: Wrench, hint: "ativos no momento" },
    { label: "Inativos / Baixados", value: inativos, icon: PauseCircle, hint: "fora de uso" },
    { label: "Valor Estimado", value: formatBRL(valorTotal), icon: Coins, hint: "patrimônio total" },
  ];

  const ultimasMov = movimentacoes.slice(0, 5);
  const pendentes = manutencoes.filter((m) => m.status !== "Concluído").slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do patrimônio paroquial.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{c.label}</div>
                  <div className="mt-1 text-2xl font-display font-semibold">{c.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas movimentações</CardTitle>
            <Link to="/itens" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Ver itens <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {ultimasMov.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem movimentações registradas.</p>
            ) : (
              <ul className="divide-y">
                {ultimasMov.map((m) => {
                  const item = itens.find((i) => i.id === m.itemId);
                  return (
                    <li key={m.id} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{item?.nome ?? "Item"}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.origem} → <span className="text-foreground">{m.destino}</span> · {m.responsavel}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(m.data)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Manutenções pendentes</CardTitle>
            <Link to="/manutencoes" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {pendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada pendente. 🎉</p>
            ) : (
              <ul className="divide-y">
                {pendentes.map((m) => {
                  const item = itens.find((i) => i.id === m.itemId);
                  return (
                    <li key={m.id} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{item?.nome ?? "Item"}</div>
                        <div className="text-xs text-muted-foreground">{m.descricao}</div>
                      </div>
                      <ManutencaoStatusBadge status={m.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
