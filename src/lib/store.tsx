import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  Categoria,
  Item,
  Manutencao,
  Movimentacao,
  StatusItem,
  AcaoHistorico,
} from "./types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const now = () => new Date().toISOString();

const seedCategorias: Categoria[] = [
  { id: "c1", nome: "Litúrgicos", descricao: "Objetos sagrados e paramentos" },
  { id: "c2", nome: "Móveis", descricao: "Mobiliário em geral" },
  { id: "c3", nome: "Eletrônicos", descricao: "Áudio, vídeo, projetores" },
  { id: "c4", nome: "Informática", descricao: "Computadores e periféricos" },
  { id: "c5", nome: "Instrumentos Musicais", descricao: "Instrumentos da pastoral" },
];

const seedItens: Item[] = [
  {
    id: "i1",
    nome: "Cálice em prata",
    descricao: "Cálice usado nas celebrações dominicais",
    categoriaId: "c1",
    quantidade: 2,
    numeroPatrimonio: "PSA-0001",
    dataRegistro: "2023-03-12",
    valorAproximado: 4500,
    estadoConservacao: "Bom",
    status: "Em uso",
    marca: "—",
    modelo: "—",
    equipamentoGeral: false,
    localAtual: "Sacristia",
    documentos: [],
    historico: [
      { id: uid(), data: "2023-03-12T10:00:00Z", acao: "Cadastro inicial", responsavel: "Pe. João" },
    ],
  },
  {
    id: "i2",
    nome: "Projetor Epson",
    descricao: "Projetor para eventos no salão",
    categoriaId: "c3",
    quantidade: 1,
    numeroPatrimonio: "PSA-0014",
    dataRegistro: "2024-06-01",
    valorAproximado: 3200,
    estadoConservacao: "Novo",
    status: "Em uso",
    marca: "Epson",
    modelo: "PowerLite X49",
    equipamentoGeral: true,
    localAtual: "Salão Paroquial",
    documentos: [],
    historico: [
      { id: uid(), data: "2024-06-01T09:00:00Z", acao: "Cadastro inicial", responsavel: "Secretaria" },
    ],
  },
  {
    id: "i3",
    nome: "Notebook Dell",
    descricao: "Uso administrativo da secretaria",
    categoriaId: "c4",
    quantidade: 1,
    numeroPatrimonio: "PSA-0021",
    dataRegistro: "2024-01-20",
    valorAproximado: 4800,
    estadoConservacao: "Bom",
    status: "Em manutenção",
    marca: "Dell",
    modelo: "Inspiron 15",
    equipamentoGeral: false,
    localAtual: "Secretaria Paroquial",
    documentos: [],
    historico: [
      { id: uid(), data: "2024-01-20T08:00:00Z", acao: "Cadastro inicial", responsavel: "Maria" },
      { id: uid(), data: "2025-02-10T14:00:00Z", acao: "Enviado para manutenção", responsavel: "Maria" },
    ],
  },
  {
    id: "i4",
    nome: "Bancos de madeira",
    descricao: "Bancos longos da nave central",
    categoriaId: "c2",
    quantidade: 24,
    numeroPatrimonio: "PSA-0030",
    dataRegistro: "2020-11-05",
    valorAproximado: 18000,
    estadoConservacao: "Regular",
    status: "Em uso",
    equipamentoGeral: false,
    localAtual: "Igreja Matriz",
    documentos: [],
    historico: [],
  },
  {
    id: "i5",
    nome: "Violão acústico",
    descricao: "Pastoral da Música",
    categoriaId: "c5",
    quantidade: 1,
    numeroPatrimonio: "PSA-0042",
    dataRegistro: "2023-09-15",
    valorAproximado: 1200,
    estadoConservacao: "Bom",
    status: "Em uso",
    marca: "Yamaha",
    modelo: "C40",
    equipamentoGeral: true,
    localAtual: "Salão Paroquial",
    documentos: [],
    historico: [],
  },
];

const seedMovimentacoes: Movimentacao[] = [
  {
    id: "m1",
    itemId: "i2",
    data: "2025-04-20T10:00:00Z",
    origem: "Almoxarifado",
    destino: "Salão Paroquial",
    responsavel: "Diác. Carlos",
    motivo: "Encontro de catequistas",
  },
  {
    id: "m2",
    itemId: "i5",
    data: "2025-04-22T18:30:00Z",
    origem: "Casa Paroquial",
    destino: "Salão Paroquial",
    responsavel: "Ana (Pastoral Música)",
    motivo: "Ensaio do coral",
  },
];

