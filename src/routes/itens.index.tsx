import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useStore, formatBRL } from "@/lib/store";
import { LOCAIS, type EstadoConservacao, type StatusItem } from "@/lib/types";
import { EstadoBadge, StatusBadge } from "@/components/Badges";
import { ItemForm } from "@/components/ItemForm";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/itens")({
  head: () => ({
    meta: [{ title: "Itens • Patrimônio Paroquial" }],
  }),
  component: ItensPage,
});

const PAGE = 8;

function ItensPage() {
  const { itens, categorias } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [local, setLocal] = useState<string>("todos");
  const [status, setStatus] = useState<string>("todos");
  const [estado, setEstado] = useState<string>("todos");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return itens.filter((i) => {
      if (ql && !`${i.nome} ${i.numeroPatrimonio ?? ""} ${i.marca ?? ""} ${i.modelo ?? ""}`.toLowerCase().includes(ql))
        return false;
      if (cat !== "todas" && i.categoriaId !== cat) return false;
      if (local !== "todos" && i.localAtual !== local) return false;
      if (status !== "todos" && i.status !== status) return false;
      if (estado !== "todos" && i.estadoConservacao !== estado) return false;
      return true;
    });
  }, [itens, q, cat, local, status, estado]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * PAGE, cur * PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold">Itens & Equipamentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todo o patrimônio cadastrado.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Adicionar Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo item de patrimônio</DialogTitle></DialogHeader>
            <ItemForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, patrimônio, marca…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={cat} onValueChange={(v) => { setCat(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={local} onValueChange={(v) => { setLocal(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Local" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos locais</SelectItem>
                {LOCAIS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Status</SelectItem>
                  {(["Em uso", "Em manutenção", "Inativo", "Baixado"] as StatusItem[]).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={estado} onValueChange={(v) => { setEstado(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Estado</SelectItem>
                  {(["Novo", "Bom", "Regular", "Ruim"] as EstadoConservacao[]).map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Item</TableHead>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Nenhum item encontrado.
                    </TableCell>
                  </TableRow>
                ) : slice.map((i) => {
                  const c = categorias.find((x) => x.id === i.categoriaId);
                  return (
                    <TableRow key={i.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Link
                          to="/itens/$itemId"
                          params={{ itemId: i.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {i.nome}
                        </Link>
                        {i.marca && <div className="text-xs text-muted-foreground">{i.marca} {i.modelo}</div>}
                      </TableCell>
                      <TableCell className="text-sm font-mono">{i.numeroPatrimonio ?? "—"}</TableCell>
                      <TableCell className="text-sm">{c?.nome ?? "—"}</TableCell>
                      <TableCell className="text-sm">{i.localAtual}</TableCell>
                      <TableCell>{i.quantidade}</TableCell>
                      <TableCell><EstadoBadge estado={i.estadoConservacao} /></TableCell>
                      <TableCell><StatusBadge status={i.status} /></TableCell>
                      <TableCell className="text-right text-sm">{formatBRL(i.valorAproximado)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filtered.length} resultado(s) · página {cur} de {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cur === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={cur === pages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
