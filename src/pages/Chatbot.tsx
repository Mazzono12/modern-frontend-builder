import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MessageSquare, GitBranch, Sparkles, Webhook, Play, Plus, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ───── Custom Nodes (premium look) ───── */

function NodeShell({ icon: Icon, color, title, subtitle, children, sourceCount = 1 }: any) {
  return (
    <div className="surface-card min-w-[240px] overflow-hidden group hover:border-border-strong transition-all">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background-elev/60">
        <div className={`size-6 rounded-md grid place-items-center ${color}`}>
          <Icon className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{title}</div>
          {subtitle && <div className="text-[10px] text-muted-foreground truncate">{subtitle}</div>}
        </div>
      </div>
      <div className="p-3 text-xs text-muted-foreground">{children}</div>
      <Handle type="target" position={Position.Left} className="!size-2 !bg-primary !border-2 !border-background" />
      {sourceCount === 1 ? (
        <Handle type="source" position={Position.Right} className="!size-2 !bg-primary !border-2 !border-background" />
      ) : (
        <>
          <Handle id="yes" type="source" position={Position.Right} style={{ top: "35%" }} className="!size-2 !bg-success !border-2 !border-background" />
          <Handle id="no" type="source" position={Position.Right} style={{ top: "75%" }} className="!size-2 !bg-destructive !border-2 !border-background" />
        </>
      )}
    </div>
  );
}

const StartNode = (_: NodeProps) => (
  <div className="surface-card px-4 py-2.5 border-primary/40 bg-primary/10">
    <div className="flex items-center gap-2">
      <div className="size-5 rounded-full bg-primary grid place-items-center"><Play className="size-3 text-primary-foreground fill-primary-foreground" /></div>
      <span className="text-xs font-medium">Início · gatilho keyword</span>
    </div>
    <div className="text-[10px] text-muted-foreground mt-1 text-mono">contém: "horário", "atendimento"</div>
    <Handle type="source" position={Position.Right} className="!size-2 !bg-primary !border-2 !border-background" />
  </div>
);

const MessageNode = ({ data }: NodeProps) => (
  <NodeShell icon={MessageSquare} color="bg-info" title="Enviar mensagem" subtitle="Texto + botões">
    <div className="bg-secondary/60 rounded-md p-2 text-foreground/90 leading-relaxed">{data.text as string}</div>
  </NodeShell>
);

const ConditionNode = ({ data }: NodeProps) => (
  <NodeShell icon={GitBranch} color="bg-warning" title="Condição" subtitle={data.field as string} sourceCount={2}>
    <div className="space-y-1.5">
      <div className="flex items-center justify-between"><span>Se sim</span><span className="size-1.5 rounded-full bg-success" /></div>
      <div className="flex items-center justify-between"><span>Se não</span><span className="size-1.5 rounded-full bg-destructive" /></div>
    </div>
  </NodeShell>
);

const AINode = ({ data }: NodeProps) => (
  <NodeShell icon={Sparkles} color="bg-gradient-primary" title="Resposta com IA" subtitle="GPT-4 · base de conhecimento">
    <div className="text-foreground/90">{data.prompt as string}</div>
  </NodeShell>
);

const WebhookNode = ({ data }: NodeProps) => (
  <NodeShell icon={Webhook} color="bg-accent" title="Webhook" subtitle="POST">
    <code className="text-mono text-[10px] text-primary truncate block">{data.url as string}</code>
  </NodeShell>
);

const nodeTypes = { start: StartNode, message: MessageNode, condition: ConditionNode, ai: AINode, webhook: WebhookNode };

const initialNodes: Node[] = [
  { id: "1", type: "start", position: { x: 40, y: 200 }, data: {} },
  { id: "2", type: "message", position: { x: 320, y: 160 }, data: { text: "Olá! 👋 Sobre qual assunto você precisa de ajuda?" } },
  { id: "3", type: "condition", position: { x: 660, y: 160 }, data: { field: "intent == suporte" } },
  { id: "4", type: "ai", position: { x: 1000, y: 60 }, data: { prompt: "Responder dúvidas técnicas com base no helpdesk." } },
  { id: "5", type: "webhook", position: { x: 1000, y: 320 }, data: { url: "https://api.acme.com/handoff/agent" } },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "1", target: "2", animated: true, style: { stroke: "hsl(var(--primary))", strokeWidth: 2 } },
  { id: "e2", source: "2", target: "3", animated: true, style: { stroke: "hsl(var(--primary))", strokeWidth: 2 } },
  { id: "e3", source: "3", sourceHandle: "yes", target: "4", style: { stroke: "hsl(var(--success))", strokeWidth: 2 } },
  { id: "e4", source: "3", sourceHandle: "no", target: "5", style: { stroke: "hsl(var(--destructive))", strokeWidth: 2 } },
];

const palette = [
  { type: "message", icon: MessageSquare, label: "Mensagem", color: "text-info" },
  { type: "condition", icon: GitBranch, label: "Condição", color: "text-warning" },
  { type: "ai", icon: Sparkles, label: "IA", color: "text-primary" },
  { type: "webhook", icon: Webhook, label: "Webhook", color: "text-foreground" },
];

export default function Chatbot() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((c: Connection) => setEdges((es) => addEdge({ ...c, animated: true, style: { stroke: "hsl(var(--primary))", strokeWidth: 2 } }, es)), [setEdges]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-12 border-b border-border flex items-center px-4 gap-3">
        <div className="text-sm font-medium">Fluxo: <span className="text-muted-foreground">Atendimento principal</span></div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30">Publicado · v12</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground"><Settings2 className="size-3.5" />Configurar</Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border bg-secondary/40"><Save className="size-3.5" />Salvar</Button>
          <Button size="sm" className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"><Play className="size-3.5" />Testar</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[200px_1fr]">
        {/* Palette */}
        <aside className="border-r border-border p-3 space-y-2 bg-background-elev/30">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1">Adicionar nó</div>
          {palette.map((p) => (
            <button key={p.type} className="w-full surface-card px-3 py-2.5 flex items-center gap-2.5 text-sm hover:border-border-strong transition-colors text-left">
              <p.icon className={`size-4 ${p.color}`} />
              <span className="flex-1">{p.label}</span>
              <Plus className="size-3.5 text-muted-foreground" />
            </button>
          ))}
        </aside>

        {/* Canvas */}
        <div className="relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: "hsl(var(--background))" }}
          >
            <Background gap={24} size={1} color="hsl(var(--border))" />
            <Controls className="!bg-card !border !border-border !shadow-card [&>button]:!bg-transparent [&>button]:!border-border [&>button]:!text-foreground" />
            <MiniMap
              className="!bg-card !border !border-border"
              nodeColor="hsl(var(--primary))"
              maskColor="hsl(var(--background) / 0.7)"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
