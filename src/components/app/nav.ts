import { Bell, FolderKanban, FolderOpen, MessageSquare, Radar, Settings, Shapes, Workflow } from "lucide-react";

export const navItems = [
  { to: "/canvas", label: "Canvas", icon: Shapes },
  { to: "/", label: "Chat", icon: MessageSquare },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/files", label: "Files", icon: FolderOpen },
  { to: "/automations", label: "Automations", icon: Workflow },
  { to: "/career-radar", label: "Career Radar", icon: Radar },
  { to: "/alerts", label: "Alertas", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
