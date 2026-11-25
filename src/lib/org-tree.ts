import type { OrgItem } from './landing.js';

/** A box of the organization chart placed in its reporting tree. */
export type OrgNode = { key: string; item: OrgItem; parent: string | null; children: string[]; depth: number };

export type OrgTree = { nodes: Map<string, OrgNode>; roots: string[] };

/** Whether the chart has reporting lines (and is shown as a tree rather than rows). */
export function hasReportingLines(items: OrgItem[]): boolean {
	return items.some((item) => item.parent);
}

/**
 * The reporting tree of the chart. A box without an id is keyed by its position; a box whose
 * parent is missing, or whose parent line loops back to itself, becomes a root.
 */
export function buildOrgTree(items: OrgItem[]): OrgTree {
	const keys = items.map((item, index) => item.id || `#${index}`);
	const known = new Set(keys);
	const parentOf = new Map(keys.map((key, index) => [key, items[index].parent && known.has(items[index].parent!) ? items[index].parent! : null]));

	// Break loops: walk up from each box; if the walk comes back to it, it becomes a root.
	for (const key of keys) {
		const seen = new Set([key]);
		let up = parentOf.get(key);
		while (up) {
			if (seen.has(up)) {
				parentOf.set(key, null);
				break;
			}
			seen.add(up);
			up = parentOf.get(up) ?? null;
		}
	}

	const nodes = new Map<string, OrgNode>();
	keys.forEach((key, index) => nodes.set(key, { key, item: items[index], parent: parentOf.get(key) ?? null, children: [], depth: 0 }));
	const roots: string[] = [];
	for (const key of keys) {
		const node = nodes.get(key)!;
		if (node.parent) nodes.get(node.parent)!.children.push(key);
		else roots.push(key);
	}

	const setDepth = (key: string, depth: number) => {
		const node = nodes.get(key)!;
		node.depth = depth;
		for (const child of node.children) setDepth(child, depth + 1);
	};
	for (const root of roots) setDepth(root, 0);

	return { nodes, roots };
}

/** The boxes from the top of the tree down to `key`. */
export function pathTo(tree: OrgTree, key: string): string[] {
	const path: string[] = [];
	let at: string | null = key;
	while (at) {
		path.unshift(at);
		at = tree.nodes.get(at)?.parent ?? null;
	}
	return path;
}

/** Where the chart opens: down from the first root while each box has a single box under it. */
export function startingFocus(tree: OrgTree): string | null {
	let at = tree.roots[0] ?? null;
	while (at) {
		const children = tree.nodes.get(at)!.children;
		if (children.length !== 1 || !tree.nodes.get(children[0])!.children.length) break;
		at = children[0];
	}
	return at;
}

/** Number of boxes under `key`, at every depth. */
export function countUnder(tree: OrgTree, key: string): number {
	const node = tree.nodes.get(key);
	if (!node) return 0;
	return node.children.reduce((sum, child) => sum + 1 + countUnder(tree, child), 0);
}

/**
 * Minimap layout: depth runs left to right, and leaves are stacked top to bottom;
 * a parent sits level with the middle of its children.
 */
export function layoutOrgTree(tree: OrgTree): { positions: Map<string, { x: number; y: number }>; columns: number; rows: number } {
	const positions = new Map<string, { x: number; y: number }>();
	let row = 0;
	let columns = 0;
	const place = (key: string): number => {
		const node = tree.nodes.get(key)!;
		columns = Math.max(columns, node.depth + 1);
		let y: number;
		if (node.children.length) {
			const ys = node.children.map(place);
			y = (ys[0] + ys[ys.length - 1]) / 2;
		} else {
			y = row++;
		}
		positions.set(key, { x: node.depth, y });
		return y;
	};
	for (const root of tree.roots) place(root);
	return { positions, columns, rows: Math.max(row, 1) };
}
