import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Mic, MessageSquarePlus, Paperclip, Sparkles, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { services } from "@/services";
import type { Attachment, ChatMessage, Conversation } from "@/types/domain";
import { ResponseRenderer } from "@/components/renderer/ResponseRenderer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate, formatSize } from "@/lib/format";

const SUGGESTIONS = ["Make a mindmap of REUMED", "Draw the incident flowchart", "Show my job search timeline", "Table of open work orders", "Chart pilot enrolments", "Write the maintenance SOP document"];

function AttachmentChip({ a, onRemove }: { a: Attachment; onRemove?: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg border bg-surface px-2.5 py-1.5 text-xs">
      <FileText className="size-3.5 shrink-0 text-primary" />
      <span className="truncate">{a.name}</span>
      <span className="text-muted-foreground">{formatSize(a.size)}</span>
      {onRemove && (
        <button onClick={onRemove} aria-label="Remove attachment" className="text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}

function Message({ m }: { m: ChatMessage }) {
  if (m.role === "user") {
    return (
      <div className="animate-rise flex flex-col items-end gap-1.5">
        {m.attachments?.map((a) => <AttachmentChip key={a.id} a={a} />)}
        {m.text && <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[0.95rem]">{m.text}</div>}
      </div>
    );
  }
  return (
    <div className="animate-rise flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-4">
        {m.responses?.map((r, i) => <ResponseRenderer key={i} response={r} />)}
      </div>
    </div>
  );
}

export function ChatView() {
  const { data } = useQuery({ queryKey: ["conversations"], queryFn: () => services.assistant.listConversations() });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (data && conversations.length === 0) {
      setConversations(data);
      setActiveId(data[0]?.id ?? "");
    }
  }, [data, conversations.length]);

  const active = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, pending]);

  const update = (id: string, fn: (c: Conversation) => Conversation) =>
    setConversations((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));

  const newConversation = async () => {
    const c = await services.assistant.createConversation();
    setConversations((cs) => [c, ...cs]);
    setActiveId(c.id);
  };

  const send = async (text = input) => {
    const t = text.trim();
    if ((!t && !attachments.length) || pending) return;
    let id = activeId;
    if (!id) {
      const c = await services.assistant.createConversation();
      setConversations((cs) => [c, ...cs]);
      id = c.id;
      setActiveId(id);
    }
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", createdAt: new Date().toISOString(), text: t, attachments };
    update(id, (c) => ({ ...c, title: c.messages.length ? c.title : t.slice(0, 40) || "Attachment", messages: [...c.messages, userMsg] }));
    setInput("");
    setAttachments([]);
    if (taRef.current) taRef.current.style.height = "";
    setPending(true);
    try {
      const reply = await services.assistant.sendMessage(id, t, userMsg.attachments);
      update(id, (c) => ({ ...c, messages: [...c.messages, reply] }));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversation list (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r lg:flex">
        <div className="p-3">
          <Button onClick={newConversation} variant="outline" className="w-full justify-start gap-2">
            <MessageSquarePlus className="size-4" /> New conversation
          </Button>
        </div>
        <p className="px-4 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">History</p>
        <div className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn("w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent", c.id === activeId && "bg-accent")}
            >
              <p className="truncate text-sm">{c.title}</p>
              <p className="text-xs text-muted-foreground">{formatDate(c.updatedAt)}</p>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
          <Select value={activeId} onValueChange={setActiveId}>
            <SelectTrigger className="h-8 w-auto max-w-[70%] border-none bg-transparent px-2 font-medium shadow-none hover:bg-accent">
              <SelectValue placeholder="Select conversation" />
            </SelectTrigger>
            <SelectContent>
              {conversations.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" className="ml-auto size-8 lg:hidden" onClick={newConversation} aria-label="New conversation">
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
            {active && active.messages.length > 0 ? (
              active.messages.map((m) => <Message key={m.id} m={m} />)
            ) : (
              <div className="glow-bg flex flex-col items-center pt-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-float">
                  <Sparkles className="size-5" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold">How can I help today?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Ask anything, or try a structured response.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="rounded-full border bg-surface px-3.5 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pending && (
              <div className="flex gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-3.5" /></span>
                <div className="flex items-center gap-1 pt-2">
                  {[0, 1, 2].map((i) => <span key={i} className="typing-dot size-1.5 rounded-full bg-muted-foreground" />)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-2 shadow-float transition-colors focus-within:border-primary/60">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1 pb-2">
                {attachments.map((a) => <AttachmentChip key={a.id} a={a} onRemove={() => setAttachments((as) => as.filter((x) => x.id !== a.id))} />)}
              </div>
            )}
            <textarea
              ref={taRef}
              value={input}
              rows={1}
              placeholder="Message Atlas…"
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="block max-h-[200px] w-full resize-none bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted-foreground sm:text-[0.95rem]"
            />
            <div className="flex items-center gap-1 pt-1">
              <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  const list = Array.from(e.target.files ?? []).map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size, mimeType: f.type }));
                  setAttachments((as) => [...as, ...list]);
                  e.target.value = "";
                }}
              />
              <Button size="icon" variant="ghost" className="size-9 rounded-xl" onClick={() => fileRef.current?.click()} aria-label="Attach files">
                <Paperclip className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" className="size-9 rounded-xl" onClick={() => toast("Voice input is coming soon")} aria-label="Voice input">
                <Mic className="size-4" />
              </Button>
              <Button size="icon" className="ml-auto size-9 rounded-xl" disabled={(!input.trim() && !attachments.length) || pending} onClick={() => send()} aria-label="Send">
                <ArrowUp className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
