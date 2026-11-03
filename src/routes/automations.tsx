import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bot, Clock, History, Play, Zap } from "lucide-react";
import { services } from "@/services";
import { Page, PageHeader } from "@/components/app/AppShell";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { Automation } from "@/types/domain";

export const Route = createFileRoute("/automations")({
  head: () => ({
    meta: [
      { title: "Automations — Atlas" },
      { name: "description", content: "See how triggers, AI agents and actions connect in your assistant workflows." },
      { property: "og:title", content: "Automations — Atlas" },
      { property: "og:description", content: "See how triggers, AI agents and actions connect in your assistant workflows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AutomationsPage,
});

const statusStyle: Record<Automation["status"], string> = {
  healthy: "text-success",
  running: "text-info",
  failed: "text-destructive",
  paused: "text-muted-foreground",
};

const stepIcon = { trigger: Zap, agent: Bot, action: Play };

function Status({ a }: { a: Automation }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium capitalize", statusStyle[a.status])}>
      <span className={cn("size-1.5 rounded-full bg-current", a.status === "running" && "animate-pulse")} /> {a.status}
    </span>
  );
}

function Pipeline({ a }: { a: Automation }) {
  const steps = a.pipeline ?? [];
  return (
    <div className="flex flex-col items-start gap-0 md:flex-row md:items-center">
      {steps.map((s, i) => {
        const Icon = stepIcon[s.kind];
        return (
          <div key={i} className="flex flex-col items-start md:flex-row md:items-center">
            <div className={cn(
              "flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5",
              s.kind === "agent" ? "bg-primary text-primary-foreground shadow-float" : s.kind === "trigger" ? "bg-surface-raised shadow-soft" : "bg-surface",
            )}>
              <Icon className={cn("size-4", s.kind === "trigger" && "text-warning", s.kind === "action" && "text-muted-foreground")} />
              <div>
                <p className={cn("text-[10px] uppercase tracking-wider", s.kind === "agent" ? "opacity-75" : "text-muted-foreground")}>{s.kind}</p>
                <p className={cn("text-sm", s.kind === "agent" ? "font-display font-semibold" : "font-medium")}>{s.label}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <span className={cn("ml-6 h-5 w-px md:ml-0 md:h-px md:w-8", a.enabled ? "flow-line" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AutomationsPage() {
  const { data } = useQuery({ queryKey: ["automations"], queryFn: () => services.automations.list() });
  const [items, setItems] = useState<Automation[]>([]);
  const [view, setView] = useState<"flows" | "list">("flows");
  useEffect(() => { if (data) setItems(data.map((a) => ({ ...a }))); }, [data]);

  const toggle = async (id: string, enabled: boolean) => {
    const updated = await services.automations.setEnabled(id, enabled);
    setItems((xs) => xs.map((x) => (x.id === id ? updated : x)));
  };

  return (
    <Page>
      <PageHeader
        title="Automations"
        description="Triggers wake an AI agent, the agent carries out actions. Controls are mock for now."
        actions={
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList><TabsTrigger value="flows">Flows</TabsTrigger><TabsTrigger value="list">List</TabsTrigger></TabsList>
          </Tabs>
        }
      />
      {view === "flows" ? (
        <div className="divide-y divide-border/60">
          {items.map((a) => (
            <section key={a.id} className={cn("py-8 transition-opacity first:pt-2", !a.enabled && "opacity-55")}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{a.name}</h2>
                    <Status a={a} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                </div>
                <Switch checked={a.enabled} onCheckedChange={(v) => toggle(a.id, v)} aria-label={`Toggle ${a.name}`} />
              </div>
              <div className="scrollbar-thin overflow-x-auto pb-1"><Pipeline a={a} /></div>
              <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><History className="size-3.5" /> {formatDateTime(a.lastRun)}</span>
                <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {a.nextRun ? formatDateTime(a.nextRun) : "—"}</span>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className={cn("flex flex-col rounded-2xl bg-surface p-5 transition-opacity", !a.enabled && "opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                </div>
                <Switch checked={a.enabled} onCheckedChange={(v) => toggle(a.id, v)} aria-label={`Toggle ${a.name}`} />
              </div>
              <div className="mt-auto pt-5">
                <Status a={a} />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><History className="size-3.5" /> {formatDateTime(a.lastRun)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {a.nextRun ? formatDateTime(a.nextRun) : "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
