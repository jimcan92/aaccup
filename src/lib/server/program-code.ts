import type { SupabaseClient } from '@supabase/supabase-js';

/** Replace a program code as a whole word, exactly as written ("BSFI" but not "BSFIX"). */
export function replaceCode(value: string, oldCode: string, newCode: string): string {
	const escaped = oldCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return value.replace(new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'g'), newCode);
}

/**
 * Write each program code in a text exactly as the program saved it, whatever case it was typed
 * in: with the code saved as "BSFi", "BSFI" and "bsfi" both read "BSFi". Whole words only.
 */
export function followCodes(value: string, codes: string[]): string {
	return codes.reduce((text, code) => {
		if (!code) return text;
		const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return text.replace(new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'gi'), code);
	}, value);
}

/**
 * After a program's code changes, rename the old code in that program's own document titles
 * and section descriptions (seeded rows read "BSFI — AACCUP certification"). Other programs
 * and other text are not touched.
 */
export async function renameProgramCode(supabase: SupabaseClient, programId: string, oldCode: string, newCode: string) {
	const renamed = { documents: 0, sections: 0 };
	if (!oldCode || oldCode === newCode) return renamed;

	const { data: areas } = await supabase
		.from('areas')
		.select('id, description, documents(id, title)')
		.eq('program_id', programId);

	for (const area of areas ?? []) {
		if (area.description) {
			const description = replaceCode(area.description, oldCode, newCode);
			if (description !== area.description) {
				const { error } = await supabase.from('areas').update({ description }).eq('id', area.id);
				if (!error) renamed.sections += 1;
			}
		}
		for (const document of area.documents ?? []) {
			const title = replaceCode(document.title, oldCode, newCode);
			if (title === document.title) continue;
			const { error } = await supabase.from('documents').update({ title }).eq('id', document.id);
			if (!error) renamed.documents += 1;
		}
	}

	return renamed;
}
