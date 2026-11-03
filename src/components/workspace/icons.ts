import {
  AlertTriangle, BarChart3, Book, Bot, Box, Briefcase, Calendar, Check, Circle, Database, Factory, FileText, Flag, GitBranch, Heart,
  Home, LayoutGrid, Plane, Search, Send, Shield, Sparkles, User, Users, Wallet, Wrench, Zap,
} from "lucide-react";
import type { NodeStatus } from "@/types/workspace";

export const nodeIcons = {
  alert: AlertTriangle, chart: BarChart3, book: Book, bot: Bot, box: Box, briefcase: Briefcase, calendar: Calendar, check: Check,
  database: Database, factory: Factory, file: FileText, flag: Flag, flow: GitBranch, heart: Heart, home: Home, layout: LayoutGrid,
  plane: Plane, search: Search, send: Send, shield: Shield, sparkles: Sparkles, user: User, users: Users, wallet: Wallet, wrench: Wrench, zap: Zap,
};

export const iconFor = (key?: string) => (key && key in nodeIcons ? nodeIcons[key as keyof typeof nodeIcons] : Circle);

/** Branch colors cycle through the chart tokens. */
export const branchColor = (branch: number) => (branch < 0 ? "var(--primary)" : `var(--color-chart-${(branch % 5) + 1})`);

export const statusColor: Record<NodeStatus, string> = {
  done: "var(--success)",
  active: "var(--info)",
  blocked: "var(--destructive)",
  todo: "var(--muted-foreground)",
};

export const statusLabel: Record<NodeStatus, string> = { done: "Done", active: "In progress", blocked: "Blocked", todo: "To do" };
