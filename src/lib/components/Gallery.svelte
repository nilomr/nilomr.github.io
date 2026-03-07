<script>
	import { onMount } from "svelte";
	import WebGLImage from "./WebGLImage.svelte";
	import Gallery3DCard from "./Gallery3DCard.svelte";

	const items = [
		{
			src: "/images/stream-2.png",
			ar: "2941/1670",
			alt: "Interactive data exploration interface",
			label: "data visualization",
			desc: "Real-time data dashboard",
			title: "Interactive data exploration interface",
			detail: "Consultancy work for the citizen science project BirdNET at Cornell University. This interactive system was developed for a visitor centre, allowing the public to explore both real-time and historical patterns in biodiversity data. The interface was designed to make large acoustic monitoring datasets accessible and intuitive.",
			role: "Design and development",
			year: "2025",
			link: {
				label: "Cornell Lab of Ornithology",
				href: "https://www.birds.cornell.edu/home/",
			},
		},
		{
			src: "/images/nilo-film.webp",
			ar: "1/1",
			alt: "Trailer premiere for the documentary film Awaken in Times Square",
			label: "cinematography",
			desc: "Trailer premiere in Times Square",
			title: "Second unit direction and cinematography",
			detail: "Between 2011 and 2016, I worked in documentary film production as a cinematographer and second unit director. This sequence, shot in Belarus, opens the trailer for Awaken, which screened in Times Square, New York. Over those years I led small international units across three continents, capturing large-format landscape and nature footage in often demanding conditions.",
			role: "Second unit director and cinematographer",
			year: "2012–2017",
			link: {
				label: "IMDb",
				href: "https://www.imdb.com/name/nm4945222",
			},
		},
		{
			type: "3d",
			alt: "3D data visualization of an Acheulean handaxe",
			label: "digital heritage",
			desc: "Making data accessible and engaging",
			title: "Digital data-centric design",
			detail: "I analyze and visualize complex data—from physical artifacts to large-scale statistical trends—to extract insights and create evidence-based narratives for both experts and the public. This example shows a stone tool from the African Early Stone Age.",
			credits:
				"From the Fish Hoek Valley Museum collection · Scanned by Global Digital Heritage · CC BY-NC 4.0",
			role: "Designer and developer",
			year: "Ongoing",
			link: {
				label: "GDH",
				href: "https://www.globaldigitalheritage.org/",
			},
		},

{
    type: "video",
    src: "/images/canopyviewer.mp4",
    ar: "16/9",
    alt: "Canopy Viewer — interactive web app for exploring tree canopy data from aerial imagery",
    label: "Interactive",
    desc: "From aerial imagery to interactive mapping",
    title: "Canopy viewer",
    detail: "I built a machine learning pipeline to detect and map individual tree species from aerial photography — then turned the results into an interactive browser tool anyone can explore. Users can slide between raw imagery and segmentation overlays, and inspect species-specific data in real time. Part of a UKRI-funded project at the University of Oxford.",
    role: "Design and development",
    year: "2025",
},


		{
			src: "/images/journal-2.jpg",
			ar: "1/1",
			alt: "Published paper in Current Biology on cultural evolution in bird song",
			label: "Research",
			desc: "Biology & computational science",
			title: "Scientific research",
			detail: "I hold a PhD in Biology from the University of Oxford, where I went on to work as a postdoctoral researcher and remain a visiting researcher. My research on ecology, bioacoustics, and cultural evolution has been published in journals including Current Biology and Methods in Ecology and Evolution, and covered by international media.",
			role: "Researcher",
			year: "2019–present",
			link: {
				label: "Google Scholar",
				href: "https://scholar.google.com/citations?user=X6MZnJ4AAAAJ",
			},
			logos: [
				"/logos/bbc.svg",
				"/logos/npr.svg",
				"/logos/the-guardian.svg",
				"/logos/the-times.svg",
				"/logos/the-washington-post.svg",
			],
		},

		{
			src: "/images/6-starling-map.webp",
			ar: "4/3",
			alt: "Distribution map of starling sightings from the Big Garden Birdwatch",
			label: "Conservation science",
			desc: "Monitoring biodiversity at scale",
			title: "Big Garden Birdwatch",
			detail: "As a Senior Conservation Scientist at the RSPB, I work on the Big Garden Birdwatch — one of the world’s largest citizen science projects, engaging half a million participants each year. I develop statistical methods and data pipelines to turn millions of public observations into meaningful trends, helping to track how common garden birds are faring across the UK.",
			role: "Senior Conservation Scientist",
			year: "2026–present",
			link: {
				label: "RSPB",
				href: "https://www.rspb.org.uk/whats-happening/big-garden-birdwatch",
			},
		},

	];

	let wrapperEl = $state(null);
	let activeCard = $state(-1);
	let isMobile = $state(false);
	let mobileScrollEl = $state(null);
	let mobileActiveIdx = $state(0);

	function toggleCard(i) {
		activeCard = activeCard === i ? -1 : i;
	}

	onMount(async () => {
		isMobile =
			window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
			window.innerWidth <= 768;

		const gsap = (await import("gsap")).default;
		const { ScrollTrigger } = await import("gsap/ScrollTrigger");
		gsap.registerPlugin(ScrollTrigger);

		if (isMobile) {
			// Mobile: observe scroll position for active card indicator
			if (mobileScrollEl) {
				const observer = new IntersectionObserver(
					(entries) => {
						entries.forEach((entry) => {
							if (
								entry.isIntersecting &&
								entry.intersectionRatio > 0.5
							) {
								const idx = Number(entry.target.dataset.idx);
								if (!isNaN(idx)) mobileActiveIdx = idx;
							}
						});
					},
					{ root: mobileScrollEl, threshold: 0.5 },
				);
				mobileScrollEl
					.querySelectorAll(".m-card")
					.forEach((card) => observer.observe(card));
				return () => observer.disconnect();
			}
			return;
		}

		// Desktop: horizontal scroll gallery (unchanged)
		const track = wrapperEl.querySelector(".g-track");
		const getScrollDistance = () => track.scrollWidth - window.innerWidth;

		gsap.to(track, {
			x: () => -getScrollDistance(),
			ease: "none",
			scrollTrigger: {
				trigger: wrapperEl,
				start: "top top",
				end: () => `+=${getScrollDistance()}`,
				pin: true,
				pinSpacing: true,
				scrub: 1,
				invalidateOnRefresh: true,
			},
		});

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

		const counter = wrapperEl.querySelector(".g-counter-current");
		if (counter) {
			ScrollTrigger.create({
				trigger: wrapperEl,
				start: "top top",
				end: () => `+=${getScrollDistance()}`,
				scrub: true,
				onUpdate: (self) => {
					const idx = Math.min(
						items.length,
						Math.floor(self.progress * items.length) + 1,
					);
					counter.textContent = String(idx).padStart(2, "0");
				},
			});
		}

		const observer = new MutationObserver(() => {
			const activeOverlay = wrapperEl.querySelector(
				".g-card.is-active .g-overlay",
			);
			if (activeOverlay) {
				const els = activeOverlay.querySelectorAll(".g-ov-line");
				gsap.fromTo(
					els,
					{ y: 16, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						stagger: 0.07,
						duration: 0.5,
						ease: "power3.out",
						delay: 0.15,
					},
				);
			}
		});
		observer.observe(wrapperEl, {
			attributes: true,
			subtree: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	});
</script>

<!-- Mobile Gallery -->
{#if isMobile}
	<section class="m-gallery">
		<div class="m-header">
			<span class="m-label">Visual Work</span>
			<div class="m-pips">
				{#each items as _, i}
					<span class="m-pip" class:active={mobileActiveIdx === i}
						>+</span
					>
				{/each}
			</div>
		</div>
		<div class="m-scroll" bind:this={mobileScrollEl}>
			{#each items as item, i}
				<article
					class="m-card"
					class:is-active={activeCard === i}
					data-idx={i}
				>
					<div
						class="m-image-wrap"
						class:is-3d={item.type === "3d"}
						role="button"
						tabindex="0"
						onclick={() => toggleCard(i)}
						onkeydown={(e) =>
							(e.key === "Enter" || e.key === " ") &&
							(e.preventDefault(), toggleCard(i))}
					>
						{#if item.type === "3d"}
							<Gallery3DCard revealed={activeCard === i} />
						{:else if item.type === "video"}
							<video
								src={item.src}
								class="m-video"
								aria-label={item.alt}
								autoplay
								loop
								muted
								playsinline
								preload="metadata"
							></video>
						{:else}
							<img
								src={item.src}
								alt={item.alt}
								class="m-image"
								loading={i === 0 ? "eager" : "lazy"}
							/>
						{/if}

						<!-- Overlay -->
						<div class="m-overlay" class:visible={activeCard === i}>
							<div class="m-ov-inner">
								<span class="m-ov-role">{item.role}</span>
								<h3 class="m-ov-title">{item.title}</h3>
								<p class="m-ov-detail">{item.detail}</p>
								{#if item.logos}
									<div class="m-ov-logos">
										{#each item.logos as logo}
											<img
												src={logo}
												alt=""
												class="g-ov-logo"
												aria-hidden="true"
											/>
										{/each}
									</div>
								{/if}
								{#if item.credits}
									<p class="m-ov-credits">{item.credits}</p>
								{/if}
								<div class="m-ov-footer">
									<span class="m-ov-year">{item.year}</span>
									{#if item.link}
										<a
											href={item.link.href}
											target="_blank"
											rel="noopener noreferrer"
											class="m-ov-link"
											onclick={(e) => e.stopPropagation()}
										>
											{item.link.label} &nearr;
										</a>
									{/if}
								</div>
							</div>
							<button
								class="m-ov-close"
								onclick={(e) => {
									e.stopPropagation();
									activeCard = -1;
								}}
								aria-label="Close"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 18 18"
									fill="none"
								>
									<line
										x1="3"
										y1="3"
										x2="15"
										y2="15"
										stroke="currentColor"
										stroke-width="1.5"
									/>
									<line
										x1="15"
										y1="3"
										x2="3"
										y2="15"
										stroke="currentColor"
										stroke-width="1.5"
									/>
								</svg>
							</button>
						</div>
					</div>

					<div class="m-meta">
						<span class="m-meta-label">{item.label}</span>
						<span class="m-meta-desc">{item.desc}</span>
					</div>
				</article>
			{/each}
		</div>
	</section>
{:else}
	<!-- Desktop Gallery (unchanged) -->
	<section class="g-wrapper" bind:this={wrapperEl}>
		<div class="g-track">
			<div class="g-lead">
				<span class="g-lead-text">Visual Work</span>
			</div>

			{#each items as item, i}
				<article
					class="g-card"
					class:is-active={activeCard === i}
					class:is-3d={item.type === "3d"}
				>
					<div
						class="g-frame"
						class:is-3d={item.type === "3d"}
						style={item.ar ? `aspect-ratio: ${item.ar}` : ""}
						role="button"
						tabindex="0"
						onclick={() => toggleCard(i)}
						onkeydown={(e) =>
							(e.key === "Enter" || e.key === " ") &&
							(e.preventDefault(), toggleCard(i))}
					>
						{#if item.type === "3d"}
							<Gallery3DCard revealed={activeCard === i} />
						{:else if item.type === "video"}
							<WebGLImage
								src={item.src}
								alt={item.alt}
								revealed={activeCard === i}
								type="video"
							/>
						{:else}
							<WebGLImage
								src={item.src}
								alt={item.alt}
								revealed={activeCard === i}
							/>
						{/if}

						<div class="g-hint" class:hidden={activeCard === i}>
							<span>View project</span>
						</div>

						<div class="g-overlay" class:visible={activeCard === i}>
							<div class="g-ov-inner">
								<span class="g-ov-line g-ov-role"
									>{item.role}</span
								>
								<h3 class="g-ov-line g-ov-title">
									{item.title}
								</h3>
								<p class="g-ov-line g-ov-detail">
									{item.detail}
								</p>
								{#if item.logos}
									<div class="g-ov-line g-ov-logos">
										{#each item.logos as logo}
											<img
												src={logo}
												alt=""
												class="g-ov-logo"
												aria-hidden="true"
											/>
										{/each}
									</div>
								{/if}
								{#if item.credits}
									<p class="g-ov-line g-ov-credits">
										{item.credits}
									</p>
								{/if}
								<div class="g-ov-line g-ov-footer">
									<span class="g-ov-year">{item.year}</span>
									{#if item.link}
										<a
											href={item.link.href}
											target="_blank"
											rel="noopener noreferrer"
											class="g-ov-link"
											onclick={(e) => e.stopPropagation()}
										>
											{item.link.label} &nearr;
										</a>
									{/if}
								</div>
							</div>
							<button
								class="g-ov-close"
								onclick={(e) => {
									e.stopPropagation();
									activeCard = -1;
								}}
								aria-label="Close"
							>
								<svg
									width="18"
									height="18"
									viewBox="0 0 18 18"
									fill="none"
								>
									<line
										x1="3"
										y1="3"
										x2="15"
										y2="15"
										stroke="currentColor"
										stroke-width="1.2"
									/>
									<line
										x1="15"
										y1="3"
										x2="3"
										y2="15"
										stroke="currentColor"
										stroke-width="1.2"
									/>
								</svg>
							</button>
						</div>
					</div>

					<div class="g-meta">
						<span class="g-label">{item.label}</span>
						<span class="g-desc">{item.desc}</span>
					</div>
				</article>
			{/each}

			<div class="g-trail"></div>
		</div>

		<div class="g-counter">
			<span class="g-counter-current">01</span>
			<span class="g-counter-sep">/</span>
			<span class="g-counter-total"
				>{String(items.length).padStart(2, "0")}</span
			>
		</div>
	</section>
{/if}

<style>
	/* ── Mobile Gallery ── */
	.m-gallery {
		padding: 4rem 0 2rem;
	}

	.m-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 1.5rem 1.2rem;
	}

	.m-label {
		font-family: "Space Mono", monospace;
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #8a8580;
	}

	.m-pips {
		display: flex;
		gap: 0.35rem;
		align-items: center;
	}

	.m-pip {
		font-family: "Space Mono", monospace;
		font-size: 1rem;
		font-weight: 400;
		color: #c0bdb8;
		line-height: 1;
		transition:
			color 0.35s ease,
			transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		display: inline-block;
	}

	.m-pip.active {
		color: #1a1a1a;
		transform: rotate(45deg) scale(1.3);
	}

	.m-scroll {
		--card-w: clamp(18.5rem, 86vw, 28rem);
		display: flex;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		gap: 0.9rem;
		padding: 0;
		scroll-padding-inline: calc((100% - var(--card-w)) / 2);
	}

	.m-scroll::before,
	.m-scroll::after {
		content: "";
		flex: 0 0 calc((100% - var(--card-w)) / 2);
	}

	.m-scroll::-webkit-scrollbar {
		display: none;
	}

	.m-card {
		flex: 0 0 var(--card-w);
		scroll-snap-align: center;
		scroll-snap-stop: always;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		position: relative;
		isolation: isolate;
	}

	.m-image-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 2 / 3;
		border-radius: 6px;
		overflow: hidden;
		-webkit-tap-highlight-color: transparent;
	}

	.m-image-wrap.is-3d {
		overflow: visible;
	}

	@media (max-width: 768px) {
		.m-image-wrap.is-3d {
			overflow: hidden;
		}
	}

	.m-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.m-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Mobile overlay */
	.m-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
		display: flex;
		align-items: flex-end;
		padding: 1.5rem;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.35s ease;
	}

	.m-overlay.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.m-ov-inner {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.m-ov-role {
		font-family: "Space Mono", monospace;
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.5);
	}

	.m-ov-title {
		font-family: "Space Mono", monospace;
		font-size: 1.2rem;
		font-weight: 700;
		color: #fff;
		margin: 0;
		line-height: 1.25;
		letter-spacing: -0.01em;
	}

	.m-ov-detail {
		font-family: "Inter", sans-serif;
		font-size: 0.82rem;
		font-weight: 400;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.75);
		margin: 0;
	}

	.m-ov-credits {
		font-family: "Inter", sans-serif;
		font-size: 0.68rem;
		font-weight: 400;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.55);
		margin: 0.4rem 0 0;
	}

	.m-ov-footer {
		display: flex;
		align-items: baseline;
		gap: 1.2rem;
		margin-top: 0.3rem;
	}

	.m-ov-year {
		font-family: "Space Mono", monospace;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		letter-spacing: 0.05em;
	}

	.m-ov-link {
		font-family: "Space Mono", monospace;
		font-size: 0.65rem;
		color: #fff;
		text-decoration: none;
		letter-spacing: 0.05em;
		border-bottom: 1px solid rgba(255, 255, 255, 0.3);
		padding-bottom: 1px;
	}

	.m-ov-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.6rem;
		-webkit-tap-highlight-color: transparent;
	}

	.m-meta {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		padding: 0 0.15rem;
	}

	.m-meta-label {
		font-family: "Space Mono", monospace;
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #9a9590;
		flex-shrink: 0;
	}

	.m-meta-desc {
		font-family: "Inter", sans-serif;
		font-size: 0.75rem;
		font-weight: 400;
		color: #5a5550;
	}

	/* ── Desktop Gallery (unchanged) ── */
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
		font-family: "Space Mono", monospace;
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

	.g-card.is-3d {
		--g-3d-min-width: clamp(30rem, 50vw, 40rem);
		--g-3d-reserve-left: clamp(0.5rem, 1vw, 1rem);
		margin-left: var(--g-3d-reserve-left);
	}

	.g-frame {
		overflow: hidden;
		border-radius: 3px;
		height: 68vh;
		flex-shrink: 0;
		position: relative;
		cursor: pointer;
	}

	.g-frame.is-3d {
		overflow: visible;
		min-width: max(var(--g-3d-min-width), 42vw);
	}

	.g-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.g-frame.is-3d .g-overlay.visible {
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(3px);
		-webkit-backdrop-filter: blur(3px);
	}

	@media (max-width: 1180px) and (min-width: 769px) {
		.g-card.is-3d {
			--g-3d-min-width: clamp(28rem, 54vw, 34rem);
			--g-3d-reserve-left: clamp(0.65rem, 1.5vw, 1.25rem);
		}
	}

	@media (min-width: 1500px) {
		.g-card.is-3d {
			--g-3d-reserve-left: clamp(0.2rem, 0.45vw, 0.6rem);
		}
	}

	.g-hint {
		position: absolute;
		bottom: clamp(1rem, 2vh, 1.5rem);
		right: clamp(1rem, 2vh, 1.5rem);
		z-index: 1;
		opacity: 0;
		transform: translateY(4px);
		transition:
			opacity 0.35s ease,
			transform 0.35s ease;
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
		font-family: "Space Mono", monospace;
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
		border-radius: 3px;
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
		opacity: 1;
	}

	.g-ov-role {
		font-family: "Space Mono", monospace;
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: rgba(255, 255, 255, 0.5);
	}

	.g-ov-title {
		font-family: "Space Mono", monospace;
		font-size: clamp(1.1rem, 2vw, 1.6rem);
		font-weight: 700;
		color: #fff;
		margin: 0;
		line-height: 1.25;
		letter-spacing: -0.01em;
	}

	.g-ov-detail {
		font-family: "Inter", sans-serif;
		font-size: 0.82rem;
		font-weight: 400;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.75);
		margin: 0;
	}

	.g-ov-credits {
		font-family: "Inter", sans-serif;
		font-size: 0.7rem;
		font-weight: 400;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.5);
		margin: 0.5rem 0 0;
	}

	.g-ov-footer {
		display: flex;
		align-items: baseline;
		gap: 1.2rem;
		margin-top: 0.3rem;
	}

	.g-ov-year {
		font-family: "Space Mono", monospace;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		letter-spacing: 0.05em;
	}

	.g-ov-link {
		font-family: "Space Mono", monospace;
		font-size: 0.65rem;
		color: #fff;
		text-decoration: none;
		letter-spacing: 0.05em;
		position: relative;
		padding-bottom: 1px;
		transition: opacity 0.3s ease;
	}

	.g-ov-link::after {
		content: "";
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
		transition:
			color 0.2s ease,
			transform 0.2s ease;
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
		font-family: "Space Mono", monospace;
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #9a9590;
		flex-shrink: 0;
	}

	.g-desc {
		font-family: "Inter", sans-serif;
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
		font-family: "Space Mono", monospace;
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

	.g-ov-logos,
	.m-ov-logos {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		margin-top: 0.25rem;
	}

	.g-ov-logo {
		height: 14px;
		width: auto;
		filter: brightness(0) invert(1);
		opacity: 0.7;
	}
</style>
