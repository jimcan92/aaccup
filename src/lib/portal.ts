import { env } from '$env/dynamic/public';
import { site } from '$lib/data/site';

/** The CTU Moalboal campus portal, which links to this site. */
export function portalUrl(): string {
	return env.PUBLIC_PORTAL_URL || site.portalUrl;
}
