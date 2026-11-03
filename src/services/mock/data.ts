import type { AssistantResponse, GraphContent, TimelineContent } from "@/types/assistant";
import type {
  Automation,
  Conversation,
  FileItem,
  Project,
  ProjectDashboard,
  ProjectDocument,
  Visual,
} from "@/types/domain";

export const projects: Project[] = [
  { id: "maintenance", name: "Maintenance", description: "Equipment upkeep, schedules and incident logs.", color: "chart-1", updatedAt: "2026-10-01T16:20:00Z" },
  { id: "reumed", name: "REUMED", description: "Medical platform research, roadmap and ops.", color: "chart-2", updatedAt: "2026-10-02T09:10:00Z" },
  { id: "cv", name: "CV", description: "Résumé versions, applications and portfolio.", color: "chart-3", updatedAt: "2026-09-28T12:00:00Z" },
  { id: "personal", name: "Personal", description: "Notes, travel, finances and reading list.", color: "chart-4", updatedAt: "2026-09-30T19:45:00Z" },
];

export const reumedMindmap: GraphContent = {
  nodes: [
    { id: "root", label: "REUMED Platform", kind: "root", x: 0, y: 0 },
    { id: "b1", label: "Patients", kind: "branch", x: -320, y: -160 },
    { id: "b2", label: "Clinicians", kind: "branch", x: 320, y: -160 },
    { id: "b3", label: "Data & AI", kind: "branch", x: -320, y: 170 },
    { id: "b4", label: "Compliance", kind: "branch", x: 320, y: 170 },
    { id: "l1", label: "Symptom diary", kind: "leaf", x: -560, y: -250 },
    { id: "l2", label: "Appointment booking", kind: "leaf", x: -560, y: -110 },
    { id: "l3", label: "Case dashboard", kind: "leaf", x: 560, y: -250 },
    { id: "l4", label: "Referral flow", kind: "leaf", x: 560, y: -110 },
    { id: "l5", label: "Triage agent", kind: "leaf", x: -560, y: 120 },
    { id: "l6", label: "Report summaries", kind: "leaf", x: -560, y: 250 },
    { id: "l7", label: "GDPR / LFPDPPP", kind: "leaf", x: 560, y: 120 },
    { id: "l8", label: "Audit trail", kind: "leaf", x: 560, y: 250 },
  ],
  edges: [
    ["root", "b1"], ["root", "b2"], ["root", "b3"], ["root", "b4"],
    ["b1", "l1"], ["b1", "l2"], ["b2", "l3"], ["b2", "l4"],
    ["b3", "l5"], ["b3", "l6"], ["b4", "l7"], ["b4", "l8"],
  ].map(([s, t]) => ({ id: `${s}-${t}`, source: s!, target: t! })),
  mermaid: `mindmap
  root((REUMED Platform))
    Patients
      Symptom diary
      Appointment booking
    Clinicians
      Case dashboard
      Referral flow
    Data & AI
      Triage agent
      Report summaries
    Compliance
      GDPR / LFPDPPP
      Audit trail`,
};

export const maintenanceFlow: GraphContent = {
  nodes: [
    { id: "s", label: "Incident reported", kind: "start", x: 0, y: 0 },
    { id: "p1", label: "Classify severity", kind: "process", x: 0, y: 110 },
    { id: "d1", label: "Critical?", kind: "decision", x: 0, y: 220 },
    { id: "p2", label: "Page on-call tech", kind: "process", x: -220, y: 340 },
    { id: "p3", label: "Schedule work order", kind: "process", x: 220, y: 340 },
    { id: "p4", label: "Repair & verify", kind: "process", x: 0, y: 460 },
    { id: "d2", label: "Resolved?", kind: "decision", x: 0, y: 570 },
    { id: "e", label: "Close & log", kind: "end", x: 0, y: 690 },
  ],
  edges: [
    { id: "e1", source: "s", target: "p1" },
    { id: "e2", source: "p1", target: "d1" },
    { id: "e3", source: "d1", target: "p2", label: "Yes" },
    { id: "e4", source: "d1", target: "p3", label: "No" },
    { id: "e5", source: "p2", target: "p4" },
    { id: "e6", source: "p3", target: "p4" },
    { id: "e7", source: "p4", target: "d2" },
    { id: "e8", source: "d2", target: "e", label: "Yes" },
    { id: "e9", source: "d2", target: "p1", label: "No" },
  ],
  mermaid: `flowchart TD
  A([Incident reported]) --> B[Classify severity]
  B --> C{Critical?}
  C -- Yes --> D[Page on-call tech]
  C -- No --> E[Schedule work order]
  D --> F[Repair & verify]
  E --> F
  F --> G{Resolved?}
  G -- Yes --> H([Close & log])
  G -- No --> B`,
};

