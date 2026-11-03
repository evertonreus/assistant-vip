import type { Services } from "../types";
import type { Conversation } from "@/types/domain";
import {
  automations,
  dashboards,
  documents,
  files,
  mockResponseFor,
  projects,
  seedConversations,
  visuals,
} from "./data";
import { seedWorkspaces } from "./workspaces";
import { runCanvasCommand } from "./canvas-commands";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let conversations: Conversation[] | null = null;
const store = () => (conversations ??= seedConversations());
let counter = 0;
const uid = (p: string) => `${p}-${Date.now()}-${++counter}`;

const KEYWORDS = ["mindmap", "mind map", "flowchart", "flow", "timeline", "table", "chart", "document", "dashboard"];

function detectKind(text: string) {
  const t = text.toLowerCase();
  const hit = KEYWORDS.find((k) => t.includes(k));
  if (!hit) return "text";
  if (hit === "mind map") return "mindmap";
  if (hit === "flow") return "flowchart";
  return hit;
}

const workspaces = seedWorkspaces();

export const mockServices: Services = {
  workspace: {
    async get(projectId) {
      await wait(60);
      const w = workspaces.find((x) => x.projectId === projectId) ?? workspaces[0]!;
      return structuredClone(w);
    },
    async command(root, text) {
      await wait(650);
      return runCanvasCommand(root, text);
    },
  },
  assistant: {
    async listConversations() {
      await wait(120);
      return [...store()];
    },
    async createConversation(projectId) {
      const c: Conversation = { id: uid("c"), title: "New conversation", projectId, updatedAt: new Date().toISOString(), messages: [] };
      store().unshift(c);
      return c;
    },
    async sendMessage(conversationId, text) {
      await wait(900);
      const c = store().find((x) => x.id === conversationId);
      if (c && c.title === "New conversation") c.title = text.slice(0, 40);
      return {
        id: uid("m"),
        role: "assistant",
        createdAt: new Date().toISOString(),
        responses: [mockResponseFor(detectKind(text))],
      };
    },
  },
  projects: {
    async list() {
      await wait(80);
      return projects;
    },
    async get(id) {
      return projects.find((p) => p.id === id);
    },
    async resources(id) {
      await wait(80);
      return {
        conversations: store().filter((c) => c.projectId === id),
        visuals: visuals.filter((v) => v.projectId === id),
        documents: documents.filter((d) => d.projectId === id),
        files: files.filter((f) => f.projectId === id),
        dashboards: dashboards.filter((d) => d.projectId === id),
      };
    },
  },
  visuals: {
    async list() {
      await wait(80);
      return visuals;
    },
    async save() {
      await wait(300);
    },
  },
  files: {
    async list() {
      await wait(80);
      return files;
    },
    async upload(file, projectId = "personal") {
      await wait(400);
      return { id: uid("f"), name: file.name, type: "doc", projectId, size: file.size, modifiedAt: new Date().toISOString() };
    },
  },
  automations: {
    async list() {
      await wait(80);
      return automations;
    },
    async setEnabled(id, enabled) {
      const a = automations.find((x) => x.id === id)!;
      a.enabled = enabled;
      a.status = enabled ? "healthy" : "paused";
      return { ...a };
    },
  },
};
