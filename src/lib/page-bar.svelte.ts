import type { Component } from 'svelte';

/** A button in a program's sticky bar, beside the tabs. */
export type BarAction = {
	id: string;
	label: string;
	icon?: Component;
	/** A link; `external` opens it in a new tab, past the CDN cache. */
	href?: string;
	external?: boolean;
	onclick?: () => void;
	/** The page's main action: filled, and the last to move into More. */
	primary?: boolean;
	/** A toggle that is on (the open preview). */
	pressed?: boolean;
};

/**
 * The buttons a program page puts in the sticky bar drawn by the program layout.
 * A page sets them from an effect and clears them when it leaves.
 */
export const pageBar = $state<{ actions: BarAction[] }>({ actions: [] });
