import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { logout } from "@/lib/auth.functions";
import { LogOut, Moon, Server, Sun } from "lucide-react";
import { Page, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Atlas" },
      { name: "description", content: "Appearance, account and server connection settings." },
      { property: "og:title", content: "Settings — Atlas" },
      { property: "og:description", content: "Appearance, account and server connection settings." },
    ],
  }),
  component: SettingsPage,
});

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const doLogout = useServerFn(logout);
  const onLogout = async () => {
    await doLogout();
    await router.invalidate();
    await router.navigate({ to: "/login" });
  };
  return (
    <Page>
      <PageHeader title="Settings" />
      <div className="grid max-w-2xl gap-3">
        <Card title="Appearance" description="Choose how Atlas looks on this device.">
          <div className="grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={cn("flex items-center gap-2 rounded-xl border p-3 text-sm capitalize transition-colors", theme === t ? "border-primary bg-primary-soft" : "hover:bg-accent")}>
                {t === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />} {t}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Server connection" description="Your VPS and workflows will be connected here. Keys stay on the server, never in the app.">
          <div className="flex items-center gap-3 rounded-xl border bg-surface p-3">
            <Server className="size-4 text-muted-foreground" />
            <Input disabled placeholder="https://your-vps.example.com" className="h-9 border-none bg-transparent shadow-none" />
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">VPS</span>
          </div>
        </Card>
        <Card title="Cuenta" description="Sesión privada de Everton.">
          <Button variant="outline" onClick={() => void onLogout()}><LogOut className="size-4" /> Cerrar sesión</Button>
        </Card>
      </div>
    </Page>
  );
}
