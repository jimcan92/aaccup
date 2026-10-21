import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

async function loadBlock(locals: App.Locals, id: string) {
	if (!locals.supabase) {
		redirect(303, '/admin/login');
	}

	const { data, error: dbError } = await locals.supabase
		.from('content_blocks')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (dbError) {
		error(500, dbError.message);
	}

	if (!data) {
		error(404, 'Content block not found');
	}

	return data;
}

export const load: PageServerLoad = async ({ locals, params, parent }) => {
	const block = await loadBlock(locals, params.id);
	const { profile } = await parent();

	return { block, profile };
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		const block = await loadBlock(locals, params.id);
		const form = await request.formData();
		const value = String(form.get('value') ?? '');

		if (block.type === 'json') {
			try {
				JSON.parse(value);
			} catch {
				return fail(400, { message: 'That is not valid JSON. Check the brackets and quotes.', value });
			}
		}

		const { error: updateError } = await locals.supabase!
			.from('content_blocks')
			.update({ draft_value: value, status: 'draft' })
			.eq('id', params.id);

		if (updateError) {
			return fail(400, { message: updateError.message, value });
		}

		return {
			message: 'Draft saved. The public site still shows the published version until you publish.',
			value
		};
	},

	submit: async ({ request, locals, params }) => {
		const block = await loadBlock(locals, params.id);
		const form = await request.formData();
		const value = String(form.get('value') ?? '');

		if (block.type === 'json') {
			try {
				JSON.parse(value);
			} catch {
				return fail(400, { message: 'That is not valid JSON. Check the brackets and quotes.', value });
			}
		}

		const { error: updateError } = await locals.supabase!
			.from('content_blocks')
			.update({ draft_value: value })
			.eq('id', params.id);

		if (updateError) {
			return fail(400, { message: updateError.message, value });
		}

		const { error: rpcError } = await locals.supabase!.rpc('submit_content_block', {
			p_id: params.id
		});

		if (rpcError) {
			return fail(400, { message: rpcError.message, value });
		}

		return { message: 'Submitted for review. A reviewer or the focal person can now publish it.', value };
	},

	publish: async ({ request, locals, params }) => {
		const block = await loadBlock(locals, params.id);
		const form = await request.formData();
		const value = String(form.get('value') ?? '');

		if (block.type === 'json') {
			try {
				JSON.parse(value);
			} catch {
				return fail(400, { message: 'That is not valid JSON. Check the brackets and quotes.', value });
			}
		}

		const { error: updateError } = await locals.supabase!
			.from('content_blocks')
			.update({ draft_value: value })
			.eq('id', params.id);

		if (updateError) {
			return fail(400, { message: updateError.message, value });
		}

		const { error: rpcError } = await locals.supabase!.rpc('publish_content_block', {
			p_id: params.id
		});

		if (rpcError) {
			return fail(400, { message: rpcError.message, value });
		}

		return { message: 'Published. The public site will show it within about a minute.', value };
	}
};
