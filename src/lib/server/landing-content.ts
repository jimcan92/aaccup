import { videoEmbed } from '$lib/landing';
import { isHttpUrl } from './admin';

/** Cleaners for the newer landing block kinds; each returns clean content or an error message. */
type Raw = Record<string, unknown>;

const str = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
const list = (value: unknown): Raw[] => (Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : []);

/** Links may point to another site (https://…) or to a page on this one (/bsfi/dossier). */
function isLink(value: string) {
	return isHttpUrl(value) || /^\/(?!\/)/.test(value);
}

/** Image fields hold an uploaded image or a Drive / image link; empty means none. */
function badImage(value: string) {
	return value !== '' && !isHttpUrl(value);
}

function button(raw: unknown) {
	const value = (raw ?? {}) as Raw;
	return { label: str(value.label, 60), href: str(value.href, 500) };
}

export const cleaners: Record<string, (value: Raw, title: string) => object | string> = {
	people(value, title) {
		const items = list(value.items)
			.map((item) => ({ name: str(item.name, 120), role: str(item.role, 120), credentials: str(item.credentials, 200), photo: str(item.photo, 500) }))
			.filter((item) => item.name || item.role || item.credentials || item.photo);
		if (items.some((item) => !item.name)) return 'Each person needs a name.';
		if (items.some((item) => badImage(item.photo))) return 'Each photo needs an https:// link or an uploaded image.';
		return { title, items: items.slice(0, 60) };
	},

	vmgo(value, title) {
		const lines = (raw: unknown) => (Array.isArray(raw) ? raw : []).map((line) => str(line, 600)).filter(Boolean).slice(0, 20);
		return { title, vision: str(value.vision, 2000), mission: str(value.mission, 2000), goals: lines(value.goals), objectives: lines(value.objectives) };
	},

	media(value, title) {
		const content = {
			title,
			body: str(value.body, 4000),
			src: str(value.src, 500),
			alt: str(value.alt, 300),
			side: value.side === 'right' ? 'right' : 'left',
			button: button(value.button)
		};
		if (badImage(content.src)) return 'The photo needs an https:// link or an uploaded image.';
		if (content.button.href && !isLink(content.button.href)) return 'The button link must start with https:// or /.';
		return { ...content, alt: content.alt || content.title || 'Photo' };
	},

	partners(value, title) {
		const items = list(value.items)
			.map((item) => ({ name: str(item.name, 120), logo: str(item.logo, 500), href: str(item.href, 500) }))
			.filter((item) => item.name || item.logo || item.href);
		if (items.some((item) => !item.name)) return 'Each partner needs a name.';
		if (items.some((item) => badImage(item.logo))) return 'Each logo needs an https:// link or an uploaded image.';
		if (items.some((item) => item.href && !isLink(item.href))) return 'Partner links must start with https://.';
		return { title, items: items.slice(0, 40) };
	},

	testimonials(value, title) {
		const items = list(value.items)
			.map((item) => ({ quote: str(item.quote, 800), name: str(item.name, 120), role: str(item.role, 160), photo: str(item.photo, 500) }))
			.filter((item) => item.quote || item.name);
		if (items.some((item) => !item.quote || !item.name)) return 'Each testimonial needs a quote and a name.';
		if (items.some((item) => badImage(item.photo))) return 'Each photo needs an https:// link or an uploaded image.';
		return { title, items: items.slice(0, 20) };
	},

	faq(value, title) {
		const items = list(value.items)
			.map((item) => ({ question: str(item.question, 300), answer: str(item.answer, 4000) }))
			.filter((item) => item.question || item.answer);
		if (items.some((item) => !item.question || !item.answer)) return 'Each question needs an answer.';
		return { title, items: items.slice(0, 40) };
	},

	video(value, title) {
		const url = str(value.url, 500);
		if (url && !videoEmbed(url)) return 'Use a YouTube link or a Google Drive video link.';
		return { title, url, caption: str(value.caption, 300) };
	},

	cta(value, title) {
		const buttons = list(value.buttons).map(button).filter((item) => item.label || item.href).slice(0, 2);
		if (buttons.some((item) => !item.label)) return 'Each button needs a label.';
		if (buttons.some((item) => item.href && !isLink(item.href))) return 'Button links must start with https:// or /.';
		return { title, body: str(value.body, 1000), buttons };
	},

	news(value, title) {
		const items = list(value.items)
			.map((item) => ({ date: str(item.date, 10), title: str(item.title, 200), body: str(item.body, 2000), href: str(item.href, 500) }))
			.filter((item) => item.title || item.body);
		if (items.some((item) => !item.title)) return 'Each announcement needs a title.';
		if (items.some((item) => item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date))) return 'Use the date picker for each announcement date.';
		if (items.some((item) => item.href && !isLink(item.href))) return 'Announcement links must start with https:// or /.';
		return { title, items: items.slice(0, 30) };
	}
};
