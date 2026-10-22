/** Program landing page blocks (stored in public.program_blocks). */

export type GalleryItem = { src: string; alt: string; caption?: string };
export type StatItem = { value: string; label: string };
/** A dated milestone; body is plain paragraphs. */
export type TimelineItem = { year: string; title: string; body?: string };
/** How a photo gallery is shown: a grid of photos, or a slider one photo at a time. */
export type GalleryLayout = 'grid' | 'carousel';
/** A faculty or staff member; photo is an uploaded image or Drive link. */
export type PersonItem = { name: string; role: string; credentials?: string; photo?: string };
export type PartnerItem = { name: string; logo?: string; href?: string };
export type TestimonialItem = { quote: string; name: string; role?: string; photo?: string };
export type FaqItem = { question: string; answer: string };
export type LinkButton = { label: string; href: string };
/** An announcement; date is YYYY-MM-DD. */
export type NewsItem = { date: string; title: string; body?: string; href?: string };
/** A box on the organization chart; level 1 is the top row. */
export type OrgItem = { name: string; role: string; unit?: string; photo?: string; level: 1 | 2 | 3 };
/** A campus event; date and end are YYYY-MM-DD, time is free text ("8:00 AM – 5:00 PM"). */
export type EventItem = { date: string; end?: string; time?: string; title: string; place?: string; body?: string; href?: string };

export type PeopleContent = { title?: string; items: PersonItem[] };
export type VmgoContent = { title?: string; vision?: string; mission?: string; goals: string[]; objectives: string[] };
/** A photo beside a heading and text; side is where the photo sits on wide screens. */
export type MediaContent = { title?: string; body?: string; src?: string; alt?: string; side?: 'left' | 'right'; button?: LinkButton };
export type PartnersContent = { title?: string; items: PartnerItem[] };
export type TestimonialsContent = { title?: string; items: TestimonialItem[] };
export type FaqContent = { title?: string; items: FaqItem[] };
export type VideoContent = { title?: string; url?: string; caption?: string };
export type CtaContent = { title?: string; body?: string; buttons: LinkButton[] };
export type NewsContent = { title?: string; items: NewsItem[] };
export type OrgContent = { title?: string; items: OrgItem[] };
export type EventsContent = { title?: string; items: EventItem[] };

export type LandingBlock =
	| { id: string; kind: 'gallery'; content: { title?: string; items: GalleryItem[]; layout?: GalleryLayout } }
	| { id: string; kind: 'stats'; content: { title?: string; items: StatItem[] } }
	| { id: string; kind: 'text'; content: { title?: string; body?: string } }
	| { id: string; kind: 'timeline'; content: { title?: string; items: TimelineItem[] } }
	| { id: string; kind: 'people'; content: PeopleContent }
	| { id: string; kind: 'vmgo'; content: VmgoContent }
	| { id: string; kind: 'media'; content: MediaContent }
	| { id: string; kind: 'partners'; content: PartnersContent }
	| { id: string; kind: 'testimonials'; content: TestimonialsContent }
	| { id: string; kind: 'faq'; content: FaqContent }
	| { id: string; kind: 'video'; content: VideoContent }
	| { id: string; kind: 'cta'; content: CtaContent }
	| { id: string; kind: 'news'; content: NewsContent }
	| { id: string; kind: 'org'; content: OrgContent }
	| { id: string; kind: 'events'; content: EventsContent };

export type BlockKind = LandingBlock['kind'];

/** Label for a block in the admin; a gallery shown as a slider is a "Photo carousel". */
export function blockLabel(kind: BlockKind, layout?: string): string {
	return kind === 'gallery' && layout === 'carousel' ? 'Photo carousel' : blockLabels[kind];
}

export const blockLabels: Record<BlockKind, string> = {
	gallery: 'Photo gallery',
	stats: 'Highlights',
	text: 'Text section',
	timeline: 'Timeline',
	people: 'Faculty & staff',
	vmgo: 'Vision & mission',
	media: 'Photo & text',
	partners: 'Partners & linkages',
	testimonials: 'Testimonials',
	faq: 'FAQ',
	video: 'Video',
	cta: 'Call to action',
	news: 'Announcements',
	org: 'Organization',
	events: 'Campus events'
};

/** Whether a published block has anything to show; empty blocks are skipped on the public page. */
export function hasContent(block: LandingBlock): boolean {
	const content = block.content as Record<string, unknown>;
	switch (block.kind) {
		case 'text':
			return Boolean(block.content.title || block.content.body);
		case 'vmgo':
			return Boolean(block.content.vision || block.content.mission || block.content.goals?.length || block.content.objectives?.length);
		case 'media':
			return Boolean(block.content.title || block.content.body || block.content.src);
		case 'video':
			return Boolean(videoEmbed(block.content.url));
		case 'cta':
			return Boolean(block.content.title || block.content.buttons?.length);
		default:
			return Array.isArray(content.items) && content.items.length > 0;
	}
}

/**
 * Embeddable player URL for a YouTube or Google Drive video link; null for anything else.
 * YouTube plays from the no-cookie domain; Drive files must be shared as "Anyone with the link".
 */
