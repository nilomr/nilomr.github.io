<script>
	import { onMount } from 'svelte';
	import SmoothScroll from '$lib/components/SmoothScroll.svelte';
	import CustomCursor from '$lib/components/CustomCursor.svelte';

	let { children } = $props();
	let WebGLBackground = $state(null);
	let mounted = $state(false);
	let isMobile = $state(false);

	onMount(async () => {
		isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches
			|| window.innerWidth <= 768;

		const mod = await import('$lib/components/WebGLBackground.svelte');
		WebGLBackground = mod.default;
		mounted = true;
	});
</script>

<svelte:head>
	<title>Nilo Merino Recalde</title>
</svelte:head>

{#if mounted && WebGLBackground}
	<WebGLBackground />
{/if}
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
