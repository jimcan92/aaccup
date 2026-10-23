import { defineEnvVars } from '@sveltejs/kit/env';

// @migration-task Review usage of dynamic environment variables. They fall back to the empty string if not present, which may not be what you want.
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
