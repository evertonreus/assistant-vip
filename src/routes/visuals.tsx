import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { services } from "@/services";
import { Page, PageHeader } from "@/components/app/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazyFlowCanvas } from "@/components/visuals/LazyFlowCanvas";
import { MermaidView } from "@/components/visuals/MermaidView";
import { TimelineBlock } from "@/components/renderer/blocks";
import { cn } from "@/lib/utils";
import type { VisualKind } from "@/types/domain";

export const Route = createFileRoute("/visuals")({
  head: () => ({
    meta: [
      { title: "Visuals — Atlas" },
      { name: "description", content: "Interactive mind maps, flowcharts and timelines." },
      { property: "og:title", content: "Visuals — Atlas" },
      { property: "og:description", content: "Interactive mind maps, flowcharts and timelines." },
    ],
  }),
  component: VisualsPage,
});

function VisualsPage() {
  const { data = [] } = useQuery({ queryKey: ["visuals"], queryFn: () => services.visuals.list() });
  const [kind, setKind] = useState<VisualKind>("mindmap");
  const [mode, setMode] = useState<"interactive" | "mermaid">("interactive");
  const list = data.filter((v) => v.kind === kind);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = list.find((v) => v.id === selectedId) ?? list[0];

  return (
    <Page>
      <PageHeader title="Visuals" description="Zoom, pan, drag and connect nodes. Open full screen for focus." />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={kind} onValueChange={(v) => { setKind(v as VisualKind); setSelectedId(null); }}>
          <TabsList>
            <TabsTrigger value="mindmap">Mind Maps</TabsTrigger>
            <TabsTrigger value="flowchart">Flowcharts</TabsTrigger>
            <TabsTrigger value="timeline">Timelines</TabsTrigger>
          </TabsList>
        </Tabs>
        {kind !== "timeline" && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="ml-auto">
            <TabsList>
              <TabsTrigger value="interactive">Interactive</TabsTrigger>
              <TabsTrigger value="mermaid">Mermaid</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {list.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedId(v.id)}
            className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors", selected?.id === v.id ? "border-primary bg-primary-soft text-primary" : "hover:bg-accent")}
          >
            {v.title}
          </button>
        ))}
      </div>
      {selected && (selected.kind === "timeline" ? (
        <div className="rounded-2xl border bg-card p-6 shadow-soft"><TimelineBlock content={selected.content} /></div>
      ) : mode === "mermaid" && selected.content.mermaid ? (
        <MermaidView key={selected.id} source={selected.content.mermaid} />
      ) : (
        <LazyFlowCanvas key={selected.id} content={selected.content} variant={selected.kind} height="min(70vh, 620px)" />
      ))}
    </Page>
  );
}
