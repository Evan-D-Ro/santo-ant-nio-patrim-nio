import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useAccessControl } from "@/hooks/use-access-control";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Categoria } from "@/lib/types";

export const Route = createFileRoute("/categorias")({
  head: () => ({ meta: [{ title: "Categorias • Patrimônio" }] }),
  component: CategoriasPage,
});

function CategoriasPage() {
  const { categorias, itens, addCategoria, updateCategoria, deleteCategoria } = useStore();
  const { canManageInventory } = useAccessControl();
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize os itens por tipo.</p>
        </div>
        {canManageInventory ? (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4" /> Nova categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
              </DialogHeader>
              <CategoriaForm
                initial={editing ?? undefined}
                onSubmit={(c) => {
                  if (editing) {
                    updateCategoria(editing.id, c);
                    toast.success("Categoria atualizada");
                  } else {
                    addCategoria(c);
                    toast.success("Categoria criada");
                  }
                  setOpen(false);
                  setEditing(null);
                }}
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((c) => {
                const count = itens.filter((i) => i.categoriaId === c.id).length;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.descricao || "—"}</TableCell>
                    <TableCell className="text-center">{count}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {canManageInventory ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => {
                              if (count > 0) return toast.error("Há itens vinculados a esta categoria.");
                              deleteCategoria(c.id);
                              toast.success("Categoria removida");
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : null}
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

function CategoriaForm({
  initial, onSubmit,
}: { initial?: Categoria; onSubmit: (c: { nome: string; descricao?: string }) => void }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe um nome.");
    onSubmit({ nome: nome.trim(), descricao: descricao.trim() || undefined });
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label>Nome *</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
      </div>
      <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
    </form>
  );
}
