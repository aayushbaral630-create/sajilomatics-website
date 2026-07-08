/* SAJILOMATICS — hero: 12,000-particle infinity (Three.js)
   Echoes the brand mark. Cyan → violet spectrum, mouse parallax,
   gentle breathing. Degrades gracefully (reduced motion / no WebGL). */
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
  const COUNT = isMobile ? 4500 : 12000;

  /* particles along a 3D lemniscate with soft tube scatter */
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const cyan = new THREE.Color('#35e0ff');
  const blue = new THREE.Color('#5b7cfa');
  const violet = new THREE.Color('#8b5cf6');
  const tmp = new THREE.Color();

  for (let i = 0; i < COUNT; i++) {
    const t = (i / COUNT) * Math.PI * 2;
    const d = 1 + Math.sin(t) * Math.sin(t);
    const x = (3.1 * Math.cos(t)) / d;
    const y = (3.1 * Math.sin(t) * Math.cos(t)) / d;
    // tube scatter
    const r = Math.pow(Math.random(), 2.2) * 0.42;
    const a = Math.random() * Math.PI * 2;
    positions[i * 3] = x + Math.cos(a) * r;
    positions[i * 3 + 1] = y * 1.15 + Math.sin(a) * r;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.55;
    // color along the curve: cyan → blue → violet
    const m = (Math.sin(t) + 1) / 2;
    if (m < 0.5) tmp.copy(cyan).lerp(blue, m * 2);
    else tmp.copy(blue).lerp(violet, (m - 0.5) * 2);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    seeds[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const base = positions.slice();

  const mat = new THREE.PointsMaterial({
    size: isMobile ? 0.028 : 0.022,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* faint dust field behind */
  const DUST = isMobile ? 150 : 400;
  const dpos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST * 3; i++) dpos[i] = (Math.random() - 0.5) * 16;
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({
    size: 0.02, color: 0x5b7cfa, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(dust);

  /* interaction state */
  let mouseX = 0, mouseY = 0, tx = 0, ty = 0;
  addEventListener('mousemove', e => {
    mouseX = (e.clientX / innerWidth - 0.5) * 2;
    mouseY = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  /* pause when offscreen or tab hidden */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  const pos = geo.attributes.position;
  let t0 = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000;

    // breathing displacement
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const i3 = i * 3;
      pos.array[i3]     = base[i3]     + Math.sin(t * 0.7 + s) * 0.045;
      pos.array[i3 + 1] = base[i3 + 1] + Math.cos(t * 0.6 + s * 1.3) * 0.045;
      pos.array[i3 + 2] = base[i3 + 2] + Math.sin(t * 0.5 + s * 2.1) * 0.06;
    }
    pos.needsUpdate = true;

    // eased mouse parallax + slow drift
    tx += (mouseX - tx) * 0.03;
    ty += (mouseY - ty) * 0.03;
    points.rotation.y = Math.sin(t * 0.12) * 0.22 + tx * 0.3;
    points.rotation.x = Math.cos(t * 0.1) * 0.1 - ty * 0.2;
    points.rotation.z = Math.sin(t * 0.05) * 0.05;
    dust.rotation.y = t * 0.015;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();
