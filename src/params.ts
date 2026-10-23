import { defineParams } from '@sveltejs/kit/params';

/** Visit slugs start with the survey year, e.g. "2026-level-iii". Section slugs never do. */
const matchVisit = (param: string) => (/^\d{4}(-[a-z0-9]+)*$/).test(param);

export const params = defineParams({
	visit: (param) => (matchVisit(param) ? param : undefined)
});
