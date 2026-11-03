import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { ChartContent, DocumentContent, TableContent, TimelineContent } from "@/types/assistant";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

export function TimelineBlock({ content }: { content: TimelineContent }) {
  return (
    <ol className="relative space-y-5 border-l pl-6">
      {content.events.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={cn(
              "absolute -left-[33px] top-0.5 flex size-4 items-center justify-center rounded-full border-2 bg-background",
              e.status === "done" && "border-primary bg-primary text-primary-foreground",
              e.status === "active" && "border-primary",
              e.status === "upcoming" && "border-border",
            )}
          >
            {e.status === "done" && <Check className="size-2.5" />}
          </span>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{e.date}</p>
          <p className="font-medium">{e.title}</p>
          {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
        </li>
      ))}
    </ol>
  );
}

export function TableBlock({ content }: { content: TableContent }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{content.columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}</tr>
        </thead>
        <tbody>
          {content.rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((cell, j) => <td key={j} className="whitespace-nowrap px-3 py-2">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function ChartBlock({ content, height = 240 }: { content: ChartContent; height?: number }) {
  const axis = { stroke: "var(--muted-foreground)", fontSize: 12, tickLine: false, axisLine: false };
  const tooltip = <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "var(--muted)" }} />;
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        {content.kind === "bar" ? (
          <BarChart data={content.data}>
            {grid}<XAxis dataKey={content.xKey} {...axis} /><YAxis {...axis} width={36} />{tooltip}
            {content.series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={COLORS[i]} radius={[6, 6, 0, 0]} />)}
          </BarChart>
        ) : content.kind === "line" ? (
          <LineChart data={content.data}>
            {grid}<XAxis dataKey={content.xKey} {...axis} /><YAxis {...axis} width={36} />{tooltip}
            {content.series.map((s, i) => <Line key={s.key} dataKey={s.key} name={s.label} stroke={COLORS[i]} strokeWidth={2} dot={false} />)}
          </LineChart>
        ) : (
          <AreaChart data={content.data}>
            {grid}<XAxis dataKey={content.xKey} {...axis} /><YAxis {...axis} width={36} />{tooltip}
            {content.series.map((s, i) => <Area key={s.key} dataKey={s.key} name={s.label} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />)}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function DocumentBlock({ content }: { content: DocumentContent }) {
  return (
    <article className="space-y-4 rounded-xl border bg-surface p-4 sm:p-5">
      {content.summary && <p className="text-sm text-muted-foreground">{content.summary}</p>}
      {content.sections.map((s) => (
        <section key={s.heading}>
          <h4 className="mb-1 text-sm font-semibold">{s.heading}</h4>
          <Markdown>{s.body}</Markdown>
        </section>
      ))}
    </article>
  );
}

export function TrendIcon({ trend }: { trend?: "up" | "down" | "flat" | undefined }) {
  if (trend === "up") return <ArrowUpRight className="size-3.5 text-success" />;
  if (trend === "down") return <ArrowDownRight className="size-3.5 text-info" />;
  return <ArrowRight className="size-3.5 text-muted-foreground" />;
}
