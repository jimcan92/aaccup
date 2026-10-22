/** Program landing page blocks (stored in public.program_blocks). */

export type GalleryItem = { src: string; alt: string; caption?: string };
export type StatItem = { value: string; label: string };

export type LandingBlock =
	| { id: string; kind: 'gallery'; content: { title?: string; items: GalleryItem[] } }
	| { id: string; kind: 'stats'; content: { title?: string; items: StatItem[] } }
	| { id: string; kind: 'text'; content: { title?: string; body?: string } };

export const blockLabels: Record<LandingBlock['kind'], string> = {
	gallery: 'Photo gallery',
	stats: 'Highlights',
	text: 'Text section'
};
