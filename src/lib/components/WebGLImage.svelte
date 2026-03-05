<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let { src, alt = '' } = $props();
	let container = $state(null);

	const vertexShader = `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	// Localized lens around cursor with soft decay + chromatic aberration
	const fragmentShader = `
		precision highp float;
		uniform sampler2D uTexture;
		uniform vec2 uMouse;
		uniform float uHover;
		uniform float uVelocity;
		uniform vec2 uResolution;
		varying vec2 vUv;

		void main() {
			vec2 uv = vUv;
			float aspect = uResolution.x / uResolution.y;
			vec2 aspectVec = vec2(aspect, 1.0);

			vec2 mouse = uMouse;
			vec2 diff = (uv - mouse) * aspectVec;
			float dist = length(diff);

			// Large radius, smootherstep falloff
			float radius = 0.4;
			float t = clamp(dist / radius, 0.0, 1.0);
			float falloff = 1.0 - t * t * (3.0 - 2.0 * t);
			float bulge = falloff * uHover * 0.35;

			// Push UVs away from cursor — but clamp minimum distance
			// so the very center isn't infinitely peaked
			float safeDist = max(dist, 0.001); // soft floor prevents pinch
			vec2 dir = diff / safeDist;
			vec2 lensUV = uv - dir * bulge * 0.07;

			// Scroll velocity barrel
			vec2 center = uv - 0.5;
			lensUV += center * length(center) * uVelocity * 0.012;

			// Chromatic aberration radiating from cursor
			float caStrength = bulge * 0.01 + abs(uVelocity) * 0.0006;

			float r = texture2D(uTexture, lensUV + dir * caStrength).r;
			float g = texture2D(uTexture, lensUV).g;
			float b = texture2D(uTexture, lensUV - dir * caStrength).b;

			gl_FragColor = vec4(r, g, b, 1.0);
		}
	`;

	onMount(() => {
		if (!container) return;

		const canvas = document.createElement('canvas');
		canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
		container.appendChild(canvas);

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
		const geometry = new THREE.PlaneGeometry(1, 1);

		const uniforms = {
			uTexture: { value: null },
			uMouse: { value: new THREE.Vector2(0.5, 0.5) },
			uHover: { value: 0 },
			uVelocity: { value: 0 },
			uResolution: { value: new THREE.Vector2(1, 1) },
		};

		const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
		scene.add(new THREE.Mesh(geometry, material));

		const loader = new THREE.TextureLoader();
		loader.load(src, (texture) => {
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			uniforms.uTexture.value = texture;

			// Set container width based on image aspect ratio and current height
			const imageAspect = texture.image.width / texture.image.height;
			const height = container.getBoundingClientRect().height;
			if (height > 0) {
				container.style.width = `${height * imageAspect}px`;
			}
		});

		function resize() {
			const { width, height } = container.getBoundingClientRect();
			if (width === 0 || height === 0) return;
			renderer.setSize(width, height);
			uniforms.uResolution.value.set(width, height);
		}
		resize();

		const ro = new ResizeObserver(() => resize());
		ro.observe(container);

		// Track screen-space cursor globally so we can recompute UV each frame
		let screenMouse = { x: 0, y: 0 };
		let currentMouse = new THREE.Vector2(0.5, 0.5);
		let isHovering = false;
		let hoverCurrent = 0;
		let lastScroll = window.scrollY;
		let velocity = 0;

		function onGlobalMouseMove(e) {
			screenMouse.x = e.clientX;
			screenMouse.y = e.clientY;
		}

		function onEnter() { isHovering = true; }
		function onLeave() { isHovering = false; }

		window.addEventListener('mousemove', onGlobalMouseMove, { passive: true });
		container.addEventListener('mouseenter', onEnter);
		container.addEventListener('mouseleave', onLeave);

		let frame;
		function animate() {
			// Recompute UV from screen cursor + current container rect every frame
			// This handles scroll moving the image under a stationary cursor
			const rect = container.getBoundingClientRect();
			const uvX = (screenMouse.x - rect.left) / rect.width;
			const uvY = 1.0 - (screenMouse.y - rect.top) / rect.height;

			// Check if cursor is currently over this image
			const overImage = uvX >= 0 && uvX <= 1 && uvY >= 0 && uvY <= 1;
			if (overImage) isHovering = true;
			// Only set not hovering if cursor is well outside
			else if (uvX < -0.1 || uvX > 1.1 || uvY < -0.1 || uvY > 1.1) isHovering = false;

			const targetX = overImage ? uvX : currentMouse.x;
			const targetY = overImage ? uvY : currentMouse.y;

			const mouseLerp = isHovering ? 0.08 : 0.012;
			currentMouse.x += (targetX - currentMouse.x) * mouseLerp;
			currentMouse.y += (targetY - currentMouse.y) * mouseLerp;
			uniforms.uMouse.value.copy(currentMouse);

			// Hover: ramps up on enter, decays VERY slowly on leave
			const hoverTarget = isHovering ? 1.0 : 0.0;
			const hoverLerp = isHovering ? 0.05 : 0.012; // Slow sticky decay
			hoverCurrent += (hoverTarget - hoverCurrent) * hoverLerp;
			uniforms.uHover.value = hoverCurrent;

			// Scroll velocity
			const scroll = window.scrollY;
			const rawVel = (scroll - lastScroll) * 0.1;
			lastScroll = scroll;
			velocity += (rawVel - velocity) * 0.06;
			uniforms.uVelocity.value = velocity;

			if (uniforms.uTexture.value) {
				renderer.render(scene, camera);
			}

			frame = requestAnimationFrame(animate);
		}
		frame = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(frame);
			ro.disconnect();
			window.removeEventListener('mousemove', onGlobalMouseMove);
			container.removeEventListener('mouseenter', onEnter);
			container.removeEventListener('mouseleave', onLeave);
			renderer.dispose();
			geometry.dispose();
			material.dispose();
			if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
		};
	});
</script>

<div class="webgl-image" bind:this={container} role="img" aria-label={alt}>
	<noscript>
		<img {src} {alt} style="width:100%;height:100%;object-fit:cover;" />
	</noscript>
</div>

<style>
	.webgl-image {
		position: relative;
		height: 100%;
		overflow: hidden;
		background: #e8e5e0;
		flex-shrink: 0;
	}
</style>
