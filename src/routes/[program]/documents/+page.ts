import { programs } from '$lib/data/accreditation';
import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = () => programs.map((program) => ({ program: program.slug }));
