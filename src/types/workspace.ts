/**
 * Workspace = one underlying tree of project knowledge.
 * Mind map, flowchart, timeline, table and dashboard are all views of it.
 */
export type NodeStatus = "done" | "active" | "blocked" | "todo";
export type NodeCategory = "core" | "people" | "process" | "data" | "risk" | "finance" | "ops";

export interface WorkspaceNode {
  id: string;
  label: string;
  /** Key in the workspace icon map (see components/workspace/icons). */
  icon?: string;
  category?: NodeCategory;
  status?: NodeStatus;
  /** ISO date — nodes with a date appear on the timeline. */
  date?: string;
  owner?: string;
  collapsed?: boolean;
  children: WorkspaceNode[];
}

export interface Workspace {
  id: string;
  projectId: string;
  title: string;
  root: WorkspaceNode;
}

export type WorkspaceView = "mindmap" | "flowchart" | "timeline" | "table" | "dashboard";

export interface CanvasCommandResult {
  root: WorkspaceNode;
  view?: WorkspaceView;
  reply: string;
  /** Node the assistant just touched — the canvas highlights it. */
  focusId?: string;
}
