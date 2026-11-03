import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowUp, BarChart3, Check, ChevronDown, FileText, FolderOpen, GitBranch, ListTree, MessageSquare, Network, Plus,
  Sparkles, Table2, Trash2, X,
} from "lucide-react";
import { services } from "@/services";
import { ResponseRenderer } from "@/components/renderer/ResponseRenderer";
import { addChild, findNode, newNodeId, removeNode, updateNode } from "@/lib/workspace-tree";
import { formatDate, formatSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WorkspaceNode, WorkspaceView } from "@/types/workspace";
import { LazyWorkspaceCanvas } from "./LazyWorkspaceCanvas";
import { DashboardView, TableView, TimelineView } from "./views";
import { iconFor, statusLabel } from "./icons";

type Tab = WorkspaceView | "documents" | "files";

const VIEWS: { id: WorkspaceView; label: string; icon: typeof Network }[] = [
  { id: "mindmap", label: "Mind Map", icon: Network },
  { id: "flowchart", label: "Flowchart", icon: GitBranch },
  { id: "timeline", label: "Timeline", icon: ListTree },
  { id: "table", label: "Table", icon: Table2 },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
];

const SUGGESTIONS = [
  "Add Finance under Approval",
  "Move Inventory under Operations",
  "Expand the Team branch",
  "Convert this mind map into a flowchart",
  "Show this project as a timeline",
];

interface Msg { id: string; role: "user" | "assistant"; text: string }

