import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

// Site texts are edited on the Home page editor now.
export const load: PageServerLoad = () => redirect(308, '/admin/home#site-texts');
