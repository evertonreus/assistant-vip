import type { WorkspaceNode } from "@/types/workspace";

let seq = 0;
export const newNodeId = () => `n-${Date.now().toString(36)}-${++seq}`;

export interface FlatNode {
  node: WorkspaceNode;
  depth: number;
  parent?: WorkspaceNode | undefined;
  /** Index of the primary branch this node belongs to (-1 for root). */
  branch: number;
}

export function flatten(root: WorkspaceNode): FlatNode[] {
  const out: FlatNode[] = [];
  const visit = (n: WorkspaceNode, depth: number, branch: number, parent?: WorkspaceNode) => {
    out.push({ node: n, depth, parent, branch });
    n.children.forEach((c, i) => visit(c, depth + 1, depth === 0 ? i : branch, n));
  };
  visit(root, 0, -1);
  return out;
}

export const findNode = (root: WorkspaceNode, id: string) => flatten(root).find((f) => f.node.id === id);

const norm = (s: string) => s.toLowerCase().replace(/^the\s+/, "").replace(/\s+(branch|node)$/, "").trim();

export function findByLabel(root: WorkspaceNode, query: string) {
  const q = norm(query);
  const all = flatten(root);
  return all.find((f) => norm(f.node.label) === q) ?? all.find((f) => norm(f.node.label).includes(q)) ?? all.find((f) => q.includes(norm(f.node.label)));
}

export function mapTree(root: WorkspaceNode, fn: (n: WorkspaceNode) => WorkspaceNode): WorkspaceNode {
  const next = fn({ ...root });
  return { ...next, children: next.children.map((c) => mapTree(c, fn)) };
}

export const updateNode = (root: WorkspaceNode, id: string, patch: Partial<WorkspaceNode>) =>
  mapTree(root, (n) => (n.id === id ? { ...n, ...patch } : n));

export function removeNode(root: WorkspaceNode, id: string): { root: WorkspaceNode; removed?: WorkspaceNode | undefined } {
  let removed: WorkspaceNode | undefined;
  const next = mapTree(root, (n) => {
    const hit = n.children.find((c) => c.id === id);
    if (hit) removed = hit;
    return hit ? { ...n, children: n.children.filter((c) => c.id !== id) } : n;
  });
  return { root: next, removed };
}

export const addChild = (root: WorkspaceNode, parentId: string, child: WorkspaceNode) =>
  mapTree(root, (n) => (n.id === parentId ? { ...n, collapsed: false, children: [...n.children, child] } : n));

export function isDescendant(root: WorkspaceNode, ancestorId: string, id: string) {
  const a = findNode(root, ancestorId);
  return !!a && flatten(a.node).some((f) => f.node.id === id);
}

/** Collapses everything deeper than `depth`. */
export const collapseBelow = (root: WorkspaceNode, depth: number) => {
  const depths = new Map(flatten(root).map((f) => [f.node.id, f.depth]));
  return mapTree(root, (n) => ({ ...n, collapsed: (depths.get(n.id) ?? 0) >= depth && n.children.length > 0 }));
};
