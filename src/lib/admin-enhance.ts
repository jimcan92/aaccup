import { enhance as kitEnhance } from '$app/forms';
import type { SubmitFunction } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

/**
 * SvelteKit's `enhance`, plus what every admin form needs:
 *  - the clicked button shows a spinner (data-loading) and cannot be clicked twice;
 *  - the action's `message` appears as a Sonner toast (success, or error on failure).
 * Accepts the same optional submit function as `enhance`.
 */
export function enhance(form: HTMLFormElement, submit?: SubmitFunction) {
	return kitEnhance(form, async (input) => {
		const button =
			(input.submitter as HTMLElement | null) ??
			form.querySelector<HTMLElement>('button[type="submit"], button:not([type])');
		button?.setAttribute('data-loading', '');
		button?.setAttribute('aria-busy', 'true');

		const after = submit ? await submit(input) : undefined;

		return async (options) => {
			try {
				if (after) await after(options);
				else await options.update();
			} finally {
				button?.removeAttribute('data-loading');
				button?.removeAttribute('aria-busy');
			}

			const { result } = options;
			if (result.type === 'success' || result.type === 'failure') {
				const message = (result.data as { message?: string } | undefined)?.message;
				if (message) {
					if (result.type === 'failure') toast.error(message, { duration: 9000 });
					else toast.success(message);
				}
			} else if (result.type === 'error') {
				toast.error(result.error?.message ?? 'Something went wrong. Try again.', { duration: 9000 });
			}
		};
	});
}