export const cvTimeline: TimelineContent = {
  events: [
    { id: "t1", date: "Sep 2026", title: "Refresh CV structure", description: "Rewrite summary and highlight AI projects.", status: "done" },
    { id: "t2", date: "Oct 2026", title: "Portfolio site", description: "Publish case studies for REUMED and automation work.", status: "active" },
    { id: "t3", date: "Nov 2026", title: "Targeted applications", description: "10 tailored applications with cover letters.", status: "upcoming" },
    { id: "t4", date: "Dec 2026", title: "Interview prep", description: "Mock interviews and system design practice.", status: "upcoming" },
  ],
};

export const visuals: Visual[] = [
  { id: "v1", title: "REUMED product map", projectId: "reumed", kind: "mindmap", updatedAt: "2026-10-02T09:10:00Z", content: reumedMindmap },
  { id: "v2", title: "Incident handling flow", projectId: "maintenance", kind: "flowchart", updatedAt: "2026-10-01T16:20:00Z", content: maintenanceFlow },
  { id: "v3", title: "Job search plan", projectId: "cv", kind: "timeline", updatedAt: "2026-09-28T12:00:00Z", content: cvTimeline },
];

export const documents: ProjectDocument[] = [
  { id: "d1", title: "Preventive maintenance SOP", projectId: "maintenance", updatedAt: "2026-09-25T10:00:00Z" },
  { id: "d2", title: "REUMED architecture notes", projectId: "reumed", updatedAt: "2026-10-01T08:00:00Z" },
  { id: "d3", title: "Investor one-pager", projectId: "reumed", updatedAt: "2026-09-20T14:00:00Z" },
  { id: "d4", title: "Cover letter template", projectId: "cv", updatedAt: "2026-09-27T09:00:00Z" },
  { id: "d5", title: "2027 goals", projectId: "personal", updatedAt: "2026-09-30T19:00:00Z" },
];

export const dashboards: ProjectDashboard[] = [
  { id: "db1", title: "Asset health", projectId: "maintenance" },
  { id: "db2", title: "Pilot metrics", projectId: "reumed" },
  { id: "db3", title: "Monthly budget", projectId: "personal" },
];

export const files: FileItem[] = [
  { id: "f1", name: "compressor-manual.pdf", type: "pdf", projectId: "maintenance", size: 4_200_000, modifiedAt: "2026-09-29T11:00:00Z" },
  { id: "f2", name: "work-orders-q3.xlsx", type: "sheet", projectId: "maintenance", size: 380_000, modifiedAt: "2026-10-01T15:30:00Z" },
  { id: "f3", name: "reumed-schema.sql", type: "code", projectId: "reumed", size: 22_000, modifiedAt: "2026-10-02T08:40:00Z" },
  { id: "f4", name: "pilot-consent-form.docx", type: "doc", projectId: "reumed", size: 96_000, modifiedAt: "2026-09-26T13:15:00Z" },
  { id: "f5", name: "ui-mockups.zip", type: "archive", projectId: "reumed", size: 18_400_000, modifiedAt: "2026-09-22T17:00:00Z" },
  { id: "f6", name: "cv-2026-en.pdf", type: "pdf", projectId: "cv", size: 210_000, modifiedAt: "2026-09-28T12:00:00Z" },
  { id: "f7", name: "headshot.jpg", type: "image", projectId: "cv", size: 1_100_000, modifiedAt: "2026-09-10T10:00:00Z" },
  { id: "f8", name: "travel-itinerary.docx", type: "doc", projectId: "personal", size: 54_000, modifiedAt: "2026-09-30T19:45:00Z" },
];

