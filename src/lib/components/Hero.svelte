<script>
	import { onMount } from "svelte";
	import { contentReady } from "$lib/stores/ready";
	import { m } from "$lib/paraglide/messages";
	import { page } from "$app/state";
	import { localizeHref, getLocale } from "$lib/paraglide/runtime";

	let section = $state(null);
	let isMobile = $state(false);
	let expandedRow = $state(-1);

	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";

	let disciplines = $derived([
		{
			idx: "01",
			title: m.disc_01_title(),
			desc: m.disc_01_desc(),
		},
		{
			idx: "02",
			title: m.disc_02_title(),
			desc: m.disc_02_desc(),
		},
		{
			idx: "03",
			title: m.disc_03_title(),
			desc: m.disc_03_desc(),
		},
		{
			idx: "04",
			title: m.disc_04_title(),
			desc: m.disc_04_desc(),
		},
	]);

	function scrambleText(el, finalText, duration = 800) {
		return new Promise((resolve) => {
			const length = finalText.length;
			const start = performance.now();
			const step = (now) => {
				const progress = Math.min((now - start) / duration, 1);
				let result = "";
				for (let i = 0; i < length; i++) {
					if (finalText[i] === " ") {
						result += " ";
					} else if (progress > (i / length) * 0.8 + 0.2) {
						result += finalText[i];
					} else {
						result +=
							chars[Math.floor(Math.random() * chars.length)];
					}
				}
				el.textContent = result;
				if (progress < 1) requestAnimationFrame(step);
				else resolve();
			};
			requestAnimationFrame(step);
		});
	}

	function getRoles() {
		return [
			m.role_researcher(),
			m.role_developer(),
			m.role_filmmaker(),
			m.role_designer(),
		];
	}

	async function cycleRoles(el, isAlive = () => true) {
		let idx = 0;
		while (isAlive()) {
			await new Promise((r) => setTimeout(r, 2000));
			if (!isAlive()) break;
			const roles = getRoles();
			idx = (idx + 1) % roles.length;
			await scrambleText(el, roles[idx], 600);
		}
	}

	let gsapRef = null;
	let activeTweens = new Map();

	function toggleRow(i) {
		if (!section || !gsapRef) return;
		const detail = section.querySelector(`.h-detail[data-row="${i}"]`);
		if (!detail) return;

		if (activeTweens.has(i)) {
			activeTweens.get(i).kill();
			activeTweens.delete(i);
		}

		if (expandedRow === i) {
			const tween = gsapRef.to(detail, {
				height: 0,
				opacity: 0,
				duration: 0.4,
				ease: "power3.inOut",
				onComplete: () => activeTweens.delete(i),
			});
			activeTweens.set(i, tween);
			expandedRow = -1;
		} else {
			if (expandedRow !== -1) {
				const prevIdx = expandedRow;
				const prevDetail = section.querySelector(
					`.h-detail[data-row="${prevIdx}"]`,
				);
				if (prevDetail) {
					if (activeTweens.has(prevIdx)) {
						activeTweens.get(prevIdx).kill();
					}
					const closeTween = gsapRef.to(prevDetail, {
						height: 0,
						opacity: 0,
						duration: 0.3,
						ease: "power2.inOut",
						onComplete: () => activeTweens.delete(prevIdx),
					});
					activeTweens.set(prevIdx, closeTween);
				}
			}

			expandedRow = i;
			gsapRef.set(detail, { height: "auto", opacity: 1 });
			const naturalHeight = detail.offsetHeight;
			gsapRef.set(detail, { height: 0, opacity: 0 });

			const tween = gsapRef.to(detail, {
				height: naturalHeight,
				opacity: 1,
				duration: 0.45,
				ease: "power3.out",
				onComplete: () => {
					gsapRef.set(detail, { height: "auto" });
					activeTweens.delete(i);
				},
			});
			activeTweens.set(i, tween);
		}
	}

	onMount(() => {
		if (!section) return;
		let destroyed = false;
		isMobile =
			window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
			window.innerWidth <= 768;

		let gsapLoaded = Promise.all([
			import("gsap").then((m) => m.default),
			import("gsap/ScrollTrigger").then((m) => m.ScrollTrigger),
		]);

		const unsub = contentReady.subscribe(async (ready) => {
			if (!ready || destroyed || !section) return;
			const [gsap, ScrollTrigger] = await gsapLoaded;
			if (destroyed || !section) return;
			gsapRef = gsap;
			gsap.registerPlugin(ScrollTrigger);

		if (isMobile) {
			const nameLines = section.querySelectorAll(".mh-name-line");
			const rule = section.querySelector(".mh-rule");
			const discEls = section.querySelectorAll(".mh-disc");
			const discDots = section.querySelectorAll(".mh-disc-dot");
			const footer = section.querySelector(".mh-footer");
			const scrollHint = section.querySelector(".scroll-hint");
			const roleSpan = section.querySelector(".mh-role");

			const nameEls = [...nameLines];
			const nameTexts = nameEls.map((el) => el.textContent);
			nameEls.forEach((el) => (el.textContent = ""));

			gsap.set(nameLines, { y: 20 });
			gsap.set(rule, { scaleX: 0 });
			gsap.set(discEls, { y: 12 });
			gsap.set(footer, { y: 10 });

			const tl = gsap.timeline({ delay: 0.2 });

			nameEls.forEach((el, i) => {
				tl.to(
					el,
					{
						opacity: 1,
						y: 0,
						duration: 0.5,
						ease: "power3.out",
						onStart: () => scrambleText(el, nameTexts[i], 700),
					},
					i * 0.12,
				);
			});

			tl.to(
				rule,
				{ scaleX: 1, duration: 0.8, ease: "power3.inOut" },
				0.3,
			);
			tl.to(
				discEls,
				{
					opacity: 1,
					y: 0,
					stagger: 0.06,
					duration: 0.5,
					ease: "power3.out",
				},
				0.5,
			);
			tl.to(
				discDots,
				{
					opacity: 1,
					stagger: 0.06,
					duration: 0.4,
					ease: "power2.out",
				},
				0.55,
			);
			tl.to(
				footer,
				{ opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
				0.7,
			);
			tl.to(
				scrollHint,
				{ opacity: 1, duration: 0.8, ease: "power2.out" },
				1.0,
			);

			if (roleSpan) {
				roleSpan.textContent = getRoles()[0];
				setTimeout(() => cycleRoles(roleSpan, () => !destroyed && !!section), 0);
			}

			gsap.to(section.querySelector(".mh-content"), {
				y: -60,
				opacity: 0.15,
				scrollTrigger: {
					trigger: section,
					start: "top top",
					end: "bottom top",
					scrub: 0.4,
				},
			});
			gsap.to(scrollHint, {
				opacity: 0,
				y: 20,
				scrollTrigger: {
					trigger: section,
					start: "top top",
					end: "15% top",
					scrub: true,
				},
			});

			return;
		}

		// Desktop
		const rows = section.querySelectorAll(".h-row");
		const textEls = [...section.querySelectorAll(".h-text")];
		const footer = section.querySelector(".h-footer");
		const scrollHint = section.querySelector(".scroll-hint");
		const roleSpan = section.querySelector(".h-role");

		const finalTexts = textEls.map((el) => el.textContent);
		textEls.forEach((el) => (el.textContent = ""));

		const details = section.querySelectorAll(".h-detail");
		details.forEach((d) => gsap.set(d, { height: 0, opacity: 0 }));

		gsap.set(rows, { y: 24 });
		gsap.set(footer, { y: 12 });

		const tl = gsap.timeline({ delay: 0.3 });

		rows.forEach((row, i) => {
			tl.to(
				row,
				{
					opacity: 1,
					y: 0,
					duration: 0.5,
					ease: "power3.out",
					onStart: () => scrambleText(textEls[i], finalTexts[i], 900),
				},
				i * 0.18,
			);
		});

		tl.to(
			footer,
			{ opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
			0.7,
		);
		tl.to(
			scrollHint,
			{ opacity: 1, duration: 0.8, ease: "power2.out" },
			1.0,
		);

		if (roleSpan) {
			roleSpan.textContent = getRoles()[0];
			setTimeout(() => cycleRoles(roleSpan, () => !destroyed && !!section), 0);
		}

		// Magnetic hover
		rows.forEach((row) => {
			const text = row.querySelector(".h-text");
			row.addEventListener("mousemove", (e) => {
				const rect = row.getBoundingClientRect();
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;
				gsap.to(text, {
					x: x * 0.05,
					y: y * 0.12,
					duration: 0.4,
					ease: "power2.out",
				});
			});
			row.addEventListener("mouseleave", () => {
				gsap.to(text, {
					x: 0,
					y: 0,
					duration: 0.6,
					ease: "elastic.out(1, 0.4)",
				});
			});
		});

		gsap.to(section.querySelector(".h-content"), {
			y: -100,
			opacity: 0.2,
			scrollTrigger: {
				trigger: section,
				start: "top top",
				end: "bottom top",
				scrub: 0.6,
			},
		});
		gsap.to(scrollHint, {
			opacity: 0,
			y: 20,
			scrollTrigger: {
				trigger: section,
				start: "top top",
				end: "15% top",
				scrub: true,
			},
		});

		});

		return () => {
			destroyed = true;
			unsub();
		};
	});
</script>

<section class="hero" bind:this={section}>
	<!-- Language switcher -->
	<nav class="lang-switch" aria-label="Language">
		{#each ['en', 'es', 'fr'] as loc}
			<a
				href={localizeHref(page.url.pathname, { locale: loc })}
				class="lang-btn"
				class:active={getLocale() === loc}
				data-sveltekit-reload
			>{loc.toUpperCase()}</a>
		{/each}
	</nav>

	{#if isMobile}
		<div class="mh-content">
			<div class="mh-name">
				<span class="mh-name-line">Nilo</span>
				<span class="mh-name-line">Merino</span>
				<span class="mh-name-line">Recalde</span>
			</div>

			<div class="mh-rule"></div>

			<div class="mh-disciplines">
				<span class="mh-disc">{m.mh_disc_research()}</span>
				<span class="mh-disc-dot"></span>
				<span class="mh-disc">{m.mh_disc_software()}</span>
				<span class="mh-disc-dot"></span>
				<span class="mh-disc">{m.mh_disc_design()}</span>
				<span class="mh-disc-dot"></span>
				<span class="mh-disc">{m.mh_disc_film()}</span>
			</div>

			<div class="mh-footer">
				<span class="mh-role"></span>
				<span class="mh-loc">{m.hero_location()}</span>
			</div>
		</div>
	{:else}
		<div class="h-content">
			<div class="h-lines">
				{#each disciplines as disc, i}
					<div
						class="h-row"
						class:is-expanded={expandedRow === i}
						role="button"
						tabindex="0"
						onclick={() => toggleRow(i)}
						onkeydown={(e) =>
							(e.key === "Enter" || e.key === " ") &&
							(e.preventDefault(), toggleRow(i))}
					>
						<div class="h-row-main">
							<span class="h-idx">{disc.idx}</span>
							<span class="h-text">{disc.title}</span>
							<span
								class="h-expand-icon"
								class:open={expandedRow === i}>+</span
							>
						</div>
						<div class="h-detail" data-row={i}>
							<p class="h-detail-text">{disc.desc}</p>
						</div>
					</div>
				{/each}
			</div>

			<div class="h-footer">
				<div class="h-id">
					<span class="h-name">Nilo Merino Recalde</span>
					<span class="h-sep">/</span>
					<span class="h-role"></span>
				</div>
				<p class="h-location">{m.hero_location()}</p>
			</div>
		</div>
	{/if}

	<div class="scroll-hint">
		<span class="scroll-label">{m.hero_scroll()}</span>
		<div class="scroll-arrow">↓</div>
	</div>
</section>

<style>
	.hero {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		position: relative;
		padding: 0 clamp(2rem, 8vw, 8rem);
	}

	/* ── Language switcher ── */
	.lang-switch {
		position: absolute;
		top: 1.5rem;
		right: clamp(2rem, 8vw, 8rem);
		display: flex;
		align-items: center;
		gap: 0.4em;
		z-index: 10;
	}

	.lang-btn {
		font-family: "Space Mono", monospace;
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #b0aba5;
		text-decoration: none;
		transition: color 0.25s ease;
		line-height: 1;
	}

	.lang-btn:hover {
		color: #5a5550;
	}

	.lang-btn.active {
		color: #5a5550;
	}

	.lang-btn + .lang-btn::before {
		content: "/";
		margin-right: 0.4em;
		color: #d0cdc8;
	}

	/* ── Mobile Hero ── */
	.mh-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-bottom: 2rem;
	}

	.mh-name {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.mh-name-line {
		font-family: "Space Mono", monospace;
		font-size: clamp(2.8rem, 14vw, 4.5rem);
		font-weight: 700;
		color: #1a1a1a;
		line-height: 0.95;
		letter-spacing: -0.04em;
		display: block;
		opacity: 0;
	}

	.mh-rule {
		height: 1px;
		background: rgba(0, 0, 0, 0.12);
		transform-origin: left;
		transform: scaleX(0);
		margin: 0.5rem 0;
	}

	.mh-disciplines {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.mh-disc {
		font-family: "Space Mono", monospace;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #5a5550;
		opacity: 0;
	}

	.mh-disc-dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: #c0bdb8;
		flex-shrink: 0;
		opacity: 0;
	}

	.mh-footer {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.5rem;
		opacity: 0;
	}

	.mh-role {
		font-family: "Space Mono", monospace;
		font-size: 0.6rem;
		color: #9a9590;
		letter-spacing: 0.04em;
		min-width: 10ch;
		display: inline-block;
	}

	.mh-loc {
		font-family: "Inter", sans-serif;
		font-size: 0.62rem;
		font-weight: 400;
		color: #a09a94;
		letter-spacing: 0.04em;
	}

	/* ── Desktop Hero ── */
	.h-content {
		display: flex;
		flex-direction: column;
		gap: clamp(3rem, 7vh, 6rem);
	}

	.h-lines {
		display: flex;
		flex-direction: column;
	}

	.h-row {
		display: flex;
		flex-direction: column;
		padding: clamp(0.7rem, 1.4vh, 1.1rem) 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		cursor: pointer;
		transition: background 0.3s ease;
		opacity: 0;
	}

	.h-row:first-child {
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.h-row:hover {
		background: rgba(0, 0, 0, 0.015);
	}

	.h-row-main {
		display: flex;
		align-items: baseline;
		gap: clamp(1rem, 2vw, 2rem);
		padding-right: clamp(1rem, 2vw, 2rem);
	}

	.h-idx {
		font-family: "Space Mono", monospace;
		font-size: clamp(0.55rem, 0.7vw, 0.65rem);
		color: #b0aba5;
		letter-spacing: 0.05em;
		flex-shrink: 0;
		min-width: 2ch;
		user-select: none;
	}

	.h-text {
		font-family: "Space Mono", monospace;
		font-size: clamp(1.1rem, 3.2vw, 2.6rem);
		font-weight: 700;
		color: #1a1a1a;
		line-height: 1.3;
		letter-spacing: -0.025em;
		display: inline-block;
		white-space: nowrap;
		flex: 1;
	}

	.h-expand-icon {
		font-family: "Space Mono", monospace;
		font-size: clamp(0.9rem, 1.5vw, 1.2rem);
		color: #c0bdb8;
		flex-shrink: 0;
		transition:
			transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			color 0.3s ease;
		user-select: none;
		line-height: 1;
	}

	.h-expand-icon.open {
		transform: rotate(45deg);
		color: #1a1a1a;
	}

	.h-row:hover .h-expand-icon {
		color: #9a9590;
	}

	.h-detail {
		overflow: hidden;
		padding-left: calc(2ch + clamp(1rem, 2vw, 2rem));
	}

	.h-detail-text {
		font-family: "Space Mono", monospace;
		font-size: clamp(0.7rem, 0.9vw, 0.8rem);
		font-weight: 400;
		line-height: 1.7;
		color: #5a5550;
		max-width: 620px;
		margin: 0;
		padding: 0.5rem 0 0.3rem;
		letter-spacing: 0.01em;
	}

	.h-footer {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		opacity: 0;
	}

	.h-id {
		display: flex;
		align-items: baseline;
		gap: 0.5em;
		font-family: "Space Mono", monospace;
		font-size: clamp(0.62rem, 0.85vw, 0.75rem);
		letter-spacing: 0.04em;
	}

	.h-name {
		color: #7a756f;
		font-weight: 400;
	}

	.h-sep {
		color: #c0bdb8;
	}

	.h-role {
		color: #9a9590;
		font-weight: 400;
		min-width: 10ch;
		display: inline-block;
	}

	.h-location {
		font-family: "Inter", sans-serif;
		font-size: clamp(0.58rem, 0.8vw, 0.68rem);
		font-weight: 400;
		color: #a09a94;
		letter-spacing: 0.04em;
		margin: 0;
	}

	/* ── Scroll indicator ── */
	.scroll-hint {
		position: absolute;
		bottom: 2.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		opacity: 0;
	}

	.scroll-label {
		font-family: "Space Mono", monospace;
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #a09a94;
	}

	.scroll-arrow {
		font-family: "Space Mono", monospace;
		font-size: 0.8rem;
		color: #b0aba5;
		animation: scrollBounce 2.4s ease-in-out infinite;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 0.5rem;
		letter-spacing: 0.1em;
	}

	@keyframes scrollBounce {
		0%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		50% {
			opacity: 0.9;
			transform: translateY(8px);
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding: 0 1.5rem;
			justify-content: flex-end;
			padding-bottom: 5rem;
		}

		.lang-switch {
			top: 1.2rem;
			right: 1.5rem;
		}

		.scroll-hint {
			bottom: 1.5rem;
		}
	}
</style>
