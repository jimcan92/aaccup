import type { SupabaseClient } from '@supabase/supabase-js';
import type { SsoUser, StaffProfile } from '#lib/server/sso.js';

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

		interface PageState {
			/** Document shown in the in-page preview (shallow routing). */
			doc?: string;
			/** False when the preview was opened from a shared ?doc= link rather than a click. */
			opened?: boolean;
		}
	}
}

export {};
