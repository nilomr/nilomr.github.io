<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let { src, alt = '', revealed = false } = $props();
	let container = $state(null);
	let revealTarget = $derived(revealed ? 1 : 0);

	const vertexShader = `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	const fragmentShader = `
		precision highp float;
		uniform sampler2D uTexture;
		uniform vec2 uMouse;
		uniform float uHover;
		uniform float uVelocity;
		uniform vec2 uResolution;
		uniform float uReveal;
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

			// Reduce lens when revealed
			float lensStrength = mix(1.0, 0.0, uReveal);
			float bulge = falloff * uHover * 0.35 * lensStrength;

			float safeDist = max(dist, 0.001);
			vec2 dir = diff / safeDist;
			vec2 lensUV = uv - dir * bulge * 0.07;

			// Scroll velocity barrel (reduced during reveal)
			vec2 center = uv - 0.5;
			lensUV += center * length(center) * uVelocity * 0.012 * lensStrength;

			// Reveal: subtle zoom in
			vec2 revealCenter = uv - 0.5;
			lensUV = mix(lensUV, lensUV - revealCenter * 0.04, uReveal);

			// Chromatic aberration: lens mode vs reveal mode
			float lensCa = bulge * 0.01 + abs(uVelocity) * 0.0006;

			// Reveal CA: radial, spreading from center
			float revealDist = length(revealCenter * aspectVec);
			vec2 revealDir = normalize(revealCenter * aspectVec + 0.001);
			float revealCa = uReveal * 0.012 * revealDist;

			// Blend
			vec2 finalDir = mix(dir, revealDir, uReveal);
			float finalCa = lensCa + revealCa;

			float r = texture2D(uTexture, lensUV + finalDir * finalCa).r;
			float g = texture2D(uTexture, lensUV).g;
			float b = texture2D(uTexture, lensUV - finalDir * finalCa).b;

			// Darken during reveal for text readability
			float darken = mix(1.0, 0.38, uReveal);
			gl_FragColor = vec4(r * darken, g * darken, b * darken, 1.0);
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
			uReveal: { value: 0 },
		};

		const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
		scene.add(new THREE.Mesh(geometry, material));

		const loader = new THREE.TextureLoader();
		loader.load(src, (texture) => {
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			uniforms.uTexture.value = texture;

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

		let screenMouse = { x: 0, y: 0 };
		let currentMouse = new THREE.Vector2(0.5, 0.5);
		let isHovering = false;
		let hoverCurrent = 0;
		let lastScroll = window.scrollY;
		let velocity = 0;
		let revealCurrent = 0;

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
			const rect = container.getBoundingClientRect();
			const uvX = (screenMouse.x - rect.left) / rect.width;
			const uvY = 1.0 - (screenMouse.y - rect.top) / rect.height;

			const overImage = uvX >= 0 && uvX <= 1 && uvY >= 0 && uvY <= 1;
			if (overImage) isHovering = true;
			else if (uvX < -0.1 || uvX > 1.1 || uvY < -0.1 || uvY > 1.1) isHovering = false;

			const targetX = overImage ? uvX : currentMouse.x;
			const targetY = overImage ? uvY : currentMouse.y;

			const mouseLerp = isHovering ? 0.08 : 0.012;
			currentMouse.x += (targetX - currentMouse.x) * mouseLerp;
			currentMouse.y += (targetY - currentMouse.y) * mouseLerp;
			uniforms.uMouse.value.copy(currentMouse);

			const hoverTarget = isHovering ? 1.0 : 0.0;
			const hoverLerp = isHovering ? 0.05 : 0.012;
			hoverCurrent += (hoverTarget - hoverCurrent) * hoverLerp;
			uniforms.uHover.value = hoverCurrent;

			const scroll = window.scrollY;
			const rawVel = (scroll - lastScroll) * 0.1;
			lastScroll = scroll;
			velocity += (rawVel - velocity) * 0.06;
			uniforms.uVelocity.value = velocity;

			// Lerp reveal uniform
			revealCurrent += (revealTarget - revealCurrent) * 0.06;
			uniforms.uReveal.value = revealCurrent;

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
