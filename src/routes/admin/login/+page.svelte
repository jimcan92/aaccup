<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let mode = $state<'password' | 'magic'>('password');
</script>

<svelte:head>
	<title>Sign in · AACCUP Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="grid min-h-screen bg-salt lg:grid-cols-[0.9fr_1.1fr]">
	<div class="relative hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between">
		<div class="pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true">
			<svg viewBox="0 0 600 800" fill="none" class="h-full w-full">
				<g stroke="currentColor" stroke-width="0.8">
					<path d="M-40 620C90 560 160 650 280 590C400 530 440 420 560 440C640 454 680 500 720 480" />
					<path d="M-40 660C94 600 174 690 300 630C426 570 466 470 580 488C650 500 690 540 720 524" />
					<path d="M-40 700C98 640 188 730 320 670C452 610 492 520 600 536C660 546 700 580 720 568" />
				</g>
			</svg>
		</div>

		<div class="relative">
			<a href="/" class="inline-flex items-center gap-3">
				<span class="grid size-9 place-items-center border border-paper/25 font-display text-[14px] font-semibold">CM</span>
				<span>
					<span class="block font-display text-[15px] font-semibold tracking-[-0.02em]">CTU Moalboal</span>
					<span class="mt-0.5 block text-[10px] text-paper/50">AACCUP 2026</span>
				</span>
			</a>
		</div>

		<div class="relative max-w-md">
			<p class="font-mono text-[9px] text-paper/45">The content desk</p>
			<p class="mt-4 font-display text-[clamp(2.2rem,4vw,3.6rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
				The record, kept current.
			</p>
			<p class="mt-4 text-[13px] leading-relaxed text-paper/55">
				Edit the carousel, VMGO, and public wordings. Submit for review. Publish when the volume is ready.
			</p>
		</div>

		<p class="relative font-mono text-[9px] text-paper/30">CTU MOALBOAL · CAMPUS AACCUP TASK FORCE</p>
	</div>

	<div class="flex items-center justify-center px-5 py-12 sm:px-8">
		<div class="w-full max-w-[26rem]">
			<a href="/" class="mb-10 inline-flex items-center gap-2 text-[10px] text-ink-soft hover:text-ink">
				<ArrowLeft class="size-3.5" />
				Back to the public site
			</a>

			<p class="font-mono text-[9px] text-ink-soft">Admin access</p>
			<h1 class="mt-3 font-display text-[clamp(2rem,4vw,2.8rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
				Sign in to the dossier.
			</h1>
			<p class="mt-3 text-[12px] leading-relaxed text-ink-soft">
				Use your campus account. Access is limited to the focal person, area chairs, reviewers, and MIS.
			</p>

			{#if !data.configured}
				<div class="mt-6 border border-dashed border-ink/25 bg-paper p-4 text-[11px] leading-relaxed text-ink-soft">
					Supabase is not configured on this deployment. Add <code class="font-mono text-[10px]">PUBLIC_SUPABASE_URL</code>
					and <code class="font-mono text-[10px]">PUBLIC_SUPABASE_ANON_KEY</code> in Vercel, then redeploy.
				</div>
			{/if}

			{#if data.error}
				<div class="mt-6 border border-destructive/30 bg-destructive/5 p-3 text-[11px] leading-relaxed text-destructive">
					{data.error}
				</div>
			{/if}

			{#if form?.message}
				<div class="mt-6 border border-destructive/30 bg-destructive/5 p-3 text-[11px] leading-relaxed text-destructive">
					{form.message}
				</div>
			{/if}

			{#if form?.success}
				<div class="mt-6 border border-bsfi/30 bg-bsfi-soft p-3 text-[11px] leading-relaxed text-bsfi">
					{form.success}
				</div>
			{/if}

			{#if data.configured}
				<div class="mt-7 flex border-b border-rule">
					<button
						type="button"
						onclick={() => (mode = 'password')}
						class="border-b-2 px-1 pb-2 text-[11px] font-medium transition-colors"
						class:border-ink={mode === 'password'}
						class:text-ink={mode === 'password'}
						class:border-transparent={mode !== 'password'}
						class:text-ink-soft={mode !== 'password'}
					>
						Password
					</button>
					<button
						type="button"
						onclick={() => (mode = 'magic')}
						class="ml-5 border-b-2 px-1 pb-2 text-[11px] font-medium transition-colors"
						class:border-ink={mode === 'magic'}
						class:text-ink={mode === 'magic'}
						class:border-transparent={mode !== 'magic'}
						class:text-ink-soft={mode !== 'magic'}
					>
						Magic link
					</button>
				</div>

				{#if mode === 'password'}
					<form method="POST" action="?/password" use:enhance class="mt-6 space-y-4">
						<div>
							<label for="email" class="mb-1.5 block text-[10px] font-medium text-ink-soft">Email</label>
							<Input
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								required
								value={form?.email ?? ''}
								class="h-11 rounded-none border-rule bg-paper text-[13px]"
								placeholder="name@ctu.edu.ph"
							/>
						</div>
						<div>
							<label for="password" class="mb-1.5 block text-[10px] font-medium text-ink-soft">Password</label>
							<Input
								id="password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
								class="h-11 rounded-none border-rule bg-paper text-[13px]"
								placeholder="••••••••"
							/>
						</div>
						<Button type="submit" class="h-11 w-full rounded-none text-[12px]">Sign in</Button>
					</form>
				{:else}
					<form method="POST" action="?/magic" use:enhance class="mt-6 space-y-4">
						<div>
							<label for="magic-email" class="mb-1.5 block text-[10px] font-medium text-ink-soft">Email</label>
							<Input
								id="magic-email"
								name="email"
								type="email"
								autocomplete="email"
								required
								value={form?.email ?? ''}
								class="h-11 rounded-none border-rule bg-paper text-[13px]"
								placeholder="name@ctu.edu.ph"
							/>
						</div>
						<Button type="submit" class="h-11 w-full rounded-none text-[12px]">Send magic link</Button>
						<p class="text-[10px] leading-relaxed text-ink-soft">
							The link expires after a short time. Only existing accounts can request one.
						</p>
					</form>
				{/if}
			{/if}
		</div>
	</div>
</div>
