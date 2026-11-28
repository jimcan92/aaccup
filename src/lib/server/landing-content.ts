import { showcaseIcons, statementFonts, statementSizes, videoEmbed, videoFile, type ShowcaseIcon, type StatementFont, type StatementSize } from '#lib/landing.js';
import { previewUrl } from '#lib/drive-url.js';
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
		const size = (raw: unknown): StatementSize => (statementSizes.includes(raw as StatementSize) ? (raw as StatementSize) : 'md');
		const font = (raw: unknown): StatementFont => (statementFonts.includes(raw as StatementFont) ? (raw as StatementFont) : 'body');
		return {
			title,
			vision: str(value.vision, 2000),
			mission: str(value.mission, 2000),
			visionSize: size(value.visionSize),
			missionSize: size(value.missionSize),
			visionFont: font(value.visionFont),
			missionFont: font(value.missionFont),
			goals: lines(value.goals),
			objectives: lines(value.objectives)
		};
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
			.map((item) => ({
				name: str(item.name, 120),
				logo: str(item.logo, 500),
				href: str(item.href, 500),
				group: str(item.group, 80),
				sector: str(item.sector, 120),
				place: str(item.place, 120),
				note: str(item.note, 120)
			}))
			.filter((item) => item.name || item.logo || item.href || item.sector || item.place || item.note);
		if (items.some((item) => !item.name)) return 'Each partner needs a name.';
		if (items.some((item) => badImage(item.logo))) return 'Each logo needs an https:// link or an uploaded image.';
		if (items.some((item) => item.href && !isLink(item.href))) return 'Partner links must start with https://.';
		const stats = list(value.stats)
			.map((item) => ({ value: str(item.value, 20), label: str(item.label, 80) }))
			.filter((item) => item.value || item.label);
		if (stats.some((item) => !item.value || !item.label)) return 'Each figure needs a number and a label.';
		return { title, intro: str(value.intro, 1000), stats: stats.slice(0, 4), items: items.slice(0, 60) };
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
		if (url && !videoEmbed(url) && !videoFile(url)) return 'Use a YouTube link, a Google Drive video link, or a link to an .mp4 file.';
		return { title, url, caption: str(value.caption, 300), autoplay: value.autoplay === true };
	},

	cta(value, title) {
		const buttons = list(value.buttons).map(button).filter((item) => item.label || item.href).slice(0, 2);
		if (buttons.some((item) => !item.label)) return 'Each button needs a label.';
		if (buttons.some((item) => item.href && !isLink(item.href))) return 'Button links must start with https:// or /.';
		return { title, body: str(value.body, 1000), buttons };
	},

	org(value, title) {
		const items = list(value.items)
			.map((item) => ({
				name: str(item.name, 120),
				role: str(item.role, 120),
				unit: str(item.unit, 160),
				photo: str(item.photo, 500),
				level: [1, 2, 3, 4].includes(Number(item.level)) ? Number(item.level) : 2
			}))
			.filter((item) => item.name || item.role || item.photo);
		if (items.some((item) => !item.name || !item.role)) return 'Each box needs a name and a position.';
		if (items.some((item) => badImage(item.photo))) return 'Each photo needs an https:// link or an uploaded image.';
		return { title, items: items.slice(0, 40) };
	},

	events(value, title) {
		const date = /^\d{4}-\d{2}-\d{2}$/;
		const items = list(value.items)
			.map((item) => ({
				date: str(item.date, 10),
				end: str(item.end, 10),
				time: str(item.time, 60),
				title: str(item.title, 200),
				place: str(item.place, 160),
				body: str(item.body, 2000),
				href: str(item.href, 500),
				photo: str(item.photo, 500)
			}))
			.filter((item) => item.title || item.body || item.place || item.photo);
		if (items.some((item) => !item.title || !date.test(item.date))) return 'Each event needs a title and a date.';
		if (items.some((item) => item.end && (!date.test(item.end) || item.end < item.date))) return 'An end date must come after the start date.';
		if (items.some((item) => item.href && !isLink(item.href))) return 'Event links must start with https:// or /.';
		if (items.some((item) => badImage(item.photo))) return 'Each poster needs an https:// link or an uploaded image.';
		// Kept in date order, so the page and the editor agree.
		return { title, items: items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 60) };
	},

	documents(value, title) {
		const items = list(value.items)
			.map((item) => ({ title: str(item.title, 200), label: str(item.label, 160), url: str(item.url, 500) }))
			.filter((item) => item.title || item.label || item.url);
		if (items.some((item) => !item.title)) return 'Each document needs a title.';
		if (items.some((item) => item.url && !previewUrl(item.url))) return 'Use a Google Drive link for each document, or leave it empty while it is in preparation.';
		return { title, intro: str(value.intro, 600), items: items.slice(0, 12) };
	},

	showcase(value, title) {
		const icon = (raw: unknown): ShowcaseIcon => (showcaseIcons.includes(raw as ShowcaseIcon) ? (raw as ShowcaseIcon) : 'box');
		const features = list(value.features)
			.map((item) => ({ icon: icon(item.icon), title: str(item.title, 120), text: str(item.text, 300) }))
			.filter((item) => item.title || item.text);
		const shots = list(value.shots)
			.map((item) => ({ src: str(item.src, 500), caption: str(item.caption, 160) }))
			.filter((item) => item.src || item.caption);
		const content = {
			title,
			eyebrow: str(value.eyebrow, 80),
			body: str(value.body, 2000),
			url: str(value.url, 120).replace(/^https?:\/\//, '').replace(/\/+$/, ''),
			features: features.slice(0, 8),
			shots: shots.slice(0, 12),
			button: button(value.button),
			side: value.side === 'right' ? 'right' : 'left'
		};
		if (features.some((item) => !item.title)) return 'Each feature needs a title.';
		if (shots.some((item) => !item.src)) return 'Each screenshot needs an image: upload one or paste a link.';
		if (shots.some((item) => badImage(item.src))) return 'Each screenshot needs an https:// link or an uploaded image.';
		if (content.button.href && !isLink(content.button.href)) return 'The button link must start with https:// or /.';
		return content;
	},

	projects(value, title) {
		const video = str(value.video, 500);
		if (video && !videoEmbed(video)) return 'Use a YouTube link or a Google Drive video link for the video.';
		const stats = list(value.stats)
			.map((item) => ({ value: str(item.value, 20), label: str(item.label, 80) }))
			.filter((item) => item.value || item.label);
		if (stats.some((item) => !item.value || !item.label)) return 'Each figure needs a number and a label.';
		const items = list(value.items)
			.map((item) => ({
				title: str(item.title, 200),
				partner: str(item.partner, 160),
				date: str(item.date, 60),
				beneficiaries: str(item.beneficiaries, 80),
				body: str(item.body, 2000),
				photo: str(item.photo, 500),
				photos: (Array.isArray(item.photos) ? item.photos : []).map((src) => str(src, 500)).filter(Boolean).slice(0, 12),
				video: str(item.video, 500),
				href: str(item.href, 500)
			}))
			.filter((item) => item.title || item.body || item.photo);
		if (items.some((item) => !item.title)) return 'Each project needs a title.';
		if (items.some((item) => badImage(item.photo) || item.photos.some(badImage))) return 'Each photo needs an https:// link or an uploaded image.';
		if (items.some((item) => item.href && !isLink(item.href))) return 'Project links must start with https:// or /.';
		if (items.some((item) => item.video && !videoEmbed(item.video))) return 'Each project video needs a YouTube or Google Drive video link.';
		return { title, intro: str(value.intro, 1000), video, videoCaption: str(value.videoCaption, 300), stats: stats.slice(0, 4), items: items.slice(0, 24) };
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
