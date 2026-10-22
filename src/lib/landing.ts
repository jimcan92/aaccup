/** Program landing page blocks (stored in public.program_blocks). */

export type GalleryItem = { src: string; alt: string; caption?: string };
export type StatItem = { value: string; label: string };
/** A dated milestone; body is plain paragraphs. */
export type TimelineItem = { year: string; title: string; body?: string };
/** How a photo gallery is shown: a grid of photos, or a slider one photo at a time. */
export type GalleryLayout = 'grid' | 'carousel';

export type LandingBlock =
	| { id: string; kind: 'gallery'; content: { title?: string; items: GalleryItem[]; layout?: GalleryLayout } }
	| { id: string; kind: 'stats'; content: { title?: string; items: StatItem[] } }
	| { id: string; kind: 'text'; content: { title?: string; body?: string } }
	| { id: string; kind: 'timeline'; content: { title?: string; items: TimelineItem[] } };

/** Label for a block in the admin; a gallery shown as a slider is a "Photo carousel". */
export function blockLabel(kind: LandingBlock['kind'], layout?: string): string {
	return kind === 'gallery' && layout === 'carousel' ? 'Photo carousel' : blockLabels[kind];
}

export const blockLabels: Record<LandingBlock['kind'], string> = {
	gallery: 'Photo gallery',
	stats: 'Highlights',
	text: 'Text section',
	timeline: 'Timeline'
};
