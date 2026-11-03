import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { services } from "@/services";
import { Workspace } from "@/components/workspace/Workspace";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/canvas")({
  validateSearch: z.object({ project: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "AI Canvas — Atlas" },
      { name: "description", content: "A full-screen visual workspace you shape together with your AI assistant." },
      { property: "og:title", content: "AI Canvas — Atlas" },
      { property: "og:description", content: "A full-screen visual workspace you shape together with your AI assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CanvasPage,
});

function CanvasPage() {
  const { project = "maintenance" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => services.projects.list() });
  return (
    <Workspace
      projectId={project}
      header={
        <Select value={project} onValueChange={(v) => navigate({ search: { project: v } })}>
          <SelectTrigger className="h-9 w-auto gap-2 border-none bg-transparent font-display font-semibold shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      }
    />
  );
}
