import { defineEnvVars } from '@sveltejs/kit/env';

// A missing variable reads as '' on purpose, and every use checks for it: without Supabase the
// public site serves the static dossier, without Google Drive sync is off, without CRON_SECRET the
// cron endpoint refuses every call, and without the service-role key no staff cache is signed.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, schema: (input) => input ?? '' },
	PUBLIC_SUPABASE_ANON_KEY: { public: true, schema: (input) => input ?? '' },
	CRON_SECRET: { schema: (input) => input ?? '' },
	SUPABASE_SERVICE_ROLE_KEY: { schema: (input) => input ?? '' },
	PUBLIC_SITE_URL: { public: true, schema: (input) => input ?? '' },
	GOOGLE_SERVICE_ACCOUNT_JSON: { schema: (input) => input ?? '' },
	ACCOUNTS_URL: { schema: (input) => input ?? '' },
	AACCUP_DEV_SSO_EMAIL: { schema: (input) => input ?? '' }
});
