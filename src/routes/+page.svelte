<script lang="ts">
  import LandingBlocks from "#lib/components/program/landing-blocks.svelte";
  import HomeQuickActions from "#lib/components/site/home-quick-actions.svelte";
  import SiteFooter from "#lib/components/site/site-footer.svelte";
  import { site } from "#lib/data/site.js";
  import { imageSrc } from "#lib/image-url.js";
  import { themeStyle } from "#lib/theme.js";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const content = $derived(data.content);


  // Grid columns for 1–4 programs; narrower screens get fewer (literal classes so Tailwind keeps them).
  const columns: Record<number, string> = {
    0: "",
    1: "grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
  };
</script>

<svelte:head>
  <title>{content.title}</title>
  <meta name="description" content={content.description} />
  <meta property="og:title" content={content.title} />
  <meta property="og:description" content={content.description} />
  <meta property="og:type" content="website" />
</svelte:head>

{#if data.preview}
  <div
    class="fixed bottom-4 left-4 z-50 border border-paper/20 bg-ink px-3 py-2 font-mono text-[11px] text-paper shadow-lg"
  >
    Draft preview · not public
  </div>
{/if}

<!-- The first screen: heading and the program cards fill the viewport; the blocks start below it. -->
<main id="main" class="grid-hero flex min-h-[calc(100svh-7rem)] flex-col bg-salt">
  <div
    class="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-5 pb-8 pt-10 sm:px-8 lg:pt-14"
  >
    <div
      class="flex flex-col gap-3 border-b border-ink/15 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <!-- <BrandMarks size={72} decorative={false} /> -->
        <div>
          <h1
            class="text-balance font-display text-[clamp(2.4rem,7vw,4.75rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-ink"
          >
            {content.heading}
          </h1>
          {#if content.intro}<p
              class="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-ink-soft sm:text-[16px]"
            >
              {content.intro}
            </p>{/if}
        </div>
      </div>
      <p class="shrink-0 font-mono text-[11px] text-ink-soft sm:pb-2">
        {site.campus.replace("Cebu Technological University — ", "CTU · ")} · {data
          .programs.length}
        {data.programs.length === 1 ? "program" : "programs"}
      </p>
    </div>

    <!-- As many columns as programs, up to four, and fewer on narrower screens. -->
    <ul
      class="mt-8 grid flex-1 auto-rows-fr gap-5 {columns[
        Math.min(data.programs.length, 4)
      ]}"
      aria-label="Programs"
    >
      {#each data.programs as program (program.slug)}
        <li style={themeStyle(program.theme)} class="program-scope">
          <a
            href={`/${program.slug}`}
            class="group on-program relative isolate flex h-full min-h-[22rem] flex-col overflow-hidden bg-program text-program-contrast transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgb(8_42_44/0.6)]"
          >
            {#if program.cover}
              <img
                src={imageSrc(program.cover, 1400)}
                alt=""
                class="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading={data.programs.length > 4 ? "lazy" : "eager"}
              />
            {/if}
            <!-- Program-colour tint: light at the top, solid behind the text at the bottom. -->
            <div
              class="absolute inset-0 -z-10"
              style="background-image: linear-gradient(180deg, color-mix(in srgb, var(--program) 55%, transparent) 0%, color-mix(in srgb, var(--program) 78%, transparent) 45%, var(--program) 82%)"
              aria-hidden="true"
            ></div>

            <div class="flex items-start justify-between gap-4 p-5 sm:p-6">
              <p class="font-mono text-[11px] opacity-90">
                {program.visit.year} · {program.visit.label}
              </p>
              {#if program.logo}
                <img
                  src={imageSrc(program.logo, 300)}
                  alt={`${program.code} logo`}
                  class="size-14 shrink-0 bg-program-contrast object-contain p-1.5 shadow-[0_8px_20px_-10px_rgb(0_0_0/0.6)] sm:size-16"
                />
              {/if}
            </div>

            <div class="mt-auto p-5 sm:p-6">
              <p
                class="font-display text-[clamp(3.5rem,8vw,5.5rem)] font-semibold leading-[0.8] tracking-[-0.07em]"
              >
                {program.code}
              </p>
              <p
                class="mt-3 text-balance font-display text-[19px] font-semibold leading-snug tracking-[-0.02em]"
              >
                {program.name}
              </p>
              {#if program.tagline}<p
                  class="mt-1.5 text-pretty text-[14px] italic leading-snug opacity-90"
                >
                  {program.tagline}
                </p>{/if}
              <div
                class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-program-contrast/25 pt-4 text-[13px]"
              >
                <span class="opacity-85"
                  ><span class="font-mono font-semibold">{program.linked}</span>
                  {program.linked === 1 ? "document" : "documents"} linked</span
                >
                <span class="inline-flex items-center gap-1.5 font-semibold">
                  Visit {program.code}
                  <ArrowRight
                    class="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </div>
          </a>
        </li>
      {/each}
    </ul>

    {#if data.blocks.length}
      <a
        href="#home-blocks"
        class="mx-auto mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink"
      >
        More about the campus <ArrowDown
          class="size-4 motion-safe:animate-bounce"
        />
      </a>
    {/if}
  </div>
</main>

<!-- Home page blocks (history, organization, events…), set under Admin → Home page. -->
<div id="home-blocks" class="scroll-mt-16"></div>
<LandingBlocks
  blocks={data.blocks}
  editable={data.editable}
  drafts={data.drafts}
/>

<SiteFooter contactNote={content.contactNote} />

{#if !data.editable}<HomeQuickActions programs={data.programs} />{/if}
