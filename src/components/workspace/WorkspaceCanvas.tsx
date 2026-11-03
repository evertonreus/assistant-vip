import { memo, useEffect, useMemo, useRef } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceNode } from "@/types/workspace";
import { branchColor, iconFor, statusColor } from "./icons";

export interface WorkspaceCanvasProps {
  root: WorkspaceNode;
  mode: "mindmap" | "flowchart";
  selectedId: string | null;
  focusId?: string | null;
  onSelect: (id: string | null) => void;
  onToggle: (id: string) => void;
  /** Space covered by the floating assistant (desktop). */
  rightInset?: number;
}

type WsData = {
  node: WorkspaceNode;
  depth: number;
  color: string;
  side: 1 | -1;
  mode: "mindmap" | "flowchart";
  hiddenCount: number;
  focused: boolean;
  onToggle: (id: string) => void;
};
type WsNode = Node<WsData, "ws">;

const visibleChildren = (n: WorkspaceNode) => (n.collapsed ? [] : n.children);
const leaves = (n: WorkspaceNode): number => {
  const c = visibleChildren(n);
  return c.length ? c.reduce((s, x) => s + leaves(x), 0) : 1;
};
const countAll = (n: WorkspaceNode): number => n.children.reduce((s, c) => s + 1 + countAll(c), 0);

const MIND_X = [0, 270, 480, 670];
const mindX = (d: number) => MIND_X[d] ?? 670 + (d - 3) * 190;
const ROW = 92;
const GAP = 60;

function layout(root: WorkspaceNode, mode: WsData["mode"]) {
  const nodes: { node: WorkspaceNode; depth: number; branch: number; side: 1 | -1; x: number; y: number }[] = [];
  const edges: { s: string; t: string; depth: number; branch: number; side: 1 | -1 }[] = [];

  if (mode === "mindmap") {
    const primaries = visibleChildren(root);
    const sides: { n: WorkspaceNode; i: number }[][] = [[], []];
    primaries.forEach((n, i) => sides[i % 2]!.push({ n, i }));
    nodes.push({ node: root, depth: 0, branch: -1, side: 1, x: 0, y: 0 });
    sides.forEach((group, si) => {
      const side = (si === 0 ? 1 : -1) as 1 | -1;
      const total = group.reduce((s, g) => s + leaves(g.n) * ROW, 0) + GAP * Math.max(0, group.length - 1);
      let cursor = -total / 2;
      const place = (n: WorkspaceNode, depth: number, branch: number, start: number) => {
        const h = leaves(n) * ROW;
        nodes.push({ node: n, depth, branch, side, x: side * mindX(depth), y: start + h / 2 });
        let c = start;
        for (const ch of visibleChildren(n)) {
          edges.push({ s: n.id, t: ch.id, depth: depth + 1, branch, side });
          place(ch, depth + 1, branch, c);
          c += leaves(ch) * ROW;
        }
      };
      for (const g of group) {
        edges.push({ s: root.id, t: g.n.id, depth: 1, branch: g.i, side });
        place(g.n, 1, g.i, cursor);
        cursor += leaves(g.n) * ROW + GAP;
      }
    });
  } else {
    const COL = 210;
    const place = (n: WorkspaceNode, depth: number, branch: number, start: number) => {
      const w = leaves(n) * COL;
      nodes.push({ node: n, depth, branch, side: 1, x: start + w / 2, y: depth * 150 });
      let c = start;
      visibleChildren(n).forEach((ch, i) => {
        const b = depth === 0 ? i : branch;
        edges.push({ s: n.id, t: ch.id, depth: depth + 1, branch: b, side: 1 });
        place(ch, depth + 1, b, c);
        c += leaves(ch) * COL;
      });
    };
    place(root, 0, -1, -(leaves(root) * COL) / 2);
  }
  return { nodes, edges };
}

