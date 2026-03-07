<script>
	import { onMount } from 'svelte';

	let sectionEl = $state(null);

	onMount(async () => {
		if (!sectionEl) return;
		const gsap = (await import('gsap')).default;
		const { ScrollTrigger } = await import('gsap/ScrollTrigger');
		gsap.registerPlugin(ScrollTrigger);
		if (!sectionEl) return;

		const elements = sectionEl.querySelectorAll('.reveal');
		elements.forEach((el, i) => {
			gsap.from(el, {
				y: 30,
				opacity: 0,
				duration: 0.7,
				ease: 'power3.out',
				scrollTrigger: {
					trigger: el,
					start: 'top 90%',
				},
				delay: i * 0.08,
			});
		});

		// Magnetic email link
		const emailEl = sectionEl.querySelector('.contact-email');
		if (emailEl) {
			let bounds;
			emailEl.addEventListener('mouseenter', () => {
				bounds = emailEl.getBoundingClientRect();
			});
			emailEl.addEventListener('mousemove', (e) => {
				if (!bounds) return;
				const x = e.clientX - bounds.left - bounds.width / 2;
				const y = e.clientY - bounds.top - bounds.height / 2;
				gsap.to(emailEl, { x: x * 0.15, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
			});
			emailEl.addEventListener('mouseleave', () => {
				gsap.to(emailEl, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
			});
		}
	});
</script>

<section class="contact" bind:this={sectionEl}>
	<div class="contact-inner">
		<p class="contact-label reveal">Get in touch</p>
		<a href="mailto:nilo@sedum.studio" class="contact-email reveal">
			nilo@sedum.studio
		</a>
		<p class="contact-cta reveal">
			Available for consulting and collaborations. Reach out if you have an interesting project or just want to say hi!
		</p>
		<nav class="contact-links reveal">
			<a href="https://github.com/nilomr" target="_blank" rel="noopener noreferrer">GitHub</a>
			<a href="https://www.sedum.studio" target="_blank" rel="noopener noreferrer">sedum.studio</a>
			<a href="https://www.imdb.com/name/nm4945222" target="_blank" rel="noopener noreferrer">IMDB</a>
		</nav>
	</div>
</section>

<footer class="footer">
	<span>&copy; 2026 Nilo Merino Recalde</span>
</footer>

<style>
	.contact {
		padding: 10rem 0 6rem;
	}

	.contact-inner {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 clamp(2rem, 6vw, 6rem);
	}

	.contact-label {
		font-family: 'Space Mono', monospace;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #8a8580;
		margin-bottom: 1.5rem;
	}

	.contact-email {
		font-family: 'Space Mono', monospace;
		font-size: clamp(1rem, 2.5vw, 1.8rem);
		font-weight: 700;
		color: #1a1a1a;
		text-decoration: none;
		display: inline-block;
		position: relative;
		will-change: transform;
	}

	.contact-email::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		width: 100%;
		height: 2px;
		background: #1a1a1a;
		transform: scaleX(0);
		transform-origin: right;
		transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.contact-email:hover::after {
		transform: scaleX(1);
		transform-origin: left;
	}

	.contact-cta {
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		font-weight: 400;
		color: #5a5550;
		margin-top: 2rem;
		max-width: 380px;
		line-height: 1.7;
	}

	.contact-links {
		display: flex;
		gap: 2rem;
		margin-top: 2.5rem;
		flex-wrap: wrap;
	}

	.contact-links a {
		font-family: 'Space Mono', monospace;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #5a5550;
		text-decoration: none;
		position: relative;
		padding-bottom: 2px;
		transition: color 0.3s ease;
	}

	.contact-links a::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 1px;
		background: #1a1a1a;
		transform: scaleX(0);
		transform-origin: right;
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.contact-links a:hover {
		color: #1a1a1a;
	}

	.contact-links a:hover::after {
		transform: scaleX(1);
		transform-origin: left;
	}

	.footer {
		max-width: 900px;
		margin: 0 auto;
		padding: 3rem clamp(2rem, 6vw, 6rem) 2rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.footer span {
		font-family: 'Space Mono', monospace;
		font-size: 0.6rem;
		color: #9a9590;
		letter-spacing: 0.05em;
	}

	@media (max-width: 768px) {
		.contact {
			padding: 5rem 0 3rem;
		}

		.contact-inner {
			padding: 0 1.5rem;
		}

		.contact-label {
			margin-bottom: 1.2rem;
		}

		.contact-email {
			font-size: 0.88rem;
			display: block;
			padding: 1rem 0;
			border-bottom: 1px solid rgba(0, 0, 0, 0.08);
			word-break: break-all;
		}

		.contact-email::after {
			display: none;
		}

		.contact-cta {
			font-size: 0.82rem;
			margin-top: 1.5rem;
			max-width: none;
		}

		.contact-links {
			gap: 0;
			margin-top: 2rem;
			flex-direction: column;
		}

		.contact-links a {
			font-size: 0.72rem;
			padding: 0.9rem 0;
			border-bottom: 1px solid rgba(0, 0, 0, 0.05);
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.contact-links a::after {
			content: '\2197';
			position: static;
			transform: none;
			background: none;
			width: auto;
			height: auto;
			font-size: 0.85rem;
			color: #b0aba5;
			opacity: 1;
		}

		.contact-links a:first-child {
			border-top: 1px solid rgba(0, 0, 0, 0.05);
		}

		.footer {
			padding: 2rem 1.5rem 1.5rem;
		}
	}
</style>