export const automations: Automation[] = [
  { id: "a1", name: "Daily briefing", description: "Summarises email, calendar and news every morning.", status: "healthy", enabled: true, lastRun: "2026-10-02T12:00:00Z", nextRun: "2026-10-03T12:00:00Z", projectId: "personal", pipeline: [{ kind: "trigger", label: "Every day, 06:00" }, { kind: "agent", label: "Briefing Agent" }, { kind: "action", label: "Read email & calendar" }, { kind: "action", label: "Send morning brief" }] },
  { id: "a2", name: "Work-order digest", description: "Collects open work orders and sends a weekly report.", status: "running", enabled: true, lastRun: "2026-10-02T19:00:00Z", nextRun: "2026-10-09T14:00:00Z", projectId: "maintenance", pipeline: [{ kind: "trigger", label: "Every Friday" }, { kind: "agent", label: "Ops Agent" }, { kind: "action", label: "Collect open work orders" }, { kind: "action", label: "Email weekly report" }] },
  { id: "a3", name: "Literature watcher", description: "Scans new rheumatology papers and files summaries.", status: "failed", enabled: true, lastRun: "2026-10-02T06:00:00Z", nextRun: "2026-10-03T06:00:00Z", projectId: "reumed", pipeline: [{ kind: "trigger", label: "New paper published" }, { kind: "agent", label: "Research Agent" }, { kind: "action", label: "Summarise findings" }, { kind: "action", label: "File in REUMED" }] },
  { id: "a4", name: "Job board scraper", description: "Matches new postings against your CV profile.", status: "paused", enabled: false, lastRun: "2026-09-25T09:00:00Z", nextRun: null, projectId: "cv", pipeline: [{ kind: "trigger", label: "New CV uploaded" }, { kind: "agent", label: "CV Agent" }, { kind: "action", label: "Analyze profile" }, { kind: "action", label: "Update Master CV" }] },
  { id: "a5", name: "VPS backup", description: "Snapshots the file store and verifies integrity.", status: "healthy", enabled: true, lastRun: "2026-10-02T03:00:00Z", nextRun: "2026-10-03T03:00:00Z", pipeline: [{ kind: "trigger", label: "Nightly, 03:00" }, { kind: "agent", label: "System Agent" }, { kind: "action", label: "Snapshot file store" }, { kind: "action", label: "Verify integrity" }] },
];

const welcome: AssistantResponse = {
  type: "text",
  content: {
    markdown: `Here's a quick plan for the **REUMED pilot** this week:

1. Finalise the consent form with the clinical lead
2. Load the anonymised dataset into the staging DB
3. Run the triage agent against 50 historical cases

\`\`\`ts
// staging check
const ready = await services.projects.get("reumed");
console.log(ready?.name);
\`\`\`

> Tip: ask me for a *mindmap*, *flowchart*, *timeline*, *table*, *chart*, *document* or *dashboard*.`,
  },
};

