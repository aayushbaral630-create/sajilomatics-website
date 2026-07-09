/* SAJILOMATICS — morphing particle hero (Three.js)
   The brand infinity morphs as you scroll the page:
   ∞ infinity → sphere → torus knot → back to ∞
   Scroll-scrubbed, cursor parallax, cyan→violet spectrum.
   Degrades gracefully (reduced motion / no WebGL). */
(function () {
  'use strict';
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { canvas.remove(); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); return; }

  const DPR = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.z = 7.5;

  const isMobile = innerWidth < 760;
  const COUNT = isMobile ? 6000 : 12000;

  /* ---------- morph target shapes ---------- */
  function makeShapes(n) {
    const inf = new Float32Array(n * 3);
    const sph = new Float32Array(n * 3);
    const knot = new Float32Array(n * 3);
    const GA = 2.399963229728653; // golden angle

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      // — infinity (lemniscate + tube scatter)
      const t = (i / n) * Math.PI * 2;
      const d = 1 + Math.sin(t) * Math.sin(t);
      const r = Math.pow(Math.random(), 2.2) * 0.42;
      const a = Math.random() * Math.PI * 2;
      inf[i3]     = (3.1 * Math.cos(t)) / d + Math.cos(a) * r;
      inf[i3 + 1] = (3.1 * Math.sin(t) * Math.cos(t)) / d * 1.15 + Math.sin(a) * r;
      inf[i3 + 2] = (Math.random() - 0.5) * 0.55;

      // — fibonacci sphere
      const y = 1 - (2 * i) / (n - 1);
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const th = i * GA;
      const R = 2.55 + (Math.random() - 0.5) * 0.22;
      sph[i3]     = Math.cos(th) * rad * R;
      sph[i3 + 1] = y * R;
      sph[i3 + 2] = Math.sin(th) * rad * R;

      // — torus knot (p=2, q=3)
      const kt = (i / n) * Math.PI * 2;
      const p = 2, q = 3;
      const kr = 0.14 * Math.pow(Math.random(), 1.6);
      const ka = Math.random() * Math.PI * 2;
      const core = 2 + Math.cos(q * kt);
      knot[i3]     = (core * Math.cos(p * kt)) * 1.02 + Math.cos(ka) * kr;
      knot[i3 + 1] = (core * Math.sin(p * kt)) * 1.02 + Math.sin(ka) * kr;
      knot[i3 + 2] = Math.sin(q * kt) * 1.15 + (Math.random() - 0.5) * 0.2;
    }
    return [inf, sph, knot, inf]; // journey: ∞ → sphere → knot → ∞
  }
  const SHAPES = makeShapes(COUNT);

  /* ---------- geometry, colors ---------- */
  const positions = new Float32Array(SHAPES[0]); // start as infinity
  const colors = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const cyan = new THREE.Color('#35e0ff');
  const blue = new THREE.Color('#5b7cfa');
  const violet = new THREE.Color('#8b5cf6');
  const tmp = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    const m = i / COUNT;
    if (m < 0.5) tmp.copy(cyan).lerp(blue, m * 2);
    else tmp.copy(blue).lerp(violet, (m - 0.5) * 2);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    seeds[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: isMobile ? 0.028 : 0.022,
    vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* faint dust field */
  const DUST = isMobile ? 200 : 400;
  const dpos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST * 3; i++) dpos[i] = (Math.random() - 0.5) * 16;
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({
    size: 0.02, color: 0x5b7cfa, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(dust);

  /* ---------- interaction state ---------- */
  let mouseX = 0, mouseY = 0, tx = 0, ty = 0;
  addEventListener('mousemove', e => {
    mouseX = (e.clientX / innerWidth - 0.5) * 2;
    mouseY = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  /* ---------- scroll-scrubbed morphing ---------- */
  // keyframes across the page: 0 → ∞ | 0.38 → sphere | 0.72 → knot | 1 → ∞
  const KEYS = [0, 0.38, 0.72, 1];
  const smooth = x => x * x * (3 - 2 * x); // smoothstep

  let scrollP = 0, targetP = 0;
  function readScroll() {
    const h = document.documentElement;
    targetP = h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1);
  }
  addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  const pos = geo.attributes.position;
  let t0 = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000;

    // ease scroll for buttery morphs
    scrollP += (targetP - scrollP) * 0.06;

    // which two shapes are we between?
    let seg = 0;
    while (seg < KEYS.length - 2 && scrollP > KEYS[seg + 1]) seg++;
    const span = KEYS[seg + 1] - KEYS[seg];
    const mixT = smooth(Math.min(1, Math.max(0, (scrollP - KEYS[seg]) / span)));
    const A = SHAPES[seg], B = SHAPES[seg + 1];

    // morph + breathing
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3, s = seeds[i];
      pos.array[i3]     = A[i3]     + (B[i3]     - A[i3])     * mixT + Math.sin(t * 0.7 + s)       * 0.045;
      pos.array[i3 + 1] = A[i3 + 1] + (B[i3 + 1] - A[i3 + 1]) * mixT + Math.cos(t * 0.6 + s * 1.3) * 0.045;
      pos.array[i3 + 2] = A[i3 + 2] + (B[i3 + 2] - A[i3 + 2]) * mixT + Math.sin(t * 0.5 + s * 2.1) * 0.06;
    }
    pos.needsUpdate = true;

    // dim mid-journey so content stays readable, bright at both ends
    mat.opacity = 0.85 - 0.38 * Math.sin(scrollP * Math.PI);

    // rotation: gentle at rest, more momentum mid-morph
    tx += (mouseX - tx) * 0.03;
    ty += (mouseY - ty) * 0.03;
    const spin = 0.12 + scrollP * 0.5;
    points.rotation.y = Math.sin(t * spin) * 0.25 + tx * 0.3 + scrollP * 2.2;
    points.rotation.x = Math.cos(t * 0.1) * 0.1 - ty * 0.2 + scrollP * 0.5;
    points.rotation.z = Math.sin(t * 0.05) * 0.05;
    dust.rotation.y = t * 0.015;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();
