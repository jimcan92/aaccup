import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.supabase) {
		return Response.json({ error: 'Supabase is not configured.' }, { status: 500 });
	}

	const payload = await request.json().catch(() => null);
	const value = typeof payload?.value === 'string' ? payload.value : null;

	if (value === null) {
		return Response.json({ error: 'No value received.' }, { status: 400 });
	}

	const { data: block, error: readError } = await locals.supabase
		.from('content_blocks')
		.select('id, type')
		.eq('id', params.id)
		.maybeSingle();

	if (readError) {
		return Response.json({ error: readError.message }, { status: 400 });
	}

	if (!block) {
		return Response.json({ error: 'Content block not found.' }, { status: 404 });
	}

	if (block.type === 'json') {
		try {
			JSON.parse(value);
		} catch {
			return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
		}
	}

	const { error } = await locals.supabase
		.from('content_blocks')
		.update({ draft_value: value, status: 'draft' })
		.eq('id', params.id);

	if (error) {
		return Response.json({ error: error.message }, { status: 400 });
	}

	return Response.json({ ok: true, savedAt: new Date().toISOString() });
};
