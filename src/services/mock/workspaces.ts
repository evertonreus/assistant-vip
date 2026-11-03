import type { NodeCategory, NodeStatus, Workspace, WorkspaceNode } from "@/types/workspace";

type Spec = [label: string, opts?: { icon?: string; category?: NodeCategory; status?: NodeStatus; date?: string; owner?: string; collapsed?: boolean }, children?: Spec[]];

let i = 0;
function build([label, opts = {}, children = []]: Spec): WorkspaceNode {
  return { id: `w${++i}`, label, ...opts, children: children.map(build) };
}

const ws = (projectId: string, title: string, spec: Spec): Workspace => ({ id: `ws-${projectId}`, projectId, title, root: build(spec) });

export const seedWorkspaces = (): Workspace[] => {
  i = 0;
  return [
    ws("maintenance", "Maintenance operations", ["Maintenance Program", { icon: "wrench", category: "core" }, [
      ["Operations", { icon: "factory", category: "ops", status: "active" }, [
        ["Shift scheduling", { icon: "calendar", status: "done", date: "2026-09-08", owner: "Ana" }],
        ["Equipment registry", { icon: "database", category: "data", status: "active", date: "2026-10-06", owner: "Luis" }],
        ["Preventive plans", { icon: "shield", status: "todo", date: "2026-10-20" }],
      ]],
      ["Approval", { icon: "check", category: "process", status: "active" }, [
        ["Supervisor sign-off", { icon: "user", category: "people", status: "done", date: "2026-09-15", owner: "Marta" }],
        ["Safety review", { icon: "shield", category: "risk", status: "blocked", date: "2026-10-09" }],
      ]],
      ["Inventory", { icon: "box", category: "data", status: "todo" }, [
        ["Spare parts", { icon: "box", status: "active", date: "2026-10-12" }],
        ["Suppliers", { icon: "users", category: "people", status: "todo", date: "2026-10-27" }],
        ["Reorder rules", { icon: "zap", status: "todo" }],
      ]],
      ["Incidents", { icon: "alert", category: "risk", status: "active" }, [
        ["Triage", { icon: "flag", status: "done", date: "2026-09-22" }],
        ["Root-cause analysis", { icon: "search", status: "active", date: "2026-10-14", owner: "Luis" }, [
          ["5-why template", { icon: "file" }],
          ["Failure codes", { icon: "database", category: "data" }],
        ]],
        ["Post-mortem", { icon: "file", status: "todo", date: "2026-11-03" }],
      ]],
      ["Team", { icon: "users", category: "people", collapsed: true }, [
        ["Technicians", { icon: "wrench" }],
        ["Contractors", { icon: "user" }],
        ["Training", { icon: "book", status: "todo", date: "2026-11-10" }],
      ]],
    ]]),
    ws("reumed", "REUMED platform", ["REUMED Platform", { icon: "heart", category: "core" }, [
      ["Patients", { icon: "users", category: "people", status: "active" }, [
        ["Symptom diary", { icon: "book", status: "done", date: "2026-08-30" }],
        ["Appointment booking", { icon: "calendar", status: "active", date: "2026-10-10" }],
      ]],
      ["Clinicians", { icon: "user", category: "people" }, [
        ["Case dashboard", { icon: "chart", status: "active", date: "2026-10-18" }],
        ["Referral flow", { icon: "flow", category: "process", status: "todo" }],
      ]],
      ["Data & AI", { icon: "sparkles", category: "data", status: "active" }, [
        ["Triage agent", { icon: "bot", status: "active", date: "2026-10-05", owner: "Everton" }],
        ["Report summaries", { icon: "file", status: "todo", date: "2026-11-01" }],
      ]],
      ["Compliance", { icon: "shield", category: "risk" }, [
        ["GDPR / LFPDPPP", { icon: "shield", status: "blocked", date: "2026-10-15" }],
        ["Audit trail", { icon: "search", status: "todo" }],
      ]],
      ["Finance", { icon: "wallet", category: "finance" }, [
        ["Pilot budget", { icon: "wallet", status: "done", date: "2026-09-01" }],
        ["Grant application", { icon: "file", status: "active", date: "2026-11-15" }],
      ]],
    ]]),
    ws("cv", "Career workspace", ["Career 2026", { icon: "briefcase", category: "core" }, [
      ["Master CV", { icon: "file", status: "active" }, [
        ["Experience", { icon: "briefcase", status: "done", date: "2026-09-05" }],
        ["Skills matrix", { icon: "chart", status: "active", date: "2026-10-08" }],
      ]],
      ["Applications", { icon: "send", category: "process", status: "active" }, [
        ["Health-tech lead", { icon: "flag", status: "active", date: "2026-10-11" }],
        ["AI product role", { icon: "sparkles", status: "todo", date: "2026-10-25" }],
      ]],
      ["Portfolio", { icon: "layout", category: "data" }, [
        ["REUMED case study", { icon: "heart", status: "todo", date: "2026-11-02" }],
      ]],
      ["Network", { icon: "users", category: "people" }, [["Referrals", { icon: "user", status: "todo" }]]],
    ]]),
    ws("personal", "Personal life", ["Personal", { icon: "home", category: "core" }, [
      ["Finances", { icon: "wallet", category: "finance" }, [["Budget review", { icon: "chart", status: "active", date: "2026-10-04" }], ["Taxes", { icon: "file", status: "todo", date: "2026-11-30" }]]],
      ["Travel", { icon: "plane", category: "ops" }, [["Oaxaca trip", { icon: "calendar", status: "todo", date: "2026-12-12" }]]],
      ["Reading", { icon: "book", category: "data" }, [["Thinking in Systems", { icon: "book", status: "active" }], ["The Design of Everyday Things", { icon: "book", status: "done" }]]],
      ["Health", { icon: "heart", category: "people" }, [["Running plan", { icon: "zap", status: "active", date: "2026-10-01" }]]],
    ]]),
  ];
};