export function Workspace({ projectId, header }: { projectId: string; header?: ReactNode }) {
  const { data: ws } = useQuery({ queryKey: ["workspace", projectId], queryFn: () => services.workspace.get(projectId), staleTime: Infinity, refetchOnWindowFocus: false });
  const { data: res } = useQuery({ queryKey: ["project-resources", projectId], queryFn: () => services.projects.resources(projectId) });
  const [root, setRoot] = useState<WorkspaceNode | null>(null);
  const [tab, setTab] = useState<Tab>("mindmap");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ws) return;
    setRoot(ws.root);
    setSelectedId(null);
    setMessages([{ id: "hello", role: "assistant", text: `I'm looking at **${ws.title}** with you. Ask me to add, move, expand or reshape anything you see.` }]);
  }, [ws?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, pending]);
  useEffect(() => {
    if (!focusId) return;
    const t = setTimeout(() => setFocusId(null), 2400);
    return () => clearTimeout(t);
  }, [focusId]);

  const toggle = useCallback((id: string) => setRoot((r) => (r ? updateNode(r, id, { collapsed: !findNode(r, id)?.node.collapsed }) : r)), []);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || !root || pending) return;
    setInput("");
    setChatOpen(true);
    setMessages((m) => [...m, { id: newNodeId(), role: "user", text: t }]);
    setPending(true);
    const result = await services.workspace.command(root, t);
    setRoot(result.root);
    if (result.view) setTab(result.view);
    else if (tab === "documents" || tab === "files") setTab("mindmap");
    if (result.focusId) { setFocusId(result.focusId); setSelectedId(result.focusId); }
    setMessages((m) => [...m, { id: newNodeId(), role: "assistant", text: result.reply }]);
    setPending(false);
  };

  const askAbout = (label: string) => {
    setChatOpen(true);
    setInput(`Add  under ${label}`);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(4, 4); }, 50);
  };

  const selected = root && selectedId ? findNode(root, selectedId) : undefined;
  const isCanvas = tab === "mindmap" || tab === "flowchart";

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Contextual toolbar */}
      <div className="z-10 flex shrink-0 items-center gap-3 px-3 pt-3 sm:px-5">
        <div className="hidden min-w-0 items-center gap-2 lg:flex lg:w-56">{header}</div>
        <div className="scrollbar-thin mx-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl bg-surface p-1 shadow-soft">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] text-muted-foreground transition-all hover:text-foreground",
                tab === id && "bg-surface-raised text-foreground shadow-soft",
              )}
            >
              <Icon className={cn("size-4", tab === id && "text-primary")} />
              <span className={cn(tab === id ? "inline" : "hidden sm:inline")}>{label}</span>
            </button>
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          {([["documents", "Docs", FileText], ["files", "Files", FolderOpen]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[13px] text-muted-foreground hover:text-foreground", tab === id && "bg-surface-raised text-foreground shadow-soft")}>
              <Icon className="size-4" /><span className="hidden xl:inline">{label}</span>
            </button>
          ))}
        </div>
        <div className="hidden justify-end lg:flex lg:w-56">
          {!chatOpen && (
            <button onClick={() => setChatOpen(true)} className="flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-float">
              <Sparkles className="size-4" /> Ask Atlas
            </button>
          )}
        </div>
      </div>
      {header && <div className="flex items-center gap-2 px-4 pt-2 lg:hidden">{header}</div>}

      {/* Stage */}
      <div className={cn("relative min-h-0 flex-1 transition-[padding] duration-300", chatOpen && !isCanvas && "lg:pr-[384px]")}>
        {!root ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>
        ) : (
          <div key={tab} className="animate-rise h-full">
            {isCanvas && <LazyWorkspaceCanvas root={root} mode={tab} selectedId={selectedId} focusId={focusId} onSelect={setSelectedId} onToggle={toggle} rightInset={chatOpen ? 376 : 0} />}
            {tab === "timeline" && <TimelineView root={root} selectedId={selectedId} onSelect={setSelectedId} />}
            {tab === "table" && <TableView root={root} selectedId={selectedId} onSelect={setSelectedId} />}
            {tab === "dashboard" && <DashboardView root={root} selectedId={selectedId} onSelect={setSelectedId} />}
            {tab === "documents" && (
              <ResourceList empty="No documents yet." items={(res?.documents ?? []).map((d) => ({ id: d.id, label: d.title, meta: formatDate(d.updatedAt), icon: FileText }))} />
            )}
            {tab === "files" && (
              <ResourceList empty="No files yet." items={(res?.files ?? []).map((f) => ({ id: f.id, label: f.name, meta: formatSize(f.size), icon: FolderOpen }))} />
            )}
          </div>
        )}

        {/* Contextual node actions */}
        {selected && root && (isCanvas || tab === "table" || tab === "timeline") && (
          <NodeActions
            node={selected.node}
            isRoot={selected.depth === 0}
            onClose={() => setSelectedId(null)}
            onAdd={() => {
              const child: WorkspaceNode = { id: newNodeId(), label: "New idea", icon: "sparkles", status: "todo", children: [] };
              setRoot(addChild(root, selected.node.id, child));
              setSelectedId(child.id);
              setFocusId(child.id);
            }}
            onDone={() => setRoot(updateNode(root, selected.node.id, { status: selected.node.status === "done" ? "active" : "done" }))}
            onToggle={() => toggle(selected.node.id)}
            onDelete={() => { setRoot(removeNode(root, selected.node.id).root); setSelectedId(null); }}
            onAsk={() => askAbout(selected.node.label)}
          />
        )}

        {/* Floating assistant */}
        <aside
          className={cn(
            "absolute z-20 flex flex-col overflow-hidden rounded-3xl bg-popover/90 shadow-float backdrop-blur-xl transition-all duration-300",
            "inset-x-2 bottom-2 max-h-[62%] lg:inset-x-auto lg:bottom-3 lg:right-3 lg:top-3 lg:max-h-none lg:w-[360px]",
            chatOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
          )}
        >
          <div className="flex items-center gap-2.5 px-4 pb-2 pt-3.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-3.5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Atlas</p>
              <p className="truncate text-[11px] text-muted-foreground">Editing the {tab === "documents" || tab === "files" ? "workspace" : VIEWS.find((v) => v.id === tab)?.label.toLowerCase()}</p>
            </div>
            <button onClick={() => setChatOpen(false)} aria-label="Hide assistant" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronDown className="size-4 lg:hidden" /><X className="hidden size-4 lg:block" />
            </button>
          </div>
          <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-2">
            {messages.map((m) => m.role === "user" ? (
              <div key={m.id} className="animate-rise ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-sm">{m.text}</div>
            ) : (
              <div key={m.id} className="animate-rise text-sm"><ResponseRenderer response={{ type: "text", content: { markdown: m.text } }} /></div>
            ))}
            {pending && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-3.5 animate-pulse text-primary" /> Reshaping the canvas…</p>}
          </div>
          <div className="scrollbar-thin flex gap-1.5 overflow-x-auto px-4 pb-2 lg:flex-wrap">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[11.5px] text-primary transition-opacity hover:opacity-80">{s}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="m-2 mt-1 flex items-end gap-2 rounded-2xl bg-surface p-1.5 pl-3.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
              rows={1}
              placeholder="Ask Atlas to change the canvas…"
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" disabled={!input.trim() || pending} aria-label="Send" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40">
              <ArrowUp className="size-4" />
            </button>
          </form>
        </aside>

        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} aria-label="Ask Atlas" className="absolute bottom-4 right-4 z-20 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-float lg:hidden">
            <MessageSquare className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function NodeActions({ node, isRoot, onClose, onAdd, onDone, onToggle, onDelete, onAsk }: {
  node: WorkspaceNode; isRoot: boolean; onClose: () => void; onAdd: () => void; onDone: () => void; onToggle: () => void; onDelete: () => void; onAsk: () => void;
}) {
  const Icon = iconFor(node.icon);
  const btn = "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  return (
    <div className="animate-rise absolute left-1/2 top-3 z-20 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl bg-popover/95 p-1.5 shadow-float backdrop-blur-xl lg:left-[calc(50%-192px)]">
      <span className="flex shrink-0 items-center gap-2 px-2 text-sm font-medium">
        <Icon className="size-4 text-primary" /><span className="max-w-36 truncate">{node.label}</span>
        {node.status && <span className="text-[11px] font-normal text-muted-foreground">{statusLabel[node.status]}</span>}
      </span>
      <span className="h-5 w-px shrink-0 bg-border" />
      <button onClick={onAdd} className={btn}><Plus className="size-3.5" />Child</button>
      {!isRoot && <button onClick={onDone} className={btn}><Check className="size-3.5" />{node.status === "done" ? "Reopen" : "Done"}</button>}
      {!isRoot && node.children.length > 0 && <button onClick={onToggle} className={btn}><ListTree className="size-3.5" />{node.collapsed ? "Expand" : "Collapse"}</button>}
      <button onClick={onAsk} className={cn(btn, "text-primary")}><Sparkles className="size-3.5" />Ask AI</button>
      {!isRoot && <button onClick={onDelete} className={cn(btn, "hover:text-destructive")} aria-label="Delete"><Trash2 className="size-3.5" /></button>}
      <button onClick={onClose} className={btn} aria-label="Close"><X className="size-3.5" /></button>
    </div>
  );
}

function ResourceList({ items, empty }: { items: { id: string; label: string; meta: string; icon: typeof FileText }[]; empty: string }) {
  if (!items.length) return <p className="p-10 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="mx-auto max-w-3xl px-6 py-8">
      {items.map(({ id, label, meta, icon: Icon }) => (
        <li key={id} className="flex items-center gap-3 border-b border-border/60 py-3.5 text-sm">
          <Icon className="size-4 text-primary" /><span className="flex-1 truncate font-medium">{label}</span><span className="text-xs text-muted-foreground">{meta}</span>
        </li>
      ))}
    </ul>
  );
}

export function WorkspaceBack() {
  return (
    <Link to="/projects" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="All projects">
      <ArrowLeft className="size-4" />
    </Link>
  );
}
