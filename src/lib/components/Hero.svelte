<script>
	import { onMount } from 'svelte';

	let section = $state(null);

	const roles = ['Researcher', 'Developer', 'Filmmaker', 'Designer'];
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

	function scrambleText(el, finalText, duration = 800) {
		return new Promise((resolve) => {
			const length = finalText.length;
			const start = performance.now();
			const step = (now) => {
				const progress = Math.min((now - start) / duration, 1);
				let result = '';
				for (let i = 0; i < length; i++) {
					if (finalText[i] === ' ') {
						result += ' ';
					} else if (progress > (i / length) * 0.8 + 0.2) {
						result += finalText[i];
					} else {
						result += chars[Math.floor(Math.random() * chars.length)];
					}
				}
				el.textContent = result;
				if (progress < 1) requestAnimationFrame(step);
				else resolve();
			};
			requestAnimationFrame(step);
		});
	}

	async function cycleRoles(el) {
		let idx = 0;
		while (true) {
			await new Promise((r) => setTimeout(r, 2000));
			idx = (idx + 1) % roles.length;
			await scrambleText(el, roles[idx], 600);
		}
	}

	onMount(async () => {
		const gsap = (await import('gsap')).default;
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);

		const rows = section.querySelectorAll('.h-row');
		const textEls = [...section.querySelectorAll('.h-text')];
		const footer = section.querySelector('.h-footer');
		const scrollHint = section.querySelector('.scroll-hint');
		const roleSpan = section.querySelector('.h-role');

		// Store final texts, blank them out
		const finalTexts = textEls.map((el) => el.textContent);
		textEls.forEach((el) => (el.textContent = ''));

		// Nudge rows and footer down for the slide-up reveal (opacity already 0 in CSS)
		gsap.set(rows, { y: 24 });
		gsap.set(footer, { y: 12 });

		// Main reveal sequence
		const tl = gsap.timeline({ delay: 0.3 });

		// Rows appear one by one — scramble starts as each row fades in
		rows.forEach((row, i) => {
			tl.to(
				row,
				{
					opacity: 1,
					y: 0,
					duration: 0.5,
					ease: 'power3.out',
					onStart: () => {
						scrambleText(textEls[i], finalTexts[i], 900);
					},
				},
				i * 0.18
			);
		});

		// Footer
		tl.to(
			footer,
			{
				opacity: 1,
				y: 0,
				duration: 0.7,
				ease: 'power3.out',
			},
			0.7
		);

		// Scroll indicator
		tl.to(scrollHint, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 1.0);

		// Start role cycling
		if (roleSpan) {
			setTimeout(() => cycleRoles(roleSpan), 0);
		}

		// Magnetic hover on rows
		rows.forEach((row) => {
			const text = row.querySelector('.h-text');
			row.addEventListener('mousemove', (e) => {
				const rect = row.getBoundingClientRect();
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;
				gsap.to(text, {
					x: x * 0.05,
					y: y * 0.12,
					duration: 0.4,
					ease: 'power2.out',
				});
			});
			row.addEventListener('mouseleave', () => {
				gsap.to(text, {
					x: 0,
					y: 0,
					duration: 0.6,
					ease: 'elastic.out(1, 0.4)',
				});
			});
		});

		// Parallax content on scroll (not the scroll hint)
		gsap.to(section.querySelector('.h-content'), {
			y: -100,
			opacity: 0.2,
			scrollTrigger: {
				trigger: section,
				start: 'top top',
				end: 'bottom top',
				scrub: 0.6,
			},
		});

		// Fade out scroll hint on scroll
		gsap.to(scrollHint, {
			opacity: 0,
			y: 20,
			scrollTrigger: {
				trigger: section,
				start: 'top top',
				end: '15% top',
				scrub: true,
			},
		});
	});
</script>

<section class="hero" bind:this={section}>
	<div class="h-content">
		<div class="h-lines">
			<div class="h-row">
				<span class="h-idx">01</span>
				<span class="h-text">Cultural evolution research</span>
			</div>
			<div class="h-row">
				<span class="h-idx">02</span>
				<span class="h-text">Open-source scientific software</span>
			</div>
			<div class="h-row">
				<span class="h-idx">03</span>
				<span class="h-text">Data visualisation & design</span>
			</div>
			<div class="h-row">
				<span class="h-idx">04</span>
				<span class="h-text">Documentary cinematography</span>
			</div>
		</div>

		<div class="h-footer">
			<div class="h-id">
				<span class="h-name">Nilo Merino Recalde</span>
				<span class="h-sep">/</span>
				<span class="h-role">{roles[0]}</span>
			</div>
			<p class="h-location">Oxford & Barcelona</p>
		</div>
	</div>

	<div class="scroll-hint">
		<span class="scroll-label">Scroll</span>
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
		align-items: baseline;
		gap: clamp(1rem, 2vw, 2rem);
		padding: clamp(0.7rem, 1.4vh, 1.1rem) 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		cursor: default;
		transition: background 0.3s ease;
		opacity: 0;
	}

	.h-row:first-child {
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.h-row:hover {
		background: rgba(0, 0, 0, 0.015);
	}

	.h-idx {
		font-family: 'Space Mono', monospace;
		font-size: clamp(0.55rem, 0.7vw, 0.65rem);
		color: #b0aba5;
		letter-spacing: 0.05em;
		flex-shrink: 0;
		min-width: 2ch;
		user-select: none;
	}

	.h-text {
		font-family: 'Space Mono', monospace;
		font-size: clamp(1.1rem, 3.2vw, 2.6rem);
		font-weight: 700;
		color: #1a1a1a;
		line-height: 1.3;
		letter-spacing: -0.025em;
		display: inline-block;
		white-space: nowrap;
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
		font-family: 'Space Mono', monospace;
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
		font-family: 'Inter', sans-serif;
		font-size: clamp(0.58rem, 0.8vw, 0.68rem);
		font-weight: 400;
		color: #a09a94;
		letter-spacing: 0.04em;
		margin: 0;
	}

	/* Scroll indicator — bottom center, text + arrow */
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
		font-family: 'Space Mono', monospace;
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #a09a94;
	}

	.scroll-arrow {
		font-family: 'Space Mono', monospace;
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
		.h-text {
			white-space: normal;
			font-size: clamp(1rem, 5.5vw, 1.5rem);
		}

		.h-row {
			gap: 0.8rem;
		}
	}
</style>
