import type { ProgramTheme } from '$lib/data/types';

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

/**
 * CSS variables for a program scope. If the stored contrast color fails AA (4.5:1)
 * on the program color, fall back to whichever of white or ink passes.
 */
export function themeStyle(theme: ProgramTheme): string {
	const contrast =
		contrastRatio(theme.program, theme.contrast) >= 4.5 ? theme.contrast : readableOn(theme.program);

	return [
		`--program: ${theme.program}`,
		`--program-ink: ${theme.ink}`,
		`--program-soft: ${theme.soft}`,
		`--program-contrast: ${contrast}`
	].join('; ');
}
