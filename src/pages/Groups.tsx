import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Users, RefreshCw, Search, Crown, UserMinus, UserPlus, Send, Vote, MousePointerClick, Images, Hash, AtSign, ListChecks, LogOut } from "lucide-react";
import { toast } from "sonner";

type Instance = { id: string; name: string; provider: string; status: string };
type Group = {
  id: string; // jid e.g. 123-456@g.us
  subject: string;
  desc?: string;
  size?: number;
  owner?: string;
  participants?: { id: string; admin?: "admin" | "superadmin" | null }[];
  pictureUrl?: string;
};

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const jidToPhone = (jid: string) => jid.split("@")[0];

async function evo<T = unknown>(path: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown) {
  const { data, error } = await supabase.functions.invoke("evo-proxy", { body: { path, method, body } });
  if (error) throw new Error(error.message);
  if (data && (data as any).ok === false) {
    const d = (data as any).data;
    throw new Error(typeof d === "string" ? d : d?.message ?? d?.error ?? "Falha na Evolution API");
  }
  return (data as any)?.data as T;
}

export default function Groups() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState<Group | null>(null);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  useEffect(() => { void loadInstances(); }, []);
  useEffect(() => { if (selectedInstance) void loadGroups(); }, [selectedInstance]);

  async function loadInstances() {
    const { data } = await supabase
      .from("evo_instances")
      .select("id,name,provider,status")
      .eq("provider", "evolution")
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Instance[];
    setInstances(list);
    if (list.length && !selectedInstance) setSelectedInstance(list[0].name);
  }

  async function loadGroups() {
    setLoading(true);
    try {
      const data = await evo<any>(
        `/group/fetchAllGroups/${encodeURIComponent(selectedInstance)}?getParticipants=true`,
        "GET",
      );
      const arr: Group[] = (Array.isArray(data) ? data : data?.groups ?? []).map((g: any) => ({
        id: g.id ?? g.jid,
        subject: g.subject ?? g.name ?? "(sem nome)",
        desc: g.desc ?? g.description,
        size: g.size ?? g.participants?.length,
        owner: g.owner,
        participants: g.participants ?? [],
        pictureUrl: g.pictureUrl,
      }));
      setGroups(arr);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar grupos");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () => groups.filter((g) => g.subject.toLowerCase().includes(filter.toLowerCase())),
    [groups, filter],
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">Grupos & Comunidades</h2>
          <p className="text-sm text-muted-foreground">
            Criar, gerenciar e engajar grupos de WhatsApp via Evolution API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedInstance} onValueChange={setSelectedInstance}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione uma instância" /></SelectTrigger>
            <SelectContent>
              {instances.map((i) => (
                <SelectItem key={i.id} value={i.name}>
                  {i.name} <span className="text-muted-foreground ml-2">· {i.status}</span>
                </SelectItem>
              ))}
              {!instances.length && <div className="p-2 text-xs text-muted-foreground">Nenhuma instância Evolution.</div>}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => void loadGroups()} disabled={!selectedInstance || loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!selectedInstance}>
                <ListChecks className="size-4 mr-1" /> Em massa
              </Button>
            </DialogTrigger>
            <BulkCreateDialog instanceName={selectedInstance} onDone={() => { setBulkOpen(false); void loadGroups(); }} />
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedInstance}>
                <Plus className="size-4 mr-1" /> Novo grupo
              </Button>
            </DialogTrigger>
            <CreateGroupDialog instanceName={selectedInstance} onDone={() => { setCreateOpen(false); void loadGroups(); }} />
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* Lista de grupos */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar grupo..." className="pl-9" />
            </div>
            <Badge variant="secondary"><Users className="size-3 mr-1" /> {filtered.length}</Badge>
          </div>
          <ScrollArea className="h-[560px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="w-24">Membros</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => (
                  <TableRow key={g.id} className={active?.id === g.id ? "bg-accent/40" : ""}>
                    <TableCell>
                      <button onClick={() => setActive(g)} className="text-left">
                        <div className="font-medium text-sm">{g.subject}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{g.id}</div>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{g.size ?? g.participants?.length ?? "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => { setActive(g); setSendOpen(true); }}>
                        <Send className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && !loading && (
                  <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-10">
                    {selectedInstance ? "Nenhum grupo encontrado." : "Selecione uma instância."}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Painel detalhe */}
        <div className="rounded-xl border border-border bg-card min-h-[560px]">
          {active ? (
            <GroupDetail
              group={active}
              instanceName={selectedInstance}
              onChange={async () => { await loadGroups(); }}
              onOpenSend={() => setSendOpen(true)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center text-sm text-muted-foreground gap-2">
              <Users className="size-10 opacity-40" />
              Selecione um grupo para ver membros e enviar mensagens.
            </div>
          )}
        </div>
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        {active && (
          <SendDialog
            instanceName={selectedInstance}
            group={active}
            onDone={() => setSendOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
}

/* ---------- Detail panel ---------- */

function GroupDetail({ group, instanceName, onChange, onOpenSend }: {
  group: Group; instanceName: string; onChange: () => Promise<void>; onOpenSend: () => void;
}) {
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);

  async function updateParticipant(action: "add" | "remove" | "promote" | "demote", phones: string[]) {
    if (!phones.length) return;
    setBusy(true);
    try {
      await evo(
        `/group/updateParticipant/${encodeURIComponent(instanceName)}?groupJid=${encodeURIComponent(group.id)}`,
        "POST",
        { action, participants: phones.map((p) => `${onlyDigits(p)}@s.whatsapp.net`) },
      );
      toast.success(`Operação "${action}" enviada`);
      await onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha");
    } finally { setBusy(false); }
  }

  async function leave() {
    if (!confirm(`Sair do grupo "${group.subject}"?`)) return;
    try {
      await evo(`/group/leaveGroup/${encodeURIComponent(instanceName)}?groupJid=${encodeURIComponent(group.id)}`, "DELETE");
      toast.success("Você saiu do grupo");
      await onChange();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold truncate">{group.subject}</div>
            <div className="text-[11px] text-muted-foreground font-mono truncate">{group.id}</div>
          </div>
          <Button size="sm" onClick={onOpenSend}><Send className="size-3.5 mr-1" /> Enviar</Button>
        </div>
        {group.desc && <p className="text-xs text-muted-foreground line-clamp-3">{group.desc}</p>}
      </div>

      <Tabs defaultValue="members" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3">
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="add">Adicionar</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="flex-1 m-0 p-0 min-h-0">
          <ScrollArea className="h-[420px] px-4 pb-4">
            <div className="space-y-1.5 pt-2">
              {(group.participants ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-7 rounded-full bg-secondary text-xs flex items-center justify-center">
                      {jidToPhone(p.id).slice(-2)}
                    </div>
                    <div className="text-sm font-mono truncate">+{jidToPhone(p.id)}</div>
                    {p.admin && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Crown className="size-3 mr-1" /> {p.admin === "superadmin" ? "Dono" : "Admin"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {p.admin ? (
                      <Button size="icon" variant="ghost" disabled={busy || p.admin === "superadmin"}
                        onClick={() => updateParticipant("demote", [jidToPhone(p.id)])} title="Remover admin">
                        <Crown className="size-3.5 opacity-60" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" disabled={busy}
                        onClick={() => updateParticipant("promote", [jidToPhone(p.id)])} title="Promover admin">
                        <Crown className="size-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" disabled={busy || p.admin === "superadmin"}
                      onClick={() => updateParticipant("remove", [jidToPhone(p.id)])} title="Remover">
                      <UserMinus className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {!group.participants?.length && (
                <div className="text-xs text-muted-foreground p-4 text-center">Sem membros carregados.</div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="add" className="m-0 p-4 space-y-3">
          <Label className="text-xs">Telefones (E.164, separados por vírgula ou linha)</Label>
          <Textarea rows={6} value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="+5511999998888&#10;+5511988887777" />
          <Button disabled={busy || !adding.trim()} onClick={() => {
            const phones = adding.split(/[\s,;\n]+/).map(onlyDigits).filter(Boolean);
            updateParticipant("add", phones).then(() => setAdding(""));
          }}>
            <UserPlus className="size-4 mr-1" /> Adicionar
          </Button>
          <div className="pt-4 border-t border-border">
            <Button variant="outline" className="text-destructive" onClick={leave}>
              <LogOut className="size-4 mr-1" /> Sair do grupo
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Create single ---------- */

function CreateGroupDialog({ instanceName, onDone }: { instanceName: string; onDone: () => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const phones = participants.split(/[\s,;\n]+/).map(onlyDigits).filter(Boolean);
    if (!subject.trim() || phones.length < 1) {
      toast.error("Informe nome e ao menos 1 participante");
      return;
    }
    setBusy(true);
    try {
      await evo(`/group/create/${encodeURIComponent(instanceName)}`, "POST", {
        subject: subject.trim(),
        description: description.trim() || undefined,
        participants: phones,
      });
      toast.success("Grupo criado");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar grupo");
    } finally { setBusy(false); }
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo grupo</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nome</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div>
          <Label>Participantes (E.164)</Label>
          <Textarea rows={5} value={participants} onChange={(e) => setParticipants(e.target.value)}
            placeholder="+5511999998888&#10;+5511988887777" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={busy}>{busy ? "Criando..." : "Criar grupo"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ---------- Bulk create ---------- */

function BulkCreateDialog({ instanceName, onDone }: { instanceName: string; onDone: () => void }) {
  const [csv, setCsv] = useState("Promo SP|+5511999998888,+5511988887777\nPromo RJ|+5521988887777");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  async function run() {
    const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBusy(true);
    setLog([]);
    for (const line of lines) {
      const [subject, rest] = line.split("|");
      const phones = (rest ?? "").split(/[\s,;]+/).map(onlyDigits).filter(Boolean);
      if (!subject || !phones.length) {
        setLog((l) => [...l, `✗ Linha inválida: ${line}`]); continue;
      }
      try {
        await evo(`/group/create/${encodeURIComponent(instanceName)}`, "POST", {
          subject: subject.trim(), participants: phones,
        });
        setLog((l) => [...l, `✓ ${subject} (${phones.length} membros)`]);
      } catch (e) {
        setLog((l) => [...l, `✗ ${subject}: ${e instanceof Error ? e.message : "erro"}`]);
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    setBusy(false);
    toast.success("Criação em massa concluída");
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Criar grupos em massa</DialogTitle></DialogHeader>
      <p className="text-xs text-muted-foreground">
        Formato por linha: <span className="font-mono">Nome do grupo | telefone1, telefone2, ...</span>
      </p>
      <Textarea rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
      {log.length > 0 && (
        <ScrollArea className="h-40 rounded border border-border p-2 bg-muted/30">
          <div className="text-xs font-mono space-y-1">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </ScrollArea>
      )}
      <DialogFooter>
        <Button onClick={run} disabled={busy}>{busy ? "Processando..." : "Iniciar criação"}</Button>
        <Button variant="outline" onClick={onDone}>Fechar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ---------- Send (text/poll/buttons/list/carousel) ---------- */

type SendKind = "text" | "poll" | "buttons" | "list" | "carousel";

function SendDialog({ instanceName, group, onDone }: { instanceName: string; group: Group; onDone: () => void }) {
  const [kind, setKind] = useState<SendKind>("text");
  const [busy, setBusy] = useState(false);

  // text
  const [text, setText] = useState("");
  const [mentionAll, setMentionAll] = useState(false);
  const [mentions, setMentions] = useState("");

  // poll
  const [pollName, setPollName] = useState("");
  const [pollOptions, setPollOptions] = useState("Opção 1\nOpção 2");
  const [multi, setMulti] = useState(false);

  // buttons
  const [btnTitle, setBtnTitle] = useState("");
  const [btnDesc, setBtnDesc] = useState("");
  const [btnFooter, setBtnFooter] = useState("");
  const [buttons, setButtons] = useState<{ type: "reply" | "url"; text: string; payload: string }[]>([
    { type: "reply", text: "Sim", payload: "yes" },
    { type: "url", text: "Site", payload: "https://" },
  ]);

  // list
  const [listTitle, setListTitle] = useState("");
  const [listText, setListText] = useState("");
  const [listBtn, setListBtn] = useState("Ver opções");
  const [listItems, setListItems] = useState("Item 1|Descrição\nItem 2|Descrição");

  // carousel (sequência de mídias)
  const [cards, setCards] = useState<{ url: string; caption: string }[]>([
    { url: "", caption: "Card 1" },
  ]);

  async function send() {
    setBusy(true);
    try {
      const jid = group.id;
      if (kind === "text") {
        const mentioned = mentionAll
          ? (group.participants ?? []).map((p) => p.id)
          : mentions.split(/[\s,;\n]+/).filter(Boolean).map((p) => `${onlyDigits(p)}@s.whatsapp.net`);
        await evo(`/message/sendText/${encodeURIComponent(instanceName)}`, "POST", {
          number: jid,
          text,
          mentions: mentioned.length ? { everyOne: mentionAll, mentioned } : undefined,
          options: { delay: 0, presence: "composing" },
        });
      } else if (kind === "poll") {
        const values = pollOptions.split("\n").map((s) => s.trim()).filter(Boolean);
        await evo(`/message/sendPoll/${encodeURIComponent(instanceName)}`, "POST", {
          number: jid,
          name: pollName,
          selectableCount: multi ? values.length : 1,
          values,
        });
      } else if (kind === "buttons") {
        await evo(`/message/sendButtons/${encodeURIComponent(instanceName)}`, "POST", {
          number: jid,
          title: btnTitle,
          description: btnDesc,
          footer: btnFooter,
          buttons: buttons.map((b, i) =>
            b.type === "url"
              ? { type: "url", displayText: b.text, url: b.payload }
              : { type: "reply", displayText: b.text, id: b.payload || `btn_${i}` },
          ),
        });
      } else if (kind === "list") {
        const rows = listItems.split("\n").map((l, i) => {
          const [t, d] = l.split("|");
          return { title: (t ?? "").trim(), description: (d ?? "").trim(), rowId: `row_${i}` };
        }).filter((r) => r.title);
        await evo(`/message/sendList/${encodeURIComponent(instanceName)}`, "POST", {
          number: jid,
          title: listTitle,
          description: listText,
          buttonText: listBtn,
          footerText: "",
          sections: [{ title: listTitle || "Opções", rows }],
        });
      } else if (kind === "carousel") {
        for (const c of cards) {
          if (!c.url) continue;
          await evo(`/message/sendMedia/${encodeURIComponent(instanceName)}`, "POST", {
            number: jid,
            mediatype: "image",
            media: c.url,
            caption: c.caption,
          });
          await new Promise((r) => setTimeout(r, 600));
        }
      }
      toast.success("Mensagem enviada ao grupo");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio");
    } finally { setBusy(false); }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Enviar para: {group.subject}</DialogTitle>
      </DialogHeader>
      <Tabs value={kind} onValueChange={(v) => setKind(v as SendKind)}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="text"><Hash className="size-3.5 mr-1" />Texto</TabsTrigger>
          <TabsTrigger value="poll"><Vote className="size-3.5 mr-1" />Enquete</TabsTrigger>
          <TabsTrigger value="buttons"><MousePointerClick className="size-3.5 mr-1" />Botões</TabsTrigger>
          <TabsTrigger value="list"><ListChecks className="size-3.5 mr-1" />Lista</TabsTrigger>
          <TabsTrigger value="carousel"><Images className="size-3.5 mr-1" />Carrossel</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-3 pt-3">
          <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem..." />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mentionAll} onChange={(e) => setMentionAll(e.target.checked)} />
            Marcar todos os membros (@all)
          </label>
          {!mentionAll && (
            <div>
              <Label className="text-xs flex items-center gap-1"><AtSign className="size-3" /> Marcar telefones específicos</Label>
              <Textarea rows={2} value={mentions} onChange={(e) => setMentions(e.target.value)} placeholder="+5511..." />
            </div>
          )}
        </TabsContent>

        <TabsContent value="poll" className="space-y-3 pt-3">
          <Input placeholder="Pergunta da enquete" value={pollName} onChange={(e) => setPollName(e.target.value)} />
          <Textarea rows={5} placeholder="Uma opção por linha" value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} /> Múltipla escolha
          </label>
        </TabsContent>

        <TabsContent value="buttons" className="space-y-3 pt-3">
          <Input placeholder="Título" value={btnTitle} onChange={(e) => setBtnTitle(e.target.value)} />
          <Textarea rows={2} placeholder="Descrição" value={btnDesc} onChange={(e) => setBtnDesc(e.target.value)} />
          <Input placeholder="Rodapé" value={btnFooter} onChange={(e) => setBtnFooter(e.target.value)} />
          <div className="space-y-2">
            {buttons.map((b, i) => (
              <div key={i} className="grid grid-cols-[110px_1fr_1fr_auto] gap-2 items-center">
                <Select value={b.type} onValueChange={(v) => setButtons((bs) => bs.map((x, j) => j === i ? { ...x, type: v as "reply" | "url" } : x))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reply">Resposta</SelectItem>
                    <SelectItem value="url">Link</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Texto" value={b.text} onChange={(e) => setButtons((bs) => bs.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                <Input placeholder={b.type === "url" ? "https://..." : "id_da_resposta"} value={b.payload}
                  onChange={(e) => setButtons((bs) => bs.map((x, j) => j === i ? { ...x, payload: e.target.value } : x))} />
                <Button size="icon" variant="ghost" onClick={() => setButtons((bs) => bs.filter((_, j) => j !== i))}>×</Button>
              </div>
            ))}
            <Button size="sm" variant="outline" disabled={buttons.length >= 3}
              onClick={() => setButtons((bs) => [...bs, { type: "reply", text: "", payload: "" }])}>
              + Botão (máx 3)
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-3 pt-3">
          <Input placeholder="Título" value={listTitle} onChange={(e) => setListTitle(e.target.value)} />
          <Textarea rows={2} placeholder="Texto" value={listText} onChange={(e) => setListText(e.target.value)} />
          <Input placeholder="Texto do botão" value={listBtn} onChange={(e) => setListBtn(e.target.value)} />
          <Label className="text-xs">Itens (uma linha cada): Título|Descrição</Label>
          <Textarea rows={5} value={listItems} onChange={(e) => setListItems(e.target.value)} className="font-mono text-xs" />
        </TabsContent>

        <TabsContent value="carousel" className="space-y-3 pt-3">
          <p className="text-xs text-muted-foreground">
            O WhatsApp não tem carrossel nativo — enviamos uma sequência de imagens com legenda.
          </p>
          {cards.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <Input placeholder="URL da imagem" value={c.url} onChange={(e) => setCards((cs) => cs.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
              <Input placeholder="Legenda" value={c.caption} onChange={(e) => setCards((cs) => cs.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))} />
              <Button size="icon" variant="ghost" onClick={() => setCards((cs) => cs.filter((_, j) => j !== i))}>×</Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setCards((cs) => [...cs, { url: "", caption: "" }])}>
            + Card
          </Button>
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <Button onClick={send} disabled={busy}>
          <Send className="size-4 mr-1" />{busy ? "Enviando..." : "Enviar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