const seedManutencoes: Manutencao[] = [
  {
    id: "mt1",
    itemId: "i3",
    tipo: "Corretiva",
    descricao: "Tela apresentando linhas verticais",
    data: "2025-02-10",
    custo: 450,
    fornecedor: "Tech Rancharia",
    status: "Em andamento",
  },
  {
    id: "mt2",
    itemId: "i4",
    tipo: "Preventiva",
    descricao: "Lustração e reaperto",
    data: "2025-05-05",
    custo: 0,
    fornecedor: "Mutirão paroquial",
    status: "Pendente",
  },
];

interface StoreCtx {
  categorias: Categoria[];
  itens: Item[];
  movimentacoes: Movimentacao[];
  manutencoes: Manutencao[];
  // categorias
  addCategoria: (c: Omit<Categoria, "id">) => void;
  updateCategoria: (id: string, c: Partial<Categoria>) => void;
  deleteCategoria: (id: string) => void;
  // itens
  addItem: (i: Omit<Item, "id" | "documentos" | "historico" | "dataRegistro"> & { dataRegistro?: string }) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  changeStatus: (id: string, status: StatusItem, responsavel: string, observacao?: string) => void;
  appendHistorico: (id: string, acao: AcaoHistorico) => void;
  // movimentação
  registrarMovimentacao: (m: Omit<Movimentacao, "id" | "data"> & { data?: string }) => void;
  // manutenção
  registrarManutencao: (m: Omit<Manutencao, "id">) => void;
  updateManutencao: (id: string, patch: Partial<Manutencao>) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [categorias, setCategorias] = useState<Categoria[]>(seedCategorias);
  const [itens, setItens] = useState<Item[]>(seedItens);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(seedMovimentacoes);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>(seedManutencoes);

  const value = useMemo<StoreCtx>(
    () => ({
      categorias,
      itens,
      movimentacoes,
      manutencoes,
      addCategoria: (c) => setCategorias((p) => [...p, { ...c, id: uid() }]),
      updateCategoria: (id, c) =>
        setCategorias((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
      deleteCategoria: (id) => setCategorias((p) => p.filter((x) => x.id !== id)),

      addItem: (data) => {
        const item: Item = {
          ...data,
          id: uid(),
          dataRegistro: data.dataRegistro ?? now(),
          documentos: [],
          historico: [
            { id: uid(), data: now(), acao: "Cadastro do item", responsavel: "Sistema" },
          ],
        };
        setItens((p) => [item, ...p]);
        return item;
      },
      updateItem: (id, patch) =>
        setItens((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      deleteItem: (id) => setItens((p) => p.filter((x) => x.id !== id)),

      changeStatus: (id, status, responsavel, observacao) =>
        setItens((p) =>
          p.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status,
                  historico: [
                    ...x.historico,
                    {
                      id: uid(),
                      data: now(),
                      acao: `Status alterado para "${status}"`,
                      responsavel,
                      observacao,
                    },
                  ],
                }
              : x,
          ),
        ),

      appendHistorico: (id, acao) =>
        setItens((p) =>
          p.map((x) => (x.id === id ? { ...x, historico: [...x.historico, acao] } : x)),
        ),

      registrarMovimentacao: (m) => {
        const mov: Movimentacao = { ...m, id: uid(), data: m.data ?? now() };
        setMovimentacoes((p) => [mov, ...p]);
        setItens((p) =>
          p.map((x) =>
            x.id === m.itemId
              ? {
                  ...x,
                  localAtual: m.destino,
                  historico: [
                    ...x.historico,
                    {
                      id: uid(),
                      data: mov.data,
                      acao: `Movido de ${m.origem} para ${m.destino}`,
                      responsavel: m.responsavel,
                      observacao: m.motivo,
                    },
                  ],
                }
              : x,
          ),
        );
      },

      registrarManutencao: (m) => {
        const mt: Manutencao = { ...m, id: uid() };
        setManutencoes((p) => [mt, ...p]);
        setItens((p) =>
          p.map((x) =>
            x.id === m.itemId
              ? {
                  ...x,
                  status: m.status === "Em andamento" ? "Em manutenção" : x.status,
                  historico: [
                    ...x.historico,
                    {
                      id: uid(),
                      data: now(),
                      acao: `Manutenção ${m.tipo.toLowerCase()} registrada (${m.status})`,
                      responsavel: m.fornecedor,
                      observacao: m.descricao,
                    },
                  ],
                }
              : x,
          ),
        );
      },

      updateManutencao: (id, patch) => {
        setManutencoes((prev) => {
          const next = prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
          const updated = next.find((x) => x.id === id);
          if (updated && patch.status) {
            setItens((items) =>
              items.map((it) => {
                if (it.id !== updated.itemId) return it;
                if (patch.status === "Em andamento") return { ...it, status: "Em manutenção" };
                if (patch.status === "Concluído" && it.status === "Em manutenção")
                  return { ...it, status: "Em uso" };
                return it;
              }),
            );
          }
          return next;
        });
      },
    }),
    [categorias, itens, movimentacoes, manutencoes],
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
