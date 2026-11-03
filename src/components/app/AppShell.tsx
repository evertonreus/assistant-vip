import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, PanelLeftClose, PanelLeftOpen, Settings, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { navItems } from "./nav";

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <Sparkles className="size-4" />
      </span>
      {!compact && <span className="font-display text-[15px] font-semibold tracking-tight">Atlas</span>}
    </Link>
  );
}

function ThemeButton({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn("flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", className)}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const mobileItems = navItems.filter((n) => n.to !== "/settings");

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r bg-sidebar transition-[width] duration-300 md:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <div className={cn("flex h-14 items-center px-4", collapsed ? "justify-center" : "justify-between")}>
          <Logo compact={collapsed} />
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
              <PanelLeftClose className="size-4" />
            </button>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2.5 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              title={collapsed ? label : undefined}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-0",
              )}
              activeProps={{ className: "!bg-sidebar-accent !text-sidebar-foreground font-medium" }}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>
        <div className={cn("flex items-center gap-1 border-t p-2.5", collapsed ? "flex-col" : "justify-between")}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} aria-label="Expand sidebar" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
              <PanelLeftOpen className="size-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">ER</span>
              <span className="text-sm">Everton</span>
            </div>
          )}
          <ThemeButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
          <Logo />
          <div className="flex items-center">
            <ThemeButton />
            <Link to="/settings" aria-label="Settings" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent" activeProps={{ className: "!text-primary" }}>
              <Settings className="size-4" />
            </Link>
          </div>
        </header>

        <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="pb-safe grid shrink-0 grid-cols-5 border-t bg-background/95 pt-1.5 backdrop-blur md:hidden">
          {mobileItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-0.5 py-1 text-[11px] text-muted-foreground transition-colors"
              activeProps={{ className: "!text-primary font-medium" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="animate-rise mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">{children}</div>;
}
