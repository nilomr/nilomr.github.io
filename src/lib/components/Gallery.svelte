<script>
	import { onMount } from 'svelte';
	import WebGLImage from './WebGLImage.svelte';

	const images = [
		{
			src: '/images/mng1.jpg',
			alt: 'Reindeer herders crossing a river at golden hour, Mongolia',
			label: 'Mongolia',
			desc: 'Tsaatan reindeer herders — Awaken',
			title: 'Awaken',
			detail:
				"Cinematography for Tom Lowe's feature documentary, following the last Tsaatan reindeer herders through the mountains of northern Mongolia.",
			role: 'Cinematographer',
			year: '2014',
			link: { label: 'IMDB', href: 'https://www.imdb.com/name/nm4945222' },
		},
		{
			src: '/images/lapwings.jpg',
			alt: 'Flock of lapwings taking flight over snow-covered trees',
			label: 'Oxford',
			desc: 'Wytham Woods, field research',
			title: 'Cultural evolution of bird song',
			detail:
				'Studying how song culture evolves in wild great tit populations. 950,000+ notes analysed across generations using custom ML pipelines.',
			role: 'Researcher',
			year: '2020–present',
			link: { label: 'pykanto', href: 'https://github.com/nilomr/pykanto' },
		},
		{
			src: '/images/KSP06883_2.jpg',
			alt: 'Cinematographer filming reindeer herders from a river',
			label: 'On set',
			desc: 'Northern Mongolia, 2014',
			title: 'Voyage of Time',
			detail:
				"Camera operator on Terrence Malick's Voyage of Time. Shot across four continents over three years.",
			role: 'Camera Operator',
			year: '2013–2016',
			link: { label: 'IMDB', href: 'https://www.imdb.com/name/nm4945222' },
		},
		{
			src: '/images/garza.jpg',
			alt: 'Egret catching fish in backlit water',
			label: 'Doñana',
			desc: 'Little egret',
			title: 'sedum.studio',
			detail:
				'Data visualisation and consulting studio. Transforming complex scientific datasets into clear, compelling visual narratives.',
			role: 'Founder',
			year: '2024',
			link: { label: 'sedum.studio', href: 'https://www.sedum.studio' },
		},
	];

	let wrapperEl = $state(null);
	let activeCard = $state(-1);

	function toggleCard(i) {
		activeCard = activeCard === i ? -1 : i;
	}

	onMount(async () => {
		const gsap = (await import('gsap')).default;
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);

		const track = wrapperEl.querySelector('.g-track');
		const getScrollDistance = () => track.scrollWidth - window.innerWidth;

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

		// Refresh ScrollTrigger once images have loaded and set their widths
		let lastWidth = 0;
		let stableFrames = 0;
		function waitForImages() {
			const currentWidth = track.scrollWidth;
			if (currentWidth !== lastWidth) {
				lastWidth = currentWidth;
				stableFrames = 0;
			} else {
				stableFrames++;
			}
			if (stableFrames > 10) {
				ScrollTrigger.refresh();
			} else {
				requestAnimationFrame(waitForImages);
			}
		}
		requestAnimationFrame(waitForImages);

		// Counter
		const counter = wrapperEl.querySelector('.g-counter-current');
		if (counter) {
			ScrollTrigger.create({
				trigger: wrapperEl,
				start: 'top top',
				end: () => `+=${getScrollDistance()}`,
				scrub: true,
				onUpdate: (self) => {
					const idx = Math.min(
						images.length,
						Math.floor(self.progress * images.length) + 1
					);
					counter.textContent = String(idx).padStart(2, '0');
				},
			});
		}

		// Animate overlay elements when a card is revealed
		const observer = new MutationObserver(() => {
			const activeOverlay = wrapperEl.querySelector('.g-card.is-active .g-overlay');
			if (activeOverlay) {
				const els = activeOverlay.querySelectorAll('.g-ov-line');
				gsap.fromTo(
					els,
					{ y: 16, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						stagger: 0.07,
						duration: 0.5,
						ease: 'power3.out',
						delay: 0.15,
					}
				);
			}
		});
		observer.observe(wrapperEl, { attributes: true, subtree: true, attributeFilter: ['class'] });

		return () => observer.disconnect();
	});
</script>

