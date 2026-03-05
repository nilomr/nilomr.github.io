<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas = $state(null);

	const vertexShader = `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}
	`;

	// Extremely subtle topographic contours — watermark level
	const fragmentShader = `
		precision highp float;
		uniform float uTime;
		uniform float uScroll;
		uniform vec2 uMouse;
		uniform vec2 uResolution;
		varying vec2 vUv;

		vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
		vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
		vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

		float snoise(vec2 v) {
			const vec4 C = vec4(0.211324865405187, 0.366025403784439,
							   -0.577350269189626, 0.024390243902439);
			vec2 i  = floor(v + dot(v, C.yy));
			vec2 x0 = v - i + dot(i, C.xx);
			vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
			vec4 x12 = x0.xyxy + C.xxzz;
			x12.xy -= i1;
			i = mod289(i);
			vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
			vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
			m = m * m; m = m * m;
			vec3 x = 2.0 * fract(p * C.www) - 1.0;
			vec3 h = abs(x) - 0.5;
			vec3 ox = floor(x + 0.5);
			vec3 a0 = x - ox;
			m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
			vec3 g;
			g.x = a0.x * x0.x + h.x * x0.y;
			g.yz = a0.yz * x12.xz + h.yz * x12.yw;
			return 130.0 * dot(m, g);
		}

		void main() {
			vec2 uv = vUv;
			float aspect = uResolution.x / uResolution.y;
			vec2 p = uv * vec2(aspect, 1.0);

			float t = uTime * 0.015;
			float scroll = uScroll * 0.00015;

			// Terrain
			float terrain = 0.0;
			terrain += snoise(p * 0.8 + vec2(t, scroll)) * 1.0;
			terrain += snoise(p * 1.6 + vec2(-t * 0.4, scroll * 1.1)) * 0.5;
			terrain += snoise(p * 3.2 + vec2(t * 0.2, -scroll * 0.4)) * 0.25;

			// Cursor raises terrain
			vec2 mouse = uMouse * vec2(aspect, 1.0);
			float mouseDist = length(p - mouse);
			float hill = exp(-mouseDist * mouseDist * 3.5) * 1.5;
			terrain += hill;

			// Contour lines
			float spacing = 0.18;
			float halfLine = fract(terrain / spacing);
			float distToLine = abs(halfLine - 0.5) * spacing;
			float fw = fwidth(terrain) * 0.7;
			float line = 1.0 - smoothstep(0.0, fw, distToLine);

			// Index lines every 5th
			float idxSpacing = spacing * 5.0;
			float idxDist = abs(fract(terrain / idxSpacing) - 0.5) * idxSpacing;
			float indexLine = 1.0 - smoothstep(0.0, fw * 1.2, idxDist);

			// Background
			vec3 bg = vec3(0.965, 0.955, 0.935);

			// Very low opacity — lines are barely visible until cursor approaches
			float nearCursor = smoothstep(1.2, 0.0, mouseDist);
			float baseOpacity = 0.07;
			float hoverOpacity = 0.22;
			float lineAlpha = mix(baseOpacity, hoverOpacity, nearCursor);
			float indexAlpha = mix(baseOpacity * 1.4, hoverOpacity * 1.3, nearCursor);

			vec3 lineCol = vec3(0.75, 0.73, 0.70);
			vec3 color = bg;
			color = mix(color, lineCol, line * lineAlpha);
			color = mix(color, lineCol * 0.85, indexLine * indexAlpha);

			gl_FragColor = vec4(color, 1.0);
		}
	`;

	onMount(() => {
		if (!canvas) return;

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		const geo = new THREE.PlaneGeometry(2, 2);

		const uniforms = {
			uTime: { value: 0 },
			uScroll: { value: 0 },
			uMouse: { value: new THREE.Vector2(-1, -1) },
			uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
		};

		const mat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
		scene.add(new THREE.Mesh(geo, mat));

		let targetMouse = { x: -1, y: -1 };
		let currentMouse = { x: -1, y: -1 };

		function resize() {
			renderer.setSize(window.innerWidth, window.innerHeight);
			uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
		}

		function onScroll() { uniforms.uScroll.value = window.scrollY; }

		function onMouse(e) {
			targetMouse.x = e.clientX / window.innerWidth;
			targetMouse.y = 1.0 - e.clientY / window.innerHeight;
		}

		resize();
		window.addEventListener('resize', resize, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('mousemove', onMouse, { passive: true });

		let frame;
		function animate(time) {
			currentMouse.x += (targetMouse.x - currentMouse.x) * 0.035;
			currentMouse.y += (targetMouse.y - currentMouse.y) * 0.035;
			uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
			uniforms.uTime.value = time * 0.001;
			renderer.render(scene, camera);
			frame = requestAnimationFrame(animate);
		}
		frame = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', resize);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('mousemove', onMouse);
			renderer.dispose(); geo.dispose(); mat.dispose();
		};
	});
</script>

<canvas bind:this={canvas} class="webgl-bg" aria-hidden="true"></canvas>

<style>
	.webgl-bg {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		pointer-events: none;
	}
</style>
