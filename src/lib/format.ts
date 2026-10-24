export function pad2(value: number): string {
	return String(value).padStart(2, '0');
}

export function formatDate(iso?: string): string {
	if (!iso) return '';
	const date = new Date(`${iso}T00:00:00Z`);
	return new Intl.DateTimeFormat('en-PH', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(date);
}

/** The calendar day (YYYY-MM-DD) of a timestamp in Philippine time, for formatDate. */
export function manilaDay(timestamp?: string): string | undefined {
	if (!timestamp) return undefined;
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return undefined;
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);
}

export function kindLabel(kind: string): string {
	const labels: Record<string, string> = {
		recommendation: 'Recommendations',
		compliance: 'Compliance report',
		narrative: 'Narrative profile',
		supporting: 'Supporting evidence',
		checklist: 'Checklist',
		presentation: 'Presentation',
		institutional: 'Institutional record',
		form: 'Form'
	};
	return labels[kind] ?? 'Evidence';
}

export function formatLabel(format: string): string {
	const labels: Record<string, string> = {
		pdf: 'PDF',
		docx: 'DOCX',
		xlsx: 'XLSX',
		pptx: 'PPTX',
		folder: 'DRIVE',
		link: 'LINK'
	};
	return labels[format] ?? 'FILE';
}
