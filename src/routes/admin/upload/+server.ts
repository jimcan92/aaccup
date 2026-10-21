import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_BYTES = 5 * 1024 * 1024;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.supabase) {
		return json({ error: 'Supabase is not configured.' }, { status: 500 });
	}

	const form = await request.formData();
	const file = form.get('file');

	if (!(file instanceof File)) {
		return json({ error: 'No image file received.' }, { status: 400 });
	}

	if (!file.type.startsWith('image/')) {
		return json({ error: 'Only image files are allowed.' }, { status: 400 });
	}

	if (file.size > MAX_BYTES) {
		return json({ error: 'The image must be smaller than 5 MB.' }, { status: 400 });
	}

	const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
	const path = `carousel/${crypto.randomUUID()}.${extension}`;

	const { error } = await locals.supabase.storage
		.from('public-images')
		.upload(path, file, { contentType: file.type, upsert: false });

	if (error) {
		return json({ error: error.message }, { status: 400 });
	}

	const {
		data: { publicUrl }
	} = locals.supabase.storage.from('public-images').getPublicUrl(path);

	return json({ url: publicUrl, path });
};