<section class="g-wrapper" bind:this={wrapperEl}>
	<div class="g-track">
		<div class="g-lead">
			<span class="g-lead-text">Visual Work</span>
		</div>

		{#each images as image, i}
			<article class="g-card" class:is-active={activeCard === i}>
				<div class="g-frame" role="button" tabindex="0" onclick={() => toggleCard(i)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleCard(i))}>
					<WebGLImage src={image.src} alt={image.alt} revealed={activeCard === i} />

					<!-- Hover hint -->
					<div class="g-hint" class:hidden={activeCard === i}>
						<span>View project</span>
					</div>

					<!-- Overlay content -->
					<div class="g-overlay" class:visible={activeCard === i}>
						<div class="g-ov-inner">
							<span class="g-ov-line g-ov-role">{image.role}</span>
							<h3 class="g-ov-line g-ov-title">{image.title}</h3>
							<p class="g-ov-line g-ov-detail">{image.detail}</p>
							<div class="g-ov-line g-ov-footer">
								<span class="g-ov-year">{image.year}</span>
								{#if image.link}
									<a
										href={image.link.href}
										target="_blank"
										rel="noopener noreferrer"
										class="g-ov-link"
										onclick={(e) => e.stopPropagation()}
									>
										{image.link.label} &nearr;
									</a>
								{/if}
							</div>
						</div>
						<button class="g-ov-close" onclick={(e) => { e.stopPropagation(); activeCard = -1; }} aria-label="Close">
							<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
								<line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" stroke-width="1.2" />
								<line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" stroke-width="1.2" />
							</svg>
						</button>
					</div>
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
		min-width: 40vw;
		flex-shrink: 0;
		position: relative;
		cursor: pointer;
	}

	/* Hover hint */
	.g-hint {
		position: absolute;
		bottom: clamp(1rem, 2vh, 1.5rem);
		right: clamp(1rem, 2vh, 1.5rem);
		z-index: 1;
		opacity: 0;
		transform: translateY(4px);
		transition: opacity 0.35s ease, transform 0.35s ease;
		pointer-events: none;
	}

	.g-hint.hidden {
		display: none;
	}

	.g-frame:hover .g-hint {
		opacity: 1;
		transform: translateY(0);
	}

	.g-hint span {
		font-family: 'Space Mono', monospace;
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #fff;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		padding: 0.4em 0.8em;
		border-radius: 2px;
	}

	/* Overlay */
	.g-overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		align-items: flex-end;
		padding: clamp(1.5rem, 3vh, 2.5rem);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.4s ease;
	}

	.g-overlay.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.g-ov-inner {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 380px;
	}

	.g-ov-line {
		opacity: 0;
	}

	.g-overlay.visible .g-ov-line {
		/* Animated via GSAP, but fallback */
		opacity: 1;
	}

	.g-ov-role {
		font-family: 'Space Mono', monospace;
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.5);
	}

	.g-ov-title {
		font-family: 'Space Mono', monospace;
		font-size: clamp(1.1rem, 2vw, 1.6rem);
		font-weight: 700;
		color: #fff;
		margin: 0;
		line-height: 1.25;
		letter-spacing: -0.01em;
	}

	.g-ov-detail {
		font-family: 'Inter', sans-serif;
		font-size: 0.82rem;
		font-weight: 400;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.75);
		margin: 0;
	}

	.g-ov-footer {
		display: flex;
		align-items: baseline;
		gap: 1.2rem;
		margin-top: 0.3rem;
	}

	.g-ov-year {
		font-family: 'Space Mono', monospace;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		letter-spacing: 0.05em;
	}

	.g-ov-link {
		font-family: 'Space Mono', monospace;
		font-size: 0.65rem;
		color: #fff;
		text-decoration: none;
		letter-spacing: 0.05em;
		position: relative;
		padding-bottom: 1px;
		transition: opacity 0.3s ease;
	}

	.g-ov-link::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 1px;
		background: rgba(255, 255, 255, 0.4);
		transform: scaleX(0);
		transform-origin: right;
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.g-ov-link:hover::after {
		transform: scaleX(1);
		transform-origin: left;
	}

	.g-ov-close {
		position: absolute;
		top: clamp(1rem, 2vh, 1.5rem);
		right: clamp(1rem, 2vh, 1.5rem);
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		padding: 0.5rem;
		transition: color 0.2s ease, transform 0.2s ease;
	}

	.g-ov-close:hover {
		color: #fff;
		transform: scale(1.15);
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

		.g-ov-inner {
			max-width: 90%;
		}
	}
</style>
