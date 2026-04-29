export type UUID = string;

export type EstadoConservacao = "Novo" | "Bom" | "Regular" | "Ruim";
export type StatusItem = "Em uso" | "Em manutenção" | "Inativo" | "Baixado";
export type TipoManutencao = "Preventiva" | "Corretiva";
export type StatusManutencao = "Pendente" | "Em andamento" | "Concluído";

export interface Categoria {
  id: UUID;
  nome: string;
  descricao?: string;
}

export interface DocumentoMidia {
  id: UUID;
  tipo: "Nota Fiscal" | "Garantia" | "Manual" | "Foto";
  nome: string;
  url: string;
}

export interface AcaoHistorico {
  id: UUID;
  data: string;
  acao: string;
  responsavel: string;
  observacao?: string;
}

export interface Item {
  id: UUID;
  nome: string;
  descricao?: string;
  categoriaId: UUID;
  quantidade: number;
  numeroPatrimonio?: string;
  dataRegistro: string;
  valorAproximado: number;
  estadoConservacao: EstadoConservacao;
  status: StatusItem;
  marca?: string;
  modelo?: string;
  equipamentoGeral: boolean;
  localAtual: string;
  fotoUrl?: string;
  documentos: DocumentoMidia[];
  historico: AcaoHistorico[];
}

export interface Movimentacao {
  id: UUID;
  itemId: UUID;
  data: string;
  origem: string;
  destino: string;
  responsavel: string;
  motivo: string;
}

export interface Manutencao {
  id: UUID;
  itemId: UUID;
  tipo: TipoManutencao;
  descricao: string;
  data: string;
  custo: number;
  fornecedor: string;
  status: StatusManutencao;
}

export const LOCAIS = [
  "Igreja Matriz",
  "Secretaria Paroquial",
  "Salão Paroquial",
  "Capela São José",
  "Capela Nossa Senhora",
  "Casa Paroquial",
  "Sacristia",
  "Almoxarifado",
] as const;
