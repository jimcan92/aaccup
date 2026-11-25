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

/** A box placed on the compact chart, in grid cells; `stacked` boxes hang in a column under their office. */
export type ChartCell = { x: number; y: number; stacked: boolean };

/**
 * Compact upright layout of the whole chart, like the printed one: offices with people under
 * them spread side by side, while people with nobody under them hang in a single column under
 * their office. Keeps a 90-person chart narrow enough for half the page.
 */
export function layoutCompactChart(tree: OrgTree): { cells: Map<string, ChartCell>; columns: number; rows: number } {
	const cells = new Map<string, ChartCell>();
	let rows = 0;

	// Places `key` with its top at `row` and its left edge at `left`; returns the columns it spans.
	const place = (key: string, left: number, row: number): number => {
		const node = tree.nodes.get(key)!;
		const leaves = node.children.filter((child) => !tree.nodes.get(child)!.children.length);
		const branches = node.children.filter((child) => tree.nodes.get(child)!.children.length);
		rows = Math.max(rows, row + 1);

		let span = 0;
		if (leaves.length) {
			leaves.forEach((leaf, index) => {
				cells.set(leaf, { x: left, y: row + 1 + index, stacked: true });
				rows = Math.max(rows, row + 2 + index);
			});
			span = 1;
		}
		for (const branch of branches) span += place(branch, left + span, row + 1);
		span = Math.max(span, 1);

		cells.set(key, { x: left + (span - 1) / 2, y: row, stacked: false });
		return span;
	};

	let columns = 0;
	for (const root of tree.roots) columns += place(root, columns, 0);
	return { cells, columns: Math.max(columns, 1), rows: Math.max(rows, 1) };
}
