import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { WorkspaceCanvasProps } from "./WorkspaceCanvas";

const WorkspaceCanvas = lazy(() => import("./WorkspaceCanvas"));

export function LazyWorkspaceCanvas(props: WorkspaceCanvasProps) {
  const fallback = <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preparing canvas…</div>;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <WorkspaceCanvas {...props} />
      </Suspense>
    </ClientOnly>
  );
}
