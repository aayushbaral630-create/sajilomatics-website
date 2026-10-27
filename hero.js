/* SAJILOMATICS — morphing particle hero (Three.js)
   The Sajilomatics S mark (sampled from logo-mark.png) morphs as you scroll:
   S mark → sphere → torus knot → back to the S mark
   Scroll-scrubbed, cursor parallax, cyan→blue brand gradient.
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
    const mark = new Float32Array(n * 3);   // fallback ∞ until the logo loads
    const sph = new Float32Array(n * 3);
    const knot = new Float32Array(n * 3);
    const GA = 2.399963229728653; // golden angle

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      // — fallback: lemniscate + tube scatter
      const t = (i / n) * Math.PI * 2;
      const d = 1 + Math.sin(t) * Math.sin(t);
      const r = Math.pow(Math.random(), 2.2) * 0.42;
      const a = Math.random() * Math.PI * 2;
      mark[i3]     = (3.1 * Math.cos(t)) / d + Math.cos(a) * r;
      mark[i3 + 1] = (3.1 * Math.sin(t) * Math.cos(t)) / d * 1.15 + Math.sin(a) * r;
      mark[i3 + 2] = (Math.random() - 0.5) * 0.55;

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
    return [mark, sph, knot, mark]; // journey: S → sphere → knot → S
  }
  const SHAPES = makeShapes(COUNT);

  /* ---------- geometry, colors ---------- */
  const positions = new Float32Array(SHAPES[0]);
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

  /* ---------- brand mark: sample the real logo into particles ----------
     Reads logo-mark.png, scatters particles across its strokes, and makes
     that the opening + closing shape (replaces the fallback in place). */
  (function useLogoShape() {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        const px = [];
        for (let y = 0; y < c.height; y += 1)
          for (let x = 0; x < c.width; x += 1)
            if (data[(y * c.width + x) * 4 + 3] > 140) px.push(x, y);
        const n = px.length / 2;
        if (n < 50) return;
        // tall mark: keep it ~55% of the visible height and, on desktop,
        // sit it in the open space right of the headline (centred on phones)
        const H = isMobile ? 3.2 : 3.6, s = H / c.height;
        const shiftX = isMobile ? 0 : Math.min(2.4, (innerWidth / innerHeight) * 1.25);
        const ox = c.width / 2, oy = c.height / 2;
        const target = SHAPES[0];                   // same array as SHAPES[3]
        const top = new THREE.Color('#45d2e0'), bot = new THREE.Color('#2f7fe0');
        for (let i = 0; i < COUNT; i++) {
          const k = (Math.random() * n) | 0;
          const x = px[k * 2] + (Math.random() - 0.5) * 1.6;
          const y = px[k * 2 + 1] + (Math.random() - 0.5) * 1.6;
          target[i * 3]     = (x - ox) * s + shiftX;
          target[i * 3 + 1] = -(y - oy) * s;
          target[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
          tmp.copy(top).lerp(bot, y / c.height);    // logo's own top→bottom gradient
          colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
        }
        geo.attributes.color.needsUpdate = true;
      } catch (e) { /* keep the fallback shape */ }
    };
    img.src = 'logo-mark.png';
  })();

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
  // keyframes across the page: 0 → S | 0.38 → sphere | 0.72 → knot | 1 → S
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
  const t0 = performance.now();

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
    let op = 0.85 - 0.38 * Math.sin(scrollP * Math.PI);
    // phones: text spans the full width, so particles sit further back once you leave the hero
    if (isMobile) op *= 1 - 0.55 * smooth(Math.min(1, scrollP / 0.06));
    // footer: fade out so contact details and links stay clean and readable
    op *= 1 - 0.85 * smooth(Math.min(1, Math.max(0, (scrollP - 0.9) / 0.1)));
    mat.opacity = op;

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
