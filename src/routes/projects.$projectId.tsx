import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { services } from "@/services";
import { Workspace, WorkspaceBack } from "@/components/workspace/Workspace";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project workspace — Atlas" },
      { name: "description", content: "The visual canvas for this project: mind map, flowchart, timeline, table and dashboard." },
      { property: "og:title", content: "Project workspace — Atlas" },
      { property: "og:description", content: "The visual canvas for this project: mind map, flowchart, timeline, table and dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectWorkspace,
});

function ProjectWorkspace() {
  const { projectId } = Route.useParams();
  const { data: project } = useQuery({ queryKey: ["project", projectId], queryFn: () => services.projects.get(projectId) });
  return (
    <Workspace
      projectId={projectId}
      header={
        <>
          <WorkspaceBack />
          <span className="truncate font-display font-semibold">{project?.name ?? "Project"}</span>
        </>
      }
    />
  );
}
