<script>
	import { onMount } from 'svelte';

	let dot = $state(null);
	let ring = $state(null);
	let visible = $state(false);
	let clicking = $state(false);
	let hovering = $state(false);

	onMount(() => {
		let mx = 0, my = 0;
		let dx = 0, dy = 0;

		function onMove(e) {
			mx = e.clientX;
			my = e.clientY;
			if (!visible) visible = true;
		}

		function onDown() { clicking = true; }
		function onUp() { clicking = false; }

		function onOver(e) {
			const t = e.target?.closest?.('a, button, [role="button"], .magnetic');
			hovering = !!t;
		}

		function raf() {
			dx += (mx - dx) * 0.15;
			dy += (my - dy) * 0.15;
			if (dot) {
				dot.style.transform = `translate(${mx}px, ${my}px)`;
			}
			if (ring) {
				ring.style.transform = `translate(${dx}px, ${dy}px)`;
			}
			requestAnimationFrame(raf);
		}

		window.addEventListener('mousemove', onMove, { passive: true });
		window.addEventListener('mousedown', onDown);
		window.addEventListener('mouseup', onUp);
		window.addEventListener('mouseover', onOver, { passive: true });
		requestAnimationFrame(raf);

		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mousedown', onDown);
			window.removeEventListener('mouseup', onUp);
			window.removeEventListener('mouseover', onOver);
		};
	});
</script>

<div class="cursor" class:visible class:clicking class:hovering>
	<div class="cursor-dot" bind:this={dot}></div>
	<div class="cursor-ring" bind:this={ring}></div>
</div>

<style>
	.cursor {
		pointer-events: none;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 99999;
		mix-blend-mode: difference;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.cursor.visible {
		opacity: 1;
	}

	.cursor-dot {
		width: 6px;
		height: 6px;
		margin: -3px 0 0 -3px;
		border-radius: 50%;
		background: #fff;
		position: absolute;
		will-change: transform;
	}

	.cursor-ring {
		width: 36px;
		height: 36px;
		margin: -18px 0 0 -18px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.5);
		position: absolute;
		will-change: transform;
		transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
					height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
					margin 0.3s cubic-bezier(0.16, 1, 0.3, 1),
					border-color 0.3s ease;
	}

	.cursor.hovering .cursor-ring {
		width: 56px;
		height: 56px;
		margin: -28px 0 0 -28px;
		border-color: rgba(255, 255, 255, 0.8);
	}

	.cursor.clicking .cursor-ring {
		width: 28px;
		height: 28px;
		margin: -14px 0 0 -14px;
	}

	@media (hover: none), (pointer: coarse) {
		.cursor { display: none; }
	}
</style>
