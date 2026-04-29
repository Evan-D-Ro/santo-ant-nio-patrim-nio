import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Categoria,
  Item,
  Manutencao,
  Movimentacao,
  StatusItem,
  AcaoHistorico,
  DocumentoMidia,
} from "./types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const now = () => new Date().toISOString();
const db = () => supabase as any;

function stripUndefined<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

function storagePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/item-files/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

function cacheBustUrl(url?: string, version?: string) {
  if (!url) return undefined;
  if (!version) return url;
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}v=${encodeURIComponent(version)}`;
}

type ItemRow = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string;
  quantidade: number;
  numero_patrimonio: string | null;
  data_registro: string;
  valor_aproximado: number;
  estado_conservacao: string;
  status: string;
  marca: string | null;
  modelo: string | null;
  equipamento_geral: boolean;
  local_atual: string;
  foto_url: string | null;
  updated_at: string;
};
type CategoriaRow = {
  id: string;
  nome: string;
  descricao: string | null;
};
type DocumentoRow = { id: string; item_id: string; tipo: string; nome: string; url: string };
type HistoricoRow = {
  id: string;
  item_id: string;
  data: string;
  acao: string;
  responsavel: string;
  observacao: string | null;
};
type MovimentacaoRow = {
  id: string;
  item_id: string;
  data: string;
  origem: string;
  destino: string;
  responsavel: string;
  motivo: string;
};
type ManutencaoRow = {
  id: string;
  item_id: string;
  tipo: string;
  descricao: string;
  data: string;
  custo: number;
  fornecedor: string;
  status: string;
};

type StoreSnapshot = {
  categorias: Categoria[];
  itens: Item[];
  movimentacoes: Movimentacao[];
  manutencoes: Manutencao[];
};

function mapItem(
  row: ItemRow,
  documentos: DocumentoRow[],
  historico: HistoricoRow[],
): Item {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? undefined,
    categoriaId: row.categoria_id,
    quantidade: row.quantidade,
    numeroPatrimonio: row.numero_patrimonio ?? undefined,
    dataRegistro: row.data_registro,
    valorAproximado: Number(row.valor_aproximado),
    estadoConservacao: row.estado_conservacao as Item["estadoConservacao"],
    status: row.status as Item["status"],
    marca: row.marca ?? undefined,
    modelo: row.modelo ?? undefined,
    equipamentoGeral: row.equipamento_geral,
    localAtual: row.local_atual,
    fotoUrl: row.foto_url ?? undefined,
    updatedAt: row.updated_at,
    documentos: documentos.map((doc) => ({
      id: doc.id,
      tipo: doc.tipo as DocumentoMidia["tipo"],
      nome: doc.nome,
      url: doc.url,
    })),
    historico: historico.map((h) => ({
      id: h.id,
      data: h.data,
      acao: h.acao,
      responsavel: h.responsavel,
      observacao: h.observacao ?? undefined,
    })),
  };
}

async function loadStoreSnapshot() {
  const client = db();
  const [categoriasRes, itensRes, docsRes, histRes, movRes, manRes] = await Promise.all([
    client.from("categorias").select("*"),
    client.from("itens").select("*"),
    client.from("item_documentos").select("*"),
    client.from("item_historico").select("*"),
    client.from("movimentacoes").select("*"),
    client.from("manutencoes").select("*"),
  ]);

  const error = categoriasRes.error ?? itensRes.error ?? docsRes.error ?? histRes.error ?? movRes.error ?? manRes.error;
  if (error) throw error;

  const docsByItem = new Map<string, DocumentoRow[]>();
  for (const doc of docsRes.data ?? []) {
    const row = doc as DocumentoRow;
    const list = docsByItem.get(row.item_id) ?? [];
    list.push(row);
    docsByItem.set(row.item_id, list);
  }

  const histByItem = new Map<string, HistoricoRow[]>();
  for (const hist of histRes.data ?? []) {
    const row = hist as HistoricoRow;
    const list = histByItem.get(row.item_id) ?? [];
    list.push(row);
    histByItem.set(row.item_id, list);
  }

  return {
    categorias: (categoriasRes.data ?? []).map((c: CategoriaRow) => c as Categoria),
    itens: (itensRes.data ?? []).map((row: ItemRow) =>
      mapItem(
        row,
        docsByItem.get(row.id) ?? [],
        histByItem.get(row.id) ?? [],
      ),
    ),
    movimentacoes: (movRes.data ?? []).map((m: MovimentacaoRow) => {
      const row = m as MovimentacaoRow;
      return {
        id: row.id,
        itemId: row.item_id,
        data: row.data,
        origem: row.origem,
        destino: row.destino,
        responsavel: row.responsavel,
        motivo: row.motivo,
      };
    }),
    manutencoes: (manRes.data ?? []).map((m: ManutencaoRow) => {
      const row = m as ManutencaoRow;
      return {
        id: row.id,
        itemId: row.item_id,
        tipo: row.tipo as Manutencao["tipo"],
        descricao: row.descricao,
        data: row.data,
        custo: Number(row.custo),
        fornecedor: row.fornecedor,
        status: row.status as Manutencao["status"],
      };
    }),
  } satisfies StoreSnapshot;
}

interface StoreCtx {
  loading: boolean;
  categorias: Categoria[];
  itens: Item[];
  movimentacoes: Movimentacao[];
  manutencoes: Manutencao[];
  // categorias
  addCategoria: (c: Omit<Categoria, "id">) => Promise<Categoria>;
  updateCategoria: (id: string, c: Partial<Categoria>) => Promise<void>;
  deleteCategoria: (id: string) => Promise<void>;
  // itens
  addItem: (i: Omit<Item, "id" | "documentos" | "historico" | "dataRegistro"> & { dataRegistro?: string }) => Promise<Item>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  changeStatus: (id: string, status: StatusItem, responsavel: string, observacao?: string) => Promise<void>;
  appendHistorico: (id: string, acao: AcaoHistorico) => Promise<void>;
  // documentos
  addDocumento: (itemId: string, doc: Omit<import("./types").DocumentoMidia, "id">) => Promise<void>;
  removeDocumento: (itemId: string, docId: string) => Promise<void>;
  setFoto: (itemId: string, url: string) => Promise<void>;
  // movimentaÃ§Ã£o
  registrarMovimentacao: (m: Omit<Movimentacao, "id" | "data"> & { data?: string }) => Promise<void>;
  // manutenÃ§Ã£o
  registrarManutencao: (m: Omit<Manutencao, "id">) => Promise<void>;
  updateManutencao: (id: string, patch: Partial<Manutencao>) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [loading, setLoading] = useState(true);

  const syncFromDb = async () => {
    const snapshot = await loadStoreSnapshot();
    setCategorias(snapshot.categorias);
    setItens(snapshot.itens);
    setMovimentacoes(snapshot.movimentacoes);
    setManutencoes(snapshot.manutencoes);
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await syncFromDb();
        if (!active) return;
        setLoading(false);
      } catch (error) {
        if (!active) return;
        console.error(error);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      loading,
      categorias,
      itens,
      movimentacoes,
      manutencoes,
      addCategoria: async (c) => {
        const item = { ...c, id: uid() } as Categoria;
        const { error } = await db().from("categorias").insert({
          id: item.id,
          nome: item.nome,
          descricao: item.descricao ?? null,
        });
        if (error) throw error;
        await syncFromDb();
        return item;
      },
      updateCategoria: async (id, c) => {
        const { error } = await db().from("categorias").update(stripUndefined({
          nome: c.nome,
          descricao: c.descricao ?? null,
        })).eq("id", id);
        if (error) throw error;
        await syncFromDb();
      },
      deleteCategoria: async (id) => {
        const { error } = await db().from("categorias").delete().eq("id", id);
        if (error) throw error;
        await syncFromDb();
      },

      addItem: async (data) => {
        const item: Item = {
          ...data,
          id: uid(),
          dataRegistro: data.dataRegistro ?? now(),
          documentos: [],
          historico: [
            { id: uid(), data: now(), acao: "Cadastro do item", responsavel: "Sistema" },
          ],
        };
        const client = db();
        const { error: itemError } = await client.from("itens").insert({
          id: item.id,
          nome: item.nome,
          descricao: item.descricao ?? null,
          categoria_id: item.categoriaId,
          quantidade: item.quantidade,
          numero_patrimonio: item.numeroPatrimonio ?? null,
          data_registro: item.dataRegistro,
          valor_aproximado: item.valorAproximado,
          estado_conservacao: item.estadoConservacao,
          status: item.status,
          marca: item.marca ?? null,
          modelo: item.modelo ?? null,
          equipamento_geral: item.equipamentoGeral,
          local_atual: item.localAtual,
          foto_url: item.fotoUrl ?? null,
          updated_at: item.updatedAt ?? now(),
        });
        if (itemError) throw itemError;
        const { error: histError } = await client.from("item_historico").insert({
          id: item.historico[0]?.id ?? uid(),
          item_id: item.id,
          data: item.historico[0]?.data ?? now(),
          acao: item.historico[0]?.acao ?? "Cadastro do item",
          responsavel: item.historico[0]?.responsavel ?? "Sistema",
          observacao: item.historico[0]?.observacao ?? null,
        });
        if (histError) throw histError;
        await syncFromDb();
        return item;
      },
      updateItem: async (id, patch) => {
        const { error } = await db().from("itens").update(stripUndefined({
          nome: patch.nome,
          descricao: patch.descricao ?? null,
          categoria_id: patch.categoriaId,
          quantidade: patch.quantidade,
          numero_patrimonio: patch.numeroPatrimonio ?? null,
          data_registro: patch.dataRegistro,
          valor_aproximado: patch.valorAproximado,
          estado_conservacao: patch.estadoConservacao,
          status: patch.status,
          marca: patch.marca ?? null,
          modelo: patch.modelo ?? null,
          equipamento_geral: patch.equipamentoGeral,
          local_atual: patch.localAtual,
          foto_url: patch.fotoUrl ?? null,
          updated_at: now(),
        })).eq("id", id);
        if (error) throw error;
        await syncFromDb();
      },
      deleteItem: async (id) => {
        const { data: docs, error: docsError } = await db()
          .from("item_documentos")
          .select("url")
          .eq("item_id", id);
        if (docsError) throw docsError;
        const typedDocs = (docs ?? []) as Array<{ url: string }>;
        const paths = typedDocs
          .map((doc) => storagePathFromPublicUrl(doc.url))
          .filter((path): path is string => Boolean(path));
        if (paths.length > 0) {
          const { error: storageError } = await db().storage.from("item-files").remove(paths);
          if (storageError) throw storageError;
        }
        const { error } = await db().from("itens").delete().eq("id", id);
        if (error) throw error;
        await syncFromDb();
      },

      changeStatus: async (id, status, responsavel, observacao) => {
        const history = {
          id: uid(),
          data: now(),
          acao: `Status alterado para "${status}"`,
          responsavel,
          observacao,
        };
        const client = db();
        const { error: itemError } = await client.from("itens").update({ status, updated_at: now() }).eq("id", id);
        if (itemError) throw itemError;
        const { error: histError } = await client.from("item_historico").insert({
          id: history.id,
          item_id: id,
          data: history.data,
          acao: history.acao,
          responsavel: history.responsavel,
          observacao: history.observacao ?? null,
        });
        if (histError) throw histError;
        await syncFromDb();
      },


      addDocumento: async (itemId, doc) => {
        const savedDoc = { ...doc, id: uid() };
        const history = {
          id: uid(),
          data: now(),
          acao: `Documento "${doc.nome}" anexado`,
          responsavel: "Sistema",
        };
        const client = db();
        const { error: docError } = await client.from("item_documentos").insert({
          id: savedDoc.id,
          item_id: itemId,
          tipo: savedDoc.tipo,
          nome: savedDoc.nome,
          url: savedDoc.url,
        });
        if (docError) throw docError;
        const { error: histError } = await client.from("item_historico").insert({
          id: history.id,
          item_id: itemId,
          data: history.data,
          acao: history.acao,
          responsavel: history.responsavel,
          observacao: null,
        });
        if (histError) throw histError;
        await syncFromDb();
      },

      removeDocumento: async (itemId, docId) => {
        const { data: doc, error: docError } = await db()
          .from("item_documentos")
          .select("url")
          .eq("id", docId)
          .maybeSingle();
        if (docError) throw docError;
        const path = doc?.url ? storagePathFromPublicUrl(doc.url) : null;
        if (path) {
          const { error: storageError } = await db().storage.from("item-files").remove([path]);
          if (storageError) throw storageError;
        }
        const { error } = await db().from("item_documentos").delete().eq("id", docId);
        if (error) throw error;
        const item = itens.find((x) => x.id === itemId);
        if (item?.fotoUrl && doc?.url === item.fotoUrl) {
          const remainingPhoto = item.documentos.find((d) => d.tipo === "Foto" && d.id !== docId)?.url ?? null;
          const { error: itemError } = await db()
            .from("itens")
            .update({
              foto_url: remainingPhoto,
              updated_at: now(),
            })
            .eq("id", itemId);
          if (itemError) throw itemError;
        }
        await syncFromDb();
      },

      setFoto: async (itemId, url) => {
        const history = {
          id: uid(),
          data: now(),
          acao: "Foto principal atualizada",
          responsavel: "Sistema",
        };
        const client = db();
        const { error: itemError } = await client.from("itens").update({ foto_url: url, updated_at: now() }).eq("id", itemId);
        if (itemError) throw itemError;
        const { error: histError } = await client.from("item_historico").insert({
          id: history.id,
          item_id: itemId,
          data: history.data,
          acao: history.acao,
          responsavel: history.responsavel,
          observacao: null,
        });
        if (histError) throw histError;
        await syncFromDb();
      },

      appendHistorico: async (id, acao) => {
        const { error } = await db().from("item_historico").insert({
          id: acao.id,
          item_id: id,
          data: acao.data,
          acao: acao.acao,
          responsavel: acao.responsavel,
          observacao: acao.observacao ?? null,
        });
        if (error) throw error;
        await syncFromDb();
      },

      registrarMovimentacao: async (m) => {
        const mov: Movimentacao = { ...m, id: uid(), data: m.data ?? now() };
        const client = db();
        const { error: itemError } = await client.from("itens").update({ local_atual: m.destino, updated_at: now() }).eq("id", m.itemId);
        if (itemError) throw itemError;
        const { error: movError } = await client.from("movimentacoes").insert({
          id: mov.id,
          item_id: mov.itemId,
          data: mov.data,
          origem: mov.origem,
          destino: mov.destino,
          responsavel: mov.responsavel,
          motivo: mov.motivo,
        });
        if (movError) throw movError;
        const { error: histError } = await client.from("item_historico").insert({
          id: uid(),
          item_id: mov.itemId,
          data: mov.data,
          acao: `Movido de ${m.origem} para ${m.destino}`,
          responsavel: m.responsavel,
          observacao: m.motivo,
        });
        if (histError) throw histError;
        await syncFromDb();
      },

      registrarManutencao: async (m) => {
        const mt: Manutencao = { ...m, id: uid() };
        const client = db();
        if (m.status === "Em andamento") {
          const { error: itemError } = await client.from("itens").update({ status: "Em manutenção", updated_at: now() }).eq("id", m.itemId);
          if (itemError) throw itemError;
        }
        const { error: manError } = await client.from("manutencoes").insert({
          id: mt.id,
          item_id: mt.itemId,
          tipo: mt.tipo,
          descricao: mt.descricao,
          data: mt.data,
          custo: mt.custo,
          fornecedor: mt.fornecedor,
          status: mt.status,
        });
        if (manError) throw manError;
        await syncFromDb();
      },

      updateManutencao: async (id, patch) => {
        const current = manutencoes.find((x) => x.id === id);
        if (!current) return;
        const client = db();
        if (patch.status) {
          const currentItem = itens.find((it) => it.id === current.itemId);
          const nextItemStatus =
            patch.status === "Em andamento"
              ? "Em manutenção"
              : patch.status === "Concluído" && currentItem?.status === "Em manutenção"
                ? "Em uso"
                : undefined;
          if (nextItemStatus) {
            const { error: itemError } = await client.from("itens").update({ status: nextItemStatus, updated_at: now() }).eq("id", current.itemId);
            if (itemError) throw itemError;
          }
        }
        const { error } = await client.from("manutencoes").update(stripUndefined({
          tipo: patch.tipo,
          descricao: patch.descricao,
          data: patch.data,
          custo: patch.custo,
          fornecedor: patch.fornecedor,
          status: patch.status,
        })).eq("id", id);
        if (error) throw error;
        await syncFromDb();
      },
    }),
    [loading, categorias, itens, movimentacoes, manutencoes],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });



