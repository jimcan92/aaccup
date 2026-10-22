/** Shared bits for the landing block editors. */

export const field = 'h-10 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink disabled:opacity-60';
export const area = 'w-full border border-rule bg-salt p-3 text-[14px] leading-relaxed outline-none focus:border-ink';
export const small = 'grid size-8 place-items-center text-ink-soft hover:bg-salt hover:text-ink disabled:opacity-30';
export const addButton = 'inline-flex h-9 w-fit items-center gap-1.5 border border-rule px-3 text-[13px] font-medium hover:border-ink/30';
export const label = 'grid gap-1.5 text-[13px] font-medium';
export const hint = 'text-[12px] text-ink-soft';

/** A copy of the list with the item at `index` moved by `delta`. */
export function move<T>(list: T[], index: number, delta: number): T[] {
	const next = [...list];
	const target = index + delta;
	if (target < 0 || target >= next.length) return next;
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}

/** Upload an image to the program's folder; resolves to its public URL. */
export async function uploadImage(file: File, programId: string): Promise<string> {
	const form = new FormData();
	form.set('file', file);
	form.set('folder', `programs/${programId}`);
	const response = await fetch('/admin/upload', { method: 'POST', body: form });
	const result = await response.json();
	if (!response.ok || !result.url) throw new Error(result.error ?? 'Upload failed.');
	return result.url;
}
