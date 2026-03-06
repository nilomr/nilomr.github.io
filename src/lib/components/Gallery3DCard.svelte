<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

	let { revealed = false } = $props();
	let container = $state(null);
	let labelsLayer = $state(null);
	let revealTarget = $derived(revealed ? 1 : 0);

	onMount(() => {
		if (!container) return;

		const isMobile =
			window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
			window.innerWidth <= 768;

		// Bleed: canvas extends this many px beyond the container on each side
		// so the model can overflow the card boundary visually.
		const BLEED = isMobile ? 0 : Math.round(Math.max(28, Math.min(72, window.innerWidth * 0.045)));

		const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
		renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
		renderer.setClearColor(0x000000, 0);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.domElement.style.cssText = `position:absolute;top:${-BLEED}px;left:${-BLEED}px;width:calc(100% + ${BLEED * 2}px);height:calc(100% + ${BLEED * 2}px);display:block;`;
		container.appendChild(renderer.domElement);

		// Width is set by aspect-ratio in CSS to match other portrait cards

		const scene = new THREE.Scene();
		scene.background = null;

		const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
		camera.position.z = 3.5;

		// Lighting
		const ambient = new THREE.AmbientLight(0xfff1de, 0.08);
		scene.add(ambient);

		const keyLight = new THREE.DirectionalLight(0xffe5c8, 6.8);
		keyLight.position.set(4.2, 5.8, -1.2);
		keyLight.castShadow = true;
		keyLight.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
		keyLight.shadow.camera.near = 0.5;
		keyLight.shadow.camera.far = 20;
		keyLight.shadow.camera.left = -3;
		keyLight.shadow.camera.right = 3;
		keyLight.shadow.camera.top = 3;
		keyLight.shadow.camera.bottom = -3;
		keyLight.shadow.bias = -0.0008;
		keyLight.shadow.normalBias = 0.03;
		scene.add(keyLight);

		const rimLight = new THREE.DirectionalLight(0xc8dcff, 1);
		rimLight.position.set(-4.5, 2.4, -5.2);
		scene.add(rimLight);

		// Pivot group for rotation
		const pivot = new THREE.Group();
		scene.add(pivot);

		// Per-material original colors for reveal darkening
		const originalColors = new Map();
		// Shared uniforms for the cursor-driven dissolve
		const uHitPoint = { value: new THREE.Vector3(999, 999, 999) };
		const uHitActive = { value: 0.0 };
		const uRadius = { value: 0.9 };
		// Meshes for raycasting
		const meshesForRaycast = [];
		// Lightweight overlay refs for cleanup
		const overlayObjects = [];

		// ── GLSL 3D simplex noise ──
		const noiseGLSL = /* glsl */ `
			vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
			vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
			vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
			vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

			float snoise(vec3 v) {
				const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
				const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
				vec3 i = floor(v + dot(v, C.yyy));
				vec3 x0 = v - i + dot(i, C.xxx);
				vec3 g = step(x0.yzx, x0.xyz);
				vec3 l = 1.0 - g;
				vec3 i1 = min(g.xyz, l.zxy);
				vec3 i2 = max(g.xyz, l.zxy);
				vec3 x1 = x0 - i1 + C.xxx;
				vec3 x2 = x0 - i2 + C.yyy;
				vec3 x3 = x0 - D.yyy;
				i = mod289(i);
				vec4 p = permute(permute(permute(
					i.z + vec4(0.0, i1.z, i2.z, 1.0))
					+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
					+ i.x + vec4(0.0, i1.x, i2.x, 1.0));
				float n_ = 0.142857142857;
				vec3 ns = n_ * D.wyz - D.xzx;
				vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
				vec4 x_ = floor(j * ns.z);
				vec4 y_ = floor(j - 7.0 * x_);
				vec4 x = x_ * ns.x + ns.yyyy;
				vec4 y = y_ * ns.x + ns.yyyy;
				vec4 h = 1.0 - abs(x) - abs(y);
				vec4 b0 = vec4(x.xy, y.xy);
				vec4 b1 = vec4(x.zw, y.zw);
				vec4 s0 = floor(b0) * 2.0 + 1.0;
				vec4 s1 = floor(b1) * 2.0 + 1.0;
				vec4 sh = -step(h, vec4(0.0));
				vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
				vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
				vec3 p0 = vec3(a0.xy, h.x);
				vec3 p1 = vec3(a0.zw, h.y);
				vec3 p2 = vec3(a1.xy, h.z);
				vec3 p3 = vec3(a1.zw, h.w);
				vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
				p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
				vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
				m = m * m;
				return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
			}
		`;

		// ── Annotation system ──
		// Two label types: callout annotations + dimension measurement
		// ── Annotation anchor config ──
		// yRange: [start, end] — vertical slice of the model to sample (0=top, 1=bottom)
		// xTarget: -1 = leftmost edge of model, +1 = rightmost edge, 0 = centre
		const calloutDefs = [
			{ frontAnchor: null, frontNormal: null, backAnchor: null, backNormal: null, yRange: [0.0,  0.05], xTarget:  0.3, offset: [80,  0],  align: 'left',  title: 'LITHOLOGY',   id: 'A', delay: 0.5 },
			{ frontAnchor: null, frontNormal: null, backAnchor: null, backNormal: null, yRange: [0.6, 0.65], xTarget: 0.5, offset: [-80, 4],  align: 'right', title: 'MORPHOMETRY', id: 'B', delay: 0.9 },
			{ frontAnchor: null, frontNormal: null, backAnchor: null, backNormal: null, yRange: [0.75, 0.8],  xTarget:  -0.9, offset: [80, 0], align: 'left',  title: '3D SURFACE',  id: 'C', delay: 1.3 },
		];
		const dimDef = { top: null, bottom: null };
		let modelLoadedAt = 0;
		let meshVertexCount = 0;
		let meshFaceCount = 0;

		// DOM refs
		const calloutEls = [];
		const calloutContentEls = [];
		const occlusionSmooth = [0, 0, 0];
		let svgEl = null;
		const crosshairGroups = [];
		const leaderPaths = [];
		let dimGroup = null;
		let dimLine = null;
		let dimTickStart = null;
		let dimTickEnd = null;
		let dimLabel = null;

		function createAnnotations() {
			if (!labelsLayer) return;

			const svgNS = 'http://www.w3.org/2000/svg';
			svgEl = document.createElementNS(svgNS, 'svg');
			svgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
			labelsLayer.appendChild(svgEl);

			// ── Callout annotations ──
			for (let i = 0; i < calloutDefs.length; i++) {
				const def = calloutDefs[i];

				// Crosshair marker group
				const g = document.createElementNS(svgNS, 'g');
				g.setAttribute('opacity', '0');

				const ring = document.createElementNS(svgNS, 'circle');
				ring.setAttribute('r', '6');
				ring.setAttribute('fill', 'none');
				ring.setAttribute('stroke', 'rgba(90,80,70,0.25)');
				ring.setAttribute('stroke-width', '0.5');
				g.appendChild(ring);

				for (const [x1, y1, x2, y2] of [[-8,0,-3,0],[3,0,8,0],[0,-8,0,-3],[0,3,0,8]]) {
					const l = document.createElementNS(svgNS, 'line');
					l.setAttribute('x1', x1); l.setAttribute('y1', y1);
					l.setAttribute('x2', x2); l.setAttribute('y2', y2);
					l.setAttribute('stroke', 'rgba(90,80,70,0.3)');
					l.setAttribute('stroke-width', '0.75');
					g.appendChild(l);
				}

				const dot = document.createElementNS(svgNS, 'circle');
				dot.setAttribute('r', '1.5');
				dot.setAttribute('fill', 'rgba(90,80,70,0.4)');
				g.appendChild(dot);

				const pulse = document.createElementNS(svgNS, 'circle');
				pulse.setAttribute('r', '6');
				pulse.setAttribute('fill', 'none');
				pulse.setAttribute('stroke', 'rgba(90,80,70,0.12)');
				pulse.setAttribute('stroke-width', '0.75');
				pulse.style.cssText = `animation:label-pulse 3s ease-in-out ${0.5 + i * 0.5}s infinite;transform-origin:center;`;
				g.appendChild(pulse);

				svgEl.appendChild(g);
				crosshairGroups.push(g);

				// Elbow leader line
				const path = document.createElementNS(svgNS, 'path');
				path.setAttribute('fill', 'none');
				path.setAttribute('stroke', 'rgba(90,80,70,0.15)');
				path.setAttribute('stroke-width', '0.75');
				path.setAttribute('stroke-dasharray', '4,2');
				svgEl.appendChild(path);
				leaderPaths.push(path);

				// Label element
				const el = document.createElement('div');
				el.className = 'callout-label';
				if (def.align === 'right') el.style.textAlign = 'right';

				const header = document.createElement('div');
				header.className = 'callout-header';
				if (def.align === 'right') {
					header.style.flexDirection = 'row-reverse';
				}
				const idBadge = document.createElement('span');
				idBadge.className = 'callout-id';
				idBadge.textContent = def.id;
				header.appendChild(idBadge);
				const titleEl = document.createElement('span');
				titleEl.className = 'callout-title';
				titleEl.textContent = def.title;
				header.appendChild(titleEl);
				el.appendChild(header);

				const contentEl = document.createElement('div');
				contentEl.className = 'callout-content';
				el.appendChild(contentEl);
				calloutContentEls.push(contentEl);

				labelsLayer.appendChild(el);
				calloutEls.push(el);
			}

			// ── Dimension line ──
			dimGroup = document.createElementNS(svgNS, 'g');
			dimGroup.setAttribute('opacity', '0');

			dimLine = document.createElementNS(svgNS, 'line');
			dimLine.setAttribute('stroke', 'rgba(90,80,70,0.2)');
			dimLine.setAttribute('stroke-width', '0.75');
			dimGroup.appendChild(dimLine);

			dimTickStart = document.createElementNS(svgNS, 'line');
			dimTickStart.setAttribute('stroke', 'rgba(90,80,70,0.25)');
			dimTickStart.setAttribute('stroke-width', '0.75');
			dimGroup.appendChild(dimTickStart);

			dimTickEnd = document.createElementNS(svgNS, 'line');
			dimTickEnd.setAttribute('stroke', 'rgba(90,80,70,0.25)');
			dimTickEnd.setAttribute('stroke-width', '0.75');
			dimGroup.appendChild(dimTickEnd);

			svgEl.appendChild(dimGroup);

			dimLabel = document.createElement('div');
			dimLabel.className = 'dim-label';
			labelsLayer.appendChild(dimLabel);

			// ── Specimen legend (desktop only) ──
			if (!isMobile) {
				const legend = document.createElement('div');
				legend.className = 'specimen-legend';
				legend.innerHTML = `
					<div class="legend-header">SPECIMEN</div>
					<div class="legend-id">AHA–FH–001</div>
					<div class="legend-row">Acheulean handaxe</div>
					<div class="legend-row legend-sub">Brak Kloof, South Africa</div>
					<div class="legend-row legend-sub">~500ka BP · 19×19 cm</div>
					<div class="legend-divider"></div>
					<div class="legend-item"><span class="legend-swatch swatch-surface"></span>Surface mesh</div>
					<div class="legend-item"><span class="legend-swatch swatch-wire"></span>Wireframe overlay</div>
				`;
				labelsLayer.appendChild(legend);
			}
		}
		createAnnotations();

		function populateCalloutContent() {
			if (calloutContentEls.length < 3) return;

			// A — LITHOLOGY
			const c0 = calloutContentEls[0];
			c0.innerHTML = '';
			for (const [label, value] of [['material', 'quartz sandstone'], ['grain', 'fine-grained']]) {
				const row = document.createElement('div');
				row.className = 'callout-row';
				row.innerHTML = `<span class="row-label">${label}</span><span class="row-value">${value}</span>`;
				c0.appendChild(row);
			}

			// B — MORPHOMETRY
			const c1 = calloutContentEls[1];
			c1.innerHTML = '';
			const r1a = document.createElement('div');
			r1a.className = 'callout-row';
			r1a.innerHTML = `<span class="row-label">vertices</span><span class="row-value" data-counter="${meshVertexCount}">0</span>`;
			c1.appendChild(r1a);
			const r1b = document.createElement('div');
			r1b.className = 'callout-row';
			r1b.innerHTML = `<span class="row-label">faces</span><span class="row-value" data-counter="${meshFaceCount}">0</span>`;
			c1.appendChild(r1b);
			const r1c = document.createElement('div');
			r1c.className = 'callout-row';
			r1c.innerHTML = `<span class="row-label">symmetry</span><span class="row-value">0.84</span>`;
			c1.appendChild(r1c);

			// C — SURFACE
			const c2 = calloutContentEls[2];
			c2.innerHTML = '';
			for (const [label, value] of [['roughness', '0.952'], ['metalness', '0.020'], ['albedo', 'mapped']]) {
				const row = document.createElement('div');
				row.className = 'callout-row';
				row.innerHTML = `<span class="row-label">${label}</span><span class="row-value">${value}</span>`;
				c2.appendChild(row);
			}
		}

		// Pick anchors per calloutDef using its yRange and xBias
		function pickSurfaceAnchors(model) {
			const allVerts = [];
			model.updateMatrixWorld(true);

			model.traverse((child) => {
				if (!child.isMesh) return;
				const pos = child.geometry.attributes.position;
				const nrmAttr = child.geometry.attributes.normal;
				const wm = child.matrixWorld;
				const pivotInv = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
				const combined = new THREE.Matrix4().multiplyMatrices(pivotInv, wm);
				const normalMat = new THREE.Matrix3().getNormalMatrix(combined);

				for (let j = 0; j < pos.count; j += 3) {
					const v = new THREE.Vector3(pos.getX(j), pos.getY(j), pos.getZ(j));
					v.applyMatrix4(combined);
					let n = new THREE.Vector3(0, 0, 1);
					if (nrmAttr) {
						n = new THREE.Vector3(nrmAttr.getX(j), nrmAttr.getY(j), nrmAttr.getZ(j));
						n.applyMatrix3(normalMat).normalize();
					}
					allVerts.push({ pos: v, normal: n });
				}
			});

			if (allVerts.length < 3) return;

			// Compute model X extents so xTarget can be mapped precisely
			let xMin = Infinity, xMax = -Infinity;
			for (const v of allVerts) {
				if (v.pos.x < xMin) xMin = v.pos.x;
				if (v.pos.x > xMax) xMax = v.pos.x;
			}
			const xMid = (xMin + xMax) / 2;
			const xHalf = (xMax - xMin) / 2;

			// Split into front-facing (+z) and back-facing (-z) pools, each sorted top→bottom
			const front = allVerts.filter(v => v.normal.z > 0.1).sort((a, b) => b.pos.y - a.pos.y);
			const back  = allVerts.filter(v => v.normal.z < -0.1).sort((a, b) => b.pos.y - a.pos.y);

			// Pick the surface vertex in the yRange slice whose X is closest to xTarget.
			// xTarget is -1…+1 where -1 = leftmost model edge, +1 = rightmost model edge.
			function pickOne(pool, yStart, yEnd, xTarget) {
				if (pool.length < 1) return null;
				const s = Math.floor(pool.length * yStart);
				const e = Math.max(s + 1, Math.floor(pool.length * yEnd));
				const slice = pool.slice(s, e);
				const targetX = xMid + xTarget * xHalf;
				let best = slice[0];
				let bestDist = Infinity;
				for (const v of slice) {
					const d = Math.abs(v.pos.x - targetX);
					if (d < bestDist) { bestDist = d; best = v; }
				}
				return best;
			}

			for (const def of calloutDefs) {
				const [yStart, yEnd] = def.yRange;
				const xTarget = def.xTarget ?? 0;
				const fp = pickOne(front, yStart, yEnd, xTarget);
				const bp = pickOne(back,  yStart, yEnd, xTarget);
				if (fp) { def.frontAnchor = fp.pos.clone(); def.frontNormal = fp.normal.clone(); }
				if (bp) { def.backAnchor  = bp.pos.clone(); def.backNormal  = bp.normal.clone(); }
			}

			// Dimension line: extreme top and bottom vertices
			allVerts.sort((a, b) => b.pos.y - a.pos.y);
			dimDef.top = allVerts[0].pos.clone();
			dimDef.bottom = allVerts[allVerts.length - 1].pos.clone();
		}

		const loader = new GLTFLoader();
		// Load full model for solid mesh + materials
		loader.load('/acheulean_hand_axe_lo.glb', (gltf) => {
			const model = gltf.scene;

			model.scale.setScalar(1);
			model.rotation.z = Math.PI;
			model.rotation.y = -Math.PI * 0.1;
			const box = new THREE.Box3().setFromObject(model);
			const size = box.getSize(new THREE.Vector3());
			const maxDim = Math.max(size.x, size.y, size.z);
			const scale = (isMobile ? 2.2 : 2.0) / maxDim;
			model.scale.setScalar(scale);

			const box2 = new THREE.Box3().setFromObject(model);
			const center = box2.getCenter(new THREE.Vector3());
			model.position.sub(center);

			model.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
					meshesForRaycast.push(child);

					const geo = child.geometry;
					meshVertexCount += geo.attributes.position.count;
					meshFaceCount += geo.index
						? geo.index.count / 3
						: geo.attributes.position.count / 3;

					const mats = Array.isArray(child.material) ? child.material : [child.material];
					for (const mat of mats) {
						if ('flatShading' in mat) mat.flatShading = true;
						if ('roughness' in mat) mat.roughness = Math.max(mat.roughness ?? 0, 0.95);
						if ('metalness' in mat) mat.metalness = Math.min(mat.metalness ?? 0, 0.02);
						if ('envMapIntensity' in mat) mat.envMapIntensity = 0.15;
						if (mat.color) originalColors.set(mat, mat.color.clone());
						mat.side = THREE.DoubleSide;

						mat.onBeforeCompile = (shader) => {
							shader.uniforms.uHitPoint = uHitPoint;
							shader.uniforms.uHitActive = uHitActive;
							shader.uniforms.uRadius = uRadius;

							shader.vertexShader = shader.vertexShader.replace(
								'#include <common>',
								'#include <common>\nvarying vec3 vWPos;'
							);
							shader.vertexShader = shader.vertexShader.replace(
								'#include <worldpos_vertex>',
								'#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
							);

							shader.fragmentShader = shader.fragmentShader.replace(
								'#include <common>',
								'#include <common>\nvarying vec3 vWPos;\nuniform vec3 uHitPoint;\nuniform float uHitActive;\nuniform float uRadius;\n' + noiseGLSL
							);
							shader.fragmentShader = shader.fragmentShader.replace(
								'#include <dithering_fragment>',
								`#include <dithering_fragment>

							float dist = distance(vWPos, uHitPoint);
							float r = (uRadius) * uHitActive;

							// Hard clip — no smoothstep on the hole itself
							if (r > 0.001 && dist < r) discard;

							// Darken backfaces (inner surfaces)
							if (!gl_FrontFacing) {
								gl_FragColor.rgb *= 0.18;
							}

							// Thin shadow rim, very tight
							float rim = step(r, dist) * (1.0 - step(r + 0.004, dist)) * uHitActive;
							gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.3, 0.3, 0.3), rim * 0.3);
							`
							);
						};
						mat.needsUpdate = true;
					}
				}
			});

			meshFaceCount = Math.round(meshFaceCount);

			// Add model to pivot first so world matrices are correct
			pivot.add(model);
			pivot.updateMatrixWorld(true);

			// Now pick real surface vertices as anchors
			pickSurfaceAnchors(model);
			populateCalloutContent();
			modelLoadedAt = performance.now();

			// Build wireframe overlay from the already-loaded geometry
			if (!isMobile) {
				model.traverse((child) => {
					if (!child.isMesh) return;
					const wireGeo = new THREE.WireframeGeometry(child.geometry);
					const wireMat = new THREE.LineBasicMaterial({
						color: 0x5f6873,
						transparent: true,
						opacity: 0.28,
						depthTest: true,
					});
					const wireLines = new THREE.LineSegments(wireGeo, wireMat);
					wireLines.position.copy(child.position);
					wireLines.rotation.copy(child.rotation);
					wireLines.scale.copy(child.scale);
					if (child.parent) child.parent.add(wireLines);
					else model.add(wireLines);
					overlayObjects.push(wireLines);
				});
			}
		});

		// ── Raycasting ──
		const raycaster = new THREE.Raycaster();
		const ndcMouse = new THREE.Vector2();
		let mouseX = 0,
			mouseY = 0;
		let mouseInside = false;
		let hitActiveSmooth = 0;
		let hitPointSmooth = new THREE.Vector3(999, 999, 999);
		let revealCurrent = 0;
		// Smoothed mouse influence — lerps toward cursor when inside, back to 0 when outside
		let mouseXSmooth = 0;
		let mouseYSmooth = 0;
		let scrollRotationSmooth = 0;
		let displayVertices = 0;
		let displayFaces = 0;

		function resize() {
			const { width, height } = container.getBoundingClientRect();
			if (!width || !height) return;
			const cw = width + BLEED * 2;
			const ch = height + BLEED * 2;
			renderer.setSize(cw, ch);
			// Keep the original container aspect so framing is unchanged.
			// setViewOffset renders the scene as if the container window is centered
			// in the larger canvas, giving clean overflow without repositioning.
			camera.aspect = width / height;
			camera.setViewOffset(cw, ch, BLEED, BLEED, width, height);
			camera.updateProjectionMatrix();
		}
		resize();

		const ro = new ResizeObserver(() => resize());
		ro.observe(container);

		function onMouse(e) {
			const rect = container.getBoundingClientRect();
			// Offset mouse into the bleed-expanded canvas coordinate space
			const canvasW = rect.width + BLEED * 2;
			const canvasH = rect.height + BLEED * 2;
			mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
			mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
			const ndcX = ((e.clientX - rect.left + BLEED) / canvasW - 0.5) * 2;
			const ndcY = -((e.clientY - rect.top + BLEED) / canvasH - 0.5) * 2;
			ndcMouse.set(ndcX, ndcY);
			mouseInside = true;
		}

		function onMouseLeave() {
			mouseInside = false;
		}

		if (!isMobile) {
			container.addEventListener('mousemove', onMouse, { passive: true });
			container.addEventListener('mouseleave', onMouseLeave, { passive: true });
		}

		// 3D to screen projection
		const _proj = new THREE.Vector3();
		const _nrmWorld = new THREE.Vector3();
		const _viewDir = new THREE.Vector3();
		const _pivotNormalMat = new THREE.Matrix3();

		function projectToScreen(point3D, w, h) {
			_proj.copy(point3D);
			pivot.localToWorld(_proj);
			_proj.project(camera);
			return {
				x: (_proj.x * 0.5 + 0.5) * w,
				y: (-_proj.y * 0.5 + 0.5) * h,
				z: _proj.z,
			};
		}

		// How much a surface normal faces the camera (>0 = visible)
		function facingDot(anchorPivotLocal, normalPivotLocal) {
			_pivotNormalMat.getNormalMatrix(pivot.matrixWorld);
			_nrmWorld.copy(normalPivotLocal).applyMatrix3(_pivotNormalMat).normalize();
			_proj.copy(anchorPivotLocal);
			pivot.localToWorld(_proj);
			_viewDir.subVectors(camera.position, _proj).normalize();
			return _nrmWorld.dot(_viewDir);
		}

		let frame;
		function animate(time) {
			const t = time * 0.001;

			const rect = container.getBoundingClientRect();
			const vw = window.innerWidth;
			// 0 when right edge first touches viewport, 1 when left edge fully exits viewport.
			const progressRaw = Math.max(0, Math.min(1, (vw - rect.left) / (vw + rect.width)));
			const scrollRotationTarget = progressRaw * Math.PI * 1.5;
			scrollRotationSmooth += (scrollRotationTarget - scrollRotationSmooth) * 0.2;

			pivot.rotation.y = scrollRotationSmooth;
			pivot.rotation.x = 0;

			if (!isMobile) {
				const mouseTargetX = mouseInside ? mouseX : 0;
				const mouseTargetY = mouseInside ? mouseY : 0;
				mouseXSmooth += (mouseTargetX - mouseXSmooth) * 0.06;
				mouseYSmooth += (mouseTargetY - mouseYSmooth) * 0.06;
				pivot.rotation.x += mouseYSmooth * 0.1;
				pivot.rotation.z = mouseXSmooth * -0.05;
			}

			// Cursor raycast
			let hitTarget = 0;
			if (mouseInside && meshesForRaycast.length > 0) {
				raycaster.setFromCamera(ndcMouse, camera);
				const hits = raycaster.intersectObjects(meshesForRaycast, false);
				if (hits.length > 0) {
					hitPointSmooth.lerp(hits[0].point, 0.15);
					hitTarget = 1;
				}
			}

			hitActiveSmooth += (hitTarget - hitActiveSmooth) * 0.08;
			if (hitActiveSmooth < 0.001) hitActiveSmooth = 0;

			uHitPoint.value.copy(hitPointSmooth);
			uHitActive.value = hitActiveSmooth;

			// Reveal darkening
			revealCurrent += (revealTarget - revealCurrent) * 0.06;
			const brightness = 1.0 - revealCurrent * 0.6;
			pivot.traverse((child) => {
				if (child.isMesh) {
					const mats = Array.isArray(child.material) ? child.material : [child.material];
					for (const mat of mats) {
						const orig = originalColors.get(mat);
						if (orig) mat.color.setRGB(orig.r * brightness, orig.g * brightness, orig.b * brightness);
					}
				}
			});

			// ── Update annotations ──
			if (modelLoadedAt > 0) {
				const cw = rect.width;
				const ch = rect.height;
				const timeSinceLoad = (performance.now() - modelLoadedAt) / 1000;

				// Animated counters
				displayVertices += (meshVertexCount - displayVertices) * 0.04;
				displayFaces += (meshFaceCount - displayFaces) * 0.04;

				const counterSpans = labelsLayer.querySelectorAll('[data-counter]');
				if (counterSpans.length >= 2) {
					counterSpans[0].textContent = Math.round(displayVertices).toLocaleString();
					counterSpans[1].textContent = Math.round(displayFaces).toLocaleString();
				}

				// ── Callout labels ──
				for (let i = 0; i < calloutDefs.length; i++) {
					const def = calloutDefs[i];
					const anchor = def.backAnchor || def.frontAnchor;
					if (!anchor) continue;

					const screen = projectToScreen(anchor, cw, ch);
					const fadeIn = Math.min(1, Math.max(0, (timeSinceLoad - def.delay) / 0.6));

					const onScreen = screen.z < 1 && screen.x > -50 && screen.x < cw + 50;
					const alpha = onScreen ? fadeIn : 0;

					const lx = screen.x + def.offset[0];
					const ly = screen.y + def.offset[1];

					// Crosshair
					crosshairGroups[i].setAttribute('transform', `translate(${screen.x},${screen.y})`);
					crosshairGroups[i].setAttribute('opacity', alpha);

					// Elbow leader: vertical then horizontal so it connects directly into the badge
					leaderPaths[i].setAttribute('d', `M${screen.x},${screen.y} L${screen.x},${ly} L${lx},${ly}`);
					leaderPaths[i].setAttribute('opacity', alpha);

					// Label translated vertically by -8px so ly exactly intersects the 16px badge center
					calloutEls[i].style.opacity = alpha;
					calloutEls[i].style.transform = `translate(${lx}px, ${ly}px) translate(${def.align === 'right' ? '-100%' : '0'}, -8px)`;
				}

				// ── Dimension line ──
				if (dimDef.top && dimDef.bottom) {
					const dimFadeIn = Math.min(1, Math.max(0, (timeSinceLoad - 1.8) / 0.8));
					const screenTop = projectToScreen(dimDef.top, cw, ch);
					const screenBot = projectToScreen(dimDef.bottom, cw, ch);

					const dimOffset = -56;
					const dx = Math.min(screenTop.x, screenBot.x) + dimOffset;
					const tickLen = 8;

					dimLine.setAttribute('x1', dx);
					dimLine.setAttribute('y1', screenTop.y);
					dimLine.setAttribute('x2', dx);
					dimLine.setAttribute('y2', screenBot.y);

					dimTickStart.setAttribute('x1', dx);
					dimTickStart.setAttribute('y1', screenTop.y);
					dimTickStart.setAttribute('x2', dx + tickLen);
					dimTickStart.setAttribute('y2', screenTop.y);

					dimTickEnd.setAttribute('x1', dx);
					dimTickEnd.setAttribute('y1', screenBot.y);
					dimTickEnd.setAttribute('x2', dx + tickLen);
					dimTickEnd.setAttribute('y2', screenBot.y);

					dimGroup.setAttribute('opacity', dimFadeIn);

					const midY = (screenTop.y + screenBot.y) / 2;
					dimLabel.style.opacity = dimFadeIn;
					dimLabel.textContent = '18.9 cm';
					dimLabel.style.transform = `translate(${dx - 6}px, ${midY}px) translate(-100%, -50%) rotate(-90deg)`;
				}
			}

			renderer.render(scene, camera);
			frame = requestAnimationFrame(animate);
		}
		frame = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(frame);
			ro.disconnect();
			overlayObjects.forEach((obj) => {
				if (obj.parent) obj.parent.remove(obj);
				obj.geometry?.dispose?.();
				obj.material?.dispose?.();
			});
			if (!isMobile) {
				container.removeEventListener('mousemove', onMouse);
				container.removeEventListener('mouseleave', onMouseLeave);
			}
			renderer.dispose();
		};
	});
