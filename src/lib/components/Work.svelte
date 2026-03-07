<script>
	import { onMount } from "svelte";
	import BioPortrait from './BioPortrait.svelte';

	const credits = [
		{
			project: "sedum.studio",
			role: "Founder",
			org: "Data science & design",
			period: "2024–present",
			href: "https://www.sedum.studio",
		},
		{
			project: "RSPB",
			role: "Senior Conservation Scientist",
			org: "Largest nature NGO in Europe",
			period: "2026–present",
			href: "https://www.rspb.org.uk",
		},
		{
			project: "University of Oxford",
			role: "Researcher · Guest lecturer · Tutor",
			org: "Department of Biology",
			period: "2019–2026",
			href: "https://www.ox.ac.uk/news/2025-03-10-changing-chorus-study-shows-how-movements-and-memories-influence-birdsong-evolution",
		},
		{
			project: "Cornell University",
			role: "Data Visualization Consultant",
			org: "BirdNET project · freelance",
			period: "2025–present",
			href: "https://www.birds.cornell.edu",
		},
	];

	let sectionEl = $state(null);

	onMount(async () => {
		if (!sectionEl) return;
		const gsap = (await import("gsap")).default;
		const { ScrollTrigger } = await import("gsap/ScrollTrigger");
		gsap.registerPlugin(ScrollTrigger);
		if (!sectionEl) return;

		// Reveal bio
		const bio = sectionEl.querySelector(".about-bio");
		gsap.from(bio, {
			y: 40,
			opacity: 0,
			duration: 0.9,
			ease: "power3.out",
			scrollTrigger: { trigger: bio, start: "top 85%" },
		});

		// Reveal credits heading
		const heading = sectionEl.querySelector(".credits-label");
		gsap.from(heading, {
			y: 20,
			opacity: 0,
			duration: 0.6,
			ease: "power3.out",
			scrollTrigger: { trigger: heading, start: "top 88%" },
		});

		// Stagger credit rows
		const rows = sectionEl.querySelectorAll(".credit-row");
		rows.forEach((row, i) => {
			gsap.from(row, {
				y: 30,
				opacity: 0,
				duration: 0.6,
				ease: "power3.out",
				scrollTrigger: { trigger: row, start: "top 92%" },
				delay: i * 0.05,
			});
		});

		// Hover: line draw on credit rows
		rows.forEach((row) => {
			const line = row.querySelector(".credit-line");
			row.addEventListener("mouseenter", () => {
				gsap.to(line, {
					scaleX: 1,
					duration: 0.5,
					ease: "power3.out",
					transformOrigin: "left",
				});
			});
			row.addEventListener("mouseleave", () => {
				gsap.to(line, {
					scaleX: 0,
					duration: 0.4,
					ease: "power3.in",
					transformOrigin: "right",
				});
			});
		});
	});
</script>

