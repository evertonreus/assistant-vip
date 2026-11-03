import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { services } from "@/services";
import { Page, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Atlas" },
      { name: "description", content: "Group conversations, visuals, documents and files by project." },
      { property: "og:title", content: "Projects — Atlas" },
      { property: "og:description", content: "Group conversations, visuals, documents and files by project." },
    ],
  }),
  component: ProjectsPage,
});

const dot: Record<string, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
};

function ProjectsPage() {
  const { data = [] } = useQuery({ queryKey: ["projects"], queryFn: () => services.projects.list() });
  return (
    <Page>
      <PageHeader
        title="Projects"
        description="Everything related to an area of your life, in one place."
        actions={<Button onClick={() => toast("Project creation is coming soon")}><Plus className="size-4" /> New project</Button>}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((p) => (
          <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }} className="group rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-float">
            <div className="flex items-center justify-between">
              <span className={`size-2.5 rounded-full ${dot[p.color]}`} />
              <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">{p.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
            <p className="mt-4 text-xs text-muted-foreground">Updated {formatDate(p.updatedAt)}</p>
          </Link>
        ))}
      </div>
    </Page>
  );
}
