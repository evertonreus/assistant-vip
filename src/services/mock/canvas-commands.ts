import type { CanvasCommandResult, WorkspaceNode, WorkspaceView } from "@/types/workspace";
import { addChild, findByLabel, isDescendant, mapTree, newNodeId, removeNode, updateNode } from "@/lib/workspace-tree";

const VIEW_WORDS: [RegExp, WorkspaceView, string][] = [
  [/flow ?chart|flow\b/, "flowchart", "flowchart"],
  [/timeline/, "timeline", "timeline"],
  [/table/, "table", "table"],
  [/dashboard/, "dashboard", "dashboard"],
  [/mind ?map/, "mindmap", "mind map"],
];

/** Mock interpreter for natural-language canvas edits. The real backend will return the same shape. */
export function runCanvasCommand(root: WorkspaceNode, raw: string): CanvasCommandResult {
  const text = raw.trim().replace(/[.!?]+$/, "");
  const t = text.toLowerCase();
  let m: RegExpMatchArray | null;

  if ((m = text.match(/^(?:add|create)\s+(.+?)\s+(?:under|to|in|into)\s+(.+)$/i))) {
    const parent = findByLabel(root, m[2]!);
    if (!parent) return { root, reply: `I couldn't find **${m[2]}** on the canvas.` };
    const child: WorkspaceNode = { id: newNodeId(), label: cap(m[1]!), status: "todo", icon: "sparkles", children: [] };
    return { root: addChild(root, parent.node.id, child), reply: `Added **${child.label}** under **${parent.node.label}**.`, focusId: child.id };
  }

  if ((m = text.match(/^move\s+(.+?)\s+(?:under|to|into)\s+(.+)$/i))) {
    const node = findByLabel(root, m[1]!);
    const target = findByLabel(root, m[2]!);
    if (!node || !target) return { root, reply: `I couldn't find ${!node ? `**${m[1]}**` : `**${m[2]}**`}.` };
    if (node.depth === 0 || isDescendant(root, node.node.id, target.node.id)) return { root, reply: "That move would create a loop, so I left the map as it is." };
    const { root: without, removed } = removeNode(root, node.node.id);
    return { root: addChild(without, target.node.id, removed!), reply: `Moved **${node.node.label}** under **${target.node.label}**.`, focusId: node.node.id, view: "mindmap" };
  }

  if ((m = text.match(/^(expand|open|collapse|close|fold)\s+(.+)$/i))) {
    const collapse = /collapse|close|fold/i.test(m[1]!);
    if (/^(all|everything)/i.test(m[2]!)) {
      return { root: mapTree(root, (n) => ({ ...n, collapsed: collapse && n !== root && n.children.length > 0 })), reply: collapse ? "Collapsed every branch." : "Expanded every branch." };
    }
    const node = findByLabel(root, m[2]!);
    if (!node) return { root, reply: `I couldn't find **${m[2]}**.` };
    return { root: updateNode(root, node.node.id, { collapsed: collapse }), reply: `${collapse ? "Collapsed" : "Expanded"} the **${node.node.label}** branch.`, focusId: node.node.id };
  }

  if ((m = text.match(/^rename\s+(.+?)\s+to\s+(.+)$/i))) {
    const node = findByLabel(root, m[1]!);
    if (!node) return { root, reply: `I couldn't find **${m[1]}**.` };
    return { root: updateNode(root, node.node.id, { label: cap(m[2]!) }), reply: `Renamed to **${cap(m[2]!)}**.`, focusId: node.node.id };
  }

  if ((m = text.match(/^mark\s+(.+?)\s+as\s+(done|active|blocked|todo|to do)$/i))) {
    const node = findByLabel(root, m[1]!);
    if (!node) return { root, reply: `I couldn't find **${m[1]}**.` };
    const status = m[2]!.toLowerCase().replace(" ", "") as "done";
    return { root: updateNode(root, node.node.id, { status }), reply: `Marked **${node.node.label}** as ${status}.`, focusId: node.node.id };
  }

  if ((m = text.match(/^(?:remove|delete)\s+(.+)$/i))) {
    const node = findByLabel(root, m[1]!);
    if (!node || node.depth === 0) return { root, reply: `I couldn't remove **${m[1]}**.` };
    return { root: removeNode(root, node.node.id).root, reply: `Removed **${node.node.label}** and its branch.` };
  }

  if (/convert|switch|show|turn|view|as a/.test(t)) {
    const hit = VIEW_WORDS.find(([re]) => re.test(t));
    if (hit) return { root, view: hit[1], reply: `Here's the same project as a **${hit[2]}**.` };
  }

  return {
    root,
    reply: "I can reshape what's on the canvas. Try *Add Finance under Approval*, *Move Inventory under Operations*, *Expand the Team branch*, *Mark Safety review as done* or *Show this project as a timeline*.",
  };
}

const cap = (s: string) => s.trim().replace(/^./, (c) => c.toUpperCase());
