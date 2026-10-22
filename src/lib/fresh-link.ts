/**
 * Admin links to public pages skip the CDN cache, so staff see their changes right away.
 * The ?fresh=<time> mark is set when the link is used (not when the page renders), so
 * every click is a new cache key for the page and its __data.json.
 */
export function fresh(node: HTMLAnchorElement) {
	const stamp = () => {
		const url = new URL(node.href, location.href);
		url.searchParams.set('fresh', String(Date.now()));
		node.href = url.pathname + url.search + url.hash;
	};
	// pointerdown/keydown run before the browser reads href for middle-click, ctrl-click, and Enter.
	const events = ['pointerdown', 'keydown', 'click'] as const;
	for (const event of events) node.addEventListener(event, stamp, { capture: true });
	return {
		destroy() {
			for (const event of events) node.removeEventListener(event, stamp, { capture: true });
		}
	};
}