</script>

<div class="scene3d" bind:this={container} role="img" aria-label="3D rock model">
	<div class="labels-layer" bind:this={labelsLayer}></div>
	<noscript>
		<p>3D rock visualization</p>
	</noscript>
</div>

<style>
	.scene3d {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: visible;
		background: transparent;
	}

	.labels-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		overflow: visible;
	}

	/* ── Callout labels ── */
	.labels-layer :global(.callout-label) {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		opacity: 0;
		will-change: transform, opacity;
		transition: opacity 0.5s ease;
		font-family: 'Space Mono', monospace;
	}

	.labels-layer :global(.callout-header) {
		display: flex;
		align-items: center;
		gap: 5px;
		margin-bottom: 4px;
	}

	.labels-layer :global(.callout-id) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border: 0.75px solid rgba(90, 80, 70, 0.25);
		border-radius: 2px;
		font-size: 0.5rem;
		color: rgba(80, 72, 65, 0.5);
		letter-spacing: 0;
		flex-shrink: 0;
	}

	.labels-layer :global(.callout-title) {
		font-size: 0.55rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: rgba(80, 72, 65, 0.4);
		white-space: nowrap;
	}

	.labels-layer :global(.callout-content) {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-left: 21px;
	}

	.labels-layer :global(.callout-row) {
		font-size: 0.6rem;
		color: rgba(60, 55, 48, 0.6);
		white-space: nowrap;
		letter-spacing: 0.02em;
		display: flex;
		gap: 6px;
	}

	.labels-layer :global(.row-label) {
		color: rgba(60, 55, 48, 0.35);
	}

	.labels-layer :global(.row-value) {
		color: rgba(60, 55, 48, 0.7);
		font-variant-numeric: tabular-nums;
	}

	/* ── Dimension label ── */
	.labels-layer :global(.dim-label) {
		position: absolute;
		pointer-events: none;
		opacity: 0;
		will-change: transform, opacity;
		transition: opacity 0.5s ease;
		font-family: 'Space Mono', monospace;
		font-size: 0.55rem;
		letter-spacing: 0.15em;
		color: rgba(80, 72, 65, 0.4);
		white-space: nowrap;
	}

	/* ── Specimen legend ── */
	.labels-layer :global(.specimen-legend) {
		position: absolute;
		bottom: 0;
		left: 0;
		font-family: 'Space Mono', monospace;
		border: 0.75px solid rgba(90, 80, 70, 0.12);
		border-radius: 3px;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(2px);
	}

	.labels-layer :global(.legend-header) {
		font-size: 0.48rem;
		text-transform: uppercase;
		letter-spacing: 0.25em;
		color: rgba(80, 72, 65, 0.35);
		margin-bottom: 4px;
	}

	.labels-layer :global(.legend-id) {
		font-size: 0.62rem;
		color: rgba(60, 55, 48, 0.65);
		letter-spacing: 0.06em;
		margin-bottom: 2px;
	}

	.labels-layer :global(.legend-row) {
		font-size: 0.52rem;
		color: rgba(60, 55, 48, 0.45);
		letter-spacing: 0.02em;
		line-height: 1.5;
	}

	.labels-layer :global(.legend-sub) {
		color: rgba(60, 55, 48, 0.3);
	}

	.labels-layer :global(.legend-divider) {
		height: 0;
		border-top: 0.5px solid rgba(90, 80, 70, 0.1);
		margin: 5px 0;
	}

	.labels-layer :global(.legend-item) {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.5rem;
		color: rgba(60, 55, 48, 0.38);
		letter-spacing: 0.02em;
		line-height: 1.6;
	}

	.labels-layer :global(.legend-swatch) {
		display: inline-block;
		width: 10px;
		height: 3px;
		border-radius: 1px;
	}

	.labels-layer :global(.swatch-surface) {
		background: rgba(160, 148, 132, 0.5);
	}

	.labels-layer :global(.swatch-wire) {
		background: transparent;
		border: 0.75px dashed rgba(95, 104, 115, 0.45);
		height: 0;
	}

	@keyframes -global-label-pulse {
		0%, 100% { r: 6; opacity: 0.12; }
		50% { r: 11; opacity: 0; }
	}
</style>
