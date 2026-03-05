<script>
	import { onMount } from 'svelte';

	let section = $state(null);
	let roleEl = $state(null);

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
			await new Promise((r) => setTimeout(r, 3000));
			idx = (idx + 1) % roles.length;
			await scrambleText(el, roles[idx], 600);
		}
	}

	onMount(async () => {
		const gsap = (await import('gsap')).default;
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);

		const lines = section.querySelectorAll('.h-row');
		const indices = section.querySelectorAll('.h-idx');
		const texts = section.querySelectorAll('.h-text');
		const footer = section.querySelector('.h-footer');
		const hint = section.querySelector('.scroll-hint');
		const roleSpan = section.querySelector('.h-role');

		// Initial scramble reveal for each line
		const textEls = [...texts];
		const finalTexts = textEls.map((el) => el.textContent);
		textEls.forEach((el) => {
			el.textContent = '';
		});

		const tl = gsap.timeline({ delay: 0.4 });

		// Stagger row reveals
		tl.from(lines, {
			opacity: 0,
			y: 20,
			stagger: 0.15,
			duration: 0.01,
			ease: 'none',
			onStart: () => {
				// Trigger scramble for each line with stagger
				textEls.forEach((el, i) => {
					setTimeout(() => {
						scrambleText(el, finalTexts[i], 700 + i * 100);
					}, i * 150);
				});
			},
		});

		// Indices fade in
		tl.from(
			indices,
			{
				opacity: 0,
				x: -8,
				stagger: 0.1,
				duration: 0.5,
				ease: 'power2.out',
			},
			0.1
		);

		// Footer
		tl.from(
			footer,
			{
				opacity: 0,
				y: 10,
				duration: 0.8,
				ease: 'power3.out',
			},
			0.6
		);

		// Scroll hint
		tl.from(
			hint,
			{
				opacity: 0,
				duration: 1,
				ease: 'power2.out',
			},
			0.8
		);

		// Start role cycling after initial reveal
		if (roleSpan) {
			setTimeout(() => cycleRoles(roleSpan), 2500);
		}

		// Magnetic hover on rows
		lines.forEach((row) => {
			const text = row.querySelector('.h-text');
			row.addEventListener('mousemove', (e) => {
				const rect = row.getBoundingClientRect();
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;
				gsap.to(text, {
					x: x * 0.06,
					y: y * 0.15,
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

		// Parallax on scroll
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
				<span class="h-role" bind:this={roleEl}>{roles[0]}</span>
			</div>
			<p class="h-location">Oxford & Barcelona</p>
		</div>
	</div>

	<div class="scroll-hint">
		<div class="scroll-line"></div>
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
		gap: 0;
	}

	.h-row {
		display: flex;
		align-items: baseline;
		gap: clamp(1rem, 2vw, 2rem);
		padding: clamp(0.6rem, 1.2vh, 1rem) 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		cursor: default;
		transition: background 0.3s ease;
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

	.scroll-hint {
		position: absolute;
		bottom: 2.5rem;
		right: clamp(2rem, 8vw, 8rem);
		display: flex;
		align-items: center;
	}

	.scroll-line {
		width: 1px;
		height: 48px;
		background: linear-gradient(to bottom, #c0bdb8, transparent);
		animation: scrollPulse 2.2s ease-in-out infinite;
	}

	@keyframes scrollPulse {
		0%,
		100% {
			opacity: 0.25;
			transform: scaleY(0.5);
			transform-origin: top;
		}
		50% {
			opacity: 0.8;
			transform: scaleY(1);
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
