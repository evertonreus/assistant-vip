import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BarChart3, FileText, GitBranch, LayoutDashboard, ListTree, Network, Table2, Type } from "lucide-react";
import type { AssistantResponse, ResponseType } from "@/types/assistant";
import { LazyFlowCanvas } from "@/components/visuals/LazyFlowCanvas";
import { Markdown } from "./Markdown";
import { ChartBlock, DocumentBlock, TableBlock, TimelineBlock, TrendIcon } from "./blocks";

export const responseIcons: Record<ResponseType, typeof Type> = {
  text: Type,
  mindmap: Network,
  flowchart: GitBranch,
  timeline: ListTree,
  table: Table2,
  chart: BarChart3,
  document: FileText,
  dashboard: LayoutDashboard,
};

function Body({ response }: { response: AssistantResponse }) {
  switch (response.type) {
    case "text":
      return <Markdown>{response.content.markdown}</Markdown>;
    case "mindmap":
    case "flowchart":
      return <LazyFlowCanvas content={response.content} variant={response.type} height={360} compact />;
    case "timeline":
      return <TimelineBlock content={response.content} />;
    case "table":
      return <TableBlock content={response.content} />;
    case "chart":
      return <ChartBlock content={response.content} />;
    case "document":
      return <DocumentBlock content={response.content} />;
    case "dashboard":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {response.content.metrics.map((m) => (
              <div key={m.label} className="rounded-xl border bg-surface p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-1 font-display text-xl font-semibold">{m.value}</p>
                {m.delta && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendIcon trend={m.trend} /> {m.delta}
                  </p>
                )}
              </div>
            ))}
          </div>
          {response.content.widgets?.map((w, i) => <ResponseRenderer key={i} response={w} nested />)}
        </div>
      );
    default: {
      const unknown = response as { type: string };
      return <p className="text-sm text-muted-foreground">Unsupported response type: {unknown.type}</p>;
    }
  }
}

/** Renders any structured assistant response. Add new types here. */
export function ResponseRenderer({ response, nested }: { response: AssistantResponse; nested?: boolean }) {
  if (response.type === "text" && !response.title) return <Body response={response} />;
  const Icon = responseIcons[response.type] ?? Type;
  return (
    <div className={nested ? "rounded-xl border p-3" : "space-y-2.5"}>
      <div className="flex items-center gap-2 text-sm">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Icon className="size-3.5" />
        </span>
        <span className="font-medium">{response.title ?? response.type}</span>
        <span className="text-xs capitalize text-muted-foreground">· {response.type}</span>
        {!nested && ["mindmap", "flowchart", "timeline", "dashboard"].includes(response.type) && (
          <Link to="/canvas" className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary hover:opacity-80">
            Open in canvas <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </div>
      <Body response={response} />
    </div>
  );
}
