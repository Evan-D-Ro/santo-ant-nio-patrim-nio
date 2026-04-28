import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, formatBRL } from "@/lib/store";
import { LOCAIS } from "@/lib/types";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios • Patrimônio" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { itens, categorias, manutencoes } = useStore();

  const porCategoria = useMemo(() => categorias.map((c) => {
    const lista = itens.filter((i) => i.categoriaId === c.id);
    return {
      nome: c.nome,
      qtd: lista.reduce((s, i) => s + i.quantidade, 0),
      valor: lista.reduce((s, i) => s + i.quantidade * i.valorAproximado, 0),
    };
  }), [categorias, itens]);

  const porLocal = useMemo(() => LOCAIS.map((l) => {
    const lista = itens.filter((i) => i.localAtual === l);
    return {
      local: l,
      qtd: lista.reduce((s, i) => s + i.quantidade, 0),
      valor: lista.reduce((s, i) => s + i.quantidade * i.valorAproximado, 0),
    };
  }).filter((x) => x.qtd > 0), [itens]);

  const totalGeral = itens.reduce((s, i) => s + i.quantidade * i.valorAproximado, 0);
  const custoManutencao = manutencoes.reduce((s, m) => s + m.custo, 0);
  const maxCat = Math.max(1, ...porCategoria.map((c) => c.valor));
  const maxLocal = Math.max(1, ...porLocal.map((c) => c.valor));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Resumo geral do patrimônio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Patrimônio total" value={formatBRL(totalGeral)} />
        <SummaryCard label="Itens cadastrados" value={String(itens.reduce((s, i) => s + i.quantidade, 0))} />
        <SummaryCard label="Investido em manutenção" value={formatBRL(custoManutencao)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Patrimônio por categoria</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {porCategoria.map((c) => (
              <Bar key={c.nome} label={c.nome} valueLabel={`${c.qtd} itens · ${formatBRL(c.valor)}`} pct={(c.valor / maxCat) * 100} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por local</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {porLocal.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : porLocal.map((c) => (
              <Bar key={c.local} label={c.local} valueLabel={`${c.qtd} itens · ${formatBRL(c.valor)}`} pct={(c.valor / maxLocal) * 100} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-display font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Bar({ label, valueLabel, pct }: { label: string; valueLabel: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{valueLabel}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
    </div>
  );
}
