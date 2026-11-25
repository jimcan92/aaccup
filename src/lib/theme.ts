import type { ProgramTheme } from '#lib/data/types.js';

function luminance(hex: string): number {
	const value = hex.replace('#', '');
	const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
	const channels = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
	const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two hex colors. */
export function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** Pick white or petrol ink for text on a program color, whichever reads better. */
export function readableOn(background: string): string {
	return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#082a2c') ? '#ffffff' : '#082a2c';
}

/** `hex` mixed toward white by `amount` (0–1). */
function lighten(hex: string, amount: number): string {
	const value = hex.replace('#', '');
	const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
	return (
		'#' +
		[0, 2, 4]
			.map((i) => Math.round(parseInt(full.slice(i, i + 2), 16) + (255 - parseInt(full.slice(i, i + 2), 16)) * amount))
			.map((c) => c.toString(16).padStart(2, '0'))
			.join('')
	);
}

/** The program's dark-mode text color: its accent, or the program color, lightened until it reads on dark. */
export function darkAccent(theme: ProgramTheme): string {
	const base = theme.accent || theme.program;
	const surface = '#221418';
	for (let amount = 0; amount <= 0.9; amount += 0.05) {
		const color = lighten(base, amount);
		if (contrastRatio(color, surface) >= 4.5) return color;
	}
	return lighten(base, 0.9);
}

/**
 * CSS variables for a program scope. If the stored contrast color fails AA (4.5:1)
 * on the program color, fall back to whichever of white or ink passes.
 */
export function themeStyle(theme: ProgramTheme): string {
	const contrast =
		contrastRatio(theme.program, theme.contrast) >= 4.5 ? theme.contrast : readableOn(theme.program);

	const accent = darkAccent(theme);

	return [
		`--program: ${theme.program}`,
		`--program-ink: ${theme.ink}`,
		`--program-soft: ${theme.soft}`,
		`--program-contrast: ${contrast}`,
		// Dark mode (app.css): the program color keeps its own surfaces; the accent takes the text.
		`--program-base: ${theme.program}`,
		`--program-base-contrast: ${contrast}`,
		`--program-accent-dark: ${accent}`,
		`--program-accent-contrast: ${readableOn(accent)}`
	].join('; ');
}
