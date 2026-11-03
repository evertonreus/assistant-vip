import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Archive, Code2, FileSpreadsheet, FileText, Image, Search, Upload, File } from "lucide-react";
import { toast } from "sonner";
import { services } from "@/services";
import { Page, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatSize } from "@/lib/format";
import type { FileType } from "@/types/domain";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "Files — Atlas" },
      { name: "description", content: "Browse and search files stored on your private server." },
      { property: "og:title", content: "Files — Atlas" },
      { property: "og:description", content: "Browse and search files stored on your private server." },
    ],
  }),
  component: FilesPage,
});

const icons: Record<FileType, typeof File> = { pdf: FileText, doc: FileText, sheet: FileSpreadsheet, image: Image, code: Code2, archive: Archive };

function FilesPage() {
  const { data: files = [] } = useQuery({ queryKey: ["files"], queryFn: () => services.files.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => services.projects.list() });
  const [q, setQ] = useState("");
  const [project, setProject] = useState("all");
  const name = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  const filtered = useMemo(
    () => files.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()) && (project === "all" || f.projectId === project)),
    [files, q, project],
  );

  return (
    <Page>
      <PageHeader
        title="Files"
        description="Synced from your VPS file store (mock for now)."
        actions={<Button onClick={() => toast("Uploads will go to your VPS once connected")}><Upload className="size-4" /> Upload</Button>}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="h-10 pl-9" />
        </div>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="h-10 sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="hidden grid-cols-[1fr_100px_140px_120px_90px] gap-4 border-b bg-surface px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
          <span>Name</span><span>Type</span><span>Project</span><span>Modified</span><span className="text-right">Size</span>
        </div>
        {filtered.map((f) => {
          const Icon = icons[f.type];
          return (
            <div key={f.id} className="grid grid-cols-[auto_1fr] items-center gap-x-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/50 md:grid-cols-[1fr_100px_140px_120px_90px] md:gap-4">
              <div className="flex min-w-0 items-center gap-3 md:col-auto">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><Icon className="size-4" /></span>
                <span className="hidden truncate text-sm font-medium md:block">{f.name}</span>
              </div>
              <div className="min-w-0 md:hidden">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{name(f.projectId)} · {formatDate(f.modifiedAt)} · {formatSize(f.size)}</p>
              </div>
              <span className="hidden text-sm uppercase text-muted-foreground md:block">{f.type}</span>
              <span className="hidden text-sm md:block">{name(f.projectId)}</span>
              <span className="hidden text-sm text-muted-foreground md:block">{formatDate(f.modifiedAt)}</span>
              <span className="hidden text-right text-sm text-muted-foreground md:block">{formatSize(f.size)}</span>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No files match your search.</p>}
      </div>
    </Page>
  );
}
