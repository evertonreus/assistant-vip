/**
 * Structured assistant response contract.
 * Provider-agnostic: the backend orchestrator (n8n) decides which model answers;
 * the frontend only knows the response `type` and its `content` shape.
 */
export type ResponseType =
  | "text"
  | "mindmap"
  | "flowchart"
  | "timeline"
  | "table"
  | "chart"
  | "document"
  | "dashboard";

export type GraphNodeKind = "root" | "branch" | "leaf" | "start" | "process" | "decision" | "end";

export interface GraphNode {
  id: string;
  label: string;
  kind?: GraphNodeKind;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface TextContent {
  markdown: string;
}

export interface GraphContent {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Optional Mermaid source for text-generated diagrams. */
  mermaid?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  status?: "done" | "active" | "upcoming";
}

export interface TimelineContent {
  events: TimelineEvent[];
}

export interface TableContent {
  columns: string[];
  rows: (string | number)[][];
}

export interface ChartContent {
  kind: "bar" | "line" | "area";
  xKey: string;
  series: { key: string; label: string }[];
  data: Record<string, string | number>[];
}

export interface DocumentContent {
  summary?: string;
  sections: { heading: string; body: string }[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
}

export interface DashboardContent {
  metrics: DashboardMetric[];
  widgets?: AssistantResponse[];
}

export interface ResponseContentMap {
  text: TextContent;
  mindmap: GraphContent;
  flowchart: GraphContent;
  timeline: TimelineContent;
  table: TableContent;
  chart: ChartContent;
  document: DocumentContent;
  dashboard: DashboardContent;
}

export interface ResponseMetadata {
  createdAt?: string;
  /** Workflow/agent label supplied by the backend. Never a credential. */
  workflow?: string;
  [key: string]: unknown;
}

export type AssistantResponse = {
  [K in ResponseType]: {
    type: K;
    title?: string;
    content: ResponseContentMap[K];
    metadata?: ResponseMetadata;
  };
}[ResponseType];
