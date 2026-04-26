import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Plus, MoreHorizontal, MessageSquare, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Lead = {
  id: string;
  name: string;
  initials: string;
  company: string;
  value: number;
  channel: "WhatsApp" | "Instagram" | "Email";
  due: string;
  tags: string[];
};

type ColumnId = "novo" | "qualificado" | "proposta" | "negociacao" | "ganho";
type Columns = Record<ColumnId, { id: ColumnId; title: string; color: string; leads: Lead[] }>;

const initial: Columns = {
  novo: {
    id: "novo",
    title: "Novo",
    color: "hsl(var(--info))",
    leads: [
      { id: "l1", name: "Camila Ferreira", initials: "CF", company: "Acme Moda", value: 12400, channel: "WhatsApp", due: "Hoje", tags: ["VIP"] },
      { id: "l2", name: "Pedro Henrique", initials: "PH", company: "TechCorp", value: 4800, channel: "Instagram", due: "Amanhã", tags: [] },
      { id: "l3", name: "Larissa Souza", initials: "LS", company: "BeautyHub", value: 7200, channel: "WhatsApp", due: "3 dias", tags: ["lead-quente"] },
    ],
  },
  qualificado: {
    id: "qualificado",
    title: "Qualificado",
    color: "hsl(265 90% 66%)",
    leads: [
      { id: "l4", name: "Marcos Vieira", initials: "MV", company: "Logística MV", value: 18900, channel: "Email", due: "Hoje", tags: ["enterprise"] },
      { id: "l5", name: "Renata Alves", initials: "RA", company: "Studio R", value: 3200, channel: "WhatsApp", due: "5 dias", tags: [] },
    ],
  },
  proposta: {
    id: "proposta",
    title: "Proposta",
    color: "hsl(var(--warning))",
    leads: [
      { id: "l6", name: "Felipe Cardoso", initials: "FC", company: "Cardoso Co.", value: 24500, channel: "WhatsApp", due: "2 dias", tags: ["follow-up"] },
    ],
  },
  negociacao: {
    id: "negociacao",
    title: "Negociação",
    color: "hsl(22 95% 58%)",
    leads: [
      { id: "l7", name: "Ana Beatriz", initials: "AB", company: "AB Digital", value: 38000, channel: "Email", due: "Hoje", tags: ["urgente"] },
      { id: "l8", name: "Bruno Lopes", initials: "BL", company: "Lopes Ltda", value: 9800, channel: "WhatsApp", due: "Amanhã", tags: [] },
    ],
  },
  ganho: {
    id: "ganho",
    title: "Ganho",
    color: "hsl(var(--success))",
    leads: [
      { id: "l9", name: "Juliana Mendes", initials: "JM", company: "Mendes Inc", value: 52000, channel: "WhatsApp", due: "—", tags: ["fechado"] },
    ],
  },
};

const channelColors: Record<Lead["channel"], string> = {
  WhatsApp: "bg-success/15 text-success border-success/30",
  Instagram: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  Email: "bg-info/15 text-info border-info/30",
};

function LeadCard({ lead, dragging = false }: { lead: Lead; dragging?: boolean }) {
  return (
    <div
      className={`glass rounded-xl p-3.5 space-y-3 cursor-grab active:cursor-grabbing transition-all ${
        dragging ? "shadow-glow rotate-2 scale-105" : "hover:border-primary/40 hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{lead.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{lead.company}</div>
        </div>
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-secondary text-[10px]">{lead.initials}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${channelColors[lead.channel]}`}>
          {lead.channel}
        </span>
        {lead.tags.map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md border border-border bg-secondary/40 text-muted-foreground">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
        <span className="flex items-center gap-1 text-mono text-foreground">
          <DollarSign className="size-3" />
          {lead.value.toLocaleString("pt-BR")}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="size-3" />
          {lead.due}
        </span>
      </div>
    </div>
  );
}

function DraggableLead({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <LeadCard lead={lead} />
    </div>
  );
}

function DroppableColumn({
  column,
  children,
}: {
  column: Columns[ColumnId];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const total = column.leads.reduce((s, l) => s + l.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] flex flex-col rounded-xl border transition-colors ${
        isOver ? "border-primary/60 bg-primary/5" : "border-border bg-background-elev/30"
      }`}
    >
      <div className="px-3 py-3 border-b border-border flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: column.color }} />
        <span className="text-sm font-medium">{column.title}</span>
        <span className="text-[10px] text-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
          {column.leads.length}
        </span>
        <span className="ml-auto text-[11px] text-mono text-muted-foreground">
          R$ {total.toLocaleString("pt-BR")}
        </span>
        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground">
          <Plus className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2.5">
        {children}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [columns, setColumns] = useState<Columns>(initial);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const findColumn = (leadId: string): ColumnId | null => {
    for (const k of Object.keys(columns) as ColumnId[]) {
      if (columns[k].leads.some((l) => l.id === leadId)) return k;
    }
    return null;
  };

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    const col = findColumn(id);
    if (col) {
      const lead = columns[col].leads.find((l) => l.id === id) ?? null;
      setActiveLead(lead);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = e;
    if (!over) return;
    const fromCol = findColumn(String(active.id));
    const toCol = String(over.id) as ColumnId;
    if (!fromCol || !columns[toCol] || fromCol === toCol) return;

    const lead = columns[fromCol].leads.find((l) => l.id === active.id);
    if (!lead) return;

    setColumns((prev) => ({
      ...prev,
      [fromCol]: { ...prev[fromCol], leads: prev[fromCol].leads.filter((l) => l.id !== active.id) },
      [toCol]: { ...prev[toCol], leads: [lead, ...prev[toCol].leads] },
    }));
  }

  const totalValue = (Object.values(columns) as Columns[ColumnId][]).reduce(
    (s, c) => s + c.leads.reduce((ss, l) => ss + l.value, 0),
    0,
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1800px] mx-auto h-full flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">Pipeline de vendas</h2>
          <p className="text-sm text-muted-foreground">
            Arraste os leads entre as colunas. Pipeline total:{" "}
            <span className="text-foreground text-mono">R$ {totalValue.toLocaleString("pt-BR")}</span>
          </p>
        </div>
        <Button size="sm" className="h-9 bg-gradient-primary text-primary-foreground hover:opacity-90 gap-1 shadow-glow">
          <Plus className="size-4" /> Novo lead
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {(Object.values(columns) as Columns[ColumnId][]).map((c) => (
            <DroppableColumn key={c.id} column={c}>
              {c.leads.map((l) => (
                <DraggableLead key={l.id} lead={l} />
              ))}
              {c.leads.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  Solte um lead aqui
                </div>
              )}
            </DroppableColumn>
          ))}
        </div>
        <DragOverlay>{activeLead ? <LeadCard lead={activeLead} dragging /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