const WsNodeView = memo(function WsNodeView({ data, selected }: NodeProps<WsNode>) {
  const { node, depth, color, side, mode, hiddenCount, focused, onToggle } = data;
  const Icon = iconFor(node.icon);
  const flow = mode === "flowchart";
  const hasKids = node.children.length > 0;
  const toggle = hasKids && depth > 0 && (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
      className={cn(
        "nodrag flex h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold transition-colors ws-tint",
      )}
      aria-label={node.collapsed ? `Expand ${node.label}` : `Collapse ${node.label}`}
    >
      {node.collapsed ? <>+{hiddenCount}</> : <ChevronRight className={cn("size-3 transition-transform", flow ? "rotate-90" : side < 0 && "rotate-180")} />}
    </button>
  );
  const status = node.status && (
    <span className="size-2 shrink-0 rounded-full" style={{ background: statusColor[node.status] }} title={node.status} />
  );

  const handles = (
    <>
      <Handle type="target" id="t" position={flow ? Position.Top : side > 0 ? Position.Left : Position.Right} className="ws-handle" />
      <Handle type="source" id="s" position={flow ? Position.Bottom : side > 0 ? Position.Right : Position.Left} className="ws-handle" />
      <Handle type="source" id="sl" position={Position.Left} className="ws-handle" />
    </>
  );

  const ring = cn(selected && "ws-selected", focused && "ws-focused");

  if (depth === 0) {
    return (
      <div className={cn("ws-root flex items-center gap-3 rounded-[28px] px-7 py-5", ring)}>
        {handles}
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/15"><Icon className="size-5" /></span>
        <div>
          <p className="font-display text-xl font-semibold leading-tight tracking-tight">{node.label}</p>
          <p className="text-xs opacity-75">{countAll(node)} ideas</p>
        </div>
      </div>
    );
  }
  if (depth === 1) {
    return (
      <div style={{ ["--c" as string]: color }} className={cn("ws-primary flex min-w-[190px] items-center gap-3 rounded-2xl py-2.5 pl-2.5 pr-3", flow ? "" : side < 0 && "flex-row-reverse text-right", ring)}>
        {handles}
        <span className="ws-tint flex size-9 shrink-0 items-center justify-center rounded-xl"><Icon className="size-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold leading-tight">{node.label}</p>
          <p className={cn("mt-0.5 flex items-center gap-1.5 text-[11px] capitalize text-muted-foreground", side < 0 && !flow && "justify-end")}>
            {status}{node.category ?? "branch"} · {node.children.length}
          </p>
        </div>
        {toggle}
      </div>
    );
  }
  if (depth === 2) {
    return (
      <div style={{ ["--c" as string]: color }} className={cn("ws-secondary flex max-w-[230px] items-center gap-2 rounded-xl px-3 py-2 text-[13.5px]", side < 0 && !flow && "flex-row-reverse", ring)}>
        {handles}
        <Icon className="size-3.5 shrink-0" style={{ color }} />
        <span className="truncate font-medium">{node.label}</span>
        {status}
        {toggle}
      </div>
    );
  }
  return (
    <div style={{ ["--c" as string]: color }} className={cn("ws-detail flex max-w-[210px] items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] text-muted-foreground", side < 0 && !flow && "flex-row-reverse", ring)}>
      {handles}
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="truncate">{node.label}</span>
      {status}
      {toggle}
    </div>
  );
});

const nodeTypes = { ws: WsNodeView };

function Inner({ root, mode, selectedId, focusId, onSelect, onToggle, rightInset = 0 }: WorkspaceCanvasProps) {
  const manual = useRef(new Map<string, { x: number; y: number }>());
  const { fitView, getViewport, setViewport } = useReactFlow();
  const built = useMemo(() => {
    const { nodes, edges } = layout(root, mode);
    const key = `${mode}:`;
    const n: WsNode[] = nodes.map((p) => ({
      id: p.node.id,
      type: "ws",
      position: manual.current.get(key + p.node.id) ?? { x: p.x, y: p.y },
      selected: p.node.id === selectedId,
      data: {
        node: p.node, depth: p.depth, color: branchColor(p.branch), side: p.side, mode,
        hiddenCount: p.node.collapsed ? countAll(p.node) : 0, focused: p.node.id === focusId, onToggle,
      },
    }));
    const e: Edge[] = edges.map((x) => ({
      id: `${x.s}->${x.t}`,
      source: x.s,
      target: x.t,
      sourceHandle: mode === "mindmap" && x.depth === 1 && x.side < 0 ? "sl" : "s",
      targetHandle: "t",
      type: mode === "mindmap" ? "default" : "smoothstep",
      style: { stroke: branchColor(x.branch), strokeWidth: x.depth === 1 ? 3 : x.depth === 2 ? 2 : 1.25, opacity: x.depth === 1 ? 0.7 : 0.5 },
    }));
    return { n, e };
  }, [root, mode, selectedId, focusId, onToggle]);

  const [nodes, setNodes, onNodesChange] = useNodesState<WsNode>(built.n);
  const [edges, setEdges, onEdgesChange] = useEdgesState(built.e);
  useEffect(() => { setNodes(built.n); setEdges(built.e); }, [built, setNodes, setEdges]);

  const structureKey = useMemo(() => `${mode}|${built.n.map((n) => n.id).join(",")}`, [mode, built.n]);
  useEffect(() => {
    const inset = window.innerWidth >= 1024 ? rightInset : 0;
    const t = setTimeout(async () => {
      await fitView({ padding: 0.08, maxZoom: 1.1 });
      if (!inset) return;
      const el = document.querySelector(".react-flow") as HTMLElement | null;
      const w = el?.clientWidth ?? 1;
      const v = getViewport();
      const k = (w - inset) / w;
      // Re-center inside the area not covered by the assistant.
      void setViewport({ zoom: v.zoom * k, x: (v.x - w / 2) * k + (w - inset) / 2, y: v.y * k + (el?.clientHeight ?? 0) * (1 - k) / 2 }, { duration: 450 });
    }, 40);
    return () => clearTimeout(t);
  }, [structureKey, fitView, getViewport, setViewport, rightInset]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, n) => onSelect(n.id)}
      onPaneClick={() => onSelect(null)}
      onNodeDragStop={(_, n) => manual.current.set(`${mode}:${n.id}`, n.position)}
      nodeOrigin={[0.5, 0.5]}
      nodesConnectable={false}
      fitView
      fitViewOptions={{ padding: 0.12, maxZoom: 1.1 }}
      minZoom={0.15}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={28} size={1.2} className="ws-dots" />
      <Controls showInteractive={false} position="bottom-left" className="!mb-4 !ml-4" />
    </ReactFlow>
  );
}

export default function WorkspaceCanvas(props: WorkspaceCanvasProps) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
