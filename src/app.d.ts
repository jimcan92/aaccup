import type { SupabaseClient } from '@supabase/supabase-js';
import type { SsoUser, StaffProfile } from '$lib/server/sso';

declare global {
	namespace App {
		interface Locals {
			/** Anonymous client for public reads, or the staff member's RLS-scoped client in the admin. */
			supabase: SupabaseClient | null;
			/** The CTU Accounts user, when the request needed to know (admin, preview). */
			ssoUser: SsoUser | null;
			/** The AACCUP staff profile matched to the SSO user's email. */
			staff: StaffProfile | null;
		}
	}
}

export {};
