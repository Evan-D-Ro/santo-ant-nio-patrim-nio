import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useStore, formatBRL, formatDate, formatDateTime } from "@/lib/store";
import { LOCAIS, type StatusItem, type StatusManutencao, type TipoManutencao } from "@/lib/types";
import { EstadoBadge, ManutencaoStatusBadge, StatusBadge } from "@/components/Badges";
import { ItemForm } from "@/components/ItemForm";
import { ArrowLeft, ArrowRightLeft, Wrench, RefreshCw, Pencil, FileText, Image as ImageIcon, Trash2, Star, ImageOff } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import type { DocumentoMidia } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/itens/$itemId")({
  head: ({ params }) => ({
    meta: [{ title: `Item ${params.itemId} • Patrimônio` }],
  }),
  component: ItemDetail,
  notFoundComponent: () => <div className="p-6">Item não encontrado.</div>,
});

function ItemDetail() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const { itens, categorias, movimentacoes, manutencoes, changeStatus } = useStore();

  const item = itens.find((i) => i.id === itemId);
  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Item não encontrado.</p>
        <Button onClick={() => navigate({ to: "/itens" })}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
      </div>
    );
  }

  const cat = categorias.find((c) => c.id === item.categoriaId);
  const mov = movimentacoes.filter((m) => m.itemId === item.id);
  const man = manutencoes.filter((m) => m.itemId === item.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/itens" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para itens
          </Link>
          <h1 className="text-2xl font-display font-semibold mt-1">{item.nome}</h1>
          <div className="text-sm text-muted-foreground">
            {cat?.nome} · {item.localAtual} · Patrimônio {item.numeroPatrimonio ?? "—"}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <EstadoBadge estado={item.estadoConservacao} />
            {item.equipamentoGeral && (
              <span className="inline-flex items-center rounded-md border border-accent bg-accent/30 px-2 py-0.5 text-xs text-accent-foreground">
                Equipamento geral
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <MovimentacaoDialog itemId={item.id} origem={item.localAtual} onDone={() => {}} />
          <ManutencaoDialog itemId={item.id} onDone={() => {}} />
          <StatusDialog
            itemId={item.id}
            current={item.status}
            onApply={(s, r, obs) => { changeStatus(item.id, s, r, obs); toast.success("Status atualizado"); }}
          />
          <EditarDialog itemId={item.id} />
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações Gerais</TabsTrigger>
          <TabsTrigger value="mov">Movimentações ({mov.length})</TabsTrigger>
          <TabsTrigger value="man">Manutenções ({man.length})</TabsTrigger>
          <TabsTrigger value="doc">Documentos & Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card><CardContent className="p-6 grid gap-4 md:grid-cols-2">
            <Info k="Descrição" v={item.descricao || "—"} />
            <Info k="Categoria" v={cat?.nome ?? "—"} />
            <Info k="Local atual" v={item.localAtual} />
            <Info k="Quantidade" v={String(item.quantidade)} />
            <Info k="Marca / Modelo" v={[item.marca, item.modelo].filter(Boolean).join(" ") || "—"} />
            <Info k="Nº de Patrimônio" v={item.numeroPatrimonio ?? "—"} />
            <Info k="Valor aproximado" v={formatBRL(item.valorAproximado)} />
            <Info k="Data de registro" v={formatDate(item.dataRegistro)} />

            <div className="md:col-span-2">
              <div className="text-sm font-medium mb-2">Histórico de ações</div>
              {item.historico.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem ações registradas.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {[...item.historico].reverse().map((h) => (
                    <li key={h.id} className="p-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{h.acao}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(h.data)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">por {h.responsavel}</div>
                      {h.observacao && <div className="text-xs mt-1">{h.observacao}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="mov" className="mt-4">
          <Card><CardContent className="p-6">
            {mov.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem movimentações registradas.</p>
            ) : (
              <ul className="divide-y">
                {mov.map((m) => (
                  <li key={m.id} className="py-3 flex justify-between items-start gap-4">
                    <div>
                      <div className="text-sm font-medium">{m.origem} → {m.destino}</div>
                      <div className="text-xs text-muted-foreground">{m.motivo} · por {m.responsavel}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(m.data)}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="man" className="mt-4">
          <Card><CardContent className="p-6">
            {man.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem manutenções registradas.</p>
            ) : (
              <ul className="divide-y">
                {man.map((m) => (
                  <li key={m.id} className="py-3 flex justify-between items-start gap-4">
                    <div>
                      <div className="text-sm font-medium">{m.tipo} — {m.descricao}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.fornecedor} · {formatDate(m.data)} · {formatBRL(m.custo)}
                      </div>
                    </div>
                    <ManutencaoStatusBadge status={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="doc" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Documentos & Mídia</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                <Paperclip className="mx-auto mb-2 h-6 w-6" />
                Área preparada para upload de Nota Fiscal, Garantia, Manual e Fotos.
                <div className="mt-1 text-xs">(Será integrada ao armazenamento da Lovable Cloud.)</div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { i: FileText, l: "Nota Fiscal" },
                  { i: FileText, l: "Garantia" },
                  { i: FileText, l: "Manual" },
                  { i: ImageIcon, l: "Fotos" },
                ].map((x) => (
                  <div key={x.l} className="rounded-md border bg-muted/20 p-4 text-center text-xs">
                    <x.i className="mx-auto mb-1 h-5 w-5 text-primary" />
                    {x.l}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="text-sm font-medium">{v}</div>
    </div>
  );
}

function MovimentacaoDialog({ itemId, origem }: { itemId: string; origem: string; onDone: () => void }) {
  const { registrarMovimentacao } = useStore();
  const [open, setOpen] = useState(false);
  const [destino, setDestino] = useState<string>(LOCAIS[0]);
  const [responsavel, setResponsavel] = useState("");
  const [motivo, setMotivo] = useState("Transferência");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!responsavel.trim()) { toast.error("Informe o responsável."); return; }
    if (destino === origem) { toast.error("Destino igual ao local atual."); return; }
    registrarMovimentacao({ itemId, origem, destino, responsavel, motivo });
    toast.success("Movimentação registrada");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><ArrowRightLeft className="h-4 w-4" /> Movimentar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar movimentação</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Origem</Label>
            <Input value={origem} disabled />
          </div>
          <div>
            <Label>Destino *</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCAIS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Responsável *</Label>
            <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome de quem está movendo" />
          </div>
          <div>
            <Label>Motivo</Label>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <DialogFooter><Button type="submit">Confirmar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManutencaoDialog({ itemId }: { itemId: string; onDone: () => void }) {
  const { registrarManutencao } = useStore();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoManutencao>("Corretiva");
  const [descricao, setDescricao] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [custo, setCusto] = useState(0);
  const [status, setStatus] = useState<StatusManutencao>("Em andamento");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) { toast.error("Descreva o problema."); return; }
    registrarManutencao({
      itemId, tipo, descricao, fornecedor: fornecedor || "Não informado",
      custo, status, data: new Date().toISOString().slice(0, 10),
    });
    toast.success("Manutenção registrada");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Wrench className="h-4 w-4" /> Enviar p/ manutenção</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar manutenção</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoManutencao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preventiva">Preventiva</SelectItem>
                  <SelectItem value="Corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusManutencao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Descrição do problema *</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fornecedor / Técnico</Label>
              <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
            </div>
            <div>
              <Label>Custo (R$)</Label>
              <Input type="number" min={0} step="0.01" value={custo} onChange={(e) => setCusto(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter><Button type="submit">Registrar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusDialog({
  current, onApply,
}: { itemId: string; current: StatusItem; onApply: (s: StatusItem, r: string, obs?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<StatusItem>(current);
  const [responsavel, setResponsavel] = useState("");
  const [obs, setObs] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!responsavel.trim()) { toast.error("Assine com seu nome."); return; }
    onApply(status, responsavel, obs || undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Mudar status</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Alterar status do item</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Novo status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusItem)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Em uso", "Em manutenção", "Inativo", "Baixado"] as StatusItem[]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assinatura (seu nome) *</Label>
            <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>
          <DialogFooter><Button type="submit">Aplicar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarDialog({ itemId }: { itemId: string }) {
  const { itens } = useStore();
  const [open, setOpen] = useState(false);
  const item = itens.find((i) => i.id === itemId);
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Pencil className="h-4 w-4" /> Editar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar item</DialogTitle></DialogHeader>
        <ItemForm initial={item} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