export function videoEmbed(link: string | undefined): string | null {
	if (!link) return null;
	try {
		const url = new URL(link);
		const host = url.hostname.replace(/^(www|m)\./, '');
		let id: string | null | undefined = null;
		if (host === 'youtu.be') id = url.pathname.slice(1);
		else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
			id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
		}
		if (id && /^[\w-]{6,}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;

		if (host === 'drive.google.com') {
			const file = url.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? url.searchParams.get('id');
			if (file) return `https://drive.google.com/file/d/${file}/preview`;
		}
		return null;
	} catch {
		return null;
	}
}

/** "2026-10-22" as "Oct 22, 2026"; anything else is shown as typed. */
export function formatDate(value: string): string {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return value;
	const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Starting content for a new block. The newer kinds come filled with placeholder text so staff
 * see the layout and only replace the words; placeholders say what belongs there.
 */
export const sampleContent: Record<BlockKind, object> = {
	gallery: { title: '', items: [] },
	stats: { title: 'Highlights', items: [] },
	text: { title: '', body: '' },
	timeline: { title: 'Our history', items: [] },
	people: {
		title: 'Faculty & staff',
		items: [
			{ name: 'Dr. Firstname Lastname', role: 'Dean', credentials: 'PhD in Fisheries' },
			{ name: 'Firstname Lastname', role: 'Program Chair', credentials: 'MS in Fisheries' },
			{ name: 'Firstname Lastname', role: 'Faculty', credentials: 'MS in Aquaculture' },
			{ name: 'Firstname Lastname', role: 'Faculty', credentials: 'BS in Fisheries' }
		]
	},
	vmgo: {
		title: 'Vision, mission, goals and objectives',
		vision: 'Replace with the university vision, as written in the approved VMGO.',
		mission: 'Replace with the university mission, as written in the approved VMGO.',
		goals: ['Replace with the first campus or college goal.', 'Replace with the second goal.', 'Replace with the third goal.'],
		objectives: ['Replace with the first program educational objective.', 'Replace with the second objective.', 'Replace with the third objective.']
	},
	media: {
		title: 'Learning by doing',
		body: 'Replace with two or three sentences about a facility, laboratory or activity, and choose a photo that shows it.',
		src: '',
		alt: '',
		side: 'left',
		button: { label: '', href: '' }
	},
	partners: {
		title: 'Partners & linkages',
		items: [{ name: 'Partner agency' }, { name: 'Local government unit' }, { name: 'Industry partner' }, { name: 'Partner university' }]
	},
	testimonials: {
		title: 'What our graduates say',
		items: [
			{ quote: 'Replace with a short quote from an alumnus about the program.', name: 'Alumni name', role: 'BS graduate, batch 2020 · Current position' },
			{ quote: 'Replace with a short quote from an industry partner or employer.', name: 'Partner name', role: 'Position, Company' }
		]
	},
	faq: {
		title: 'Frequently asked questions',
		items: [
			{ question: 'What are the admission requirements?', answer: 'Replace with the requirements for new students.' },
			{ question: 'How long is the program?', answer: 'Replace with the length of the program and any internship or OJT.' },
			{ question: 'Where do graduates work?', answer: 'Replace with the usual careers and employers of graduates.' }
		]
	},
	video: { title: 'Program video', url: '', caption: 'Paste a YouTube or Google Drive video link.' },
	cta: {
		title: 'Want to know more about the program?',
		body: 'Replace with one line inviting visitors to take the next step.',
		buttons: [
			{ label: 'Open the documents', href: '' },
			{ label: 'Visit our Facebook page', href: '' }
		]
	},
	org: {
		title: 'Organization',
		items: [
			{ name: 'Dr. Firstname Lastname', role: 'Campus Director', level: 1 },
			{ name: 'Firstname Lastname', role: 'Director of Instruction', level: 2 },
			{ name: 'Firstname Lastname', role: 'Director of Research', level: 2 },
			{ name: 'Firstname Lastname', role: 'Director of Extension', level: 2 },
			{ name: 'Firstname Lastname', role: 'Administrative Officer', level: 2 },
			{ name: 'Firstname Lastname', role: 'AACCUP Focal Person', level: 3 },
			{ name: 'Firstname Lastname', role: 'Registrar', level: 3 },
			{ name: 'Firstname Lastname', role: 'Guidance Counselor', level: 3 }
		]
	},
	events: {
		title: 'Campus events',
		items: [
			{ date: '2026-12-01', time: '8:00 AM', title: 'Replace with an upcoming event', place: 'Campus gym', body: 'Replace with one or two sentences.' },
			{ date: '2026-11-15', end: '2026-11-16', title: 'Replace with a two-day event', place: 'AVR', body: 'Replace with one or two sentences.' }
		]
	},
	news: {
		title: 'Announcements',
		items: [
			{ date: '2026-01-15', title: 'Replace with an announcement title', body: 'Replace with one or two sentences.' },
			{ date: '2026-01-08', title: 'Replace with an older announcement', body: 'Replace with one or two sentences.' }
		]
	}
};
