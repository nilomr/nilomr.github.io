<script>
	import { onMount } from 'svelte';
	import SmoothScroll from '$lib/components/SmoothScroll.svelte';
	import CustomCursor from '$lib/components/CustomCursor.svelte';
	import { contentReady } from '$lib/stores/ready';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';

	let { children } = $props();
	let WebGLBackground = $state(null);
	let mounted = $state(false);
	let isMobile = $state(false);

	const pageLoadTime = typeof performance !== 'undefined' ? performance.now() : 0;
	const MIN_LOADING_MS = 1500;

	function setProgress(pct, label) {
		if (typeof window !== 'undefined' && window.__lsSetProgress) {
			window.__lsSetProgress(pct, label);
		}
	}

	function dismissLoading() {
		setProgress(100, 'READY');
		const el = document.getElementById('loading-screen');
		if (!el) return;
		el.classList.add('fade-out');
		setTimeout(() => el.remove(), 700);
	}

	function handleBgReady({ startReveal }) {
		setProgress(80, 'RENDERING');
		const elapsed = performance.now() - pageLoadTime;
		const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

		setTimeout(() => {
			dismissLoading();
			startReveal();

			setTimeout(() => { contentReady.set(true); }, 1400);
		}, remaining);
	}

	onMount(async () => {
		setProgress(20, 'LOADING MODULES');
		isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches
			|| window.innerWidth <= 768;

		const mod = await import('$lib/components/WebGLBackground.svelte');
		setProgress(50, 'BUILDING TERRAIN');
		WebGLBackground = mod.default;
		mounted = true;
	});
</script>

<svelte:head>
	<title>Nilo Merino Recalde</title>
	<link rel="canonical" href={`https://nilomr.github.io${page.url.pathname}`} />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "Person",
		"name": "Nilo Merino Recalde",
		"jobTitle": "Researcher, Developer, and Designer",
		"affiliation": [
			{ "@type": "Organization", "name": "RSPB", "url": "https://www.rspb.org.uk" },
			{ "@type": "Organization", "name": "University of Oxford", "url": "https://www.ox.ac.uk" }
		],
		"url": "https://nilomr.github.io/",
		"email": "nilo@sedum.studio",
		"sameAs": [
			"https://github.com/nilomr",
			"https://www.sedum.studio",
			"https://www.imdb.com/name/nm4945222"
		],
		"knowsAbout": [
			"Data Science", "Machine Learning", "Statistical Modelling",
			"Data Visualisation", "Software Development", "Interactive Tools",
			"Research Communication", "Visual Design"
		]
	})}</script>`}
</svelte:head>

{#if mounted && WebGLBackground}
	<WebGLBackground onReady={handleBgReady} />
{/if}

<!-- Hidden locale links so SvelteKit prerenderer generates all locale pages -->
<nav aria-hidden="true" style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })} data-sveltekit-reload>
			{locale}
		</a>
	{/each}
</nav>
{#if !isMobile}
	<CustomCursor />
{/if}
{#if isMobile}
	{@render children()}
{:else}
	<SmoothScroll>
		{@render children()}
	</SmoothScroll>
{/if}

<style>
	:global(*),
	:global(*::before),
	:global(*::after) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(html) {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(body) {
		font-family: 'Inter', -apple-system, system-ui, sans-serif;
		color: #1a1a1a;
		background: #f5f2ed;
		overflow-x: hidden;
	}

	:global(::selection) {
		background: rgba(26, 26, 26, 0.08);
		color: #1a1a1a;
	}

	/* Hide default cursor on desktop */
	@media (hover: hover) and (pointer: fine) {
		:global(body) {
			cursor: none;
		}
		:global(a, button, [role="button"]) {
			cursor: none;
		}
	}

	:global(.html.lenis) {
		height: auto;
	}

	:global(.lenis.lenis-smooth) {
		scroll-behavior: auto;
	}
</style>
