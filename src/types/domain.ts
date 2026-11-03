import type { AssistantResponse, GraphContent, TimelineContent } from "./assistant";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  createdAt: string;
  text?: string;
  responses?: AssistantResponse[];
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  projectId?: string | undefined;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
  updatedAt: string;
}

export type VisualKind = "mindmap" | "flowchart" | "timeline";

export type Visual =
  | { id: string; title: string; projectId: string; kind: "mindmap" | "flowchart"; updatedAt: string; content: GraphContent }
  | { id: string; title: string; projectId: string; kind: "timeline"; updatedAt: string; content: TimelineContent };

export type FileType = "pdf" | "doc" | "sheet" | "image" | "code" | "archive";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  projectId: string;
  size: number;
  modifiedAt: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  status: "healthy" | "running" | "failed" | "paused";
  enabled: boolean;
  lastRun: string;
  nextRun: string | null;
  projectId?: string;
  /** Trigger → agent → actions, for the visual workflow view. */
  pipeline?: { kind: "trigger" | "agent" | "action"; label: string }[];
}

export interface ProjectDocument {
  id: string;
  title: string;
  projectId: string;
  updatedAt: string;
}

export interface ProjectDashboard {
  id: string;
  title: string;
  projectId: string;
}
