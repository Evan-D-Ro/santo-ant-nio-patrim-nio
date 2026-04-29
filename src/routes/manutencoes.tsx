import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore, formatBRL, formatDate } from "@/lib/store";
import { ManutencaoStatusBadge } from "@/components/Badges";
import type { StatusManutencao } from "@/lib/types";
import { useAccessControl } from "@/hooks/use-access-control";

export const Route = createFileRoute("/manutencoes")({
  head: () => ({ meta: [{ title: "Manutenções • Patrimônio" }] }),
  component: ManutencoesPage,
});

function ManutencoesPage() {
  const { manutencoes, itens, updateManutencao } = useStore();
  const { canManageInventory } = useAccessControl();
  const [filtro, setFiltro] = useState<string>("todos");

  const list = useMemo(() => {
    if (filtro === "todos") return manutencoes;
    return manutencoes.filter((m) => m.status === filtro);
  }, [manutencoes, filtro]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold">Manutenções</h1>
          <p className="text-sm text-muted-foreground">
            Controle das manutenções preventivas e corretivas.
          </p>
        </div>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Pendente">Pendentes</SelectItem>
            <SelectItem value="Em andamento">Em andamento</SelectItem>
            <SelectItem value="Concluído">Concluídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Item</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Nenhuma manutenção encontrada.
                  </TableCell>
                </TableRow>
              ) : list.map((m) => {
                const item = itens.find((i) => i.id === m.itemId);
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      {item ? (
                        <Link to="/itens/$itemId" params={{ itemId: item.id }} className="text-primary hover:underline font-medium">
                          {item.nome}
                        </Link>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{m.tipo}</TableCell>
                    <TableCell className="text-sm max-w-[260px] truncate" title={m.descricao}>{m.descricao}</TableCell>
                    <TableCell className="text-sm">{m.fornecedor}</TableCell>
                    <TableCell className="text-sm">{formatDate(m.data)}</TableCell>
                    <TableCell className="text-right text-sm">{formatBRL(m.custo)}</TableCell>
                    <TableCell><ManutencaoStatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-right">
                      {canManageInventory ? (
                        <Select
                          value={m.status}
                          onValueChange={async (v) => {
                            try {
                              await updateManutencao(m.id, { status: v as StatusManutencao });
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-36 ml-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Em andamento">Em andamento</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">Somente consulta</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
