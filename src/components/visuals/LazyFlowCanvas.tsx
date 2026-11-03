import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { FlowCanvasProps } from "./FlowCanvas";

const FlowCanvas = lazy(() => import("./FlowCanvas"));

export function LazyFlowCanvas(props: FlowCanvasProps) {
  const fallback = (
    <div className="animate-pulse rounded-xl border bg-surface" style={{ height: props.height ?? 420 }} />
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <FlowCanvas {...props} />
      </Suspense>
    </ClientOnly>
  );
}
