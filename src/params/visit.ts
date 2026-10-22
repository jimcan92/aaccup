import type { ParamMatcher } from '@sveltejs/kit';

/** Visit slugs start with the survey year, e.g. "2026-level-iii". Section slugs never do. */
export const match: ParamMatcher = (param) => /^\d{4}(-[a-z0-9]+)*$/.test(param);