export const seedConversations = (): Conversation[] => [
  {
    id: "c1",
    title: "REUMED pilot planning",
    projectId: "reumed",
    updatedAt: "2026-10-02T09:10:00Z",
    messages: [
      { id: "m1", role: "user", createdAt: "2026-10-02T09:08:00Z", text: "What should I focus on for the REUMED pilot this week?" },
      { id: "m2", role: "assistant", createdAt: "2026-10-02T09:09:00Z", responses: [welcome] },
      { id: "m3", role: "user", createdAt: "2026-10-02T09:09:30Z", text: "Show me the product as a mindmap." },
      { id: "m4", role: "assistant", createdAt: "2026-10-02T09:10:00Z", responses: [{ type: "mindmap", title: "REUMED product map", content: reumedMindmap }] },
    ],
  },
  {
    id: "c2",
    title: "Compressor incident process",
    projectId: "maintenance",
    updatedAt: "2026-10-01T16:20:00Z",
    messages: [
      { id: "m5", role: "user", createdAt: "2026-10-01T16:18:00Z", text: "Draw the incident handling flowchart.", attachments: [{ id: "at1", name: "compressor-manual.pdf", size: 4_200_000, mimeType: "application/pdf" }] },
      { id: "m6", role: "assistant", createdAt: "2026-10-01T16:20:00Z", responses: [{ type: "flowchart", title: "Incident handling", content: maintenanceFlow }] },
    ],
  },
  {
    id: "c3",
    title: "Monthly budget review",
    projectId: "personal",
    updatedAt: "2026-09-30T19:45:00Z",
    messages: [
      { id: "m7", role: "user", createdAt: "2026-09-30T19:44:00Z", text: "Give me a dashboard of my spending." },
      { id: "m8", role: "assistant", createdAt: "2026-09-30T19:45:00Z", responses: [mockResponseFor("dashboard")] },
    ],
  },
];

export function mockResponseFor(kind: string): AssistantResponse {
  switch (kind) {
    case "mindmap":
      return { type: "mindmap", title: "REUMED product map", content: reumedMindmap };
    case "flowchart":
      return { type: "flowchart", title: "Incident handling", content: maintenanceFlow };
    case "timeline":
      return { type: "timeline", title: "Job search plan", content: cvTimeline };
    case "table":
      return {
        type: "table",
        title: "Open work orders",
        content: {
          columns: ["ID", "Asset", "Priority", "Owner", "Due"],
          rows: [
            ["WO-1042", "Compressor A", "High", "Luis", "Oct 3"],
            ["WO-1043", "Chiller 2", "Medium", "Ana", "Oct 6"],
            ["WO-1047", "Generator", "Low", "Marco", "Oct 12"],
            ["WO-1051", "Boiler", "High", "Luis", "Oct 4"],
          ],
        },
      };
    case "chart":
      return {
        type: "chart",
        title: "Pilot enrolments",
        content: {
          kind: "area",
          xKey: "week",
          series: [
            { key: "enrolled", label: "Enrolled" },
            { key: "active", label: "Active" },
          ],
          data: [
            { week: "W1", enrolled: 12, active: 9 },
            { week: "W2", enrolled: 21, active: 16 },
            { week: "W3", enrolled: 30, active: 24 },
            { week: "W4", enrolled: 41, active: 33 },
            { week: "W5", enrolled: 48, active: 41 },
          ],
        },
      };
    case "document":
      return {
        type: "document",
        title: "Preventive maintenance SOP",
        content: {
          summary: "Standard procedure for monthly inspection of rotating equipment.",
          sections: [
            { heading: "Scope", body: "Applies to compressors, pumps and chillers in Building A." },
            { heading: "Procedure", body: "1. Lock-out / tag-out.\n2. Inspect belts and bearings.\n3. Record vibration readings.\n4. Restore and verify." },
            { heading: "Records", body: "Upload readings to the **work-orders** sheet within 24h." },
          ],
        },
      };
    case "dashboard":
      return {
        type: "dashboard",
        title: "September spending",
        content: {
          metrics: [
            { label: "Total spent", value: "$2,840", delta: "-6%", trend: "down" },
            { label: "Savings rate", value: "22%", delta: "+3pt", trend: "up" },
            { label: "Subscriptions", value: "$118", delta: "0%", trend: "flat" },
          ],
          widgets: [
            {
              type: "chart",
              title: "By category",
              content: {
                kind: "bar",
                xKey: "cat",
                series: [{ key: "amount", label: "Amount" }],
                data: [
                  { cat: "Home", amount: 1100 },
                  { cat: "Food", amount: 620 },
                  { cat: "Travel", amount: 480 },
                  { cat: "Health", amount: 310 },
                  { cat: "Other", amount: 330 },
                ],
              },
            },
          ],
        },
      };
    default:
      return {
        type: "text",
        content: {
          markdown:
            "Got it. This is a **mock reply** — once your VPS is connected, your workflow will route this message to the right model and return structured content here.",
        },
      };
  }
}
