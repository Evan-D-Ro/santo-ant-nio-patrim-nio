import { Badge } from "@/components/ui/badge";
import type { EstadoConservacao, StatusItem, StatusManutencao } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: StatusItem }) {
  const map: Record<StatusItem, string> = {
    "Em uso": "bg-success/15 text-success border-success/30",
    "Em manutenção": "bg-warning/20 text-warning-foreground border-warning/40",
    Inativo: "bg-muted text-muted-foreground border-border",
    Baixado: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={cn("border", map[status])}>{status}</Badge>;
}

export function EstadoBadge({ estado }: { estado: EstadoConservacao }) {
  const map: Record<EstadoConservacao, string> = {
    Novo: "bg-primary/10 text-primary border-primary/30",
    Bom: "bg-success/15 text-success border-success/30",
    Regular: "bg-warning/20 text-warning-foreground border-warning/40",
    Ruim: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={cn("border", map[estado])}>{estado}</Badge>;
}

export function ManutencaoStatusBadge({ status }: { status: StatusManutencao }) {
  const map: Record<StatusManutencao, string> = {
    Pendente: "bg-warning/20 text-warning-foreground border-warning/40",
    "Em andamento": "bg-primary/10 text-primary border-primary/30",
    Concluído: "bg-success/15 text-success border-success/30",
  };
  return <Badge variant="outline" className={cn("border", map[status])}>{status}</Badge>;
}
