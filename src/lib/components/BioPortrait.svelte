<script>
	import { onMount } from 'svelte';

	let figure = $state(null);
	let imgEl = $state(null);

	onMount(() => {
		if (!figure || !imgEl) return;

		let targetX = 0, targetY = 0;
		let currentX = 0, currentY = 0;
		let raf;

		function onMove(e) {
			const rect = figure.getBoundingClientRect();
			targetX = ((e.clientX - rect.left) / rect.width  - 0.5) * 14;
			targetY = ((e.clientY - rect.top)  / rect.height - 0.5) * 14;
		}

		function onLeave() {
			targetX = 0;
			targetY = 0;
		}

		function tick() {
			currentX += (targetX - currentX) * 0.1;
			currentY += (targetY - currentY) * 0.1;
			imgEl.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.2)`;
			raf = requestAnimationFrame(tick);
		}

		figure.addEventListener('mousemove', onMove);
		figure.addEventListener('mouseleave', onLeave);
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			figure.removeEventListener('mousemove', onMove);
			figure.removeEventListener('mouseleave', onLeave);
		};
	});
</script>

<figure class="portrait-wrap" bind:this={figure}>
	<div class="portrait-canvas">
		<img
			src="/images/nilo.jpg"
			alt="Portrait of Nilo Merino Recalde"
			bind:this={imgEl}
		/>
	</div>

	<svg class="portrait-ticks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
		<!-- TL outer dimension lines -->
		<line x1="-5" y1="0" x2="0" y2="0" class="dimension-line"/>
		<line x1="0" y1="-5" x2="0" y2="0" class="dimension-line"/>
		<!-- TL bracket --> <line x1="0" y1="8" x2="0" y2="0"/><line x1="0" y1="0" x2="8" y2="0"/>
		<!-- TR outer dimension lines -->
		<line x1="100" y1="0" x2="105" y2="0" class="dimension-line"/>
		<line x1="100" y1="-5" x2="100" y2="0" class="dimension-line"/>
		<!-- TR bracket --> <line x1="92" y1="0" x2="100" y2="0"/><line x1="100" y1="0" x2="100" y2="8"/>
		<!-- BL outer dimension lines -->
		<line x1="-5" y1="100" x2="0" y2="100" class="dimension-line"/>
		<line x1="0" y1="100" x2="0" y2="105" class="dimension-line"/>
		<!-- BL bracket --> <line x1="0" y1="92" x2="0" y2="100"/><line x1="0" y1="100" x2="8" y2="100"/>
		<!-- BR outer dimension lines -->
		<line x1="100" y1="100" x2="105" y2="100" class="dimension-line"/>
		<line x1="100" y1="100" x2="100" y2="105" class="dimension-line"/>
		<!-- BR bracket --> <line x1="92" y1="100" x2="100" y2="100"/><line x1="100" y1="92" x2="100" y2="100"/>
	</svg>

	<figcaption class="portrait-caption">N.M.R. · OXFORD · 2024</figcaption>
</figure>

<style>
	.portrait-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		margin: 0;
		flex-shrink: 0;
	}

	.portrait-canvas {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: #e8e4dd;
	}

	.portrait-canvas img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		will-change: transform;
		transform-origin: center;
		filter: sepia(0.12) saturate(0.9) brightness(0.96);
	}

	.portrait-ticks {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: visible;
	}

	.portrait-ticks line {
		stroke: rgba(90, 80, 70, 0.55);
		stroke-width: 1.2;
		vector-effect: non-scaling-stroke;
	}

	.portrait-ticks .dimension-line {
		stroke: rgba(90, 80, 70, 0.35);
		stroke-width: 0.8;
	}

	.portrait-caption {
		position: absolute;
		bottom: -1.2rem;
		left: 0.5rem;
		font-family: 'Space Mono', monospace;
		font-size: 0.45rem;
		letter-spacing: 0.18em;
		color: rgba(90, 80, 70, 0.4);
		text-transform: uppercase;
		white-space: nowrap;
	}
</style>
