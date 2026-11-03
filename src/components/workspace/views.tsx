import { flatten } from "@/lib/workspace-tree";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NodeStatus, WorkspaceNode } from "@/types/workspace";
import { branchColor, iconFor, statusColor, statusLabel } from "./icons";

interface ViewProps {
  root: WorkspaceNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function StatusPill({ s }: { s?: NodeStatus | undefined }) {
  if (!s) return <span className="text-muted-foreground/50">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="size-2 rounded-full" style={{ background: statusColor[s] }} />
      {statusLabel[s]}
    </span>
  );
}

export function TimelineView({ root, selectedId, onSelect }: ViewProps) {
  const items = flatten(root)
    .filter((f) => f.node.date)
    .sort((a, b) => a.node.date!.localeCompare(b.node.date!));
  const branches = root.children;
  const today = "2026-10-02";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-6 pt-6 text-xs text-muted-foreground sm:px-10">
        {branches.map((b, i) => (
          <span key={b.id} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: branchColor(i) }} />{b.label}</span>
        ))}
      </div>
      <div className="scrollbar-thin flex-1 overflow-x-auto overflow-y-hidden">
        <div className="relative flex h-full min-w-max items-center px-10">
          <div className="absolute inset-x-10 top-1/2 h-px bg-border" />
          {items.map((f, idx) => {
            const up = idx % 2 === 0;
            const Icon = iconFor(f.node.icon);
            const past = f.node.date! < today;
            return (
              <button
                key={f.node.id}
                onClick={() => onSelect(f.node.id)}
                className="group relative flex h-full w-44 shrink-0 flex-col items-center"
                style={{ ["--c" as string]: branchColor(f.branch) }}
              >
                <div className={cn("absolute left-1/2 flex w-40 -translate-x-1/2 flex-col items-center text-center", up ? "bottom-1/2 mb-6" : "top-1/2 mt-6")}>
                  <span className={cn("text-[11px] font-medium uppercase tracking-wider", past ? "text-muted-foreground" : "text-[color:var(--c)]")}>{formatDate(f.node.date!)}</span>
                  <span className={cn("mt-1 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-display text-sm font-semibold transition-colors group-hover:bg-accent", selectedId === f.node.id && "bg-accent ring-2 ring-primary")}>
                    <Icon className="size-3.5 shrink-0 text-[color:var(--c)]" /> {f.node.label}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">{f.parent?.label}</span>
                  <span className="mt-1"><StatusPill s={f.node.status} /></span>
                </div>
                <span className={cn("absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background", f.node.status === "done" ? "bg-[color:var(--c)]" : "bg-background ring-2 ring-[color:var(--c)]")} />
                <span className={cn("absolute left-1/2 w-px bg-[color:var(--c)] opacity-40", up ? "bottom-1/2 h-6" : "top-1/2 h-6")} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TableView({ root, selectedId, onSelect }: ViewProps) {
  const rows = flatten(root).filter((f) => f.depth > 0);
  return (
    <div className="scrollbar-thin h-full overflow-auto px-4 py-6 sm:px-10">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 font-medium">Item</th><th className="pb-3 font-medium">Category</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Owner</th><th className="pb-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => {
            const Icon = iconFor(f.node.icon);
            return (
              <tr key={f.node.id} onClick={() => onSelect(f.node.id)} className={cn("cursor-pointer border-t border-border/60 transition-colors hover:bg-accent/50", selectedId === f.node.id && "bg-primary-soft")}>
                <td className="py-2.5" style={{ paddingLeft: (f.depth - 1) * 22 }}>
                  <span className={cn("flex items-center gap-2", f.depth === 1 && "font-display font-semibold")}>
                    <Icon className="size-4 shrink-0" style={{ color: branchColor(f.branch) }} /> {f.node.label}
                  </span>
                </td>
                <td className="py-2.5 capitalize text-muted-foreground">{f.node.category ?? ""}</td>
                <td className="py-2.5"><StatusPill s={f.node.status} /></td>
                <td className="py-2.5 text-muted-foreground">{f.node.owner ?? ""}</td>
                <td className="py-2.5 text-muted-foreground">{f.node.date ? formatDate(f.node.date) : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardView({ root, onSelect }: ViewProps) {
  const all = flatten(root).filter((f) => f.depth > 0);
  const withStatus = all.filter((f) => f.node.status);
  const count = (s: NodeStatus) => withStatus.filter((f) => f.node.status === s).length;
  const done = count("done");
  const pct = withStatus.length ? Math.round((done / withStatus.length) * 100) : 0;
  const upcoming = all.filter((f) => f.node.date && f.node.date >= "2026-10-02").sort((a, b) => a.node.date!.localeCompare(b.node.date!)).slice(0, 4);
  const blocked = all.filter((f) => f.node.status === "blocked");

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-8 sm:px-12">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="flex flex-wrap items-end gap-x-14 gap-y-6">
          <div>
            <p className="font-display text-6xl font-semibold tracking-tight">{pct}<span className="text-3xl text-muted-foreground">%</span></p>
            <p className="mt-1 text-sm text-muted-foreground">complete across {withStatus.length} tracked items</p>
          </div>
          {(["active", "blocked", "todo"] as NodeStatus[]).map((s) => (
            <div key={s}>
              <p className="font-display text-3xl font-semibold" style={{ color: statusColor[s] }}>{count(s)}</p>
              <p className="text-sm text-muted-foreground">{statusLabel[s]}</p>
            </div>
          ))}
        </div>

        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {(["done", "active", "blocked"] as NodeStatus[]).map((s) => (
            <span key={s} style={{ width: `${(count(s) / Math.max(1, withStatus.length)) * 100}%`, background: statusColor[s] }} />
          ))}
        </div>

        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <section>
            <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Branches</h3>
            <div className="space-y-5">
              {root.children.map((b, i) => {
                const items = flatten(b).filter((f) => f.node.status);
                const d = items.filter((f) => f.node.status === "done").length;
                const p = items.length ? (d / items.length) * 100 : 0;
                const Icon = iconFor(b.icon);
                return (
                  <button key={b.id} onClick={() => onSelect(b.id)} className="block w-full text-left">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="size-4" style={{ color: branchColor(i) }} />
                      <span className="font-display font-semibold">{b.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{d}/{items.length}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: branchColor(i) }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="space-y-10">
            <div>
              <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Coming up</h3>
              <ul className="space-y-3">
                {upcoming.map((f) => (
                  <li key={f.node.id} className="flex items-baseline gap-3 text-sm">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">{formatDate(f.node.date!)}</span>
                    <span className="font-medium">{f.node.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            {blocked.length > 0 && (
              <div>
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-destructive">Needs attention</h3>
                <ul className="space-y-2 text-sm">{blocked.map((f) => <li key={f.node.id}>{f.node.label} <span className="text-muted-foreground">· {f.parent?.label}</span></li>)}</ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
