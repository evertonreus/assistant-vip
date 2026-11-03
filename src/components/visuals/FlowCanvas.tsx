import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Minimize2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { GraphContent } from "@/types/assistant";

export interface FlowCanvasProps {
  content: GraphContent;
  variant: "mindmap" | "flowchart";
  height?: number | string;
  compact?: boolean;
}

function toFlow(content: GraphContent, variant: FlowCanvasProps["variant"]) {
  const nodes: Node[] = content.nodes.map((n) => ({
    id: n.id,
    position: { x: n.x, y: n.y },
    data: { label: n.label },
    className: `flow-node flow-${n.kind ?? "process"}`,
  }));
  const edges: Edge[] = content.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: variant === "mindmap" ? "default" : "smoothstep",
    animated: variant === "flowchart" && !!e.label,
  }));
  return { nodes, edges };
}

export default function FlowCanvas({ content, variant, height = 420, compact }: FlowCanvasProps) {
  const initial = toFlow(content, variant);
  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selected, setSelected] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const onConnect = useCallback((c: Connection) => setEdges((es) => addEdge(c, es)), [setEdges]);

  const toggleFull = async () => {
    if (!document.fullscreenElement) {
      await wrap.current?.requestFullscreen?.().catch(() => setFull((f) => !f));
      setFull(true);
    } else {
      await document.exitFullscreen();
      setFull(false);
    }
  };

  return (
    <div
      ref={wrap}
      className={
        full
          ? "fixed inset-0 z-50 bg-background"
          : "relative overflow-hidden rounded-xl border bg-surface"
      }
      style={full ? undefined : { height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={({ nodes: ns }) => setSelected(ns[0]?.id ?? null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
        {!compact && <MiniMap pannable zoomable className="hidden sm:block" />}
      </ReactFlow>
      <div className="absolute right-3 top-3 flex gap-2">
        <Button size="sm" variant="secondary" className="shadow-soft" onClick={() => toast.success("Saved (mock) — will sync to your VPS later")}>
          <Save className="size-4" /> <span className="hidden sm:inline">Save</span>
        </Button>
        <Button size="icon" variant="secondary" className="size-8 shadow-soft" onClick={toggleFull} aria-label="Toggle full screen">
          {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </Button>
      </div>
      {selected && (
        <div className="absolute left-3 top-3 rounded-lg border bg-popover px-3 py-1.5 text-xs text-muted-foreground shadow-soft">
          Selected: <span className="font-medium text-foreground">{nodes.find((n) => n.id === selected)?.data["label"] as string}</span>
        </div>
      )}
    </div>
  );
}
