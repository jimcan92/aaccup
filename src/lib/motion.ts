/**
 * Quiet motion for the public pages (styles in app.css).
 *  - reveal: fades an element up a few pixels the first time it scrolls into view.
 *  - photo: marks an <img> as loaded, so its frame can turn the placeholder icon into the photo.
 * Nothing is hidden without JavaScript, with reduced motion, or in a frame (the admin preview).
 */

/** inner: the element itself stays put and its section's content rises (whole blocks with backgrounds). */
type RevealOptions = { delay?: number; disabled?: boolean; inner?: boolean } | undefined;

let observer: IntersectionObserver | undefined;

function shared(): IntersectionObserver {
	observer ??= new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.setAttribute('data-shown', '');
				observer?.unobserve(entry.target);
			}
		},
		{ threshold: 0, rootMargin: '0px 0px -8% 0px' }
	);
	return observer;
}

function still(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.self !== window.top;
}

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	if (options?.disabled || still() || !('IntersectionObserver' in window)) return;

	node.setAttribute('data-reveal', options?.inner ? 'inner' : '');
	if (options?.delay) node.style.setProperty('--reveal-delay', `${Math.round(options.delay)}ms`);
	shared().observe(node);

	return {
		destroy() {
			observer?.unobserve(node);
		}
	};
}

/** Stagger for the nth item of a grid, capped so long lists do not wait. */
export function stagger(index: number, step = 60, cap = 6): number {
	return Math.min(index, cap) * step;
}

export function photo(node: HTMLImageElement) {
	const done = () => node.setAttribute('data-loaded', '');

	node.setAttribute('data-photo', '');
	// A cached image may have loaded before hydration.
	if (node.complete && node.naturalWidth > 0) {
		done();
		return;
	}

	node.addEventListener('load', done, { once: true });
	// A broken image still drops the placeholder rather than blurring forever.
	node.addEventListener('error', done, { once: true });

	return {
		destroy() {
			node.removeEventListener('load', done);
			node.removeEventListener('error', done);
		}
	};
}

/** Turns on section snapping for the page while it is shown (not in the admin preview). */
export function snapPage(enabled: boolean) {
	if (!enabled || window.self !== window.top) return;
	document.documentElement.classList.add('snap-page');
	return () => document.documentElement.classList.remove('snap-page');
}