<section class="about" bind:this={sectionEl}>
	<div class="about-inner">
		<div class="about-bio">
			<div class="portrait-col">
				<BioPortrait />
			</div>
			<p class="bio-text">
				I’m a <em class="bio-human">scientist,</em>
				<span class="bio-human">developer,</span>
				and <em class="bio-human">designer.</em>
				My work sits between research, computation, and visual communication.
				I have been a researcher at Oxford and Senior Conservation Scientist
				at Europe’s largest nature conservation charity. Earlier in my career
				I worked in film, shooting projects around the world. Today I design
				analytical tools and visualizations that help researchers and organisations
				understand complex data and communicate it clearly. I run
				<a
					class="bio-studio"
					href="https://www.sedum.studio"
					target="_blank"
					rel="noopener noreferrer">sedum.studio</a
				>, a small studio at the intersection of data science and
				design.
			</p>
		</div>

		<div class="credits-section">
			<span class="credits-label">Selected</span>
			<div class="credits-list">
				{#each credits as credit}
					{@const Tag = credit.href ? "a" : "div"}
					<svelte:element
						this={Tag}
						class="credit-row"
						href={credit.href}
						target={credit.href ? "_blank" : undefined}
						rel={credit.href ? "noopener noreferrer" : undefined}
					>
						<span class="credit-project">{credit.project}</span>
						<span class="credit-meta"
							><span class="credit-role">{credit.role}</span><span
								class="credit-sep"
							>
								·
							</span><span class="credit-org">{credit.org}</span
							></span
						>
						<span class="credit-period">{credit.period}</span>
						{#if credit.href}
							<span class="credit-arrow">&nearr;</span>
						{/if}
						<div class="credit-line"></div>
					</svelte:element>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.about {
		padding: 10rem 0 6rem;
	}

	.about-inner {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 clamp(2rem, 6vw, 6rem);
		display: flex;
		flex-direction: column;
		gap: 5rem;
	}

	.about-bio {
		display: grid;
		grid-template-columns: 190px 1fr;
		gap: 3.5rem;
		align-items: start;
	}

	@media (min-width: 769px) {
		.about-bio {
			/* Break out of the inner container so only the bio row is wider */
			width: min(900px, calc(100vw - clamp(4rem, 10vw, 10rem)));
			margin-left: 50%;
			transform: translateX(-50%);
		}
	}

	.portrait-col {
		position: sticky;
		top: 4rem;
	}

	.bio-text {
		font-family: "Inter", sans-serif;
		font-size: clamp(0.95rem, 1.4vw, 1rem);
		font-weight: 400;
		line-height: 1.75;
		color: #3a3835;
		margin: 0;
	}

	/* Space Mono for technical/computational terms */
	.bio-code {
		font-family: "Space Mono", monospace;
		font-size: 0.86em;
		letter-spacing: -0.03em;
		color: #2a2725;
	}

	/* Italic Inter for creative/human roles */
	.bio-human {
		font-style: italic;
		font-weight: 500;
		color: #2a2725;
	}

	/* Proper noun: slight spacing lift */
	.bio-place {
		letter-spacing: 0.07em;
		font-weight: 500;
		color: #2a2725;
	}

	/* sedum.studio — monospace link with a designed underline */
	.bio-studio {
		font-family: "Space Mono", monospace;
		font-size: 0.9em;
		letter-spacing: -0.03em;
		color: inherit;
		text-decoration: underline;
		text-decoration-color: rgba(58, 56, 53, 0.28);
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
		transition:
			text-decoration-color 0.3s ease,
			color 0.25s ease;
	}

	.bio-studio:hover {
		color: #1a1a1a;
		text-decoration-color: rgba(26, 26, 26, 0.6);
	}

	.credits-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.credits-label {
		font-family: "Space Mono", monospace;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: #8a8580;
	}

	.credits-list {
		display: flex;
		flex-direction: column;
	}

	.credit-meta {
		display: contents;
	}

	.credit-sep {
		display: none;
	}

	.credit-row {
		display: grid;
		grid-template-columns: 1fr auto auto auto;
		gap: 2rem;
		align-items: baseline;
		padding: 1.1rem 0;
		border-top: 1px solid rgba(0, 0, 0, 0.07);
		position: relative;
		text-decoration: none;
		color: inherit;
		cursor: default;
		transition: color 0.3s ease;
	}

	a.credit-row {
		cursor: pointer;
	}

	.credit-row:last-child {
		border-bottom: 1px solid rgba(0, 0, 0, 0.07);
	}

	a.credit-row:hover {
		color: #1a1a1a;
	}

	.credit-line {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 1px;
		background: #1a1a1a;
		transform: scaleX(0);
		pointer-events: none;
	}

	.credit-project {
		font-family: "Space Mono", monospace;
		font-size: clamp(0.82rem, 1.1vw, 0.95rem);
		font-weight: 700;
		color: #1a1a1a;
		letter-spacing: -0.01em;
	}

	.credit-role {
		font-family: "Inter", sans-serif;
		font-size: 0.78rem;
		color: #7a756f;
		text-align: right;
	}

	.credit-org {
		font-family: "Inter", sans-serif;
		font-size: 0.78rem;
		color: #9a9590;
		text-align: right;
		min-width: 10ch;
	}

	.credit-period {
		font-family: "Space Mono", monospace;
		font-size: 0.68rem;
		color: #b0aba5;
		letter-spacing: 0.03em;
		min-width: 4ch;
		text-align: right;
	}

	.credit-arrow {
		position: absolute;
		right: -1.5rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.85rem;
		color: #b0aba5;
		opacity: 0;
		transition:
			opacity 0.3s ease,
			transform 0.3s ease;
	}

	a.credit-row:hover .credit-arrow {
		opacity: 1;
		transform: translateY(-50%) translate(2px, -2px);
	}

	@media (max-width: 768px) {
		.about {
			padding: 5rem 0 3rem;
		}

		.about-inner {
			gap: 3rem;
			padding: 0 1.5rem;
		}

		.about-bio {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		.portrait-col {
			position: static;
			max-width: 160px;
		}

		.bio-text {
			font-size: 0.95rem;
			line-height: 1.7;
		}

		.credits-list {
			gap: 0;
		}

		.credit-row {
			display: flex;
			flex-direction: column;
			gap: 0.3rem;
			padding: 1rem 0;
			border-top: 1px solid rgba(0, 0, 0, 0.06);
		}

		.credit-row:last-child {
			border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		}

		.credit-project {
			font-size: 0.88rem;
		}

		.credit-meta {
			display: inline;
		}

		.credit-sep {
			display: inline;
			color: #c0bdb8;
			font-size: 0.72rem;
		}

		.credit-role {
			display: inline;
			font-size: 0.72rem;
			text-align: left;
		}

		.credit-org {
			display: inline;
			font-size: 0.72rem;
			text-align: left;
			min-width: auto;
		}

		.credit-period {
			font-size: 0.62rem;
			text-align: left;
			color: #b0aba5;
		}

		.credit-arrow {
			position: absolute;
			top: 1rem;
			right: 0;
			transform: none;
			opacity: 0.4;
			font-size: 0.9rem;
		}

		a.credit-row:hover .credit-arrow {
			transform: translate(2px, -2px);
		}

		a.credit-row {
			position: relative;
		}
	}
</style>
