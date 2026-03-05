<script>
	import { onMount } from 'svelte';
	import WebGLImage from './WebGLImage.svelte';

	const images = [
		{
			src: '/images/mng1.jpg',
			alt: 'Reindeer herders crossing a river at golden hour, Mongolia',
			label: 'Mongolia',
			desc: 'Tsaatan reindeer herders — Awaken',
		},
		{
			src: '/images/lapwings.jpg',
			alt: 'Flock of lapwings taking flight over snow-covered trees',
			label: 'Oxford',
			desc: 'Wytham Woods, field research',
		},
		{
			src: '/images/KSP06883_2.jpg',
			alt: 'Cinematographer filming reindeer herders from a river',
			label: 'On set',
			desc: 'Northern Mongolia, 2014',
		},
		{
			src: '/images/garza.jpg',
			alt: 'Egret catching fish in backlit water',
			label: 'Doñana',
			desc: 'Little egret',
		},
	];

	let wrapperEl = $state(null);

	onMount(async () => {
		const gsap = (await import('gsap')).default;
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);

		const track = wrapperEl.querySelector('.g-track');
		const getScrollDistance = () => track.scrollWidth - window.innerWidth;

		// Horizontal scroll with pin — no anticipatePin (causes jumps with Lenis)
		gsap.to(track, {
			x: () => -getScrollDistance(),
			ease: 'none',
			scrollTrigger: {
				trigger: wrapperEl,
				start: 'top top',
				end: () => `+=${getScrollDistance()}`,
				pin: true,
				pinSpacing: true,
				scrub: 1,
				invalidateOnRefresh: true,
			},
		});

		// Counter
		const counter = wrapperEl.querySelector('.g-counter-current');
		if (counter) {
			ScrollTrigger.create({
				trigger: wrapperEl,
				start: 'top top',
				end: () => `+=${getScrollDistance()}`,
				scrub: true,
				onUpdate: (self) => {
					const idx = Math.min(images.length, Math.floor(self.progress * images.length) + 1);
					counter.textContent = String(idx).padStart(2, '0');
				},
			});
		}
	});
</script>

<section class="g-wrapper" bind:this={wrapperEl}>
	<div class="g-track">
		<div class="g-lead">
			<span class="g-lead-text">Visual Work</span>
		</div>

		{#each images as image}
			<article class="g-card">
				<div class="g-frame">
					<WebGLImage src={image.src} alt={image.alt} />
				</div>
				<div class="g-meta">
					<span class="g-label">{image.label}</span>
					<span class="g-desc">{image.desc}</span>
				</div>
			</article>
		{/each}

		<div class="g-trail"></div>
	</div>

	<div class="g-counter">
		<span class="g-counter-current">01</span>
		<span class="g-counter-sep">/</span>
		<span class="g-counter-total">{String(images.length).padStart(2, '0')}</span>
	</div>
</section>

<style>
	.g-wrapper {
		position: relative;
		overflow: hidden;
		background: rgba(246, 243, 238, 0.7);
	}

	.g-track {
		display: flex;
		align-items: center;
		gap: 3vw;
		padding: 0 2vw;
		height: 100vh;
		will-change: transform;
	}

	.g-lead {
		flex-shrink: 0;
		width: 20vw;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 2vw;
	}

	.g-lead-text {
		font-family: 'Space Mono', monospace;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #8a8580;
		writing-mode: vertical-rl;
		transform: rotate(180deg);
	}

	.g-trail {
		flex-shrink: 0;
		width: 8vw;
	}

	.g-card {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.g-frame {
		overflow: hidden;
		border-radius: 3px;
		height: 68vh;
		flex-shrink: 0;
	}

	.g-meta {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		padding: 0 0.15rem;
	}

	.g-label {
		font-family: 'Space Mono', monospace;
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #9a9590;
		flex-shrink: 0;
	}

	.g-desc {
		font-family: 'Inter', sans-serif;
		font-size: 0.78rem;
		font-weight: 400;
		color: #5a5550;
	}

	.g-counter {
		position: absolute;
		bottom: 2rem;
		right: clamp(2rem, 4vw, 4rem);
		display: flex;
		align-items: baseline;
		gap: 0.3em;
		font-family: 'Space Mono', monospace;
		font-size: 0.65rem;
		letter-spacing: 0.05em;
		color: #9a9590;
		z-index: 2;
	}

	.g-counter-current {
		color: #1a1a1a;
		font-weight: 700;
	}

	.g-counter-sep {
		opacity: 0.4;
	}

	@media (max-width: 768px) {
		.g-frame {
			height: 50vh;
			width: 80vw;
		}

		.g-lead {
			width: 10vw;
		}

		.g-lead-text {
			display: none;
		}
	}
</style>
