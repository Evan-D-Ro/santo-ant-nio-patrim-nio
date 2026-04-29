import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { LOCAIS, type EstadoConservacao, type Item, type StatusItem } from "@/lib/types";
import { useAccessControl } from "@/hooks/use-access-control";
import { toast } from "sonner";

interface Props {
  initial?: Item;
  onDone?: (item: Item) => void;
  readOnly?: boolean;
}

export function ItemForm({ initial, onDone, readOnly }: Props) {
  const { categorias, addItem, updateItem, itens } = useStore();
  const { canManageInventory } = useAccessControl();
  const isReadOnly = readOnly ?? !canManageInventory;
  const [form, setForm] = useState({
    nome: initial?.nome ?? "",
    descricao: initial?.descricao ?? "",
    categoriaId: initial?.categoriaId ?? categorias[0]?.id ?? "",
    quantidade: initial?.quantidade ?? 1,
    numeroPatrimonio: initial?.numeroPatrimonio ?? "",
    valorAproximado: initial?.valorAproximado ?? 0,
    estadoConservacao: (initial?.estadoConservacao ?? "Novo") as EstadoConservacao,
    status: (initial?.status ?? "Em uso") as StatusItem,
    marca: initial?.marca ?? "",
    modelo: initial?.modelo ?? "",
    equipamentoGeral: initial?.equipamentoGeral ?? false,
    localAtual: initial?.localAtual ?? LOCAIS[0],
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error("Seu acesso é somente consulta.");
      return;
    }
    if (!form.nome.trim() || !form.categoriaId || form.quantidade < 1) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    try {
      if (initial) {
        await updateItem(initial.id, form);
        toast.success("Item atualizado");
        onDone?.({ ...initial, ...form });
      } else {
        const item = await addItem(form);
        toast.success("Item cadastrado");
        onDone?.(item);
      }
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel salvar o item.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Nome do item *</Label>
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required disabled={isReadOnly} />
        </div>
        <div className="md:col-span-2">
          <Label>Descrição</Label>
          <Textarea
            value={form.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            rows={2}
            disabled={isReadOnly}
          />
        </div>

        <div>
          <Label>Categoria *</Label>
          <Select value={form.categoriaId} onValueChange={(v) => set("categoriaId", v)} disabled={isReadOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Local atual *</Label>
          <Select value={form.localAtual} onValueChange={(v) => set("localAtual", v)} disabled={isReadOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOCAIS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Quantidade *</Label>
          <Input
            type="number" min={1}
            value={form.quantidade}
            onChange={(e) => set("quantidade", Number(e.target.value))}
            disabled={isReadOnly}
          />
        </div>

        <div>
          <Label>Nº de Patrimônio</Label>
          <Input
            value={form.numeroPatrimonio}
            onChange={(e) => set("numeroPatrimonio", e.target.value)}
            placeholder="Ex.: PSA-0099"
            disabled={isReadOnly}
          />
        </div>

        <div>
          <Label>Valor aproximado (R$)</Label>
          <Input
            type="number" min={0} step="0.01"
            value={form.valorAproximado}
            onChange={(e) => set("valorAproximado", Number(e.target.value))}
            disabled={isReadOnly}
          />
        </div>

        <div>
          <Label>Estado de conservação *</Label>
          <Select
            value={form.estadoConservacao}
            onValueChange={(v) => set("estadoConservacao", v as EstadoConservacao)}
            disabled={isReadOnly}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["Novo", "Bom", "Regular", "Ruim"] as EstadoConservacao[]).map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status *</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v as StatusItem)} disabled={isReadOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["Em uso", "Em manutenção", "Inativo", "Baixado"] as StatusItem[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Marca</Label>
          <Input value={form.marca} onChange={(e) => set("marca", e.target.value)} disabled={isReadOnly} />
        </div>

        <div>
          <Label>Modelo</Label>
          <Input value={form.modelo} onChange={(e) => set("modelo", e.target.value)} disabled={isReadOnly} />
        </div>

        <div className="md:col-span-2 flex items-center gap-2 rounded-md border bg-muted/30 p-3">
          <Checkbox
            id="geral"
            checked={form.equipamentoGeral}
            onCheckedChange={(v) => set("equipamentoGeral", Boolean(v))}
            disabled={isReadOnly}
          />
          <Label htmlFor="geral" className="cursor-pointer text-sm font-normal">
            Equipamento geral — pode circular livremente entre locais
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isReadOnly}>
          {initial ? "Salvar alterações" : "Cadastrar item"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Total atual no sistema: {itens.length} item(ns).
      </p>
    </form>
  );
}
