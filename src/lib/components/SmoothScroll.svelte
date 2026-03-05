<script>
	import { onMount } from 'svelte';
	import Lenis from 'lenis';

	let { children } = $props();

	onMount(async () => {
		const gsap = (await import('gsap')).default;
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);

		const lenis = new Lenis({
			duration: 1.0,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			touchMultiplier: 2,
			infinite: false,
			overscroll: false,
		});

		// Sync Lenis with GSAP ScrollTrigger
		lenis.on('scroll', ScrollTrigger.update);

		gsap.ticker.add((time) => {
			lenis.raf(time * 1000);
		});
		gsap.ticker.lagSmoothing(0);

		window.__lenis = lenis;

		return () => {
			lenis.destroy();
			gsap.ticker.remove(lenis.raf);
			delete window.__lenis;
		};
	});
</script>

{@render children()}
