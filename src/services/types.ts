import type {
  Attachment,
  Automation,
  ChatMessage,
  Conversation,
  FileItem,
  Project,
  ProjectDashboard,
  ProjectDocument,
  Visual,
} from "@/types/domain";
import type { CanvasCommandResult, Workspace, WorkspaceNode } from "@/types/workspace";

/** Service contracts. UI depends only on these, never on a concrete backend. */
export interface AssistantService {
  listConversations(): Promise<Conversation[]>;
  createConversation(projectId?: string): Promise<Conversation>;
  sendMessage(conversationId: string, text: string, attachments?: Attachment[]): Promise<ChatMessage>;
}

export interface ProjectService {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | undefined>;
  resources(id: string): Promise<{
    conversations: Conversation[];
    visuals: Visual[];
    documents: ProjectDocument[];
    files: FileItem[];
    dashboards: ProjectDashboard[];
  }>;
}

export interface VisualService {
  list(): Promise<Visual[]>;
  save(visual: Visual): Promise<void>;
}

export interface FileService {
  list(): Promise<FileItem[]>;
  upload(file: File, projectId?: string): Promise<FileItem>;
}

export interface AutomationService {
  list(): Promise<Automation[]>;
  setEnabled(id: string, enabled: boolean): Promise<Automation>;
}

export interface WorkspaceService {
  get(projectId: string): Promise<Workspace>;
  /** Ask the assistant to change the canvas. Returns the updated tree. */
  command(root: WorkspaceNode, text: string): Promise<CanvasCommandResult>;
}

export interface Services {
  workspace: WorkspaceService;
  assistant: AssistantService;
  projects: ProjectService;
  visuals: VisualService;
  files: FileService;
  automations: AutomationService;
}
